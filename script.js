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

// Device Compatibility
const deviceNotice = document.getElementById("deviceNotice");
let keyboardDetected = false;

function isUnsupportedDevice() {
    const isPhoneSize = window.matchMedia("(max-width: 767px)").matches;
    const isTouchOnly = window.matchMedia("(any-hover: none)").matches;
    return isPhoneSize || (isTouchOnly && !keyboardDetected);
}

function updateDeviceNotice() {
    if (!deviceNotice) return;
    const unsupported = isUnsupportedDevice();
    deviceNotice.style.display = unsupported ? "flex" : "none";
    if (unsupported) {
        canvas.style.display = "none";
        document.getElementById("ui-layer").style.display = "none";
        document.getElementById("telemetry-control").style.display = "none";
    } else {
        canvas.style.display = "block";
        document.getElementById("ui-layer").style.display = "block";
        document.getElementById("telemetry-control").style.display = "block";
    }
}

window.addEventListener("resize", () => { resizeViewport(); updateDeviceNotice(); });
window.addEventListener("orientationchange", () => { setTimeout(() => { resizeViewport(); updateDeviceNotice(); }, 120); });
if (window.visualViewport) { window.visualViewport.addEventListener("resize", () => { resizeViewport(); updateDeviceNotice(); }); }

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

const telemetryBtn = document.getElementById("telemetryBtn");
const telemetryDropdown = document.getElementById("telemetry-dropdown");
const rowSpectrometer = document.getElementById("rowSpectrometer");
const pipSpectrometer = document.getElementById("pipSpectrometer");

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
const ZOOM_THRESHOLD = 0.45; 

// Exponential Zoom Constants
const MACRO_START = 0.055; 
const MACRO_END = 0.015;

const atomicData = {
    "H":  { Z: 1,  N: 0,  core: {}, valenceGroundN: 1, levels: {1: -13.60, 2: -3.40, 3: -1.51, 4: -0.85, 5: -0.54, 6: -0.38, 7: -0.28, 8: -0.21} },
    "Na": { Z: 11, N: 12, core: {1: 2, 2: 8}, valenceGroundN: 3, levels: {3: -5.14, 4: -3.04, 5: -2.04, 6: -1.38, 7: -0.80, 8: -0.50} },
    "K":  { Z: 19, N: 20, core: {1: 2, 2: 8, 3: 8}, valenceGroundN: 4, levels: {4: -4.34, 5: -1.27, 6: -0.80, 7: -0.50, 8: -0.30} }, 
    "Ca": { Z: 20, N: 20, core: {1: 2, 2: 8, 3: 8, 4: 1}, valenceGroundN: 4, levels: {4: -6.11, 5: -4.11, 6: -2.50, 7: -1.50, 8: -1.00} }, 
    "Fe": { Z: 26, N: 30, core: {1: 2, 2: 8, 3: 14, 4: 1}, valenceGroundN: 4, levels: {4: -7.90, 5: -5.75, 6: -4.00, 7: -2.50, 8: -1.50} }, 
    "Cu": { Z: 29, N: 35, core: {1: 2, 2: 8, 3: 18}, valenceGroundN: 4, levels: {4: -7.72, 5: -5.29, 6: -3.50, 7: -2.00, 8: -1.00} },
    "Sr": { Z: 38, N: 50, core: {1: 2, 2: 8, 3: 18, 4: 8, 5: 1}, valenceGroundN: 5, levels: {5: -5.69, 6: -3.78, 7: -2.50, 8: -1.50} }, 
    "Ba": { Z: 56, N: 81, core: {1: 2, 2: 8, 3: 18, 4: 18, 5: 8, 6: 1}, valenceGroundN: 6, levels: {6: -5.21, 7: -2.87, 8: -1.80} }
};

const macroColors = {
    "H":  "rgba(255, 100, 200, 1)", 
    "Na": "rgba(255, 200, 0, 1)",
    "K":  "rgba(200, 100, 255, 1)",
    "Ca": "rgba(255, 80, 50, 1)",
    "Fe": "rgba(255, 215, 0, 1)",
    "Cu": "rgba(0, 255, 200, 1)",
    "Sr": "rgba(255, 30, 30, 1)",
    "Ba": "rgba(100, 255, 100, 1)"
};

