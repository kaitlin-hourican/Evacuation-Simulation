import {
  INJURY_SCALE,
  TILE_TYPES,
  TILE_SIZE,
  PHYSICS_SCALE,
} from "./constants.js";

export class Agent {
  #isFatal = false;

  constructor(x, y, scale) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.radius = 0.2;
    this.baseSpeed = (1.4 + (Math.random() - 0.5) * 0.6) / 0.5;
    this.speed = 1;
    const randomAngle = Math.random() * Math.PI * 2;
    this.heading = { x: Math.cos(randomAngle), y: Math.sin(randomAngle) };
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.health = 100;
    this.maxHealth = 100;
    this.pressureThisFrame = 0;
  }

  draw(ctx) {
    const px = this.x * this.scale;
    const py = this.y * this.scale;
    const pr = this.radius * this.scale;

    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);

    const ais = this.#getAISLevel();
    ctx.fillStyle = ais.level === 6 ? "#3f567c" : "#cdd9e5";
    ctx.fill();
    ctx.closePath();
  }

  update(flowfield, deltaTime, agents, fireSystem, speedMult = 1) {
    const currentAIS = this.#getAISLevel();
    if (currentAIS.level === 6) return { dead: true };

    let speedPenalty = 1.0;
    let nearbyDead = 0;

    for (const other of agents) {
      if (other === this) continue;
      const dist = Math.hypot(this.x - other.x, this.y - other.y);

      if (other._loggedDead) {
        if (dist < this.radius * 4) {
          nearbyDead++;
        }
      }
    }

    speedPenalty = Math.max(0.3, 1.0 - nearbyDead * 0.2);
    const MAX_SPEED = 1.5 / 0.5;
    const aisLevel = currentAIS.level;
    const injuryPenalty = aisLevel >= 3 ? 1 - (aisLevel - 2) * 0.15 : 1.0;

    this.speed = Math.min(
      this.baseSpeed * speedMult * speedPenalty * injuryPenalty,
      MAX_SPEED,
    );

    const col = Math.floor((this.x * PHYSICS_SCALE) / TILE_SIZE);
    const row = Math.floor((this.y * PHYSICS_SCALE) / TILE_SIZE);

    const tileValue = flowfield.grid.getTile(row, col);
    if (tileValue === TILE_TYPES.GOAL)
      return { evacuated: true, health: this.health, ais: this.#getAISLevel() };

    this.wanderAngle += (Math.random() - 0.5) * 0.5;
    const wander = {
      x: Math.cos(this.wanderAngle) * 0.15,
      y: Math.sin(this.wanderAngle) * 0.15,
    };

    const vector = this.#getInterpolatedVector(flowfield);
    const blended = {
      x: vector.x + wander.x,
      y: vector.y + wander.y,
    };

    // normalise vector
    const length = Math.sqrt(blended.x * blended.x + blended.y * blended.y);
    const normalisedVector =
      length > 0
        ? { x: blended.x / length, y: blended.y / length }
        : { x: 0, y: 0 };

    this.#applyGradualTurn(normalisedVector, deltaTime);

    // move agent
    const totalStep = Math.min(this.speed * deltaTime, this.radius * 0.4);
    const substeps = 3;
    const subStep = totalStep / substeps;

    for (let i = 0; i < substeps; i++) {
      this.x += subStep * this.heading.x;
      this.y += subStep * this.heading.y;
      this.resolveWallCollisions(flowfield);
    }

    // boundary clamping
    const minX = this.radius;
    const maxX =
      (flowfield.grid.cols * TILE_SIZE) / PHYSICS_SCALE - this.radius;
    const minY = this.radius;
    const maxY =
      (flowfield.grid.rows * TILE_SIZE) / PHYSICS_SCALE - this.radius;

    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));

    // damage
    this.#takeDamage(fireSystem, deltaTime);

    if (this.#getAISLevel().level === 6) return { dead: true, row, col };

    return false;
  }

  resolveWallCollisions(flowfield) {
    const tileSize = TILE_SIZE / PHYSICS_SCALE;

    const agentCol = Math.floor((this.x * PHYSICS_SCALE) / TILE_SIZE);
    const agentRow = Math.floor((this.y * PHYSICS_SCALE) / TILE_SIZE);

    for (let pass = 0; pass < 2; pass++) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const row = agentRow + dr;
          const col = agentCol + dc;

          if (flowfield.grid.getTile(row, col) !== TILE_TYPES.OBSTACLE)
            continue;

          const tileLeft = col * tileSize;
          const tileRight = tileLeft + tileSize;
          const tileTop = row * tileSize;
          const tileBottom = tileTop + tileSize;

          const closestX = Math.max(tileLeft, Math.min(tileRight, this.x));
          const closestY = Math.max(tileTop, Math.min(tileBottom, this.y));

          const dx = this.x - closestX;
          const dy = this.y - closestY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance === 0 || distance >= this.radius) continue;

          const overlap = this.radius - distance;
          this.x += (dx / distance) * overlap;
          this.y += (dy / distance) * overlap;
        }
      }
    }
  }

  #getInterpolatedVector(flowfield) {
    const tileMetres = TILE_SIZE / PHYSICS_SCALE;
    if (tileMetres <= 0) return { x: 0, y: 0 };

    // position in tile units
    const tx = this.x / tileMetres - 0.5;
    const ty = this.y / tileMetres - 0.5;

    // integer tile - coords of top left of 4 surrounding tiles - card
    let col0 = Math.floor(tx);
    let row0 = Math.floor(ty);

    // clamp
    col0 = Math.max(0, Math.min(col0, flowfield.grid.cols - 2));
    row0 = Math.max(0, Math.min(row0, flowfield.grid.rows - 2));

    // fractional part
    const fx = tx - col0;
    const fy = ty - row0;

    const wTL = (1 - fx) * (1 - fy);
    const wTR = fx * (1 - fy);
    const wBL = (1 - fx) * fy;
    const wBR = fx * fy;

    const vTL = flowfield.getVector(row0, col0);
    const vTR = flowfield.getVector(row0, col0 + 1);
    const vBL = flowfield.getVector(row0 + 1, col0);
    const vBR = flowfield.getVector(row0 + 1, col0 + 1);

    return {
      x: vTL.x * wTL + vTR.x * wTR + vBL.x * wBL + vBR.x * wBR,
      y: vTL.y * wTL + vTR.y * wTR + vBL.y * wBL + vBR.y * wBR,
    };
  }

  #applyGradualTurn(desiredVector, deltaTime) {
    // maximum degree turn / sec
    const maxTurnRate = Math.PI * 2;

    const currentAngle = Math.atan2(this.heading.y, this.heading.x);
    const desiredAngle = Math.atan2(desiredVector.y, desiredVector.x);

    // shortest ang difference between current and desired
    let angleDiff = desiredAngle - currentAngle;

    // short way trun
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // clamp
    const turn = Math.max(
      -maxTurnRate * deltaTime,
      Math.min(maxTurnRate * deltaTime, angleDiff),
    );

    // apply turn to heading
    const newAngle = currentAngle + turn;
    this.heading.x = Math.cos(newAngle);
    this.heading.y = Math.sin(newAngle);
  }

  #takeDamage(fireSystem, deltaTime) {
    const col = Math.floor((this.x * PHYSICS_SCALE) / TILE_SIZE);
    const row = Math.floor((this.y * PHYSICS_SCALE) / TILE_SIZE);

    const damage = fireSystem.getDamage(row, col);
    this.health -= damage * 50 * deltaTime;
  }

  isDead() {
    return this.#isFatal;
  }

  #getAISLevel() {
    for (let i = INJURY_SCALE.length - 1; i >= 0; i--) {
      if (this.health <= INJURY_SCALE[i].minHealth) return INJURY_SCALE[i];
    }
    return INJURY_SCALE[0];
  }
}
