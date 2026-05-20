import { GameEngine } from "./engine.js";
import { loadLocal, saveLocal } from "./storage.js";
import { clamp, uid, debounce } from "./util.js";
import { renderIcon } from "./icons.js";
import { audioManager } from "./audio.js";

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function rectOverlapRatio(r1, r2) {
  const x1 = Math.max(r1.left, r2.left);
  const y1 = Math.max(r1.top, r2.top);
  const x2 = Math.min(r1.right, r2.right);
  const y2 = Math.min(r1.bottom, r2.bottom);
  const w = x2 - x1;
  const h = y2 - y1;
  if (w <= 0 || h <= 0) return 0;
  const area = w * h;
  const minArea = Math.min(r1.width * r1.height, r2.width * r2.height);
  return area / minArea;
}

export function createGame(els) {
  const engine = new GameEngine();
  const board = els.board;

  /** @type {{id:string,name:string,x:number,y:number, el:HTMLDivElement}[]} */
  let items = [];
  let lastCombine = null; // { createdId }
  let hoverTargetId = null;
  let pendingLibraryFocusName = null;

  function clearHoverTarget() {
    if (!hoverTargetId) return;
    const t = items.find((x) => x.id === hoverTargetId);
    if (t) t.el.classList.remove("sticker--target");
    hoverTargetId = null;
  }

  function setHoverTarget(id) {
    if (hoverTargetId === id) return;
    clearHoverTarget();
    hoverTargetId = id;
    const t = items.find((x) => x.id === hoverTargetId);
    if (t) t.el.classList.add("sticker--target");
  }

  const showToast = (msg) => {
    els.toast.textContent = msg;
    els.toast.classList.add("toast--show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.remove("toast--show"), 1200);
  };

  const save = debounce(() => {
    const data = {
      v: 1,
      engine: engine.exportSave(),
      board: items.map((it) => ({ id: it.id, name: it.name, x: it.x, y: it.y })),
    };
    saveLocal(data);
  }, 250);

  function updateCounters() {
    const unlocked = engine.listUnlocked({ search: els.searchInput.value, sort: els.sortSelect.value });
    els.unlockedCount.textContent = String(engine.unlocked.size);
    els.totalCount.textContent = "∞";
    els.recipeCount.textContent = String(engine.getRecipeCount());
    els.itemCount.textContent = String(items.length);
    return unlocked;
  }

  function makeStickerDom(name) {
    const meta = engine.getMeta(name);
    const el = document.createElement("div");
    el.className = "sticker";
    el.dataset.name = name;
    el.innerHTML = `
      <div class="sticker__icon"></div>
      <div class="sticker__txt">
        <div class="sticker__name"></div>
        <div class="sticker__hint">拖到别的贴纸上</div>
      </div>
    `;
    el.querySelector(".sticker__name").textContent = name;
    const iconWrap = el.querySelector(".sticker__icon");
    iconWrap.append(renderIcon({ name, meta, size: 40 }));
    return el;
  }

  function spawnOnBoard(name, x, y) {
    const id = uid("st");
    const el = makeStickerDom(name);
    board.appendChild(el);

    const it = { id, name, x, y, el };
    items.push(it);
    positionItem(it);
    bindStickerDrag(it);
    updateCounters();
    save();
    
    audioManager.playPlace();
    return it;
  }

  function positionItem(it) {
    const bw = board.clientWidth;
    const bh = board.clientHeight;
    const w = it.el.offsetWidth || 148;
    const h = it.el.offsetHeight || 60;
    it.x = clamp(it.x, 6, bw - w - 6);
    it.y = clamp(it.y, 6, bh - h - 6);
    it.el.style.left = `${it.x}px`;
    it.el.style.top = `${it.y}px`;
  }

  function tryCombine(src, dst) {
    const res = engine.combine(src.name, dst.name);
    if (!res.ok) {
      showToast(res.reason === "没反应" ? "咕噜…好像没反应" : res.reason);
      audioManager.playError();
      return;
    }

    audioManager.playCombine();

    const prevA = { name: src.name, x: src.x, y: src.y };
    const prevB = { name: dst.name, x: dst.x, y: dst.y };
    const idxA = items.findIndex((x) => x.id === src.id);
    const idxB = items.findIndex((x) => x.id === dst.id);
    if (idxA >= 0) items[idxA].el.remove();
    if (idxB >= 0 && dst.id !== src.id) items[idxB].el.remove();
    const toRemove = [idxA, idxB].filter((i) => i >= 0).sort((a, b) => b - a);
    for (const i of toRemove) items.splice(i, 1);

    const cx = (src.x + dst.x) / 2 + 18;
    const cy = (src.y + dst.y) / 2 + 14;
    const created = spawnOnBoard(res.name, cx, cy);
    lastCombine = { createdId: created.id, prev: [prevA, prevB] };

    if (res.isNew) {
      showToast(`解锁：${res.name}！`);
      audioManager.playUnlock();
    } else {
      showToast(`得到：${res.name}`);
      audioManager.playSuccess();
    }
    if (res.isNew) {
      els.searchInput.value = "";
      els.sortSelect.value = "recent";
      pendingLibraryFocusName = res.name;
    }
    renderLibrary();
  }

  function bindStickerDrag(it) {
    const el = it.el;
    let dragging = false;
    let startX = 0,
      startY = 0,
      baseX = 0,
      baseY = 0;

    const onDown = (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      dragging = true;
      el.setPointerCapture(ev.pointerId);
      el.classList.add("sticker--dragging");
      startX = ev.clientX;
      startY = ev.clientY;
      baseX = it.x;
      baseY = it.y;
    };
    const onMove = (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      it.x = baseX + dx;
      it.y = baseY + dy;
      positionItem(it);

      // 拖动中：高亮“将要合成”的目标元素
      const r1 = el.getBoundingClientRect();
      let best = null;
      let bestScore = 0;
      for (const other of items) {
        if (other.id === it.id) continue;
        const r2 = other.el.getBoundingClientRect();
        const score = rectOverlapRatio(r1, r2);
        if (score > bestScore) {
          bestScore = score;
          best = other;
        }
      }
      if (best && bestScore >= 0.18) setHoverTarget(best.id);
      else clearHoverTarget();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("sticker--dragging");
      clearHoverTarget();

      // 检查与其他贴纸重叠
      const r1 = el.getBoundingClientRect();
      let best = null;
      let bestScore = 0;
      for (const other of items) {
        if (other.id === it.id) continue;
        const r2 = other.el.getBoundingClientRect();
        const score = rectOverlapRatio(r1, r2);
        if (score > bestScore) {
          bestScore = score;
          best = other;
        }
      }
      if (best && bestScore >= 0.22) {
        tryCombine(it, best);
      }
      updateCounters();
      save();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  }

  function makeLibItem(name) {
    const meta = engine.getMeta(name);
    const li = document.createElement("div");
    li.className = "libItem";
    li.dataset.name = name;
    li.innerHTML = `
      <div class="libItem__icon"></div>
      <div class="libItem__txt">
        <div class="libItem__name"></div>
        <div class="libItem__sub">
          <span class="tag">${meta.cat || "其他"}</span>
          <span class="tag">★${meta.rarity || 1}</span>
        </div>
      </div>
    `;
    li.querySelector(".libItem__name").textContent = name;
    li.querySelector(".libItem__icon").append(renderIcon({ name, meta, size: 38 }));

    // 从元素库拖到画布（兼容触控：用 pointer 自己实现）
    li.addEventListener("pointerdown", (ev) => beginLibraryDrag(ev, name));
    li.addEventListener("click", () => {
      // 点一下也能生成：更适合手机单手
      const br = board.getBoundingClientRect();
      const created = spawnOnBoard(name, br.width / 2 - 74, br.height / 2 - 30);
      showToast(`放置：${name}`);

      // 如果与画布元素相交，也触发合成
      const r1 = created.el.getBoundingClientRect();
      let best = null;
      let bestScore = 0;
      for (const other of items) {
        if (other.id === created.id) continue;
        const r2 = other.el.getBoundingClientRect();
        const score = rectOverlapRatio(r1, r2);
        if (score > bestScore) {
          bestScore = score;
          best = other;
        }
      }
      if (best && bestScore >= 0.22) tryCombine(created, best);
    });
    return li;
  }

  let ghost = null;
  let ghostName = "";
  let ghostOffset = { x: 0, y: 0 };

  function beginLibraryDrag(ev, name) {
    if (ev.button !== undefined && ev.button !== 0) return;
    ev.preventDefault();

    ghostName = name;
    const meta = engine.getMeta(name);
    ghost = document.createElement("div");
    ghost.className = "sticker sticker--dragging";
    ghost.style.position = "fixed";
    ghost.style.left = "-9999px";
    ghost.style.top = "-9999px";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "999";
    ghost.innerHTML = `
      <div class="sticker__icon"></div>
      <div class="sticker__txt">
        <div class="sticker__name"></div>
        <div class="sticker__hint">放到画布里</div>
      </div>
    `;
    ghost.querySelector(".sticker__name").textContent = name;
    ghost.querySelector(".sticker__icon").append(renderIcon({ name, meta, size: 40 }));
    document.body.appendChild(ghost);

    ghostOffset = { x: 74, y: 30 };
    moveGhost(ev.clientX, ev.clientY);

    window.addEventListener("pointermove", onLibMove, { passive: false });
    window.addEventListener("pointerup", onLibUp, { passive: false, once: true });
  }

  function moveGhost(clientX, clientY) {
    if (!ghost) return;
    ghost.style.left = `${clientX - ghostOffset.x}px`;
    ghost.style.top = `${clientY - ghostOffset.y}px`;
  }

  function onLibMove(ev) {
    ev.preventDefault();
    moveGhost(ev.clientX, ev.clientY);

    // 从元素库拖动时：高亮画布上将要合成的目标贴纸
    if (!ghost) return;
    const r1 = ghost.getBoundingClientRect();
    let best = null;
    let bestScore = 0;
    for (const other of items) {
      const r2 = other.el.getBoundingClientRect();
      const score = rectOverlapRatio(r1, r2);
      if (score > bestScore) {
        bestScore = score;
        best = other;
      }
    }
    if (best && bestScore >= 0.18) setHoverTarget(best.id);
    else clearHoverTarget();
  }

  function onLibUp(ev) {
    window.removeEventListener("pointermove", onLibMove);
    if (!ghost) return;

    const br = board.getBoundingClientRect();
    const inside =
      ev.clientX >= br.left && ev.clientX <= br.right && ev.clientY >= br.top && ev.clientY <= br.bottom;

    if (inside) {
      const x = ev.clientX - br.left - 74;
      const y = ev.clientY - br.top - 30;
      const created = spawnOnBoard(ghostName, x, y);
      showToast(`放置：${ghostName}`);

      // 如果与画布元素相交，也触发合成
      const r1 = created.el.getBoundingClientRect();
      let best = null;
      let bestScore = 0;
      for (const other of items) {
        if (other.id === created.id) continue;
        const r2 = other.el.getBoundingClientRect();
        const score = rectOverlapRatio(r1, r2);
        if (score > bestScore) {
          bestScore = score;
          best = other;
        }
      }
      if (best && bestScore >= 0.22) tryCombine(created, best);
    }

    clearHoverTarget();
    ghost.remove();
    ghost = null;
    ghostName = "";
  }

  function renderLibrary() {
    const list = engine.listUnlocked({ search: els.searchInput.value, sort: els.sortSelect.value });
    updateCounters();

    els.library.innerHTML = "";
    // 分帧渲染，防止一次性渲染上千条卡顿
    const chunk = 60;
    let idx = 0;
    const renderChunk = () => {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < chunk && idx < list.length; i++, idx++) frag.appendChild(makeLibItem(list[idx]));
      els.library.appendChild(frag);

      // 如果有“定位目标”，在它进入可视列表后滚动过去
      if (pendingLibraryFocusName) {
        const focusEl = Array.from(els.library.children).find((x) => x?.dataset?.name === pendingLibraryFocusName);
        if (focusEl) {
          focusEl.scrollIntoView({ block: "center", behavior: "smooth" });
          pendingLibraryFocusName = null;
        }
      }

      if (idx < list.length) requestAnimationFrame(renderChunk);
    };
    renderChunk();
  }

  function tidyBoard() {
    const bw = board.clientWidth;
    const pad = 10;
    const cellW = Math.max(148, ...items.map((it) => it.el.offsetWidth || 148));
    const cellH = Math.max(60, ...items.map((it) => it.el.offsetHeight || 60));
    const cols = Math.max(1, Math.floor((bw - pad * 2) / (cellW + 10)));
    items.forEach((it, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      it.x = pad + col * (cellW + 10);
      it.y = pad + row * (cellH + 10);
      positionItem(it);
    });
    save();
  }

  function clearBoard() {
    items.forEach((it) => it.el.remove());
    items = [];
    lastCombine = null;
    updateCounters();
    save();
  }

  function undo() {
    if (!lastCombine) {
      showToast("没有可撤销的合成");
      return;
    }
    const idx = items.findIndex((x) => x.id === lastCombine.createdId);
    if (idx >= 0) {
      items[idx].el.remove();
      items.splice(idx, 1);
      // 还原被消耗的两个元素
      if (Array.isArray(lastCombine.prev)) {
        for (const p of lastCombine.prev) {
          if (!p?.name) continue;
          spawnOnBoard(p.name, Number(p.x) || 20, Number(p.y) || 20);
        }
      }
      showToast("已撤销合成");
    }
    lastCombine = null;
    updateCounters();
    save();
  }

  function load() {
    const data = loadLocal();
    if (!data) return;
    if (data.v !== 1) return;
    if (data.engine) engine.importSave(data.engine);
    if (Array.isArray(data.board)) {
      for (const it of data.board) {
        if (!it || !it.name) continue;
        spawnOnBoard(it.name, Number(it.x) || 20, Number(it.y) || 20);
      }
    }
  }

  function bindTopbar() {
    els.btnUndo.addEventListener("click", undo);
    els.btnTidy.addEventListener("click", tidyBoard);
    els.btnClear.addEventListener("click", clearBoard);
    els.btnExport.addEventListener("click", () => {
      const payload = {
        v: 1,
        engine: engine.exportSave(),
        board: items.map((it) => ({ id: it.id, name: it.name, x: it.x, y: it.y })),
      };
      downloadJson(`萌萌合成_存档.json`, payload);
      showToast("已导出存档");
    });
    els.fileImport.addEventListener("change", async () => {
      const f = els.fileImport.files?.[0];
      if (!f) return;
      try {
        const text = await f.text();
        const obj = JSON.parse(text);
        if (!obj || obj.v !== 1) throw new Error("存档版本不支持");
        clearBoard();
        engine.importSave(obj.engine);
        if (Array.isArray(obj.board)) {
          for (const it of obj.board) spawnOnBoard(it.name, Number(it.x) || 20, Number(it.y) || 20);
        }
        renderLibrary();
        showToast("已导入存档");
        save();
      } catch (e) {
        showToast(`导入失败：${e?.message || "格式错误"}`);
      } finally {
        els.fileImport.value = "";
      }
    });
    els.btnMusic.addEventListener("click", () => {
      const isPlaying = audioManager.toggleBackgroundMusic();
      els.btnMusic.textContent = isPlaying ? "🔇" : "🎵";
      showToast(isPlaying ? "背景音乐已开启" : "背景音乐已关闭");
    });
    els.btnHelp.addEventListener("click", () => els.helpDialog.showModal());
  }

  function bindLibrarySearch() {
    els.searchInput.addEventListener("input", () => renderLibrary());
    els.sortSelect.addEventListener("change", () => renderLibrary());
  }

  function bootstrapBoard() {
    // 初始给玩家放几个基础贴纸（更像“开箱即玩”）
    if (items.length) return;
    const br = board.getBoundingClientRect();
    const cx = br.width / 2;
    const cy = br.height / 2;
    const bases = engine.getBaseElements();
    const offsets = [
      [-180, -40],
      [-40, -80],
      [100, -40],
      [-100, 60],
      [60, 60],
    ];
    bases.forEach((n, i) => spawnOnBoard(n, cx + offsets[i][0], cy + offsets[i][1]));
  }

  return {
    start() {
      load();
      bindTopbar();
      bindLibrarySearch();
      renderLibrary();
      bootstrapBoard();
      updateCounters();
      showToast("欢迎来到萌萌合成！");
    },
    engine,
    get items() {
      return items;
    },
  };
}