// Application State
let activeElement = "H";
let atoms = [];
let photons = [];
let spectralLines = []; 
let isWaveMode = false;
let isHeating = false;
let showSpectrometer = true;
let telemetryOpen = true;
let globalTime = 0;

// Camera System
let cameraZoom = 1.0;
let targetZoom = 1.0;
const ATOM_SPACING = 1100;
const GRID_SIZE = 4; // Lattice Size

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08; 
    targetZoom *= factor;
    targetZoom = Math.min(Math.max(0.005, targetZoom), 1.5);
}, { passive: false });

function getRgba(colorStr, alpha) {
    if (!colorStr) return `rgba(255,255,255,${alpha})`;
    if (colorStr.startsWith("rgba")) return colorStr.replace(/[\d.]+\)$/, `${alpha})`);
    if (colorStr.startsWith("rgb")) return colorStr.replace(")", `, ${alpha})`).replace("rgb", "rgba");
    return colorStr;
}

// Logic & UI Bindings
function setHeating(val) {
    isHeating = val;
    heatModeBtn.innerText = isHeating ? "Constant Heat: ON (H)" : "Constant Heat: OFF (H)";
    heatModeBtn.style.backgroundColor = isHeating ? "#00ff7f" : "#ff3366";
    canvas.style.backgroundColor = isHeating ? "#1f0a05" : "#1a1a1a";
}

function setWaveMode(val) {
    isWaveMode = val;
    waveModeBtn.innerText = isWaveMode ? "Visual: WAVE MODE (V)" : "Visual: PARTICLE MODE (V)";
    waveModeBtn.style.backgroundColor = isWaveMode ? "#00ff7f" : "#ff9900";
}

heatModeBtn.addEventListener("click", () => setHeating(!isHeating));
waveModeBtn.addEventListener("click", () => setWaveMode(!isWaveMode));

telemetryBtn.addEventListener("click", () => {
    telemetryOpen = !telemetryOpen;
    telemetryDropdown.style.display = telemetryOpen ? "block" : "none";
    telemetryBtn.innerText = telemetryOpen ? "TELEMETRY ▼" : "TELEMETRY ▲";
});

function toggleSpectrometer() {
    showSpectrometer = !showSpectrometer;
    if (showSpectrometer) pipSpectrometer.classList.add("on");
    else pipSpectrometer.classList.remove("on");
}
rowSpectrometer.addEventListener("click", toggleSpectrometer);

function getElectronSpeed(n) {
    return (0.006 + (0.02 / n)) * (n % 2 === 0 ? 1 : -1);
}

function getOrbitRadius(atomKey, n) {
    let data = atomicData[atomKey];
    let nucleusR = data.Z + data.N === 1 ? 4 : Math.max(8, Math.pow(data.Z + data.N, 1/3) * 3.5);
    let minR = nucleusR + 15;
    let maxOrbitR = 380; 
    let spacing = (maxOrbitR - minR) / (MAX_ORBITS - 1);
    return minR + (n - 1) * spacing;
}

function getEnergy(atomKey, n) { return atomicData[atomKey].levels[n]; }

class Atom {
    constructor(elementKey, x, y) {
        this.key = elementKey;
        this.data = atomicData[elementKey];
        this.x = x;
        this.y = y;
        this.currentN = this.data.valenceGroundN;
        this.targetN = this.data.valenceGroundN;
        this.electronAngle = Math.random() * Math.PI * 2;
        this.isJumping = false;
        this.jumpProgress = 0;
        this.emissionColor = null;
        this.emissionWl = null;
        this.isTransitioning = false;

        this.coreElectrons = [];
        for (const [nStr, count] of Object.entries(this.data.core)) {
            let n = parseInt(nStr);
            let randomOffset = Math.random() * Math.PI * 2;
            for(let i=0; i<count; i++) {
                this.coreElectrons.push({ n: n, angle: (i / count) * Math.PI * 2 + randomOffset });
            }
        }

        this.nucleusParticles = [];
        const total = this.data.Z + this.data.N;
        if (total === 1) {
            this.nucleusParticles.push({ x: 0, y: 0, type: 'proton' });
        } else {
            const R = Math.max(8, Math.pow(total, 1/3) * 3.5);
            let protons = this.data.Z, neutrons = this.data.N;
            for (let i = 0; i < total; i++) {
                let r = R * Math.sqrt(Math.random());
                let theta = Math.random() * 2 * Math.PI;
                let isProton = (protons > 0 && neutrons > 0) ? (Math.random() > (neutrons / total)) : (protons > 0);
                if (isProton) protons--; else neutrons--;
                this.nucleusParticles.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), type: isProton ? 'proton' : 'neutron' });
            }
            this.nucleusParticles.sort((a, b) => a.y - b.y);
        }
    }
}

