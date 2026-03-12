/* Analytics Engine */

class Analytics {
    constructor(plannerState) {
        this.planner = plannerState;
    }

    /**
     * Extracts all unique tags from the tasks in the current plan.
     * @returns {string[]} An array of unique tag strings, sorted alphabetically.
     */
    getUniqueTags() {
        const plan = this.planner.getCurrentPlan();
        if (!plan || !plan.tasks) return [];

        const tags = new Set();
        plan.tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                task.tags.forEach(tag => {
                    const t = tag.trim();
                    if (t) tags.add(t);
                });
            }
        });

        return Array.from(tags).sort((a, b) => a.localeCompare(b));
    }

    /**
     * Determines if a task matches the selected tags based on the match mode.
     * @param {Object} task The task object.
     * @param {string[]} selectedTags Array of selected tags.
     * @param {string} matchMode 'any' (OR) or 'all' (AND).
     * @returns {boolean} True if the task matches, false otherwise.
     */
    taskMatchesTags(task, selectedTags, matchMode = 'any') {
        if (!selectedTags || selectedTags.length === 0) {
            // If no tags are selected, by default we show everything or nothing?
            // Usually, no filters = show everything.
            return true;
        }

        const taskTags = (task.tags || []).map(t => t.trim()).filter(t => t);

        if (matchMode === 'any') {
            // OR condition: task must have at least one of the selected tags
            return selectedTags.some(tag => taskTags.includes(tag));
        } else if (matchMode === 'all') {
            // AND condition: task must have ALL of the selected tags
            return selectedTags.every(tag => taskTags.includes(tag));
        }

        return true;
    }
}