import { tools } from "../engine/tools.js"

describe("tools.getLineTiles", () => {
  test("returns single tile when start equals end", () => {
    const result = tools.getLineTiles({ row: 2, col: 2 }, { row: 2, col: 2 });
    expect(result).toEqual([{ row: 2, col: 2 }]);
  });

  test("returns horizontal line", () => {
    const result = tools.getLineTiles({ row: 0, col: 0 }, { row: 0, col: 3 });
    expect(result).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ]);
  });

  test("returns vertical line", () => {
    const result = tools.getLineTiles({ row: 0, col: 0 }, { row: 3, col: 0 });
    expect(result).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
    ]);
  });

  test("snaps diagonal to horizontal when dCol > dRow", () => {
    // dCol=3, dRow=1 → snaps to horizontal
    const result = tools.getLineTiles({ row: 0, col: 0 }, { row: 1, col: 3 });
    result.forEach(tile => expect(tile.row).toBe(0));
  });

  test("snaps diagonal to vertical when dRow > dCol", () => {
    // dRow=3, dCol=1 → snaps to vertical
    const result = tools.getLineTiles({ row: 0, col: 0 }, { row: 3, col: 1 });
    result.forEach(tile => expect(tile.col).toBe(0));
  });
});

describe("tools.getRectTiles", () => {
  test("returns only border tiles for a 3x3 rect", () => {
    const result = tools.getRectTiles({ row: 0, col: 0 }, { row: 2, col: 2 });
    // Centre tile (1,1) should NOT be included
    const hasCenter = result.some(t => t.row === 1 && t.col === 1);
    expect(hasCenter).toBe(false);
  });

  test("includes all four corners", () => {
    const result = tools.getRectTiles({ row: 0, col: 0 }, { row: 2, col: 2 });
    expect(result).toEqual(expect.arrayContaining([
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ]));
  });

  test("works when end is top-left of start", () => {
    // Should handle reversed coordinates
    const forward = tools.getRectTiles({ row: 0, col: 0 }, { row: 2, col: 2 });
    const reversed = tools.getRectTiles({ row: 2, col: 2 }, { row: 0, col: 0 });
    expect(reversed.length).toBe(forward.length);
  });

  test("1x1 rect returns single tile", () => {
    const result = tools.getRectTiles({ row: 1, col: 1 }, { row: 1, col: 1 });
    expect(result).toEqual([{ row: 1, col: 1 }]);
  });
});

describe("tools.getFilledRectTiles", () => {
  test("includes center tile unlike outline rect", () => {
    const result = tools.getFilledRectTiles({ row: 0, col: 0 }, { row: 2, col: 2 });
    const hasCenter = result.some(t => t.row === 1 && t.col === 1);
    expect(hasCenter).toBe(true);
  });

  test("3x3 filled rect returns exactly 9 tiles", () => {
    const result = tools.getFilledRectTiles({ row: 0, col: 0 }, { row: 2, col: 2 });
    expect(result.length).toBe(9);
  });

  test("works when end is top-left of start", () => {
    const forward = tools.getFilledRectTiles({ row: 0, col: 0 }, { row: 2, col: 2 });
    const reversed = tools.getFilledRectTiles({ row: 2, col: 2 }, { row: 0, col: 0 });
    expect(reversed.length).toBe(forward.length);
  });
});