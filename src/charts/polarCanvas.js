/**
 * acofusion-comparison-pro - Polar Canvas Charts Module
 * Implements Chart Focus Mode (selective opacity) and Interactive Crosshair Overlay with Tooltips
 */

const COMPARE_COLORS = [
    'rgba(13, 110, 253, 0.95)',  // Sapphire Blue
    'rgba(249, 115, 22, 0.95)',  // Safety Orange
    'rgba(16, 185, 129, 0.95)',  // Emerald Green
    'rgba(139, 92, 246, 0.95)',  // Lavender Purple
    'rgba(236, 72, 153, 0.95)',  // Rouge Pink
    'rgba(100, 116, 139, 0.95)'  // Slate Gray
];

// Helper to adjust alpha channel in rgba strings
function adjustColorAlpha(rgbaStr, alpha) {
    return rgbaStr.replace(/[\d\.]+\)$/, `${alpha})`);
}

// Helper: Linearly interpolate intensity
function getHIndex(file, targetAngle) {
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < file.horizontalAngles.length; i++) {
        let diff = Math.min(Math.abs(file.horizontalAngles[i] - targetAngle), Math.abs(360 - Math.abs(file.horizontalAngles[i] - targetAngle)));
        if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
        }
    }
    return closestIdx;
}

// 輔助曲線繪製
export function drawPhotometricPlane(ctx, cx, cy, maxRadius, rMax, file, leftHIdx, rightHIdx, color, customLineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = customLineWidth || 2.5;
    ctx.beginPath();

    const nv = file.numVerticalAngles;

    for (let i = nv - 1; i >= 0; i--) {
        const vAngle = file.verticalAngles[i];
        const intensity = file.candelaMatrix[leftHIdx][i];
        const factor = intensity / rMax;
        const r = factor * maxRadius;

        const rad = (90 - vAngle) * Math.PI / 180;
        const x = cx - r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);

        if (i === nv - 1) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    for (let i = 0; i < nv; i++) {
        const vAngle = file.verticalAngles[i];
        const intensity = file.candelaMatrix[rightHIdx][i];
        const factor = intensity / rMax;
        const r = factor * maxRadius;

        const rad = (90 - vAngle) * Math.PI / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);

        ctx.lineTo(x, y);
    }

    ctx.stroke();
}

// 重新改寫底層 Canvas 配光繪製，支持後台無 DOM 離線與白底繪製
export function drawPolarToCanvas(canvas, file, forceWidth, forceHeight) {
    const dpr = window.devicePixelRatio || 1;
    
    let w = forceWidth;
    let h = forceHeight;

    if (!w || !h) {
        const parent = canvas.parentNode;
        if (!parent) {
            w = 400;
            h = 300;
        } else {
            const rect = parent.getBoundingClientRect();
            w = rect.width;
            h = rect.width * 0.75;
            
            if (w <= 0) {
                if (!canvas.dataset.retryActive) {
                    canvas.dataset.retryActive = "true";
                    setTimeout(() => {
                        canvas.dataset.retryActive = "";
                        drawPolarToCanvas(canvas, file);
                    }, 100);
                }
                return;
            }
        }
    }

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    
    // Fill white background to prevent black PNG transparency issue
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = 35;
    const maxRadius = Math.max(10, Math.min(w / 2 - 35, h - 55));

    function getNiceScale(maxVal) {
        const candidates = [10, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 10000, 15000, 20000, 30000, 50000, 100000];
        for (let c of candidates) {
            if (maxVal <= c) return c;
        }
        return Math.ceil(maxVal / 10000) * 10000;
    }
    const rMax = getNiceScale(file.maxIntensity);

    // 1. Draw polar grids
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.8;
    ctx.fillStyle = '#64748b';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const rings = 5;
    for (let r = 1; r <= rings; r++) {
        const radius = (maxRadius / rings) * r;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI, false);
        ctx.stroke();

        const ringVal = Math.round((rMax / rings) * r);
        ctx.fillText(ringVal.toString(), cx, cy + radius + 8);
    }

    const angles = [-90, -60, -30, 0, 30, 60, 90];
    angles.forEach(ang => {
        const rad = (ang + 90) * Math.PI / 180;
        const x = cx + maxRadius * Math.cos(rad);
        const y = cy + maxRadius * Math.sin(rad);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        const labelX = cx + (maxRadius + 12) * Math.cos(rad);
        const labelY = cy + (maxRadius + 12) * Math.sin(rad);
        ctx.fillText(`${ang}°`, labelX, labelY);
    });

    const c0Idx = getHIndex(file, 0);
    const c90Idx = getHIndex(file, 90);
    const c180Idx = getHIndex(file, 180);
    const c270Idx = getHIndex(file, 270);

    drawPhotometricPlane(ctx, cx, cy, maxRadius, rMax, file, c0Idx, c180Idx, 'rgba(13, 110, 253, 0.95)');
    drawPhotometricPlane(ctx, cx, cy, maxRadius, rMax, file, c90Idx, c270Idx, 'rgba(249, 115, 22, 0.95)');
}

