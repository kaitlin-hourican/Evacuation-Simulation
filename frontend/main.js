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

// flag tells whether drawing (obstacles) is active
let isPainting = false;

// event listeners
// canvas.addEventListener("click", handleCanvasClick);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointerleave", onPointerUp);

// event handlers
function handleCanvasClick(event) {
    // set coord to canvas position not window
    const rect = canvas.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // convert from px to grid coord
    const col = Math.floor(mouseX / TILE_SIZE);
    const row = Math.floor(mouseY / TILE_SIZE);

    toggleTile(row, col);
};

function getTileFromPointer(event) {
    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);

    return { row, col };
}

function onPointerDown(event) {
    isPainting = true;

    const { row, col } = getTileFromPointer(event);
    paintTile(row, col);

    drawTilemap();
}

function onPointerMove(event) {
    if (!isPainting) return;

    const { row, col } = getTileFromPointer(event);
    paintTile(row, col);

    drawTilemap();
}

function onPointerUp() {
    isPainting = false;
    lastPaintedTile = null;
}

// fill tilempa
for (let row = 0; row < MAP_ROWS; row++) {
    const rowArray = [];

    for (let col = 0; col < MAP_COLS; col++) {
        rowArray.push(0);   // 0 = empty/non-collidable
    }
    tilemap.push(rowArray);
};

function toggleTile(row, col) {
    if (tilemap[row][col] === 0) {
        tilemap[row][col] = 1;
    } else {
        tilemap[row][col] = 0;
    }

    drawTilemap();
}

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


let lastPaintedTile = null; 

function paintTile(row, col) {
    const key = `${row}, ${col}`;
    if (lastPaintedTile === key) return;

    if (row < 0 || row >= MAP_ROWS || 
        col < 0 || col >= MAP_COLS
    ) return;

    tilemap[row][col] = 1;
    lastPaintedTile = key;
}


drawTilemap();