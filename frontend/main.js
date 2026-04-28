import { Grid }         from './engine/Grid.js';
import { Toolbar }      from './engine/Toolbar.js';
import { Flowfield }    from './engine/Flowfield.js';
import { InputHandler } from './engine/InputHandler.js';
import { Simulation }   from './engine/Simulation.js';
import { MODEBAR_H, MARGIN, MAP_COLS, MAP_ROWS, TILESIZE_METRES } from './engine/constants.js';

const canvas = document.getElementById('simCanvas');

const availW   = window.innerWidth  - MARGIN * 2;
const availH   = window.innerHeight - MODEBAR_H - MARGIN * 2;
const tileSize = Math.floor(Math.min(availW / MAP_COLS, availH / MAP_ROWS));
export const SCALE = tileSize / TILESIZE_METRES;

const grid          = new Grid(canvas, MAP_COLS, MAP_ROWS, tileSize);
const ui            = new Toolbar(grid);
const flowfield     = new Flowfield(grid);
const simulation    = new Simulation(grid, flowfield, canvas.getContext("2d"), 100, SCALE, render);
const input         = new InputHandler(canvas, grid, ui, flowfield, simulation, render);

input.init();
render();

function render() {
    grid.draw();
    // flowfield.drawHeatmap(canvas.getContext("2d"));       //   test heatmap is working correctly
    // flowfield.drawVectorField(canvas.getContext("2d"));      // test vector field working correctly 
    simulation.draw(SCALE);
}