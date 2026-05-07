// handles the grid structure for the simulation
// stores the tilemap, manages tile access, and handles rendering to the canvas

import { TILE_COLOURS, DEFAULT_COLOURS, TILE_TYPES } from "./constants.js";

export class Grid {
  constructor(canvas, cols, rows, tileSize) {
    // canvas and drawing context
    this.canvas = canvas;
    this.wrapper = document.getElementById("canvas-wrap");
    this.ctx = canvas.getContext("2d");

    // grid dimensions
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;

    // internal 2d array storing tile types
    this.tilemap = this.#createTilemap();

    // resize canvas to match grid dimensions
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;

    this.updateResolution(tileSize);
  }

  // creates the initial tilemap as a 2d array
  // every tile starts as EMPTY
  #createTilemap() {
    const tilemap = [];

    for (let row = 0; row < this.rows; row++) {
      const rowArray = [];

      for (let col = 0; col < this.cols; col++) {
        rowArray.push(TILE_TYPES.EMPTY);
      }

      tilemap.push(rowArray);
    }

    return tilemap;
  }

  // checks if a row and column are within grid bounds
  // prevents accessing tiles outside the tilemap
  inBounds(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  drawPreviewTiles(row, col) {
    this.previewTiles.push({row, col});
  }

  // draws the entire grid to the canvas
  draw(previewTiles = [], currentTool = "drawTile", tileType = "obstacle") {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
 
    const worldScale = this.tileSize / 0.5; 

    // frustum culling - means you figure out how much is actually visible
    const startCol = Math.floor(this.wrapper.scrollLeft / this.tileSize);
    const endCol   = Math.ceil((this.wrapper.scrollLeft + this.wrapper.clientWidth) / this.tileSize);
    const startRow = Math.floor(this.wrapper.scrollTop / this.tileSize);
    const endRow   = Math.ceil((this.wrapper.scrollTop + this.wrapper.clientHeight) / this.tileSize);

    // grid boundaries
    const i0 = Math.max(0, startRow);
    const i1 = Math.min(this.rows, endRow);
    const j0 = Math.max(0, startCol);
    const j1 = Math.min(this.cols, endCol);

    // only draw on-screen tiles
    for (let row = i0; row < i1; row++) {
        for (let col = j0; col < j1; col++) {
            const tileValue = this.tilemap[row][col];
            
            if (tileValue === TILE_TYPES.EMPTY) continue;

            const x = col * this.tileSize;
            const y = row * this.tileSize;
            const colours = TILE_COLOURS[tileValue] ?? DEFAULT_COLOURS;

            this.ctx.fillStyle = colours.fill;
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
            
            this.ctx.strokeStyle = colours.stroke;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x + 0.5, y + 0.5, this.tileSize - 1, this.tileSize - 1);
        }
    }

    previewTiles.forEach(tile => {
    // Map tileType string to TILE_TYPES constant
    const typeMap = {
      obstacle: TILE_TYPES.OBSTACLE,
      spawn:    TILE_TYPES.SPAWN,
      goal:     TILE_TYPES.GOAL,
      fire:     TILE_TYPES.FIRE,
      erase:    TILE_TYPES.EMPTY,
    };

    const type = typeMap[tileType] ?? TILE_TYPES.OBSTACLE;
    
    // For erase, show a faded red to indicate deletion
    const baseColor = type === TILE_TYPES.EMPTY
      ? "#ff4444"
      : TILE_COLOURS[type].fill;

    this.ctx.fillStyle = baseColor + "55";
    this.ctx.fillRect(
      tile.col * this.tileSize,
      tile.row * this.tileSize,
      this.tileSize,
      this.tileSize
    );
  });
  }

   updateResolution(newSize) {
  this.tileSize = newSize;

  // CSS size and canvas size are the same — no dpr scaling
  this.canvas.width  = this.cols * this.tileSize;
  this.canvas.height = this.rows * this.tileSize;
  this.canvas.style.width  = `${this.cols * this.tileSize}px`;
  this.canvas.style.height = `${this.rows * this.tileSize}px`;
  this.canvas.style.backgroundSize = `${this.tileSize}px ${this.tileSize}px`;
}

  setZoom(value) {
    this.updateResolution(value);
    this.draw(); 
  }



  // sets the tile at a given row and column to a new type
  // ignores the request if the tile is outside the grid
  setTile(row, col, value) {
    if (!this.inBounds(row, col)) return;
    this.tilemap[row][col] = value;
  }

  // returns the tile type at a given position
  // returns null if the position is outside the grid
  getTile(row, col) {
    if (!this.inBounds(row, col)) return null;
    return this.tilemap[row][col];
  }

  // checks whether a tile can be walked on by an agent
  // currently only EMPTY tiles are walkable
  isWalkable(row, col) {
    if (!this.inBounds(row, col)) return false;
    return this.tilemap[row][col] !== TILE_TYPES.OBSTACLE;
  }

  hasGoal() {
    return this.getGoalCells().length > 0;
  }

  getGoalCells() {
    const goals = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {

        if (this.getTile(row, col) === TILE_TYPES.GOAL) {
          goals.push({ row, col });
        }
      }
    }

    return goals;
  }

  hasSpawn() {
    return this.getSpawnCells().length > 0;
  }

  getSpawnCells() {
    const spawn = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {

        if (this.getTile(row, col) === TILE_TYPES.SPAWN) {
          spawn.push({ row, col });
        }
      }
    }

    return spawn;
  }

  getFireCells() {
    const fire = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {

        if (this.getTile(row, col) === TILE_TYPES.FIRE) {
          fire.push({ row, col });
        }
      }
    }

    return fire;
  }


  // converts canvas pixel coordinates to a grid tile position
  // useful for mapping mouse clicks to tiles
  // returns null if the pixel lies outside the grid
  pixelToTile(x, y) {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);

    if (!this.inBounds(row, col)) return null;

    return { row, col };
  }

  // converts a tile position to the pixel coordinates
  // of the tile's top left corner
  tileToPixel(row, col) {
    return {
      x: col * this.tileSize,
      y: row * this.tileSize,
    };
  }

  // clears the grid by resetting all tiles to EMPTY
  clear() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.tilemap[row][col] = TILE_TYPES.EMPTY;
      }
    }
  }
}
