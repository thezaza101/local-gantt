import re

with open('index.html', 'r') as f:
    content = f.read()

analytics_script = '<script src="analytics.js"></script>'
tracker_script = '<script src="tracker.js"></script>\n    ' + analytics_script

content = content.replace(analytics_script, tracker_script)

with open('index.html', 'w') as f:
    f.write(content)
