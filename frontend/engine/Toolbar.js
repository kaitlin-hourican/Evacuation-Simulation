export class Toolbar {
    constructor() {
        // tracks whether in "edit" or "un" mode - default is "edit"
        this.mode = "edit";  
        // tracks which tool is active
        this.tool = "draw";  // "draw" | "erase"

        // DOM references
        this._panel         = document.getElementById("abms-panel");
        this._modeBtn       = document.getElementById("btn-mode-toggle");
        this._modeLabel     = document.getElementById("mode-label");
        this._modeIndicator = document.getElementById("mode-indicator");

        this._btnDraw       = document.getElementById("btn-draw");
        this._btnErase      = document.getElementById("btn-erase");

        this._btnGoal       = document.getElementById("btn-goal");

        this._btnClear      = document.getElementById("btn-clear");

        this._bindEvents();
    }

    
    _bindEvents() {
        // toggle between edit and run modes
        this._modeBtn.addEventListener("click", () => {
            this._setMode(this.mode === "edit" ? "run" : "edit");
        });

        // set tool to value of different btns
        this._btnDraw.addEventListener("click",  () => this._setTool("draw"));
        this._btnErase.addEventListener("click", () => this._setTool("erase"));

        this._btnGoal.addEventListener("click", () => this._setTool("goal"));

        this._btnClear.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("tool-change", { detail: "clear" }));
        });
    }

    // set mode (run / edit)
    // updates ui based on mode
    _setMode(mode) {
        this.mode = mode;
        const isRun = mode === "run";

        this._panel.classList.toggle("retracted", isRun);
        this._modeBtn.textContent = isRun ? "Edit Map" : "Run Simulation";
        this._modeBtn.classList.toggle("run-mode", isRun);
        this._modeLabel.textContent = isRun ? "running" : "edit";
        this._modeIndicator.classList.toggle("running", isRun);

        document.dispatchEvent(new CustomEvent("mode-change", { detail: mode }));
    }

    // sets current tool
    _setTool(tool) {
        // set tool to new val
        this.tool = tool;

        // add active class to btn of specific param val
        this._btnDraw.classList.toggle("active",  tool === "draw");
        this._btnErase.classList.toggle("active", tool === "erase");
        this._btnGoal.classList.toggle("active", tool === "goal");

        document.dispatchEvent(new CustomEvent("tool-change", { detail: tool }));
    }
}