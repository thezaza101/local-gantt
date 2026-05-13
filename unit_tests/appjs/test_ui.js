describe('UI Controller (ui.js)', () => {

    test('escapeHtml correctly sanitizes input', () => {
        const originalPlannerState = window.PlannerState;
        try {
            // Need to create a UI instance. UI class expects window.PlannerState to exist.
            window.PlannerState = {
                getCurrentPlan: () => null
            };
            const ui = new UI();

            const input = '<script>alert("xss & \'injection\'")</script>';
            const result = ui.escapeHtml(input);

            assertEqual(result, '&lt;script&gt;alert(&quot;xss &amp; &#039;injection&#039;&quot;)&lt;/script&gt;');
        } finally {
            window.PlannerState = originalPlannerState;
        }
    });

    test('exportLegendImage collects active tags and generates temporary container', async () => {
        const originalHtml2Canvas = window.html2canvas;
        const originalPlannerState = window.PlannerState;
        const originalGanttEngine = window.GanttEngine;

        try {
            // Mock html2canvas
            window.html2canvas = async (element, options) => {
                return {
                    toDataURL: () => 'data:image/png;base64,dummy'
                };
            };

            // Mock PlannerState
            window.PlannerState = {
                getCurrentPlan: () => ({ name: 'Test Plan' }),
                getFillLegends: () => [{tag: 'Dev', color: '#ff0000'}],
                getBorderLegends: () => [{tag: 'QA', color: '#00ff00'}],
                getStatusColors: () => ({ 'completed': '#28a745' }),
                getTagGroups: () => [],
                settings: { tagGroups: [] }
            };
            const ui = new UI();
            ui.planner = window.PlannerState;

            // Mock GanttEngine
            window.GanttEngine = {
                renderedTasks: [
                    { isMatch: true, task: { tags: ['Dev'], status: 'completed' } },
                    { isMatch: true, task: { tags: ['QA'], excludeFromAnalytics: true } } // Excluded
                ]
            };

            // Call the method
            ui.exportLegendImage();

            // Check if temporary container was created
            const tempElement = document.getElementById('temp-legend-export');
            assertTrue(tempElement !== null, "Temporary element should be created");

            // Cleanup DOM
            if (tempElement) {
                tempElement.remove();
            }
        } finally {
            window.html2canvas = originalHtml2Canvas;
            window.PlannerState = originalPlannerState;
            window.GanttEngine = originalGanttEngine;
        }
    });

    test('renderTagFilters handles empty unique tags', () => {
        const originalAnalyticsEngine = window.AnalyticsEngine;
        const originalPlannerState = window.PlannerState;
        let container = null;

        try {
            // Setup DOM
            container = document.createElement('div');
            container.id = 'tagFiltersContainer';
            document.body.appendChild(container);

            // Mock dependencies
            window.AnalyticsEngine = {
                getUniqueTags: () => []
            };
            window.PlannerState = {
                getFilterState: () => ({ searchText: '', team: '', selectedTags: [] }),
                getCurrentPlan: () => null
            };

            const ui = new UI();
            ui.planner = window.PlannerState;

            ui.renderTagFilters();

            assertEqual(container.innerHTML, '<span class="text-muted small">No tags</span>', 'Should render no tags message');
        } finally {
            // Cleanup
            if (container && container.parentNode) {
                document.body.removeChild(container);
            }
            window.AnalyticsEngine = originalAnalyticsEngine;
            window.PlannerState = originalPlannerState;
        }
    });

    test('renderTagFilters renders tag checkboxes when tags exist', () => {
        const originalAnalyticsEngine = window.AnalyticsEngine;
        const originalPlannerState = window.PlannerState;
        let container = null;
        let taskTextSearch = null;

        try {
            // Setup DOM
            container = document.createElement('div');
            container.id = 'tagFiltersContainer';
            document.body.appendChild(container);

            taskTextSearch = document.createElement('input');
            taskTextSearch.id = 'taskTextSearch';
            document.body.appendChild(taskTextSearch);

            // Mock dependencies
            window.AnalyticsEngine = {
                getUniqueTags: () => ['Dev', 'QA']
            };

            let filterState = { searchText: 'test', selectedTeams: ['T001'], selectedTags: ['Dev'] };
            window.PlannerState = {
                getFilterState: () => filterState,
                setFilterState: (newState) => { Object.assign(filterState, newState); },
                getCurrentPlan: () => null,
                getFillLegends: () => [{tag: 'Dev', color: '#ff0000'}],
                getBorderLegends: () => [{tag: 'QA', color: '#00ff00'}],
                getTagGroups: () => [],
                getTeams: () => [{id: 'T001', name: 'Team Alpha'}],
                settings: { tagGroups: [] }
            };

            const ui = new UI();
            ui.planner = window.PlannerState;

            ui.renderTagFilters();

            // Verify inputs are updated
            assertEqual(taskTextSearch.value, 'test', 'Search text input should be updated');

            // Verify dropdown is rendered
            const dropdownBtn = container.querySelector('#tagFilterDropdown');
            assertTrue(dropdownBtn !== null, 'Dropdown button should be rendered');

            // Verify 'Dev' is checked and 'QA' is not
            const devCheckbox = container.querySelector('#tagFilter_Dev');
            const qaCheckbox = container.querySelector('#tagFilter_QA');

            assertTrue(devCheckbox !== null, 'Dev checkbox should exist');
            assertTrue(devCheckbox.checked, 'Dev checkbox should be checked');

            assertTrue(qaCheckbox !== null, 'QA checkbox should exist');
            assertFalse(qaCheckbox.checked, 'QA checkbox should not be checked');

            // Verify Team Alpha is checked
            const teamCheckbox = container.querySelector('#teamFilter_T001');
            assertTrue(teamCheckbox !== null, 'Team checkbox should exist');
            assertTrue(teamCheckbox.checked, 'Team Alpha checkbox should be checked');
        } finally {
            // Cleanup
            if (container && container.parentNode) document.body.removeChild(container);
            if (taskTextSearch && taskTextSearch.parentNode) document.body.removeChild(taskTextSearch);

            window.AnalyticsEngine = originalAnalyticsEngine;
            window.PlannerState = originalPlannerState;
        }
    });
});
