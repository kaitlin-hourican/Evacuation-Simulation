export class Toolbar {
  constructor(grid) {
    this._grid = grid;
    this.mode = "edit";
    this.tool = "draw";

    this._tabs = {
      edit: {
        btn: document.getElementById("btn-edit-tab"),
        panel: document.getElementById("edit-panel"),
      },
      stats: {
        btn: document.getElementById("btn-stats-tab"),
        panel: document.getElementById("stats-panel"),
      },
    };

    // DOM References
    this._modeBtn = document.getElementById("btn-mode-toggle");
    this._modeLabel = document.getElementById("mode-label");
    this._modeIndicator = document.getElementById("mode-indicator");
    this._btnHelp = document.getElementById("btn-help");
    this._btnStyle = document.getElementById("btn-style-toggle");
    this._helpModal = document.getElementById("help-modal");
    this._btnCloseModal = document.getElementById("btn-close-modal");

    // tools
    this._brushButtons = {
      drawTile: document.getElementById("btn-draw-tile"),
      drawLine: document.getElementById("btn-draw-line"),
      drawRect: document.getElementById("btn-draw-rect"),
      drawRectFilled: document.getElementById("btn-draw-rect-filled"),
    };

    this._typeButtons = {
      obstacle: document.getElementById("btn-type-obstacle"),
      spawn: document.getElementById("btn-type-spawn"),
      goal: document.getElementById("btn-type-goal"),
      fire: document.getElementById("btn-type-fire"),
      erase: document.getElementById("btn-erase"),
    };

    this._toolButtons = {
      clear: document.getElementById("btn-clear"),
      import: document.getElementById("btn-import"),
      export: document.getElementById("btn-export"),
    };

    this.brush = "drawTile";
    this.tileType = "obstacle";

    this._params = {
      agentCount: document.getElementById("input-agent-count"),
      agentSpeed: document.getElementById("slider-agent-speed"),
      fireSpread: document.getElementById("slider-fire-spread"),
    };

    this._sliderIcons = document.querySelectorAll(".slider-icon");

    this._statusText = document.getElementById("status-text");
    this._statusMessage = document.getElementById("status-message");

    this._bindEvents();
  }

  _bindEvents() {
    // sidebar
    this._tabs.edit.btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._toggleSidebar("edit");
    });
    this._tabs.stats.btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._toggleSidebar("stats");
    });

    this._params.agentCount.addEventListener("input", () => {
      const max = parseInt(this._params.agentCount.max) || 500;
      const val = parseInt(this._params.agentCount.value);
      if (val > max) {
        this._params.agentCount.value = max;
        this._showStatus(
          `Agent count capped at ${max} (available spawn tiles)`,
        );
      }
    });

    // help modal
    this._btnHelp.addEventListener("click", () => {
      this._helpModal.style.display = "block";
    });

    this._btnCloseModal.addEventListener("click", () => {
      this._helpModal.style.display = "none";
    });

    // theme toggle
    this._btnStyle.addEventListener("click", () => this._toggleTheme());

    // mode toggle
    this._modeBtn.addEventListener("click", () => this._handleModeToggle());

    // tool selection
    Object.keys(this._brushButtons).forEach((brushKey) => {
      this._brushButtons[brushKey].addEventListener("click", () => {
        this._setBrush(brushKey);
      });
    });

    Object.keys(this._typeButtons).forEach((typeKey) => {
      this._typeButtons[typeKey].addEventListener("click", () => {
        this._setTileType(typeKey);
      });
    });

    this._toolButtons.import.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("app-import"));
    });

    this._toolButtons.export.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("app-export"));
    });

    this._toolButtons.clear.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("app-tool-change", { detail: "clear" }),
      );
    });

    // slider (zoom/agents/speed) +/- buttons
    this._setupSliderControls();

    // close -for everythign
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this._closeAllOverlays();
    });

    window.addEventListener("click", (e) => {
      if (e.target === this._helpModal) this._helpModal.style.display = "none";

      const sidebarContainer = document.querySelector(".sidebar-container");
      if (sidebarContainer && !sidebarContainer.contains(e.target)) {
        this._closeAllSidebars();
      }
    });
  }

  _handleModeToggle() {
    const nextMode = this.mode === "edit" ? "run" : "edit";

    if (nextMode === "run") {
      if (!this._grid.hasGoal() || !this._grid.hasSpawn()) {
        this._showStatus("Need a goal and spawn zone to run");
        return;
      }
      this._closeAllSidebars();
    }

    this._updateModeUI(nextMode);

    document.dispatchEvent(
      new CustomEvent("app-mode-change", { detail: nextMode }),
    );
  }

  _updateModeUI(mode) {
    this.mode = mode;
    const isRun = mode === "run";

    this._modeBtn.textContent = isRun ? "Stop Simulation" : "Run Simulation";
    this._modeBtn.classList.toggle("run-mode", isRun);
    this._modeLabel.textContent = isRun ? "running" : "edit";
    this._modeIndicator.classList.toggle("running", isRun);
  }

  _setBrush(brush) {
    this.brush = brush;
    Object.keys(this._brushButtons).forEach((key) => {
      this._brushButtons[key].classList.toggle("active", key === brush);
    });

    document.dispatchEvent(
      new CustomEvent("app-tool-change", {
        detail: { brush: this.brush, tileType: this.tileType },
      }),
    );
  }

  _setTileType(type) {
    this.tileType = type;
    Object.keys(this._typeButtons).forEach((key) => {
      this._typeButtons[key].classList.toggle("active", key === type);
    });
    document.dispatchEvent(
      new CustomEvent("app-tool-change", {
        detail: { brush: this.brush, tileType: this.tileType },
      }),
    );
  }

  _setTool(tool) {
    this.tool = tool;
    Object.keys(this._toolButtons).forEach((key) => {
      this._toolButtons[key].classList.toggle("active", key === tool);
    });
    document.dispatchEvent(
      new CustomEvent("app-tool-change", { detail: tool }),
    );
  }

  _toggleSidebar(selectedTab) {
    let anyOpen = false;

    Object.keys(this._tabs).forEach((key) => {
      const { btn, panel } = this._tabs[key];

      if (key === selectedTab) {
        const isOpening = panel.classList.contains("hidden");
        panel.classList.toggle("hidden", !isOpening);
        btn.classList.toggle("active", isOpening);
        if (isOpening) anyOpen = true;

        if (key === "edit" && isOpening && this.mode === "run") {
          this._handleModeToggle();
        }
      } else {
        panel.classList.add("hidden");
        btn.classList.remove("active");
      }
    });

    document.body.classList.toggle("sidebar-open", anyOpen);
  }

  openStatsPanel() {
    Object.keys(this._tabs).forEach((key) => {
      this._tabs[key].panel.classList.add("hidden");
      this._tabs[key].btn.classList.remove("active");
    });

    this._tabs.stats.panel.classList.remove("hidden");
    this._tabs.stats.btn.classList.add("active");
    document.body.classList.add("sidebar-open");
  }

  _toggleTheme() {
    const doc = document.documentElement;
    const current = doc.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";

    if (next === "light") doc.removeAttribute("data-theme");
    else doc.setAttribute("data-theme", "dark");

    localStorage.setItem("theme", next);
  }

  _setupSliderControls() {
    this._sliderIcons.forEach((icon) => {
      icon.addEventListener("click", () => {
        const targetId = icon.getAttribute("data-target");
        const input = Object.values(this._params).find(
          (el) => el.id === targetId,
        );

        if (input) {
          const isPlus = icon.classList.contains("btn-plus");
          const step = parseFloat(input.step) || 1;
          const currentVal = parseFloat(input.value);

          let newVal = isPlus ? currentVal + step : currentVal - step;

          const min = parseFloat(input.min);
          const max = parseFloat(input.max);
          if (!isNaN(min)) newVal = Math.max(min, newVal);
          if (!isNaN(max)) newVal = Math.min(max, newVal);

          input.value = newVal;

          input.dispatchEvent(new Event("input"));
        }
      });
    });
  }

  _closeAllOverlays() {
    this._helpModal.style.display = "none";
    this._closeAllSidebars();
  }

  _closeAllSidebars() {
    Object.keys(this._tabs).forEach((key) => {
      this._tabs[key].panel.classList.add("hidden");
      this._tabs[key].btn.classList.remove("active");
    });

    document.body.classList.remove("sidebar-open");
  }

  _showStatus(message) {
    this._statusText.textContent = message;
    this._statusMessage.classList.remove("hidden");
    clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(
      () => this._statusMessage.classList.add("hidden"),
      5000,
    );
  }

  updateAgentCap(spawnTileCount) {
    const input = this._params.agentCount;
    const hardMax = 500;
    const effectiveMax = Math.min(spawnTileCount, hardMax);

    input.max = effectiveMax;

    if (parseInt(input.value) === 0 || parseInt(input.value) > effectiveMax) {
      input.value = effectiveMax;
    }
  }

  get currentTool() {
    return { brush: this.brush, tileType: this.tileType };
  }
}
