const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Responsive Canvas & Layout Setup
let cx, cy;
function resizeViewport() {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    document.documentElement.style.setProperty("--app-height", `${viewportHeight}px`);
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    cy = canvas.height / 2; 
    
    if (canvas.width > 768) cx = (canvas.width + 320) / 2;
    else cx = canvas.width / 2;
}
window.addEventListener("resize", resizeViewport);
if (window.visualViewport) window.visualViewport.addEventListener("resize", resizeViewport);
resizeViewport();

// UI Elements & Handlers
const panelHeader = document.getElementById("panelHeader");
const uiLayer = document.getElementById("ui-layer");

const tabLevelsBtn = document.getElementById("tabLevelsBtn");
const tabControlsBtn = document.getElementById("tabControlsBtn");
const tabGuideBtn = document.getElementById("tabGuideBtn");
const pageLevels = document.getElementById("pageLevels");
const pageControls = document.getElementById("pageControls");
const pageGuide = document.getElementById("pageGuide");

const currentStateTxt = document.getElementById("currentStateTxt");
const currentEnergyTxt = document.getElementById("currentEnergyTxt");
const transitionInfo = document.getElementById("transitionInfo");
const presetBtns = document.querySelectorAll(".preset-btn");
const waveModeBtn = document.getElementById("waveModeBtn");
const heatModeBtn = document.getElementById("heatModeBtn");

panelHeader.addEventListener("click", () => uiLayer.classList.toggle("collapsed"));

function switchTab(activeId) {
    tabLevelsBtn.classList.toggle("active", activeId === "tabLevelsBtn");
    tabControlsBtn.classList.toggle("active", activeId === "tabControlsBtn");
    tabGuideBtn.classList.toggle("active", activeId === "tabGuideBtn");
    
    pageLevels.style.display = activeId === "tabLevelsBtn" ? "block" : "none";
    pageControls.style.display = activeId === "tabControlsBtn" ? "block" : "none";
    pageGuide.style.display = activeId === "tabGuideBtn" ? "block" : "none";
}

tabLevelsBtn.addEventListener("click", () => switchTab("tabLevelsBtn"));
tabControlsBtn.addEventListener("click", () => switchTab("tabControlsBtn"));
tabGuideBtn.addEventListener("click", () => switchTab("tabGuideBtn"));

// Unified Atom Physics Constants
const MAX_ORBITS = 8;
const HC = 1240; 

// Atomic Data explicitly mapped to Absolute Principal Quantum Numbers (n)
// Iron (Fe), Potassium (K), and Calcium (Ca) are calculated to produce their characteristic flame colors
const atomicData = {
    "H":  { Z: 1,  N: 0,  core: {}, valenceGroundN: 1, 
            levels: {1: -13.60, 2: -3.40, 3: -1.51, 4: -0.85, 5: -0.54, 6: -0.38, 7: -0.28, 8: -0.21} },
            
    "Na": { Z: 11, N: 12, core: {1: 2, 2: 8}, valenceGroundN: 3, 
            levels: {3: -5.14, 4: -3.04, 5: -2.04, 6: -1.38, 7: -0.80, 8: -0.50} }, // 589nm (Yellow)
            
    "K":  { Z: 19, N: 20, core: {1: 2, 2: 8, 3: 8}, valenceGroundN: 4, 
            levels: {4: -4.34, 5: -1.27, 6: -0.80, 7: -0.50, 8: -0.30} }, // 404nm (Lilac/Pale Violet)
            
    "Ca": { Z: 20, N: 20, core: {1: 2, 2: 8, 3: 8, 4: 1}, valenceGroundN: 4, 
            levels: {4: -6.11, 5: -4.11, 6: -2.50, 7: -1.50, 8: -1.00} }, // 620nm (Brick Red)
            
    "Fe": { Z: 26, N: 30, core: {1: 2, 2: 8, 3: 14, 4: 1}, valenceGroundN: 4, 
            levels: {4: -7.90, 5: -5.75, 6: -4.00, 7: -2.50, 8: -1.50} }, // 575nm (Gold/Yellow Sparks)
            
    "Cu": { Z: 29, N: 35, core: {1: 2, 2: 8, 3: 18}, valenceGroundN: 4, 
            levels: {4: -7.72, 5: -5.29, 6: -3.50, 7: -2.00, 8: -1.00} }, // 510nm (Cyan/Green)
            
    "Sr": { Z: 38, N: 50, core: {1: 2, 2: 8, 3: 18, 4: 8, 5: 1}, valenceGroundN: 5, 
            levels: {5: -5.69, 6: -3.78, 7: -2.50, 8: -1.50} }, // 649nm (Red)
            
    "Ba": { Z: 56, N: 81, core: {1: 2, 2: 8, 3: 18, 4: 18, 5: 8, 6: 1}, valenceGroundN: 6, 
            levels: {6: -5.21, 7: -2.87, 8: -1.80} } // 530nm (Apple Green)
};

