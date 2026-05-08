import { Grid } from "./engine/Grid.js";
import { Toolbar } from "./engine/Toolbar.js";
import { Flowfield } from "./engine/Flowfield.js";
import { InputHandler } from "./engine/InputHandler.js";
import { FireSystem } from "./engine/FireSystem.js";
import { Simulation } from "./engine/Simulation.js";
import { StatsController } from "./engine/StatsController.js";
import { tools } from "./engine/tools.js";
import {
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  TILESIZE_METRES,
  TILE_TYPES,
} from "./engine/constants.js";

// canvas set up
const canvas = document.getElementById("sim-canvas");
const ctx = canvas.getContext("2d");

const getScale = (size) => size / TILESIZE_METRES;
let currentScale = getScale(TILE_SIZE);

// sysmtems
const grid = new Grid(canvas, MAP_COLS, MAP_ROWS, TILE_SIZE);
const ui = new Toolbar(grid);
const input = new InputHandler(canvas, grid, editRender, () => {
  ui.updateAgentCap(grid.getSpawnCells().length);
});
const fireSystem = new FireSystem(grid, 2.0, () => flowfield.compute());
const flowfield = new Flowfield(grid, fireSystem);
const statsController = new StatsController();
const simulation = new Simulation(
  grid,
  flowfield,
  fireSystem,
  ui._params,
  statsController,
  ctx,
  currentScale,
  render,
);

input.init();

// event listeners

// zoom
const zoomSlider = document.getElementById("zoom-slider");
zoomSlider.value = TILE_SIZE;

zoomSlider.addEventListener("input", (e) => {
  const newTileSize = parseInt(e.target.value);
  grid.setZoom(newTileSize);

  const newScale = newTileSize / TILESIZE_METRES;
  simulation.updateScale(newScale);
  render();
});

// lifecycle
document.addEventListener("app-mode-change", (e) => {
  if (e.detail === "run") {
    flowfield.compute();

    if (!flowfield.isReachable()) {
      ui._showStatus("No valid path to goal — check for enclosed spawn zones");
      ui._updateModeUI("edit");
      return;
    }

    if (parseInt(ui._params.agentCount.value) === 0) {
      ui._showStatus("No agents to simulate — place spawn tiles first");
      ui._updateModeUI("edit");
      return;
    }

    simulation.spawnAgents();

    grid.draw([], "drawTile", "obstacle");
    fireSystem.draw(ctx);

    simulation.start();
  } else {
    simulation.stop();
    simulation.clear();
    fireSystem.reset();
    editRender();
  }
});

document.addEventListener("app-tool-change", (e) => {
  if (e.detail === "clear") {
    grid.clear();
    fireSystem.reset();
    ui.updateAgentCap(0);
    editRender();
    ui._setBrush("drawTile");
  }
});

document.addEventListener("app-export", () => {
  const data = {
    meta: {
      version: 1,
      cols: grid.cols,
      rows: grid.rows,
      exportedAt: new Date().toISOString(),
    },
    settings: {
      agentCount: parseInt(ui._params.agentCount.value),
      agentSpeed: parseFloat(ui._params.agentSpeed.value),
      fireSpread: parseFloat(ui._params.fireSpread.value),
    },
    tilemap: grid.tilemap,
    stats: simulation.stats,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evacuation-map-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.addEventListener("app-import", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        loadMap(data);
      } catch {
        ui._showStatus("Invalid JSON file — could not load map");
      }
    };
    reader.readAsText(file);
  });
  input.click();
});

document.addEventListener("app-simulation-complete", () => {
  ui._updateModeUI("edit");
  simulation.clear();
  ui.openStatsPanel();
  ui._showStatus("Simulation complete");
  editRender();
});

function loadMap(data) {
  if (!data.tilemap || !data.meta) {
    ui._showStatus("Invalid map file — missing required fields");
    return;
  }
  if (data.meta.cols !== grid.cols || data.meta.rows !== grid.rows) {
    ui._showStatus(
      `Map size mismatch — expected ${grid.cols}×${grid.rows}, got ${data.meta.cols}×${data.meta.rows}`,
    );
    return;
  }

  if (simulation.isRunning) {
    simulation.stop();
    simulation.clear();
    fireSystem.reset();
    ui._updateModeUI("edit");
  }

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      grid.tilemap[row][col] = data.tilemap[row][col] ?? TILE_TYPES.EMPTY;
    }
  }

  if (data.settings) {
    if (data.settings.agentCount)
      ui._params.agentCount.value = data.settings.agentCount;
    if (data.settings.agentSpeed)
      ui._params.agentSpeed.value = data.settings.agentSpeed;
    if (data.settings.fireSpread)
      ui._params.fireSpread.value = data.settings.fireSpread;
  }

  // firesystem
  fireSystem.reset();
  fireSystem.loadFromGrid(grid);

  // agent num cap
  const spawnCount = grid.getSpawnCells().length;
  ui.updateAgentCap(spawnCount);

  ui._showStatus("Map loaded successfully");
  editRender();
}

function render() {
  if (simulation.isRunning) {
    simulationRender();
  } else {
    editRender();
  }
}

function simulationRender() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (simulation.gridSnapshot) {
    ctx.drawImage(simulation.gridSnapshot, 0, 0);
  }

  fireSystem.draw(ctx);
  simulation.draw();
}

function editRender() {
  let previews = [];

  if (input.currentMouseTile && !input.isPainting) {
    previews.push(input.currentMouseTile);
  }

  if (input.isPainting && input.startTile && input.currentMouseTile) {
    if (input.currentTool === "drawLine") {
      previews = tools.getLineTiles(input.startTile, input.currentMouseTile);
    } else if (input.currentTool === "drawRect") {
      previews = tools.getRectTiles(input.startTile, input.currentMouseTile);
    } else if (input.currentTool === "drawRectFilled") {
      previews = tools.getFilledRectTiles(
        input.startTile,
        input.currentMouseTile,
      );
    }
  }

  grid.draw(previews, input.currentTool, input.tileType);
  fireSystem.draw(ctx);
  simulation.draw();
}

editRender();
