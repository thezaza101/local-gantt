describe('Gantt Engine (gantt.js)', () => {

    test('getSafeDate correctly parses dates', () => {
        const gantt = new Gantt('dummy');
        const date1 = gantt.getSafeDate('2023-10-15');
        assertEqual(date1.getFullYear(), 2023);
        assertEqual(date1.getMonth(), 9); // 0-indexed
        assertEqual(date1.getDate(), 15);

        const date2 = gantt.getSafeDate('invalid-date');
        assertTrue(isNaN(date2.getTime()));

        const date3 = gantt.getSafeDate('');
        assertTrue(isNaN(date3.getTime()));
    });

    test('getMixedColor returns correct rgba strings', () => {
        const gantt = new Gantt('dummy');

        // Hex 6-digit
        const color1 = gantt.getMixedColor('#ff0000');
        // ShadeAmount = 0.35, GrayAmount = 0.65
        // R: 0.35 * 255 + 0.65 * 128 = 89.25 + 83.2 = 172.45 ~ 172
        // G: 0.35 * 0 + 0.65 * 128 = 83.2 ~ 83
        // B: 0.35 * 0 + 0.65 * 128 = 83.2 ~ 83
        assertEqual(color1, 'rgba(172, 83, 83, 0.5)');

        // Hex 3-digit
        const color2 = gantt.getMixedColor('#0f0');
        assertEqual(color2, 'rgba(83, 172, 83, 0.5)');

        // rgb format
        const color3 = gantt.getMixedColor('rgb(0, 0, 255)');
        assertEqual(color3, 'rgba(83, 83, 172, 0.5)');

        // invalid or empty
        const color4 = gantt.getMixedColor('');
        assertEqual(color4, 'rgba(128, 128, 128, 0.5)');
    });

    test('escapeHtml correctly sanitizes input', () => {
        const gantt = new Gantt('dummy');
        const input = '<script>alert("xss & \'injection\'")</script>';
        const result = gantt.escapeHtml(input);
        assertEqual(result, '&lt;script&gt;alert(&quot;xss &amp; &#039;injection&#039;&quot;)&lt;/script&gt;');

        const empty = gantt.escapeHtml('');
        assertEqual(empty, '');

        const nullInput = gantt.escapeHtml(null);
        assertEqual(nullInput, '');
    });

    test('repeatString repeats string given times', () => {
        const gantt = new Gantt('dummy');
        const result = gantt.repeatString('x', 3);
        assertEqual(result, '<span>x</span><span>x</span><span>x</span>');

        const zeroResult = gantt.repeatString('x', 0);
        assertEqual(zeroResult, '');
    });

    test('generateGridLines generates correct lines for daily zoom', () => {
        const gantt = new Gantt('dummy');
        gantt.cellWidth = 40;
        const result = gantt.generateGridLines(3, 'daily', new Date('2023-01-01'));

        const expected = '<div class="gantt-grid-line border-end" style="width: 40px; flex: none;"></div>'.repeat(3);
        assertEqual(result, expected);
    });

    test('generateGridLines generates correct lines for weekly zoom', () => {
        const gantt = new Gantt('dummy');
        gantt.cellWidth = 10;
        const result = gantt.generateGridLines(10, 'weekly', new Date('2023-01-01'));
        // 10 days total. Week 1 is 7 days (70px). Remaining is 3 days (30px).
        const expected = '<div class="gantt-grid-line border-end" style="width: 70px; flex: none;"></div><div class="gantt-grid-line border-end" style="width: 30px; flex: none;"></div>';
        assertEqual(result, expected);
    });

    test('generateGridLines generates correct lines for monthly zoom', () => {
        const gantt = new Gantt('dummy');
        gantt.cellWidth = 2;
        // From Jan 20 to Feb 5 is 17 days (12 in Jan, 5 in Feb)
        const result = gantt.generateGridLines(17, 'monthly', new Date('2023-01-20'));
        const expected = '<div class="gantt-grid-line border-end" style="width: 24px; flex: none;"></div><div class="gantt-grid-line border-end" style="width: 10px; flex: none;"></div>';
        assertEqual(result, expected);
    });

    test('Gantt constructor sets defaults correctly', () => {
        const mockDiv = document.createElement('div');
        mockDiv.id = 'gantt-container';
        document.body.appendChild(mockDiv);

        const gantt = new Gantt('gantt-container');
        assertEqual(gantt.cellWidth, 40);
        assertEqual(gantt.rowHeight, 43);
        assertEqual(gantt.taskMargin, 5);
        assertEqual(gantt.container, mockDiv);
        assertFalse(gantt.isLegendCollapsed);

        document.body.removeChild(mockDiv);
    });

    test('render handles missing container or plan gracefully', () => {
        const mockDiv = document.createElement('div');
        mockDiv.id = 'gantt-container';
        document.body.appendChild(mockDiv);

        const gantt = new Gantt('gantt-container');
        gantt.render(null);
        assertTrue(mockDiv.innerHTML.includes('Select or create a plan'));

        const ganttNoContainer = new Gantt('non-existent');
        let threw = false;
        try { ganttNoContainer.render(null); } catch (e) { threw = true; }
        assertFalse(threw);

        document.body.removeChild(mockDiv);
    });

    test('render handles invalid plan dates gracefully', () => {
        const mockDiv = document.createElement('div');
        mockDiv.id = 'gantt-container';
        document.body.appendChild(mockDiv);

        window.PlannerState = {
            getZoomLevel: () => 'daily'
        };

        const gantt = new Gantt('gantt-container');
        gantt.render({ timeline: { startDate: '2023-10-15', endDate: '2023-10-10' } }); // endDate before start
        assertTrue(mockDiv.innerHTML.includes('Invalid plan dates'));

        gantt.render({ timeline: { startDate: 'invalid', endDate: '2023-10-10' } });
        assertTrue(mockDiv.innerHTML.includes('Invalid plan dates'));

        document.body.removeChild(mockDiv);
        delete window.PlannerState;
    });

    test('render generates valid Gantt structure', () => {
        const mockDiv = document.createElement('div');
        mockDiv.id = 'gantt-container';
        document.body.appendChild(mockDiv);

        // Mock PlannerState
        window.PlannerState = {
            getZoomLevel: () => 'daily',
            getFilterState: () => ({ visualMode: 'show', selectedTags: [], matchMode: 'any', searchText: '' }),
            getShowDependencies: () => false,
            getShowMarkerMajor: () => true,
            getShowMarkerMinor: () => true,
            getShowMarkerNote: () => true,
            getCurrentPlan: () => plan,
            isTaskSelected: () => false,
            getShowEffortPerDay: () => false
        };

        const plan = {
            timeline: { startDate: '2023-01-01', endDate: '2023-01-03' },
            tasks: [{ id: 'T1', title: 'Task 1', startDate: '2023-01-01', endDate: '2023-01-02', row: 1 }],
            markers: []
        };

        const gantt = new Gantt('gantt-container');
        // ensure AnalyticsEngine is mocked if accessed
        window.AnalyticsEngine = { taskMatchesTags: () => true };
        gantt.render(plan);

        // Check DOM structure
        assertTrue(mockDiv.querySelector('.gantt-wrapper') !== null);
        assertTrue(mockDiv.querySelector('.gantt-sidebar') !== null);
        assertTrue(mockDiv.querySelector('.gantt-header') !== null);
        assertTrue(mockDiv.querySelector('.gantt-header-days') !== null);
        assertTrue(mockDiv.querySelector('.gantt-task') !== null);

        // Cleanup
        document.body.removeChild(mockDiv);
        delete window.PlannerState;
        delete window.AnalyticsEngine;
    });

    test('generateTasksHtml processes tasks correctly', () => {
        const gantt = new Gantt('dummy');

        // Mock PlannerState
        window.PlannerState = {
            getFilterState: () => ({ visualMode: 'show', selectedTags: [], matchMode: 'any', searchText: '' }),
            isTaskSelected: () => false,
            getShowEffortPerDay: () => false,
            getStatusColors: () => ({ 'Done': '#00ff00' })
        };
        window.AnalyticsEngine = { taskMatchesTags: () => true };

        const plan = {
            tasks: [
                { id: 'T1', title: 'Task 1', startDate: '2023-01-02', endDate: '2023-01-03', row: 1 },
                { id: 'T2', title: 'Task 2', startDate: '2023-01-05', endDate: '2023-01-06', row: 2 }
            ]
        };

        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-10');

        gantt.cellWidth = 40;
        gantt.rowHeight = 43;

        const result = gantt.generateTasksHtml(plan, startDate, endDate);

        assertEqual(result.maxRow, 1); // 0-indexed mapped max row
        assertEqual(result.renderedTasks.length, 2);
        assertTrue(result.html.includes('Task 1'));
        assertTrue(result.html.includes('Task 2'));

        delete window.PlannerState;
        delete window.AnalyticsEngine;
    });

    test('generateDependencyArrows returns empty string if no rendered tasks', () => {
        const gantt = new Gantt('dummy');
        const result = gantt.generateDependencyArrows([], 100, 100);
        assertEqual(result, '');
    });

    test('generateDependencyArrows returns valid SVG if dependencies exist', () => {
        const gantt = new Gantt('dummy');
        const renderedTasks = [
            { id: 'T1', task: { fillColor: '#ff0000' }, dependencies: [], left: 10, top: 10, width: 40, height: 20 },
            { id: 'T2', task: {}, dependencies: ['T1'], left: 100, top: 10, width: 40, height: 20 }
        ];

        window.PlannerState = { getDependencies: () => [] };
        const result = gantt.generateDependencyArrows(renderedTasks, 500, 500);

        assertTrue(result.includes('<svg class="gantt-dependencies-svg"'));
        assertTrue(result.includes('<path d="M 50 20 L 100 20"')); // straight line same row
        assertTrue(result.includes('<marker id="'));

        delete window.PlannerState;
    });

    test('bindTaskEvents binds click listeners to control buttons', () => {
        const mockDiv = document.createElement('div');
        mockDiv.id = 'gantt-container';
        mockDiv.innerHTML = `
            <div class="gantt-task" data-task-id="T1">
                <button class="gantt-task-control-btn sync-plan-btn"></button>
                <button class="gantt-task-control-btn duplicate-btn"></button>
            </div>
        `;
        document.body.appendChild(mockDiv);

        let syncClicked = false;
        mockDiv.addEventListener('sync-plan-request', () => { syncClicked = true; });

        let duplicateCalled = false;
        window.PlannerState = {
            duplicateTask: (id) => { if (id === 'T1') duplicateCalled = true; return true; },
            getCurrentPlan: () => ({ timeline: { startDate: '2023-01-01', endDate: '2023-01-02' } }),
            isTaskSelected: () => false
        };
        window.UIController = { updateUI: () => {} };
        window.isShareableMode = false;

        const gantt = new Gantt('gantt-container');
        // Simulate what bindTaskEvents does
        gantt.bindTaskEvents();

        const syncBtn = mockDiv.querySelector('.sync-plan-btn');
        const dupBtn = mockDiv.querySelector('.duplicate-btn');

        syncBtn.click();
        assertTrue(syncClicked);

        dupBtn.click();
        assertTrue(duplicateCalled);

        // Cleanup
        document.body.removeChild(mockDiv);
        delete window.PlannerState;
        delete window.UIController;
        delete window.isShareableMode;
    });

    test('bindRowEvents binds click listeners to row buttons', () => {
        const mockDiv = document.createElement('div');
        mockDiv.id = 'gantt-container';
        mockDiv.innerHTML = `
            <button class="gantt-insert-row-btn" data-row-index="2"></button>
            <button class="gantt-delete-row-btn" data-row-index="3"></button>
        `;
        document.body.appendChild(mockDiv);

        let insertCalled = false;
        let deleteCalled = false;

        window.PlannerState = {
            insertRowBefore: (index) => { if (index === 2) insertCalled = true; return true; },
            deleteRow: (index) => { if (index === 3) deleteCalled = true; return true; },
            getCurrentPlan: () => ({ timeline: { startDate: '2023-01-01', endDate: '2023-01-02' } })
        };
        window.UIController = { updateUI: () => {} };
        window.isShareableMode = false;

        const gantt = new Gantt('gantt-container');
        gantt.bindRowEvents();

        mockDiv.querySelector('.gantt-insert-row-btn').click();
        assertTrue(insertCalled);

        mockDiv.querySelector('.gantt-delete-row-btn').click();
        assertTrue(deleteCalled);

        document.body.removeChild(mockDiv);
        delete window.PlannerState;
        delete window.UIController;
        delete window.isShareableMode;
    });

    test('bindBackgroundEvents binds mousedown listener to clear selection', () => {
        const mockDiv = document.createElement('div');
        mockDiv.id = 'gantt-container';
        mockDiv.innerHTML = `<div class="gantt-content"></div>`;
        document.body.appendChild(mockDiv);

        let clearSelectionCalled = false;
        window.PlannerState = {
            getSelectedTaskIds: () => ['T1'],
            clearTaskSelection: () => { clearSelectionCalled = true; },
            getCurrentPlan: () => ({ timeline: { startDate: '2023-01-01', endDate: '2023-01-02' } })
        };
        window.isShareableMode = false;

        const gantt = new Gantt('gantt-container');
        gantt.render = () => {}; // mock render
        gantt.bindBackgroundEvents();

        const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        mockDiv.querySelector('.gantt-content').dispatchEvent(mousedownEvent);

        assertTrue(clearSelectionCalled);

        document.body.removeChild(mockDiv);
        delete window.PlannerState;
        delete window.isShareableMode;
    });

});
