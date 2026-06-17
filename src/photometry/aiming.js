export function computeAimingMetrics(file, h, deps) {
    const { ceilingHeight, tiltAngle, rotationAngle, numberOrFallback, clampNumber, degToRad, safeTanDeg, getIntensityAtAngle } = deps;
    if (h === undefined) h = ceilingHeight;
    const beamC0 = Math.max(0.1, numberOrFallback(file.fwhmC0?.angle, 30));
    const beamC90 = Math.max(0.1, numberOrFallback(file.fwhmC90?.angle, beamC0));
    const halfC0 = beamC0 / 2;
    const halfC90 = beamC90 / 2;
    const tilt = clampNumber(tiltAngle, 0, 75, 0);
    const tiltRad = degToRad(tilt);
    const cosTilt = Math.max(0.001, Math.cos(tiltRad));
    const offset = h * Math.tan(tiltRad);
    const slantDistance = h / cosTilt;

    // Directly below the luminaire: target is off-axis by the tilt angle.
    const iBelow = Math.max(0, getIntensityAtAngle(file, tilt, rotationAngle, numberOrFallback));
    const eBelow = iBelow / (h * h);

    // At the aiming-axis intersection on the horizontal plane: indicative axis illuminance.
    const peakCd = Math.max(0, numberOrFallback(file.maxIntensity, 0));
    const eAxis = (peakCd * Math.pow(cosTilt, 3)) / (h * h);

    const theta1 = tilt - halfC0;
    const theta2 = tilt + halfC0;
    const t1 = safeTanDeg(theta1, null);
    const t2 = safeTanDeg(theta2, null);
    let major = null;
    if (t1 !== null && t2 !== null) major = Math.abs(h * (t2 - t1));
    const minor = 2 * slantDistance * Math.tan(degToRad(halfC90));

    const verticalStretch = major && minor ? major / Math.max(0.001, minor) : null;
    const relativeAxisFactor = Math.pow(cosTilt, 3);
    return {
        h,
        tilt,
        rotation: rotationAngle,
        beamC0,
        beamC90,
        halfC0,
        halfC90,
        offset,
        slantDistance,
        eBelow,
        eAxis,
        major,
        minor,
        verticalStretch,
        relativeAxisFactor
    };
}
