// contains shared constants used throughout the simulation
// includes tile types and their corresponding visual colours

// colour definitions for each tile type
// fill is the tile colour, stroke is the grid border colour
export const TILE_COLOURS = {
    0: { fill: "#f5f5f0", stroke: "#d4d4cc" }, // walkable 
    1: { fill: "#1e1e2e", stroke: "#2a2a3e" }, // obstacle 
    2: { fill: "#22c55e", stroke: "#16a34a" }, // goal
    3: { fill: "#3b82f6", stroke: "#2563eb" }, // spawn 
    4: { fill: "#f97316", stroke: "#ea580c" }  // fire
};

// default colours used if a tile type is not recognised
export const DEFAULT_COLOURS = {
    fill: "#f5f5f0",
    stroke: "#d4d4cc"
};

// numeric identifiers representing tile types in the tilemap
// using constants avoids hardcoding numbers throughout the codebase
export const TILE_TYPES = {
    EMPTY: 0,
    OBSTACLE: 1,
    GOAL: 2,
    SPAWN: 3,
    FIRE: 4
}

export const MODEBAR_H = 48;
export const MARGIN    = 32;
export const MAP_COLS  = 20;
export const MAP_ROWS  = 15;
export const TILESIZE_METRES = 0.4;