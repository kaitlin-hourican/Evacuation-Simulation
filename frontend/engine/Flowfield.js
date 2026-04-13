export class Flowfield {
  constructor(grid) {
    this.grid = grid;
    this.neighbours = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    this.costField = []; // distance cost to goal per cell
    this.maxCost = 0;

    this.vectorField = []; // coord direction vectors
  }

  #dijkstra() {
    const queue = this.#seedGoals();

    while (queue.length !== 0) {
      const current = queue.shift();
      const currentCost = this.costField[current.row][current.col];

      for (const [dr, dc] of this.neighbours) {
        const row = current.row + dr;
        const col = current.col + dc;

        if (
          this.grid.isWalkable(row, col) &&
          this.costField[row][col] === Infinity
        ) {
          const newCost = (this.costField[row][col] = currentCost + 1);
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

  #computeVectorField() {
    // initialise vector field
    this.vectorField = Array.from({ length: this.grid.rows }, () =>
      new Array(this.grid.cols).fill({ x:0, y: 0})
    );

    // loop cells
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        let current = this.costField[row][col];
        let bestRow = -1;
        let bestCol = -1;
        let bestCost = Infinity;

        // skip obstacle cells - ie !isWalkable
        if (!this.grid.isWalkable(row, col)) continue;
        // skip if cost is Infinity - out of bounds
        if (current === Infinity) continue;

        // loop neighbours
        for (const [dr, dc] of this.neighbours) {
          const nRow = row + dr;
          const nCol = col + dc;

          if (nRow < 0 || nRow >= this.grid.rows || nCol < 0 || nCol >= this.grid.cols) continue;

          const neighbour = this.costField[nRow][nCol];

          if (neighbour < bestCost) {
            bestCost = neighbour;
            bestRow = nRow;
            bestCol = nCol;
          }

        }

        if (bestCost !== Infinity) {
          this.vectorField[row][col] = { x: bestCol - col, y: bestRow - row };
        }
      }
    }
  }

  getVector(row, col) {
    if (row < 0 || row >= this.grid.rows || col < 0 || col >= this.grid.cols) return { x: 0, y: 0 };

    return this.vectorField[row][col]
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
    this.#computeVectorField();
  }

  drawHeatMap(ctx) {
    ctx.globalAlpha = 0.6;

    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const cost = this.costField[row][col];

        if (cost === Infinity) continue;

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

  drawVectorField(ctx) {
    if (!this.vectorField.length) return;

    const length = this.grid.tileSize * 0.4;
    ctx.strokeStyle = "#6e7681";
    ctx.lineWidth = 0.5;

    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const vector = this.vectorField[row][col];

        if (vector.x === 0 && vector.y === 0) continue;

        const cx = col * this.grid.tileSize + this.grid.tileSize / 2;
        const cy = row * this.grid.tileSize + this.grid.tileSize / 2;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + vector.x * length, cy + vector.y * length);
        ctx.stroke();
      }
    }
  }
}
