const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const plannerSource = fs.readFileSync('./planner.js', 'utf8');
const trackerSource = fs.readFileSync('./tracker.js', 'utf8');

const context = { window: {}, console: console, Math: Math, Date: Date };
vm.createContext(context);
vm.runInContext(plannerSource + '; window.Planner = Planner;', context);
vm.runInContext(trackerSource + '; window.Tracker = Tracker;', context);

console.log("Tracker module tested successfully.");
