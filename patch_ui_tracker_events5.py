import re

with open('ui.js', 'r') as f:
    content = f.read()

events_start = """        const trackerContainer = document.getElementById("trackerContainer");
        const openTrackerBtn = document.getElementById("openTrackerBtn");
        const closeTrackerBtn = document.getElementById("closeTrackerBtn");

        if (openTrackerBtn && trackerContainer) {
            openTrackerBtn.addEventListener("click", () => {
                trackerContainer.classList.remove("d-none");
                if (window.TrackerEngine) { window.TrackerEngine.render(); }
            });
        }"""

events_repl = """        const trackerContainer = document.getElementById("trackerContainer");
        const openTrackerBtn = document.getElementById("openTrackerBtn");
        const closeTrackerBtn = document.getElementById("closeTrackerBtn");

        if (openTrackerBtn && trackerContainer) {
            openTrackerBtn.addEventListener("click", () => {
                trackerContainer.classList.remove("d-none");
                trackerContainer.style.display = 'flex'; // Enforce display
                trackerContainer.style.zIndex = '1050'; // Ensure it's above other elements
                if (window.TrackerEngine) { window.TrackerEngine.render(); }
            });
        }"""

content = content.replace(events_start, events_repl)

with open('ui.js', 'w') as f:
    f.write(content)
