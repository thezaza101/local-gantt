const fs = require('fs');

global.window = {};

const plannerCode = fs.readFileSync('planner.js', 'utf8') + '\n window.Planner = Planner;';
const analyticsCode = fs.readFileSync('analytics.js', 'utf8') + '\n window.Analytics = Analytics;';

const ctx = require('vm').createContext({
  window: global.window,
  console: console
});

require('vm').runInContext(plannerCode + '\n' + analyticsCode, ctx);

const planner = new ctx.window.Planner();
planner.addPlan("Test Plan");
const createTimestamp = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const now = new Date();
const nowStr = createTimestamp(now);

const oldDate = new Date();
oldDate.setDate(oldDate.getDate() - 10);
const oldStr = createTimestamp(oldDate);

planner.addTask({ id: "T-1", title: "Recent Task" });
planner.addTask({ id: "T-2", title: "Old Task" });

// planner.js updates timestamps automatically. Force overwrite via direct data manipulation for testing.
const plan = planner.getCurrentPlan();
const t1 = plan.tasks.find(t => t.id === 'T-1');
t1.lastChecked = nowStr;
t1.lastUpdated = nowStr;

const t2 = plan.tasks.find(t => t.id === 'T-2');
t2.lastChecked = oldStr;
t2.lastUpdated = oldStr;

const analytics = new ctx.window.Analytics();
analytics.planner = planner;

planner.setFilterState({ searchText: 'Old' });
analytics.filterState.team = '';
analytics.filterState.selectedTags = [];
analytics.filterState.startDate = '';
analytics.filterState.endDate = '';

const filtered = analytics.getFilteredTasks(planner.getCurrentPlan());
console.log("Filtered Tasks length:", filtered.length);
if (filtered.length === 1 && filtered[0].id === 'T-2') {
    console.log("Success: Only old task shown.");
} else {
    console.log("Failed. Tasks returned:", filtered.map(t=>t.id));
}
