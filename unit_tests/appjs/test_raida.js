describe('RAIDA (raida.js)', () => {

    // Helper to generate a mock planner
    const createMockPlanner = (mockData = {}) => {
        return {
            getState: () => ({
                settings: {
                    raidaOverdueDays: 14,
                    raidaStaleDays: 7
                },
                plans: [
                    {
                        id: 'plan-1',
                        tasks: mockData.tasks || []
                    }
                ]
            }),
            getCurrentPlan: () => ({
                id: 'plan-1',
                tasks: mockData.tasks || []
            }),
            getRisks: () => mockData.risks || [],
            getIssues: () => mockData.issues || [],
            getDependencies: () => mockData.dependencies || [],
            getAssumptions: () => mockData.assumptions || [],
            getDecisions: () => mockData.decisions || [],
            getStatusColors: () => ({
                'Not started': '#cccccc',
                'In progress': '#0000ff'
            }),
            getNowTimestamp: () => new Date().toISOString()
        };
    };

    test('Raida constructor initializes correctly', () => {
        const mockPlanner = createMockPlanner();
        const raida = new Raida(mockPlanner);
        assertEqual(raida.planner, mockPlanner, 'Planner instance should be assigned to raida.planner');
    });

    test('Raida.render includes follow-up reminders', () => {
        const container = document.createElement('div');
        container.id = 'raidaContent';
        document.body.appendChild(container);

        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const planner = createMockPlanner({
                tasks: [{ id: 'T1', title: 'Task 1', followUpDate: todayStr, status: 'Open' }],
                risks: [{ id: 'R1', title: 'Risk 1', followUpDate: '2020-01-01', status: 'Open' }]
            });
            planner.getNowTimestamp = () => new Date().toISOString();

            const raida = new Raida(planner);
            raida.render();

            assertTrue(container.innerHTML.includes('Follow up reminders'), 'Should include follow up section');
            assertTrue(container.innerHTML.includes('Task 1'), 'Should include Task 1 follow up');
            assertTrue(container.innerHTML.includes('Risk 1'), 'Should include Risk 1 follow up');
        } finally {
            document.body.removeChild(container);
        }
    });

    test('Raida.render early exits if container is missing', () => {
        const mockPlanner = createMockPlanner();
        const raida = new Raida(mockPlanner);
        // Ensure the container does not exist
        const container = document.getElementById('raidaContent');
        if (container) {
            container.remove();
        }

        // This should not throw an error
        raida.render();
        assertTrue(true, 'Render executed safely without DOM container');
    });

    test('Raida.render populates overdue items correctly', () => {
        const now = new Date();
        const pastDateStr = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 1 day ago

        const mockPlanner = createMockPlanner({
            risks: [{ id: 'R001', planId: 'plan-1', title: 'Overdue Risk', status: 'Open', dueDate: pastDateStr }]
        });

        const raida = new Raida(mockPlanner);

        const container = document.createElement('div');
        container.id = 'raidaContent';
        document.body.appendChild(container);

        try {
            raida.render();
            const html = container.innerHTML;

            // Check that the risk shows up in the Overdue section
            assertTrue(html.includes('Overdue Risk'), 'HTML should contain the overdue risk title');
            assertTrue(html.includes('[R001]'), 'HTML should contain the overdue risk ID');
            // Check that badge count is > 0 for overdue section (might be somewhat brittle based on exact HTML generation, but let's check for the badge)
            // The first section is 'Overdue & upcoming deadlines'
            assertTrue(html.includes('Overdue &amp; upcoming deadlines'), 'Section header should be present');
        } finally {
            container.remove();
        }
    });

    test('Raida.render categorizes critical and ownerless items', () => {
        const mockPlanner = createMockPlanner({
            issues: [{ id: 'I001', planId: 'plan-1', title: 'Critical Issue', status: 'Open', severity: 'Critical', escalationOwner: 'John Doe', associatedTasks: ['T1'] }],
            assumptions: [{ id: 'A001', planId: 'plan-1', title: 'Ownerless Assumption', status: 'Open', owner: '', impact: 'Medium', associatedTasks: ['T2'] }]
        });

        const raida = new Raida(mockPlanner);

        const container = document.createElement('div');
        container.id = 'raidaContent';
        document.body.appendChild(container);

        try {
            raida.render();
            const html = container.innerHTML;

            assertTrue(html.includes('Critical Issue'), 'HTML should contain the critical issue');
            assertTrue(html.includes('Ownerless Assumption'), 'HTML should contain the ownerless assumption');
        } finally {
            container.remove();
        }
    });

    test('Raida.render handles excluded task statuses for stale and upcoming tasks', () => {
        const now = new Date();
        const staleDateStr = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        const upcomingDateStr = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

        const mockPlanner = createMockPlanner({
            tasks: [
                { id: 'T1', title: 'Stale Excluded', status: 'Completed', lastChecked: staleDateStr },
                { id: 'T2', title: 'Stale Included', status: 'In progress', lastChecked: staleDateStr },
                { id: 'T3', title: 'Upcoming Excluded', status: 'Removed', endDate: upcomingDateStr },
                { id: 'T4', title: 'Upcoming Included', status: 'In progress', endDate: upcomingDateStr }
            ]
        });

        // Add excluded statuses to settings
        mockPlanner.getState = () => ({
            settings: {
                raidaOverdueDays: 14,
                raidaStaleDays: 7,
                raidaExcludeTaskStatuses: ['Completed', 'Removed'],
                raidaExcludeTrackerStatuses: ['Closed', 'Resolved', 'Mitigated', 'Completed', 'Removed']
            },
            plans: [{ id: 'plan-1', tasks: mockPlanner.getCurrentPlan().tasks }]
        });

        const raida = new Raida(mockPlanner);

        const container = document.createElement('div');
        container.id = 'raidaContent';
        document.body.appendChild(container);

        try {
            raida.render();
            const html = container.innerHTML;

            assertFalse(html.includes('Stale Excluded'), 'Excluded stale task should not be rendered');
            assertTrue(html.includes('Stale Included'), 'Included stale task should be rendered');
            assertFalse(html.includes('Upcoming Excluded'), 'Excluded upcoming task should not be rendered');
            assertTrue(html.includes('Upcoming Included'), 'Included upcoming task should be rendered');
        } finally {
            container.remove();
        }
    });

    test('Raida.render detects decisions blocking progress', () => {
        const mockPlanner = createMockPlanner({
            tasks: [{ id: 'TASK01', title: 'Blocked Task', fillColor: '#cccccc' }], // #cccccc is 'Not started'
            decisions: [{ id: 'D001', planId: 'plan-1', title: 'Pending Decision', status: 'Pending', associatedTasks: ['TASK01'] }]
        });

        const raida = new Raida(mockPlanner);

        const container = document.createElement('div');
        container.id = 'raidaContent';
        document.body.appendChild(container);

        try {
            raida.render();
            const html = container.innerHTML;

            assertTrue(html.includes('Pending Decision'), 'HTML should contain the pending decision blocking progress');
            assertTrue(html.includes('Decisions blocking progress'), 'Section header should be present');
        } finally {
            container.remove();
        }
    });

});
