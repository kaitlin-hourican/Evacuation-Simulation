import { Grid } from './engine/Grid.js';
import { Toolbar } from './engine/Toolbar.js';

const ui = new Toolbar(); 

const canvas = document.getElementById('simCanvas');

// Size the grid to fill the available viewport (below the fixed modebar).
// Tile size is derived from how many tiles fit, keeping a small margin.
const MODEBAR_H = 48;
const MARGIN    = 32;
const MAP_COLS  = 20;
const MAP_ROWS  = 15;

const availW   = window.innerWidth  - MARGIN * 2;
const availH   = window.innerHeight - MODEBAR_H - MARGIN * 2;
const tileSize = Math.floor(Math.min(availW / MAP_COLS, availH / MAP_ROWS));

const grid = new Grid(canvas, MAP_COLS, MAP_ROWS, tileSize);

let currentTool = 'draw';
let isPainting  = false;
let paintValue  = 1;

// ── Tool/mode events from Toolbar ──────────────────────────────────────────

document.addEventListener('tool-change', e => {
    if (e.detail === 'clear') { grid.clear(); grid.draw(); return; }
    currentTool = e.detail;
});

document.addEventListener('mode-change', e => {
    canvas.style.cursor = e.detail === 'edit' ? 'crosshair' : 'default';
});

// ── Canvas painting ───────────────────────────────────────────────────────────

canvas.addEventListener('mousedown', e => {
    if (ui.mode !== 'edit') return;
    isPainting = true;
    paintValue = (e.button === 2 || currentTool === 'erase') ? 0 : 1;
    paint(e);
});

canvas.addEventListener('mousemove', e => {
    if (isPainting) paint(e);
});

window.addEventListener('mouseup', () => { isPainting = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

function paint(e) {
    const rect = canvas.getBoundingClientRect();
    const tile = grid.pixelToTile(
        (e.clientX - rect.left) * (canvas.width / rect.width),
        (e.clientY - rect.top)  * (canvas.height / rect.height)
    );
    if (!tile) return;

    if (currentTool === "draw") {
        grid.setTile(tile.row, tile.col, 1);
        grid.draw();
    } else if (currentTool === "erase") {
        grid.setTile(tile.row, tile.col, 0);
        grid.draw();
    } else if (currentTool === "goal") {
        grid.setTile(tile.row, tile.col, 2);
        grid.draw();
    }
    
}

// initial draw
grid.draw();