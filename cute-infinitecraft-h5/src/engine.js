import { stablePairKey, pickByHash, now } from "./util.js";
import { BUILTIN_ELEMENTS } from "./builtinElements.js";
import { buildRecipeBook } from "./recipes.js";

const BASE_ELEMENTS = ["金", "木", "水", "火", "土"];

function autoMeta(name) {
  const palettes = [
    ["#ffe1ef", "#ff74c7"],
    ["#d7f8ff", "#66d6ff"],
    ["#fff0c9", "#ffd37a"],
    ["#e7ffd9", "#61e08a"],
    ["#efe4ff", "#caa8ff"],
    ["#ffe6d6", "#ff8a5b"],
    ["#e9f0ff", "#8ea8ff"],
  ];
  const glyphPool = [
    "sparkle",
    "heart",
    "star",
    "cloud",
    "dots",
    "leaf",
    "drop",
    "flame",
    "bolt",
    "moon",
    "sun",
    "music",
    "paw",
    "fish",
    "cookie",
    "crown",
    "castle",
    "planet",
    "robot",
    "wand",
    "gem",
    "gift",
    "balloon",
    "snow",
  ];
  const [colorA, colorB] = pickByHash(name, palettes);
  const glyph = pickByHash(name, glyphPool);

  let cat = "其他";
  if (/[雨雪云风雷电雾霜]/.test(name)) cat = "天气";
  else if (/[山海河湖泉溪岛沙石岩泥土]/.test(name)) cat = "自然";
  else if (/[金银铜铁钢铝锡镍矿晶玻璃]/.test(name)) cat = "材料";
  else if (/[树花草叶苗种子果]/.test(name)) cat = "自然";
  else if (/[奶茶咖啡可可巧克力蛋糕曲奇甜甜圈冰淇淋布丁果冻泡芙华夫饼披萨汉堡寿司拉面炒饭咖喱炸鸡薯条爆米花派沙拉]/.test(name)) cat = "美食";
  else if (/[剑弓盾锤斧刀枪车船机]/.test(name)) cat = "工具";
  else if (/[龙魔法妖精精灵史莱姆]/.test(name)) cat = "幻想";
  else if (/[城村国宫殿塔屋桥路]/.test(name)) cat = "地点";
  else if (/[猫狗鱼鸟虫熊兔]/.test(name)) cat = "动物";

  // 稀有度：有“宇宙/神/圣/终极”等词的更稀有
  let rarity = 1;
  if (/[神圣终极宇宙银河黑洞时空]/.test(name)) rarity = 5;
  else if (/[传说史诗魔法龙王]/.test(name)) rarity = 4;
  else if (/[稀有秘银水晶]/.test(name)) rarity = 3;
  else if (/[高级强化]/.test(name)) rarity = 2;

  // 更聪明的图标选择：根据关键词尽量贴合元素含义（更商业）
  const keywordGlyph = [
    [/猫|喵|狗|汪|兔|熊|狐|鹿|浣熊|松鼠|仓鼠|考拉|熊猫|企鹅|海豹|海龟|刺猬/, "paw"],
    [/鱼|鲸|海豚|章鱼|水母|海马|鲨/, "fish"],
    [/蛋糕|曲奇|甜甜圈|冰淇淋|布丁|果冻|泡芙|华夫饼|披萨|汉堡|寿司|拉面|咖喱|炸鸡|薯条|爆米花|奶茶|咖啡|可可|巧克力/, "cookie"],
    [/皇冠|王冠/, "crown"],
    [/城堡|宫殿|神殿|塔|天空之城/, "castle"],
    [/星|银河|月|太阳|黑洞|彗星|流星|极光/, "planet"],
    [/机器人|机甲|无人机|芯片|AI|量子/, "robot"],
    [/魔法|魔杖|法阵|传送门|精灵/, "wand"],
    [/水晶|宝石|珍珠|秘银|晶/, "gem"],
    [/礼物|宝箱/, "gift"],
    [/气球/, "balloon"],
    [/雪|冰|寒冷|雪原/, "snow"],
  ];
  const betterGlyph = keywordGlyph.find(([re]) => re.test(name))?.[1] || glyph;

  return { rarity, cat, colorA, colorB, glyph: betterGlyph };
}

export class GameEngine {
  constructor() {
    this.recipeBook = buildRecipeBook();
    this.elements = new Map(); // name -> meta
    for (const [k, v] of Object.entries(BUILTIN_ELEMENTS)) this.elements.set(k, v);

    this.unlocked = new Set(BASE_ELEMENTS);
    this.unlockedOrder = []; // {name, ts}
    BASE_ELEMENTS.forEach((n) => this.unlockedOrder.push({ name: n, ts: now() }));
  }

  getBaseElements() {
    return [...BASE_ELEMENTS];
  }

  getRecipeCount() {
    return this.recipeBook.size;
  }

  hasElement(name) {
    return this.elements.has(name);
  }

  getMeta(name) {
    if (!this.elements.has(name)) this.elements.set(name, autoMeta(name));
    return this.elements.get(name);
  }

  isUnlocked(name) {
    return this.unlocked.has(name);
  }

