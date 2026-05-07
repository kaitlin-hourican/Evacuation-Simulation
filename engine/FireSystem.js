import { FIRE_STATES, TILE_TYPES } from "./constants.js";

export class FireSystem {
  constructor(grid, spreadInterval, onSpread) {
    this.grid = grid;
    this.intensityField = [];
    this.spreadInterval = spreadInterval;
    this.spreadTimer = 0;
    this.flashpoint = 100;
    this.onSpread = onSpread;
  }

  draw(ctx) {
    if (this.intensityField.length === 0) return;

    const wrapper = this.grid.wrapper;
    const tileSize = this.grid.tileSize;

    const startCol = Math.floor(wrapper.scrollLeft / tileSize);
    const endCol = Math.ceil(
      (wrapper.scrollLeft + wrapper.clientWidth) / tileSize,
    );
    const startRow = Math.floor(wrapper.scrollTop / tileSize);
    const endRow = Math.ceil(
      (wrapper.scrollTop + wrapper.clientHeight) / tileSize,
    );

    const i0 = Math.max(0, startRow);
    const i1 = Math.min(this.grid.rows, endRow);
    const j0 = Math.max(0, startCol);
    const j1 = Math.min(this.grid.cols, endCol);

    ctx.save();
    ctx.globalAlpha = 0.75;

    for (let row = i0; row < i1; row++) {
      for (let col = j0; col < j1; col++) {
        const tile = this.intensityField[row][col];

        if (tile.state === FIRE_STATES.COOL) continue;

        const intensity = tile.temp / 255;
        const r = Math.floor(218 + (255 - 218) * (1 - intensity));
        const g = Math.floor(31 + (193 - 31) * (1 - intensity));
        const b = Math.floor(5 + (31 - 5) * (1 - intensity));
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }

    ctx.restore();
  }

  #initIntensityField() {
    this.intensityField = Array.from({ length: this.grid.rows }, () =>
      Array.from({ length: this.grid.cols }, () => ({
        temp: 0,
        state: FIRE_STATES.COOL,
      })),
    );
  }

  #seedFire() {
    const queue = [];

    for (const { row, col } of this.grid.getFireCells()) {
      this.intensityField[row][col] = {
        temp: this.flashpoint,
        state: FIRE_STATES.BURNING,
      };
      queue.push({ row, col });
    }

    return queue;
  }

  #getBurnRate(row, col) {
    const tile = this.grid.getTile(row, col);
    return tile === TILE_TYPES.OBSTACLE ? 2.0 : 0.5;
  }

  spread() {
    const neighbours = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1], // cardinal
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1], // diagonal
    ];

    const nextField = Array.from(
      { length: this.grid.rows },
      () => new Array(this.grid.cols),
    );

    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const current = this.intensityField[row][col];
        const tileType = this.grid.getTile(row, col);

        let nextTemp = current.temp;

        for (const [dr, dc] of neighbours) {
          const nr = row + dr;
          const nc = col + dc;

          if (!this.grid.inBounds(nr, nc)) continue;

          const neighbour = this.intensityField[nr][nc];

          if (neighbour.state === FIRE_STATES.BURNING) {
            nextTemp += neighbour.temp * this.#getBurnRate(row, col) * 0.15;
          }
        }

        let nextState = FIRE_STATES.COOL;

        if (nextTemp >= this.flashpoint) {
          nextState = FIRE_STATES.BURNING;
        } else if (nextTemp > 20) {
          nextState = FIRE_STATES.HEATING;
        }

        nextField[row][col] = {
          temp: Math.min(nextTemp, 255),
          state: nextState,
        };
      }
    }

    this.intensityField = nextField;

    this.onSpread();
  }

  getDamage(row, col) {
    if (!this.grid.inBounds(row, col)) return;
    if (this.grid.getTile(row, col) === null) return 0;

    return this.intensityField[row][col].temp / 255;
  }

  start() {
    if (this.intensityField.length === 0) {
      this.#initIntensityField();
      this.#seedFire();
    }
  }

  update(deltaTime) {
    this.spreadTimer += deltaTime;
    if (this.spreadTimer >= this.spreadInterval) {
      this.spreadTimer = 0;
      this.spread();
    }
  }

  reset() {
    this.intensityField = [];
  }

  loadFromGrid() {
    this.#initIntensityField();
    this.#seedFire();
  }
}
