const CIRCLE_BOUNCE_ON_COLLISION = true;

class RPSPlayer {
    constructor(parentId, makeEven = true) {
        this.id = parentId;
        this.shape = makeEven ? 
            ["ROCK", "PAPER", "SCISSORS"][parentId % 3] : 
            ["ROCK", "PAPER", "SCISSORS"][Math.floor(Math.random() * 3)];
    }
    
    updateShape(newShape) {
        this.shape = newShape;
    }
    
    get color() {
        if (this.shape === "ROCK") return "#FFFF00";
        if (this.shape === "PAPER") return "#00FF00";
        if (this.shape === "SCISSORS") return "#0000FF";
        return "#000000";
    }
}

class Circle {
    constructor(id, x, y, radius, speed, canvasWidth, canvasHeight) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        const angle = Math.random() * 2 * Math.PI;
        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;
        
        this.player = new RPSPlayer(id);
    }
    
    update() {
        this.x += this.dx;
        this.y += this.dy;
        
        if (this.x - this.radius <= 0 || this.x + this.radius >= this.canvasWidth) {
            this.dx = -this.dx;
            this.x = Math.max(this.radius, Math.min(this.canvasWidth - this.radius, this.x));
        }
        
        if (this.y - this.radius <= 0 || this.y + this.radius >= this.canvasHeight) {
            this.dy = -this.dy;
            this.y = Math.max(this.radius, Math.min(this.canvasHeight - this.radius, this.y));
        }
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.player.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.id, this.x, this.y + 4);
    }
    
    handleCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius + other.radius) {
            const overlap = this.radius + other.radius - distance;
            
            let normalX = dx / distance;
            let normalY = dy / distance;
            
            if (distance === 0) {
                const angle = Math.random() * 2 * Math.PI;
                normalX = Math.cos(angle);
                normalY = Math.sin(angle);
            }
            
            const separation = overlap / 2;
            this.x += normalX * separation;
            this.y += normalY * separation;
            other.x -= normalX * separation;
            other.y -= normalY * separation;
            
            const dvx = this.dx - other.dx;
            const dvy = this.dy - other.dy;
            const dvn = dvx * normalX + dvy * normalY;
            
            if (dvn > 0) return;
            
            const impulse = 2 * dvn / 2;
            
            this.dx -= impulse * normalX;
            this.dy -= impulse * normalY;
            other.dx += impulse * normalX;
            other.dy += impulse * normalY;
        }
    }
    
    isOverlapping(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + other.radius;
    }
}

let canvas;
let ctx;
let circles = [];
let animationId;
let previousOverlaps = new Set();
let selectedColor = 'ROCK'; // Default selection

// Graph variables
let graphCanvas;
let graphCtx;
let graphData = {
    ROCK: [],
    PAPER: [],
    SCISSORS: []
};
let frameCount = 0;
const GRAPH_WIDTH = 600;
const GRAPH_HEIGHT = 200;
const MAX_GRAPH_POINTS = 300;

function initializeCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // Initialize graph canvas
    graphCanvas = document.getElementById('graph');
    graphCtx = graphCanvas.getContext('2d');
    graphCanvas.width = GRAPH_WIDTH;
    graphCanvas.height = GRAPH_HEIGHT;
    
    updateCanvasSize();
}

function updateCanvasSize() {
    // Get container dimensions for responsive sizing
    const container = document.querySelector('.canvas-container');
    const containerWidth = container.clientWidth - 20; // Account for margins
    const containerHeight = container.clientHeight - 20;
    
    // Use container size for responsiveness with sensible defaults
    canvas.width = Math.max(300, Math.min(800, containerWidth)); // Default 800px max, 300px min
    canvas.height = Math.max(200, Math.min(600, containerHeight)); // Default 600px max, 200px min
    
    // Update circle boundaries if they exist
    if (circles.length > 0) {
        circles.forEach(circle => {
            circle.canvasWidth = canvas.width;
            circle.canvasHeight = canvas.height;
            // Keep circles within new bounds
            circle.x = Math.max(circle.radius, Math.min(canvas.width - circle.radius, circle.x));
            circle.y = Math.max(circle.radius, Math.min(canvas.height - circle.radius, circle.y));
        });
    }
}

