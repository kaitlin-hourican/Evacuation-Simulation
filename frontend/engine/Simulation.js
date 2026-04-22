import { Agent } from "./Agent.js";

export class Simulation {

    #running = false;
    #animFrameId = null;
    #onRender;

    constructor(grid, flowfield, ctx, agentCount, onRender) {
        this.grid = grid;
        this.flowfield = flowfield;
        this.ctx = ctx;
        this.#onRender = onRender;
        this.agentCount = agentCount;
        this.agents = [];
    }

    spawnAgents() {
        this.agents = [];
        const cells = this.grid.getSpawnCells();

        // fisher-yates shuffle algorithm 
        let currentIndex = cells.length;
        let randomIndex;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [cells[currentIndex], cells[randomIndex]] = [cells[randomIndex], cells[currentIndex]];
        }
 
        // take agentCount num of cells
        const selected = cells.slice(0, this.agentCount);

        // calculate centre px coords
        selected.forEach(cell => {
            const x = cell.col * this.grid.tileSize + this.grid.tileSize / 2;
            const y = cell.row * this.grid.tileSize + this.grid.tileSize / 2;
            
            this.agents.push(new Agent(x, y, this.grid.tileSize));
        })


    }

    draw() {
        this.agents.forEach(agent => agent.draw(this.ctx));
    }

    clear() {
        this.agents = [];
    }

    start() {
        this.#running = true;
        this.#update();
    }

    #update() {
        if (!this.#running) return;

        this.agents = this.agents.filter(agent => !agent.update(this.flowfield));
        
        if (this.agents.length === 0) {
            this.stop();
            this.#onRender();
            return;
        }

        this.#onRender();
        this.#animFrameId = requestAnimationFrame(() => this.#update());
    }

    stop() {
        this.#running = false;
        cancelAnimationFrame(this.#animFrameId);
    }
}