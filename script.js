// --- CORE HUB CONTROLLER ---
const GameHub = {
    currentScreen: 'hub',
    stars: 9029,
    
    init() {
        this.hubScreen = document.getElementById('hub-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.winOverlay = document.getElementById('win-overlay');
        
        document.getElementById('start-science').onclick = () => this.switchGame('science');
        document.getElementById('start-detective').onclick = () => this.switchGame('detective');
        document.getElementById('back-to-hub').onclick = () => this.showHub();
        document.getElementById('next-btn').onclick = () => this.playNext();
        
        this.updateStars();
    },
    
    switchGame(type) {
        this.hubScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.winOverlay.classList.add('hidden');
        
        const titleEl = document.getElementById('active-game-title');
        
        if (type === 'detective') {
            titleEl.textContent = 'CATCH THE DIFFERENCE';
            CatchDifference.start();
        } else if (type === 'science') {
            titleEl.textContent = 'SCIENCE LAB';
            ScienceLab.start();
        }
    },
    
    showHub() {
        this.hubScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.winOverlay.classList.add('hidden');
    },
    
    showWin() {
        this.winOverlay.classList.remove('hidden');
        this.stars += 50;
        this.updateStars();
    },
    
    playNext() {
        this.winOverlay.classList.add('hidden');
        const activeTitle = document.getElementById('active-game-title').textContent;
        if (activeTitle.includes('CATCH')) CatchDifference.start();
        else ScienceLab.start();
    },
    
    updateStars() {
        document.getElementById('total-stars').textContent = this.stars;
        document.getElementById('score-display').textContent = `⭐ ${this.stars}`;
    }
};

// --- SCIENCE LAB: WATER SORT ---
const ScienceLab = {
    TUBE_CAPACITY: 4,
    level: 1,
    tubesCount: 0,
    colorsCount: 0,
    gameState: [],
    selectedIdx: null,
    isAnimating: false,
    
    start() {
        this.initLevel();
    },
    
    initLevel() {
        this.colorsCount = Math.min(3 + Math.floor((this.level - 1) / 2), 8); 
        this.tubesCount = this.colorsCount + 2; 
        this.generateLevel();
        this.render();
        document.getElementById('level-display').textContent = `Level ${this.level}`;
        this.selectedIdx = null;
        this.isAnimating = false;
    },
    
    generateLevel() {
        this.gameState = Array.from({ length: this.tubesCount }, () => []);
        let colorPool = [];
        for (let c = 1; c <= this.colorsCount; c++) {
            for (let i = 0; i < this.TUBE_CAPACITY; i++) colorPool.push(c);
        }
        colorPool.sort(() => Math.random() - 0.5);
        let poolIndex = 0;
        for (let i = 0; i < this.colorsCount; i++) {
            for (let j = 0; j < this.TUBE_CAPACITY; j++) {
                this.gameState[i].push({ color: colorPool[poolIndex], hidden: (j < this.TUBE_CAPACITY - 1 && this.level >= 3 && Math.random() > 0.4) });
                poolIndex++;
            }
        }
        for (let i = 0; i < this.colorsCount; i++) {
            if (this.gameState[i].length > 0) this.gameState[i][this.gameState[i].length - 1].hidden = false;
        }
    },
    
    render() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        let tubeIndex = 0;
        const container = document.createElement('div');
        container.style.display = 'flex'; container.style.flexWrap = 'wrap'; container.style.justifyContent = 'center'; container.style.gap = '15px';
        
        for (let i = 0; i < this.tubesCount; i++) {
            const idx = i;
            const containerEl = document.createElement('div');
            containerEl.className = `bottle-container ${this.selectedIdx === idx ? 'selected' : ''}`;
            const tubeEl = document.createElement('div');
            tubeEl.className = 'tube';
            
            const tubeData = this.gameState[idx];
            for(let j=0; j<this.TUBE_CAPACITY; j++) {
                const waterEl = document.createElement('div');
                waterEl.className = 'water';
                const segment = tubeData[j];
                if (segment) {
                    if (segment.hidden) { waterEl.classList.add('hidden-water'); waterEl.innerHTML = '?'; }
                    else waterEl.classList.add(`color-${segment.color}`);
                    waterEl.style.height = '25%';
                } else waterEl.style.height = '0%';
                tubeEl.appendChild(waterEl);
            }
            containerEl.appendChild(tubeEl);
            containerEl.onclick = () => this.handleTubeClick(idx);
            container.appendChild(containerEl);
        }
        board.appendChild(container);
    },
    
    handleTubeClick(index) {
        if (this.isAnimating) return;
        if (this.selectedIdx === null) {
            if (this.gameState[index].length > 0) { this.selectedIdx = index; this.render(); }
        } else if (this.selectedIdx === index) {
            this.selectedIdx = null; this.render();
        } else this.tryPour(this.selectedIdx, index);
    },
    
    tryPour(sourceIdx, destIdx) {
        const sourceTube = this.gameState[sourceIdx];
        const destTube = this.gameState[destIdx];
        if (sourceTube.length === 0 || destTube.length >= this.TUBE_CAPACITY) { this.selectedIdx = null; this.render(); return; }
        const topColor = sourceTube[sourceTube.length - 1].color;
        if (destTube.length === 0 || destTube[destTube.length - 1].color === topColor) {
            this.performPour(sourceIdx, destIdx);
        } else { this.selectedIdx = null; this.render(); }
    },
    
    performPour(sourceIdx, destIdx) {
        this.isAnimating = true;
        const segment = this.gameState[sourceIdx].pop();
        segment.hidden = false;
        this.gameState[destIdx].push(segment);
        if (this.gameState[sourceIdx].length > 0) this.gameState[sourceIdx][this.gameState[sourceIdx].length-1].hidden = false;
        this.selectedIdx = null;
        this.render();
        setTimeout(() => { this.isAnimating = false; this.checkWin(); }, 300);
    },
    
    checkWin() {
        const isWin = this.gameState.every(tube => tube.length === 0 || (tube.length === this.TUBE_CAPACITY && tube.every(seg => seg.color === tube[0].color)));
        if (isWin) { this.level++; GameHub.showWin(); }
    }
};

