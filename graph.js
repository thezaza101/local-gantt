class GraphView {
    constructor() {
        this.modal = null;
        this.canvas = null;
        this.ctx = null;
        this.currentRootId = null;
        this.currentRootType = null;
        this.depth = 1;
        this.nodes = [];
        this.edges = [];
        this.transform = { x: 0, y: 0, scale: 1 };

        // Dragging state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.isDraggingNode = false;
        this.draggedNode = null;

        // Physics state
        this.animationFrameId = null;
    }

    init() {
        this.modalElement = document.getElementById('graphViewModal');
        if (!this.modalElement) return;

        this.modal = new bootstrap.Modal(this.modalElement);
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.depthInput = document.getElementById('graphDepthInput');
        this.depthInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 0) val = 0;
            this.depth = val;
            this.buildGraph();
            this.startSimulation();
        });

        document.getElementById('downloadGraphBtn').addEventListener('click', () => {
            this.downloadImage();
        });

        // Resize canvas correctly
        this.modalElement.addEventListener('shown.bs.modal', () => {
            this.resizeCanvas();
            this.buildGraph();
            this.startSimulation();
        });

        this.modalElement.addEventListener('hidden.bs.modal', () => {
            this.stopSimulation();
            this.currentRootId = null;
            this.currentRootType = null;
        });

        this.setupCanvasInteractions();
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        // Reset transform
        this.transform = { x: rect.width / 2, y: rect.height / 2, scale: 1 };
    }

    open(id, type) {
        this.currentRootId = id;
        this.currentRootType = type;
        this.depthInput.value = this.depth;
        this.modal.show();
    }

    // --- Data Traversal ---

    getEntity(id) {
        const plan = window.PlannerState.getCurrentPlan();
        if (plan && plan.tasks) {
            const task = plan.tasks.find(t => t.id === id);
            if (task) return { ...task, _type: 'Task' };
        }

        const checkTracker = (arr, type) => arr.find(e => e.id === id) ? { ...arr.find(e => e.id === id), _type: type } : null;

        let entity = checkTracker(window.PlannerState.getRisks(), 'Risk') ||
                     checkTracker(window.PlannerState.getIssues(), 'Issue') ||
                     checkTracker(window.PlannerState.getDependencies(), 'Dependency') ||
                     checkTracker(window.PlannerState.getAssumptions(), 'Assumption') ||
                     checkTracker(window.PlannerState.getDecisions(), 'Decision');

        return entity;
    }

    getConnectedIds(entity) {
        const connected = new Set();

        if (entity._type === 'Task') {
            // Task dependencies (predecessors)
            if (entity.dependencies) {
                let deps = [];
                if (Array.isArray(entity.dependencies)) {
                    deps = entity.dependencies;
                } else if (typeof entity.dependencies === 'string') {
                    deps = entity.dependencies.split(',').map(s => s.trim()).filter(s => s);
                }
                deps.forEach(id => connected.add(id));
            }

            // Check if this task is a dependency for other tasks
            const plan = window.PlannerState.getCurrentPlan();
            if (plan && plan.tasks) {
                plan.tasks.forEach(t => {
                    if (t.dependencies) {
                        let tDeps = [];
                        if (Array.isArray(t.dependencies)) {
                            tDeps = t.dependencies;
                        } else if (typeof t.dependencies === 'string') {
                            tDeps = t.dependencies.split(',').map(s => s.trim()).filter(s => s);
                        }
                        if (tDeps.includes(entity.id)) {
                            connected.add(t.id);
                        }
                    }
                });
            }

            // Connected tracker items
            const checkTrackerTasks = (arr) => {
                arr.forEach(e => {
                    if (e.associatedTasks && Array.isArray(e.associatedTasks)) {
                        if (e.associatedTasks.includes(entity.id)) {
                            connected.add(e.id);
                        }
                    }
                });
            };
            checkTrackerTasks(window.PlannerState.getRisks());
            checkTrackerTasks(window.PlannerState.getIssues());
            checkTrackerTasks(window.PlannerState.getDependencies());
            checkTrackerTasks(window.PlannerState.getAssumptions());
            checkTrackerTasks(window.PlannerState.getDecisions());
        } else {
            // Tracker item
            if (entity.associatedTasks && Array.isArray(entity.associatedTasks)) {
                entity.associatedTasks.forEach(id => connected.add(id));
            }
        }

        return Array.from(connected);
    }

    buildGraph() {
        this.nodes = [];
        this.edges = [];

        if (!this.currentRootId) return;

        const visited = new Set();
        const queue = [{ id: this.currentRootId, depth: 0 }];
        visited.add(this.currentRootId);

        const nodesMap = new Map();

        while (queue.length > 0) {
            const { id, depth } = queue.shift();
            const entity = this.getEntity(id);

            if (!entity) continue;

            if (!nodesMap.has(id)) {
                nodesMap.set(id, {
                    id: id,
                    label: entity.title || id,
                    type: entity._type,
                    depth: depth,
                    x: (Math.random() - 0.5) * 100, // Initialize near center
                    y: (Math.random() - 0.5) * 100,
                    vx: 0,
                    vy: 0
                });
            }

            if (depth < this.depth) {
                const connections = this.getConnectedIds(entity);
                connections.forEach(targetId => {
                    if (!visited.has(targetId)) {
                        visited.add(targetId);
                        queue.push({ id: targetId, depth: depth + 1 });
                    }

                    // Add edge if not exists
                    const edgeExists = this.edges.some(e =>
                        (e.source === id && e.target === targetId) ||
                        (e.source === targetId && e.target === id)
                    );
                    if (!edgeExists) {
                        this.edges.push({ source: id, target: targetId });
                    }
                });
            }
        }

        // Ensure all edge targets exist as nodes
        this.edges.forEach(edge => {
            if (!nodesMap.has(edge.target)) {
                const tEntity = this.getEntity(edge.target);
                if (tEntity) {
                    nodesMap.set(edge.target, {
                        id: edge.target,
                        label: tEntity.title || edge.target,
                        type: tEntity._type,
                        depth: this.depth,
                        x: (Math.random() - 0.5) * 100,
                        y: (Math.random() - 0.5) * 100,
                        vx: 0,
                        vy: 0
                    });
                }
            }
        });

        this.nodes = Array.from(nodesMap.values());

        // Connect edges to actual node objects
        this.edges = this.edges.map(e => ({
            source: this.nodes.find(n => n.id === e.source),
            target: this.nodes.find(n => n.id === e.target)
        })).filter(e => e.source && e.target);
    }

    // --- Physics Simulation (Force Directed) ---

    startSimulation() {
        this.stopSimulation();
        this.tick();
    }

    stopSimulation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    tick() {
        this.updatePhysics();
        this.draw();
        this.animationFrameId = requestAnimationFrame(() => this.tick());
    }

    updatePhysics() {
        const k = Math.sqrt((this.canvas.width * this.canvas.height) / (this.nodes.length || 1)); // optimal distance
        const REPULSION = 5000;
        const ATTRACTION = 0.05;
        const DAMPING = 0.85;

        // Repulsive forces
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const node1 = this.nodes[i];
                const node2 = this.nodes[j];

                const dx = node1.x - node2.x;
                const dy = node1.y - node2.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) dist = 0.1;

                const force = REPULSION / (dist * dist);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                node1.vx += fx;
                node1.vy += fy;
                node2.vx -= fx;
                node2.vy -= fy;
            }
        }

        // Attractive forces
        this.edges.forEach(edge => {
            const dx = edge.source.x - edge.target.x;
            const dy = edge.source.y - edge.target.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) dist = 0.1;

            const force = ATTRACTION * (dist - k);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            edge.source.vx -= fx;
            edge.source.vy -= fy;
            edge.target.vx += fx;
            edge.target.vy += fy;
        });

        // Gravity towards center for disconnected parts
        this.nodes.forEach(node => {
            node.vx -= node.x * 0.01;
            node.vy -= node.y * 0.01;
        });

        // Update positions
        this.nodes.forEach(node => {
            if (this.draggedNode === node) return; // Don't move dragged node

            // If it's the root node, keep it fixed at center (0,0)
            if (node.id === this.currentRootId && !this.draggedNode) {
                 node.x = 0;
                 node.y = 0;
                 node.vx = 0;
                 node.vy = 0;
            } else {
                node.vx *= DAMPING;
                node.vy *= DAMPING;
                node.x += node.vx;
                node.y += node.vy;
            }
        });
    }

    // --- Rendering ---

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.transform.x, this.transform.y);
        this.ctx.scale(this.transform.scale, this.transform.scale);

        // Draw edges
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1.5;
        this.edges.forEach(edge => {
            this.ctx.beginPath();
            this.ctx.moveTo(edge.source.x, edge.source.y);
            this.ctx.lineTo(edge.target.x, edge.target.y);
            this.ctx.stroke();
        });

        // Draw nodes
        this.nodes.forEach(node => {
            this.drawNode(node);
        });

        this.ctx.restore();
    }

    drawNode(node) {
        const radius = 35;

        // Color mapping
        let fillColor = '#fff';
        let strokeColor = '#333';

        if (node.id === this.currentRootId) {
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }

        switch (node.type) {
            case 'Task': fillColor = '#e3f2fd'; strokeColor = '#1976d2'; break;
            case 'Risk': fillColor = '#ffebee'; strokeColor = '#d32f2f'; break;
            case 'Issue': fillColor = '#fff3e0'; strokeColor = '#f57c00'; break;
            case 'Dependency': fillColor = '#f3e5f5'; strokeColor = '#7b1fa2'; break;
            case 'Assumption': fillColor = '#e8f5e9'; strokeColor = '#388e3c'; break;
            case 'Decision': fillColor = '#e0f7fa'; strokeColor = '#0097a7'; break;
        }

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.stroke();

        // Draw Text
        this.ctx.shadowColor = 'transparent'; // reset shadow for text
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Type Label
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillStyle = strokeColor;
        this.ctx.fillText(node.type.toUpperCase(), node.x, node.y - 12);

        // Title (truncated)
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#000';
        let label = node.label || '';
        if (label.length > 10) label = label.substring(0, 10) + '...';
        this.ctx.fillText(label, node.x, node.y + 5);

        // ID
        this.ctx.font = '9px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText(node.id, node.x, node.y + 18);
    }

    // --- Interactions ---

    setupCanvasInteractions() {
        const getMousePos = (evt) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        };

        const getWorldPos = (screenPos) => {
            return {
                x: (screenPos.x - this.transform.x) / this.transform.scale,
                y: (screenPos.y - this.transform.y) / this.transform.scale
            };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            const pos = getMousePos(e);
            const wPos = getWorldPos(pos);

            // Check if clicking on node
            let clickedNode = null;
            for (let i = this.nodes.length - 1; i >= 0; i--) {
                const node = this.nodes[i];
                const dx = wPos.x - node.x;
                const dy = wPos.y - node.y;
                if (dx * dx + dy * dy <= 35 * 35) { // radius is 35
                    clickedNode = node;
                    break;
                }
            }

            if (clickedNode) {
                this.isDraggingNode = true;
                this.draggedNode = clickedNode;
            } else {
                this.isDragging = true;
                this.dragStart = { x: pos.x - this.transform.x, y: pos.y - this.transform.y };
                this.canvas.style.cursor = 'grabbing';
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const pos = getMousePos(e);

            if (this.isDraggingNode && this.draggedNode) {
                const wPos = getWorldPos(pos);
                this.draggedNode.x = wPos.x;
                this.draggedNode.y = wPos.y;
            } else if (this.isDragging) {
                this.transform.x = pos.x - this.dragStart.x;
                this.transform.y = pos.y - this.dragStart.y;
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isDraggingNode = false;
            this.draggedNode = null;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.isDraggingNode = false;
            this.draggedNode = null;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const pos = getMousePos(e);

            const zoomSensitivity = 0.001;
            const delta = e.deltaY * -zoomSensitivity;
            let newScale = this.transform.scale * (1 + delta);
            newScale = Math.max(0.1, Math.min(newScale, 5)); // Limit zoom

            // Zoom centered on mouse
            const xs = (pos.x - this.transform.x) / this.transform.scale;
            const ys = (pos.y - this.transform.y) / this.transform.scale;

            this.transform.x = pos.x - xs * newScale;
            this.transform.y = pos.y - ys * newScale;
            this.transform.scale = newScale;
        });
    }

    downloadImage() {
        // Temporarily stop simulation and redraw cleanly on white background
        this.stopSimulation();

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tCtx = tempCanvas.getContext('2d');

        // Fill background
        tCtx.fillStyle = '#fafafa';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw graph
        tCtx.save();
        tCtx.translate(this.transform.x, this.transform.y);
        tCtx.scale(this.transform.scale, this.transform.scale);

        tCtx.strokeStyle = '#999';
        tCtx.lineWidth = 1.5;
        this.edges.forEach(edge => {
            tCtx.beginPath();
            tCtx.moveTo(edge.source.x, edge.source.y);
            tCtx.lineTo(edge.target.x, edge.target.y);
            tCtx.stroke();
        });

        this.nodes.forEach(node => {
            const radius = 35;
            let fillColor = '#fff';
            let strokeColor = '#333';

            if (node.id === this.currentRootId) {
                tCtx.shadowColor = 'rgba(0,0,0,0.5)';
                tCtx.shadowBlur = 10;
            } else {
                tCtx.shadowColor = 'transparent';
                tCtx.shadowBlur = 0;
            }

            switch (node.type) {
                case 'Task': fillColor = '#e3f2fd'; strokeColor = '#1976d2'; break;
                case 'Risk': fillColor = '#ffebee'; strokeColor = '#d32f2f'; break;
                case 'Issue': fillColor = '#fff3e0'; strokeColor = '#f57c00'; break;
                case 'Dependency': fillColor = '#f3e5f5'; strokeColor = '#7b1fa2'; break;
                case 'Assumption': fillColor = '#e8f5e9'; strokeColor = '#388e3c'; break;
                case 'Decision': fillColor = '#e0f7fa'; strokeColor = '#0097a7'; break;
            }

            tCtx.beginPath();
            tCtx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            tCtx.fillStyle = fillColor;
            tCtx.fill();
            tCtx.lineWidth = 3;
            tCtx.strokeStyle = strokeColor;
            tCtx.stroke();

            tCtx.shadowColor = 'transparent';
            tCtx.textAlign = 'center';
            tCtx.textBaseline = 'middle';
            tCtx.font = 'bold 10px Arial';
            tCtx.fillStyle = strokeColor;
            tCtx.fillText(node.type.toUpperCase(), node.x, node.y - 12);
            tCtx.font = '12px Arial';
            tCtx.fillStyle = '#000';
            let label = node.label || '';
            if (label.length > 10) label = label.substring(0, 10) + '...';
            tCtx.fillText(label, node.x, node.y + 5);
            tCtx.font = '9px Arial';
            tCtx.fillStyle = '#666';
            tCtx.fillText(node.id, node.x, node.y + 18);
        });
        tCtx.restore();

        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `Graph_${this.currentRootId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Resume simulation
        this.startSimulation();
    }
}

window.GraphEngine = new GraphView();
