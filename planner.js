class Planner {
  constructor() {
    this.subscribers = [];
    this.state = this.getDefaultState();
  }

  getDefaultState() {
    return {
      meta: {
        name: "Project Plan",
        version: 1
      },
      settings: {
        baseLink: ""
      },
      timelines: [],
      tasks: []
    };
  }

  // Subscribe to changes
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  // Notify all subscribers
  notify() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Add a new task
  addTask(task) {
    this.state.tasks.push(task);
    this.notify();
  }

  // Remove a task by ID (for future phases, but good to have)
  removeTask(taskId) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
    this.notify();
  }

  // Overwrite entire state (used for loading from JSON)
  loadState(newState) {
    // Basic validation
    if (newState && newState.tasks) {
      this.state = newState;
      this.notify();
    } else {
      console.error("Invalid state object");
    }
  }

  getState() {
    return this.state;
  }
}

// Instantiate a global planner instance
const planner = new Planner();
