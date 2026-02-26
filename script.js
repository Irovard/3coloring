// ============================================
// Data Structures & Core Logic
// ============================================

class Node {
    constructor(id, x, y, color = 'blue') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
    }
}

class Graph {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.nextId = 0;
    }

    addNode(x, y, color = 'blue') {
        const node = new Node(this.nextId++, x, y, color);
        this.nodes.push(node);
        return node;
    }

    addEdge(n1, n2) {
        if (n1.id !== n2.id && !this.getEdge(n1, n2)) {
            this.edges.push(new Edge(n1, n2));
        }
    }

    getEdge(n1, n2) {
        return this.edges.find(e => 
            (e.node1.id === n1.id && e.node2.id === n2.id) ||
            (e.node1.id === n2.id && e.node2.id === n1.id)
        );
    }

    removeEdge(edge) {
        const index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
            return true;
        }
        return false;
    }

    removeNode(nodeId) {
        const index = this.nodes.findIndex(n => n.id === nodeId);
        if (index > -1) {
            this.nodes.splice(index, 1);
            // Remove all edges connected to this node
            this.edges = this.edges.filter(e => e.node1.id !== nodeId && e.node2.id !== nodeId);
            return true;
        }
        return false;
    }

    clone() {
        const g = new Graph();
        const map = {};
        this.nodes.forEach(n => {
            map[n.id] = g.addNode(n.x, n.y, n.color);
        });
        this.edges.forEach(e => {
            g.addEdge(map[e.node1.id], map[e.node2.id]);
        });
        g.nextId = this.nextId;
        return g;
    }

    isValid() {
        if (this.nodes.length === 0) return true;
        if (this.nodes.some(n => !n.color)) return false;

        for (const e of this.edges) {
            if (e.node1.color === e.node2.color) return false;
        }

        const visited = new Set();
        const queue = [this.nodes[0]];
        visited.add(this.nodes[0].id);

        while (queue.length > 0) {
            const curr = queue.shift();
            for (const e of this.edges) {
                let next = null;
                if (e.node1.id === curr.id) next = e.node2;
                else if (e.node2.id === curr.id) next = e.node1;
                
                if (next && !visited.has(next.id)) {
                    visited.add(next.id);
                    queue.push(next);
                }
            }
        }
        return visited.size === this.nodes.length;
    }

    clear() {
        this.nodes = [];
        this.edges = [];
        this.nextId = 0;
    }
}

// ============================================
// App State
// ============================================

const state = {
    graph: new Graph(),
    permuted: null,
    committed: null,
    selectedColor: 'blue',
    addingEdges: false,
    selectedNodes: [],
    lastClickedNode: null,
    challengeEdge: null,
    revealedNodes: new Set(),
    gameGraph: null,
    gamePermuted: null,
    gameCommitted: null,
    gameChallenge: null,
    gameRevealed: new Set(),
    gameRounds: 0,
};

// ============================================
// Utility Functions  
// ============================================

function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function getNodeAt(graph, x, y) {
    return graph.nodes.find(n => dist(n.x, n.y, x, y) <= 20);
}

function getEdgeAt(graph, x, y, threshold = 15) {
    return graph.edges.find(e => {
        const d = pointToLineDistance(x, y, e.node1.x, e.node1.y, e.node2.x, e.node2.y);
        return d <= threshold;
    });
}

function findBounds(graph) {
    if (graph.nodes.length === 0) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const xs = graph.nodes.map(n => n.x);
    const ys = graph.nodes.map(n => n.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function calcScale(graph, w, h) {
    const b = findBounds(graph);
    const gw = b.maxX - b.minX || 1;
    const gh = b.maxY - b.minY || 1;
    const p = 40;
    
    const sw = (w - 2 * p) / gw;
    const sh = (h - 2 * p) / gh;
    const s = Math.min(sw, sh);
    
    const sw2 = gw * s;
    const sh2 = gh * s;
    
    return {
        scale: s,
        offsetX: p + (w - 2 * p - sw2) / 2 - b.minX * s,
        offsetY: p + (h - 2 * p - sh2) / 2 - b.minY * s
    };
}

function permute(g) {
    const ng = g.clone();
    // Create a proper permutation using Fisher-Yates shuffle
    const colors = ['red', 'blue', 'green'];
    const permuted = [...colors];
    
    // Fisher-Yates shuffle for unbiased random permutation
    for (let i = permuted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [permuted[i], permuted[j]] = [permuted[j], permuted[i]];
    }
    
    const m = {
        'red': permuted[0],
        'blue': permuted[1],
        'green': permuted[2]
    };
    ng.nodes.forEach(n => n.color = m[n.color]);
    return ng;
}
// Helper: Check if point is too close to line segment
function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return dist(px, py, x1, y1);
    
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return dist(px, py, closestX, closestY);
}

// Helper: Check if two line segments intersect
function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(den) < 0.0001) return false;
    
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;
    
    return ua > 0.05 && ua < 0.95 && ub > 0.05 && ub < 0.95;
}