// --- TAB 2: Multi-polar overlay representation ---
// Supports Chart Focus Mode & interactive crosshairs tracking mouse moves
export function renderPolarOverlay(context, crosshairState = null) {
    const {
        loadedIesFiles,
        activeFileIndex,
        getSortedComparisonFiles,
        updateComparisonCount,
        legendContainer,
        tx,
        escapeHTML,
        canvas
    } = context;

    if (!canvas) return;

    const comparisonFiles = getSortedComparisonFiles();
    updateComparisonCount();

    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentNode;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width <= 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = (rect.width * 0.75) * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.width * 0.75;
    ctx.clearRect(0, 0, width, height);

    if (comparisonFiles.length === 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tx('comparison.emptyTitle'), width / 2, height / 2 - 8);
        ctx.fillText(tx('comparison.emptyInstruction'), width / 2, height / 2 + 12);
        if (legendContainer) {
            legendContainer.innerHTML = `<div class="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">${tx('comparison.emptyLegend')}</div>`;
        }
        return;
    }

    const cx = width / 2;
    const cy = 35;
    const maxRadius = Math.max(10, Math.min(width / 2 - 30, height - 60));

    // Absolute maximum calculation
    let absoluteMax = 100;
    comparisonFiles.forEach(f => {
        if (f.maxIntensity > absoluteMax) absoluteMax = f.maxIntensity;
    });

    function getNiceScale(maxVal) {
        const candidates = [10, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 10000, 15000, 20000, 30000, 50000, 100000];
        for (let c of candidates) {
            if (maxVal <= c) return c;
        }
        return Math.ceil(maxVal / 10000) * 10000;
    }
    const rMax = getNiceScale(absoluteMax);

    // Draw Polar Grids
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const rings = 5;
    for (let r = 1; r <= rings; r++) {
        const radius = (maxRadius / rings) * r;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI, false);
        ctx.stroke();

        const ringVal = Math.round((rMax / rings) * r);
        ctx.fillText(ringVal.toString(), cx, cy + radius + 8);
    }

    const angles = [-90, -60, -30, 0, 30, 60, 90];
    angles.forEach(ang => {
        const rad = (ang + 90) * Math.PI / 180;
        const x = cx + maxRadius * Math.cos(rad);
        const y = cy + maxRadius * Math.sin(rad);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        const labelX = cx + (maxRadius + 12) * Math.cos(rad);
        const labelY = cy + (maxRadius + 12) * Math.sin(rad);
        ctx.fillText(`${ang}°`, labelX, labelY);
    });

    if (legendContainer && !crosshairState) legendContainer.innerHTML = '';

    // --- REQUIREMENT 1: Chart Focus Mode (圖表聚焦模式) ---
    // If a user is hovering over any specific file in the list/table, focus on it.
    const focusedFileId = window.hoveredFileId || (activeFileIndex >= 0 ? loadedIesFiles[activeFileIndex]?.id : null);
    const hasFocusTarget = comparisonFiles.some(f => f.id === focusedFileId);

    comparisonFiles.forEach((file, fIdx) => {
        const colorBase = COMPARE_COLORS[fIdx % COMPARE_COLORS.length];
        
        // Compute focus parameters
        const isFocused = file.id === focusedFileId;
        const opacity = hasFocusTarget ? (isFocused ? 1.0 : 0.15) : 0.95;
        const lineWidth = isFocused ? 4.0 : 2.0;
        const finalColor = adjustColorAlpha(colorBase, opacity);

        if (legendContainer && !crosshairState) {
            const masterIndex = loadedIesFiles.indexOf(file);
            const legendItem = document.createElement('div');
            legendItem.dataset.fileId = file.id;
            legendItem.className = `flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 transition-all duration-150 ${
                isFocused && hasFocusTarget ? 'bg-slate-100/80 px-2 rounded-lg font-bold' : ''
            }`;
            legendItem.innerHTML = `
                <div class="flex items-center min-w-0">
                    <span class="w-3 h-1 rounded mr-1.5 inline-block shrink-0" style="background-color: ${colorBase}"></span>
                    <span class="truncate text-slate-800" title="${escapeHTML(file.fileName)}">${escapeHTML(file.fileName)}</span>
                </div>
                <button onclick="removeFromComparison(${masterIndex}, event)" class="text-[9px] px-2 py-0.5 rounded bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200">Remove</button>
            `;
            legendContainer.appendChild(legendItem);
        }

        function getH0Index() {
            return getHIndex(file, 0);
        }
        function getH180Index() {
            return getHIndex(file, 180);
        }

        drawPhotometricPlane(ctx, cx, cy, maxRadius, rMax, file, getH0Index(), getH180Index(), finalColor, lineWidth);
    });

    // --- REQUIREMENT 2: Crosshair Overlay (十字準星與動態 Tooltip) ---
    if (crosshairState) {
        const { ang, gamma, mx, my } = crosshairState;

        // Radial tracking line
        const rad = (ang + 90) * Math.PI / 180;
        const rx = cx + maxRadius * Math.cos(rad);
        const ry = cy + maxRadius * Math.sin(rad);

        ctx.strokeStyle = 'rgba(138, 196, 63, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        // Radial crosshair line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(rx, ry);
        ctx.stroke();

        // Target angle arc indicator
        ctx.beginPath();
        const mouseRadius = Math.min(maxRadius, Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2));
        ctx.arc(cx, cy, mouseRadius, 0, Math.PI, false);
        ctx.stroke();

        ctx.setLineDash([]); // Reset dash

        // Draw crosshair intersection dot
        ctx.fillStyle = 'var(--accent)';
        ctx.beginPath();
        const ix = cx + mouseRadius * Math.cos(rad);
        const iy = cy + mouseRadius * Math.sin(rad);
        ctx.arc(ix, iy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}
