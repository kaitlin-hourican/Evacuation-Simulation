// contains shared constants used throughout the simulation

export const TILE_COLOURS = {
  0: { fill: "#f5f5f0", stroke: "#d4d4cc" },    // walkable
  1: { fill: "#2e2e46ff", stroke: "#2a2a3e" },  // obstacle
  2: { fill: "#22c55e", stroke: "#16a34a" },    // goal
  3: { fill: "#3b82f6", stroke: "#2563eb" },    // spawn
  4: { fill: "#DA1F05", stroke: "#c81a03ff" },  // fire
};

export const DEFAULT_COLOURS = {
  fill: "#f5f5f0",
  stroke: "#d4d4cc",
};

export const TILE_TYPES = {
  EMPTY: 0,
  OBSTACLE: 1,
  GOAL: 2,
  SPAWN: 3,
  FIRE: 4,
  BODY: 5,
};

export const FIRE_STATES = {
  COOL: "cool",
  WARM: "warm",
  HEATING: "heating",
  BURNING: "burning",
  BURNT: "burnt",
};

export const INJURY_SCALE = [
  { level: 0, label: "No Injury", minHealth: 100, color: "#22c55e" },
  { level: 1, label: "Minor", minHealth: 75, color: "#84cc16" },
  { level: 2, label: "Moderate", minHealth: 50, color: "#eab308" },
  { level: 3, label: "Serious", minHealth: 25, color: "#f97316" },
  { level: 4, label: "Severe", minHealth: 10, color: "#ef4444" },
  { level: 5, label: "Critical", minHealth: 1, color: "#b91c1c" },
  { level: 6, label: "Fatal", minHealth: 0, color: "#486188ff" },
];

export const MODEBAR_H = 48;
export const ACTIVITYBAR_W = 60;
export const MAP_COLS = 200;
export const MAP_ROWS = 200;
export const TILE_SIZE = 20;
export const TILESIZE_METRES = 0.5;
export const PHYSICS_SCALE = TILE_SIZE / TILESIZE_METRES;
