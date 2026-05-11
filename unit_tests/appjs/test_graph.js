describe('GraphView Engine (graph.js)', () => {

    // Helper to setup mock DOM
    function setupMockDOM() {
        const modal = document.createElement('div');
        modal.id = 'graphViewModal';
        document.body.appendChild(modal);

        const canvasParent = document.createElement('div');
        const canvas = document.createElement('canvas');
        canvas.id = 'graphCanvas';
        canvasParent.appendChild(canvas);
        document.body.appendChild(canvasParent);

        const depthInput = document.createElement('input');
        depthInput.id = 'graphDepthInput';
        depthInput.type = 'number';
        document.body.appendChild(depthInput);

        const btn = document.createElement('button');
        btn.id = 'downloadGraphBtn';
        document.body.appendChild(btn);

        // Mock getContext for canvas
        canvas.getContext = function() {
            return {
                clearRect: () => {},
                save: () => {},
                translate: () => {},
                scale: () => {},
                restore: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                stroke: () => {},
                arc: () => {},
                fill: () => {},
                fillText: () => {}
            };
        };

        // Mock getBoundingClientRect for canvas parent
        canvasParent.getBoundingClientRect = function() {
            return { width: 800, height: 600, top: 0, left: 0 };
        };

        // Mock global bootstrap
        window.bootstrap = {
            Modal: class {
                constructor(el) { this.el = el; }
                show() { this.isShown = true; }
                hide() { this.isShown = false; }
            }
        };
    }

    function cleanupMockDOM() {
        ['graphViewModal', 'graphCanvas', 'graphDepthInput', 'downloadGraphBtn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(c => {
             if(c.parentElement) c.parentElement.remove();
        });
        delete window.bootstrap;
    }

    test('init() sets up DOM elements and modal', () => {
        setupMockDOM();

        try {
            // Reset engine for test
            const graph = new GraphView();

            // Setup mock event listeners tracking
            let modalShownListener = null;
            let modalHiddenListener = null;

            const modalEl = document.getElementById('graphViewModal');
            const origAddEventListener = modalEl.addEventListener;
            modalEl.addEventListener = function(event, cb) {
                if (event === 'shown.bs.modal') modalShownListener = cb;
                if (event === 'hidden.bs.modal') modalHiddenListener = cb;
                origAddEventListener.call(this, event, cb);
            };

            graph.init();

            assertTrue(graph.modalElement !== null);
            assertTrue(graph.modal instanceof window.bootstrap.Modal);
            assertTrue(graph.canvas !== null);
            assertTrue(graph.ctx !== null);
            assertTrue(graph.depthInput !== null);

            // Test hidden.bs.modal event cleanup
            graph.currentRootId = 'TEST_ID';
            graph.currentRootType = 'Task';
            if (modalHiddenListener) modalHiddenListener();

            assertEqual(graph.currentRootId, null);
            assertEqual(graph.currentRootType, null);
        } finally {
            cleanupMockDOM();
        }
    });

    test('open() sets root id and type, updates depth input, and shows modal', () => {
        setupMockDOM();

        try {
            const graph = new GraphView();
            graph.init();

            graph.depth = 3;

            let modalShown = false;
            graph.modal.show = function() { modalShown = true; };

            graph.open('TASK-001', 'Task');

            assertEqual(graph.currentRootId, 'TASK-001');
            assertEqual(graph.currentRootType, 'Task');
            assertEqual(graph.depthInput.value, '3');
            assertTrue(modalShown);
        } finally {
            cleanupMockDOM();
        }
    });

    test('getEntity() finds entity by id across tasks and trackers', () => {
        // Mock PlannerState
        const originalPlannerState = window.PlannerState;

        window.PlannerState = {
            getCurrentPlan: () => ({
                tasks: [
                    { id: 'T-001', title: 'Task 1' }
                ]
            }),
            getRisks: () => [{ id: 'R-001', title: 'Risk 1' }],
            getIssues: () => [{ id: 'I-001', title: 'Issue 1' }],
            getDependencies: () => [{ id: 'D-001', title: 'Dep 1' }],
            getAssumptions: () => [{ id: 'A-001', title: 'Assump 1' }],
            getDecisions: () => [{ id: 'C-001', title: 'Decision 1' }]
        };

        try {
            const graph = new GraphView();

            const task = graph.getEntity('T-001');
            assertEqual(task.id, 'T-001');
            assertEqual(task._type, 'Task');

            const risk = graph.getEntity('R-001');
            assertEqual(risk.id, 'R-001');
            assertEqual(risk._type, 'Risk');

            const decision = graph.getEntity('C-001');
            assertEqual(decision.id, 'C-001');
            assertEqual(decision._type, 'Decision');

            const notFound = graph.getEntity('Z-999');
            assertEqual(notFound, null);
        } finally {
            // Restore
            window.PlannerState = originalPlannerState;
        }
    });

    test('getConnectedIds() correctly identifies connected entities', () => {
        const originalPlannerState = window.PlannerState;

        window.PlannerState = {
            getCurrentPlan: () => ({
                tasks: [
                    { id: 'T-001', title: 'Task 1', dependencies: 'T-002, T-003' },
                    { id: 'T-002', title: 'Task 2', dependencies: ['T-004'] },
                    { id: 'T-003', title: 'Task 3', dependencies: '' },
                    { id: 'T-004', title: 'Task 4' }
                ]
            }),
            getRisks: () => [{ id: 'R-001', title: 'Risk 1', associatedTasks: ['T-001'] }],
            getIssues: () => [],
            getDependencies: () => [],
            getAssumptions: () => [],
            getDecisions: () => []
        };

        try {
            const graph = new GraphView();

            // Test Task Connections
            const task1 = { id: 'T-001', _type: 'Task', dependencies: 'T-002, T-003' };
            const connectedIdsTask1 = graph.getConnectedIds(task1);

            // Should contain predecessors (T-002, T-003), successors (none), and associated trackers (R-001)
            assertTrue(connectedIdsTask1.includes('T-002'));
            assertTrue(connectedIdsTask1.includes('T-003'));
            assertTrue(connectedIdsTask1.includes('R-001'));
            assertEqual(connectedIdsTask1.length, 3);

            // Test Task Connections for task that is a dependency (successor check)
            const task4 = { id: 'T-004', _type: 'Task' };
            const connectedIdsTask4 = graph.getConnectedIds(task4);

            // Should contain T-002 since T-002 depends on T-004
            assertTrue(connectedIdsTask4.includes('T-002'));
            assertEqual(connectedIdsTask4.length, 1);

            // Test Tracker Item Connections
            const risk1 = { id: 'R-001', _type: 'Risk', associatedTasks: ['T-001', 'T-004'] };
            const connectedIdsRisk1 = graph.getConnectedIds(risk1);

            assertTrue(connectedIdsRisk1.includes('T-001'));
            assertTrue(connectedIdsRisk1.includes('T-004'));
            assertEqual(connectedIdsRisk1.length, 2);
        } finally {
            // Restore
            window.PlannerState = originalPlannerState;
        }
    });

    test('buildGraph() correctly traverses and builds nodes and edges based on depth', () => {
        const originalPlannerState = window.PlannerState;

        window.PlannerState = {
            getCurrentPlan: () => ({
                tasks: [
                    { id: 'T-001', title: 'Task 1', dependencies: 'T-002' },
                    { id: 'T-002', title: 'Task 2', dependencies: 'T-003' },
                    { id: 'T-003', title: 'Task 3', dependencies: '' }
                ]
            }),
            getRisks: () => [],
            getIssues: () => [],
            getDependencies: () => [],
            getAssumptions: () => [],
            getDecisions: () => []
        };

        try {
            const graph = new GraphView();

            // Setup initial state
            graph.currentRootId = 'T-001';

            // Test Depth 1
            graph.depth = 1;
            graph.buildGraph();

            // Expected: T-001 and its immediate connection T-002
            assertEqual(graph.nodes.length, 2);
            assertEqual(graph.edges.length, 1);

            const node1 = graph.nodes.find(n => n.id === 'T-001');
            const node2 = graph.nodes.find(n => n.id === 'T-002');
            assertTrue(node1 !== undefined);
            assertTrue(node2 !== undefined);
            assertEqual(node1.depth, 0);
            assertEqual(node2.depth, 1);

            // Edge between node1 and node2
            const edge1 = graph.edges.find(e => (e.source.id === 'T-001' && e.target.id === 'T-002') || (e.source.id === 'T-002' && e.target.id === 'T-001'));
            assertTrue(edge1 !== undefined);

            // Test Depth 2
            graph.depth = 2;
            graph.buildGraph();

            // Expected: T-001, T-002, and T-003
            assertEqual(graph.nodes.length, 3);
            assertEqual(graph.edges.length, 2); // T-001<->T-002 and T-002<->T-003

            const node3 = graph.nodes.find(n => n.id === 'T-003');
            assertTrue(node3 !== undefined);
            assertEqual(node3.depth, 2);

            // Test missing root node
            graph.currentRootId = null;
            graph.buildGraph();
            assertEqual(graph.nodes.length, 0);
            assertEqual(graph.edges.length, 0);
        } finally {
            // Restore
            window.PlannerState = originalPlannerState;
        }
    });

});