function createCircles() {
    const numCircles = parseInt(document.getElementById('circles').value);
    const radius = parseInt(document.getElementById('radius').value);
    const speed = parseInt(document.getElementById('speed').value);
    
    circles = [];
    
    for (let i = 0; i < numCircles; i++) {
        let x, y;
        let attempts = 0;
        
        do {
            x = Math.random() * (canvas.width - 2 * radius) + radius;
            y = Math.random() * (canvas.height - 2 * radius) + radius;
            attempts++;
        } while (attempts < 100);
        
        circles.push(new Circle(i + 1, x, y, radius, speed, canvas.width, canvas.height));
    }
}

function handleRPSOverlap(circleOne, circleTwo) {
    const shapes = [circleOne.player.shape, circleTwo.player.shape];
    
    if (shapes[0] === "ROCK" && shapes[1] === "SCISSORS") {
        circleTwo.player.updateShape("ROCK");
    } else if (shapes[0] === "SCISSORS" && shapes[1] === "ROCK") {
        circleOne.player.updateShape("ROCK");
    } else if (shapes[0] === "ROCK" && shapes[1] === "PAPER") {
        circleOne.player.updateShape("PAPER");
    } else if (shapes[0] === "PAPER" && shapes[1] === "ROCK") {
        circleTwo.player.updateShape("PAPER");
    } else if (shapes[0] === "PAPER" && shapes[1] === "SCISSORS") {
        circleOne.player.updateShape("SCISSORS");
    } else if (shapes[0] === "SCISSORS" && shapes[1] === "PAPER") {
        circleTwo.player.updateShape("SCISSORS");
    }
}

function checkOverlaps() {
    const currentOverlaps = new Set();
    
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            if (circles[i].isOverlapping(circles[j])) {
                const pair = `${circles[i].id}-${circles[j].id}`;
                currentOverlaps.add(pair);
                
                if (CIRCLE_BOUNCE_ON_COLLISION) {
                    circles[i].handleCollision(circles[j]);
                }
                
                if (!previousOverlaps.has(pair)) {
                    console.log('Overlapping circles:', [circles[i].id, circles[j].id]);
                    handleRPSOverlap(circles[i], circles[j]);
                }
            }
        }
    }
    
    previousOverlaps = currentOverlaps;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const circle of circles) {
        circle.update();
        circle.draw(ctx);
    }
    
    checkOverlaps();
    
    // Update graph every few frames to avoid performance issues
    if (frameCount % 5 === 0) {
        updateGraphData();
        drawGraph();
    } else {
        frameCount++;
    }
    
    animationId = requestAnimationFrame(animate);
}

function resetSimulation() {
    // Stop any running animation
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Reset state
    updateCanvasSize();
    createCircles();
    previousOverlaps = new Set();
    
    // Reset graph
    resetGraphData();
    
    // Draw initial state but don't start animation
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const circle of circles) {
        circle.draw(ctx);
    }
    
    // Update graph with initial data
    updateGraphData();
    drawGraph();
}

function runAnimation() {
    // If already running, do nothing
    if (animationId) {
        return;
    }
    
    // If no circles exist, reset first
    if (circles.length === 0) {
        resetSimulation();
    }
    
    // Start/resume animation
    animate();
}

function pauseAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function selectColor(color) {
    selectedColor = color;
    
    // Update button visual states
    document.querySelectorAll('.color-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const colorMap = { 'ROCK': 'red', 'PAPER': 'green', 'SCISSORS': 'blue' };
    const selectedButton = document.querySelector(`.color-button.${colorMap[color]}`);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
}

function getClickedCircle(x, y) {
    for (let circle of circles) {
        const dx = x - circle.x;
        const dy = y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= circle.radius) {
            return circle;
        }
    }
    return null;
}