  unlock(name) {
    if (!this.unlocked.has(name)) {
      this.unlocked.add(name);
      this.unlockedOrder.push({ name, ts: now() });
      return true;
    }
    return false;
  }

  listUnlocked({ search = "", sort = "recent" } = {}) {
    const q = search.trim();
    const raw =
      sort === "recent"
        ? [...this.unlockedOrder].map((x) => x.name)
        : [...this.unlocked];

    let items = raw;
    if (q) items = items.filter((n) => n.includes(q));

    if (sort === "name") items = [...new Set(items)].sort((a, b) => a.localeCompare(b, "zh-CN"));
    if (sort === "rare")
      items = [...new Set(items)].sort((a, b) => (this.getMeta(b).rarity - this.getMeta(a).rarity) || a.localeCompare(b, "zh-CN"));

    // recent: raw already in time order; dedupe while preserving order
    if (sort === "recent") {
      const seen = new Set();
      const out = [];
      for (let i = items.length - 1; i >= 0; i--) {
        const n = items[i];
        if (!seen.has(n)) {
          seen.add(n);
          out.push(n);
        }
      }
      out.reverse();
      items = out;
    }

    return items;
  }

  combine(a, b) {
    if (!a || !b) return { ok: false, reason: "空元素" };
    if (a === b) {
      // 允许同元素相加的少量彩蛋，未命中就提示
      const res = this._lookup(a, b) || this._ruleCombine(a, b);
      if (res) return this._produce(res);
      return { ok: false, reason: "没反应" };
    }
    const res = this._lookup(a, b) || this._ruleCombine(a, b);
    if (!res) return { ok: false, reason: "没反应" };
    return this._produce(res);
  }

  _produce(name) {
    const isNew = this.unlock(name);
    this.getMeta(name);
    return { ok: true, name, isNew };
  }

  _lookup(a, b) {
    const key = stablePairKey(a, b);
    return this.recipeBook.get(key) || null;
  }

  _ruleCombine(a, b) {
    // 轻量“通用规则”：尽量保证离线版本也能不断有新东西（更接近 InfiniteCraft 的感觉）
    // 规则顺序：越具体越靠前
    const A = a;
    const B = b;

    // 1) 五行前缀化（不会覆盖核心配方）
    const prefixMap = new Map([
      ["火", "炎"],
      ["水", "水"],
      ["木", "森"],
      ["土", "岩"],
      ["金", "金"],
    ]);

    if (prefixMap.has(A) && !BASE_ELEMENTS.includes(B)) {
      const p = prefixMap.get(A);
      if (!B.startsWith(p)) return `${p}${B}`;
    }
    if (prefixMap.has(B) && !BASE_ELEMENTS.includes(A)) {
      const p = prefixMap.get(B);
      if (!A.startsWith(p)) return `${p}${A}`;
    }

    // 2) “升级”规则：同类别强化（避免“重复叠加词”）
    const mA = this.getMeta(A);
    const mB = this.getMeta(B);
    if (mA.cat && mA.cat === mB.cat && mA.cat !== "基础" && A !== B) {
      const upgradeWords = ["超级", "闪亮", "软萌", "豪华", "加强"];
      const base = pickByHash(`${A}+${B}`, [A, B]);
      const candidates = upgradeWords.filter((w) => !base.includes(w));
      const u = pickByHash(`${A}|${B}`, candidates.length ? candidates : upgradeWords);
      if (!base.startsWith(u)) return `${u}${base}`;
    }

    // 3) 兜底：不再做“名字拼接”，改为从命名库里挑一个更像元素名的结果
    const mixPools = [
      "小奇迹",
      "新发现",
      "神秘碎片",
      "彩色泡泡",
      "软糖精灵",
      "星星尘",
      "萌萌能量",
      "奇妙配方",
      "甜心魔法",
      "闪亮宝藏",
      "喵喵灵感",
      "云朵糖",
      "泡泡星",
      "棉花糖云",
      "彩虹微光",
      "梦境碎片",
      "小宇宙",
    ];
    const out = pickByHash(`${A}~${B}`, mixPools);
    if (out === A || out === B) return pickByHash(`${A}~${B}:2`, mixPools);
    return out;
  }

  exportSave() {
    return {
      v: 1,
      unlocked: [...this.unlocked],
      unlockedOrder: this.unlockedOrder,
    };
  }

  importSave(obj) {
    if (!obj || typeof obj !== "object") return { ok: false, reason: "存档格式错误" };
    if (obj.v !== 1) return { ok: false, reason: "不支持的存档版本" };
    if (!Array.isArray(obj.unlocked)) return { ok: false, reason: "存档缺少 unlocked" };
    this.unlocked = new Set(obj.unlocked);
    // 保证五行存在
    for (const b of BASE_ELEMENTS) this.unlocked.add(b);
    this.unlockedOrder = Array.isArray(obj.unlockedOrder) ? obj.unlockedOrder : [...this.unlocked].map((n) => ({ name: n, ts: now() }));
    // 预生成meta
    for (const n of this.unlocked) this.getMeta(n);
    return { ok: true };
  }
}
