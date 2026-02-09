const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

const drawBtn = document.getElementById("drawBtn");
const eraseBtn = document.getElementById("eraseBtn");
const agentBtn = document.getElementById("addAgentBtn");

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

// flags
let currentTool = null;
let isPainting = false;
let drawModeEnabled = false;
let hoveredTile = null;

// event listeners

drawBtn.addEventListener("click", () => {
    toggleTool("draw");
})

eraseBtn.addEventListener("click", () => {
    toggleTool("erase");
})

agentBtn.addEventListener("click", () => {
    toggleTool("addAgent");
})

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointerleave", onPointerUp);
canvas.addEventListener("pointerleave", () => {
    hoveredTile = null;
    isPainting = false;
    drawTilemap();
})

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
    if (!currentTool) return;

    isPainting = true;

    const { row, col } = getTileFromPointer(event);
    applyTool(row, col);

    drawTilemap();
}

function onPointerMove(event) {
     if (!currentTool) return;

    const { row, col } = getTileFromPointer(event);

    // update hover state ALWAYS
    if (
        row >= 0 && row < MAP_ROWS &&
        col >= 0 && col < MAP_COLS
    ) {
        hoveredTile = { row, col };
    } else {
        hoveredTile = null;
    }

    // only apply tool while painting
    if (isPainting) {
        applyTool(row, col);
    }

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
    drawHoverPreview();

    drawAgents();
};


let lastPaintedTile = null; 

function applyTool(row, col) {
    if (row < 0 || row >= MAP_ROWS || 
        col < 0 || col >= MAP_COLS
    ) return;

    if (currentTool === "draw" && isAgentAt(row, col)) return;
    if (currentTool === "erase" && isAgentAt(row, col)) return;

    if (currentTool === "draw") {
        tilemap[row][col] = 1;
    } else if (currentTool === "erase") {
        tilemap[row][col] = 0;
    } else if (currentTool === "addAgent") {
        if (tilemap[row][col] === 1) return;
        if (isAgentAt(row, col)) return;
        agents.push({ row, col });
    }
}

function toggleTool(tool) {
    if (currentTool === tool) {
        currentTool = null;
    } else {
        currentTool = tool;
    }

    // stop drawing when switching tools
    isPainting = false;

    drawBtn.classList.toggle("active", currentTool === "draw");
    eraseBtn.classList.toggle("active", currentTool === "erase");
    agentBtn.classList.toggle("active", currentTool === "addAgent");
}


const agents = [];

function drawAgents() {
    ctx.fillStyle = "#0077ff";

    for (const agent of agents) {
        const centerX = agent.col * TILE_SIZE + TILE_SIZE / 2;
        const centerY = agent.row * TILE_SIZE + TILE_SIZE / 2;
        const radius = TILE_SIZE * 0.35;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function isAgentAt(row, col) {
    return agents.some(a => a.row === row && a.col === col);
}

drawTilemap();



function drawHoverPreview() {
    if (!hoveredTile || !currentTool || isPainting) return;

    const { row, col } = hoveredTile;

    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;

    if (currentTool === "draw") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    } else if (currentTool === "erase") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    }

    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.strokeStyle = "#666";
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
}