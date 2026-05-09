const assert = require('assert');
const fs = require('fs');

global.window = {};

const code = fs.readFileSync('planner.js', 'utf8') + '\n window.Planner = Planner;';

const ctx = require('vm').createContext({
  window: global.window,
  console: console
});

require('vm').runInContext(code, ctx);

const planner = new ctx.window.Planner();
planner.addPlan("Test");
planner.addTask({ id: "T-1", title: "Test 1" });

let task = planner.getTaskById("T-1");
console.log("Last updated:", task.lastUpdated);
assert.ok(task.lastUpdated);
assert.ok(task.lastChecked);

console.log("Success");
