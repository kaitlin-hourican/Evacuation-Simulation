export class Agent {
    constructor(x, y, tileSize) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.radius = tileSize * 0.3;

        this.speed = 1.5;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#cdd9e5";
        ctx.fill();
    }

    update(flowfield) {
        // get current position
        const col = Math.floor(this.x / this.tileSize);
        const row = Math.floor(this.y / this.tileSize);

        // get vector for position
        const vector = flowfield.getVector(row, col);

        // if vector is 0 (ie goal cell), signal removal
        if (vector.x === 0 && vector.y === 0) return true;

        // move agent
        this.x += vector.x * this.speed;
        this.y += vector.y * this.speed;

        return false;
    }
}