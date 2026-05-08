import { Agent } from "./Agent.js";
import { TILE_TYPES, PHYSICS_SCALE, TILE_SIZE } from "./constants.js";

export class Simulation {
  #running = false;
  #animFrameId = null;
  #lastTime = null;
  #accumulator = 0;
  #fixedStep = 1 / 60;
  gridSnapshot = null;
  #onRender;

  constructor(
    grid,
    flowfield,
    fireSystem,
    uiParams,
    statsController,
    ctx,
    scale,
    onRender,
  ) {
    this.grid = grid;
    this.flowfield = flowfield;
    this.fireSystem = fireSystem;
    this.uiParams = uiParams;
    this.statsController = statsController;
    this.ctx = ctx;
    this.scale = scale;
    this.#onRender = onRender;
    this.agents = [];
    this.deadAgents = [];
    this.stats = {
      spawned: 0,
      evacuated: 0,
      killed: 0,
      elapsed: 0,
      injuryLevels: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    };
  }

  updateScale(newScale) {
    this.scale = newScale;
    this.agents.forEach((agent) => {
      agent.scale = newScale;
    });
  }

  spawnAgents() {
    this.resetStats();
    this.clear();
    this.agents = [];
    const agentCount = parseInt(this.uiParams.agentCount.value);
    const cells = this.grid.getSpawnCells();
    if (cells.length === 0) return;

    // fisher-yates shuffle
    let currentIndex = cells.length;
    while (currentIndex !== 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [cells[currentIndex], cells[randomIndex]] = [
        cells[randomIndex],
        cells[currentIndex],
      ];
    }

    const selected = cells.slice(0, agentCount);

    selected.forEach((cell) => {
      const pixelX = cell.col * TILE_SIZE + TILE_SIZE / 2;
      const pixelY = cell.row * TILE_SIZE + TILE_SIZE / 2;
      const x = pixelX / PHYSICS_SCALE;
      const y = pixelY / PHYSICS_SCALE;

      this.agents.push(new Agent(x, y, this.scale));
    });

    this.stats.spawned = this.agents.length;
  }

  draw() {
    for (const agent of this.deadAgents) agent.draw(this.ctx);
    for (const agent of this.agents) agent.draw(this.ctx);
  }

