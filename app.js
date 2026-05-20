/* 萌萌合成 - 单文件版（支持直接打开 index.html 运行） */
(() => {
  "use strict";

  // ===== audio.js =====
  let audioCtx = null;
  let bgPlaying = false;
  let bgGainNode = null;
  let bgVolume = 0.3;
  let sfxVolume = 0.5;

  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume * sfxVolume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }

  function playSuccess() {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 100);
    });
  }

  function playUnlock() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.25), i * 80);
    });
  }

  function playPlace() {
    playTone(800, 0.1, 'sine', 0.15);
  }

  function playCombine() {
    playTone(600, 0.15, 'triangle', 0.2);
    setTimeout(() => playTone(800, 0.2, 'sine', 0.2), 100);
  }

  function playError() {
    playTone(200, 0.3, 'sawtooth', 0.2);
  }

  function startBackgroundMusic() {
    if (!audioCtx || bgPlaying) return;
    
    bgPlaying = true;
    bgGainNode = audioCtx.createGain();
    bgGainNode.connect(audioCtx.destination);
    bgGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    bgGainNode.gain.linearRampToValueAtTime(bgVolume, audioCtx.currentTime + 1);
    
    const playNote = (freq, delay) => {
      if (!bgPlaying) return;
      
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      
      osc.connect(noteGain);
      noteGain.connect(bgGainNode);
      
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
      osc.type = 'sine';
      
      noteGain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
      noteGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + delay + 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 3);
      
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + 3);
    };
    
    const progression = [
      [440, 523.25, 659.25],
      [493.88, 587.33, 739.99],
      [523.25, 659.25, 783.99],
      [440, 523.25, 659.25],
    ];
    
    let bar = 0;
    const loop = () => {
      if (!bgPlaying) return;
      
      const chord = progression[bar % progression.length];
      chord.forEach((freq, i) => {
        playNote(freq, i * 0.2);
      });
      
      bar++;
      setTimeout(loop, 2000);
    };
    
    loop();
  }

  function stopBackgroundMusic() {
    if (!bgGainNode) return;
    
    bgPlaying = false;
    bgGainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    setTimeout(() => { bgGainNode = null; }, 500);
  }

  function toggleBackgroundMusic() {
    if (!audioCtx) initAudio();
    
    if (bgPlaying) {
      stopBackgroundMusic();
    } else {
      startBackgroundMusic();
    }
    return !bgPlaying;
  }

  // ===== util.js =====
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  }
  function now() {
    return Date.now();
  }
  function stablePairKey(a, b) {
    return a <= b ? `${a}|${b}` : `${b}|${a}`;
  }
  function pickByHash(str, list) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % list.length;
    return list[idx];
  }
  function debounce(fn, ms = 150) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ===== storage.js =====
  const STORAGE_KEY = "cute_infinitecraft_save_v1";
  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  function saveLocal(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  }

  // ===== builtinElements.js =====
  const BUILTIN_ELEMENTS = {
    金: { rarity: 1, cat: "基础", colorA: "#ffe08a", colorB: "#ffb84d", glyph: "sparkle" },
    木: { rarity: 1, cat: "基础", colorA: "#b7ffcf", colorB: "#4ddf86", glyph: "leaf" },
    水: { rarity: 1, cat: "基础", colorA: "#bfe7ff", colorB: "#57b8ff", glyph: "drop" },
    火: { rarity: 1, cat: "基础", colorA: "#ffd1b0", colorB: "#ff6b3d", glyph: "flame" },
    土: { rarity: 1, cat: "基础", colorA: "#f6d0a8", colorB: "#c79a6b", glyph: "mountain" },
    蒸汽: { rarity: 1, cat: "自然", colorA: "#e9f0ff", colorB: "#c7d7ff", glyph: "cloud" },
    泥: { rarity: 1, cat: "自然", colorA: "#f3d7bb", colorB: "#caa07a", glyph: "blob" },
    植物: { rarity: 1, cat: "自然", colorA: "#d6ffdb", colorB: "#61e08a", glyph: "sprout" },
    石头: { rarity: 1, cat: "自然", colorA: "#e7e7ef", colorB: "#bdbdd4", glyph: "rock" },
    沙: { rarity: 1, cat: "自然", colorA: "#fff0c9", colorB: "#ffd37a", glyph: "dots" },
    雨: { rarity: 1, cat: "天气", colorA: "#dff3ff", colorB: "#7cc7ff", glyph: "rain" },
    云: { rarity: 1, cat: "天气", colorA: "#f2f7ff", colorB: "#cfe2ff", glyph: "cloud" },
    风: { rarity: 1, cat: "天气", colorA: "#e9fbff", colorB: "#8be8ff", glyph: "wind" },
    闪电: { rarity: 2, cat: "天气", colorA: "#fff6a6", colorB: "#ffd03a", glyph: "bolt" },
    金属: { rarity: 2, cat: "材料", colorA: "#f3f3ff", colorB: "#cfd0ff", glyph: "ingot" },
    工具: { rarity: 2, cat: "工具", colorA: "#f5eaff", colorB: "#caa8ff", glyph: "wrench" },
    种子: { rarity: 1, cat: "自然", colorA: "#fff1dd", colorB: "#ffd39c", glyph: "seed" },
    树: { rarity: 1, cat: "自然", colorA: "#e0ffd3", colorB: "#65d46e", glyph: "tree" },
    花: { rarity: 1, cat: "自然", colorA: "#ffe0f0", colorB: "#ff78c8", glyph: "flower" },
  };

  // ===== recipes.js =====
  const CORE_RECIPES = [
    ["水", "水", "海"],
    ["火", "火", "能量"],
    ["土", "土", "山"],
    ["木", "木", "森林"],
    ["金", "金", "黄金"],
    ["水", "火", "蒸汽"],
    ["水", "土", "泥"],
    ["火", "土", "岩浆"],
    ["岩浆", "水", "石头"],
    ["石头", "土", "岩石"],
    ["石头", "石头", "山脉"],
    ["石头", "风", "沙"],
    ["海", "风", "浪"],
    ["海", "山", "岛"],
    ["山", "风", "峡谷"],
    ["泥", "火", "砖"],
    ["沙", "火", "玻璃"],
    ["蒸汽", "蒸汽", "云"],
    ["云", "水", "雨"],
    ["云", "云", "天空"],
    ["天空", "云", "风"],
    ["风", "云", "暴风"],
    ["暴风", "云", "闪电"],
    ["闪电", "雨", "雷暴"],
    ["雨", "土", "花园"],
    ["雨", "森林", "彩虹"],
    ["冰", "云", "雪"],
    ["木", "土", "种子"],
    ["种子", "水", "植物"],
    ["植物", "土", "树"],
    ["植物", "雨", "花"],
    ["花", "森林", "蜂蜜"],
    ["海", "植物", "海藻"],
    ["海藻", "火", "盐"],
    ["植物", "沙", "麦"],
    ["金", "石头", "金属"],
    ["金属", "木", "工具"],
    ["工具", "金属", "钥匙"],
    ["工具", "石头", "锤子"],
    ["工具", "金属", "扳手"],
    ["金属", "火", "熔炉"],
    ["熔炉", "金属", "钢"],
    ["钢", "工具", "齿轮"],
    ["火", "木", "篝火"],
    ["篝火", "海", "热汤"],
    ["盐", "热汤", "美味汤"],
    ["植物", "火", "烤蔬菜"],
    ["麦", "火", "面包"],
    ["面包", "蜂蜜", "蜂蜜面包"],
    ["海", "能量", "生命"],
    ["生命", "森林", "动物"],
    ["动物", "花园", "宠物"],
    ["宠物", "蜂蜜", "萌宠"],
    ["砖", "砖", "房子"],
    ["房子", "房子", "村庄"],
    ["村庄", "工具", "城市"],
    ["城市", "能量", "科技"],
    ["彩虹", "能量", "魔法"],
    ["魔法", "森林", "精灵"],
    ["魔法", "山脉", "巨龙"],
    ["科技", "钢", "机器人"],
    ["云", "山脉", "寒冷"],
    ["寒冷", "水", "冰"],
  ];

  function uniq(arr) {
    return [...new Set(arr)];
  }

  function buildCollectibleOutputs() {
    const animals = [
      "小猫","小狗","小兔","小熊","小鹿","小狐狸","小浣熊","小松鼠","小企鹅","小海豹",
      "小鸭","小鸡","小鸽","小麻雀","小猫头鹰","小海豚","小鲸鱼","小章鱼","小海龟","小金鱼",
      "小刺猬","小仓鼠","小考拉","小熊猫","小老虎","小狮子","小河马","小长颈鹿","小斑马","小羊驼",
      "小山羊","小绵羊","小奶牛","小马","小猪","小青蛙","小蝴蝶","小蜜蜂","小瓢虫","小蜗牛",
      "小蟹","小龙虾","小鲨鱼","小海马","小珊瑚","小海星","小水母","小鹦鹉","小孔雀","小天鹅",
      "小熊蜂","小萤火虫","小蚂蚁","小蜘蛛","小蜻蜓","小螃蟹","小海鸥","小鸵鸟","小鳄鱼","小乌龟",
      "小熊猫王","小独角兽","小麒麟","小龙","小史莱姆","小妖精","小精灵猫","小飞龙","小蘑菇怪","小南瓜怪",
    ];
    const foods = [
      "草莓","蓝莓","樱桃","葡萄","西瓜","菠萝","芒果","香蕉","柠檬","橙子",
      "苹果","桃子","梨","椰子","牛奶","酸奶","奶茶","可可","巧克力","棉花糖",
      "蛋糕","曲奇","甜甜圈","冰淇淋","布丁","果冻","泡芙","华夫饼","披萨","汉堡",
      "寿司","拉面","煎饺","炒饭","咖喱","炸鸡","烤鱼","沙拉","薯条","爆米花",
      "蜂蜜柠檬水","草莓奶昔","抹茶拿铁","珍珠奶茶","巧克力曲奇","蓝莓派","苹果派","焦糖布丁","芝士蛋糕","彩虹蛋糕",
    ];
    const items = [
      "小书包","小皇冠","小铃铛","小灯笼","小风车","小雨伞","小气球","小礼物","小相机","小望远镜",
      "小魔杖","小披风","小斗篷","小背包","小帽子","小围巾","小手套","小靴子","小耳机","小音箱",
      "小画笔","小调色盘","小贴纸","小手账","小铅笔","小橡皮","小积木","小陀螺","小飞盘","小风筝",
      "小钥匙","小宝箱","小沙漏","小指南针","小钟表","小怀表","小吸管","小杯子","小勺子","小叉子",
      "小盾牌","小木剑","小钢剑","小锤子","小镐子","小斧头","小弓箭","小头盔","小铠甲","小护符",
    ];
    const places = [
      "小木屋","小城堡","小花店","小面包店","小咖啡馆","小书店","小游乐园","小动物园","小海边","小山顶",
      "小森林","小湖泊","小温泉","小牧场","小果园","小雪原","小沙漠","小彩虹桥","小星空屋","小魔法学院",
      "小机器人工厂","小研究所","小港口","小灯塔","小码头","小集市","小广场","小喷泉","小公园","小花园",
    ];
    const fantasy = [
      "史莱姆","魔法书","法阵","传送门","魔法森林","彩虹独角兽","星光精灵","月亮兔","云朵鲸","糖果城",
      "蘑菇小屋","南瓜马车","星星沙","梦境","泡泡王国","喵喵神殿","龙之巢","雪国精灵","海底遗迹","天空之城",
    ];
    const tech = [
      "芯片","无人机","小火箭","卫星","太空舱","电池","电灯","电车","小电脑","小手机",
      "机械臂","3D打印机","电风扇","小电视","小冰箱","咖啡机","洗衣机","小机器人","AI助手","量子盒子",
    ];
    const nature = [
      "太阳","月亮","星星","流星","银河","黑洞","彗星","极光","森林精华","水晶",
      "珍珠","珊瑚","贝壳","火山","温泉","瀑布","河流","湖泊","彩虹云","风之铃",
    ];

    // 通过“有约束的变体”扩容：
    // - 避免出现“名字重复叠加”（例如：小小小猫 / 草莓味草莓奶昔）
    // - 仍保持可爱收集向，并保证数量级 1000+
    const prefixes = ["软萌", "闪亮", "星光", "彩虹", "泡泡", "棉花糖", "治愈", "蜜糖", "薄荷", "焦糖", "芝士", "抹茶"];
    const prefixAvoidTokens = new Map([
      ["星光", ["星", "银河", "月", "太阳"]],
      ["彩虹", ["彩虹"]],
      ["泡泡", ["泡泡"]],
      ["棉花糖", ["棉花糖"]],
      ["蜜糖", ["蜂蜜", "蜜"]],
      ["薄荷", ["薄荷"]],
      ["焦糖", ["焦糖"]],
      ["芝士", ["芝士"]],
      ["抹茶", ["抹茶"]],
    ]);
    const suffixes = ["团子", "抱枕", "玩偶", "挂件", "贴纸", "徽章", "小屋", "乐园", "派对", "之歌", "物语"];
    const bases = uniq([...animals, ...foods, ...items, ...places, ...fantasy, ...tech, ...nature]);

    const outputs = [];
    for (const b of bases) {
      outputs.push(b);
      for (const p of prefixes) {
        if (b.startsWith(p)) continue;
        if (b.includes(p)) continue;
        const avoid = prefixAvoidTokens.get(p) || [];
        if (avoid.some((t) => b.includes(t))) continue;
        const name = `${p}${b}`;
        if (name.length <= 10) outputs.push(name);
      }
      for (const s of suffixes) {
        if (b.endsWith(s)) continue;
        const name = `${b}${s}`;
        if (name.length <= 10) outputs.push(name);
      }
      if (b.startsWith("小") && b.length <= 9) {
        const name = b.replace(/^小/, "萌萌");
        if (name.length <= 10) outputs.push(name);
      }
    }
    return uniq(outputs);
  }

  function buildCollectibleRecipes(seedIngredients) {
    const outputs = buildCollectibleOutputs();
    const out = [];
    for (const result of outputs) {
      const a = pickByHash(result + ":a", seedIngredients);
      let b = pickByHash(result + ":b", seedIngredients);
      if (b === a) b = pickByHash(result + ":b2", seedIngredients);
      out.push([a, b, result]);
    }
    return out;
  }

  function buildRecipeBook() {
    const map = new Map();
    const add = (a, b, r) => {
      if (!a || !b || !r) return;
      const key = stablePairKey(a, b);
      if (!map.has(key)) map.set(key, r);
    };
    for (const [a, b, r] of CORE_RECIPES) add(a, b, r);

    const seedIngredients = uniq([
      "金", "木", "水", "火", "土",
      "蒸汽", "泥", "岩浆", "石头", "沙", "玻璃",
      "云", "雨", "风", "闪电", "彩虹", "雷暴",
      "海", "山", "森林", "岛", "峡谷",
      "种子", "植物", "树", "花", "蜂蜜", "海藻", "盐",
      "金属", "工具", "锤子", "扳手", "熔炉", "钢", "齿轮",
      "房子", "村庄", "城市", "科技", "魔法",
      "生命", "动物", "宠物", "萌宠",
      "寒冷", "冰", "雪",
      "麦", "面包",
    ]);
    for (const [a, b, r] of buildCollectibleRecipes(seedIngredients)) add(a, b, r);
    return map;
  }

  // ===== icons.js =====
  const NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  }
  function makeBg(colorA, colorB) {
    const svg = svgEl("svg", { viewBox: "0 0 64 64", width: "64", height: "64" });
    const defs = svgEl("defs");
    const gid = `g_${Math.random().toString(16).slice(2)}`;
    const grad = svgEl("linearGradient", { id: gid, x1: "0", y1: "0", x2: "1", y2: "1" });
    grad.append(svgEl("stop", { offset: "0", "stop-color": colorA }), svgEl("stop", { offset: "1", "stop-color": colorB }));
    defs.append(grad);
    svg.append(defs);
    const r = svgEl("rect", { x: "6", y: "6", width: "52", height: "52", rx: "18", fill: `url(#${gid})` });
    r.style.filter = "drop-shadow(0px 6px 10px rgba(0,0,0,.12))";
    svg.append(r);
    svg.append(svgEl("path", { d: "M16 18 C 20 12, 30 10, 40 12 C 33 16, 25 18, 16 18Z", fill: "rgba(255,255,255,.45)" }));
    return svg;
  }
  function glyphPath(type) {
    switch (type) {
      case "drop": return "M32 12 C26 22 20 28 20 36a12 12 0 0 0 24 0c0-8-6-14-12-24Z";
      case "flame": return "M32 14c2 10-8 10-6 20 2 10 18 10 18-2 0-10-6-10-6-18-2 4-4 6-6 8 0-4 0-6 0-8Z";
      case "leaf": return "M16 38c18 6 28-4 32-22-16 2-30 10-32 22Zm10 0c6-8 14-12 22-14";
      case "mountain": return "M10 46l14-22 10 14 8-10 12 18H10Z";
      case "cloud": return "M22 44h22a10 10 0 0 0 0-20 12 12 0 0 0-22-2 9 9 0 0 0 0 22Z";
      case "bolt": return "M34 10 16 36h14l-2 18 20-28H34l0-16Z";
      case "rock": return "M20 46c-6-2-8-10-4-16 4-6 8-10 14-10 10 0 18 6 18 16 0 6-4 10-10 10H20Z";
      case "sprout": return "M32 48V28c-8 0-14-6-14-14 10 0 16 6 14 14 2-8 8-14 18-14 0 8-6 14-18 14v20Z";
      case "seed": return "M32 18c8 0 14 6 14 14s-6 18-14 18-14-10-14-18 6-14 14-14Z";
      case "tree": return "M32 12c10 0 18 8 18 18 0 8-6 14-14 16v6H28v-6c-8-2-14-8-14-16 0-10 8-18 18-18Z";
      case "flower": return "M32 28c4-8 14-6 14 2 0 4-4 8-10 8 6 0 10 4 10 8 0 8-10 10-14 2-4 8-14 6-14-2 0-4 4-8 10-8-6 0-10-4-10-8 0-8 10-10 14-2Z";
      case "wind": return "M14 26h28c6 0 8-8 2-10-4-2-8 2-6 6M14 36h34c8 0 10-10 2-12-5-2-10 2-8 8M14 46h20c6 0 8-8 2-10";
      case "ingot": return "M18 40l8-14h20l-8 14H18Zm4-18 6-10h24l-6 10H22Z";
      case "wrench": return "M42 14a10 10 0 0 0-10 10c0 2 0 2 1 4L18 43l3 7 7-3 15-15c2 1 2 1 4 1a10 10 0 0 0 0-20 6 6 0 0 0 2 9l-4 4-5-5 4-4a6 6 0 0 0-2-3Z";
      case "sparkle": return "M32 10l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Zm18 18 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z";
      case "rain": return "M22 36h22a10 10 0 0 0 0-20 12 12 0 0 0-22-2 9 9 0 0 0 0 22Z M28 42l-4 10 M40 42l-4 10 M52 42l-4 10";
      case "dots": return "M20 26a4 4 0 1 0 0.01 0ZM44 24a4 4 0 1 0 0.01 0ZM30 40a4 4 0 1 0 0.01 0ZM46 42a3.5 3.5 0 1 0 0.01 0ZM18 44a3.5 3.5 0 1 0 0.01 0Z";
      case "blob": return "M22 44c-6-6-2-16 4-20 4-2 6-8 12-8 10 0 18 10 14 20-4 10-22 14-30 8Z";
      case "heart": return "M32 48s-16-9-16-20a9 9 0 0 1 16-6 9 9 0 0 1 16 6c0 11-16 20-16 20Z";
      case "star": return "M32 12l6 14 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2 6-14Z";
      case "moon": return "M40 14c-10 2-16 12-14 22s12 16 22 14c-4 4-10 6-16 6-12 0-22-10-22-22 0-10 6-18 14-20 6-2 12-2 16 0Z";
      case "sun": return "M32 18a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm0-10v8m0 40v8M8 32h8m40 0h8M14 14l6 6m30 30 6 6M50 14l-6 6M14 50l6-6";
      case "music": return "M42 14v26a6 6 0 1 1-4-6V20l-16 4v20a6 6 0 1 1-4-6V18l24-6Z";
      case "paw":
        return "M24 22a4 4 0 1 0 .01 0ZM40 22a4 4 0 1 0 .01 0ZM18 30a3.6 3.6 0 1 0 .01 0ZM46 30a3.6 3.6 0 1 0 .01 0ZM32 34c8 0 12 8 10 14-2 6-18 6-20 0-2-6 2-14 10-14Z";
      case "fish":
        return "M18 34c6-10 18-14 28-8l8-6v28l-8-6c-10 6-22 2-28-8Zm18 0a3 3 0 1 0 .01 0Z";
      case "cookie":
        return "M32 16a18 18 0 1 0 0 36 18 18 0 0 0 0-36Zm-6 10a2.6 2.6 0 1 0 .01 0ZM40 26a2.6 2.6 0 1 0 .01 0ZM30 38a2.6 2.6 0 1 0 .01 0ZM42 40a2.6 2.6 0 1 0 .01 0Z";
      case "crown":
        return "M14 44l4-22 14 14 14-14 4 22H14Zm6 6h24";
      case "castle":
        return "M18 50V26h6v-8h8v8h4v-8h8v8h6v24H18Zm8-10h12v10H26V40Z";
      case "planet":
        return "M32 18a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm-22 18c12-8 30-10 44-6-10 10-28 14-44 6Zm4 8c10-4 24-4 36 0";
      case "robot":
        return "M28 14h8v6h-8v-6Zm-10 8h28v26H18V22Zm8 8h4v4h-4v-4Zm12 0h4v4h-4v-4Zm-14 14h20v4H24v-4Z";
      case "wand":
        return "M40 14l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6ZM18 50l26-26 4 4-26 26H18Z";
      case "gem":
        return "M20 20h24l8 12-20 20L12 32l8-12Zm8 0 4-6 4 6";
      case "gift":
        return "M18 28h28v22H18V28Zm-2 0v-6h32v6H16Zm16 0v22m-10-18h20M28 18c0-4 6-6 8-2 2 4-4 6-8 6m8-6c0-4-6-6-8-2-2 4 4 6 8 6";
      case "balloon":
        return "M32 14c8 0 14 6 14 14 0 10-8 18-14 18s-14-8-14-18c0-8 6-14 14-14Zm0 32c2 4 4 8 2 12m-2-12c-2 4-4 8-2 12";
      case "snow":
        return "M32 12v40m-14-26 28 26m0-26-28 26m-6-6h40m-30-24 20 36m0-36-20 36";
      default: return "M20 20h24v24H20Z";
    }
  }
  function renderIcon({ name, meta, size = 40 }) {
    const { colorA, colorB } = meta;
    const base = makeBg(colorA, colorB);
    base.setAttribute("width", String(size));
    base.setAttribute("height", String(size));
    const glyph = meta.glyph || pickByHash(name, ["sparkle", "heart", "star", "cloud", "dots"]);
    const p = svgEl("path", {
      d: glyphPath(glyph),
      fill: "rgba(255,255,255,.92)",
      stroke: "rgba(0,0,0,.08)",
      "stroke-width": "1.2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
    base.append(p);
    return base;
  }

  // ===== engine.js =====
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
      "sparkle","heart","star","cloud","dots","leaf","drop","flame","bolt","moon","sun","music",
      "paw","fish","cookie","crown","castle","planet","robot","wand","gem","gift","balloon","snow"
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
    let rarity = 1;
    if (/[神圣终极宇宙银河黑洞时空]/.test(name)) rarity = 5;
    else if (/[传说史诗魔法龙王]/.test(name)) rarity = 4;
    else if (/[稀有秘银水晶]/.test(name)) rarity = 3;
    else if (/[高级强化]/.test(name)) rarity = 2;
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
    const betterGlyph = (keywordGlyph.find(([re]) => re.test(name)) || [null, glyph])[1];
    return { rarity, cat, colorA, colorB, glyph: betterGlyph };
  }

  class GameEngine {
    constructor() {
      this.recipeBook = buildRecipeBook();
      this.elements = new Map();
      for (const [k, v] of Object.entries(BUILTIN_ELEMENTS)) this.elements.set(k, v);
      this.unlocked = new Set(BASE_ELEMENTS);
      this.unlockedOrder = [];
      BASE_ELEMENTS.forEach((n) => this.unlockedOrder.push({ name: n, ts: now() }));
    }
    getBaseElements() { return [...BASE_ELEMENTS]; }
    getRecipeCount() { return this.recipeBook.size; }
    isUnlocked(name) { return this.unlocked.has(name); }
    getMeta(name) {
      if (!this.elements.has(name)) this.elements.set(name, autoMeta(name));
      return this.elements.get(name);
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
      const raw = sort === "recent" ? [...this.unlockedOrder].map((x) => x.name) : [...this.unlocked];
      let items = raw;
      if (q) items = items.filter((n) => n.includes(q));
      if (sort === "name") items = [...new Set(items)].sort((a, b) => a.localeCompare(b, "zh-CN"));
      if (sort === "rare") items = [...new Set(items)].sort((a, b) => (this.getMeta(b).rarity - this.getMeta(a).rarity) || a.localeCompare(b, "zh-CN"));
      if (sort === "recent") {
        const seen = new Set();
        const out = [];
        for (let i = items.length - 1; i >= 0; i--) {
          const n = items[i];
          if (!seen.has(n)) { seen.add(n); out.push(n); }
        }
        out.reverse();
        items = out;
      }
      return items;
    }
    combine(a, b) {
      if (!a || !b) return { ok: false, reason: "空元素" };
      const res = this._lookup(a, b) || this._ruleCombine(a, b);
      if (!res) return { ok: false, reason: "没反应" };
      const isNew = this.unlock(res);
      this.getMeta(res);
      return { ok: true, name: res, isNew };
    }
    _lookup(a, b) {
      const key = stablePairKey(a, b);
      return this.recipeBook.get(key) || null;
    }
    _ruleCombine(a, b) {
      const A = a, B = b;
      const prefixMap = new Map([["火","炎"],["水","水"],["木","森"],["土","岩"],["金","金"]]);
      if (prefixMap.has(A) && !BASE_ELEMENTS.includes(B)) {
        const p = prefixMap.get(A);
        if (!B.startsWith(p)) return `${p}${B}`;
      }
      if (prefixMap.has(B) && !BASE_ELEMENTS.includes(A)) {
        const p = prefixMap.get(B);
        if (!A.startsWith(p)) return `${p}${A}`;
      }
      const mA = this.getMeta(A);
      const mB = this.getMeta(B);
      if (mA.cat && mA.cat === mB.cat && mA.cat !== "基础" && A !== B) {
        const upgradeWords = ["超级", "闪亮", "软萌", "豪华", "加强"];
        const base = pickByHash(`${A}+${B}`, [A, B]);
        const candidates = upgradeWords.filter((w) => !base.includes(w));
        const u = pickByHash(`${A}|${B}`, candidates.length ? candidates : upgradeWords);
        if (!base.startsWith(u)) return `${u}${base}`;
      }
      // 兜底：不再做“名字拼接”，改为从命名库里挑一个更像元素名的结果
      const mixPools = [
        "小奇迹","新发现","神秘碎片","彩色泡泡","软糖精灵","星星尘","萌萌能量",
        "奇妙配方","甜心魔法","闪亮宝藏","喵喵灵感","云朵糖","泡泡星","棉花糖云",
        "彩虹微光","梦境碎片","小宇宙",
      ];
      const out = pickByHash(`${A}~${B}`, mixPools);
      if (out === A || out === B) return pickByHash(`${A}~${B}:2`, mixPools);
      return out;
    }
    exportSave() {
      return { v: 1, unlocked: [...this.unlocked], unlockedOrder: this.unlockedOrder };
    }
    importSave(obj) {
      if (!obj || typeof obj !== "object") return { ok: false, reason: "存档格式错误" };
      if (obj.v !== 1) return { ok: false, reason: "不支持的存档版本" };
      if (!Array.isArray(obj.unlocked)) return { ok: false, reason: "存档缺少 unlocked" };
      this.unlocked = new Set(obj.unlocked);
      for (const b of BASE_ELEMENTS) this.unlocked.add(b);
      this.unlockedOrder = Array.isArray(obj.unlockedOrder) ? obj.unlockedOrder : [...this.unlocked].map((n) => ({ name: n, ts: now() }));
      for (const n of this.unlocked) this.getMeta(n);
      return { ok: true };
    }
  }

  // ===== play.js（UI逻辑）=====
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

  function createGame(els) {
    const engine = new GameEngine();
    const board = els.board;
    let items = [];
    let lastCombine = null;
    let hoverTargetId = null;
    let pendingLibraryFocusName = null;

    // ===== 轻量“粘性系统”状态（订单/家园/任务/装饰）=====
    const state = {
      lastDate: "",
      coins: 0,
      homeLevel: 1,
      homeExp: 0,
      decorOwned: {},
      orders: [],
      daily: {
        craft: 0,
        unlock: 0,
        chain: 0,
        event: 0,
        order: 0,
        claimed: {},
      },
    };

    const DECORS = [
      { id: "pillow", name: "草莓抱枕", cost: 30 },
      { id: "plant", name: "小盆栽", cost: 40 },
      { id: "lamp", name: "星星小夜灯", cost: 55 },
      { id: "poster", name: "彩虹海报", cost: 60 },
      { id: "carpet", name: "棉花糖地毯", cost: 70 },
      { id: "clock", name: "喵喵钟表", cost: 85 },
      { id: "shelf", name: "小书架", cost: 95 },
      { id: "music", name: "音乐盒", cost: 110 },
      { id: "window", name: "星空窗", cost: 130 },
      { id: "throne", name: "软萌王座", cost: 160 },
    ];

    function todayKey() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    function expNeed(level) {
      return 30 + level * 20;
    }

    function addCoins(n) {
      state.coins = Math.max(0, state.coins + n);
      renderRightPanel();
      save();
    }

    function addExp(n) {
      state.homeExp += n;
      while (state.homeExp >= expNeed(state.homeLevel)) {
        state.homeExp -= expNeed(state.homeLevel);
        state.homeLevel += 1;
        showToast(`家园升级！Lv.${state.homeLevel}`);
        burstFxCenter(board, "#ff5aa5");
        playSound("level");
      }
      renderRightPanel();
      save();
    }

    function ensureDaily() {
      const t = todayKey();
      if (state.lastDate !== t) {
        state.lastDate = t;
        state.daily.craft = 0;
        state.daily.unlock = 0;
        state.daily.chain = 0;
        state.daily.event = 0;
        state.daily.order = 0;
        state.daily.claimed = {};
        state.orders = generateDailyOrders();
        showToast("今日内容已刷新！");
      }
    }

    function generateDailyOrders() {
      // 3单：目标尽量从当前可见/主线元素里抽，避免太离谱
      const pool = [
        "蒸汽","泥","石头","沙","玻璃","云","雨","风","闪电","彩虹",
        "种子","植物","树","花","蜂蜜","盐","面包",
        "金属","工具","钢","齿轮",
        "房子","村庄","城市",
        "魔法","精灵","机器人",
      ];
      const t = todayKey();
      const orders = [];
      for (let i = 0; i < 3; i++) {
        const target = pickByHash(`${t}:order:${i}`, pool);
        orders.push({
          id: `${t}_${i}`,
          target,
          rewardCoins: 25 + i * 10,
          rewardExp: 12 + i * 6,
          done: false,
          note: pickByHash(`${t}:note:${i}`, [
            "喵喵想要这个做新品！",
            "顾客点名要它～",
            "家园升级需要材料！",
            "今天来点闪亮的吧！",
          ]),
        });
      }
      return orders;
    }

    function dailyTasksDef() {
      return [
        { id: "craft", title: "合成 12 次", cur: () => state.daily.craft, max: 12, reward: 25 },
        { id: "unlock", title: "解锁 4 个新元素", cur: () => state.daily.unlock, max: 4, reward: 40 },
        { id: "order", title: "完成 2 个订单", cur: () => state.daily.order, max: 2, reward: 50 },
        { id: "event", title: "完成 1 次随机事件", cur: () => state.daily.event, max: 1, reward: 35 },
        { id: "chain", title: "达成 1 次连锁合成", cur: () => state.daily.chain, max: 1, reward: 45 },
      ];
    }

    function claimTask(id) {
      const def = dailyTasksDef().find((x) => x.id === id);
      if (!def) return;
      if ((state.daily.claimed || {})[id]) return;
      if (def.cur() < def.max) return;
      state.daily.claimed[id] = true;
      addCoins(def.reward);
      showToast(`任务完成！+${def.reward}金币`);
      burstFxCenter(board, "#6dd6ff");
      playSound("reward");
      renderRightPanel();
      save();
    }

    function deliverOrder(orderId) {
      ensureDaily();
      try {
      const o = state.orders.find((x) => x.id === orderId);
      if (!o || o.done) return;
      if (!engine.isUnlocked(o.target)) {
        showToast("还没解锁目标元素～先去合成吧");
        return;
      }
      o.done = true;
      state.daily.order += 1;
      addCoins(o.rewardCoins);
      addExp(o.rewardExp);
      showToast(`交付成功：${o.target} ！`);
      burstFxCenter(board, "#ffb84d");
      playSound("reward");
      renderRightPanel();
      save();
      } catch (e) {
        showToast(`订单交付失败：${e?.message || "未知错误"}`);
      }
    }

    function buyDecor(id) {
      ensureDaily();
      const d = DECORS.find((x) => x.id === id);
      if (!d) return;
      if (state.decorOwned[id]) return;
      if (state.coins < d.cost) {
        showToast("金币不够啦～去完成订单/任务吧！");
        return;
      }
      state.decorOwned[id] = true;
      addCoins(-d.cost);
      addExp(8);
      showToast(`已购买：${d.name}`);
      playSound("buy");
      burstFxCenter(board, "#ff5aa5");
      renderRightPanel();
      save();
    }

    function renderRightPanel() {
      if (!els.coinCount) return; // 兼容旧页面
      els.coinCount.textContent = String(state.coins);
      els.homeLevel.textContent = String(state.homeLevel);

      // 订单
      if (els.orders) {
        els.orders.innerHTML = "";
        for (const o of state.orders) {
          const row = document.createElement("div");
          row.className = "row";
          row.innerHTML = `
            <div class="row__main">
              <div class="row__title">${o.done ? "✅" : "🧾"} 交付：${o.target}</div>
              <div class="row__sub">${o.note}<br/>奖励：${o.rewardCoins}金币 + ${o.rewardExp}经验</div>
            </div>
            <div class="row__actions">
              <button class="btn btn--mini ${o.done ? "btn--ghost" : ""}" ${o.done ? "disabled" : ""}>${o.done ? "已完成" : "交付"}</button>
            </div>
          `;
          row.querySelector("button").addEventListener("click", () => deliverOrder(o.id));
          els.orders.appendChild(row);
        }
      }

      // 每日任务
      if (els.dailyTasks) {
        els.dailyTasks.innerHTML = "";
        for (const t of dailyTasksDef()) {
          const cur = Math.min(t.cur(), t.max);
          const pct = Math.round((cur / t.max) * 100);
          const claimed = (state.daily.claimed || {})[t.id];
          const row = document.createElement("div");
          row.className = "row";
          row.innerHTML = `
            <div class="row__main">
              <div class="row__title">${claimed ? "🏅" : "🎯"} ${t.title}</div>
              <div class="row__sub">进度：${cur}/${t.max} · 奖励：${t.reward}金币</div>
              <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
            </div>
            <div class="row__actions">
              <button class="btn btn--mini ${claimed ? "btn--ghost" : ""}" ${claimed || cur < t.max ? "disabled" : ""}>${claimed ? "已领取" : "领取"}</button>
            </div>
          `;
          row.querySelector("button").addEventListener("click", () => claimTask(t.id));
          els.dailyTasks.appendChild(row);
        }
      }

      // 装饰
      if (els.decors) {
        els.decors.innerHTML = "";
        const ownedCount = Object.values(state.decorOwned).filter(Boolean).length;
        const header = document.createElement("div");
        header.className = "muted";
        header.textContent = `已拥有 ${ownedCount}/${DECORS.length}`;
        els.decors.appendChild(header);

        for (const d of DECORS) {
          const owned = !!state.decorOwned[d.id];
          const row = document.createElement("div");
          row.className = "row";
          row.innerHTML = `
            <div class="row__main">
              <div class="row__title">${owned ? "🧸" : "🛒"} ${d.name}</div>
              <div class="row__sub">价格：${d.cost}金币 · +8经验</div>
            </div>
            <div class="row__actions">
              <button class="btn btn--mini ${owned ? "btn--ghost" : ""}" ${owned ? "disabled" : ""}>${owned ? "已拥有" : "购买"}</button>
            </div>
          `;
          row.querySelector("button").addEventListener("click", () => buyDecor(d.id));
          els.decors.appendChild(row);
        }
      }
    }

    // ===== 反馈：粒子与音效（轻量）=====
    function burstFx(x, y, color = "#ff5aa5") {
      const br = board.getBoundingClientRect();
      const px = x - br.left;
      const py = y - br.top;
      for (let i = 0; i < 14; i++) {
        const dot = document.createElement("div");
        dot.className = "fx";
        dot.style.left = `${px}px`;
        dot.style.top = `${py}px`;
        dot.style.background = pickByHash(`${i}:${color}`, [color, "#6dd6ff", "#ffd37a", "#61e08a"]);
        dot.style.setProperty("--dx", `${(Math.random() * 140 - 70).toFixed(0)}px`);
        dot.style.setProperty("--dy", `${(Math.random() * 140 - 90).toFixed(0)}px`);
        board.appendChild(dot);
        dot.addEventListener("animationend", () => dot.remove(), { once: true });
      }
    }
    function burstFxCenter(container, color) {
      const br = container.getBoundingClientRect();
      burstFx(br.left + br.width / 2, br.top + br.height / 2, color);
    }

    let audioCtx = null;
    function playSound(type = "pop") {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        const base = { pop: 520, reward: 740, buy: 480, level: 880, chain: 660 }[type] || 520;
        o.frequency.value = base;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        const t = ctx.currentTime;
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.frequency.exponentialRampToValueAtTime(base * 1.18, t + 0.06);
        o.stop(t + 0.18);
      } catch {
        // 忽略音频失败（某些浏览器策略）
      }
    }

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
        v: 2,
        engine: engine.exportSave(),
        board: items.map((it) => ({ id: it.id, name: it.name, x: it.x, y: it.y })),
        meta: state,
      };
      saveLocal(data);
    }, 250);

    function updateCounters() {
      engine.listUnlocked({ search: els.searchInput.value, sort: els.sortSelect.value });
      els.unlockedCount.textContent = String(engine.unlocked.size);
      els.totalCount.textContent = "∞";
      els.recipeCount.textContent = String(engine.getRecipeCount());
      els.itemCount.textContent = String(items.length);
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
      el.querySelector(".sticker__icon").append(renderIcon({ name, meta, size: 40 }));
      return el;
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

    function spawnOnBoard(name, x, y) {
      const id = uid("st");
      const el = makeStickerDom(name);
      board.appendChild(el);
      const it = { id, name, x, y, el, kind: "sticker" };
      items.push(it);
      positionItem(it);
      bindStickerDrag(it);
      updateCounters();
      save();
      playPlace();
      return it;
    }

    function findBestOverlap(srcEl, excludeId, threshold = 0.18) {
      const r1 = srcEl.getBoundingClientRect();
      let best = null;
      let bestScore = 0;
      for (const other of items) {
        if (other.id === excludeId) continue;
        const r2 = other.el.getBoundingClientRect();
        const score = rectOverlapRatio(r1, r2);
        if (score > bestScore) {
          bestScore = score;
          best = other;
        }
      }
      if (best && bestScore >= threshold) return { best, bestScore };
      return { best: null, bestScore: 0 };
    }

    function removeItemById(id) {
      const idx = items.findIndex((x) => x.id === id);
      if (idx >= 0) {
        items[idx].el.remove();
        items.splice(idx, 1);
      }
    }

    function itemCenter(it) {
      const r = it.el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    let activeEventId = null;
    let combineSinceLastEvent = 0;

    function makeEventDom(name, hint, glyph) {
      const el = document.createElement("div");
      el.className = "eventToken";
      el.innerHTML = `
        <div class="eventToken__icon"></div>
        <div class="sticker__txt">
          <div class="eventToken__name"></div>
          <div class="eventToken__hint"></div>
        </div>
      `;
      el.querySelector(".eventToken__name").textContent = name;
      el.querySelector(".eventToken__hint").textContent = hint;
      const iconWrap = el.querySelector(".eventToken__icon");
      iconWrap.append(
        renderIcon({
          name,
          meta: { colorA: "#dff3ff", colorB: "#7cc7ff", glyph },
          size: 40,
        })
      );
      return el;
    }

    function spawnEvent(type) {
      if (activeEventId) return;
      const bw = board.clientWidth;
      const bh = board.clientHeight;
      const x = Math.random() * (bw - 220) + 10;
      const y = Math.random() * (bh - 100) + 10;

      const id = uid("ev");
      let name = "宝箱";
      let hint = "拖一个【钥匙/工具/金属】过来试试～";
      let glyph = "gift";
      if (type === "cat") {
        name = "彩虹猫";
        hint = "拖一个【鱼/蜂蜜/面包】投喂它～";
        glyph = "paw";
      }
      const el = makeEventDom(name, hint, glyph);
      board.appendChild(el);
      const it = { id, name, x, y, el, kind: "event", eventType: type };
      items.push(it);
      positionItem(it);
      activeEventId = id;

      // 限时事件：45秒后消失
      setTimeout(() => {
        if (activeEventId !== id) return;
        removeItemById(id);
        activeEventId = null;
        showToast(`${name}离开了…`);
      }, 45000);

      showToast(`${name}出现啦！`);
      burstFxCenter(board, "#6dd6ff");
      playSound("pop");
    }

    function maybeSpawnEvent() {
      if (activeEventId) return;
      if (combineSinceLastEvent < 8) return;
      combineSinceLastEvent = 0;
      spawnEvent(pickByHash(`${todayKey()}:${Date.now()}`, ["chest", "cat"]));
    }

    function rewardUnlock(name, coin, exp) {
      ensureDaily();
      const isNew = engine.unlock(name);
      engine.getMeta(name);
      if (isNew) {
        els.searchInput.value = "";
        els.sortSelect.value = "recent";
        pendingLibraryFocusName = name;
        state.daily.unlock += 1;
      }
      addCoins(coin);
      addExp(exp);
      renderLibrary();
      renderRightPanel();
      return isNew;
    }

    function handleEventInteract(sticker, ev) {
      ensureDaily();
      if (!sticker || !ev) return null;
      const s = sticker.name;
      if (ev.eventType === "chest") {
        const ok = /钥|工具|金属|锤|扳手/.test(s);
        if (!ok) {
          showToast("宝箱：需要【钥匙/工具/金属】才能打开～");
          return null;
        }
        // 消耗：贴纸 + 事件
        removeItemById(sticker.id);
        removeItemById(ev.id);
        activeEventId = null;

        state.daily.event += 1;
        const rewardName = pickByHash(`${todayKey()}:chest`, ["宝藏", "闪亮宝藏", "星光宝石", "彩虹徽章"]);
        rewardUnlock(rewardName, 45, 18);
        const created = spawnOnBoard(rewardName, ev.x, ev.y);
        const c = itemCenter(created);
        burstFx(c.x, c.y, "#ffd37a");
        playSound("reward");
        showToast(`宝箱打开！得到：${rewardName}`);
        return created;
      }
      if (ev.eventType === "cat") {
        const ok = /鱼|蜂蜜|面包/.test(s);
        if (!ok) {
          showToast("彩虹猫：想吃【鱼/蜂蜜/面包】～");
          return null;
        }
        removeItemById(sticker.id);
        removeItemById(ev.id);
        activeEventId = null;

        state.daily.event += 1;
        const rewardName = pickByHash(`${todayKey()}:cat`, ["彩虹祝福", "喵喵灵感", "幸运星", "泡泡星"]);
        rewardUnlock(rewardName, 35, 16);
        const created = spawnOnBoard(rewardName, ev.x, ev.y);
        const c = itemCenter(created);
        burstFx(c.x, c.y, "#6dd6ff");
        playSound("reward");
        showToast(`彩虹猫开心！得到：${rewardName}`);
        return created;
      }
      return null;
    }

    function doCombine(src, dst, { auto = false, noChain = false } = {}) {
      ensureDaily();
      const srcKind = src.kind || "sticker";
      const dstKind = dst.kind || "sticker";
      if (srcKind === "event" || dstKind === "event") {
        const ev = srcKind === "event" ? src : dst;
        const st = srcKind === "event" ? dst : src;
        return handleEventInteract(st, ev);
      }

      const res = engine.combine(src.name, dst.name);
      if (!res.ok) {
        if (!auto) showToast(res.reason === "没反应" ? "咕噜…好像没反应" : res.reason);
        playError();
        return null;
      }

      playCombine();

      const prevA = { name: src.name, x: src.x, y: src.y };
      const prevB = { name: dst.name, x: dst.x, y: dst.y };
      removeItemById(src.id);
      if (dst.id !== src.id) removeItemById(dst.id);

      const cx = (src.x + dst.x) / 2 + 18;
      const cy = (src.y + dst.y) / 2 + 14;
      const created = spawnOnBoard(res.name, cx, cy);
      lastCombine = { createdId: created.id, prev: [prevA, prevB] };

      state.daily.craft += 1;
      combineSinceLastEvent += 1;
      addCoins(1);
      addExp(1);

      const cc = itemCenter(created);
      burstFx(cc.x, cc.y, res.isNew ? "#ff5aa5" : "#6dd6ff");

      if (res.isNew) {
        state.daily.unlock += 1;
        addCoins(6);
        addExp(3);
        if (!auto) showToast(`解锁：${res.name}！`);
        playUnlock();
        els.searchInput.value = "";
        els.sortSelect.value = "recent";
        pendingLibraryFocusName = res.name;
      } else {
        playSuccess();
        if (!auto) showToast(`得到：${res.name}`);
      }

      renderLibrary();
      renderRightPanel();
      save();

      if (!noChain && !auto) {
        const steps = autoChain(created);
        if (steps > 0) {
          state.daily.chain += 1;
          showToast(`连锁合成 x${steps + 1}！`);
        }
      }

      maybeSpawnEvent();
      return created;
    }

    function autoChain(startItem) {
      let steps = 0;
      let current = startItem;
      for (let depth = 0; depth < 2; depth++) {
        const { best } = findBestOverlap(current.el, current.id, 0.18);
        if (!best) break;
        const next = doCombine(current, best, { auto: true, noChain: true });
        if (!next) break;
        steps += 1;
        current = next;
      }
      return steps;
    }

    function bindStickerDrag(it) {
      const el = it.el;
      let dragging = false;
      let startX = 0, startY = 0, baseX = 0, baseY = 0;
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
        const r1 = el.getBoundingClientRect();
        let best = null;
        let bestScore = 0;
        for (const other of items) {
          if (other.id === it.id) continue;
          const r2 = other.el.getBoundingClientRect();
          const score = rectOverlapRatio(r1, r2);
          if (score > bestScore) { bestScore = score; best = other; }
        }
        if (best && bestScore >= 0.22) doCombine(it, best);
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
      li.addEventListener("pointerdown", (ev) => beginLibraryDrag(ev, name));
      li.addEventListener("click", () => {
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
        if (best && bestScore >= 0.22) doCombine(created, best);
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
      const inside = ev.clientX >= br.left && ev.clientX <= br.right && ev.clientY >= br.top && ev.clientY <= br.bottom;
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
        if (best && bestScore >= 0.22) doCombine(created, best);
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
      activeEventId = null;
      combineSinceLastEvent = 0;
      updateCounters();
      save();
    }

    function undo() {
      if (!lastCombine) { showToast("没有可撤销的合成"); return; }
      const idx = items.findIndex((x) => x.id === lastCombine.createdId);
      if (idx >= 0) {
        items[idx].el.remove();
        items.splice(idx, 1);
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
      if (!data || (data.v !== 1 && data.v !== 2)) return;
      if (data.engine) engine.importSave(data.engine);
      if (data.meta && typeof data.meta === "object") {
        // 合并到默认 state，避免缺字段
        Object.assign(state, data.meta);
        state.daily = Object.assign(
          { craft: 0, unlock: 0, chain: 0, event: 0, order: 0, claimed: {} },
          data.meta.daily || {}
        );
        state.decorOwned = Object.assign({}, data.meta.decorOwned || {});
        state.orders = Array.isArray(data.meta.orders) ? data.meta.orders : [];
      }
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
          v: 2,
          engine: engine.exportSave(),
          board: items.filter((x) => (x.kind || "sticker") === "sticker").map((it) => ({ id: it.id, name: it.name, x: it.x, y: it.y })),
          meta: state,
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
          if (!obj || (obj.v !== 1 && obj.v !== 2)) throw new Error("存档版本不支持");
          clearBoard();
          engine.importSave(obj.engine);
          if (Array.isArray(obj.board)) {
            for (const it of obj.board) spawnOnBoard(it.name, Number(it.x) || 20, Number(it.y) || 20);
          }
          if (obj.meta && typeof obj.meta === "object") {
            Object.assign(state, obj.meta);
            state.daily = Object.assign(
              { craft: 0, unlock: 0, chain: 0, event: 0, order: 0, claimed: {} },
              obj.meta.daily || {}
            );
            state.decorOwned = Object.assign({}, obj.meta.decorOwned || {});
            state.orders = Array.isArray(obj.meta.orders) ? obj.meta.orders : [];
          }
          renderLibrary();
          renderRightPanel();
          showToast("已导入存档");
          save();
        } catch (e) {
          showToast(`导入失败：${e?.message || "格式错误"}`);
        } finally {
          els.fileImport.value = "";
        }
      });
      els.btnHelp.addEventListener("click", () => els.helpDialog.showModal());
      els.btnMusic.addEventListener("click", () => {
        const isPlaying = toggleBackgroundMusic();
        els.btnMusic.textContent = isPlaying ? "🔇" : "🎵";
        showToast(isPlaying ? "背景音乐已开启" : "背景音乐已关闭");
      });
    }

    function bindLibrarySearch() {
      els.searchInput.addEventListener("input", () => renderLibrary());
      els.sortSelect.addEventListener("change", () => renderLibrary());
    }

    function bootstrapBoard() {
      if (items.length) return;
      const br = board.getBoundingClientRect();
      const cx = br.width / 2;
      const cy = br.height / 2;
      const bases = engine.getBaseElements();
      const offsets = [[-180, -40],[-40, -80],[100, -40],[-100, 60],[60, 60]];
      bases.forEach((n, i) => spawnOnBoard(n, cx + offsets[i][0], cy + offsets[i][1]));
    }

    return {
      start() {
        load();
        ensureDaily();

        // 首次进入给点启动资金，避免“无事可做”
        if (!state.coins) state.coins = 60;
        if (!Array.isArray(state.orders) || state.orders.length === 0) state.orders = generateDailyOrders();

        bindTopbar();
        bindLibrarySearch();
        renderLibrary();
        bootstrapBoard();
        updateCounters();
        renderRightPanel();
        // 定时随机事件：每30秒尝试一次（若合成进度未触发）
        if (!createGame._evtTimer) {
          createGame._evtTimer = setInterval(() => {
            if (activeEventId) return;
            // 轻量随机：有一定概率刷事件
            if (Math.random() < 0.28) spawnEvent(pickByHash(`${todayKey()}:${Date.now()}`, ["chest", "cat"]));
          }, 30000);
        }
        showToast("欢迎来到萌萌合成！");
      },
      engine,
    };
  }

  // ===== main.js =====
  function boot() {
    const els = {
      board: document.getElementById("board"),
      library: document.getElementById("library"),
      searchInput: document.getElementById("searchInput"),
      sortSelect: document.getElementById("sortSelect"),
      unlockedCount: document.getElementById("unlockedCount"),
      totalCount: document.getElementById("totalCount"),
      recipeCount: document.getElementById("recipeCount"),
      itemCount: document.getElementById("itemCount"),
      coinCount: document.getElementById("coinCount"),
      homeLevel: document.getElementById("homeLevel"),
      orders: document.getElementById("orders"),
      dailyTasks: document.getElementById("dailyTasks"),
      decors: document.getElementById("decors"),
      btnUndo: document.getElementById("btnUndo"),
      btnTidy: document.getElementById("btnTidy"),
      btnClear: document.getElementById("btnClear"),
      btnExport: document.getElementById("btnExport"),
      fileImport: document.getElementById("fileImport"),
      btnMusic: document.getElementById("btnMusic"),
      btnHelp: document.getElementById("btnHelp"),
      helpDialog: document.getElementById("helpDialog"),
      toast: document.getElementById("toast"),
    };
    const game = createGame(els);
    game.start();
    window.game = game;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
