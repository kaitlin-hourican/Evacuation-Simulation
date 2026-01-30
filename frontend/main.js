const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

// tilemap config
const TILE_SIZE = 32; // each tile 32px
const MAP_COLS = 20; // width in tiles
const MAP_ROWS = 15; // height in tiles

// set canvas size based on tile grid
canvas.width = MAP_COLS * TILE_SIZE;
canvas.height = MAP_ROWS * TILE_SIZE;

// create tilemap
// 0 = empty (white, non-collidable)
// 1 = obstacle (black, collidable)
const tilemap = [];



// fill tilempa
for (let row = 0; row < MAP_ROWS; row++) {
    const rowArray = [];

    for (let col = 0; col < MAP_COLS; col++) {
        rowArray.push(0);   // 0 = empty/non-collidable
    }
    tilemap.push(rowArray);
};


function drawTilemap() {
    // iterate through each tile and draw according to value
    for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
            const tileValue = tilemap[row][col];

            if (tileValue === 0) {
                ctx.fillStyle = "#ffffff";
            } else if (tileValue === 1) {
                ctx.fillStyle = "#000000";
            }

            // convert grid coord to px coord
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // grid lines
            ctx.strokeStyle = "#cccacaff";
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
    }
};


drawTilemap();