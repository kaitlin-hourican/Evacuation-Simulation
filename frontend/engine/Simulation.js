import { Agent } from "./Agent.js";

export class Simulation {
    constructor(grid, flowfield, ctx, agentCount) {
        this.grid = grid;
        this.flowfield = flowfield;
        this.ctx = ctx;
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
}