function generateGrid() {
    atoms = [];
    photons = [];
    spectralLines = [];
    for (let x = -GRID_SIZE; x <= GRID_SIZE; x++) {
        for (let y = -GRID_SIZE; y <= GRID_SIZE; y++) {
            atoms.push(new Atom(activeElement, x * ATOM_SPACING, y * ATOM_SPACING));
        }
    }
    updateCenterUI();
}

presetBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        presetBtns.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        
        activeElement = e.target.getAttribute("data-atom");
        generateGrid();
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

function updateCenterUI() {
    let centerAtom = atoms.find(a => a.x === 0 && a.y === 0);
    if (!centerAtom) return;
    currentStateTxt.innerText = `n = ${centerAtom.targetN}`;
    currentEnergyTxt.innerText = `${getEnergy(centerAtom.key, centerAtom.targetN).toFixed(2)} eV`;
}

function startJump(atom, colorToEmit, wl) {
    atom.isJumping = true;
    atom.jumpProgress = 0;
    atom.emissionColor = colorToEmit;
    atom.emissionWl = wl;
}

function initiateTransition(atom, newN) {
    if (newN === atom.currentN || atom.isTransitioning) return;
    
    atom.isTransitioning = true;
    atom.targetN = newN;
    
    const energyDiff = Math.abs(getEnergy(atom.key, newN) - getEnergy(atom.key, atom.currentN));
    const wavelength = Math.abs(HC / energyDiff);
    const exactColor = wavelengthToColor(wavelength);
    const isAbsorption = newN > atom.currentN;

    if (atom.x === 0 && atom.y === 0) {
        let actionWord = isAbsorption ? 'Absorbed' : 'Emitted';
        let visibilityNote = exactColor ? '' : ' <span style="color:#666;">(Non-visible spectrum)</span>';
        transitionInfo.innerHTML = `${actionWord} photon<br>ΔE = ${energyDiff.toFixed(2)} eV<br>λ = ${wavelength.toFixed(0)} nm${visibilityNote}`;
        transitionInfo.style.color = exactColor || '#888';
        updateCenterUI();
    }

    if (exactColor) {
        if (isAbsorption) {
            if (cameraZoom >= MACRO_START) {
                photons.push({
                    originX: atom.x, originY: atom.y,
                    targetRadius: getOrbitRadius(atom.key, atom.currentN),
                    angle: atom.electronAngle + Math.PI,
                    color: exactColor,
                    isAbsorption: true,
                    progress: 0,
                    triggerJump: true,
                    atom: atom
                });
            } else {
                startJump(atom, exactColor, wavelength);
            }
        } else {
            startJump(atom, exactColor, wavelength);
        }
    } else {
        startJump(atom, null, null);
    }
}

window.addEventListener("keydown", (e) => {
    keyboardDetected = true;
    updateDeviceNotice();

    let key = e.key.toLowerCase();
    
    if (key === 'h') { heatModeBtn.click(); return; }
    if (key === 'v') { waveModeBtn.click(); return; }
    if (key === 's') { toggleSpectrometer(); return; }

    if (e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        let requestedN = parseInt(e.key);
        atoms.forEach(atom => {
            if (!atom.isTransitioning && atomicData[atom.key].levels[requestedN] !== undefined) {
                initiateTransition(atom, requestedN);
            }
        });
    }
});

