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
planner.addPlan("Plan A");
const planA = planner.getCurrentPlan();

planner.addPlan("Plan B");
const planB = planner.getCurrentPlan();

// Add global item
planner.addEntity('risks', { id: 'R1', title: 'Global Risk', status: 'Open', planId: null });

// Add item to Plan A
planner.addEntity('issues', { id: 'I1', title: 'Plan A Issue', status: 'In Progress', planId: planA.id });

// Add item to Plan B
planner.addEntity('decisions', { id: 'D1', title: 'Plan B Decision', status: 'Pending', planId: planB.id });

const analytics = new ctx.window.Analytics();
analytics.planner = planner;

// Test Plan A
const countsA = analytics.calculateRaidaCountsByType(planA);
console.log("Plan A Counts by Type:", countsA.values); // Expect: 1 risk (global), 1 issue, 0 dep, 0 assump, 0 dec

const statusA = analytics.calculateRaidaCountsByStatus(planA);
console.log("Plan A Counts by Status:", JSON.stringify(statusA));

// Test Plan B
const countsB = analytics.calculateRaidaCountsByType(planB);
console.log("Plan B Counts by Type:", countsB.values); // Expect: 1 risk (global), 0 issue, 0 dep, 0 assump, 1 dec
