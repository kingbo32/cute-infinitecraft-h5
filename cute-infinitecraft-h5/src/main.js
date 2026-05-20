import { createGame } from "./play.js";

const els = {
  board: document.getElementById("board"),
  library: document.getElementById("library"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  unlockedCount: document.getElementById("unlockedCount"),
  totalCount: document.getElementById("totalCount"),
  recipeCount: document.getElementById("recipeCount"),
  itemCount: document.getElementById("itemCount"),
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

// 给控制台一个小入口，方便你后续扩充配方/调试
// window.game = game;