function drawSpectrometer() {
    if (!showSpectrometer) return;

    let gw = Math.min(450, canvas.width - 360); 
    if (canvas.width <= 768) gw = Math.min(450, canvas.width - 40);
    
    let gh = 95;
    let gx = canvas.width - gw - 20; 
    let gy = 20; 

    ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#ddd";
    ctx.fillText("LIVE SPECTROMETER (380-780nm)", gx + 8, gy + 14);
    
    ctx.textAlign = "right";
    ctx.fillStyle = "#ff3366";
    ctx.fillText(activeElement.toUpperCase(), gx + gw - 8, gy + 14);

    let boxX = gx + 10;
    let boxY = gy + 24;
    let boxW = gw - 20;
    let boxH = gh - 40;

    let grad = ctx.createLinearGradient(boxX, 0, boxX + boxW, 0);
    let gradHasStops = false;
    for (let i = 0; i <= 1.001; i += 0.05) {
        let val = Math.min(i, 1.0);
        let wl = 380 + val * (780 - 380);
        let c = wavelengthToColor(wl);
        if (c) {
            grad.addColorStop(val, c);
            gradHasStops = true;
        }
    }
    
    if (gradHasStops) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = grad;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.globalAlpha = 1.0;
    }
    
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#666";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    for(let w=400; w<=700; w+=100) {
        let lx = boxX + ((w - 380)/400) * boxW;
        ctx.fillText(w + "nm", lx, boxY + boxH + 12);
        ctx.beginPath(); ctx.moveTo(lx, boxY+boxH); ctx.lineTo(lx, boxY+boxH-3); ctx.stroke();
    }

    let sortedLines = [...spectralLines].sort((a, b) => a.wl - b.wl);
    let textZones = [];

    sortedLines.forEach(line => {
        let normalized = (line.wl - 380) / 400;
        if (normalized < 0 || normalized > 1) return; 
        
        let lineX = boxX + normalized * boxW;
        
        ctx.beginPath();
        ctx.moveTo(lineX, boxY);
        ctx.lineTo(lineX, boxY + boxH);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12; 
        ctx.shadowColor = line.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        for (let i = 0; i < 15; i++) {
            let yLvl = boxY + 10 + i * 10;
            if (yLvl > boxY + boxH - 5) break; 
            
            let conflict = textZones.some(z => z.y === yLvl && Math.abs(z.x - lineX) < 24);
            if (!conflict) {
                ctx.fillStyle = "#fff";
                ctx.font = "9px monospace";
                ctx.fillText(Math.round(line.wl), lineX, yLvl);
                textZones.push({x: lineX, y: yLvl});
                break;
            }
        }
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    cameraZoom += (targetZoom - cameraZoom) * 0.12; 
    globalTime += 0.05;
    
    let zf = 1 / cameraZoom; 
    let isZoomedIn = cameraZoom >= ZOOM_THRESHOLD;
    
    let macroAlpha = 0;
    if (cameraZoom < MACRO_START) {
        macroAlpha = Math.max(0, Math.min(1, (MACRO_START - cameraZoom) / (MACRO_START - MACRO_END)));
    }
    let atomAlpha = 1 - macroAlpha;

    let activeEmissionColor = null;

    atoms.forEach(atom => {
        if (isHeating && !atom.isTransitioning && !atom.isJumping) {
            if (Math.random() < 0.03) { 
                let data = atomicData[atom.key];
                let possibleTargets = [];
                for (let nStr in data.levels) {
                    let n = parseInt(nStr);
                    if (n !== atom.currentN) possibleTargets.push(n);
                }
                if (possibleTargets.length > 0) {
                    let randomTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                    initiateTransition(atom, randomTarget);
                }
            }
        }

        if (atom.isJumping) {
            atom.jumpProgress += 0.02; 
            
            // Capture specific photon emission color during jump
            if (atom.emissionColor && atom.targetN < atom.currentN) {
                activeEmissionColor = atom.emissionColor;
            }

            if (atom.jumpProgress >= 1) {
                atom.jumpProgress = 1;
                atom.isJumping = false;
                atom.currentN = atom.targetN;
                atom.isTransitioning = false; 
                
                if (atom.emissionColor) {
                    if (cameraZoom >= MACRO_START) {
                        photons.push({
                            originX: atom.x, originY: atom.y,
                            angle: atom.electronAngle,
                            color: atom.emissionColor,
                            isAbsorption: false,
                            progress: 0,
                            atom: atom
                        });
                    }
                    if (!spectralLines.some(l => Math.abs(l.wl - atom.emissionWl) < 1)) {
                        spectralLines.push({ wl: atom.emissionWl, color: atom.emissionColor });
                    }
                    atom.emissionColor = null;
                    atom.emissionWl = null;
                }
            }
        }

        if (!isWaveMode) {
            let currentSpeed = getElectronSpeed(atom.currentN);
            if (atom.isJumping) {
                let ease = 0.5 - Math.cos(atom.jumpProgress * Math.PI) / 2;
                let targetSpeed = getElectronSpeed(atom.targetN);
                currentSpeed = currentSpeed * (1 - ease) + targetSpeed * ease;
            }
            atom.electronAngle += currentSpeed;
            atom.coreElectrons.forEach(e => { e.angle += getElectronSpeed(e.n); });
        }
    });

    // PUSH MASTER TRANSFORM
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(cameraZoom, cameraZoom);

    // MACROSCOPIC LATTICE RENDERER
    if (macroAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = macroAlpha;
        let blockSize = (GRID_SIZE * 2 + 1) * ATOM_SPACING; 

        let isSolid = (activeElement !== "H");
        
        // Contextual rule: Follows photon color ONLY if constant heat is OFF
        let activeGlowColor = macroColors[activeElement];
        if (isSolid && activeEmissionColor && !isHeating) {
            activeGlowColor = activeEmissionColor; 
        }
        
        let shouldGlow = isHeating || (isSolid && activeEmissionColor && !isHeating);
        
        if (shouldGlow) {
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            let glowRad = blockSize * 1.2; 
            let grad = ctx.createRadialGradient(0, 0, blockSize * 0.1, 0, 0, glowRad);
            
            grad.addColorStop(0, getRgba(activeGlowColor, isHeating ? 0.6 : 0.8));
            grad.addColorStop(0.3, getRgba(activeGlowColor, isHeating ? 0.3 : 0.4));
            grad.addColorStop(1, getRgba(activeGlowColor, 0));
            
            ctx.beginPath();
            ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            if (!isHeating) ctx.fill(); // Minor boost only during the short flash
            ctx.restore();
        }
        
        if (!isSolid) {
            ctx.beginPath();
            ctx.arc(0, 0, blockSize/2, 0, Math.PI*2);
            ctx.fillStyle = isHeating ? getRgba(macroColors["H"], 0.25) : "rgba(80, 80, 100, 0.15)";
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.rect(-blockSize/2, -blockSize/2, blockSize, blockSize);
            ctx.fillStyle = isHeating ? "rgba(35, 30, 20, 1)" : "#222";
            ctx.fill();
            
            let strokeColor = shouldGlow ? activeGlowColor : "#444";
            
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 18; 
            ctx.stroke();

            if (shouldGlow) {
                ctx.save();
                // Safely bounded shadow blur prevents crash
                ctx.shadowBlur = Math.min(60, 35 / cameraZoom); 
                ctx.shadowColor = activeGlowColor;
                ctx.stroke();
                ctx.restore();
            }
        }
        ctx.restore();
    }

    // QUANTUM ATOM RENDERER
    if (atomAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = atomAlpha;
        
        atoms.forEach(atom => {
            let isCenter = (atom.x === 0 && atom.y === 0);
            if (isZoomedIn && !isCenter) return; 

            for (let n = 1; n <= MAX_ORBITS; n++) {
                let r = getOrbitRadius(atom.key, n);
                ctx.beginPath();
                ctx.arc(atom.x, atom.y, r, 0, Math.PI * 2);
                
                if (n === atom.targetN && atom.currentN !== atom.targetN) {
                    ctx.strokeStyle = "rgba(0, 255, 127, 0.8)";
                    ctx.lineWidth = 3 * Math.pow(zf, 0.4);
                    ctx.setLineDash([5 * zf, 5 * zf]);
                } else if (n === atom.currentN && !isWaveMode) {
                    ctx.strokeStyle = "rgba(0, 229, 255, 0.7)";
                    ctx.lineWidth = 3 * Math.pow(zf, 0.4);
                    ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = "rgba(160, 160, 160, 0.4)"; 
                    ctx.lineWidth = 1.5 * Math.pow(zf, 0.4);
                    ctx.setLineDash([4 * zf, 6 * zf]);
                }
                ctx.stroke();
                ctx.setLineDash([]); 
            }

            let ease = 0;
            if (atom.isJumping) {
                ease = 0.5 - Math.cos(atom.jumpProgress * Math.PI) / 2;
            }

            if (isWaveMode) {
                let shellPopulation = {};
                atom.coreElectrons.forEach(e => shellPopulation[e.n] = (shellPopulation[e.n] || 0) + 1);
                if (!atom.isJumping) shellPopulation[atom.currentN] = (shellPopulation[atom.currentN] || 0) + 1;

                ctx.globalCompositeOperation = "screen";

                for (let nStr in shellPopulation) {
                    let n = parseInt(nStr);
                    let count = shellPopulation[n];
                    let baseR = getOrbitRadius(atom.key, n);
                    let amp = (3 + Math.min(count, 8) * 0.4) * Math.pow(zf, 0.75); 
                    
                    ctx.beginPath();
                    for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.05) {
                        let r = baseR + amp * Math.sin(n * theta) * Math.cos(globalTime * 3);
                        let px = atom.x + Math.cos(theta) * r;
                        let py = atom.y + Math.sin(theta) * r;
                        if (theta === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = (n === atom.currentN && !atom.isJumping) ? "rgba(0, 229, 255, 1)" : "rgba(0, 180, 255, 0.8)";
                    ctx.lineWidth = (2.2 + count * 0.25) * Math.pow(zf, 0.6);
                    ctx.shadowBlur = Math.min(50, 15 * Math.pow(zf, 0.5));
                    ctx.shadowColor = ctx.strokeStyle;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }

                if (atom.isJumping) {
                    let rBaseCurrent = getOrbitRadius(atom.key, atom.currentN);
                    let rBaseTarget = getOrbitRadius(atom.key, atom.targetN);
                    let rBaseInterp = rBaseCurrent * (1 - ease) + rBaseTarget * ease;
                    let amp = 3.4 * Math.pow(zf, 0.75);
                    
                    ctx.beginPath();
                    for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.05) {
                        let waveCurrent = amp * Math.sin(atom.currentN * theta) * Math.cos(globalTime * 3);
                        let waveTarget = amp * Math.sin(atom.targetN * theta) * Math.cos(globalTime * 3);
                        let r = rBaseInterp + (1 - ease) * waveCurrent + ease * waveTarget;
                        let px = atom.x + Math.cos(theta) * r;
                        let py = atom.y + Math.sin(theta) * r;
                        if (theta === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = "rgba(0, 255, 127, 1)"; 
                    ctx.lineWidth = 2.4 * Math.pow(zf, 0.6);
                    ctx.shadowBlur = Math.min(50, 25 * Math.pow(zf, 0.5));
                    ctx.shadowColor = ctx.strokeStyle;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
                ctx.globalCompositeOperation = "source-over";

            } else {
                let currentRadius = getOrbitRadius(atom.key, atom.currentN);
                if (atom.isJumping) {
                    currentRadius = getOrbitRadius(atom.key, atom.currentN) + (getOrbitRadius(atom.key, atom.targetN) - getOrbitRadius(atom.key, atom.currentN)) * ease;
                }
                const eX = atom.x + Math.cos(atom.electronAngle) * currentRadius;
                const eY = atom.y + Math.sin(atom.electronAngle) * currentRadius;

                atom.coreElectrons.forEach(e => {
                    let r = getOrbitRadius(atom.key, e.n);
                    ctx.beginPath();
                    ctx.arc(atom.x + Math.cos(e.angle) * r, atom.y + Math.sin(e.angle) * r, 3 * Math.pow(zf, 0.6), 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(0, 180, 255, 0.85)"; 
                    ctx.fill();
                });

                ctx.globalCompositeOperation = "screen";
                ctx.beginPath();
                ctx.arc(eX, eY, 5 * Math.pow(zf, 0.6), 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 229, 255, 1)";
                ctx.shadowBlur = Math.min(50, 35 * zf);
                ctx.shadowColor = '#00e5ff';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "source-over";
            }

            atom.nucleusParticles.forEach(p => {
                ctx.beginPath();
                ctx.arc(atom.x + p.x, atom.y + p.y, 2.5 * Math.pow(zf, 0.6), 0, Math.PI * 2);
                ctx.fillStyle = p.type === 'proton' ? "rgba(255, 51, 102, 1)" : "rgba(120, 130, 142, 1)";
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(atom.x + p.x - 0.8*zf, atom.y + p.y - 0.8*zf, 0.8 * Math.pow(zf, 0.6), 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.fill();
            });
        });
        ctx.restore();
    }

    // CRITICAL: POP MASTER TRANSFORM BEFORE ABSOLUTE PHOTONS 
    ctx.restore(); 

    ctx.globalAlpha = 1.0; 
    ctx.globalCompositeOperation = 'screen'; 

    for (let i = photons.length - 1; i >= 0; i--) {
        let p = photons[i];
        p.progress += 0.018; 
        
        if (p.isAbsorption && p.progress >= 1.0) {
            if (p.triggerJump) startJump(p.atom, null, null);
            photons.splice(i, 1);
            continue;
        }
        if (!p.isAbsorption && p.progress >= 2.5) {
            photons.splice(i, 1);
            continue;
        }

        let isCenter = (p.atom.x === 0 && p.atom.y === 0);
        if (isZoomedIn && !isCenter) continue;
        if (cameraZoom < MACRO_START) continue; 

        if (isWaveMode && !p.isAbsorption) {
            let maxR = 1500;
            let r = getOrbitRadius(p.atom.key, p.atom.targetN) + (p.progress / 2.5) * maxR;
            
            // Reapply camera zoom on explicitly popped absolute paths
            let px = cx + p.originX * cameraZoom;
            let py = cy + p.originY * cameraZoom;
            r = r * cameraZoom;

            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1.5, 20 * (1 - p.progress / 2.5)) * Math.pow(zf, 0.8) * cameraZoom; 
            
            ctx.globalAlpha = Math.max(0, 1 - p.progress / 2.5);
            ctx.shadowBlur = Math.min(50, 35 * zf);
            ctx.shadowColor = p.color;
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        } else {
            let rHead = p.isAbsorption
                ? 1800 * (1 - p.progress) + p.targetRadius * p.progress
                : getOrbitRadius(p.atom.key, p.atom.targetN) + p.progress * 600;
            
            let localTailProg = Math.max(0, p.progress - 0.15); 
            let rTail = p.isAbsorption
                ? 1800 * (1 - localTailProg) + p.targetRadius * localTailProg
                : getOrbitRadius(p.atom.key, p.atom.targetN) + localTailProg * 600;

            // Adjust to scaled absolute coordinates
            let headX = cx + (p.originX + Math.cos(p.angle) * rHead) * cameraZoom;
            let headY = cy + (p.originY + Math.sin(p.angle) * rHead) * cameraZoom;
            let tailX = cx + (p.originX + Math.cos(p.angle) * rTail) * cameraZoom;
            let tailY = cy + (p.originY + Math.sin(p.angle) * rTail) * cameraZoom;

            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 6 * Math.pow(zf, 0.6) * cameraZoom;
            ctx.lineCap = "round";
            ctx.shadowBlur = Math.min(50, 35 * zf);
            ctx.shadowColor = p.color;
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(headX, headY);
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (headX !== undefined) {
                ctx.beginPath();
                ctx.arc(headX, headY, 6 * Math.pow(zf, 0.6) * cameraZoom, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.shadowBlur = Math.min(50, 40 * zf);
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
    ctx.globalCompositeOperation = 'source-over';
    
    drawSpectrometer();
    requestAnimationFrame(animate);
}

// Initial Boot Sequence
updateDeviceNotice();
generateGrid();
animate();