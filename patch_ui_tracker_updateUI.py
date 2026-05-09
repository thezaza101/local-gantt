import re

with open('ui.js', 'r') as f:
    content = f.read()

update_ui_bottom = """        if (window.AnalyticsEngine) {
            const container = document.getElementById("analyticsContainer");
            if (container && !container.classList.contains("d-none")) {
                if (window.AnalyticsEngine) { window.AnalyticsEngine.render(this.planner.getCurrentPlan()); }
            }
        }"""

update_ui_repl = """        if (window.AnalyticsEngine) {
            const container = document.getElementById("analyticsContainer");
            if (container && !container.classList.contains("d-none")) {
                if (window.AnalyticsEngine) { window.AnalyticsEngine.render(this.planner.getCurrentPlan()); }
            }
        }

        // Trigger Tracker re-render if visible
        if (window.TrackerEngine) {
            const container = document.getElementById("trackerContainer");
            if (container && !container.classList.contains("d-none")) {
                window.TrackerEngine.render();
            }
        }"""

content = content.replace(update_ui_bottom, update_ui_repl)

with open('ui.js', 'w') as f:
    f.write(content)