  clear() {
    this.fireSystem.reset();
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        if (this.grid.getTile(row, col) === TILE_TYPES.BODY) {
          this.grid.setTile(row, col, TILE_TYPES.EMPTY);
        }
      }
    }
    this.deadAgents = [];
    this.agents = [];
  }

  resetStats() {
    this.stats = {
      spawned: 0,
      evacuated: 0,
      killed: 0,
      elapsed: 0,
      injuryLevels: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    };
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#lastTime = null;
    this.#accumulator = 0; // ← reset
    this.fireSystem.start();

    const offscreen = document.createElement("canvas");
    offscreen.width = this.ctx.canvas.width;
    offscreen.height = this.ctx.canvas.height;
    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(this.ctx.canvas, 0, 0);
    this.gridSnapshot = offscreen;

    this.#animFrameId = requestAnimationFrame((ts) => this.#update(ts));
  }

  stop() {
    this.#running = false;
    this.#accumulator = 0;
    this.gridSnapshot = null;
    this.fireSystem.stop();
    if (this.#animFrameId) {
      cancelAnimationFrame(this.#animFrameId);
      this.#animFrameId = null;
    }
  }

  #update(timestamp) {
    if (!this.#running) return;

    const speedMult = parseFloat(this.uiParams.agentSpeed.value) || 1;
    const fireMult = parseFloat(this.uiParams.fireSpread.value) || 1;

    const rawDelta = this.#lastTime ? (timestamp - this.#lastTime) / 1000 : 0;
    this.#lastTime = timestamp;

    const cappedDelta = Math.min(rawDelta, 0.1);
    this.#accumulator += cappedDelta;

    let stillActive = 0;
    let didStep = false;
    let simulationComplete = false;

    while (this.#accumulator >= this.#fixedStep) {
      this.#accumulator -= this.#fixedStep;
      didStep = true;
      stillActive = 0;

      for (let i = this.agents.length - 1; i >= 0; i--) {
        const agent = this.agents[i];
        const result = agent.update(
          this.flowfield,
          this.#fixedStep * speedMult,
          this.agents,
          this.fireSystem,
        );

        if (result?.evacuated) {
          this.stats.evacuated++;
          this.stats.injuryLevels[result.ais.level]++;
          this.agents.splice(i, 1);
          continue;
        }

        if (result?.dead) {
          if (!agent._loggedDead) {
            this.stats.killed++;
            this.stats.injuryLevels[6]++;
            this.grid.setTile(result.row, result.col, TILE_TYPES.BODY);
            agent._loggedDead = true;
            this.deadAgents.push(agent);
            this.agents.splice(i, 1);
          }
          continue;
        }

        stillActive++;
      }

      this.#resolveAllCollisions();
      this.fireSystem.update(this.#fixedStep * fireMult);
      this.stats.elapsed += this.#fixedStep;

      if (didStep && stillActive === 0 && this.stats.spawned > 0) {
        simulationComplete = true;
        break;
      }
    }

    if (didStep) {
      this.statsController.update(this.stats, this.agents.length);
    }

    this.#onRender();

    if (simulationComplete) {
      this.stop();
      document.dispatchEvent(new CustomEvent("app-simulation-complete"));
      return;
    }

    if (this.#running) {
      this.#animFrameId = requestAnimationFrame((ts) => this.#update(ts));
    }
  }

  get isRunning() {
    return this.#running;
  }

  #buildSpatialGrid() {
    this.spatialGrid = {};
    for (const agent of this.agents) {
      const cellX = Math.floor((agent.x * PHYSICS_SCALE) / TILE_SIZE);
      const cellY = Math.floor((agent.y * PHYSICS_SCALE) / TILE_SIZE);
      const key = `${cellX},${cellY}`;
      if (!this.spatialGrid[key]) this.spatialGrid[key] = [];
      this.spatialGrid[key].push(agent);
    }
  }

  #getNearbyAgents(agent) {
    const cellX = Math.floor((agent.x * PHYSICS_SCALE) / TILE_SIZE);
    const cellY = Math.floor((agent.y * PHYSICS_SCALE) / TILE_SIZE);
    const nearby = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${cellX + dx},${cellY + dy}`;
        if (this.spatialGrid[key]) nearby.push(...this.spatialGrid[key]);
      }
    }
    return nearby;
  }

  #resolveAllCollisions() {
    for (const agent of this.agents) {
      agent.pressureThisFrame = 0;
    }

    const loopCount = 5;

    for (let loop = 0; loop < loopCount; loop++) {
      this.#buildSpatialGrid();

      for (let i = 0; i < this.agents.length; i++) {
        const a = this.agents[i];
        if (a._loggedDead) continue;

        const nearby = this.#getNearbyAgents(a);

        for (const b of nearby) {
          if (b === a || b._loggedDead || this.agents.indexOf(b) <= i) continue;

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          const minDist = a.radius + b.radius;

          if (distSq < minDist * minDist) {
            const distance = Math.sqrt(distSq) || 0.1;
            const overlap = minDist - distance;

            a.pressureThisFrame += overlap;
            b.pressureThisFrame += overlap;

            const maxPush = a.radius * 0.25;
            const pushAmount = Math.min(overlap / 2, maxPush);
            const nx = (dx / distance) * pushAmount;
            const ny = (dy / distance) * pushAmount;

            a.x += nx;
            a.y += ny;
            b.x -= nx;
            b.y -= ny;

            a.resolveWallCollisions(this.flowfield);
            b.resolveWallCollisions(this.flowfield);
          }
        }
      }
    }

    for (const agent of this.agents) {
      agent.pressureThisFrame /= loopCount;
    }

    this.#applyPressureDamage();
  }

  #applyPressureDamage() {
    const PRESSURE_THRESHOLD = 0.3;
    const PRESSURE_DAMAGE_SCALE = 0.8;

    for (const agent of this.agents) {
      if (agent._loggedDead) continue;
      if (agent.pressureThisFrame > PRESSURE_THRESHOLD) {
        const excessPressure = agent.pressureThisFrame - PRESSURE_THRESHOLD;
        agent.health -= excessPressure * PRESSURE_DAMAGE_SCALE;
      }
    }
  }
}
