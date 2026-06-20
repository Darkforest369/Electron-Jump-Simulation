let specNeedsRender = true;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let cx, cy;
function resizeViewport() {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    cx = canvas.width / 2;
    cy = canvas.height / 2;
    specNeedsRender = true;
}
window.addEventListener("resize", resizeViewport);
if (window.visualViewport) window.visualViewport.addEventListener("resize", resizeViewport);
resizeViewport();

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

window.addEventListener("resize", updateDeviceNotice);
window.addEventListener("orientationchange", () => setTimeout(updateDeviceNotice, 120));

const panelHeader = document.getElementById("panelHeader");
const uiLayer = document.getElementById("ui-layer");
const toggleIcon = document.getElementById("toggleIcon");

const tabLevelsBtn = document.getElementById("tabLevelsBtn");
const tabControlsBtn = document.getElementById("tabControlsBtn");
const tabGuideBtn = document.getElementById("tabGuideBtn");
const pageLevels = document.getElementById("pageLevels");
const pageControls = document.getElementById("pageControls");
const pageGuide = document.getElementById("pageGuide");

const currentStateTxt = document.getElementById("currentStateTxt");
const currentEnergyTxt = document.getElementById("currentEnergyTxt");
const transitionInfo = document.getElementById("transitionInfo");

const elementBtns = document.querySelectorAll("#elementGrid .preset-btn");
const alloyBtns = document.querySelectorAll("#alloyGrid .preset-btn");

const waveModeBtn = document.getElementById("waveModeBtn");
const tempSlider = document.getElementById("tempSlider");
const tempDisplay = document.getElementById("tempDisplay");

const telemetryBtn = document.getElementById("telemetryBtn");
const telemetryDropdown = document.getElementById("telemetry-dropdown");
const rowSpectrometer = document.getElementById("rowSpectrometer");
const pipSpectrometer = document.getElementById("pipSpectrometer");

// Laser UI Links
const laserControlGroup = document.getElementById("laserControlGroup");
const toggleLaserBtn = document.getElementById("toggleLaserBtn");
const laserSettings = document.getElementById("laserSettings");
const laserWavelengthInput = document.getElementById("laserWavelengthInput");
const fireLaserBtn = document.getElementById("fireLaserBtn");

// Alloy UI Links
const alloyModeBtn = document.getElementById("alloyModeBtn");
const elementGrid = document.getElementById("elementGrid");
const alloyGrid = document.getElementById("alloyGrid");

panelHeader.addEventListener("click", () => {
    uiLayer.classList.toggle("collapsed");
    const isCollapsed = uiLayer.classList.contains("collapsed");
    if (isCollapsed) {
        uiLayer.style.maxHeight = "43px";
        if (toggleIcon) toggleIcon.innerText = "▼";
    } else {
        uiLayer.style.maxHeight = "calc(100vh - 40px)";
        if (toggleIcon) toggleIcon.innerText = "▲";
    }
});

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

const MAX_ORBITS = 8;
const HC = 1240;
const KB = 8.617e-5;

const MACRO_START = 0.035;
const MACRO_END = 0.008;

const atomicData = {
    "H": { Z: 1, N: 0, core: {}, valenceGroundN: 1, levels: { 1: -13.60, 2: -3.40, 3: -1.51, 4: -0.85, 5: -0.54, 6: -0.38, 7: -0.28, 8: -0.21 } },
    "Na": { Z: 11, N: 12, core: { 1: 2, 2: 8 }, valenceGroundN: 3, levels: { 3: -5.14, 4: -3.04, 5: -2.04, 6: -1.38, 7: -0.80, 8: -0.50 } },
    "K": { Z: 19, N: 20, core: { 1: 2, 2: 8, 3: 8 }, valenceGroundN: 4, levels: { 4: -4.34, 5: -1.27, 6: -0.80, 7: -0.50, 8: -0.30 } },
    "Ca": { Z: 20, N: 20, core: { 1: 2, 2: 8, 3: 8, 4: 1 }, valenceGroundN: 4, levels: { 4: -6.11, 5: -4.11, 6: -2.50, 7: -1.50, 8: -1.00 } },
    "Fe": { Z: 26, N: 30, core: { 1: 2, 2: 8, 3: 14, 4: 1 }, valenceGroundN: 4, levels: { 4: -7.90, 5: -5.75, 6: -4.00, 7: -2.50, 8: -1.50 } },
    "Cu": { Z: 29, N: 35, core: { 1: 2, 2: 8, 3: 18 }, valenceGroundN: 4, levels: { 4: -7.72, 5: -5.29, 6: -3.50, 7: -2.00, 8: -1.00 } },
    "Sr": { Z: 38, N: 50, core: { 1: 2, 2: 8, 3: 18, 4: 8, 5: 1 }, valenceGroundN: 5, levels: { 5: -5.69, 6: -3.78, 7: -2.50, 8: -1.50 } },
    "Ba": { Z: 56, N: 81, core: { 1: 2, 2: 8, 3: 18, 4: 18, 5: 8, 6: 1 }, valenceGroundN: 6, levels: { 6: -5.21, 7: -2.87, 8: -1.80 } }
};

const solidColors = {
    "H": "180, 180, 255", "Na": "160, 165, 175", "K": "150, 155, 165", "Ca": "140, 145, 150",
    "Fe": "110, 115, 120", "Cu": "184, 115, 51", "Sr": "170, 175, 165", "Ba": "180, 185, 185"
};

