import { TILE_TYPES } from "./constants.js";

class MinHeap {
  #heap = [];
  push(item, priority) {
    this.#heap.push({ item, priority });
    this.#bubbleUp();
  }
  pop() {
    const top = this.#heap[0];
    const end = this.#heap.pop();
    if (this.#heap.length > 0) {
      this.#heap[0] = end;
      this.#sinkDown(0);
    }
    return top?.item;
  }
  get length() {
    return this.#heap.length;
  }
  #bubbleUp() {
    let i = this.#heap.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.#heap[parent].priority <= this.#heap[i].priority) break;
      [this.#heap[parent], this.#heap[i]] = [this.#heap[i], this.#heap[parent]];
      i = parent;
    }
  }
  #sinkDown(i) {
    const n = this.#heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1,
        r = 2 * i + 2;
      if (l < n && this.#heap[l].priority < this.#heap[smallest].priority)
        smallest = l;
      if (r < n && this.#heap[r].priority < this.#heap[smallest].priority)
        smallest = r;
      if (smallest === i) break;
      [this.#heap[smallest], this.#heap[i]] = [
        this.#heap[i],
        this.#heap[smallest],
      ];
      i = smallest;
    }
  }
}

export class Flowfield {
  constructor(grid, fireSystem = null) {
    this.grid = grid;
    this.fireSystem = fireSystem;
    this.neighbours = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1], // cardinal
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1], // diagonal
    ];

    this.costField = [];
    this.maxCost = 0;

    this.vectorField = [];
  }

  #dijkstra() {
    const heap = new MinHeap();
    for (const { row, col } of this.grid.getGoalCells()) {
      this.costField[row][col] = 0;
      heap.push({ row, col }, 0);
    }

    while (heap.length > 0) {
      const current = heap.pop();
      const currentCost = this.costField[current.row][current.col];

      for (const [dr, dc] of this.neighbours) {
        const row = current.row + dr;
        const col = current.col + dc;

        if (!this.grid.inBounds(row, col)) continue;
        if (!this.grid.isWalkable(row, col)) continue;

        if (
          dr !== 0 &&
          dc !== 0 &&
          this.#isDiagonalBlocked(current.row, current.col, dr, dc)
        )
          continue;

        const firePenalty = this.fireSystem
          ? (this.fireSystem.intensityField[row]?.[col]?.temp ?? 0) * 10
          : 0;

        const bodyPenalty =
          this.grid.getTile(row, col) === TILE_TYPES.BODY ? 5 : 0;

        const moveCost = dr !== 0 && dc !== 0 ? 1.41 : 1.0;
        const newCost = currentCost + moveCost + firePenalty + bodyPenalty;

        if (newCost < this.costField[row][col]) {
          this.costField[row][col] = newCost;
          heap.push({ row, col }, newCost);
        }
      }
    }
  }

  #isDiagonalBlocked(currentRow, currentCol, dr, dc) {
    if (dr === 0 || dc === 0) return false;

    const blockedA = !this.grid.isWalkable(currentRow + dr, currentCol);
    const blockedB = !this.grid.isWalkable(currentRow, currentCol + dc);

    return blockedA || blockedB;
  }

  #initCostField() {
    this.costField = Array.from({ length: this.grid.rows }, () =>
      new Array(this.grid.cols).fill(Infinity),
    );
    this.maxCost = 0;
  }

  #computeVectorField() {
    // initialise vector field
    this.vectorField = Array.from({ length: this.grid.rows }, () =>
      Array.from({ length: this.grid.cols }, () => ({ x: 0, y: 0 })),
    );

    // loop cells
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        let current = this.costField[row][col];
        let bestRow = -1;
        let bestCol = -1;
        let bestCost = Infinity;

        // skip obstacle cells
        if (!this.grid.isWalkable(row, col)) continue;
        // skip if cost is Infinity - out of bounds
        if (current === Infinity) continue;

        // loop neighbours
        for (const [dr, dc] of this.neighbours) {
          const nRow = row + dr;
          const nCol = col + dc;

          if (
            nRow < 0 ||
            nRow >= this.grid.rows ||
            nCol < 0 ||
            nCol >= this.grid.cols
          )
            continue;

          if (dr !== 0 && dc !== 0 && this.#isDiagonalBlocked(row, col, dr, dc))
            continue;

          const neighbour = this.costField[nRow][nCol];

          if (
            neighbour < bestCost ||
            (neighbour === bestCost && Math.random() < 0.3)
          ) {
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

  isReachable() {
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        if (this.grid.getTile(row, col) === TILE_TYPES.SPAWN) {
          if (this.costField[row]?.[col] !== Infinity) return true;
        }
      }
    }
    return false;
  }

  getVector(row, col) {
    if (isNaN(row) || isNaN(col)) return { x: 0, y: 0 };

    if (row < 0 || row >= this.grid.rows || col < 0 || col >= this.grid.cols) {
      return { x: 0, y: 0 };
    }

    const vectorRow = this.vectorField[row];
    if (!vectorRow) return { x: 0, y: 0 };

    return vectorRow[col] || { x: 0, y: 0 };
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
    ctx.strokeStyle = "#6e7681ff";
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
