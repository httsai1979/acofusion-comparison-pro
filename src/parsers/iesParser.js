export function parseIES(text, fileName, deps) {
    const { tx, calculateFWHMForPlane, calculateTotalFlux, classifyDistribution } = deps;
    const lines = text.split(/\r?\n/);
    const tokens = [];
    let index = 0;
    const metadata = {};
    const warnings = [];

    while (index < lines.length) {
        let line = lines[index].trim();
        if (line.startsWith('IESNA')) {
            metadata['IES'] = line;
            index++;
            continue;
        }
        if (line.startsWith('[')) {
            const match = line.match(/^\[([^\]]+)\]\s*(.*)$/);
            if (match) metadata[match[1].trim().toUpperCase()] = match[2].trim();
            index++;
            continue;
        }
        if (line.toUpperCase().startsWith('TILT=')) {
            const tiltMode = line.toUpperCase().replace('TILT=', '').trim();
            metadata['TILT'] = tiltMode;
            if (tiltMode !== 'NONE') {
                warnings.push({ code: 'W_IES_TILT_NOT_NONE', msg: 'IES 檔案包含 TILT 資料；目前工具以主要 candela matrix 作比較用途，未執行完整 TILT 表修正。' });
            }
            index++;
            break;
        }
        index++;
    }

    for (let i = index; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line) tokens.push(...line.split(/\s+/));
    }

    const readNumber = (label) => {
        if (tIdx >= tokens.length) throw new Error(tx('parser.iesMissingNumeric', { label }));
        const value = parseFloat(tokens[tIdx++]);
        if (!Number.isFinite(value)) throw new Error(tx('parser.iesInvalidNumeric', { label }));
        return value;
    };
    const readInteger = (label) => Math.trunc(readNumber(label));

    let tIdx = 0;
    const numLamps = readNumber('number of lamps');
    const lumensPerLamp = readNumber('lumens per lamp');
    const multiplier = readNumber('candela multiplier');
    const numVerticalAngles = readInteger('number of vertical angles');
    const numHorizontalAngles = readInteger('number of horizontal angles');
    const photometricType = readInteger('photometric type');
    const unitsType = readInteger('units type');
    const width = readNumber('width');
    const length = readNumber('length');
    const height = readNumber('height');
    const ballastFactor = readNumber('ballast factor');
    const ballastLampFactor = readNumber('ballast-lamp photometric factor');
    const inputWatts = readNumber('input watts');

    if (numVerticalAngles <= 0 || numHorizontalAngles <= 0) throw new Error(tx('parser.iesAngleCountsPositive'));
    if (tokens.length < 13 + numVerticalAngles + numHorizontalAngles + numVerticalAngles * numHorizontalAngles) {
        throw new Error(tx('parser.iesMatrixIncomplete'));
    }

    const verticalAngles = [];
    for (let i = 0; i < numVerticalAngles; i++) verticalAngles.push(readNumber('vertical angle'));

    const horizontalAngles = [];
    for (let i = 0; i < numHorizontalAngles; i++) horizontalAngles.push(readNumber('horizontal angle'));

    const candelaScale = multiplier * (Number.isFinite(ballastFactor) ? ballastFactor : 1) * (Number.isFinite(ballastLampFactor) ? ballastLampFactor : 1);
    const candelaMatrix = [];
    let maxIntensity = 0;
    let peakHIndex = 0;
    let peakVIndex = 0;

    for (let h = 0; h < numHorizontalAngles; h++) {
        const row = [];
        for (let v = 0; v < numVerticalAngles; v++) {
            const raw = readNumber('candela value');
            const val = raw * candelaScale;
            row.push(val);
            if (val > maxIntensity) {
                maxIntensity = val;
                peakHIndex = h;
                peakVIndex = v;
            }
        }
        candelaMatrix.push(row);
    }

    const fwhmC0 = calculateFWHMForPlane(candelaMatrix, verticalAngles, horizontalAngles, 0, 180);
    const fwhmC90 = calculateFWHMForPlane(candelaMatrix, verticalAngles, horizontalAngles, 90, 270);
    const totalFlux = calculateTotalFlux(candelaMatrix, verticalAngles, horizontalAngles);
    const typeInfo = classifyDistribution(fwhmC0, fwhmC90, verticalAngles[peakVIndex] || 0, fileName);

    return {
        fileName, metadata, numLamps, lumensPerLamp, multiplier,
        numVerticalAngles, numHorizontalAngles, photometricType, unitsType,
        width, length, height, ballastFactor, ballastLampFactor, inputWatts,
        verticalAngles, horizontalAngles, candelaMatrix, maxIntensity,
        peakHIndex, peakVIndex, fwhmC0, fwhmC90, totalFlux,
        classifiedType: typeInfo.type, suggestedUse: typeInfo.use, suggestedUseKey: typeInfo.useKey,
        warnings: [...warnings, ...(typeInfo.warnings || [])]
    };
}

