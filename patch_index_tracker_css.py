import re

with open('index.html', 'r') as f:
    content = f.read()

analytics_panel = '<div class="analytics-panel p-0 d-flex flex-column bg-white d-none" id="analyticsContainer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1040;">'
tracker_panel = '<div class="tracker-panel p-0 d-flex flex-column bg-white d-none" id="trackerContainer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1050;">'

content = content.replace(
    '<div class="tracker-panel p-0 d-flex flex-column bg-white d-none" id="trackerContainer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1040;">',
    tracker_panel
)

with open('index.html', 'w') as f:
    f.write(content)