let currentAtom = "H";
let currentN = 1;
let targetN = 1;
let electronAngle = 0;
let photons = [];
let nucleusParticles = [];
let coreElectrons = [];

// App State
let isTransitioning = false; 
let isJumping = false;
let jumpProgress = 0;
let emissionColor = null;
let isWaveMode = false;
let isHeating = false;
let globalTime = 0;

// Toggles
waveModeBtn.addEventListener("click", () => {
    isWaveMode = !isWaveMode;
    waveModeBtn.innerText = isWaveMode ? "Visual: WAVE MODE" : "Visual: PARTICLE MODE";
    waveModeBtn.style.backgroundColor = isWaveMode ? "#00ff7f" : "#ff9900";
});

heatModeBtn.addEventListener("click", () => {
    isHeating = !isHeating;
    heatModeBtn.innerText = isHeating ? "Constant Heat: ON" : "Constant Heat: OFF";
    heatModeBtn.style.backgroundColor = isHeating ? "#00ff7f" : "#ff3366";
    canvas.style.backgroundColor = isHeating ? "#3a1100" : "#1a1a1a"; 
});

function getElectronSpeed(n) {
    return (0.006 + (0.02 / n)) * (n % 2 === 0 ? 1 : -1);
}

function getOrbitRadius(n) {
    let maxRadius = (canvas.width > 768) 
        ? Math.min(Math.min(cx - 320, canvas.width - cx), canvas.height / 2) - 30 
        : Math.min(canvas.width / 2, canvas.height / 2) - 30;
    
    let data = atomicData[currentAtom];
    let nucleusR = data.Z + data.N === 1 ? 4 : Math.max(8, Math.pow(data.Z + data.N, 1/3) * 3.5);
    let minR = nucleusR + 15;
    let spacing = (maxRadius - minR) / (MAX_ORBITS - 1);
    
    return minR + (n - 1) * spacing;
}

function getEnergy(n) { return atomicData[currentAtom].levels[n]; }

function generateNucleus(Z, N) {
    nucleusParticles = [];
    const total = Z + N;
    if (total === 1) {
        nucleusParticles.push({ x: 0, y: 0, type: 'proton' });
        return;
    }
    const R = Math.max(8, Math.pow(total, 1/3) * 3.5); 
    let protons = Z, neutrons = N;
    for (let i = 0; i < total; i++) {
        let r = R * Math.sqrt(Math.random());
        let theta = Math.random() * 2 * Math.PI;
        let isProton = (protons > 0 && neutrons > 0) ? (Math.random() > (neutrons / total)) : (protons > 0);
        if (isProton) protons--; else neutrons--;
        nucleusParticles.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), type: isProton ? 'proton' : 'neutron' });
    }
    nucleusParticles.sort((a, b) => a.y - b.y); 
}

