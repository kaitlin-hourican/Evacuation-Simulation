import { TILE_TYPES } from "./constants.js";
import { tools } from "./tools.js";

export class InputHandler {
  constructor(canvas, grid, onRender, onGridChange = () => {}) {
    this.canvas = canvas;
    this.grid = grid;
    this.onRender = onRender;
    this.onGridChange = onGridChange;

    this.brush = "drawTile";
    this.tileType = "obstacle";
    this.isPainting = false;
    this.startTile = null;
    this.currentMouseTile = null;
    this.isPaused = false;
    this.currentTool = this.brush;
  }

  init() {
    this.canvas.addEventListener("mousedown", (e) => this.#onMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.#onMouseMove(e));
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("mouseup", (e) => this.#onMouseUp(e));

    document.addEventListener("app-tool-change", (e) => {
      if (typeof e.detail === "string") {
        this.brush = e.detail;
        this.tileType = "obstacle";
      } else {
        this.brush = e.detail.brush ?? this.brush;
        this.tileType = e.detail.tileType ?? this.tileType;
      }

      this.currentTool = this.brush;
    });

    document.addEventListener("app-mode-change", (e) => {
      this.isPaused = e.detail === "run";
      this.canvas.style.cursor = this.isPaused ? "default" : "crosshair";
    });
  }

  #onMouseDown(e) {
    if (this.isPaused) return;
    this.isPainting = true;
    this.startTile = this.grid.pixelToTile(e.offsetX, e.offsetY);

    if (this.brush === "drawTile" || e.button === 2) {
      this.#paint(e);
    }
  }

  #onMouseMove(e) {
    this.currentMouseTile = this.grid.pixelToTile(e.offsetX, e.offsetY);

    if (this.isPainting && !this.isPaused) {
      if (this.brush === "drawTile" || this.brush === "erase") {
        this.#paint(e);
      }
    }

    if (!this.isPaused) this.onRender();
  }

  #onMouseUp(e) {
    if (this.isPaused || !this.isPainting) return;

    const endTile = this.grid.pixelToTile(e.offsetX, e.offsetY);

    if (this.startTile && endTile) {
      let tilesToPlace = [];

      if (this.brush === "drawLine") {
        tilesToPlace = tools.getLineTiles(this.startTile, endTile);
      } else if (this.brush === "drawRect") {
        tilesToPlace = tools.getRectTiles(this.startTile, endTile);
      } else if (this.brush === "drawRectFilled") {
        tilesToPlace = tools.getFilledRectTiles(this.startTile, endTile);
      }

      tilesToPlace.forEach((t) => {
        tools.paintTile(this.grid, t, this.tileType);
      });

      if (tilesToPlace.length > 0) {
        this.onRender();
        this.onGridChange();
      }

      this.isPainting = false;
      this.startTile = null;
    }
  }

  #paint(e) {
    const tile = this.grid.pixelToTile(e.offsetX, e.offsetY);
    if (!tile || this.isPaused) return;

    tools.paintTile(this.grid, tile, this.tileType);

    this.onRender();
    this.onGridChange();
  }
}
