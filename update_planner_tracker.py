import re

with open('planner.js', 'r') as f:
    content = f.read()

# Add Tracker getters and generator
new_methods = """
    // --- Tracker Entities ---

    generateEntityId(prefix) {
        return prefix + Math.floor(10000 + Math.random() * 90000);
    }

    getRisks() { return this.file.risks || []; }
    getIssues() { return this.file.issues || []; }
    getDependencies() { return this.file.dependencies || []; }
    getAssumptions() { return this.file.assumptions || []; }
    getDecisions() { return this.file.decisions || []; }

    addEntity(type, entity) {
        if (!this.file[type]) this.file[type] = [];
        this.file[type].push(entity);
        return true;
    }

    updateEntity(type, id, updatedEntity) {
        if (!this.file[type]) return false;
        const index = this.file[type].findIndex(e => e.id === id);
        if (index !== -1) {
            this.file[type][index] = updatedEntity;
            return true;
        }
        return false;
    }

    deleteEntity(type, id) {
        if (!this.file[type]) return false;
        const index = this.file[type].findIndex(e => e.id === id);
        if (index !== -1) {
            this.file[type].splice(index, 1);
            return true;
        }
        return false;
    }

    getEntityById(type, id) {
        if (!this.file[type]) return null;
        return this.file[type].find(e => e.id === id) || null;
    }
"""

# Insert right before export / end of class
# We can insert it before `getNowTimestamp()`

content = content.replace("    getNowTimestamp() {", new_methods + "\n    getNowTimestamp() {")

with open('planner.js', 'w') as f:
    f.write(content)
