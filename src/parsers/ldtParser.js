export function parseLDT(text, fileName, deps) {
    const { tx, calculateFWHMForPlane, calculateTotalFlux, classifyDistribution } = deps;
    const rawLines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (rawLines.length < 30) throw new Error(tx('parser.ldtTooShort'));

    const numberFromLine = (idx, fallback = NaN) => {
        if (idx < 0 || idx >= rawLines.length) return fallback;
        const match = rawLines[idx].replace(',', '.').match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/);
        return match ? parseFloat(match[0]) : fallback;
    };
    const textFromLine = (idx, fallback = '') => (idx >= 0 && idx < rawLines.length ? rawLines[idx] : fallback);
    const numericValuesFromLines = (lines) => (lines.join(' ').replace(/,/g, '.').match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || []).map(Number).filter(Number.isFinite);

    const metadata = {
        FORMAT: 'EULUMDAT / LDT',
        MANUFAC: textFromLine(0, ''),
        LUMINAIRE: textFromLine(8, fileName),
        LUMCAT: textFromLine(9, ''),
        SOURCE_FILE: textFromLine(10, fileName),
        TESTDATE: textFromLine(11, '')
    };

    const warnings = [];
    const addWarn = (code, msg) => warnings.push({ code, msg });

    // Common EULUMDAT core fields, one item per line.
    // 0 manufacturer, 1 Ityp, 2 Isym, 3 Mc, 4 Dc, 5 Ng, 6 Dg.
    const numHorizontalAngles = Math.trunc(numberFromLine(3));
    const cPlaneStep = numberFromLine(4);
    const numVerticalAngles = Math.trunc(numberFromLine(5));
    const gammaStep = numberFromLine(6);

    if (!Number.isFinite(numHorizontalAngles) || !Number.isFinite(numVerticalAngles) || numHorizontalAngles <= 0 || numVerticalAngles <= 0) {
        throw new Error(tx('parser.ldtInvalidAngleCount'));
    }

    const length = numberFromLine(12, 0) / 1000;
    const width = numberFromLine(13, 0) / 1000;
    const height = numberFromLine(14, 0) / 1000;
    const multiplier = Number.isFinite(numberFromLine(23)) && numberFromLine(23) !== 0 ? numberFromLine(23) : 1;

    const lampSetCount = Math.max(1, Math.trunc(numberFromLine(25, 1)) || 1);
    const firstLampBlock = 26;
    const numLamps = numberFromLine(firstLampBlock, 1) || 1;
    const lumensPerLamp = numberFromLine(firstLampBlock + 2, 0) || 0;
    const inputWatts = numberFromLine(firstLampBlock + 5, 0) || 0;
    const totalDeclaredLampFlux = numLamps * lumensPerLamp;

    const verticalAngles = [];
    for (let i = 0; i < numVerticalAngles; i++) verticalAngles.push(Number.isFinite(gammaStep) && gammaStep > 0 ? i * gammaStep : i);

    const horizontalAngles = [];
    for (let i = 0; i < numHorizontalAngles; i++) horizontalAngles.push(Number.isFinite(cPlaneStep) && cPlaneStep > 0 ? i * cPlaneStep : i);

    const requiredCandelaValues = numHorizontalAngles * numVerticalAngles;
    const likelyMatrixStartLine = firstLampBlock + lampSetCount * 6;
    let intensityTokens = [];
    let matrixSource = 'after lamp block';

    // Preferred path: standard EULUMDAT intensity matrix begins after all lamp-set blocks.
    const numericAfterLampBlock = numericValuesFromLines(rawLines.slice(likelyMatrixStartLine));
    if (numericAfterLampBlock.length >= requiredCandelaValues) {
        intensityTokens = numericAfterLampBlock.slice(0, requiredCandelaValues);
        if (numericAfterLampBlock.length > requiredCandelaValues) {
            addWarn('W_LDT_TRAILING_NUMERIC_DATA', 'LDT 在光強矩陣後仍有額外數字資料；已優先讀取 lamp block 後第一組完整矩陣。');
        }
    } else {
        // Fallback for vendor variants: scan numeric content after line 26, then last N numeric values.
        const numericAfterHeader = numericValuesFromLines(rawLines.slice(firstLampBlock));
        if (numericAfterHeader.length >= requiredCandelaValues) {
            intensityTokens = numericAfterHeader.slice(-requiredCandelaValues);
            matrixSource = 'fallback last numeric block';
            addWarn('W_LDT_MATRIX_FALLBACK', 'LDT 格式與標準 EULUMDAT lamp block 位置不完全一致；已使用最後一組完整數字矩陣作為光強資料，建議用原廠 LDT 樣本核對。');
        } else {
            throw new Error(tx('parser.ldtMatrixIncomplete'));
        }
    }

    // EULUMDAT commonly stores luminous intensities as cd/klm. Convert to actual candela when lamp flux is available.
    const ldtCandelaScale = multiplier * (totalDeclaredLampFlux > 0 ? totalDeclaredLampFlux / 1000 : 1);

    const candelaMatrix = [];
    let maxIntensity = 0;
    let peakHIndex = 0;
    let peakVIndex = 0;
    let idx = 0;

    for (let h = 0; h < numHorizontalAngles; h++) {
        const row = [];
        for (let v = 0; v < numVerticalAngles; v++) {
            const raw = Number.isFinite(intensityTokens[idx]) ? intensityTokens[idx] : 0;
            const val = Math.max(0, raw * ldtCandelaScale);
            row.push(val);
            if (val > maxIntensity) {
                maxIntensity = val;
                peakHIndex = h;
                peakVIndex = v;
            }
            idx++;
        }
        candelaMatrix.push(row);
    }

    metadata.MATRIX_SOURCE = matrixSource;
    metadata.LAMP_SETS = String(lampSetCount);
    metadata.LDT_INTENSITY_UNIT = totalDeclaredLampFlux > 0 ? 'cd/klm converted to cd' : 'raw numeric intensity, flux unavailable';

    const fwhmC0 = calculateFWHMForPlane(candelaMatrix, verticalAngles, horizontalAngles, 0, 180);
    const fwhmC90 = calculateFWHMForPlane(candelaMatrix, verticalAngles, horizontalAngles, 90, 270);
    const totalFlux = calculateTotalFlux(candelaMatrix, verticalAngles, horizontalAngles);
    const typeInfo = classifyDistribution(fwhmC0, fwhmC90, verticalAngles[peakVIndex] || 0, fileName);

    warnings.push(...(typeInfo.warnings || []));
    if (lampSetCount > 1) addWarn('W_LDT_MULTI_LAMP_SET', 'LDT 檔案包含多組 lamp set；目前僅讀取第一組主要燈源資料作為規格摘要。');
    if (!Number.isFinite(cPlaneStep) || !Number.isFinite(gammaStep)) addWarn('W_LDT_ANGLE_STEP', 'LDT 角度步距資料不完整；角度軸可能僅為近似。');
    if (numHorizontalAngles === 1) addWarn('W_LDT_SINGLE_CPLANE', 'LDT 僅包含單一 C-plane；極座標與總流明推估將依軸對稱處理。');
    if (totalDeclaredLampFlux <= 0) addWarn('W_LDT_NO_DECLARED_FLUX', 'LDT 未提供可用燈泡流明；光強矩陣將以原始數值處理，可能不是實際 candela。');
    if (cPlaneStep > 0 && Math.abs((numHorizontalAngles - 1) * cPlaneStep - 360) > 20 && Math.abs((numHorizontalAngles) * cPlaneStep - 360) > 20 && numHorizontalAngles > 1) {
        addWarn('W_LDT_CPLANE_COVERAGE', 'LDT C-plane 覆蓋範圍不是典型完整 360° 或對稱片段；請人工核對總流明與 polar overlay。');
    }

    return {
        fileName, metadata, numLamps, lumensPerLamp, multiplier,
        numVerticalAngles, numHorizontalAngles, photometricType: 1, unitsType: 2,
        width, length, height, ballastFactor: 1, ballastLampFactor: 1, inputWatts,
        verticalAngles, horizontalAngles, candelaMatrix, maxIntensity,
        peakHIndex, peakVIndex, fwhmC0, fwhmC90, totalFlux,
        classifiedType: typeInfo.type, suggestedUse: typeInfo.use, suggestedUseKey: typeInfo.useKey, warnings
    };
}