// --- TOUGHER CATCH THE DIFFERENCE ---
const CatchDifference = {
    sceneries: [
        { 
            name: 'MOIST MOUNTAIN', 
            bg: '#87CEEB',
            layers: [
                { type: 'sky', color: '#87CEEB', height: 60 },
                { type: 'mountain', color: '#7f8c8d', points: '0,100 50,20 100,100' },
                { type: 'mountain', color: '#95a5a6', points: '20,100 70,40 120,100' },
                { type: 'ground', color: '#27ae60', height: 40 }
            ],
            items: ['🦅','☁️','☀️','🌲','🐐','⛷️','🏠','⛺','🦌','🌲','🎒','🔥','🥾','🌳']
        },
        { 
            name: 'DEEP SPACE', 
            bg: '#000000',
            layers: [
                { type: 'planet', color: '#e67e22', x: 20, y: 30, r: 60 },
                { type: 'planet', color: '#3498db', x: 80, y: 70, r: 80 }
            ],
            items: ['🚀','🛸','👨‍🚀','👾','🛰️','🌠','🌍','🪐','🌕','🔭','☄️','📡','👽','🌌']
        },
        { 
            name: 'VOID OCEAN', 
            bg: '#3498db',
            layers: [
                { type: 'water', color: '#3498db' },
                { type: 'sand', color: '#f1c40f', height: 20 }
            ],
            items: ['🐠','🐡','🐙','🦑','🦞','🦀','🐋','🐬','🐚','🪸','🔱','🌊','🫧','🚤']
        }
    ],
    level: 1,
    differencesNeeded: 10,
    differencesFound: 0,
    currentScene: null,
    lives: 3,
    
    start() {
        this.level = 1;
        this.nextLevel();
    },
    
    nextLevel() {
        this.differencesFound = 0;
        this.lives = 3;
        // Tougher scaling
        this.differencesNeeded = Math.min(8 + this.level, 15); 
        this.generateScene();
        this.render();
        document.getElementById('level-display').textContent = `Level ${this.level}`;
    },

    generateScene() {
        const sceneConfig = this.sceneries[Math.floor(Math.random() * this.sceneries.length)];
        const items = [];
        // More positions for more items (6x5 grid)
        const cols = 6; const rows = 5;
        const positions = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                positions.push({ x: (c * 15) + 10, y: (r * 18) + 10 });
            }
        }
        positions.sort(() => Math.random() - 0.5);

        // More items on screen
        const itemCount = 20 + Math.min(this.level * 2, 10);
        for (let i = 0; i < Math.min(itemCount, positions.length); i++) {
            items.push({
                emoji: sceneConfig.items[Math.floor(Math.random() * sceneConfig.items.length)],
                x: positions[i].x, y: positions[i].y,
                size: 2.2, rotation: 0, id: i
            });
        }

        const diffIndices = [];
        while (diffIndices.length < this.differencesNeeded) {
            const idx = Math.floor(Math.random() * items.length);
            if (!diffIndices.includes(idx)) diffIndices.push(idx);
        }

        const itemsB = items.map((item, idx) => {
            const newItem = { ...item };
            if (diffIndices.includes(idx)) {
                newItem.isDifferent = true;
                newItem.found = false;
                const type = Math.floor(Math.random() * 3);
                if (type === 0) {
                    // Change emoji
                    newItem.emoji = sceneConfig.items.find(e => e !== item.emoji) || '❓';
                } else if (type === 1) {
                    // Rotate
                    newItem.rotation = 180;
                } else {
                    // Small size change
                    newItem.size = 1.5;
                }
            }
            return newItem;
        });

        this.currentScene = { config: sceneConfig, itemsA: items, itemsB: itemsB };
    },
    
    render() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        const stats = document.createElement('div');
        stats.className = 'detective-stats-ui';
        stats.innerHTML = `<div class="stat-item">🔍 ${this.differencesFound}/${this.differencesNeeded}</div><div class="stat-item">${this.currentScene.config.name}</div><div class="stat-item">❤️ ${this.lives}</div>`;
        board.appendChild(stats);
        const container = document.createElement('div');
        container.className = 'detective-canvas-container clean-mode';
        container.appendChild(this.createCanvasFrame(this.currentScene.itemsA, 'A'));
        container.appendChild(this.createCanvasFrame(this.currentScene.itemsB, 'B'));
        board.appendChild(container);
        const progress = document.createElement('div');
        progress.className = 'detective-progress-dots';
        for (let i = 0; i < this.differencesNeeded; i++) {
            const dot = document.createElement('div');
            dot.className = `progress-dot ${i < this.differencesFound ? 'active' : ''}`;
            progress.appendChild(dot);
        }
        board.appendChild(progress);
    },

    createCanvasFrame(items, type) {
        const frame = document.createElement('div');
        frame.className = `detective-canvas-frame frame-${type}`;
        this.currentScene.config.layers.forEach(layer => {
            const l = document.createElement('div');
            l.className = `scene-layer layer-${layer.type}`;
            if (layer.type === 'ground' || layer.type === 'sky') {
                l.style.height = `${layer.height}%`; l.style.background = layer.color;
            } else if (layer.type === 'mountain') {
                l.style.width = '60%'; l.style.height = '100%'; l.style.background = layer.color;
                l.style.clipPath = `polygon(${layer.points})`;
                l.style.left = layer.color === '#7f8c8d' ? '0' : '40%';
            } else if (layer.type === 'planet') {
                l.style.width = `${layer.r}px`; l.style.height = `${layer.r}px`; l.style.background = layer.color;
                l.style.borderRadius = '50%'; l.style.left = `${layer.x}%`; l.style.top = `${layer.y}%`;
            }
            frame.appendChild(l);
        });
        items.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'detective-sprite';
            el.textContent = item.emoji;
            el.style.left = `${item.x}%`; el.style.top = `${item.y}%`;
            el.style.fontSize = `${item.size}rem`;
            el.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
            const isFound = this.currentScene.itemsB[idx].found;
            if (type === 'B' && item.isDifferent && !isFound) {
                el.onclick = (e) => { e.stopPropagation(); this.handleDifferenceFound(idx); };
            } else if (type === 'B' && !isFound) {
                el.onclick = (e) => { e.stopPropagation(); this.handleMiss(); };
            }
            if (isFound) {
                const marker = document.createElement('div');
                marker.className = 'diff-marker'; el.appendChild(marker);
            }
            frame.appendChild(el);
        });
        if (type === 'B') frame.onclick = () => this.handleMiss();
        return frame;
    },

    handleDifferenceFound(idx) {
        this.currentScene.itemsB[idx].found = true;
        this.differencesFound++;
        this.render();
        if (this.differencesFound === this.differencesNeeded) setTimeout(() => { this.level++; GameHub.showWin(); }, 500);
    },

    handleMiss() {
        this.lives--;
        if (this.lives <= 0) { alert("Game Over!"); this.start(); }
        else {
            this.render();
            const cont = document.querySelector('.detective-canvas-container');
            cont.classList.add('shake');
            setTimeout(() => cont.classList.remove('shake'), 500);
        }
    }
};

// Initialize the app
window.onload = () => GameHub.init();