function generateCoreElectrons(coreDict) {
    coreElectrons = [];
    for (const [nStr, count] of Object.entries(coreDict)) {
        let n = parseInt(nStr);
        let randomOffset = Math.random() * Math.PI * 2; 
        for(let i=0; i<count; i++) {
            coreElectrons.push({ n: n, angle: (i / count) * Math.PI * 2 + randomOffset });
        }
    }
}

function initAtom(atomKey) {
    currentAtom = atomKey;
    let data = atomicData[currentAtom];
    
    currentN = data.valenceGroundN;
    targetN = data.valenceGroundN;
    electronAngle = 0;
    photons = [];
    isTransitioning = false;
    isJumping = false;
    
    isHeating = false;
    heatModeBtn.innerText = "Constant Heat: OFF";
    heatModeBtn.style.backgroundColor = "#ff3366";
    canvas.style.backgroundColor = "#1a1a1a";

    generateNucleus(data.Z, data.N);
    generateCoreElectrons(data.core);
    
    transitionInfo.innerHTML = "Press ↑ or ↓ to initiate a transition.";
    transitionInfo.style.color = "#00e5ff";
    updateUI();
}

presetBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        if (isTransitioning || isJumping) return; 
        presetBtns.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        initAtom(e.target.getAttribute("data-atom"));
    });
});

