import re

with open('planner.js', 'r') as f:
    content = f.read()

# Fix the duplicate insertions and formatting
content = re.sub(r'            risks: \[\],\n            issues: \[\],\n            dependencies: \[\],\n            assumptions: \[\],\n            decisions: \[\],\n            settings: \{\n                baseLink: "https://jira.company.com/browse/",                fillLegends: \[',
                r'            settings: {\n                baseLink: "https://jira.company.com/browse/",\n                fillLegends: [', content)

content = re.sub(r'            plans: \[\],\n            risks: \[\],\n            issues: \[\],\n            dependencies: \[\],\n            assumptions: \[\],\n            decisions: \[\]',
                r'            plans: \[\],\n            risks: \[\],\n            issues: \[\],\n            dependencies: \[\],\n            assumptions: \[\],\n            decisions: \[\]', content)

with open('planner.js', 'w') as f:
    f.write(content)