function genRandom() {
    const g = new Graph();
    const n = Math.floor(Math.random() * 3) + 4;
    const c = ['red', 'blue', 'green'];
    const minDist = 90;
    const maxAttempts = 200;
    
    // Better node placement with spacing
    for (let i = 0; i < n; i++) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < maxAttempts) {
            const x = Math.random() * 350 + 25;
            const y = Math.random() * 350 + 25;
            // Check if this position doesn't overlap with existing nodes
            const tooClose = g.nodes.some(node => dist(node.x, node.y, x, y) < minDist);
            if (!tooClose) {
                g.addNode(x, y, c[i % 3]);
                placed = true;
            }
            attempts++;
        }
        // If can't place due to spacing, place anyway
        if (!placed) {
            g.addNode(Math.random() * 350 + 25, Math.random() * 350 + 25, c[i % 3]);
        }
    }
    
    // Create a connected graph first (chain of nodes)
    for (let i = 0; i < n - 1; i++) {
        g.addEdge(g.nodes[i], g.nodes[i + 1]);
    }
    
    // Add more edges ensuring valid 3-coloring and no crossing
    let edges = 0;
    let attempts = 0;
    const maxAttempts2 = 2000;
    const targetEdges = Math.min(n + 1, Math.floor(n * (n - 1) / 6));
    const nodeRadius = 20;
    
    while (edges < targetEdges && attempts < maxAttempts2) {
        attempts++;
        const n1 = g.nodes[Math.floor(Math.random() * n)];
        const n2 = g.nodes[Math.floor(Math.random() * n)];
        if (n1.id !== n2.id && n1.color !== n2.color && !g.getEdge(n1, n2)) {
            // Check if this edge would cross existing edges
            let crossesEdge = false;
            for (const existingEdge of g.edges) {
                if (segmentsIntersect(n1.x, n1.y, n2.x, n2.y, 
                                      existingEdge.node1.x, existingEdge.node1.y,
                                      existingEdge.node2.x, existingEdge.node2.y)) {
                    crossesEdge = true;
                    break;
                }
            }
            
            // Check if this edge would cross unconnected nodes
            let crossesNode = false;
            for (const node of g.nodes) {
                if (node.id !== n1.id && node.id !== n2.id) {
                    const d = pointToLineDistance(node.x, node.y, n1.x, n1.y, n2.x, n2.y);
                    if (d < nodeRadius + 15) {
                        crossesNode = true;
                        break;
                    }
                }
            }
            
            if (!crossesEdge && !crossesNode) {
                g.addEdge(n1, n2);
                edges++;
            }
        }
    }
    
    // 50% chance: make it an invalid 3-coloring
    if (Math.random() < 0.5) {
        const nodeToBreak = g.nodes[Math.floor(Math.random() * g.nodes.length)];
        // Find an edge connected to this node and change its color to match
        const connectedEdge = g.edges.find(e => e.node1.id === nodeToBreak.id || e.node2.id === nodeToBreak.id);
        if (connectedEdge) {
            const otherNode = connectedEdge.node1.id === nodeToBreak.id ? connectedEdge.node2 : connectedEdge.node1;
            nodeToBreak.color = otherNode.color;
        }
    }
    
    return g;
}

// ============================================
// Drawing Functions
// ============================================

const colors = { 'red': '#ef4444', 'blue': '#3b82f6', 'green': '#10b981' };