const flameColors = {
    "H": "255, 100, 200", "Na": "255, 200, 0", "K": "200, 100, 255", "Ca": "255, 80, 50",
    "Fe": "255, 215, 0", "Cu": "0, 255, 200", "Sr": "255, 30, 30", "Ba": "100, 255, 100"
};

let activeMix = ["H"];
let isAlloyMode = false;
let atoms = [];
let spectralLines = [];
let isWaveMode = false;
let temperature = 0;
let showSpectrometer = true;
let telemetryOpen = true;
let globalTime = 0;

let mouseX = 0;
let mouseY = 0;
let hoveredLine = null;

// Laser Engine State Variables
let laserActive = false;
let laserFiring = false;
let laserBeamLength = 0;
let laserTargetWl = 0;
let macroLaserGlowIntensity = 0;
let macroLaserGlowColor = null;

// Macro Emission Engine variables
let macroEmissionGlowIntensity = 0;
let macroEmissionColor = null;

let cameraZoom = 1.0;
let targetZoom = 1.0;
const ATOM_SPACING = 1100;
const GRID_SIZE = 10;

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    targetZoom *= factor;
    targetZoom = Math.min(Math.max(0.002, targetZoom), 1.5);
}, { passive: false });

tempSlider.addEventListener("input", (e) => {
    temperature = parseInt(e.target.value);
    tempDisplay.innerText = temperature + " K";
    let darkness = Math.max(0.1, 1 - (temperature / 25000));
    canvas.style.backgroundColor = `rgba(${31 * (1 - darkness)}, ${10 * (1 - darkness)}, ${5 * (1 - darkness)}, 1)`;
});

function setWaveMode(val) {
    isWaveMode = val;
    waveModeBtn.innerText = isWaveMode ? "Visual: WAVE MODE (V)" : "Visual: PARTICLE MODE (V)";
}
waveModeBtn.addEventListener("click", () => setWaveMode(!isWaveMode));

telemetryBtn.addEventListener("click", () => {
    telemetryOpen = !telemetryOpen;
    telemetryDropdown.style.display = telemetryOpen ? "block" : "none";
    telemetryBtn.innerText = telemetryOpen ? "TELEMETRY ▲" : "TELEMETRY ▼";
});

function toggleSpectrometer() {
    showSpectrometer = !showSpectrometer;
    if (showSpectrometer) pipSpectrometer.classList.add("on");
    else pipSpectrometer.classList.remove("on");
}
rowSpectrometer.addEventListener("click", toggleSpectrometer);

// Handling Element & Alloy Grids
elementBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        elementBtns.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        activeMix = [e.target.getAttribute("data-atom")];
        specNeedsRender = true;
        generateGrid();
    });
});

alloyBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        alloyBtns.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        activeMix = e.target.getAttribute("data-alloy").split(",");
        specNeedsRender = true;
        generateGrid();
    });
});

alloyModeBtn.addEventListener("click", () => {
    isAlloyMode = !isAlloyMode;
    alloyModeBtn.innerText = isAlloyMode ? "Alloy Mode: ON" : "Alloy Mode: OFF";
    alloyModeBtn.classList.toggle("active", isAlloyMode);

    elementGrid.style.display = isAlloyMode ? "none" : "grid";
    alloyGrid.style.display = isAlloyMode ? "grid" : "none";

    if (isAlloyMode) {
        let activeAlloy = document.querySelector("#alloyGrid .preset-btn.active");
        activeMix = activeAlloy.getAttribute("data-alloy").split(",");
        transitionInfo.innerHTML = "Manual target transitions (1-8) disabled in Alloy Mode.";
        transitionInfo.style.color = "#888";
    } else {
        let activeEl = document.querySelector("#elementGrid .preset-btn.active");
        activeMix = [activeEl.getAttribute("data-atom")];
        transitionInfo.innerHTML = "Press 1-8 to initiate a transition.";
        transitionInfo.style.color = "#00e5ff";
    }

    specNeedsRender = true;
    generateGrid();
});

// Laser UI Events
toggleLaserBtn.addEventListener("click", () => {
    laserActive = !laserActive;
    toggleLaserBtn.innerText = laserActive ? "Laser Target: DEPLOYED" : "Laser Target: OFF";
    toggleLaserBtn.classList.toggle("active", laserActive);
    laserSettings.style.display = laserActive ? "block" : "none";
});

fireLaserBtn.addEventListener("click", () => {
    if (!laserActive || laserFiring) return;
    let wlInput = parseFloat(laserWavelengthInput.value);
    if (isNaN(wlInput)) wlInput = 589;
    if (wlInput < 380) wlInput = 380;
    if (wlInput > 780) wlInput = 780;
    laserWavelengthInput.value = wlInput;

    laserFiring = true;
    laserBeamLength = 0;
    laserTargetWl = wlInput;
});

function getElectronSpeed(n) { return (0.006 + (0.02 / n)) * (n % 2 === 0 ? 1 : -1); }

