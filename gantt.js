/* Gantt Engine Placeholder */

class Gantt {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(plan) {
        if (!this.container || !plan) return;

        this.container.innerHTML = `<div class="p-3 border rounded text-center text-muted">Gantt Chart Area</div>`;
    }
}