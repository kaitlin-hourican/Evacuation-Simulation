import { TILE_TYPES } from "./constants.js";

export const tools = {
  getLineTiles: (start, end) => {
    const tiles = [];
    const dCol = Math.abs(end.col - start.col);
    const dRow = Math.abs(end.row - start.row);

    let tCol = end.col,
      tRow = end.row;
    if (dCol > dRow) tRow = start.row;
    else tCol = start.col;

    const dist = Math.max(
      Math.abs(tCol - start.col),
      Math.abs(tRow - start.row),
    );
    for (let i = 0; i <= dist; i++) {
      const t = dist === 0 ? 0 : i / dist;
      tiles.push({
        row: Math.round(start.row + t * (tRow - start.row)),
        col: Math.round(start.col + t * (tCol - start.col)),
      });
    }
    return tiles;
  },

  getRectTiles: (start, end) => {
    const tiles = [];
    const rStart = Math.min(start.row, end.row),
      rEnd = Math.max(start.row, end.row);
    const cStart = Math.min(start.col, end.col),
      cEnd = Math.max(start.col, end.col);
    for (let r = rStart; r <= rEnd; r++)
      for (let c = cStart; c <= cEnd; c++)
        if (r === rStart || r === rEnd || c === cStart || c === cEnd)
          tiles.push({ row: r, col: c });
    return tiles;
  },

  getFilledRectTiles: (start, end) => {
    const tiles = [];
    const rStart = Math.min(start.row, end.row),
      rEnd = Math.max(start.row, end.row);
    const cStart = Math.min(start.col, end.col),
      cEnd = Math.max(start.col, end.col);
    for (let r = rStart; r <= rEnd; r++)
      for (let c = cStart; c <= cEnd; c++) tiles.push({ row: r, col: c });
    return tiles;
  },

  paintTile: (grid, tile, tileType) => {
    if (tileType === "erase") {
      grid.setTile(tile.row, tile.col, TILE_TYPES.EMPTY);
      return;
    }
    const type = TILE_TYPES[tileType.toUpperCase()] ?? TILE_TYPES.OBSTACLE;
    grid.setTile(tile.row, tile.col, type);
  },
};
