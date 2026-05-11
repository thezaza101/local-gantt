describe('Tracker (tracker.js)', () => {

    // --- Mocks & Setup ---

    function createMockPlanner() {
        return {
            file: {
                risks: [],
                issues: [],
                dependencies: [],
                assumptions: [],
                decisions: [],
                settings: {
                    teams: [{id: 'T1', name: 'Team A'}],
                    personnel: [{id: 'P1', name: 'Person A'}],
                    trackerColumns: {},
                    trackerTruncateLength: 50
                }
            },
            getState() { return this.file; },
            getTeams() { return this.file.settings.teams; },
            getPersonnel() { return this.file.settings.personnel; },
            getTrackerSettings() {
                return {
                    columns: {
                        risks: [{id: 'id', label: 'ID', visible: true}, {id: 'title', label: 'Title', visible: true}],
                        issues: [{id: 'id', label: 'ID', visible: true}],
                        dependencies: [{id: 'id', label: 'ID', visible: true}],
                        assumptions: [{id: 'id', label: 'ID', visible: true}],
                        decisions: [{id: 'id', label: 'ID', visible: true}]
                    },
                    truncateLength: 50
                };
            },
            getCurrentPlan() {
                return { tasks: [{id: 'Task1', title: 'Test Task'}] };
            },
            getNowTimestamp() { return '2023-01-01 12:00:00'; },
            generateEntityId(prefix) { return `${prefix}12345`; },
            getEntityById(type, id) { return null; },
            addEntity(type, data) { return true; },
            updateEntity(type, id, data) { return true; },
            deleteEntity(type, id) { return true; }
        };
    }

    test('Tracker constructor initializes correctly', () => {
        const mockPlanner = createMockPlanner();
        const tracker = new Tracker(mockPlanner);

        assertEqual(tracker.planner, mockPlanner);
        assertTrue(tracker.selectedItems instanceof Set);
        assertEqual(tracker.selectedItems.size, 0);
        assertDeepEqual(tracker.sortState, {});
        assertDeepEqual(tracker.filterState, {});
    });

    test('escapeHtml sanitizes unsafe strings', () => {
        const tracker = new Tracker(createMockPlanner());

        assertEqual(tracker.escapeHtml('<script>'), '&lt;script&gt;');
        assertEqual(tracker.escapeHtml('A & B'), 'A &amp; B');
        assertEqual(tracker.escapeHtml('"hello"'), '&quot;hello&quot;');
        assertEqual(tracker.escapeHtml("'world'"), '&#039;world&#039;');
        assertEqual(tracker.escapeHtml(''), '');
        assertEqual(tracker.escapeHtml(null), '');
        assertEqual(tracker.escapeHtml(undefined), '');
    });

    test('getCellValue returns expected values', () => {
        const tracker = new Tracker(createMockPlanner());
        const item = {
            id: 'R1',
            scope: 'Global',
            planId: null,
            owningTeam: 'T1',
            fromTasks: ['Task1'],
            affectedTeams: 'T2',
            toTask: 'Task2',
            dueDate: '2023-12-31',
            requiredDate: '2023-10-10',
            targetDate: '2024-01-01',
            description: 'Test description'
        };

        // Test scope
        assertEqual(tracker.getCellValue(item, 'scope', 'risks'), 'Global');
        item.planId = 'Plan1';
        assertEqual(tracker.getCellValue(item, 'scope', 'risks'), 'Plan');

        // Test owningTeamFromTask
        assertEqual(tracker.getCellValue(item, 'owningTeamFromTask', 'dependencies'), 'Team A / Task1');

        // Test affectedTeamsToTask
        assertEqual(tracker.getCellValue(item, 'affectedTeamsToTask', 'dependencies'), 'T2 / Task2');

        // Test dates based on type
        assertEqual(tracker.getCellValue(item, 'dueDate', 'risks'), '2023-12-31');
        assertEqual(tracker.getCellValue(item, 'requiredDate', 'dependencies'), '2023-10-10');
        assertEqual(tracker.getCellValue(item, 'targetDate', 'issues'), '2024-01-01');

        // Test generic column
        assertEqual(tracker.getCellValue(item, 'description', 'risks'), 'Test description');
        assertEqual(tracker.getCellValue(item, 'missingProp', 'risks'), '');
    });

    test('parseCsv parses valid CSV correctly', () => {
        const tracker = new Tracker(createMockPlanner());
        const csv = 'id,title,type\n1,"Test, item",risks\n2,Another Item,issues';
        const parsed = tracker.parseCsv(csv);

        assertEqual(parsed.length, 2);
        assertEqual(parsed[0].id, '1');
        assertEqual(parsed[0].title, 'Test, item');
        assertEqual(parsed[0].type, 'risks');

        assertEqual(parsed[1].id, '2');
        assertEqual(parsed[1].title, 'Another Item');
        assertEqual(parsed[1].type, 'issues');
    });

    test('parseCsv returns empty array for empty input', () => {
        const tracker = new Tracker(createMockPlanner());
        assertDeepEqual(tracker.parseCsv(''), []);
        assertDeepEqual(tracker.parseCsv(null), []);
    });

    test('processImportedCsv correctly processes and adds entities', () => {
        const mockPlanner = createMockPlanner();
        let addedTypes = [];
        let addedEntities = [];
        mockPlanner.addEntity = (type, data) => {
            addedTypes.push(type);
            addedEntities.push(data);
            return true;
        };

        const tracker = new Tracker(mockPlanner);
        // Mock render to avoid DOM operations
        tracker.render = () => {};

        const csv = 'id,title,type\n,New Risk,risk\n,New Issue,issue\n,Unknown Type,unknown';
        const result = tracker.processImportedCsv(csv, 'Plan1');

        assertEqual(result.success, 2);
        assertEqual(result.skipped.length, 1);
        assertEqual(result.skipped[0], 'unknown');

        assertEqual(addedTypes.length, 2);
        assertEqual(addedTypes[0], 'risks');
        assertEqual(addedTypes[1], 'issues');

        assertEqual(addedEntities[0].title, 'New Risk [Imported]');
        assertEqual(addedEntities[0].planId, 'Plan1');
        assertEqual(addedEntities[0].tags[0], 'Imported');
    });

    test('processImportedCsv handles original id collisions', () => {
        const mockPlanner = createMockPlanner();
        // Simulate collision
        mockPlanner.getEntityById = (type, id) => {
            if (id === '123') return {id: '123', title: 'Existing'};
            return null;
        };
        let addedEntities = [];
        mockPlanner.addEntity = (type, data) => {
            addedEntities.push(data);
            return true;
        };

        const tracker = new Tracker(mockPlanner);
        tracker.render = () => {};

        const csv = 'id,title,type\n123,Colliding Risk,risk';
        const result = tracker.processImportedCsv(csv, null);

        assertEqual(result.success, 1);
        assertEqual(addedEntities.length, 1);
        assertEqual(addedEntities[0].id, 'R12345'); // mock generateEntityId
        assertEqual(addedEntities[0].title, '[original id 123] Colliding Risk [Imported]');
    });

    // --- DOM Tests ---

    test('updateLastChecked updates the timestamp and DOM', () => {
        // Mock DOM
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <input type="hidden" id="trackerItemType" value="risks">
            <input type="hidden" id="trackerOriginalId" value="R123">
            <span id="trackerLastCheckedDisplay">Old Time</span>
        `;
        document.body.appendChild(wrapper);

        const mockPlanner = createMockPlanner();
        let updateCalled = false;
        mockPlanner.getEntityById = (type, id) => {
            if (id === 'R123') return {id: 'R123', lastChecked: 'Old Time'};
            return null;
        };
        mockPlanner.updateEntity = (type, id, data) => {
            updateCalled = true;
            return true;
        };

        const tracker = new Tracker(mockPlanner);
        tracker.render = () => {}; // Stub full render

        tracker.updateLastChecked();

        assertTrue(updateCalled);
        assertEqual(document.getElementById('trackerLastCheckedDisplay').textContent, 'Last Checked: 2023-01-01 12:00:00');

        document.body.removeChild(wrapper);
    });

    test('deleteItem triggers planner delete and cleans up', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <input type="hidden" id="trackerItemType" value="risks">
            <input type="hidden" id="trackerOriginalId" value="R123">
            <div id="trackerEditModal"></div>
        `;
        document.body.appendChild(wrapper);

        // Mock window.confirm
        const originalConfirm = window.confirm;
        window.confirm = () => true;

        // Mock bootstrap Modal
        const originalBootstrap = window.bootstrap;
        let modalHidden = false;
        window.bootstrap = {
            Modal: {
                getInstance: () => ({
                    hide: () => { modalHidden = true; }
                })
            }
        };

        const mockPlanner = createMockPlanner();
        let deleteCalledWith = null;
        mockPlanner.deleteEntity = (type, id) => {
            deleteCalledWith = {type, id};
        };

        const tracker = new Tracker(mockPlanner);
        tracker.render = () => {}; // Stub full render

        tracker.deleteItem();

        assertEqual(deleteCalledWith.type, 'risks');
        assertEqual(deleteCalledWith.id, 'R123');
        assertTrue(modalHidden);

        // Restore globals
        window.confirm = originalConfirm;
        window.bootstrap = originalBootstrap;
        document.body.removeChild(wrapper);
    });

    test('openEditModal populates fields correctly for existing item', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="trackerEditModal"></div>
            <form id="trackerEditForm"></form>
            <input id="trackerItemType">
            <input id="trackerOriginalId">
            <div id="trackerDynamicFields"></div>
            <input id="trackerItemId">
            <input id="trackerItemTitle">
            <textarea id="trackerItemDescription"></textarea>
            <input id="trackerItemTags">
            <span id="trackerLastUpdatedDisplay"></span>
            <span id="trackerLastCheckedDisplay"></span>
            <select id="trackerItemScope"></select>
            <button id="deleteTrackerItemBtn" class="d-none"></button>
            <ul id="trackerItemTeamsDropdown"></ul>
            <ul id="trackerItemPersonnelDropdown"></ul>
            <ul id="trackerItemTasksDropdown"></ul>
            <ul id="trackerItemGroupedTagsDropdown"></ul>
        `;
        document.body.appendChild(wrapper);

        const originalBootstrap = window.bootstrap;
        let modalShown = false;
        window.bootstrap = {
            Modal: {
                getOrCreateInstance: () => ({
                    show: () => { modalShown = true; }
                })
            }
        };

        const mockPlanner = createMockPlanner();
        mockPlanner.getEntityById = (type, id) => {
            if (id === 'R1') return {
                id: 'R1', title: 'Test Risk', description: 'Desc',
                status: 'Open', tags: ['Open', 'Tag1'],
                lastUpdated: 'T1', lastChecked: 'T2'
            };
            return null;
        };

        const tracker = new Tracker(mockPlanner);
        tracker.openEditModal('risks', 'R1');

        assertTrue(modalShown);
        assertEqual(document.getElementById('trackerItemType').value, 'risks');
        assertEqual(document.getElementById('trackerOriginalId').value, 'R1');
        assertEqual(document.getElementById('trackerItemId').value, 'R1');
        assertEqual(document.getElementById('trackerItemTitle').value, 'Test Risk');
        assertEqual(document.getElementById('trackerItemTags').value, 'Tag1'); // Open status filtered out
        assertFalse(document.getElementById('deleteTrackerItemBtn').classList.contains('d-none'));

        window.bootstrap = originalBootstrap;
        document.body.removeChild(wrapper);
    });

    test('saveItem validates required fields and updates planner', () => {
         const wrapper = document.createElement('div');
         wrapper.innerHTML = `
            <div id="trackerEditModal"></div>
            <input id="trackerItemType" value="risks">
            <input id="trackerOriginalId" value="R1">
            <input id="trackerItemId" value="R1">
            <input id="trackerItemTitle" value="Updated Title">
            <textarea id="trackerItemDescription">New Desc</textarea>
            <input id="trackerItemTags" value="NewTag">
            <select id="trackerItemScope"><option value="Plan1">Plan1</option></select>
            <select id="trackerStatus"><option value="Mitigated">Mitigated</option></select>
            <!-- Risk specific fields to avoid null errors -->
            <select id="riskProbability"><option value="Low"></option></select>
            <select id="riskSeverity"><option value="Low"></option></select>
            <textarea id="riskMitigationPlan"></textarea>
            <textarea id="riskTriggerIndicators"></textarea>
            <input id="riskOwner">
            <input id="riskDueDate">
         `;
         document.body.appendChild(wrapper);

         // Set values that aren't set by innerHTML for selects
         document.getElementById('trackerItemScope').value = 'Plan1';
         document.getElementById('trackerStatus').value = 'Mitigated';
         document.getElementById('riskProbability').value = 'Low';
         document.getElementById('riskSeverity').value = 'Low';

         const originalBootstrap = window.bootstrap;
         let modalHidden = false;
         window.bootstrap = {
             Modal: {
                 getInstance: () => ({
                     hide: () => { modalHidden = true; }
                 })
             }
         };

         const mockPlanner = createMockPlanner();
         mockPlanner.getEntityById = () => ({id: 'R1', lastChecked: 'OldTime'}); // Original exists
         let updateCalledWith = null;
         mockPlanner.updateEntity = (type, id, data) => {
             updateCalledWith = {type, id, data};
         };

         const tracker = new Tracker(mockPlanner);
         tracker.render = () => {};
         tracker.saveItem();

         assertEqual(updateCalledWith.type, 'risks');
         assertEqual(updateCalledWith.id, 'R1');
         assertEqual(updateCalledWith.data.title, 'Updated Title');
         assertEqual(updateCalledWith.data.description, 'New Desc');
         assertTrue(updateCalledWith.data.tags.includes('NewTag'));
         assertTrue(updateCalledWith.data.tags.includes('Mitigated'));
         assertEqual(updateCalledWith.data.status, 'Mitigated');
         assertEqual(updateCalledWith.data.planId, 'Plan1');

         assertTrue(modalHidden);

         window.bootstrap = originalBootstrap;
         document.body.removeChild(wrapper);
    });

    test('autoCreateProperDependencies creates missing dependencies and updates statuses', () => {
        const mockPlanner = createMockPlanner();
        mockPlanner.getCurrentPlan = () => ({
            tasks: [
                {id: 'T1', dependencies: ['T2']}, // Needs a proper dependency created
                {id: 'T3', dependencies: []}      // Existing dependency should be removed
            ]
        });

        let allDeps = [
            { id: 'D1', fromTasks: ['T4'], toTask: 'T3', status: 'Active', tags: ['Active'] } // Orphaned, should be marked Removed
        ];

        mockPlanner.getDependencies = () => allDeps;

        let addedTypes = [];
        mockPlanner.addEntity = (type, data) => { addedTypes.push(type); allDeps.push(data); return true; };

        let updatedIds = [];
        mockPlanner.updateEntity = (type, id, data) => {
            updatedIds.push(id);
            const idx = allDeps.findIndex(d => d.id === id);
            if(idx > -1) allDeps[idx] = data;
            return true;
        };

        const originalAlert = window.alert;
        window.alert = () => {}; // Suppress alerts

        const tracker = new Tracker(mockPlanner);
        tracker.render = () => {};
        tracker.autoCreateProperDependencies();

        // One added (T2 -> T1)
        assertEqual(addedTypes.length, 1);
        assertEqual(addedTypes[0], 'dependencies');

        // One updated (D1 to Removed)
        assertEqual(updatedIds.length, 1);
        assertEqual(updatedIds[0], 'D1');
        assertEqual(allDeps.find(d => d.id === 'D1').status, 'Removed');

        window.alert = originalAlert;
    });

    test('renderTable renders columns and rows correctly', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <table id="risksTable">
                <thead></thead>
                <tbody></tbody>
            </table>
        `;
        document.body.appendChild(wrapper);

        const mockPlanner = createMockPlanner();
        const items = [
            { id: 'R1', title: 'Test 1', description: 'Long description that might need truncating' }
        ];

        const tracker = new Tracker(mockPlanner);
        tracker.renderTable('risks', items, 'risksTable');

        const tbody = document.querySelector('#risksTable tbody');
        const rows = tbody.querySelectorAll('tr');
        assertEqual(rows.length, 1);

        const cells = rows[0].querySelectorAll('td');
        // Checkbox + ID + Title
        assertEqual(cells.length, 3);
        assertTrue(cells[1].textContent.includes('R1'));
        assertTrue(cells[2].textContent.includes('Test 1'));

        document.body.removeChild(wrapper);
    });
});
