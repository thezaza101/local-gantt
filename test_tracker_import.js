const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

// Mock browser environment
const ctx = vm.createContext({
    window: {},
    document: {
        getElementById: () => ({ reset: () => {}, value: '', addEventListener: () => {} }),
        querySelectorAll: () => [],
        createElement: () => ({ innerHTML: '', addEventListener: () => {} }),
    },
    bootstrap: {
        Modal: {
            getOrCreateInstance: () => ({ show: () => {}, hide: () => {} }),
            getInstance: () => ({ show: () => {}, hide: () => {} })
        }
    },
    alert: () => {},
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    Array: Array,
    Set: Set
});

// Load Planner and Tracker
const plannerCode = fs.readFileSync('planner.js', 'utf8');
const trackerCode = fs.readFileSync('tracker.js', 'utf8');

vm.runInContext(plannerCode, ctx);
vm.runInContext(trackerCode, ctx);

test('CSV Parser - handles basic comma separated values', (t) => {
    vm.runInContext(`
        (function() {
            const planner = new Planner();
            const tracker = new Tracker(planner);
            tracker.render = () => {};

            const csvText = "id,title,type,description\\nR1,Risk 1,risk,A risk description\\nI1,Issue 1,issue,An issue description";
            const parsed = tracker.parseCsv(csvText);

            if (parsed.length !== 2) throw new Error("Parsed length not 2");
            if (parsed[0].id !== 'R1') throw new Error("ID mismatch");
            if (parsed[0].title !== 'Risk 1') throw new Error("Title mismatch");
            if (parsed[0].type !== 'risk') throw new Error("Type mismatch");
            if (parsed[0].description !== 'A risk description') throw new Error("Description mismatch");
        })();
    `, ctx);
});

test('CSV Parser - handles quotes and commas inside quotes', (t) => {
    vm.runInContext(`
        (function() {
            const planner = new Planner();
            const tracker = new Tracker(planner);
            tracker.render = () => {};

            const csvText = 'id,title,type,description\\nR1,"Risk, with comma",risk,"Description with \\"\\"quotes\\"\\""';
            const parsed = tracker.parseCsv(csvText);

            if (parsed.length !== 1) throw new Error("Parsed length not 1");
            if (parsed[0].title !== 'Risk, with comma') throw new Error("Title mismatch");
            if (parsed[0].description !== 'Description with "quotes"') throw new Error("Description mismatch");
        })();
    `, ctx);
});

test('Process Imported CSV - generates ID if missing and maps types', (t) => {
    vm.runInContext(`
        (function() {
            const planner = new Planner();
            const tracker = new Tracker(planner);
            tracker.render = () => {};

            const csvText = "title,type\\nNew Risk,risk\\nNew Issue,issues";
            const result = tracker.processImportedCsv(csvText, null);

            if (result.success !== 2) throw new Error("success should be 2");
            if (result.skipped.length !== 0) throw new Error("skipped length not 0");

            const risks = planner.getRisks();
            if (risks.length !== 1) throw new Error("risks length not 1");
            if (!risks[0].id.startsWith('R')) throw new Error("id not start with R");
            if (risks[0].title !== 'New Risk [Imported]') throw new Error("Title mismatch");
            if (risks[0].tags[0] !== 'Imported') throw new Error("Tags mismatch");

            const issues = planner.getIssues();
            if (issues.length !== 1) throw new Error("issues length not 1");
            if (!issues[0].id.startsWith('I')) throw new Error("id not start with I");
        })();
    `, ctx);
});

test('Process Imported CSV - handles invalid types', (t) => {
    vm.runInContext(`
        (function() {
            const planner = new Planner();
            const tracker = new Tracker(planner);
            tracker.render = () => {};

            const csvText = "title,type\\nBad Item,invalid_type\\nGood Risk,risk";
            const result = tracker.processImportedCsv(csvText, null);

            if (result.success !== 1) throw new Error("success not 1");
            if (result.skipped.length !== 1) throw new Error("skipped not 1");
            if (result.skipped[0] !== 'invalid_type') throw new Error("skipped value mismatch");
        })();
    `, ctx);
});

test('Process Imported CSV - handles ID conflicts', (t) => {
    vm.runInContext(`
        (function() {
            const planner = new Planner();
            const tracker = new Tracker(planner);
            tracker.render = () => {};

            planner.addEntity('risks', { id: 'R123', title: 'Existing Risk' });

            const csvText = "id,title,type\\nR123,Conflicting Risk,risk";
            const result = tracker.processImportedCsv(csvText, null);

            if (result.success !== 1) throw new Error("success not 1");

            const risks = planner.getRisks();
            if (risks.length !== 2) throw new Error("risks length not 2");

            const importedRisk = risks.find(r => r.id !== 'R123');
            if (!importedRisk) throw new Error("could not find imported risk");
            if (!importedRisk.title.includes('[original id R123]')) throw new Error("Title missing original ID");
            if (!importedRisk.title.includes('[Imported]')) throw new Error("Title missing [Imported]");
        })();
    `, ctx);
});
