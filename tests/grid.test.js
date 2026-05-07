import { Grid } from "../engine/Grid.js";
import { TILE_TYPES } from "../engine/constants.js";

// mocks
const mockCanvas = {
  getContext: () => ({
    clearRect: () => {},
    scale: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    setTransform: () => {},
  }),
  style: {},
  width: 0,
  height: 0,
};

global.document = {
  getElementById: () => ({
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 800,
    clientHeight: 600,
  }),
};

global.window = { devicePixelRatio: 1 };

describe("Grid.inBounds", () => {
  let grid;
  beforeEach(() => {
    grid = new Grid(mockCanvas, 10, 10, 20);
  });

  test("returns true for valid tile", () => {
    expect(grid.inBounds(0, 0)).toBe(true);
    expect(grid.inBounds(9, 9)).toBe(true);
  });

  test("returns false for negative indices", () => {
    expect(grid.inBounds(-1, 0)).toBe(false);
    expect(grid.inBounds(0, -1)).toBe(false);
  });

  test("returns false for out of bounds", () => {
    expect(grid.inBounds(10, 0)).toBe(false);
    expect(grid.inBounds(0, 10)).toBe(false);
  });
});

describe("Grid.setTile / getTile", () => {
  let grid;
  beforeEach(() => {
    grid = new Grid(mockCanvas, 10, 10, 20);
  });

  test("sets and gets a tile correctly", () => {
    grid.setTile(2, 3, TILE_TYPES.OBSTACLE);
    expect(grid.getTile(2, 3)).toBe(TILE_TYPES.OBSTACLE);
  });

  test("ignores out of bounds set", () => {
    grid.setTile(99, 99, TILE_TYPES.OBSTACLE);
    expect(grid.getTile(99, 99)).toBeNull();
  });

  test("returns null for out of bounds get", () => {
    expect(grid.getTile(-1, 0)).toBeNull();
  });
});

describe("Grid.isWalkable", () => {
  let grid;
  beforeEach(() => {
    grid = new Grid(mockCanvas, 10, 10, 20);
  });

  test("empty tile is walkable", () => {
    expect(grid.isWalkable(0, 0)).toBe(true);
  });

  test("obstacle tile is not walkable", () => {
    grid.setTile(0, 0, TILE_TYPES.OBSTACLE);
    expect(grid.isWalkable(0, 0)).toBe(false);
  });

  test("out of bounds is not walkable", () => {
    expect(grid.isWalkable(-1, 0)).toBe(false);
  });
});

describe("Grid.pixelToTile", () => {
  let grid;
  beforeEach(() => {
    grid = new Grid(mockCanvas, 10, 10, 20); 
  });

  test("converts pixel to correct tile", () => {
    expect(grid.pixelToTile(0, 0)).toEqual({ row: 0, col: 0 });
    expect(grid.pixelToTile(20, 0)).toEqual({ row: 0, col: 1 });
    expect(grid.pixelToTile(0, 20)).toEqual({ row: 1, col: 0 });
  });

  test("returns null for out of bounds pixel", () => {
    expect(grid.pixelToTile(9999, 9999)).toBeNull();
  });
});

describe("Grid.getSpawnCells / getGoalCells", () => {
  let grid;
  beforeEach(() => {
    grid = new Grid(mockCanvas, 10, 10, 20);
  });

  test("returns empty arrays when no special tiles placed", () => {
    expect(grid.getSpawnCells()).toEqual([]);
    expect(grid.getGoalCells()).toEqual([]);
  });

  test("returns correct spawn cells", () => {
    grid.setTile(1, 1, TILE_TYPES.SPAWN);
    grid.setTile(2, 2, TILE_TYPES.SPAWN);
    expect(grid.getSpawnCells().length).toBe(2);
  });

  test("hasGoal returns false when no goal", () => {
    expect(grid.hasGoal()).toBe(false);
  });

  test("hasGoal returns true after placing goal", () => {
    grid.setTile(0, 0, TILE_TYPES.GOAL);
    expect(grid.hasGoal()).toBe(true);
  });
});