// handles the grid structure for the simulation
// stores the tilemap, manages tile access, and handles rendering to the canvas

import { TILE_COLOURS, DEFAULT_COLOURS, TILE_TYPES } from "./constants.js";

export class Grid {
    constructor(canvas, cols, rows, tileSize) {
        // canvas and drawing context
        this.canvas = canvas;
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
    #inBounds(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    // draws the entire grid to the canvas
    // iterates through the tilemap and renders each tile
    draw() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {

                // get tile type stored at this position
                const tileValue = this.tilemap[row][col];

                // convert grid position to canvas pixel position
                const x = col * this.tileSize;
                const y = row * this.tileSize;

                // get colours for this tile type
                // fallback to default colours if tile type is unknown
                const colours = TILE_COLOURS[tileValue] ?? DEFAULT_COLOURS;

                // draw filled tile
                this.ctx.fillStyle = colours.fill;
                this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

                // draw tile border
                this.ctx.strokeStyle = colours.stroke;
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
            }
        }
    }

    // sets the tile at a given row and column to a new type
    // ignores the request if the tile is outside the grid
    setTile(row, col, value) {
        if (!this.#inBounds(row, col)) return;
        this.tilemap[row][col] = value;
    }

    // returns the tile type at a given position
    // returns null if the position is outside the grid
    getTile(row, col) {
        if (!this.#inBounds(row, col)) return null;
        return this.tilemap[row][col];
    }

    // checks whether a tile can be walked on by an agent
    // currently only EMPTY tiles are walkable
    isWalkable(row, col) {
        if (!this.#inBounds(row, col)) return false;
        return this.tilemap[row][col] === TILE_TYPES.EMPTY;
    }

    // converts canvas pixel coordinates to a grid tile position
    // useful for mapping mouse clicks to tiles
    // returns null if the pixel lies outside the grid
    pixelToTile(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (!this.#inBounds(row, col)) return null;

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