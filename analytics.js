class AnalyticsRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(state) {
    const tasks = state.tasks || [];

    if (tasks.length === 0) {
      this.container.innerHTML = `<p class="text-muted">No tasks available for analytics.</p>`;
      return;
    }

    let totalDesign = 0;
    let totalDev = 0;
    let totalTest = 0;

    tasks.forEach(task => {
      totalDesign += task.effort.design || 0;
      totalDev += task.effort.dev || 0;
      totalTest += task.effort.test || 0;
    });

    const totalEffort = totalDesign + totalDev + totalTest;

    this.container.innerHTML = `
      <div class="row">
        <div class="col-md-4 mb-3">
          <div class="card h-100 border-light shadow-sm">
            <div class="card-body text-center">
              <h5 class="card-title text-muted">Total Tasks</h5>
              <h2 class="display-5">${tasks.length}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card h-100 border-light shadow-sm">
            <div class="card-body text-center">
              <h5 class="card-title text-muted">Total Effort</h5>
              <h2 class="display-5">${totalEffort}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card h-100 border-light shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-muted">Effort Breakdown</h5>
              <div class="d-flex justify-content-between">
                <span>Design:</span> <strong>${totalDesign}</strong>
              </div>
              <div class="d-flex justify-content-between">
                <span>Dev:</span> <strong>${totalDev}</strong>
              </div>
              <div class="d-flex justify-content-between">
                <span>Test:</span> <strong>${totalTest}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
