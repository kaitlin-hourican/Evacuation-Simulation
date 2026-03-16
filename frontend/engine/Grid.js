import { TILE_COLOURS, DEFAULT_COLOURS } from "./constants.js";

export class Grid {
    constructor(canvas, cols, rows, tileSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.cols = cols;
        this.rows = rows;
        this.tileSize = tileSize;
        this.tilemap = this.#createTilemap();

        canvas.width = cols * tileSize;
        canvas.height = rows * tileSize;
    }

    // creates initial tilemap using 2d array 
    #createTilemap() {
        const tilemap = [];
        for (let row = 0; row < this.rows; row++) {
            const rowArray = [];
            for (let col = 0; col < this.cols; col++) {
                // default tile value of 0
                rowArray.push(0); 
            }
            tilemap.push(rowArray);
        }
        return tilemap;
    }

    // checks whether tile actually exists - ie if tile is within boundaries
    // row must be - min 0 (top) and less than total rows (bottom)
    // col must be - min 0 (left side) and less than total cols (right side)
    #inBounds(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    draw() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // find tile value 
                // 0 = empty
                // 1 = obstacle
                // 2 = goal
                const tileValue = this.tilemap[row][col];

                // convert grid to px
                const x = col * this.tileSize;
                const y = row * this.tileSize;

                // colour tile based on value 
                const colours = TILE_COLOURS[tileValue] ?? DEFAULT_COLOURS;

                this.ctx.fillStyle = colours.fill;
                this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

                this.ctx.strokeStyle = colours.stroke;
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
            }
        }
    }

    // sets specific tile value
    setTile(row, col, value) {
        // check if tile is actually part of tilemap
        if (!this.#inBounds(row, col)) return;

        // change tile value
        this.tilemap[row][col] = value;
    }

    // gets specific tile value
    getTile(row, col) {
        // check tile exists
        if (!this.#inBounds(row, col)) return null;

        // return value of tile
        return this.tilemap[row][col];
    }

    // checks if pedestrian/agent can actually walk on tile 
    // ie if value is 0 (empty)
    isWalkable(row, col) {
        // check tile exists in tilemap - if false then not walkable
        if (!this.#inBounds(row, col)) return false;

        // return bool - true = empty/walkable, false = obstacle
        return this.tilemap[row][col] === 0;
    }

    // convert px val to specific tile
    // px coords top-left corner
    pixelToTile(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        if (!this.#inBounds(row, col)) return null;
        return { row, col };
    }

    // converts tile to px coords of top-left corner
    tileToPixel(row, col) {
        return {
            x: col * this.tileSize,
            y: row * this.tileSize,
        };
    }

    // reset all tiles to default value (0)
    clear() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.tilemap[row][col] = 0;
            }
        }
    }
}