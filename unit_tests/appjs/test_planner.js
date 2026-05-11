describe('Planner Engine (planner.js)', () => {

    test('Can instantiate Planner', () => {
        const planner = new Planner();
        assertTrue(planner !== null);
        assertEqual(typeof planner.getState, 'function');
    });

    test('Can add a new plan', () => {
        const planner = new Planner();
        const planId = planner.addPlan('Test Plan');

        const state = planner.getState();
        assertEqual(state.plans.length, 1);
        assertEqual(state.plans[0].name, 'Test Plan');
    });

    test('Can add a task to a plan', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');

        const taskData = {
            id: 'T-00001',
            title: 'Test Task',
            startDate: '2023-01-01',
            endDate: '2023-01-10',
            row: 1
        };

        planner.addTask(taskData);

        const state = planner.getState();
        const plan = planner.getCurrentPlan();

        assertEqual(plan.tasks.length, 1);
        assertEqual(plan.tasks[0].id, 'T-00001');
        assertEqual(plan.tasks[0].title, 'Test Task');

        // Check timestamps were added
        assertTrue(plan.tasks[0].lastUpdated !== undefined);
        assertTrue(plan.tasks[0].lastChecked !== undefined);
    });

    test('getTaskById returns the correct task', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');
        planner.addTask({ id: 'T-100', title: 'Task 1' });
        planner.addTask({ id: 'T-200', title: 'Task 2' });

        const task = planner.getTaskById('T-200');
        assertTrue(task !== null);
        assertEqual(task.id, 'T-200');
        assertEqual(task.title, 'Task 2');

        const missing = planner.getTaskById('T-999');
        assertEqual(missing, null);
    });

    test('calculateTotalEffort correctly sums effort values', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');

        const taskData = {
            id: 'T-1',
            title: 'Effort Task',
            effort: {
                design: 5,
                dev: 10,
                test: 5
            }
        };

        planner.addTask(taskData);
        const task = planner.getTaskById('T-1');

        assertEqual(task.effort.design, 5);
        assertEqual(task.effort.dev, 10);
        assertEqual(task.effort.test, 5);
    });

    test('deleteTask removes the task', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');
        planner.addTask({ id: 'T-100', title: 'Task 1' });
        planner.addTask({ id: 'T-200', title: 'Task 2' });

        const success = planner.deleteTask('T-100');
        assertTrue(success);

        const plan = planner.getCurrentPlan();
        assertEqual(plan.tasks.length, 1);
        assertEqual(plan.tasks[0].id, 'T-200');

        const fail = planner.deleteTask('T-999');
        assertFalse(fail);
    });

    test('updateTask updates task properties', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');
        planner.addTask({ id: 'T-100', title: 'Old Title', status: 'Not started' });

        const updated = { id: 'T-100', title: 'New Title', status: 'In progress' };
        const success = planner.updateTask('T-100', updated);
        assertTrue(success);

        const task = planner.getTaskById('T-100');
        assertEqual(task.title, 'New Title');
        assertEqual(task.status, 'In progress');
        assertTrue(task.lastUpdated !== undefined);
        assertTrue(task.lastChecked !== undefined);
    });

    test('updateTask fails on ID conflict', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');
        planner.addTask({ id: 'T-100', title: 'Task 1' });
        planner.addTask({ id: 'T-200', title: 'Task 2' });

        const updated = { id: 'T-200', title: 'Renamed Task 1' };
        const success = planner.updateTask('T-100', updated);
        assertFalse(success);
    });

    test('duplicateTask creates a copy', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');
        planner.addTask({ id: 'T-100', title: 'Original Task', row: 1 });

        const success = planner.duplicateTask('T-100');
        assertTrue(success);

        const plan = planner.getCurrentPlan();
        assertEqual(plan.tasks.length, 2);
        const newObj = plan.tasks.find(t => t.id !== 'T-100');
        assertTrue(newObj !== undefined);
        assertEqual(newObj.title, 'Original Task (Copy)');
        assertEqual(newObj.row, 1);
    });

    test('insertRowBefore shifts rows correctly', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');
        planner.addTask({ id: 'T-100', title: 'Task 1', row: 1 });
        planner.addTask({ id: 'T-200', title: 'Task 2', row: 2 });
        planner.addTask({ id: 'T-300', title: 'Task 3', row: 3 });

        planner.insertRowBefore(2);

        assertEqual(planner.getTaskById('T-100').row, 1);
        assertEqual(planner.getTaskById('T-200').row, 3);
        assertEqual(planner.getTaskById('T-300').row, 4);
    });

    test('deleteRow fails if row is not empty', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');
        planner.addTask({ id: 'T-100', title: 'Task 1', row: 1 });
        planner.addTask({ id: 'T-200', title: 'Task 2', row: 2 });

        const result = planner.deleteRow(2);
        assertFalse(result); // row 2 has T-200
    });

    test('deleteRow shifts rows correctly if empty', () => {
        const planner = new Planner();
        planner.addPlan('Test Plan');
        planner.addTask({ id: 'T-100', title: 'Task 1', row: 1 });
        // row 2 is empty
        planner.addTask({ id: 'T-300', title: 'Task 3', row: 3 });

        const result = planner.deleteRow(2);
        assertTrue(result);

        assertEqual(planner.getTaskById('T-100').row, 1);
        assertEqual(planner.getTaskById('T-300').row, 2);
    });

    test('Tracker entity management', () => {
        const planner = new Planner();

        // addEntity
        const id = 'R12345';
        const success = planner.addEntity('risks', { id: id, title: 'Risk 1', scope: 'Global' });
        assertTrue(success);

        // getEntityById
        const entity = planner.getEntityById('risks', id);
        assertTrue(entity !== null);
        assertEqual(entity.title, 'Risk 1');

        // updateEntity
        planner.updateEntity('risks', id, { id: id, title: 'Updated Risk 1', scope: 'Global' });
        const updated = planner.getEntityById('risks', id);
        assertEqual(updated.title, 'Updated Risk 1');

        // deleteEntity
        planner.deleteEntity('risks', id);
        assertEqual(planner.getEntityById('risks', id), null);
    });

    test('calculatePlanDiff detects changes', () => {
        const planner = new Planner();
        planner.addPlan('Local Plan');

        // Use exact objects so JSON stringify compares cleanly if timestamps aren't ignored
        const task1 = { id: 'T-100', title: 'Same Task', status: 'Not started', row: 1 };
        const task2 = { id: 'T-200', title: 'Modified Task', status: 'Not started', row: 2 };
        const task3 = { id: 'T-300', title: 'Deleted Task', status: 'Not started', row: 3 };

        planner.addTask(task1);
        planner.addTask(task2);
        planner.addTask(task3);

        const localPlan = planner.getCurrentPlan();

        // Grab the exact T-100 from the plan so it has the timestamps
        const currTask1 = planner.getTaskById('T-100');

        const importedPlan = {
            id: localPlan.id,
            tasks: [
                currTask1, // exact match
                { id: 'T-200', title: 'Modified Task', status: 'In progress', row: 2 },
                { id: 'T-400', title: 'New Task', status: 'Not started', row: 4 }
            ]
        };

        const diff = planner.calculatePlanDiff(importedPlan, []);
        assertEqual(diff.tasks.new.length, 1);
        assertEqual(diff.tasks.new[0].id, 'T-400');
        assertEqual(diff.tasks.modified.length, 1);
        assertEqual(diff.tasks.modified[0].current.id, 'T-200');
        assertEqual(diff.tasks.modified[0].imported.id, 'T-200');
        assertEqual(diff.tasks.deleted.length, 1);
        assertEqual(diff.tasks.deleted[0].id, 'T-300');
    });

    test('applyPlanMerge correctly updates plan', () => {
        const planner = new Planner();
        planner.addPlan('Local Plan');
        planner.addTask({ id: 'T-100', title: 'Same Task', status: 'Not started', row: 1 });
        planner.addTask({ id: 'T-200', title: 'Modified Task', status: 'Not started', row: 2 });
        planner.addTask({ id: 'T-300', title: 'Deleted Task', status: 'Not started', row: 3 });

        const localPlan = planner.getCurrentPlan();

        const importedPlan = {
            id: localPlan.id,
            tasks: [
                { id: 'T-100', title: 'Same Task', status: 'Not started', row: 1 },
                { id: 'T-200', title: 'Modified Task', status: 'In progress', row: 2 },
                { id: 'T-400', title: 'New Task', status: 'Not started', row: 4 }
            ]
        };

        const selection = {
            tasks: {
                new: ['T-400'],
                modified: ['T-200'],
                deleted: ['T-300']
            },
            markers: { new: [], modified: [], deleted: [] },
            details: false
        };

        planner.applyPlanMerge(selection, importedPlan, []);

        assertEqual(planner.getCurrentPlan().tasks.length, 3);
        assertEqual(planner.getTaskById('T-400').title, 'New Task');
        assertEqual(planner.getTaskById('T-200').status, 'In progress');
        assertEqual(planner.getTaskById('T-300'), null);
    });

});