function draw(canvas, graph, highlight = null, revealed = new Set(), onlyRevealed = false) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (graph.nodes.length === 0) return;
    
    const s = calcScale(graph, canvas.width, canvas.height);

    for (const e of graph.edges) {
        ctx.strokeStyle = e === highlight ? '#ef4444' : '#d1d5db';
        ctx.lineWidth = e === highlight ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(e.node1.x * s.scale + s.offsetX, e.node1.y * s.scale + s.offsetY);
        ctx.lineTo(e.node2.x * s.scale + s.offsetX, e.node2.y * s.scale + s.offsetY);
        ctx.stroke();
    }

    for (const n of graph.nodes) {
        const r = revealed.has(n.id);
        const showColor = !onlyRevealed || r;
        ctx.beginPath();
        ctx.arc(n.x * s.scale + s.offsetX, n.y * s.scale + s.offsetY, 15, 0, 2 * Math.PI);
        ctx.fillStyle = showColor ? colors[n.color] : '#d1d5db';
        ctx.fill();
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.id, n.x * s.scale + s.offsetX, n.y * s.scale + s.offsetY);
    }
}

function drawRaw(canvas, graph) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (graph.nodes.length === 0) return;

    for (const e of graph.edges) {
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.node1.x, e.node1.y);
        ctx.lineTo(e.node2.x, e.node2.y);
        ctx.stroke();
    }

    for (const n of graph.nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = colors[n.color];
        ctx.fill();
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.id, n.x, n.y);
    }
}

// ============================================
// Tab Navigation
// ============================================

document.addEventListener('DOMContentLoaded', () => {

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// ============================================
// CREATE TAB
// ============================================

const graphCanvas = document.getElementById('graphCanvas');

function updateCreate() {
    drawRaw(graphCanvas, state.graph);
    document.getElementById('graphStats').textContent = 
        `Nodes: ${state.graph.nodes.length} | Edges: ${state.graph.edges.length}`;
}

graphCanvas.addEventListener('click', (e) => {
    const rect = graphCanvas.getBoundingClientRect();
    const scaleX = graphCanvas.width / rect.width;
    const scaleY = graphCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (state.addingEdges) {
        const n = getNodeAt(state.graph, x, y);
        if (n) {
            if (state.selectedNodes.length === 0) {
                state.selectedNodes = [n];
            } else if (state.selectedNodes[0].id === n.id) {
                state.selectedNodes = [];
            } else {
                state.graph.addEdge(state.selectedNodes[0], n);
                state.selectedNodes = [];
            }
        } else {
            const edge = getEdgeAt(state.graph, x, y);
            if (edge) {
                state.graph.removeEdge(edge);
            }
        }
    } else {
        const existing = getNodeAt(state.graph, x, y);
        if (existing) {
            // If clicking on a node, toggle removal (click same node again removes it)
            if (state.lastClickedNode && state.lastClickedNode.id === existing.id) {
                state.graph.removeNode(existing.id);
                state.lastClickedNode = null;
            } else {
                existing.color = state.selectedColor;
                state.lastClickedNode = existing;
            }
        } else {
            const close = state.graph.nodes.some(n => dist(n.x, n.y, x, y) < 50);
            if (!close) {
                state.graph.addNode(x, y, state.selectedColor);
            }
            state.lastClickedNode = null;
        }
    }
    updateCreate();
});

document.getElementById('modeBtn').addEventListener('click', function() {
    state.addingEdges = false;
    state.lastClickedNode = null;
    this.classList.add('active');
    document.getElementById('edgeBtn').classList.remove('active');
    document.getElementById('canvasHint').textContent = 'Click to add nodes • Click a node to change its color • Click a node twice to remove it';
});

document.getElementById('edgeBtn').addEventListener('click', function() {
    state.addingEdges = true;
    state.lastClickedNode = null;
    this.classList.add('active');
    document.getElementById('modeBtn').classList.remove('active');
    document.getElementById('canvasHint').textContent = 'Click two nodes to connect • Click an edge to remove it';
});

document.querySelectorAll('.color-dot').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.selectedColor = this.dataset.color;
    });
});

document.getElementById('clearBtn').addEventListener('click', () => {
    state.graph.clear();
    state.selectedColor = 'blue';
    document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-color="blue"]').classList.add('active');
    updateCreate();
});

