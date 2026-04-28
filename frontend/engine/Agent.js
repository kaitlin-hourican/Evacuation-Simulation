import { TILE_TYPES } from "./constants.js";

export class Agent {
    constructor(x, y, tileSize, scale) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.scale = scale;
        this.radius = 0.3;

        this.velocity = { x: 0, y: 0 };
        this.mass = 80;
        this.desiredSpeed = 1.5;
        this.relaxationTime = 0.5;

        this.repulsionA = 2000;
        this.repulsionB = 0.08;
        this.repulsionCutoff = 3;

        this.wallRepulsionA = 2000;
        this.wallRepulsionB = 0.08;
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
        // get repulsion force
        const agentRepulsionForce = this.#calculateRepulsion(agents);
        const wallRepulsionForce = this.#calculateWallRepulsion(flowfield);

        // get current position
        const col = Math.floor((this.x * this.scale) / this.tileSize);
        const row = Math.floor((this.y * this.scale) / this.tileSize);

        // get vector for position
        const vector = flowfield.getVector(row, col);

        // if cell type is goal - remove
        const tileValue = flowfield.grid.getTile(row, col);
        if (tileValue === TILE_TYPES.GOAL) return true;

        // normalise vector
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        const normalisedVector = length > 0 
                                ? { x: vector.x / length, y: vector.y / length }
                                : { x: 0, y: 0};

        // calculate drivign force
        const drivingForce = {
            x: (this.desiredSpeed * normalisedVector.x - this.velocity.x) / this.relaxationTime,
            y: (this.desiredSpeed * normalisedVector.y - this.velocity.y) / this.relaxationTime,
        }

        // total force
        const totalForce = {
            x: drivingForce.x + agentRepulsionForce.x + wallRepulsionForce.x,
            y: drivingForce.y + agentRepulsionForce.y + wallRepulsionForce.y
        };

        // apply force to velocity 
        const acceleration = {
            x: totalForce.x / this.mass,
            y: totalForce.y / this.mass
        };

        this.velocity.x += acceleration.x * deltaTime;
        this.velocity.y += acceleration.y * deltaTime;

        // cap speed because they keep overshooting
        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (currentSpeed > this.desiredSpeed) {
            this.velocity.x = (this.velocity.x / currentSpeed) * this.desiredSpeed;
            this.velocity.y = (this.velocity.y / currentSpeed) * this.desiredSpeed;
        }

        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;

        // boundary check - they keyy running away?!!!!!
        // this.x = Math.max(this.radius, Math.min(this.grid.width - this.radius, this.x));
        // this.y = Math.max(this.radius, Math.min(this.grid.height - this.radius, this.y));

        return false;
    }

    #calculateRepulsion(agents) {
        // Initialises a repulsion force { x: 0, y: 0 }
        const repulsionForce = { x: 0, y: 0 };

        // Loops all agents, skipping this (an agent doesn't repel itself)
        for (const neighbour of agents) {
            if (neighbour === this) continue;

            // Calculates dx, dy, dij between this agent and each other
            const rij = this.radius + neighbour.radius;
            const dx = this.x - neighbour.x;
            const dy = this.y - neighbour.y;
            const dij = Math.sqrt(dx * dx + dy * dy);

            // Skips if dij === 0 (avoid division by zero) or dij > some cutoff distance
            if (dij === 0 || dij > this.repulsionCutoff) continue;

            // Calculates nij — normalised vector from other agent toward this one (dx/dij, dy/dij)
            const nij = { x: dx / dij, y: dy / dij };

            // Calculates repulsion magnitude: A * exp((rij - dij) / B)
            const repulsionMagnitude = this.repulsionA * Math.exp((rij - dij) / this.repulsionB);
        
            // Adds magnitude * nij to the repulsion force
            repulsionForce.x += repulsionMagnitude * nij.x;
            repulsionForce.y += repulsionMagnitude * nij.y;
        }

        // Returns the total repulsion force 
        return repulsionForce;
    }

    #calculateWallRepulsion(flowfield) {
        // Initialise force { x: 0, y: 0 }
        const repulsionForce = { x: 0, y: 0 };

        // Loop the 8 Moore neighbours plus current tile
        const mooreNeighbours = [
            [0, 0],                               // current position
            [-1,  0], [1,  0], [0, -1], [0,  1],  // cardinal
            [-1, -1], [-1, 1], [1, -1], [1,  1]   // diagonal
        ];

        // get current position
        const currentCol = Math.floor((this.x * this.scale) / this.tileSize);
        const currentRow = Math.floor((this.y * this.scale) / this.tileSize);

        for (const [dr, dc] of mooreNeighbours) {
            const row = currentRow + dr;
            const col = currentCol + dc;

            // Skip if not an obstacle tile — use flowfield.grid.getTile()
            if (flowfield.grid.getTile(row, col) !== TILE_TYPES.OBSTACLE) continue;

            // Calculate pixel distance from agent centre to obstacle tile centre
            const wallX = (col * this.tileSize + this.tileSize / 2) / this.scale;
            const wallY = (row * this.tileSize + this.tileSize / 2) / this.scale;

            const dx = this.x - wallX;
            const dy = this.y - wallY;
            const dij = Math.sqrt(dx * dx + dy * dy);

            // Skip if distance > cutoff
            if (dij === 0 || dij > this.repulsionCutoff) continue;

            // Calculates nij — normalised vector 
            const nij = { x: dx / dij, y: dy / dij };

            // Calculate magnitude and add to force
            const repulsionMagnitude = this.wallRepulsionA * Math.exp((this.radius - dij) / this.wallRepulsionB);
        
            // Adds magnitude * nij to the repulsion force
            repulsionForce.x += repulsionMagnitude * nij.x;
            repulsionForce.y += repulsionMagnitude * nij.y;
        }

        return repulsionForce;
    
    }
}