export function validateParsedPhotometricFile(file, tx) {
    const warnings = [];
    const fmt = file.fileFormat || 'IES';
    const add = (code, msgKey, params = {}) => warnings.push({ code, msgKey, msgParams: params, msg: tx(msgKey, params) });

    if (!Array.isArray(file.verticalAngles) || file.verticalAngles.length !== file.numVerticalAngles) add('W_ANGLE_VERTICAL_COUNT', 'warning.verticalAngleCount', { fmt });
    if (!Array.isArray(file.horizontalAngles) || file.horizontalAngles.length !== file.numHorizontalAngles) add('W_ANGLE_HORIZONTAL_COUNT', 'warning.horizontalAngleCount', { fmt });
    if (!Array.isArray(file.candelaMatrix) || file.candelaMatrix.length !== file.numHorizontalAngles) add('W_MATRIX_H_COUNT', 'warning.matrixHorizontalCount', { fmt });
    if (Array.isArray(file.candelaMatrix)) {
        file.candelaMatrix.forEach((row, idx) => {
            if (!Array.isArray(row) || row.length !== file.numVerticalAngles) add('W_MATRIX_V_COUNT', 'warning.matrixVerticalCount', { fmt, row: idx + 1 });
            if (Array.isArray(row) && row.some(v => !Number.isFinite(v))) add('W_MATRIX_NAN', 'warning.matrixNaN', { fmt });
        });
    }
    if (!Number.isFinite(file.maxIntensity) || file.maxIntensity <= 0) add('W_PEAK_INTENSITY', 'warning.peakIntensity', { fmt });
    if (!Number.isFinite(file.totalFlux) || file.totalFlux <= 0) add('W_TOTAL_FLUX', 'warning.totalFlux', { fmt });
    if (!Number.isFinite(file.inputWatts) || file.inputWatts <= 0) add('W_INPUT_WATTS', 'warning.inputWatts', { fmt });

    const hAngles = file.horizontalAngles || [];
    const vAngles = file.verticalAngles || [];
    const monotonic = arr => arr.every((v, i) => i === 0 || v >= arr[i - 1]);
    if (hAngles.length > 1 && !monotonic(hAngles)) add('W_H_ANGLE_ORDER', 'warning.horizontalAngleOrder', { fmt });
    if (vAngles.length > 1 && !monotonic(vAngles)) add('W_V_ANGLE_ORDER', 'warning.verticalAngleOrder', { fmt });
    if (hAngles.length > 1) {
        const hSpan = hAngles[hAngles.length - 1] - hAngles[0];
        if (![0, 90, 180, 360].some(span => Math.abs(hSpan - span) < 5)) add('W_H_COVERAGE', 'warning.horizontalCoverage', { fmt });
    }

    const declaredFlux = (Number(file.numLamps) || 0) * (Number(file.lumensPerLamp) || 0);
    if (declaredFlux > 0 && Number.isFinite(file.totalFlux)) {
        const diffRatio = Math.abs(file.totalFlux - declaredFlux) / declaredFlux;
        if (diffRatio > 0.25) add('W_FLUX_DECLARED_DIFF', 'warning.fluxDeclaredDiff', { calculated: Math.round(file.totalFlux), declared: Math.round(declaredFlux) });
    }
    if (file.metadata && file.metadata.NEARFIELD !== undefined) add('W_NEARFIELD_PRESENT', 'warning.nearfieldPresent', { fmt });
    return warnings;
}
