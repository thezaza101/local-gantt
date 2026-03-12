class GanttRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.zoomFactor = 100; // default px per unit
  }

  setZoomFactor(zoom) {
    this.zoomFactor = zoom;
  }

  render(state) {
    // Clear current container
    this.container.innerHTML = '';

    const tasks = state.tasks || [];

    // Simple vertical layout logic
    const rowHeight = 50;
    const topMargin = 10;

    // Sort tasks by start time
    const sortedTasks = [...tasks].sort((a, b) => a.timeline.start - b.timeline.start);

    // Keep track of rows to avoid overlap
    const rows = []; // array of end times for each row

    sortedTasks.forEach(task => {
      const startX = task.timeline.start * this.zoomFactor;
      const duration = (task.timeline.end - task.timeline.start) * this.zoomFactor;
      const width = Math.max(duration, 5); // Ensure at least 5px wide

      // Find an available row
      let rowIdx = 0;
      for (let i = 0; i < rows.length; i++) {
        // If the row ends before the start of this task, we can use it
        if (rows[i] <= task.timeline.start) {
          rowIdx = i;
          break;
        }
        rowIdx++;
      }

      // Update row end time to current task's end time
      // Expand rows array if needed
      if (rowIdx >= rows.length) {
          rows.push(task.timeline.end);
      } else {
          rows[rowIdx] = task.timeline.end;
      }

      const topY = topMargin + (rowIdx * rowHeight);

      const block = document.createElement('div');
      block.className = 'gantt-block';

      // Setting styles for positioning and size
      block.style.left = `${startX}px`;
      block.style.width = `${width}px`;
      block.style.top = `${topY}px`;

      // Prevent dragging native images/text to simplify future phases
      block.draggable = false;

      // Add HTML content safely
      const idSpan = document.createElement('span');
      idSpan.className = 'task-id';
      idSpan.textContent = task.id;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'task-title';
      titleSpan.textContent = task.title;

      block.appendChild(idSpan);
      block.appendChild(titleSpan);

      this.container.appendChild(block);
    });

    // Adjust container height dynamically based on the number of rows
    const containerHeight = Math.max(200, topMargin + (rows.length * rowHeight) + topMargin);
    this.container.style.minHeight = `${containerHeight}px`;
  }
}
