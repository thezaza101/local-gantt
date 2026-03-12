/* Capacity Engine */

class Capacity {
    constructor() {
    }

    /**
     * Calculates the expanded capacity by expanding the date ranges in capacity.entries
     * based on the selected granularity (month, week, quarter).
     * @param {Object} plan - The plan data model
     * @returns {Array} Array of expanded capacity objects e.g., [{ period: '2026-Jan', capacity: 40 }]
     */
    calculateExpandedCapacity(plan) {
        if (!plan || !plan.capacity || !plan.capacity.entries || plan.capacity.entries.length === 0) {
            return [];
        }

        const granularity = plan.capacity.granularity || 'month';
        const entries = plan.capacity.entries;

        // Group capacity by period
        const expandedMap = new Map();

        entries.forEach(entry => {
            const startParts = entry.startDate.split('-');
            const endParts = entry.endDate.split('-');

            if (startParts.length !== 3 || endParts.length !== 3) return;

            // Instantiate dates correctly to avoid UTC offset issues
            const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

            if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) return;

            // Iterate over each day in the range and group by the selected granularity
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const periodKey = this.getPeriodKey(currentDate, granularity);

                // We assume the entry's capacity represents the capacity *per period* (e.g., 40 per month).
                // If multiple entries overlap the same period, we'll keep the highest capacity defined,
                // or you could add them depending on business rules. The requirements imply a single capacity
                // value per period defined by the ranges. We'll set the value.
                if (!expandedMap.has(periodKey)) {
                    expandedMap.set(periodKey, entry.capacity);
                } else {
                    // If ranges overlap and have different values, take max or sum?
                    // Let's assume standard behavior is to take the most recent/max or they shouldn't overlap.
                    expandedMap.set(periodKey, Math.max(expandedMap.get(periodKey), entry.capacity));
                }

                // Advance by 1 day
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        // Convert map to sorted array
        const result = [];
        for (const [period, capacity] of expandedMap.entries()) {
            result.push({ period, capacity });
        }

        // Sort by period (since period keys are designed to be sortable e.g. "2026-01" or "2026-W01")
        result.sort((a, b) => a.period.localeCompare(b.period));

        return result;
    }

    /**
     * Generates a unique, sortable string key for a date based on the granularity.
     */
    getPeriodKey(date, granularity) {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const monthStr = String(month + 1).padStart(2, '0');

        if (granularity === 'month') {
            return `${year}-${monthStr}`; // e.g. 2026-01
        } else if (granularity === 'quarter') {
            const quarter = Math.floor(month / 3) + 1;
            return `${year}-Q${quarter}`; // e.g. 2026-Q1
        } else if (granularity === 'week') {
            // ISO week date calculation
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            const weekStr = String(weekNo).padStart(2, '0');
            return `${d.getUTCFullYear()}-W${weekStr}`; // e.g. 2026-W01
        }

        return `${year}-${monthStr}`; // fallback to month
    }
}