export function calculateFWHMForPlane(matrix, vAngles, hAngles, targetAngle1, targetAngle2) {
    function getClosestIndex(target) {
        let closestIdx = 0;
        let minDiff = Infinity;
        for (let i = 0; i < hAngles.length; i++) {
            let diff = Math.min(Math.abs(hAngles[i] - target), Math.abs(360 - Math.abs(hAngles[i] - target)));
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
            }
        }
        return closestIdx;
    }

    const idx1 = getClosestIndex(targetAngle1);
    const idx2 = getClosestIndex(targetAngle2);
    const nv = vAngles.length;

    const profile = [];
    for (let i = nv - 1; i > 0; i--) {
        profile.push({
            angle: -vAngles[i],
            intensity: matrix[idx2][i]
        });
    }
    profile.push({
        angle: 0,
        intensity: (matrix[idx1][0] + matrix[idx2][0]) / 2
    });
    for (let i = 1; i < nv; i++) {
        profile.push({
            angle: vAngles[i],
            intensity: matrix[idx1][i]
        });
    }

    let peakI = -1;
    let peakIdx = 0;
    for (let i = 0; i < profile.length; i++) {
        if (profile[i].intensity > peakI) {
            peakI = profile[i].intensity;
            peakIdx = i;
        }
    }

    const halfMax = peakI * 0.5;

    let leftAngle = null;
    for (let i = peakIdx; i > 0; i--) {
        const i1 = profile[i].intensity;
        const i2 = profile[i-1].intensity;
        if ((i1 >= halfMax && i2 <= halfMax) || (i1 <= halfMax && i2 >= halfMax)) {
            const t = (halfMax - i1) / (i2 - i1);
            leftAngle = profile[i].angle + t * (profile[i-1].angle - profile[i].angle);
            break;
        }
    }
    if (leftAngle === null) leftAngle = profile[0].angle;

    let rightAngle = null;
    for (let i = peakIdx; i < profile.length - 1; i++) {
        const i1 = profile[i].intensity;
        const i2 = profile[i+1].intensity;
        if ((i1 >= halfMax && i2 <= halfMax) || (i1 <= halfMax && i2 >= halfMax)) {
            const t = (halfMax - i1) / (i2 - i1);
            rightAngle = profile[i].angle + t * (profile[i+1].angle - profile[i].angle);
            break;
        }
    }
    if (rightAngle === null) rightAngle = profile[profile.length - 1].angle;

    return {
        angle: Math.abs(rightAngle - leftAngle),
        peakAngle: profile[peakIdx].angle,
        leftAngle,
        rightAngle
    };
}

