document.addEventListener('DOMContentLoaded', () => {
  // Initialize Renderers
  const ganttRenderer = new GanttRenderer('ganttContainer');
  const analyticsRenderer = new AnalyticsRenderer('analyticsContainer');

  // Subscribe renderers to the planner state
  planner.subscribe(state => {
    ganttRenderer.render(state);
    analyticsRenderer.render(state);
  });

  // DOM Elements
  const addTaskForm = document.getElementById('addTaskForm');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const zoomFactorInput = document.getElementById('zoomFactor');

  // Add Task Event Listener
  addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Create a new task object from the form fields
    const task = {
      id: document.getElementById('taskId').value.trim(),
      title: document.getElementById('taskTitle').value.trim(),
      description: document.getElementById('taskDesc').value.trim(),
      effort: {
        design: parseFloat(document.getElementById('effortDesign').value) || 0,
        dev: parseFloat(document.getElementById('effortDev').value) || 0,
        test: parseFloat(document.getElementById('effortTest').value) || 0
      },
      tags: document.getElementById('taskTags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
      timeline: {
        start: isNaN(parseFloat(document.getElementById('taskStart').value)) ? 0 : parseFloat(document.getElementById('taskStart').value),
        end: isNaN(parseFloat(document.getElementById('taskEnd').value)) ? 1 : parseFloat(document.getElementById('taskEnd').value)
      }
    };

    // Ensure start is before end
    if (task.timeline.start >= task.timeline.end) {
      alert("Task 'End' must be strictly greater than 'Start'.");
      return;
    }

    planner.addTask(task);

    // Hide modal and reset form
    const addTaskModalEl = document.getElementById('addTaskModal');
    const modalInstance = bootstrap.Modal.getInstance(addTaskModalEl);
    modalInstance.hide();
    addTaskForm.reset();
  });

  // Export Event
  exportBtn.addEventListener('click', () => {
    const currentState = planner.getState();
    storage.exportPlan(currentState);
  });

  // Import Events
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      storage.importPlan(file, (newState) => {
        planner.loadState(newState);
      });
      // Reset the file input so you can re-import the same file if needed
      importFile.value = '';
    }
  });

  // Zoom Handling
  zoomFactorInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      ganttRenderer.zoomFactor = value;
      // Re-render immediately
      ganttRenderer.render(planner.getState());
    }
  });

  // Initial render
  planner.notify();
});
