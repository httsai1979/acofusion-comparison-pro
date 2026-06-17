export function buildAuditWarnings(file, deps) {
    const { tx, translateWarning } = deps;
    const warnings = (file.warnings || []).map(w => ({
        title: w.code || tx('parserWarning'),
        level: 'medium',
        desc: translateWarning(w)
    }));

    // 審查項 1：命名與光型的真實檢測
    const nameLower = file.fileName.toLowerCase();
    const isWallwash = file.classifiedType === "Wallwash";
    const isOval = file.classifiedType === "Oval";

    if (nameLower.includes('wallwash') && !isWallwash) {
        warnings.push({
            title: tx('audit.wallwashMismatchTitle'),
            level: "critical",
            desc: tx('audit.wallwashMismatchDesc')
        });
    }

    if (nameLower.includes('oval') && !isOval) {
        warnings.push({
            title: tx('audit.ovalMismatchTitle'),
            level: "high",
            desc: tx('audit.ovalMismatchDesc')
        });
    }

    // 審查項 2：功耗功率比對 (防呆)
    const expectedWatts = file.inputWatts;
    const numW = nameLower.match(/(\d+)w/);
    if (numW && numW[1]) {
        const parsedW = parseFloat(numW[1]);
        if (Math.abs(expectedWatts - parsedW) > 5) {
            warnings.push({
                title: tx('audit.wattageMismatchTitle'),
                level: "medium",
                desc: tx('audit.wattageMismatchDesc', { parsedW, expectedW: expectedWatts.toFixed(1) })
            });
        }
    }

    // 審查項 3：流明偏差防呆
    if (file.totalFlux < 50) {
        warnings.push({
            title: tx('audit.lowFluxTitle'),
            level: "high",
            desc: tx('audit.lowFluxDesc')
        });
    }
    return warnings;
}