function handleCanvasClick(event) {
    // Only allow clicking when paused
    if (animationId) {
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    const clickedCircle = getClickedCircle(x, y);
    if (clickedCircle) {
        // Change circle's player type
        clickedCircle.player.updateShape(selectedColor);
        
        // Redraw the scene
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const circle of circles) {
            circle.draw(ctx);
        }
    }
}

function resetGraphData() {
    graphData.ROCK = [];
    graphData.PAPER = [];
    graphData.SCISSORS = [];
    frameCount = 0;
    clearGraph();
}

function updateGraphData() {
    // Count each type
    const counts = { ROCK: 0, PAPER: 0, SCISSORS: 0 };
    circles.forEach(circle => {
        counts[circle.player.shape]++;
    });
    
    // Add to graph data
    graphData.ROCK.push(counts.ROCK);
    graphData.PAPER.push(counts.PAPER);
    graphData.SCISSORS.push(counts.SCISSORS);
    
    // Limit data points to prevent memory issues
    if (graphData.ROCK.length > MAX_GRAPH_POINTS) {
        graphData.ROCK.shift();
        graphData.PAPER.shift();
        graphData.SCISSORS.shift();
    }
    
    frameCount++;
}

function clearGraph() {
    graphCtx.clearRect(0, 0, GRAPH_WIDTH, GRAPH_HEIGHT);
    
    // Draw grid and axes
    graphCtx.strokeStyle = '#ddd';
    graphCtx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * GRAPH_HEIGHT;
        graphCtx.beginPath();
        graphCtx.moveTo(0, y);
        graphCtx.lineTo(GRAPH_WIDTH, y);
        graphCtx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 20; i++) {
        const x = (i / 20) * GRAPH_WIDTH;
        graphCtx.beginPath();
        graphCtx.moveTo(x, 0);
        graphCtx.lineTo(x, GRAPH_HEIGHT);
        graphCtx.stroke();
    }
}

function drawGraph() {
    clearGraph();
    
    if (graphData.ROCK.length < 1) return;
    
    const totalCircles = circles.length;
    if (totalCircles === 0) return;
    
    const colors = {
        ROCK: '#FFFF00',
        PAPER: '#00FF00',  
        SCISSORS: '#0000FF'
    };
    
    // Draw each line
    Object.keys(graphData).forEach(type => {
        const data = graphData[type];
        if (data.length < 1) return;
        
        graphCtx.strokeStyle = colors[type];
        graphCtx.lineWidth = 2;
        graphCtx.beginPath();
        
        for (let i = 0; i < data.length; i++) {
            const x = (i / (MAX_GRAPH_POINTS - 1)) * GRAPH_WIDTH;
            const y = GRAPH_HEIGHT - (data[i] / totalCircles) * GRAPH_HEIGHT;
            
            if (i === 0) {
                graphCtx.moveTo(x, y);
            } else {
                graphCtx.lineTo(x, y);
            }
        }
        
        graphCtx.stroke();
    });
}

window.onload = function() {
    initializeCanvas();
    
    // Add canvas click listener
    canvas.addEventListener('click', handleCanvasClick);
    
    // Initialize with reset state
    resetSimulation();
    
    // Add resize event listener for responsive behavior
    window.addEventListener('resize', () => {
        if (canvas) {
            updateCanvasSize();
            // Redraw current state after resize
            if (circles.length > 0 && !animationId) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (const circle of circles) {
                    circle.draw(ctx);
                }
            }
        }
    });
    
};

// Expose functions to global scope for inline event handlers
window.resetSimulation = resetSimulation;
window.runAnimation = runAnimation;
window.pauseAnimation = pauseAnimation;
window.selectColor = selectColor;