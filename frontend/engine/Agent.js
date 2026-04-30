import { TILE_TYPES } from "./constants.js";

export class Agent {
    constructor(x, y, tileSize, scale) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.scale = scale;
        this.radius = 0.2;
        this.speed = 1.5;
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
        const vector = flowfield.getVector(row, col);

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
        this.x += this.speed * normalisedVector.x * deltaTime;
        this.y += this.speed * normalisedVector.y * deltaTime;

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

}