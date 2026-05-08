# Agent Evacuation Simulator

A browser-based agent simulation tool for modelling pedestrian evacuation scenarios. Design environments using a tile-based map editor, configure agent and fire parameters, and observe autonomous agents navigate toward exits while avoiding obstacles and fire.

Built with vanilla JavaScript and the HTML Canvas 2D API — no frameworks, no backend, no build step required.

---

## Demo

> Open `index.html` via a local development server (see [Getting Started](#getting-started)).

---

## Features

- **Tile-based map editor** — draw walls, spawn zones, goals, and fire sources using four brush types (tile, line, outline rectangle, filled rectangle)
- **Flow field pathfinding** — Dijkstra-based cost field with bilinear interpolation produces smooth, realistic group navigation
- **Dynamic fire propagation** — cellular automaton fire spread with configurable rate; agents dynamically re-route around spreading fire
- **AIS injury model** — seven-level Abbreviated Injury Scale tracks agent health degraded by fire exposure and crowd pressure
- **Crowd pressure damage** — agents in densely packed crowds accumulate pressure damage from collision forces
- **Live statistics panel** — real-time evacuation progress bar, AIS injury chart, elapsed time, and agent counts
- **Import / Export** — save and load map configurations as JSON files including settings and post-simulation statistics
- **Zoom and navigation** — scrollable canvas with configurable tile size (10px–40px) and frustum culling for performance
- **Theme support** — light and dark mode, persisted via localStorage

---

## Getting Started

The application runs entirely in the browser as static files. No installation or build step is required.

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

**2. Serve the frontend**

The application must be served over HTTP rather than opened directly as a file due to ES module imports. Any static file server works:

Using VS Code Live Server:
- Install the Live Server extension
- Right-click `index.html` and select "Open with Live Server"

Using Python:
```bash
cd frontend
python -m http.server 5501
```

Using Node.js `serve`:
```bash
npx serve frontend
```

**3. Open in browser**

Navigate to `http://127.0.0.1:5501` (or whichever port your server uses).

---

## Running Tests

Unit tests are written in Jest and cover the core algorithmic components — geometric brush functions, grid spatial operations, and flowfield pathfinding.

**Install dependencies:**

```bash
npm install
```

**Run all tests:**

```bash
npm test
```

**Expected output:**
PASS tests/tools.test.js
PASS tests/grid.test.js
PASS tests/flowfield.test.js
Test Suites: 3 passed, 3 total
Tests:       38 passed, 38 total

---

## Project Structure
├── index.html                # Application entry point
├── styles.css                # Global styles and theme variables
├── main.js                   # Composition root — wires all systems
└── engine/
  ├── Agent.js                # Individual agent state and behaviour
  ├── constants.js            # Tile types, colours, AIS scale, map dimensions
  ├── FireSystem.js           # Cellular automaton fire propagation
  ├── Flowfield.js            # Dijkstra cost field and vector field
  ├── Grid.js                 # Tilemap data structure and canvas rendering
  ├── InputHandler.js         # Mouse input and tile painting
  ├── Simulation.js           # Agent lifecycle, physics, collision resolution
  ├── StatsController.js      # Live statistics UI
  ├── Toolbar.js              # Mode and tool management
  └── tools.js                # Pure geometric brush functions
└── assets/
  └── btn-pin.svg             # Button icon   
└── tests/
  ├── tools.test.js           # Brush geometry unit tests
  ├── grid.test.js            # Grid spatial operation unit tests
  └── flowfield.test.js       # Pathfinding and reachability unit tests
├── babel.config.json         # Babel config for Jest ES module support
├── package.json
└── README.md
---

## How to Use

### Designing a Map

1. Open the **Edit panel** by clicking the ✎ tab in the activity bar
2. Select a **brush type** — Tile, Line, Rect (outline), or Fill (filled rectangle)
3. Select a **tile type** — Wall, Spawn, Goal, Fire, or Erase
4. Click and drag on the canvas to paint tiles

At minimum, a valid map requires at least one **Spawn** tile and one **Goal** tile with a clear path between them.

### Configuring Parameters

In the Edit panel under **Parameters**:

| Parameter | Description |
|---|---|
| Agents | Number of agents to spawn (capped by available spawn tiles, max 500) |
| Agent Speed | Multiplier applied to agent movement speed |
| Fire Speed | Rate at which fire spreads across the grid |

### Running the Simulation

1. Click **Run Simulation** in the header
2. The simulation validates that a goal, spawn zone, and valid path all exist before starting
3. Switch to the **Stats panel** (〣 tab) to monitor live statistics
4. Click **Stop Simulation** to return to edit mode at any time

### Saving and Loading Maps

- **Export JSON** — downloads the current map, settings, and any post-simulation statistics as a `.json` file
- **Import JSON** — loads a previously exported file, restoring the tilemap and settings

---

## Architecture Overview

Physics runs on a fixed timestep of 1/60 second using an accumulator pattern,decoupled from the render frame rate. This ensures simulation speed is consistent regardless of zoom level or display performance. If the browser drops below 60 FPS, physics steps are batched to catch up without affecting simulation time.

| Event | Dispatched by | Listened by |
|---|---|---|
| `app-mode-change` | `Toolbar` | `main.js`, `InputHandler` |
| `app-tool-change` | `Toolbar` | `main.js`, `InputHandler` |
| `app-export` | `Toolbar` | `main.js` |
| `app-import` | `Toolbar` | `main.js` |

### Coordinate Systems

Two coordinate systems are used simultaneously:

- **World space (metres)** — agents are positioned in metres. Each tile is 0.5m × 0.5m. Physics calculations use world space units
- **Pixel space** — used only for canvas rendering. Conversion: `pixelX = worldX × scale` where `scale = tileSize / 0.5`

This means zoom changes are purely visual and never affect simulation physics.

### Flowfield Pathfinding

Rather than computing individual paths per agent, a single flowfield is computed for the entire grid:

1. **Cost field** — modified Dijkstra using a binary min-heap propagates costs outward from goal tiles. Edge costs include move distance, fire intensity penalty, and body tile penalty
2. **Vector field** — each walkable tile stores a unit vector pointing toward its lowest-cost neighbour
3. **Bilinear interpolation** — agents sample the four surrounding tile vectors weighted by their fractional position, producing smooth steering

The flowfield recomputes automatically whenever fire spreads, allowing agents to dynamically re-route.

### Collision Resolution

Agent-agent collision is resolved globally in `Simulation.js` using a spatial hash grid for performance:

- Agents are indexed into a tile-coordinate hash map each iteration
- Only agents within the 3×3 cell neighbourhood are checked per agent, reducing complexity from O(n²) to approximately O(n)
- Five iterations per frame with wall resolution called immediately after each individual push
- Agent movement uses substeps (3 per frame) with wall resolution after each substep to prevent tunnelling

---

## Map File Format

Exported JSON files follow this schema:

```json
{
  "meta": {
    "version": 1,
    "cols": 200,
    "rows": 200,
    "exportedAt": "2024-01-01T00:00:00.000Z"
  },
  "settings": {
    "agentCount": 100,
    "agentSpeed": 5,
    "fireSpread": 1
  },
  "tilemap": [[0, 0, 1, ...], ...],
  "stats": {
    "spawned": 100,
    "evacuated": 87,
    "killed": 13,
    "elapsed": 42.3,
    "injuryLevels": { "0": 45, "1": 20, "2": 12, "3": 6, "4": 3, "5": 1, "6": 13 }
  }
}
```

**Tile type values:**

| Value | Type |
|---|---|
| 0 | Empty |
| 1 | Obstacle (wall) |
| 2 | Spawn |
| 3 | Goal |
| 4 | Fire |
| 5 | Body (set during simulation) |

> ⚠️ If `TILE_TYPES` constants in `constants.js` are renumbered, previously exported files will load incorrectly. Future versions should include a `tileTypeMap` field in the exported JSON.

---

## Known Limitations

- Canvas interaction requires a mouse — touch input is not supported
- At 500 agents with active fire, render frame rate may drop at high zoom levels,
  though simulation physics remain unaffected due to the fixed timestep system
- Wall penetration may occasionally occur under extreme crowd density combined
  with active fire 
- Cause of death (fire vs pressure) is not distinguished in statistics output

---

## License

MIT