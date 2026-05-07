import { Flowfield } from "../engine/Flowfield.js"
import { TILE_TYPES } from "../engine/constants.js";

// mocks
function makeGrid(rows, cols, tiles = {}) {
  const tilemap = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => tiles[`${r},${c}`] ?? TILE_TYPES.EMPTY)
  );
  return {
    rows,
    cols,
    tilemap,
    getTile: (r, c) => tilemap[r]?.[c] ?? null,
    inBounds: (r, c) => r >= 0 && r < rows && c >= 0 && c < cols,
    isWalkable: (r, c) => tilemap[r]?.[c] !== TILE_TYPES.OBSTACLE,
    getGoalCells: () => {
      const goals = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (tilemap[r][c] === TILE_TYPES.GOAL) goals.push({ row: r, col: c });
      return goals;
    },
    getSpawnCells: () => {
      const spawns = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (tilemap[r][c] === TILE_TYPES.SPAWN) spawns.push({ row: r, col: c });
      return spawns;
    },
  };
}

describe("Flowfield.isReachable", () => {
  test("returns true when spawn has clear path to goal", () => {
    const grid = makeGrid(5, 5, {
      "0,0": TILE_TYPES.GOAL,
      "4,4": TILE_TYPES.SPAWN,
    });
    const ff = new Flowfield(grid);
    ff.compute();
    expect(ff.isReachable()).toBe(true);
  });

  test("returns false when spawn is enclosed by obstacles", () => {
    const grid = makeGrid(5, 5, {
      "0,0": TILE_TYPES.GOAL,
      "4,4": TILE_TYPES.SPAWN,
      "3,4": TILE_TYPES.OBSTACLE,
      "4,3": TILE_TYPES.OBSTACLE,
      "3,3": TILE_TYPES.OBSTACLE,
    });
    const ff = new Flowfield(grid);
    ff.compute();
    expect(ff.isReachable()).toBe(false);
  });

  test("returns false when no spawn tiles exist", () => {
    const grid = makeGrid(5, 5, { "0,0": TILE_TYPES.GOAL });
    const ff = new Flowfield(grid);
    ff.compute();
    expect(ff.isReachable()).toBe(false);
  });
});

describe("Flowfield cost field", () => {
  test("goal tile has cost 0", () => {
    const grid = makeGrid(5, 5, { "0,0": TILE_TYPES.GOAL });
    const ff = new Flowfield(grid);
    ff.compute();
    expect(ff.costField[0][0]).toBe(0);
  });

  test("costs increase with distance from goal", () => {
    const grid = makeGrid(1, 5, { "0,0": TILE_TYPES.GOAL });
    const ff = new Flowfield(grid);
    ff.compute();
    expect(ff.costField[0][1]).toBeGreaterThan(ff.costField[0][0]);
    expect(ff.costField[0][2]).toBeGreaterThan(ff.costField[0][1]);
    expect(ff.costField[0][3]).toBeGreaterThan(ff.costField[0][2]);
  });

  test("obstacle tiles have Infinity cost", () => {
    const grid = makeGrid(3, 3, {
      "0,0": TILE_TYPES.GOAL,
      "1,1": TILE_TYPES.OBSTACLE,
    });
    const ff = new Flowfield(grid);
    ff.compute();
    expect(ff.costField[1][1]).toBe(Infinity);
  });
});

describe("Flowfield.getVector", () => {
  test("returns zero vector for out of bounds", () => {
    const grid = makeGrid(5, 5, { "0,0": TILE_TYPES.GOAL });
    const ff = new Flowfield(grid);
    ff.compute();
    expect(ff.getVector(-1, 0)).toEqual({ x: 0, y: 0 });
    expect(ff.getVector(0, 99)).toEqual({ x: 0, y: 0 });
  });

  test("returns non-zero vector for reachable tile", () => {
    const grid = makeGrid(5, 5, { "0,0": TILE_TYPES.GOAL });
    const ff = new Flowfield(grid);
    ff.compute();
    const v = ff.getVector(4, 4);
    expect(v.x !== 0 || v.y !== 0).toBe(true);
  });
});