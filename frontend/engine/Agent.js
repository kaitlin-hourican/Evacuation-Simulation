import { TILE_TYPES } from "./constants.js";

export class Agent {
    constructor(x, y, tileSize) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.radius = tileSize * 0.3;

        this.speed = 1.5;
        this.velocity = { x: 0, y: 0 };
        this.mass = 1;
        this.desiredSpeed = this.tileSize * 3;
        this.relaxationTime = 0.5;

        this.repulsionA = 2000;
        this.repulsionB = this.tileSize * 0.5;
        this.repulsionCutoff = this.tileSize * 3;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#cdd9e5";
        ctx.fill();
    }

    update(flowfield, deltaTime, agents) {
        // get repulsion force
        const repulsionForce = this.#calculateRepulsion(agents);

        // get current position
        const col = Math.floor(this.x / this.tileSize);
        const row = Math.floor(this.y / this.tileSize);

        // get vector for position
        const vector = flowfield.getVector(row, col);

          console.log("agent vector", vector, "deltaTime", deltaTime, "velocity", this.velocity);

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
            x: drivingForce.x + repulsionForce.x,
            y: drivingForce.y + repulsionForce.y
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
            const repulsionMagnitude = this.repulsionA * Math.exp(rij - dij) / this.repulsionB;
        
            // Adds magnitude * nij to the repulsion force
            repulsionForce.x += repulsionMagnitude * nij.x;
            repulsionForce.y += repulsionMagnitude * nij.y;
        }

        // Returns the total repulsion force 
        return repulsionForce;
    }
}