document.getElementById('validateBtn').addEventListener('click', () => {
    if (state.graph.nodes.length === 0) {
        alert('Create a graph first');
        return;
    }
    if (!state.graph.isValid()) {
        alert('Invalid 3-coloring');
        return;
    }
    document.getElementById('zkpStep').style.display = 'block';
    state.permuted = null;
    state.committed = null;
    state.challengeEdge = null;
    state.revealedNodes.clear();
    // Reset button states for new ZKP session
    document.getElementById('permBtn').style.display = 'inline-flex';
    document.getElementById('commitBtn').style.display = 'none';
    document.getElementById('proverStatus').textContent = '';
    document.getElementById('verifierStatus').textContent = '';
    updateProver();
    updateVerifier();
});

// ============================================
// ZKP
// ============================================

const proverCanvas = document.getElementById('proverCanvas');
const verifierCanvas = document.getElementById('verifierCanvas');

function updateProver() {
    if (!state.permuted) {
        const ctx = proverCanvas.getContext('2d');
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, proverCanvas.width, proverCanvas.height);
        document.getElementById('permutationInstruction').style.display = 'none';
    } else {
        // Show full permuted coloring on prover side
        draw(proverCanvas, state.permuted, null, new Set());
        
        // Show instruction text if committed
        if (state.committed) {
            document.getElementById('permutationInstruction').style.display = 'block';
        } else {
            document.getElementById('permutationInstruction').style.display = 'none';
        }
    }
}

function updateVerifier() {
    if (state.committed) {
        // Show all nodes in gray initially, only reveal challenged edge nodes
        draw(verifierCanvas, state.committed, state.challengeEdge, state.revealedNodes, true);
    } else {
        const ctx = verifierCanvas.getContext('2d');
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, verifierCanvas.width, verifierCanvas.height);
    }
}

document.getElementById('permBtn').addEventListener('click', () => {
    state.permuted = permute(state.graph);
    document.getElementById('proverStatus').textContent = 'Permuted';
    document.getElementById('permBtn').style.display = 'none';
    document.getElementById('commitBtn').style.display = 'inline-flex';
    updateProver();
});

document.getElementById('commitBtn').addEventListener('click', () => {
    state.committed = state.permuted.clone();
    state.revealedNodes.clear();
    state.challengeEdge = null;
    document.getElementById('proverStatus').textContent = 'Waiting for challenge';
    document.getElementById('commitBtn').style.display = 'none';
    updateProver();
    updateVerifier();
});

