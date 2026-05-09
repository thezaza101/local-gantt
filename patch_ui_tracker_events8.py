import re

with open('ui.js', 'r') as f:
    content = f.read()

events_start = """        if (closeTrackerBtn && trackerContainer) {
            closeTrackerBtn.addEventListener("click", () => {
                trackerContainer.classList.add("d-none");
            });
        }"""

events_repl = """        if (closeTrackerBtn && trackerContainer) {
            closeTrackerBtn.addEventListener("click", () => {
                trackerContainer.classList.add("d-none");
                trackerContainer.classList.remove("d-flex");
                trackerContainer.style.setProperty("display", "none", "important");
            });
        }"""

content = content.replace(events_start, events_repl)

with open('ui.js', 'w') as f:
    f.write(content)
