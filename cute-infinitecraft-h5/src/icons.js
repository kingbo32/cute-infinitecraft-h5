import { pickByHash } from "./util.js";

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
  grad.append(
    svgEl("stop", { offset: "0", "stop-color": colorA }),
    svgEl("stop", { offset: "1", "stop-color": colorB })
  );
  defs.append(grad);
  svg.append(defs);

  const r = svgEl("rect", { x: "6", y: "6", width: "52", height: "52", rx: "18", fill: `url(#${gid})` });
  r.style.filter = "drop-shadow(0px 6px 10px rgba(0,0,0,.12))";
  svg.append(r);

  // 高光
  svg.append(svgEl("path", { d: "M16 18 C 20 12, 30 10, 40 12 C 33 16, 25 18, 16 18Z", fill: "rgba(255,255,255,.45)" }));
  return svg;
}

function glyphPath(type) {
  // 简化Q版图标：尽量圆润、可爱
  switch (type) {
    case "drop":
      return "M32 12 C26 22 20 28 20 36a12 12 0 0 0 24 0c0-8-6-14-12-24Z";
    case "flame":
      return "M32 14c2 10-8 10-6 20 2 10 18 10 18-2 0-10-6-10-6-18-2 4-4 6-6 8 0-4 0-6 0-8Z";
    case "leaf":
      return "M16 38c18 6 28-4 32-22-16 2-30 10-32 22Zm10 0c6-8 14-12 22-14";
    case "mountain":
      return "M10 46l14-22 10 14 8-10 12 18H10Z";
    case "cloud":
      return "M22 44h22a10 10 0 0 0 0-20 12 12 0 0 0-22-2 9 9 0 0 0 0 22Z";
    case "bolt":
      return "M34 10 16 36h14l-2 18 20-28H34l0-16Z";
    case "rock":
      return "M20 46c-6-2-8-10-4-16 4-6 8-10 14-10 10 0 18 6 18 16 0 6-4 10-10 10H20Z";
    case "sprout":
      return "M32 48V28c-8 0-14-6-14-14 10 0 16 6 14 14 2-8 8-14 18-14 0 8-6 14-18 14v20Z";
    case "seed":
      return "M32 18c8 0 14 6 14 14s-6 18-14 18-14-10-14-18 6-14 14-14Z";
    case "tree":
      return "M32 12c10 0 18 8 18 18 0 8-6 14-14 16v6H28v-6c-8-2-14-8-14-16 0-10 8-18 18-18Z";
    case "flower":
      return "M32 28c4-8 14-6 14 2 0 4-4 8-10 8 6 0 10 4 10 8 0 8-10 10-14 2-4 8-14 6-14-2 0-4 4-8 10-8-6 0-10-4-10-8 0-8 10-10 14-2Z";
    case "wind":
      return "M14 26h28c6 0 8-8 2-10-4-2-8 2-6 6M14 36h34c8 0 10-10 2-12-5-2-10 2-8 8M14 46h20c6 0 8-8 2-10";
    case "ingot":
      return "M18 40l8-14h20l-8 14H18Zm4-18 6-10h24l-6 10H22Z";
    case "wrench":
      return "M42 14a10 10 0 0 0-10 10c0 2 0 2 1 4L18 43l3 7 7-3 15-15c2 1 2 1 4 1a10 10 0 0 0 0-20 6 6 0 0 0 2 9l-4 4-5-5 4-4a6 6 0 0 0-2-3Z";
    case "sparkle":
      return "M32 10l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Zm18 18 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z";
    case "rain":
      return "M22 36h22a10 10 0 0 0 0-20 12 12 0 0 0-22-2 9 9 0 0 0 0 22Zm6 6-4 10m12-10-4 10m12-10-4 10";
    case "dots":
      return "M20 26a4 4 0 1 0 0.01 0ZM44 24a4 4 0 1 0 0.01 0ZM30 40a4 4 0 1 0 0.01 0ZM46 42a3.5 3.5 0 1 0 0.01 0ZM18 44a3.5 3.5 0 1 0 0.01 0Z";
    case "blob":
      return "M22 44c-6-6-2-16 4-20 4-2 6-8 12-8 10 0 18 10 14 20-4 10-22 14-30 8Z";
    case "heart":
      return "M32 48s-16-9-16-20a9 9 0 0 1 16-6 9 9 0 0 1 16 6c0 11-16 20-16 20Z";
    case "star":
      return "M32 12l6 14 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2 6-14Z";
    case "moon":
      return "M40 14c-10 2-16 12-14 22s12 16 22 14c-4 4-10 6-16 6-12 0-22-10-22-22 0-10 6-18 14-20 6-2 12-2 16 0Z";
    case "sun":
      return "M32 18a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm0-10v8m0 40v8M8 32h8m40 0h8M14 14l6 6m30 30 6 6M50 14l-6 6M14 50l6-6";
    case "music":
      return "M42 14v26a6 6 0 1 1-4-6V20l-16 4v20a6 6 0 1 1-4-6V18l24-6Z";
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
    default:
      return "M20 20h24v24H20Z";
  }
}

export function renderIcon({ name, meta, size = 40 }) {
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
