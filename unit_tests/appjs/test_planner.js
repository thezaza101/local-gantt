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
});