function wavelengthToColor(wl) {
    if (wl < 380 || wl > 780) return null; 
    const x = 1.056 * Math.exp(-0.5 * Math.pow((wl - 599.8) / 43.2, 2)) + 0.362 * Math.exp(-0.5 * Math.pow((wl - 442.0) / 16.2, 2)) - 0.065 * Math.exp(-0.5 * Math.pow((wl - 501.1) / 20.4, 2));
    const y = 0.821 * Math.exp(-0.5 * Math.pow((wl - 568.8) / 46.9, 2)) + 0.286 * Math.exp(-0.5 * Math.pow((wl - 530.9) / 16.3, 2));
    const z = 1.217 * Math.exp(-0.5 * Math.pow((wl - 437.0) / 11.8, 2)) + 0.681 * Math.exp(-0.5 * Math.pow((wl - 459.0) / 26.0, 2));

    let r =  3.2406 * x - 1.5372 * y - 0.4986 * z;
    let g = -0.9689 * x + 1.8758 * y + 0.0415 * z;
    let b =  0.0557 * x - 0.2040 * y + 1.0570 * z;

    const maxRGB = Math.max(r, g, b, 0.001);
    r = Math.max(0, r / maxRGB); g = Math.max(0, g / maxRGB); b = Math.max(0, b / maxRGB);

    let factor = 1.0;
    if (wl >= 380 && wl < 420) factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
    else if (wl >= 700 && wl <= 780) factor = 0.3 + 0.7 * (780 - wl) / (780 - 700);

    const adjust = (color) => Math.round(Math.pow(color * factor, 0.8) * 255);
    return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`;
}

function updateUI() {
    currentStateTxt.innerText = `n = ${targetN}`;
    currentEnergyTxt.innerText = `${getEnergy(targetN).toFixed(2)} eV`;
}

function startJump(colorToEmit) {
    isJumping = true;
    jumpProgress = 0;
    emissionColor = colorToEmit;
}

function initiateTransition(newN) {
    if (newN === currentN || isTransitioning) return;
    
    isTransitioning = true;
    targetN = newN;
    
    const energyDiff = Math.abs(getEnergy(newN) - getEnergy(currentN));
    const wavelength = Math.abs(HC / energyDiff);
    const exactColor = wavelengthToColor(wavelength);
    const isAbsorption = newN > currentN;

    let actionWord = isAbsorption ? 'Absorbed' : 'Emitted';
    let visibilityNote = exactColor ? '' : ' <span style="color:#666;">(Non-visible spectrum)</span>';
    
    transitionInfo.innerHTML = `${actionWord} photon<br>ΔE = ${energyDiff.toFixed(2)} eV<br>λ = ${wavelength.toFixed(0)} nm${visibilityNote}`;
    transitionInfo.style.color = exactColor || '#888';

    if (exactColor) {
        if (isAbsorption) {
            photons.push({ targetRadius: getOrbitRadius(currentN), angle: electronAngle + Math.PI, color: exactColor, isAbsorption: true, progress: 0, triggerJump: true });
        } else {
            startJump(exactColor);
        }
    } else {
        startJump(null);
    }
    updateUI();
}

// Keyboard Shortcuts and Controls
window.addEventListener("keydown", (e) => {
    let key = e.key.toLowerCase();
    
    if (key === 'h') {
        heatModeBtn.click();
        return;
    }
    if (key === 'v') {
        waveModeBtn.click();
        return;
    }

    if (isTransitioning) return; 

    if (e.key === "ArrowUp") {
        e.preventDefault();
        let data = atomicData[currentAtom];
        if (targetN < MAX_ORBITS && data.levels[targetN + 1] !== undefined) initiateTransition(targetN + 1);
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        let data = atomicData[currentAtom];
        if (targetN > data.valenceGroundN) initiateTransition(targetN - 1);
    }
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    globalTime += 0.05;

    // Constant Heat System
    if (isHeating && !isTransitioning && !isJumping) {
        if (Math.random() < 0.04) {
            let data = atomicData[currentAtom];
            if (currentN === data.valenceGroundN) {
                let possibleTargets = [];
                for (let n = currentN + 1; n <= MAX_ORBITS; n++) {
                    if (data.levels[n] !== undefined) possibleTargets.push(n);
                }
                if (possibleTargets.length > 0) {
                    let randomTarget = (Math.random() < 0.75) ? possibleTargets[0] : possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                    initiateTransition(randomTarget);
                }
            } else {
                initiateTransition(data.valenceGroundN);
            }
        }
    }

    // Draw Unified Energy Levels
    for (let n = 1; n <= MAX_ORBITS; n++) {
        let r = getOrbitRadius(n);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        
        if (n === targetN && currentN !== targetN) {
            ctx.strokeStyle = 'rgba(0, 255, 127, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
        } else if (n === currentN && !isWaveMode) {
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = 'rgba(160, 160, 160, 0.4)'; 
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]);
        }
        ctx.stroke();
        ctx.setLineDash([]); 
    }

    // Global Ease interpolation for jumping state
    let ease = 0;
    if (isJumping) {
        jumpProgress += 0.02; 
        if (jumpProgress >= 1) {
            jumpProgress = 1;
            isJumping = false;
            currentN = targetN;
            isTransitioning = false; 
            
            if (emissionColor) {
                photons.push({ angle: electronAngle, color: emissionColor, isAbsorption: false, progress: 0 });
                emissionColor = null;
            }
        }
        ease = 0.5 - Math.cos(jumpProgress * Math.PI) / 2;
    }

    if (isWaveMode) {
        // --- TRUE DE BROGLIE STANDING WAVE RENDERER ---
        
        let shellPopulation = {};
        coreElectrons.forEach(e => shellPopulation[e.n] = (shellPopulation[e.n] || 0) + 1);
        if (!isJumping) shellPopulation[currentN] = (shellPopulation[currentN] || 0) + 1;

        for (let nStr in shellPopulation) {
            let n = parseInt(nStr);
            let count = shellPopulation[n];
            let baseR = getOrbitRadius(n);
            let amp = 3 + Math.min(count, 8) * 0.4; 
            
            ctx.beginPath();
            for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.05) {
                let r = baseR + amp * Math.sin(n * theta) * Math.cos(globalTime * 3);
                let px = cx + Math.cos(theta) * r;
                let py = cy + Math.sin(theta) * r;
                if (theta === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = (n === currentN && !isJumping) ? 'rgba(0, 229, 255, 0.9)' : 'rgba(0, 180, 255, 0.5)';
            ctx.lineWidth = 1.5 + count * 0.2;
            ctx.stroke();
        }

        // Quantum Superposition (Morphing) during jump
        if (isJumping) {
            let rBaseCurrent = getOrbitRadius(currentN);
            let rBaseTarget = getOrbitRadius(targetN);
            let rBaseInterp = rBaseCurrent * (1 - ease) + rBaseTarget * ease;
            
            let amp = 3.4;
            
            ctx.beginPath();
            for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.05) {
                let waveCurrent = amp * Math.sin(currentN * theta) * Math.cos(globalTime * 3);
                let waveTarget = amp * Math.sin(targetN * theta) * Math.cos(globalTime * 3);
                
                let r = rBaseInterp + (1 - ease) * waveCurrent + ease * waveTarget;
                
                let px = cx + Math.cos(theta) * r;
                let py = cy + Math.sin(theta) * r;
                
                if (theta === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(0, 255, 127, 0.9)'; 
            ctx.lineWidth = 1.7;
            ctx.stroke();
        }

    } else {
        // --- CLASSICAL PARTICLE RENDERER ---
        
        let currentSpeed = getElectronSpeed(currentN);
        let currentRadius = getOrbitRadius(currentN);
        
        if (isJumping) {
            let targetSpeed = getElectronSpeed(targetN);
            currentSpeed = currentSpeed * (1 - ease) + targetSpeed * ease; 
            currentRadius = getOrbitRadius(currentN) + (getOrbitRadius(targetN) - getOrbitRadius(currentN)) * ease;
        }
        
        electronAngle += currentSpeed;
        const eX = cx + Math.cos(electronAngle) * currentRadius;
        const eY = cy + Math.sin(electronAngle) * currentRadius;

        coreElectrons.forEach(e => {
            e.angle += getElectronSpeed(e.n);
            let r = getOrbitRadius(e.n);
            const ex = cx + Math.cos(e.angle) * r;
            const ey = cy + Math.sin(e.angle) * r;
            
            ctx.beginPath();
            ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 180, 255, 0.6)'; 
            ctx.fill();
        });

        // Draw Jumping Valence Electron
        ctx.beginPath();
        ctx.arc(eX, eY, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00e5ff';
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Draw Nucleus Particles 
    nucleusParticles.forEach(p => {
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.type === 'proton' ? '#ff3366' : '#78828e';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(cx + p.x - 0.8, cy + p.y - 0.8, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    });

    // Handle Photons
    for (let i = photons.length - 1; i >= 0; i--) {
        let p = photons[i];
        p.progress += 0.018; 
        
        if (p.isAbsorption && p.progress >= 1.0) {
            if (p.triggerJump) startJump(null);
            photons.splice(i, 1);
            continue;
        }
        if (!p.isAbsorption && p.progress >= 2.5) {
            photons.splice(i, 1);
            continue;
        }

        let headX, headY;
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;

        for (let w = 0; w <= 30; w++) {
            let localProg = p.progress - (w * 0.006); 
            if (localProg < 0) continue;

            let r = p.isAbsorption
                ? Math.max(canvas.width, canvas.height) * 0.8 * (1 - localProg) + p.targetRadius * localProg
                : getOrbitRadius(targetN) + localProg * 600;

            let waveOffset = Math.sin(localProg * 120) * 16;
            let px = cx + Math.cos(p.angle) * r - Math.sin(p.angle) * waveOffset;
            let py = cy + Math.sin(p.angle) * r + Math.cos(p.angle) * waveOffset;

            if (w === 0) {
                headX = px;
                headY = py;
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (headX !== undefined) {
            ctx.beginPath();
            ctx.arc(headX, headY, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 20;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    requestAnimationFrame(animate);
}

// Start Up
initAtom("H");
animate();