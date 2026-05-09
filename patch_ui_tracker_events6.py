import re

with open('ui.js', 'r') as f:
    content = f.read()

events_start = """        if (openTrackerBtn && trackerContainer) {
            openTrackerBtn.addEventListener("click", () => {
                trackerContainer.classList.remove("d-none");
                trackerContainer.style.display = 'flex'; // Enforce display
                trackerContainer.style.zIndex = '1050'; // Ensure it's above other elements
                if (window.TrackerEngine) { window.TrackerEngine.render(); }
            });
        }"""

events_repl = """        if (openTrackerBtn && trackerContainer) {
            openTrackerBtn.addEventListener("click", () => {
                trackerContainer.classList.remove("d-none");
                trackerContainer.classList.add("d-flex");
                trackerContainer.style.display = 'flex'; // Enforce display
                trackerContainer.style.zIndex = '1050'; // Ensure it's above other elements
                if (window.TrackerEngine) { window.TrackerEngine.render(); }
            });
        }"""

content = content.replace(events_start, events_repl)

with open('ui.js', 'w') as f:
    f.write(content)
