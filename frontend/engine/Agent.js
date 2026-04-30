import { TILE_TYPES } from "./constants.js";

export class Agent {
    constructor(x, y, tileSize, scale) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.scale = scale;
        this.radius = 0.2;
        this.speed = 1.5;
        this.heading = 0;               // current facing angle in rad
        this.turnRate = Math.PI * 2;    // max radiians/sec
        this.wallAvoidance = Math.random();
    }

    draw(ctx) {
        const px = this.x * this.scale;
        const py = this.y * this.scale;
        const pr = this.radius * this.scale;

        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = "#cdd9e5";
        ctx.fill();
    }

    update(flowfield, deltaTime, agents) {
        // get tile + check for goal
        const col = Math.floor((this.x * this.scale) / this.tileSize);
        const row = Math.floor((this.y * this.scale) / this.tileSize);

        const tileValue = flowfield.grid.getTile(row, col);
        if (tileValue === TILE_TYPES.GOAL) return true;

        // move along vector
        const vector = this.#getInterpolatedVector(flowfield);
        const repulsion = this.#getObstacleRepulsion(flowfield);

        // blend repulsion with flowfiled
        vector.x = vector.x * 0.85 + repulsion.x * 0.15;
        vector.y = vector.y * 0.85 + repulsion.y * 0.15;

        // normalise vector
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        const normalisedVector = length > 0 
                                ? { x: vector.x / length, y: vector.y / length }
                                : { x: 0, y: 0};

        if (normalisedVector.x !== 0 && normalisedVector.y !== 0) {
            const nextCol = Math.floor(((this.x + normalisedVector.x * this.speed * 0.1) * this.scale) / this.tileSize);
            const nextRow = Math.floor(((this.y + normalisedVector.y * this.speed * 0.1) * this.scale) / this.tileSize);

            if (flowfield.grid.getTile(row, nextCol) === TILE_TYPES.OBSTACLE) {
                normalisedVector.x = 0;
            }

            if (flowfield.grid.getTile(nextRow, col) === TILE_TYPES.OBSTACLE) {
                normalisedVector.y = 0;
            }
        }

        // update position
        // gradually steer towards the flow field direction
        this.#gradualTurning(vector, deltaTime);

        // move in the direction of current heading
        this.x += this.speed * Math.cos(this.heading) * deltaTime;
        this.y += this.speed * Math.sin(this.heading) * deltaTime;


        this.#resolveAgentCollisions(agents);

        this.#resolveWallCollisions(flowfield);


        // boundary clamping
        const minX = this.radius;
        const maxX = (flowfield.grid.cols * this.tileSize / this.scale) - this.radius;
        const minY = this.radius;
        const maxY = (flowfield.grid.rows * this.tileSize / this.scale) - this.radius;

        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));

        return false;
    }

    #resolveAgentCollisions(agents) {
        for (const other of agents) {
            if (other === this) continue;

            // calculate distances
            const dx = this.x - other.x;
            const dy = this.y - other.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) continue; 

            const overlap = (this.radius + other.radius) - distance;

            if (overlap > 0) {
                this.x += (dx / distance) * (overlap / 2);
                this.y += (dy / distance) * (overlap / 2);
            }
        }
    }

    #resolveWallCollisions(flowfield) {
        const tileSize = this.tileSize / this.scale;
        const neighbourhood = [
            [0, 0],
            [-1,  0], [1,  0], [0, -1], [0,  1],  
            [-1, -1], [-1, 1], [1, -1], [1,  1]
        ];

        const agentX = Math.floor((this.x * this.scale) / this.tileSize);
        const agentY = Math.floor((this.y * this.scale) / this.tileSize);

        // loop through neighbourhood
        for (const [dr, dc] of neighbourhood) {
            const row = agentY + dr;
            const col = agentX + dc;

            if (flowfield.grid.getTile(row, col) !== TILE_TYPES.OBSTACLE) continue;

            const tileLeft = col * tileSize;
            const tileRight = tileLeft + tileSize;
            const tileTop = row * tileSize;
            const tileBottom = tileTop + tileSize;

            // closest wall edge
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

    #getObstacleRepulsion(flowfield) {
        const repulsionRadius = 1.5;
        const repulsionStrength = 0.3 * this.wallAvoidance;

        let repulsion = { x: 0, y: 0 };
    
        const agentTileX = Math.floor((this.x * this.scale) / this.tileSize);
        const agentTileY = Math.floor((this.y * this.scale) / this.tileSize);
        
        // Check nearby tiles
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                if (flowfield.grid.getTile(agentTileY + dy, agentTileX + dx) === TILE_TYPES.OBSTACLE) {
                    // Push away from this obstacle tile
                    repulsion.x -= dx * repulsionStrength;
                    repulsion.y -= dy * repulsionStrength;
                }
            }
        }
        
        return repulsion;
    }

    #getInterpolatedVector(flowfield) {
        const tileMetres = this.tileSize / this.scale;

        // position in tile units (not integers - fractional position across grid)
        const tx = (this.x / tileMetres) - 0.5;
        const ty = (this.y / tileMetres) - 0.5;

        // integer tile coords of top-left of the 4 surrounding tiles
        const col0 = Math.floor(tx);
        const row0 = Math.floor(ty);

        // fractional part - how far between col0 and col0+1
        const fx = tx - col0; // 0 to 1
        const fy = ty - row0; // 0 to 1

        const wTL = (1 - fx) * (1 - fy); // 0.25 * 0.75 = 0.1875
        const wTR =      fx  * (1 - fy); // 0.75 * 0.75 = 0.5625
        const wBL = (1 - fx) *      fy;  // 0.25 * 0.25 = 0.0625
        const wBR =      fx  *      fy;  // 0.75 * 0.25 = 0.1875

        const vTL = flowfield.getVector(row0, col0);
        const vTR = flowfield.getVector(row0, col0 + 1);
        const vBL = flowfield.getVector(row0 + 1, col0);
        const vBR = flowfield.getVector(row0 + 1, col0 + 1);

        return {
            x: vTL.x * wTL + vTR.x * wTR + vBL.x * wBL + vBR.x * wBR,
            y: vTL.y * wTL + vTR.y * wTR + vBL.y * wBL + vBR.y * wBR
        };
    }

    #gradualTurning(vector, deltaTime) {
        // Get desired angle from interpolated vector
        const desiredAngle = Math.atan2(vector.y, vector.x);

        // Find the shortest angular difference between current heading and desired angle
        let angleDiff = desiredAngle - this.heading;

        // Normalize angle difference to [-π, π] (handle wraparound at 2π)
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Clamp difference to turnRate * deltaTime
        const maxTurnThisFrame = this.turnRate * deltaTime;
        const clampedDiff = Math.max(-maxTurnThisFrame, Math.min(maxTurnThisFrame, angleDiff));

        // Add clamped difference to heading
        this.heading += clampedDiff;

        // Normalize heading to [0, 2π)
        this.heading = ((this.heading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    }
}