function getOrbitRadius(atomKey, n) {
    let data = atomicData[atomKey];
    let nucleusR = data.Z + data.N === 1 ? 4 : Math.max(8, Math.pow(data.Z + data.N, 1 / 3) * 3.5);
    let minR = nucleusR + 15;
    let maxOrbitR = 380;
    return minR + (n - 1) * ((maxOrbitR - minR) / (MAX_ORBITS - 1));
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
        this.transitionLabel = "";
        this.isManual = false;

        this.coreElectrons = [];
        for (const [nStr, count] of Object.entries(this.data.core)) {
            let n = parseInt(nStr);
            let randomOffset = Math.random() * Math.PI * 2;
            for (let i = 0; i < count; i++) {
                this.coreElectrons.push({ n: n, angle: (i / count) * Math.PI * 2 + randomOffset });
            }
        }

        this.nucleusParticles = [];
        const total = this.data.Z + this.data.N;
        if (total === 1) {
            this.nucleusParticles.push({ x: 0, y: 0, type: 'proton' });
        } else {
            const R = Math.max(8, Math.pow(total, 1 / 3) * 3.5);
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

const MAX_PHOTONS = 400;
const photonPool = Array.from({ length: MAX_PHOTONS }, () => ({ active: false }));

function spawnVisualPhoton(params) {
    if (cameraZoom >= 0.12) {
        let atom = params.atom;
        let isCenter = (atom.x === 0 && atom.y === 0);

        if (cameraZoom >= 0.25 && !isCenter) return;

        let viewHalfW = cx / cameraZoom;
        let viewHalfH = cy / cameraZoom;
        let maxCullRadius = 450;

        if (atom.x + maxCullRadius < -viewHalfW || atom.x - maxCullRadius > viewHalfW ||
            atom.y + maxCullRadius < -viewHalfH || atom.y - maxCullRadius > viewHalfH) {
            return;
        }

        let p = photonPool.find(ph => !ph.active);
        if (p) {
            Object.assign(p, params);
            p.active = true;
            p.progress = 0;
        }
    }
}

function generateGrid() {
    atoms = [];
    photonPool.forEach(p => p.active = false);
    spectralLines = [];

    for (let x = -GRID_SIZE; x <= GRID_SIZE; x++) {
        for (let y = -GRID_SIZE; y <= GRID_SIZE; y++) {
            let el = activeMix[Math.floor(Math.random() * activeMix.length)];
            atoms.push(new Atom(el, x * ATOM_SPACING, y * ATOM_SPACING));
        }
    }
    updateCenterUI();
}

function getAvgColor(dict, mix) {
    let r = 0, g = 0, b = 0;
    mix.forEach(el => {
        let parts = dict[el].split(',').map(Number);
        r += parts[0]; g += parts[1]; b += parts[2];
    });
    return `${Math.round(r / mix.length)}, ${Math.round(g / mix.length)}, ${Math.round(b / mix.length)}`;
}

function wavelengthToColor(wl) {
    if (wl < 380 || wl > 780) return null;
    const x = 1.056 * Math.exp(-0.5 * Math.pow((wl - 599.8) / 43.2, 2)) + 0.362 * Math.exp(-0.5 * Math.pow((wl - 442.0) / 16.2, 2)) - 0.065 * Math.exp(-0.5 * Math.pow((wl - 501.1) / 20.4, 2));
    const y = 0.821 * Math.exp(-0.5 * Math.pow((wl - 568.8) / 46.9, 2)) + 0.286 * Math.exp(-0.5 * Math.pow((wl - 530.9) / 16.3, 2));
    const z = 1.217 * Math.exp(-0.5 * Math.pow((wl - 437.0) / 11.8, 2)) + 0.681 * Math.exp(-0.5 * Math.pow((wl - 459.0) / 26.0, 2));

    let r = 3.2406 * x - 1.5372 * y - 0.4986 * z;
    let g = -0.9689 * x + 1.8758 * y + 0.0415 * z;
    let b = 0.0557 * x - 0.2040 * y + 1.0570 * z;

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

    let prefix = isAlloyMode ? `(${centerAtom.key}) ` : "";
    currentStateTxt.innerText = `${prefix}n = ${centerAtom.targetN}`;
    currentEnergyTxt.innerText = `${getEnergy(centerAtom.key, centerAtom.targetN).toFixed(2)} eV`;
}

function startJump(atom, colorToEmit, wl) {
    atom.isJumping = true;
    atom.jumpProgress = 0;
    atom.emissionColor = colorToEmit;
    atom.emissionWl = wl;
}

function initiateTransition(atom, newN, isManual = false) {
    if (newN === atom.currentN || atom.isTransitioning) return;

    atom.isTransitioning = true;
    atom.targetN = newN;
    atom.isManual = isManual;

    const energyDiff = Math.abs(getEnergy(atom.key, newN) - getEnergy(atom.key, atom.currentN));
    const wavelength = Math.abs(HC / energyDiff);
    const exactColor = wavelengthToColor(wavelength);
    const isAbsorption = newN > atom.currentN;

    atom.transitionLabel = `n=${atom.currentN} → n=${newN}`;

    if (atom.x === 0 && atom.y === 0) {
        let actionWord = isAbsorption ? 'Absorbed' : 'Emitted';
        let visibilityNote = exactColor ? '' : ' <span style="color:#666;">(UV/IR spectrum)</span>';
        transitionInfo.innerHTML = `${actionWord} photon<br>ΔE = ${energyDiff.toFixed(2)} eV<br>λ = ${wavelength.toFixed(0)} nm${visibilityNote}`;
        transitionInfo.style.color = exactColor || '#888';
        updateCenterUI();
    }

    if (exactColor) {
        if (isAbsorption) {
            spawnVisualPhoton({
                originX: atom.x, originY: atom.y,
                targetRadius: getOrbitRadius(atom.key, atom.currentN),
                angle: atom.electronAngle + Math.PI,
                color: exactColor,
                isAbsorption: true,
                triggerJump: true,
                atom: atom
            });
            if (cameraZoom < 0.12) startJump(atom, exactColor, wavelength);
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

    if (key === 't') {
        temperature = 0;
        tempSlider.value = temperature;
        tempSlider.dispatchEvent(new Event('input'));
        return;
    }
    if (key === 'v') { waveModeBtn.click(); return; }
    if (key === 's') { toggleSpectrometer(); return; }

    if (e.key >= '1' && e.key <= '8') {
        if (document.activeElement === laserWavelengthInput) return;
        if (isAlloyMode) return;
        e.preventDefault();
        let requestedN = parseInt(e.key);
        atoms.forEach(atom => {
            if (!atom.isTransitioning && atomicData[atom.key].levels[requestedN] !== undefined) {
                initiateTransition(atom, requestedN, true);
            }
        });
    }
});

function blendColor(baseRGBStr, factor) {
    let parts = baseRGBStr.split(',').map(Number);
    let r = Math.round(parts[0] + (255 - parts[0]) * factor);
    let g = Math.round(parts[1] + (255 - parts[1]) * factor);
    let b = Math.round(parts[2] + (255 - parts[2]) * factor);
    return `${r}, ${g}, ${b}`;
}

const specBgCanvas = document.createElement("canvas");
const specBgCtx = specBgCanvas.getContext("2d");

function preRenderSpectrometer() {
    let gw = Math.min(450, canvas.width - 360);
    if (canvas.width <= 768) gw = Math.min(450, canvas.width - 40);
    let gh = 95;

    specBgCanvas.width = gw + 20;
    specBgCanvas.height = gh + 20;

    specBgCtx.fillStyle = "rgba(20, 20, 20, 0.85)";
    specBgCtx.fillRect(0, 0, gw, gh);
    specBgCtx.strokeStyle = "#333";
    specBgCtx.lineWidth = 1.5;
    specBgCtx.strokeRect(0, 0, gw, gh);

    specBgCtx.font = "10px monospace";
    specBgCtx.textAlign = "left";
    specBgCtx.fillStyle = "#ddd";
    specBgCtx.fillText("LIVE SPECTROMETER (380-780nm)", 8, 14);

    specBgCtx.textAlign = "right";
    specBgCtx.fillStyle = "#ff3366";
    let specTitle = activeMix.length > 1 ? "MIXED ALLOY" : activeMix[0].toUpperCase();
    specBgCtx.fillText(specTitle, gw - 8, 14);

    let boxX = 10;
    let boxY = 24;
    let boxW = gw - 20;
    let boxH = gh - 40;

    let grad = specBgCtx.createLinearGradient(boxX, 0, boxX + boxW, 0);
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
        specBgCtx.globalAlpha = 0.15;
        specBgCtx.fillStyle = grad;
        specBgCtx.fillRect(boxX, boxY, boxW, boxH);
        specBgCtx.globalAlpha = 1.0;
    }

    specBgCtx.strokeStyle = "#444";
    specBgCtx.lineWidth = 1;
    specBgCtx.strokeRect(boxX, boxY, boxW, boxH);

    specBgCtx.fillStyle = "#666";
    specBgCtx.font = "8px monospace";
    specBgCtx.textAlign = "center";
    for (let w = 400; w <= 700; w += 100) {
        let lx = boxX + ((w - 380) / 400) * boxW;
        specBgCtx.fillText(w + "nm", lx, boxY + boxH + 12);
        specBgCtx.beginPath(); specBgCtx.moveTo(lx, boxY + boxH); specBgCtx.lineTo(lx, boxY + boxH - 3); specBgCtx.stroke();
    }
    specNeedsRender = false;
}

function drawSpectrometer() {
    if (!showSpectrometer) return;
    if (specNeedsRender) preRenderSpectrometer();

    let gw = Math.min(450, canvas.width - 360);
    if (canvas.width <= 768) gw = Math.min(450, canvas.width - 40);

    let gx = canvas.width - gw - 20;
    let gy = 20;

    ctx.drawImage(specBgCanvas, gx, gy);

    let boxX = gx + 10;
    let boxY = gy + 24;
    let boxW = gw - 20;
    let boxH = 95 - 40;

    let sortedLines = [...spectralLines].sort((a, b) => a.wl - b.wl);
    let textZones = [];
    hoveredLine = null;

    sortedLines.forEach(line => {
        let normalized = (line.wl - 380) / 400;
        if (normalized < 0 || normalized > 1) return;

        let lineX = boxX + normalized * boxW;

        if (mouseY >= boxY && mouseY <= boxY + boxH && Math.abs(mouseX - lineX) < 4) {
            hoveredLine = line;
        }

        ctx.beginPath();
        ctx.moveTo(lineX, boxY);
        ctx.lineTo(lineX, boxY + boxH);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = (hoveredLine === line) ? 5 : 3;
        ctx.shadowBlur = (hoveredLine === line) ? 20 : 12;
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
                textZones.push({ x: lineX, y: yLvl });
                break;
            }
        }
    });

    if (hoveredLine) {
        ctx.save();
        ctx.fillStyle = "rgba(15, 15, 15, 0.95)";
        ctx.strokeStyle = hoveredLine.color;
        ctx.lineWidth = 1.5;

        let tipW = 150;
        let tipH = 46;
        let tipX = mouseX + 15;
        let tipY = mouseY + 15;

        if (tipX + tipW > canvas.width) tipX = mouseX - tipW - 15;
        if (tipY + tipH > canvas.height) tipY = mouseY - tipH - 15;

        ctx.beginPath();
        ctx.roundRect(tipX, tipY, tipW, tipH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`Wavelength: ${Math.round(hoveredLine.wl)} nm`, tipX + 10, tipY + 18);

        ctx.fillStyle = "#00ff7f";
        ctx.font = "10px monospace";
        ctx.fillText(`Event: ${hoveredLine.transition || 'Unknown'}`, tipX + 10, tipY + 34);
        ctx.restore();
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    cameraZoom += (targetZoom - cameraZoom) * 0.12;
    globalTime += 0.05;

    let zf = 1 / cameraZoom;
    let macroAlpha = 0;

    if (cameraZoom < MACRO_START) {
        macroAlpha = Math.max(0, Math.min(1, (MACRO_START - cameraZoom) / (MACRO_START - MACRO_END)));
        if (laserControlGroup.style.display === "none") laserControlGroup.style.display = "block";
    } else {
        if (laserControlGroup.style.display === "block") {
            laserControlGroup.style.display = "none";
            laserActive = false;
            laserFiring = false;
            toggleLaserBtn.innerText = "Laser Target: OFF";
            toggleLaserBtn.classList.remove("active");
            laserSettings.style.display = "none";
        }
    }

    let atomAlpha = 1 - macroAlpha;

    atoms.forEach(atom => {
        if (!atom.isTransitioning && !atom.isJumping) {
            if (temperature > 0 && atom.currentN > atom.data.valenceGroundN && Math.random() < 0.05) {
                let possible = Object.keys(atom.data.levels).map(Number).filter(n => n < atom.currentN);
                if (possible.length > 0) {
                    let target = possible[Math.floor(Math.random() * possible.length)];
                    initiateTransition(atom, target, false);
                }
            }
            if (temperature > 0) {
                let possible = Object.keys(atom.data.levels).map(Number).filter(n => n > atom.currentN);
                if (possible.length > 0) {
                    let targetN = possible[Math.floor(Math.random() * possible.length)];
                    let dE = Math.abs(getEnergy(atom.key, targetN) - getEnergy(atom.key, atom.currentN));
                    let prob = 5.0 * Math.exp(-dE / (KB * temperature));
                    if (Math.random() < prob) initiateTransition(atom, targetN, false);
                }
            }
        }

        if (atom.isJumping) {
            atom.jumpProgress += 0.02;

            if (atom.jumpProgress >= 1) {
                let isEmission = atom.targetN < atom.currentN;

                atom.jumpProgress = 1;
                atom.isJumping = false;
                atom.currentN = atom.targetN;
                atom.isTransitioning = false;

                if (atom.emissionColor) {
                    if (isEmission && atom.isManual) {
                        macroEmissionGlowIntensity = 1.0;
                        macroEmissionColor = atom.emissionColor;
                    }

                    spawnVisualPhoton({
                        originX: atom.x, originY: atom.y,
                        angle: atom.electronAngle,
                        color: atom.emissionColor,
                        isAbsorption: false,
                        atom: atom
                    });

                    if (!spectralLines.some(l => Math.abs(l.wl - atom.emissionWl) < 1)) {
                        spectralLines.push({
                            wl: atom.emissionWl,
                            color: atom.emissionColor,
                            transition: isAlloyMode ? `Emission (${atom.key}): ${atom.transitionLabel}` : `Emission: ${atom.transitionLabel}`
                        });
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
                currentSpeed = currentSpeed * (1 - ease) + getElectronSpeed(atom.targetN) * ease;
            }
            atom.electronAngle += currentSpeed;
            atom.coreElectrons.forEach(e => { e.angle += getElectronSpeed(e.n); });
        }
    });

    if (macroLaserGlowIntensity > 0) {
        macroLaserGlowIntensity -= 0.015;
        if (macroLaserGlowIntensity < 0) macroLaserGlowIntensity = 0;
    }
    if (macroEmissionGlowIntensity > 0) {
        macroEmissionGlowIntensity -= 0.015;
        if (macroEmissionGlowIntensity < 0) macroEmissionGlowIntensity = 0;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(cameraZoom, cameraZoom);

    // Lattice Transformation Matrix & Blackbody Incandescence Renderer
    if (macroAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = macroAlpha;
        let blockSize = (GRID_SIZE * 2 + 1) * ATOM_SPACING;

        let isSolid = !(activeMix.length === 1 && activeMix[0] === "H");
        let baseSolidC = getAvgColor(solidColors, activeMix);
        let activeRGBStr = getAvgColor(flameColors, activeMix);

        let heatGlowIntensity = Math.min(1, temperature / 20000);
        let shouldGlow = temperature > 1000;
        let isForcedGlow = false;

        let whiteFactor = Math.max(0, Math.min(1, (temperature - 3000) / 10000));

        if (macroEmissionGlowIntensity > 0 && macroEmissionColor) {
            isForcedGlow = true;
            shouldGlow = true;
            activeRGBStr = macroEmissionColor.slice(4, -1);
            heatGlowIntensity = Math.max(heatGlowIntensity, macroEmissionGlowIntensity * 1.5);
        }

        if (macroLaserGlowIntensity > 0 && macroLaserGlowColor) {
            isForcedGlow = true;
            shouldGlow = true;
            activeRGBStr = macroLaserGlowColor.slice(4, -1);
            heatGlowIntensity = Math.max(heatGlowIntensity, macroLaserGlowIntensity * 1.5);
        }

        if (shouldGlow) {
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            let glowRad = blockSize * (1.2 + heatGlowIntensity * 0.5);
            let auraC = (!isForcedGlow && temperature > 3000) ? blendColor(activeRGBStr, whiteFactor * 0.5) : activeRGBStr;

            let grad = ctx.createRadialGradient(0, 0, blockSize * 0.1, 0, 0, glowRad);
            grad.addColorStop(0, `rgba(${auraC}, ${Math.max(0.6, heatGlowIntensity)})`);
            grad.addColorStop(0.3, `rgba(${auraC}, ${Math.max(0.3, heatGlowIntensity * 0.5)})`);
            grad.addColorStop(1, `rgba(${auraC}, 0)`);
            ctx.beginPath(); ctx.arc(0, 0, glowRad, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
            ctx.restore();
        }

        if (!isSolid) {
            ctx.beginPath(); ctx.arc(0, 0, blockSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = temperature > 0 || isForcedGlow ? `rgba(${activeRGBStr}, ${0.1 + heatGlowIntensity * 0.3})` : `rgba(${baseSolidC}, 0.1)`;
            ctx.fill();
        } else {
            let baseC = baseSolidC;
            let highlightC = blendColor("255, 255, 255", 0.85);
            let shadowC = "35, 40, 45";

            let grad = ctx.createLinearGradient(-blockSize / 2, -blockSize / 2, blockSize / 2, blockSize / 2);
            grad.addColorStop(0, `rgba(${baseC}, 1)`);
            grad.addColorStop(0.35, `rgba(${baseC}, 1)`);
            grad.addColorStop(0.45, `rgba(${highlightC}, 1)`);
            grad.addColorStop(0.5, `rgba(${baseC}, 1)`);
            grad.addColorStop(0.65, `rgba(${shadowC}, 0.7)`);
            grad.addColorStop(1, `rgba(${baseC}, 0.8)`);

            ctx.beginPath(); ctx.rect(-blockSize / 2, -blockSize / 2, blockSize, blockSize); ctx.fillStyle = grad; ctx.fill();

            // Only convert the SURFACE structural bounds to bright white to signify incandescence
            let borderRGBStr = shouldGlow ? activeRGBStr : "51, 51, 51";
            if (!isForcedGlow && temperature > 3000) {
                borderRGBStr = blendColor(borderRGBStr, whiteFactor);
            }

            ctx.strokeStyle = `rgba(${borderRGBStr}, 1)`;
            ctx.lineWidth = Math.max(18, 50 * cameraZoom); ctx.stroke();
        }
        ctx.restore();
    }

    // Atomic Micro-State Core Rendering
    if (atomAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = atomAlpha;
        let viewHalfW = cx / cameraZoom;
        let viewHalfH = cy / cameraZoom;
        let maxCullRadius = 450;

        atoms.forEach(atom => {
            if (atom.x + maxCullRadius < -viewHalfW || atom.x - maxCullRadius > viewHalfW ||
                atom.y + maxCullRadius < -viewHalfH || atom.y - maxCullRadius > viewHalfH) return;

            let isCenter = (atom.x === 0 && atom.y === 0);
            let lodLevel = (cameraZoom < 0.12) ? 2 : (cameraZoom < 0.25 && !isCenter) ? 1 : 0;
            if (cameraZoom >= 0.25 && !isCenter) return;

            if (lodLevel === 2) {
                ctx.beginPath(); ctx.arc(atom.x, atom.y, 80, 0, Math.PI * 2);
                ctx.fillStyle = (atom.isJumping && atom.emissionColor && atom.targetN < atom.currentN) ? atom.emissionColor : "rgba(100, 150, 255, 0.15)";
                ctx.fill(); return;
            }

            for (let n = 1; n <= MAX_ORBITS; n++) {
                if (lodLevel === 1 && n !== atom.currentN && n !== atom.targetN) continue;
                let r = getOrbitRadius(atom.key, n);
                ctx.beginPath(); ctx.arc(atom.x, atom.y, r, 0, Math.PI * 2);
                if (n === atom.targetN && atom.currentN !== atom.targetN) {
                    ctx.strokeStyle = "rgba(0, 255, 127, 0.8)"; ctx.lineWidth = 3 * Math.pow(zf, 0.4); ctx.setLineDash([5 * zf, 5 * zf]);
                } else if (n === atom.currentN && !isWaveMode) {
                    ctx.strokeStyle = "rgba(0, 229, 255, 0.7)"; ctx.lineWidth = 3 * Math.pow(zf, 0.4); ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = "rgba(160, 160, 160, 0.4)"; ctx.lineWidth = 1.5 * Math.pow(zf, 0.4); ctx.setLineDash([4 * zf, 6 * zf]);
                }
                ctx.stroke(); ctx.setLineDash([]);
            }

            let ease = atom.isJumping ? (0.5 - Math.cos(atom.jumpProgress * Math.PI) / 2) : 0;

            if (isWaveMode) {
                let shellPopulation = {};
                atom.coreElectrons.forEach(e => shellPopulation[e.n] = (shellPopulation[e.n] || 0) + 1);
                if (!atom.isJumping) shellPopulation[atom.currentN] = (shellPopulation[atom.currentN] || 0) + 1;

                ctx.globalCompositeOperation = "screen";
                for (let nStr in shellPopulation) {
                    let n = parseInt(nStr);
                    if (lodLevel === 1 && n !== atom.currentN) continue;
                    let count = shellPopulation[n], baseR = getOrbitRadius(atom.key, n), amp = (3 + Math.min(count, 8) * 0.4) * Math.pow(zf, 0.75);
                    ctx.beginPath();
                    for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.05) {
                        let r = baseR + amp * Math.sin(n * theta) * Math.cos(globalTime * 3);
                        let px = atom.x + Math.cos(theta) * r, py = atom.y + Math.sin(theta) * r;
                        if (theta === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = (n === atom.currentN && !atom.isJumping) ? "rgba(0, 229, 255, 1)" : "rgba(0, 180, 255, 0.8)";
                    ctx.lineWidth = (2.2 + count * 0.25) * Math.pow(zf, 0.6);
                    if (lodLevel === 0) { ctx.shadowBlur = Math.min(30, 10 * Math.pow(zf, 0.5)); ctx.shadowColor = ctx.strokeStyle; }
                    ctx.stroke(); ctx.shadowBlur = 0;
                }

                if (atom.isJumping) {
                    let rBaseInterp = getOrbitRadius(atom.key, atom.currentN) * (1 - ease) + getOrbitRadius(atom.key, atom.targetN) * ease, amp = 3.4 * Math.pow(zf, 0.75);
                    ctx.beginPath();
                    for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.05) {
                        let r = rBaseInterp + (1 - ease) * (amp * Math.sin(atom.currentN * theta) * Math.cos(globalTime * 3)) + ease * (amp * Math.sin(atom.targetN * theta) * Math.cos(globalTime * 3));
                        let px = atom.x + Math.cos(theta) * r, py = atom.y + Math.sin(theta) * r;
                        if (theta === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.closePath(); ctx.strokeStyle = "rgba(0, 255, 127, 1)"; ctx.lineWidth = 2.4 * Math.pow(zf, 0.6);
                    if (lodLevel === 0) { ctx.shadowBlur = Math.min(40, 15 * Math.pow(zf, 0.5)); ctx.shadowColor = ctx.strokeStyle; }
                    ctx.stroke(); ctx.shadowBlur = 0;
                }
                ctx.globalCompositeOperation = "source-over";
            } else {
                let currentRadius = getOrbitRadius(atom.key, atom.currentN);
                if (atom.isJumping) currentRadius = getOrbitRadius(atom.key, atom.currentN) + (getOrbitRadius(atom.key, atom.targetN) - getOrbitRadius(atom.key, atom.currentN)) * ease;
                const eX = atom.x + Math.cos(atom.electronAngle) * currentRadius, eY = atom.y + Math.sin(atom.electronAngle) * currentRadius;

                if (lodLevel === 0) {
                    atom.coreElectrons.forEach(e => {
                        let r = getOrbitRadius(atom.key, e.n);
                        ctx.beginPath(); ctx.arc(atom.x + Math.cos(e.angle) * r, atom.y + Math.sin(e.angle) * r, 2.5 * Math.pow(zf, 0.6), 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(0, 180, 255, 0.85)"; ctx.fill();
                    });
                }
                ctx.globalCompositeOperation = "screen";
                ctx.beginPath(); ctx.arc(eX, eY, 4.5 * Math.pow(zf, 0.6), 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 229, 255, 1)";
                if (lodLevel === 0) { ctx.shadowBlur = Math.min(30, 15 * zf); ctx.shadowColor = '#00e5ff'; }
                ctx.fill(); ctx.shadowBlur = 0; ctx.globalCompositeOperation = "source-over";
            }

            if (lodLevel === 1) {
                let total = atom.data.Z + atom.data.N;
                ctx.beginPath(); ctx.arc(atom.x, atom.y, (total === 1 ? 4 : Math.max(8, Math.pow(total, 1 / 3) * 3.5)) * Math.pow(zf, 0.6), 0, Math.PI * 2);
                ctx.fillStyle = "rgba(180, 50, 80, 0.8)"; ctx.fill();
            } else {
                atom.nucleusParticles.forEach(p => {
                    ctx.beginPath(); ctx.arc(atom.x + p.x, atom.y + p.y, 2.5 * Math.pow(zf, 0.6), 0, Math.PI * 2);
                    ctx.fillStyle = p.type === 'proton' ? "rgba(255, 51, 102, 1)" : "rgba(120, 130, 142, 1)"; ctx.fill();
                    ctx.beginPath(); ctx.arc(atom.x + p.x - 0.8 * zf, atom.y + p.y - 0.8 * zf, 0.8 * Math.pow(zf, 0.6), 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; ctx.fill();
                });
            }
        });
        ctx.restore();
    }
    ctx.restore();

    // Render Laser Weapon Engine outside zoom matrix to bind to screen edge
    if (laserActive && macroAlpha > 0) {
        ctx.save();
        let gunY = cy;
        let gunX = canvas.width;

        ctx.fillStyle = "#222";
        ctx.fillRect(gunX - 50, gunY - 20, 50, 40);
        ctx.fillStyle = "#111";
        ctx.fillRect(gunX - 65, gunY - 8, 15, 16);

        let laserColMatch = wavelengthToColor(laserTargetWl);
        let beamColorStr = laserColMatch;
        if (!beamColorStr) {
            beamColorStr = (laserTargetWl < 380) ? "rgb(150, 50, 255)" : "rgb(150, 20, 20)";
        }

        ctx.fillStyle = laserFiring ? beamColorStr : "#444";
        ctx.fillRect(gunX - 58, gunY - 4, 10, 8);

        if (laserFiring) {
            laserBeamLength += 35;
            let blockRightEdgeScreenX = cx + (((GRID_SIZE * 2 + 1) * ATOM_SPACING) / 2) * cameraZoom;

            let currentBeamEndX = (gunX - 65) - laserBeamLength;

            if (currentBeamEndX <= blockRightEdgeScreenX) {
                currentBeamEndX = blockRightEdgeScreenX;
                laserFiring = false;

                // Verify exact atomic quantum matching across the lattice
                let exactMatchFound = false;
                let matchedTransition = "Laser Absorption";

                for (let elKey of activeMix) {
                    let levels = Object.values(atomicData[elKey].levels);
                    let levelKeys = Object.keys(atomicData[elKey].levels);
                    for (let i = 0; i < levels.length; i++) {
                        for (let j = i + 1; j < levels.length; j++) {
                            let dE = Math.abs(levels[i] - levels[j]);
                            let requiredWl = Math.abs(1240 / dE);
                            if (Math.abs(requiredWl - laserTargetWl) <= 1.5) {
                                exactMatchFound = true;
                                matchedTransition = isAlloyMode ? `Absorb (${elKey}): n=${levelKeys[i]} ↔ n=${levelKeys[j]}` : `Absorption: n=${levelKeys[i]} ↔ n=${levelKeys[j]}`;
                                break;
                            }
                        }
                        if (exactMatchFound) break;
                    }
                    if (exactMatchFound) break;
                }

                if (exactMatchFound) {
                    macroLaserGlowIntensity = 1.0;
                    macroLaserGlowColor = laserColMatch || beamColorStr;

                    if (!spectralLines.some(l => Math.abs(l.wl - laserTargetWl) < 1)) {
                        spectralLines.push({
                            wl: laserTargetWl,
                            color: macroLaserGlowColor,
                            transition: matchedTransition
                        });
                    }
                }
            }

            ctx.globalCompositeOperation = "screen";
            ctx.beginPath();
            ctx.moveTo(gunX - 65, gunY);
            ctx.lineTo(currentBeamEndX, gunY);
            ctx.strokeStyle = beamColorStr;
            ctx.lineWidth = 14;
            ctx.lineCap = "round";
            ctx.shadowBlur = 30;
            ctx.shadowColor = beamColorStr;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(gunX - 65, gunY);
            ctx.lineTo(currentBeamEndX, gunY);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.shadowBlur = 0;
            ctx.stroke();

            ctx.globalCompositeOperation = "source-over";
        }
        ctx.restore();
    }

    ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < MAX_PHOTONS; i++) {
        let p = photonPool[i]; if (!p.active) continue;
        p.progress += 0.018;

        if (p.isAbsorption && p.progress >= 1.0) {
            if (p.triggerJump) startJump(p.atom, null, null); p.active = false; continue;
        }
        if (!p.isAbsorption && p.progress >= 2.5) { p.active = false; continue; }
        if (cameraZoom < 0.12) continue;

        let maxR = 1500, ppx = cx + p.originX * cameraZoom, ppy = cy + p.originY * cameraZoom;
        if (ppx + maxR < 0 || ppx - maxR > canvas.width || ppy + maxR < 0 || ppy - maxR > canvas.height) continue;

        if (isWaveMode && !p.isAbsorption) {
            let r = (getOrbitRadius(p.atom.key, p.atom.targetN) + (p.progress / 2.5) * maxR) * cameraZoom;
            ctx.beginPath(); ctx.arc(ppx, ppy, r, 0, Math.PI * 2); ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1.5, 20 * (1 - p.progress / 2.5)) * Math.pow(zf, 0.8) * cameraZoom;
            ctx.globalAlpha = Math.max(0, 1 - p.progress / 2.5); ctx.shadowBlur = Math.min(50, 35 * zf); ctx.shadowColor = p.color;
            ctx.stroke(); ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;
        } else {
            let rHead = p.isAbsorption ? 1800 * (1 - p.progress) + p.targetRadius * p.progress : getOrbitRadius(p.atom.key, p.atom.targetN) + p.progress * 600;
            let localTailProg = Math.max(0, p.progress - 0.15);
            let rTail = p.isAbsorption ? 1800 * (1 - localTailProg) + p.targetRadius * localTailProg : getOrbitRadius(p.atom.key, p.atom.targetN) + localTailProg * 600;

            let headX = cx + (p.originX + Math.cos(p.angle) * rHead) * cameraZoom, headY = cy + (p.originY + Math.sin(p.angle) * rHead) * cameraZoom;
            let tailX = cx + (p.originX + Math.cos(p.angle) * rTail) * cameraZoom, tailY = cy + (p.originY + Math.sin(p.angle) * rTail) * cameraZoom;

            ctx.beginPath(); ctx.strokeStyle = p.color; ctx.lineWidth = 6 * Math.pow(zf, 0.6) * cameraZoom; ctx.lineCap = "round";
            ctx.shadowBlur = Math.min(30, 20 * zf); ctx.shadowColor = p.color; ctx.moveTo(tailX, tailY); ctx.lineTo(headX, headY); ctx.stroke(); ctx.shadowBlur = 0;

            if (headX !== undefined) {
                ctx.beginPath(); ctx.arc(headX, headY, 6 * Math.pow(zf, 0.6) * cameraZoom, 0, Math.PI * 2); ctx.fillStyle = "#ffffff";
                ctx.shadowBlur = Math.min(30, 20 * zf); ctx.shadowColor = p.color; ctx.fill(); ctx.shadowBlur = 0;
            }
        }
    }
    ctx.globalCompositeOperation = 'source-over';

    drawSpectrometer();
    if (!keyboardDetected) updateDeviceNotice();
    requestAnimationFrame(animate);
}

updateDeviceNotice();
generateGrid();
animate();