// entry point for the simulation
// initialises the grid and toolbar, handles user interaction with the canvas,
// and connects ui events to grid editing behaviour

import { Grid } from './engine/Grid.js';
import { Toolbar } from './engine/Toolbar.js';
import { tools } from './engine/tools.js';
import { Flowfield } from './engine/Flowfield.js';

// initialise toolbar ui controller
const ui = new Toolbar();

// canvas used for drawing the grid
const canvas = document.getElementById('simCanvas');


// calculate the largest tile size that fits within the viewport
// this ensures the grid always fits on screen

const MODEBAR_H = 48;
const MARGIN    = 32;

const MAP_COLS  = 20;
const MAP_ROWS  = 15;

const availW   = window.innerWidth  - MARGIN * 2;
const availH   = window.innerHeight - MODEBAR_H - MARGIN * 2;

const tileSize = Math.floor(Math.min(
    availW / MAP_COLS,
    availH / MAP_ROWS
));

// create grid instance
const grid = new Grid(canvas, MAP_COLS, MAP_ROWS, tileSize);
const flowfield = new Flowfield(grid);

const computeBtn = document.getElementById("btn-compute");
computeBtn.addEventListener("click", () => { 
    flowfield.compute();
    flowfield.drawHeatMap(canvas.getContext("2d"));
})


// tool state tracking

// currentTool is the tool selected in the toolbar
// activeTool is the tool currently being used during painting
// this allows right click erase without switching the selected tool
let currentTool = 'draw';
let activeTool  = 'draw';

// tracks whether the user is currently dragging to paint tiles
let isPainting  = false;


// listen for toolbar tool changes

document.addEventListener('tool-change', e => {

    // clear tool resets the entire grid
    if (e.detail === 'clear') {
        grid.clear();
        grid.draw();
        return;
    }

    // update selected tool
    currentTool = e.detail;
});


// listen for mode changes (edit vs run)

document.addEventListener('mode-change', e => {

    // change cursor style depending on mode
    canvas.style.cursor = e.detail === 'edit'
        ? 'crosshair'
        : 'default';
});


// canvas interaction handling

// start painting when mouse button is pressed
canvas.addEventListener('mousedown', e => {

    // editing only allowed in edit mode
    if (ui.mode !== 'edit') return;

    isPainting = true;

    // right click temporarily switches to erase tool
    activeTool = (e.button === 2) ? 'erase' : currentTool;

    paint(e);
});


// continue painting while dragging mouse
canvas.addEventListener('mousemove', e => {
    if (isPainting) paint(e);
});


// stop painting when mouse button is released
// listens on window so it still triggers if mouse leaves canvas
window.addEventListener('mouseup', () => {
    isPainting = false;
});


// disable default right click context menu on canvas
canvas.addEventListener('contextmenu', e => e.preventDefault());


// applies the active tool to the tile under the cursor
function paint(e) {

    const rect = canvas.getBoundingClientRect();

    // convert mouse position to tile position
    // scaling ensures accuracy if canvas is resized by the browser
    const tile = grid.pixelToTile(
        (e.clientX - rect.left) * (canvas.width  / rect.width),
        (e.clientY - rect.top)  * (canvas.height / rect.height)
    );

    if (!tile) return;

    // run tool behaviour if it exists
    if (tools[activeTool]) {
        tools[activeTool](grid, tile);
        grid.draw();
    }
}


// initial render of the grid
grid.draw();