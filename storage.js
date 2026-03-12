const storage = {
  exportPlan(state) {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-plan-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  },

  importPlan(file, onComplete) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (json && json.tasks !== undefined) {
          onComplete(json);
        } else {
          alert('Invalid project plan file format.');
        }
      } catch (err) {
        console.error("Error parsing JSON file", err);
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  }
};