verifierCanvas.addEventListener('click', (e) => {
    if (!state.committed) return;
    
    const rect = verifierCanvas.getBoundingClientRect();
    const scaleX = verifierCanvas.width / rect.width;
    const scaleY = verifierCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const s = calcScale(state.committed, verifierCanvas.width, verifierCanvas.height);
    const gx = (x - s.offsetX) / s.scale;
    const gy = (y - s.offsetY) / s.scale;

    for (const edge of state.committed.edges) {
        const x1 = edge.node1.x, y1 = edge.node1.y;
        const x2 = edge.node2.x, y2 = edge.node2.y;
        const d = Math.abs((y2 - y1) * gx - (x2 - x1) * gy + x2 * y1 - y2 * x1) /
                  Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
        
        if (d <= 20) {
            // Generate new permutation for this challenge
            state.permuted = permute(state.graph);
            state.committed = state.permuted.clone();
            state.revealedNodes.clear();
            state.challengeEdge = edge;
            state.selectedNodes = [edge.node1, edge.node2];
            // Reveal the challenged edge nodes
            state.revealedNodes.add(edge.node1.id);
            state.revealedNodes.add(edge.node2.id);
            document.getElementById('proverStatus').textContent = 'Challenged - revealing...';
            updateProver();
            updateVerifier();
            break;
        }
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    location.reload();
});

// ============================================
// GAME
// ============================================

const gameCanvas = document.getElementById('gameCanvas');

function initGame() {
    state.gameGraph = genRandom();
    state.gameChallenge = null;
    state.gameRevealed.clear();
    
    document.getElementById('gameStatus').textContent = 'Click an edge';
    document.getElementById('revealedBox').style.display = 'none';
    document.getElementById('gameActions').style.display = 'none';
    // Show gray graph initially
    draw(gameCanvas, state.gameGraph, null, new Set(), true);
}

gameCanvas.addEventListener('click', (e) => {
    if (!state.gameGraph || state.gameChallenge) return;
    
    const rect = gameCanvas.getBoundingClientRect();
    const scaleX = gameCanvas.width / rect.width;
    const scaleY = gameCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const s = calcScale(state.gameGraph, gameCanvas.width, gameCanvas.height);
    const gx = (x - s.offsetX) / s.scale;
    const gy = (y - s.offsetY) / s.scale;

    for (const edge of state.gameGraph.edges) {
        const x1 = edge.node1.x, y1 = edge.node1.y;
        const x2 = edge.node2.x, y2 = edge.node2.y;
        const d = Math.abs((y2 - y1) * gx - (x2 - x1) * gy + x2 * y1 - y2 * x1) /
                  Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
        
        if (d <= 20) {
            // Generate NEW random permutation for this challenge
            state.gamePermuted = permute(state.gameGraph);
            state.gameChallenge = edge;
            state.gameRevealed.clear();
            state.gameRevealed.add(edge.node1.id);
            state.gameRevealed.add(edge.node2.id);
            
            // Get permuted colors of the two nodes
            const permNode1 = state.gamePermuted.nodes.find(n => n.id === edge.node1.id);
            const permNode2 = state.gamePermuted.nodes.find(n => n.id === edge.node2.id);
            const c1 = permNode1.color.toUpperCase();
            const c2 = permNode2.color.toUpperCase();
            document.getElementById('revealedInfo').innerHTML = 
                `<strong>Node ${edge.node1.id}:</strong> ${c1}<br><strong>Node ${edge.node2.id}:</strong> ${c2}`;
            
            document.getElementById('revealedBox').style.display = 'block';
            document.getElementById('gameActions').style.display = 'flex';
            // Show game graph with only revealed nodes colored (using permutation)
            draw(gameCanvas, state.gamePermuted, edge, state.gameRevealed, true);
            break;
        }
    }
});


document.getElementById('acceptGameBtn').addEventListener('click', () => {
    const isValid = state.gameGraph.isValid();
    const isCorrect = isValid;
    
    document.getElementById('gameResult').style.display = 'block';
    document.getElementById('resultTitle').textContent = isCorrect ? '✓ Correct!' : '✗ Wrong!';
    let msg = `After ${state.gameRounds} test${state.gameRounds !== 1 ? 's' : ''}, you accepted. `;
    
    if (isCorrect) {
        msg += 'The graph IS a valid 3-coloring. Your decision was correct!';
    } else {
        msg += 'The graph is NOT a valid 3-coloring. You were fooled by the prover!';
    }
    
    document.getElementById('resultMsg').textContent = msg;
    // Show the original graph with correct coloring
    draw(document.getElementById('finalCanvas'), state.gameGraph, null, new Set());
});

document.getElementById('retryGameBtn').addEventListener('click', () => {
    state.gameRounds++;
    document.getElementById('roundCount').textContent = state.gameRounds;
    state.gameChallenge = null;
    state.gameRevealed.clear();
    document.getElementById('revealedBox').style.display = 'none';
    document.getElementById('gameActions').style.display = 'none';
    // Show gray graph again for next round
    draw(gameCanvas, state.gameGraph, null, new Set(), true);
});

document.getElementById('denyGameBtn').addEventListener('click', () => {
    const isValid = state.gameGraph.isValid();
    const isCorrect = !isValid;
    
    document.getElementById('gameResult').style.display = 'block';
    document.getElementById('resultTitle').textContent = isCorrect ? '✓ Correct!' : '✗ Wrong!';
    let msg = `After ${state.gameRounds} test${state.gameRounds !== 1 ? 's' : ''}, you rejected. `;
    
    if (isCorrect) {
        msg += 'The graph is NOT a valid 3-coloring. Your decision was correct!';
    } else {
        msg += 'The graph IS a valid 3-coloring. You rejected a valid proof!';
    }
    
    document.getElementById('resultMsg').textContent = msg;
    draw(document.getElementById('finalCanvas'), state.gameGraph);
});

function startNewGame() {
    state.gameRounds = 0;
    document.getElementById('roundCount').textContent = '0';
    document.getElementById('gameResult').style.display = 'none';
    initGame();
}

document.getElementById('generateNewGraphBtn').addEventListener('click', startNewGame);
document.getElementById('playAgainBtn').addEventListener('click', startNewGame);

// ============================================
// Initialize
// ============================================

document.querySelector('[data-color="blue"]').classList.add('active');
document.getElementById('permBtn').style.display = 'inline-flex';
document.getElementById('commitBtn').style.display = 'none';
updateCreate();
initGame();

}); // End DOMContentLoaded
