// defines behaviour for each editing tool in the simulation
// each tool modifies the grid when a tile is interacted with

import { TILE_TYPES } from "./constants.js";

// mapping of tool name to tool behaviour
// each function receives the grid and the selected tile
// the tool then updates the tile type accordingly
export const tools = {

    // places a wall or obstacle tile
    // used to block pedestrian movement
    draw: (grid, tile) =>
        grid.setTile(tile.row, tile.col, TILE_TYPES.WALL),

    // removes any placed tile and restores empty walkable space
    erase: (grid, tile) =>
        grid.setTile(tile.row, tile.col, TILE_TYPES.EMPTY),

    // places a goal tile
    // pedestrians will attempt to reach this location
    goal: (grid, tile) =>
        grid.setTile(tile.row, tile.col, TILE_TYPES.GOAL),

    // places a spawn tile
    // pedestrians will be generated from these locations
    spawn: (grid, tile) =>
        grid.setTile(tile.row, tile.col, TILE_TYPES.SPAWN),
}