const fs = require('fs');

global.window = {};

const plannerCode = fs.readFileSync('planner.js', 'utf8');
const analyticsCode = fs.readFileSync('analytics.js', 'utf8');

const ctx = require('vm').createContext({
  window: global.window,
  console: console
});

require('vm').runInContext(plannerCode + '\n' + analyticsCode, ctx);

const planner = new ctx.Planner();
planner.addPlan("Test Plan");
const now = planner.getNowTimestamp();

// Set lastChecked to 10 days ago
const oldDate = new Date();
oldDate.setDate(oldDate.getDate() - 10);
const pad = (n) => String(n).padStart(2, '0');
const oldStr = `${oldDate.getFullYear()}-${pad(oldDate.getMonth() + 1)}-${pad(oldDate.getDate())} ${pad(oldDate.getHours())}:${pad(oldDate.getMinutes())}:${pad(oldDate.getSeconds())}`;

planner.addTask({ id: "T-1", title: "Recent Task", lastUpdated: now, lastChecked: now });
planner.addTask({ id: "T-2", title: "Old Task", lastUpdated: oldStr, lastChecked: oldStr });

const analytics = new ctx.Analytics();
analytics.planner = planner;

planner.setFilterState({ notCheckedDays: 5 });

const filtered = analytics.getFilteredTasks(planner.getCurrentPlan());
console.log("Filtered Tasks length:", filtered.length);
if (filtered.length === 1 && filtered[0].id === 'T-2') {
    console.log("Success: Only old task shown.");
} else {
    console.log("Failed. Tasks returned:", filtered.map(t=>t.id));
}
