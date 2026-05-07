import { INJURY_SCALE } from "./constants.js";

export class StatsController {
  constructor() {
    this.totalAgents = document.getElementById("stat-total");
    this.timer = document.getElementById("stat-timer");

    this.evacBar = document.getElementById("bar-evacuated");
    this.evacCount = document.getElementById("stat-evacuated-count");
    this.remainCount = document.getElementById("stat-remaining-count");

    this.injuryBars = {};
    this.injuryTexts = {};

    this.#setupStaticUI();
  }

  #setupStaticUI() {
    const legendContainer = document.getElementById("ais-legend");
    if (!legendContainer) return;

    legendContainer.innerHTML = "";

    INJURY_SCALE.forEach((item) => {
      this.injuryBars[item.level] = document.querySelector(
        `.injury-bar[data-level="${item.level}"]`,
      );

      const row = document.createElement("div");
      row.className = "legend-item";

      row.innerHTML = `
        <div class="legend-label-group">
          <span class="dot" style="background:${item.color}"></span>
          <span class="stat-text">${item.label}</span>
        </div>
        <span class="stat-number" id="ais-${item.level}">0</span>
      `;

      legendContainer.appendChild(row);
      this.injuryTexts[item.level] = document.getElementById(
        `ais-${item.level}`,
      );
    });
  }

  update(stats, activeAgents) {
    if (!stats) return;

    const total = stats.spawned || 0;
    const evacPercent = total > 0 ? (stats.evacuated / total) * 100 : 0;

    // summary
    this.totalAgents.textContent = total;
    this.timer.textContent = this.#formatTime(stats.elapsed);

    // evac % bar
    this.evacBar.style.width = `${evacPercent}%`;
    this.evacCount.textContent = stats.evacuated;
    this.remainCount.textContent = activeAgents;

    //ais bar chart
    INJURY_SCALE.forEach((item) => {
      const count = stats.injuryLevels[item.level] || 0;
      const barHeight = total > 0 ? (count / total) * 100 : 0;

      if (this.injuryBars[item.level]) {
        this.injuryBars[item.level].style.height = `${barHeight}%`;
        this.injuryBars[item.level].style.backgroundColor = item.color;
      }
      if (this.injuryTexts[item.level]) {
        this.injuryTexts[item.level].textContent = count;
      }
    });
  }

  #formatTime(seconds) {
    const sec = Math.floor(seconds);
    const ms = Math.floor((seconds % 1) * 10);
    return `${Math.floor(sec / 60)
      .toString()
      .padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}.${ms}`;
  }
}
