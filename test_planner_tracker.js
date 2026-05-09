const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const plannerSource = fs.readFileSync('./planner.js', 'utf8');
const context = { window: {}, console: console, Math: Math, Date: Date };
vm.createContext(context);
vm.runInContext(plannerSource + '; window.Planner = Planner;', context);

const planner = new context.window.Planner();

assert.ok(planner.file.risks !== undefined);
assert.ok(planner.file.issues !== undefined);
assert.ok(planner.file.dependencies !== undefined);
assert.ok(planner.file.assumptions !== undefined);
assert.ok(planner.file.decisions !== undefined);

planner.addPlan("Test Plan");
const planId = planner.getCurrentPlan().id;
planner.addTask({id: 'T123', title: 'Task 1'});

const plan = planner.getCurrentPlan();
const task = plan.tasks[0];

assert.ok(task.risks !== undefined);

planner.addEntity('risks', {id: 'R111', title: 'A Risk'});
const risk = planner.getEntityById('risks', 'R111');
assert.strictEqual(risk.title, 'A Risk');

risk.title = 'Updated Risk';
planner.updateEntity('risks', 'R111', risk);

const updatedRisk = planner.getEntityById('risks', 'R111');
assert.strictEqual(updatedRisk.title, 'Updated Risk');

planner.deleteEntity('risks', 'R111');
const deletedRisk = planner.getEntityById('risks', 'R111');
assert.strictEqual(deletedRisk, null);

console.log("Tracker core data model tests passed!");
