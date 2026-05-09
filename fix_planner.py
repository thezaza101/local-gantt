import re

with open('planner.js', 'r') as f:
    content = f.read()

content = content.replace(r"            plans: \[\],", "            plans: [],")
content = content.replace(r"            risks: \[\],", "            risks: [],")
content = content.replace(r"            issues: \[\],", "            issues: [],")
content = content.replace(r"            dependencies: \[\],", "            dependencies: [],")
content = content.replace(r"            assumptions: \[\],", "            assumptions: [],")
content = content.replace(r"            decisions: \[\]", "            decisions: []")

with open('planner.js', 'w') as f:
    f.write(content)
