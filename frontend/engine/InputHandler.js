import { tools } from "./tools.js";

export class InputHandler {
  #grid;
  #ui;
  #canvas;
  #flowfield;
  #simulation;

  #onRender;

  #currentTool = "draw";
  #activeTool = "draw";
  #isPainting = false;

  constructor(canvas, grid, ui, flowfield, simulation, onRender) {
    this.#canvas = canvas;
    this.#grid = grid;
    this.#ui = ui;
    this.#flowfield = flowfield;
    this.#simulation = simulation;
    this.#onRender = onRender;
  }

  init() {
    this.#canvas.addEventListener("mousedown", (e) => this.#onMouseDown(e));
    this.#canvas.addEventListener("mousemove", (e) => this.#onMouseMove(e));
    this.#canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("mouseup", () => (this.#isPainting = false));

    document.addEventListener("tool-change", (e) => this.#onToolChange(e));
    document.addEventListener("mode-change", (e) => this.#onModeChange(e));
  }

  #onMouseDown(e) {
    if (this.#ui.mode !== "edit") return;

    this.#isPainting = true;
    this.#activeTool = e.button === 2 ? "erase" : this.#currentTool;
    this.#paint(e);
  }

  #onMouseMove(e) {
    if (this.#isPainting) this.#paint(e);
  }

  #onToolChange(e) {
    if (e.detail === "clear") {
        this.#grid.clear();
        this.#grid.draw();
        return;
    }

    this.#currentTool = e.detail;
  }

  #onModeChange(e) {
    this.#canvas.style.cursor = e.detail === "edit" ? "crosshair" : "default";
  
    if (e.detail === "run") {
        this.#flowfield.compute();
        this.#simulation.spawnAgents();
        this.#onRender();
    }

    if (e.detail === "edit") {
      this.#simulation.clear();
      this.#onRender();
    }
}

  #paint(e) {
    const rect = this.#canvas.getBoundingClientRect();
    const tile = this.#grid.pixelToTile(
        (e.clientX - rect.left) * (this.#canvas.width / rect.width),
        (e.clientY - rect.top) * (this.#canvas.height / rect.height)
    );

    if (!tile) return;

    if (tools[this.#activeTool]) {
        tools[this.#activeTool](this.#grid, tile);
        this.#grid.draw();
    }
  }
}
