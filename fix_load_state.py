with open('planner.js', 'r') as f:
    content = f.read()

load_state_start = "    loadState(newState) {\n        if (newState && newState.meta && newState.plans) {\n            this.file = newState;"
load_state_repl = """    loadState(newState) {
        if (newState && newState.meta && newState.plans) {
            this.file = newState;

            // Ensure tracker arrays exist
            if (!this.file.risks) this.file.risks = [];
            if (!this.file.issues) this.file.issues = [];
            if (!this.file.dependencies) this.file.dependencies = [];
            if (!this.file.assumptions) this.file.assumptions = [];
            if (!this.file.decisions) this.file.decisions = [];"""

content = content.replace(load_state_start, load_state_repl)

with open('planner.js', 'w') as f:
    f.write(content)
