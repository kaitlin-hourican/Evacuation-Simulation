import { TILE_TYPES } from "./constants.js";

export class Flowfield {
  constructor(grid) {
    this.grid = grid;

    this.costField = []; // distance cost to goal per cell
    this.maxCost = 0;

    // this.vectorField = [];  // coord direction vectors
  }

  #dijkstra() {
  const queue = this.#seedGoals();
  const neighbours = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length !== 0) {
    const current = queue.shift();
    const currentCost = this.costField[current.row][current.col];

    for (const [dr, dc] of neighbours) {
      const row = current.row + dr;
      const col = current.col + dc;

      if (this.grid.isWalkable(row, col) && this.costField[row][col] === Infinity) {
        const newCost = this.costField[row][col] = currentCost + 1;
        if (newCost > this.maxCost) this.maxCost = newCost;
        queue.push({ row, col });
      }
    }
  }
}

  #initCostField() {
  this.costField = Array.from({ length: this.grid.rows }, () =>
    new Array(this.grid.cols).fill(Infinity)
  );
  this.maxCost = 0; 
}

  #seedGoals() {
    const queue = [];

    for (const { row, col } of this.grid.getGoalCells()) {
      this.costField[row][col] = 0;
      queue.push({ row, col });
    }

    return queue;
  }

 compute() {
  this.#initCostField();
  this.#dijkstra();
}

  drawHeatMap(ctx) {
    ctx.globalAlpha = 0.6;

    for (let row = 0; row < this.grid.rows; row++) {
        for (let col = 0; col < this.grid.cols; col++) {
            const cost = this.costField[row][col];

            if(cost === Infinity) continue;

            const normalisedCost = cost / this.maxCost;

            const red = Math.floor(normalisedCost * 255);
            const green = Math.floor((1 - normalisedCost) * 255);
            ctx.fillStyle = `rgb(${red}, ${green}, 0)`;

            let x = col * this.grid.tileSize;
            let y = row * this.grid.tileSize;

            ctx.fillRect(x, y, this.grid.tileSize, this.grid.tileSize);


        }
    }

    ctx.globalAlpha = 1.0;
  }
}