export function calculateTotalFlux(matrix, vAngles, hAngles) {
    const nv = vAngles.length;
    const nh = hAngles.length;
    if (!nv || !nh) return 0;
    const vRad = vAngles.map(a => a * Math.PI / 180);
    const hRad = hAngles.map(a => a * Math.PI / 180);

    let symmetryFactor = 1;
    let useCircularHorizontalBounds = false;
    if (nh === 1) {
        symmetryFactor = 1;
    } else {
        const hSpan = hAngles[nh - 1] - hAngles[0];
        const steps = [];
        for (let j = 0; j < nh - 1; j++) steps.push(Math.abs(hAngles[j + 1] - hAngles[j]));
        const avgStep = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : 0;
        useCircularHorizontalBounds = Math.abs(hSpan - 360) < 1e-6 || Math.abs(hSpan + avgStep - 360) < Math.max(2, avgStep * 0.35);
        if (!useCircularHorizontalBounds) {
            if (Math.abs(hSpan - 90) < 5) symmetryFactor = 4;
            else if (Math.abs(hSpan - 180) < 5) symmetryFactor = 2;
            else if (Math.abs(hSpan - 360) < 5) symmetryFactor = 1;
        }
    }

    const vBounds = [];
    for (let i = 0; i < nv; i++) {
        let start, end;
        if (nv === 1) {
            start = 0;
            end = Math.PI / 2;
        } else if (i === 0) {
            start = Math.max(0, vRad[0]);
            end = (vRad[0] + vRad[1]) / 2;
        } else if (i === nv - 1) {
            start = (vRad[i - 1] + vRad[i]) / 2;
            end = vRad[i];
        } else {
            start = (vRad[i - 1] + vRad[i]) / 2;
            end = (vRad[i] + vRad[i + 1]) / 2;
        }
        vBounds.push({ start, end });
    }

    const hBounds = [];
    if (nh === 1) {
        hBounds.push({ start: 0, end: 2 * Math.PI });
    } else if (useCircularHorizontalBounds) {
        const period = 2 * Math.PI;
        for (let j = 0; j < nh; j++) {
            const prev = j === 0 ? hRad[nh - 1] - period : hRad[j - 1];
            const next = j === nh - 1 ? hRad[0] + period : hRad[j + 1];
            hBounds.push({ start: (prev + hRad[j]) / 2, end: (hRad[j] + next) / 2 });
        }
    } else {
        for (let j = 0; j < nh; j++) {
            let start, end;
            if (j === 0) {
                start = hRad[0];
                end = (hRad[0] + hRad[1]) / 2;
            } else if (j === nh - 1) {
                start = (hRad[j - 1] + hRad[j]) / 2;
                end = hRad[j];
            } else {
                start = (hRad[j - 1] + hRad[j]) / 2;
                end = (hRad[j] + hRad[j + 1]) / 2;
            }
            hBounds.push({ start, end });
        }
    }

    let totalFlux = 0;
    for (let j = 0; j < nh; j++) {
        const hWedge = hBounds[j].end - hBounds[j].start;
        for (let i = 0; i < nv; i++) {
            const intensity = Number(matrix[j]?.[i]) || 0;
            const dOmega = hWedge * (Math.cos(vBounds[i].start) - Math.cos(vBounds[i].end));
            totalFlux += intensity * dOmega;
        }
    }
    return Math.max(0, totalFlux * symmetryFactor);
}

export function getIntensityAtAngle(file, angle, rot, numberOrFallback) {
    const hAngles = file.horizontalAngles || [];
    const vAngles = file.verticalAngles || [];
    if (!hAngles.length || !vAngles.length || !file.candelaMatrix?.length) return 0;

    const normalizeDeg = deg => ((deg % 360) + 360) % 360;
    const targetH = normalizeDeg(rot);
    const targetV = Math.abs(angle);

    function findVerticalBracket() {
        if (targetV <= vAngles[0]) return [0, 0, 0];
        if (targetV >= vAngles[vAngles.length - 1]) return [vAngles.length - 1, vAngles.length - 1, 0];
        for (let i = 0; i < vAngles.length - 1; i++) {
            if (targetV >= vAngles[i] && targetV <= vAngles[i + 1]) {
                const t = (targetV - vAngles[i]) / (vAngles[i + 1] - vAngles[i]);
                return [i, i + 1, t];
            }
        }
        return [0, 0, 0];
    }

    function findHorizontalBracket() {
        if (hAngles.length === 1) return [0, 0, 0];
        const normalized = hAngles.map((h, idx) => ({ h: normalizeDeg(h), idx })).sort((a, b) => a.h - b.h);
        for (let i = 0; i < normalized.length - 1; i++) {
            if (targetH >= normalized[i].h && targetH <= normalized[i + 1].h) {
                const span = normalized[i + 1].h - normalized[i].h || 1;
                return [normalized[i].idx, normalized[i + 1].idx, (targetH - normalized[i].h) / span];
            }
        }
        // Wrap between last C-plane and first C-plane + 360°.
        const last = normalized[normalized.length - 1];
        const first = normalized[0];
        const span = (first.h + 360) - last.h || 360;
        const t = targetH >= last.h ? (targetH - last.h) / span : (targetH + 360 - last.h) / span;
        return [last.idx, first.idx, t];
    }

    const [v0, v1, tv] = findVerticalBracket();
    const [h0, h1, th] = findHorizontalBracket();
    const i00 = numberOrFallback(file.candelaMatrix[h0]?.[v0], 0);
    const i01 = numberOrFallback(file.candelaMatrix[h0]?.[v1], i00);
    const i10 = numberOrFallback(file.candelaMatrix[h1]?.[v0], i00);
    const i11 = numberOrFallback(file.candelaMatrix[h1]?.[v1], i10);
    const iv0 = i00 + (i01 - i00) * tv;
    const iv1 = i10 + (i11 - i10) * tv;
    return iv0 + (iv1 - iv0) * th;
}
