export function classifyDistribution(fwhmC0, fwhmC90, peakVAngle, fileName, tx) {
    let type = "Symmetric";
    let use = "Very narrow beam, high ceiling or high-intensity accent lighting";
    let useKey = "useSymNarrow";
    const warnings = [];

    const ratio = fwhmC0.angle / fwhmC90.angle;
    const isOval = ratio > 1.35 || ratio < 0.74;
    const nameLower = fileName.toLowerCase();

    // 1. 洗牆型 (Wallwash)
    if (peakVAngle > 6 || nameLower.includes('wallwash') || nameLower.includes('wash')) {
        type = "Wallwash";
        use = "Vertical surfaces, wallwashing and large display walls"; useKey = "useWallwash";
        if (peakVAngle < 4) {
            warnings.push({ code: "W_T_WW_SYM", msgKey: 'audit.wallwashMismatchDesc', msg: tx('audit.wallwashMismatchDesc') });
        }
    }
    // 2. 橢圓光型 (Oval Beam)
    else if (isOval || nameLower.includes('oval') || nameLower.includes('ellip') || nameLower.includes('15x60')) {
        type = "Oval";
        use = "Linear objects, corridors, retail shelving and sculpture accent lighting"; useKey = "useOval";
        if (!isOval) {
            warnings.push({ code: "W_T_OVAL_SYM", msgKey: 'audit.ovalMismatchDesc', msg: tx('audit.ovalMismatchDesc') });
        }
    }
    // 3. 一般對稱圓光 (Symmetric)
    else {
        type = "Symmetric";
        if (fwhmC0.angle < 15) {
            use = "Very narrow beam, high ceiling or high-intensity accent lighting"; useKey = "useSymNarrow";
        } else if (fwhmC0.angle < 28) {
            use = "Museums, galleries and premium retail accent lighting"; useKey = "useSymMedium";
        } else {
            use = "General low-glare downlighting and task-area support"; useKey = "useSymWide";
        }
    }

    return { type, use, useKey, warnings };
}
