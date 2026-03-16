// handles the user interface toolbar for the simulation
// manages mode switching, tool selection, and dispatches events for the rest of the app

export class Toolbar {
    constructor() {
        // current application mode
        // edit allows map editing, run starts the simulation
        this.mode = "edit";

        // currently selected editing tool
        this.tool = "draw";  // "draw" | "erase" | "goal" | "spawn"

        // dom references for toolbar elements
        this._panel         = document.getElementById("abms-panel");
        this._modeBtn       = document.getElementById("btn-mode-toggle");
        this._modeLabel     = document.getElementById("mode-label");
        this._modeIndicator = document.getElementById("mode-indicator");

        // tool buttons
        this._btnDraw       = document.getElementById("btn-draw");
        this._btnErase      = document.getElementById("btn-erase");

        this._btnGoal       = document.getElementById("btn-goal");
        this._btnSpawn      = document.getElementById("btn-spawn");

        // utility buttons
        this._btnClear      = document.getElementById("btn-clear");

        // attach event listeners
        this._bindEvents();
    }

    // binds click handlers to all toolbar buttons
    // these update the internal state and notify the rest of the application
    _bindEvents() {

        // toggle between edit mode and run mode
        this._modeBtn.addEventListener("click", () => {
            this._setMode(this.mode === "edit" ? "run" : "edit");
        });

        // tool selection buttons
        this._btnDraw.addEventListener("click",  () => this._setTool("draw"));
        this._btnErase.addEventListener("click", () => this._setTool("erase"));

        this._btnGoal.addEventListener("click", () => this._setTool("goal"));
        this._btnSpawn.addEventListener("click", () => this._setTool("spawn"));

        // clear button does not change tool
        // instead it triggers a clear event for the grid
        this._btnClear.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("tool-change", { detail: "clear" }));
        });
    }

    // updates the current application mode
    // also updates the toolbar ui to reflect the active mode
    _setMode(mode) {
        this.mode = mode;
        const isRun = mode === "run";

        // retract toolbar when simulation is running
        this._panel.classList.toggle("retracted", isRun);

        // update button label and styling
        this._modeBtn.textContent = isRun ? "Edit Map" : "Run Simulation";
        this._modeBtn.classList.toggle("run-mode", isRun);

        // update status indicator
        this._modeLabel.textContent = isRun ? "running" : "edit";
        this._modeIndicator.classList.toggle("running", isRun);

        // notify other parts of the app that mode changed
        document.dispatchEvent(new CustomEvent("mode-change", { detail: mode }));
    }

    // sets the currently active editing tool
    // also updates the button highlight to show the selected tool
    _setTool(tool) {

        // store new tool selection
        this.tool = tool;

        // update active state for tool buttons
        this._btnDraw.classList.toggle("active",  tool === "draw");
        this._btnErase.classList.toggle("active", tool === "erase");
        this._btnGoal.classList.toggle("active",  tool === "goal");
        this._btnSpawn.classList.toggle("active", tool === "spawn");
        
        // notify the application that the tool changed 
        document.dispatchEvent(new CustomEvent("tool-change", { detail: tool })); 
    } 
}