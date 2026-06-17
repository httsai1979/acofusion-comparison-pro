/**
 * acofusion-comparison-pro - Comparison UI Renderer
 * Integrates Apple HIG Aesthetic Metric Cards, Micro-visualizations, and Cross-Highlighting
 */

export function renderComparison(context) {
    const {
        loadedIesFiles,
        activeFileIndex,
        comparisonSortKey,
        comparisonSortDirection,
        tx,
        escapeHTML,
        localizedUse,
        getSortedComparisonFiles,
        updateComparisonCount,
        applyComparisonColumnVisibility,
        setActiveFileIndex,
        updateFileList,
        renderReport,
        renderPolarOverlay,
        viewSpecFromComparison,
        removeFromComparison,
        deleteFile
    } = context;

    const matrixBody = document.getElementById('comparison-matrix-body');
    if (!matrixBody) return;
    matrixBody.innerHTML = '';
    updateComparisonCount();

    // Synchronize toolbar states
    const sortSelect = document.getElementById('comparison-sort-select');
    if (sortSelect && sortSelect.value !== comparisonSortKey) {
        sortSelect.value = comparisonSortKey;
    }
    const sortBtn = document.getElementById('comparison-sort-direction');
    if (sortBtn) {
        sortBtn.innerText = comparisonSortDirection === 'asc' ? tx('asc') : tx('desc');
    }

    const comparisonFiles = getSortedComparisonFiles();

    // Dynamically handle the Metric Dashboard container
    let metricsDashboard = document.getElementById('comparison-metrics-dashboard');
    if (comparisonFiles.length === 0) {
        if (metricsDashboard) metricsDashboard.style.display = 'none';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="9" class="py-8 px-4 text-center text-slate-500 bg-slate-50">
                <div class="font-bold text-slate-700 mb-1">${tx('comparison.emptyTitle')}</div>
                <div class="text-xs">請在左側 IES / LDT 檔案列表中開啟 Compare，將檔案加入 Multi Comparison Dashboard。</div>
            </td>
        `;
        matrixBody.appendChild(tr);
        applyComparisonColumnVisibility();
        return;
    }

    if (!metricsDashboard) {
        metricsDashboard = document.createElement('div');
        metricsDashboard.id = 'comparison-metrics-dashboard';
        metricsDashboard.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 transition-all duration-300';
        const controls = document.getElementById('comparison-controls');
        if (controls) {
            controls.parentNode.insertBefore(metricsDashboard, controls.nextSibling);
        }
    } else {
        metricsDashboard.style.display = 'grid';
    }

    // --- REQUIREMENT 1: Metric Dashboard (精緻指標卡片) ---
    // Compute max/min values & statistics for dashboard
    let maxFluxFile = null;
    let maxEffFile = null;
    let maxEffValue = -1;
    let minBeamAngle = Infinity;
    let maxBeamAngle = -Infinity;
    let minBeamFile = null;
    let maxBeamFile = null;

    let totalFluxSum = 0;
    let totalEffSum = 0;
    let totalBeamSum = 0;
    let validEffCount = 0;

    comparisonFiles.forEach(file => {
        const watts = file.inputWatts > 0 ? file.inputWatts : 0;
        const efficacy = watts > 0 ? file.totalFlux / watts : 0;
        const beam0 = Math.round(file.fwhmC0?.angle || 0);

        // Flux (Lumens)
        totalFluxSum += file.totalFlux;
        if (!maxFluxFile || file.totalFlux > maxFluxFile.totalFlux) {
            maxFluxFile = file;
        }

        // Efficacy
        if (watts > 0) {
            totalEffSum += efficacy;
            validEffCount++;
            if (efficacy > maxEffValue) {
                maxEffValue = efficacy;
                maxEffFile = file;
            }
        }

        // Beam Angle
        totalBeamSum += beam0;
        if (beam0 < minBeamAngle) {
            minBeamAngle = beam0;
            minBeamFile = file;
        }
        if (beam0 > maxBeamAngle) {
            maxBeamAngle = beam0;
            maxBeamFile = file;
        }
    });

    const avgFlux = totalFluxSum / comparisonFiles.length;
    const avgEff = validEffCount > 0 ? totalEffSum / validEffCount : 0;
    const avgBeam = totalBeamSum / comparisonFiles.length;

    // Build the dashboard HTML using Apple HIG card styling
    metricsDashboard.innerHTML = `
        <!-- Card 1: Peak Lumens -->
        <div class="metric-pill border border-slate-200 p-5 rounded-xl bg-white flex flex-col justify-between hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">🏆 Peak Lumens</span>
                <h3 class="text-2xl font-black text-slate-900 leading-none mb-1">
                    ${maxFluxFile ? Math.round(maxFluxFile.totalFlux).toLocaleString() : 'N/A'} <span class="text-xs font-semibold text-slate-500">lm</span>
                </h3>
                <p class="text-[11px] text-slate-500 truncate mb-3" title="${maxFluxFile ? escapeHTML(maxFluxFile.fileName) : ''}">
                    ${maxFluxFile ? escapeHTML(maxFluxFile.fileName) : 'No data'}
                </p>
            </div>
            <div class="border-t border-slate-100 pt-2 mt-2 flex justify-between items-center text-[11px]">
                <span class="text-slate-400">Average:</span>
                <span class="font-bold text-slate-700">${Math.round(avgFlux).toLocaleString()} lm</span>
            </div>
        </div>

        <!-- Card 2: Peak Efficacy -->
        <div class="metric-pill border border-slate-200 p-5 rounded-xl bg-white flex flex-col justify-between hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">⚡ Max Efficacy</span>
                <h3 class="text-2xl font-black text-[#8ac43f] leading-none mb-1">
                    ${maxEffFile ? maxEffValue.toFixed(1) : 'N/A'} <span class="text-xs font-semibold text-slate-500">lm/W</span>
                </h3>
                <p class="text-[11px] text-slate-500 truncate mb-3" title="${maxEffFile ? escapeHTML(maxEffFile.fileName) : ''}">
                    ${maxEffFile ? escapeHTML(maxEffFile.fileName) : 'No data'}
                </p>
            </div>
            <div class="border-t border-slate-100 pt-2 mt-2 flex justify-between items-center text-[11px]">
                <span class="text-slate-400">Average:</span>
                <span class="font-bold text-slate-700">${avgEff.toFixed(1)} lm/W</span>
            </div>
        </div>

        <!-- Card 3: Beam Angle Spread -->
        <div class="metric-pill border border-slate-200 p-5 rounded-xl bg-white flex flex-col justify-between hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">🎯 Beam Spread Range</span>
                <h3 class="text-2xl font-black text-blue-600 leading-none mb-1">
                    ${minBeamAngle !== Infinity ? `${minBeamAngle}° - ${maxBeamAngle}°` : 'N/A'}
                </h3>
                <p class="text-[11px] text-slate-500 truncate mb-3" title="Narrowest: ${minBeamFile ? minBeamFile.fileName : ''}">
                    ${minBeamFile ? `Narrowest: ${minBeamAngle}° (${minBeamFile.classifiedType})` : 'No data'}
                </p>
            </div>
            <div class="border-t border-slate-100 pt-2 mt-2 flex justify-between items-center text-[11px]">
                <span class="text-slate-400">Average:</span>
                <span class="font-bold text-slate-700">${Math.round(avgBeam)}°</span>
            </div>
        </div>
    `;

    // --- REQUIREMENT 2: Micro-visualizations (微視覺化提示) ---
    // Compute max values for table columns
    const maxWatts = Math.max(...comparisonFiles.map(f => f.inputWatts > 0 ? f.inputWatts : 0), 1);
    const maxFlux = Math.max(...comparisonFiles.map(f => f.totalFlux), 1);
    const maxEff = Math.max(...comparisonFiles.map(f => f.inputWatts > 0 ? f.totalFlux / f.inputWatts : 0), 1);
    const maxCbcp = Math.max(...comparisonFiles.map(f => f.maxIntensity), 1);

    comparisonFiles.forEach((file) => {
        const index = loadedIesFiles.indexOf(file);
        const watts = file.inputWatts > 0 ? file.inputWatts : 0;
        const efficacy = watts > 0 ? file.totalFlux / watts : 0;
        const wattsText = watts > 0 ? watts.toFixed(1) : 'N/A';
        const effText = watts > 0 ? efficacy.toFixed(1) : 'N/A';

        // Percentage calculations for relative progress bars
        const wattsPct = (watts / maxWatts) * 100;
        const fluxPct = (file.totalFlux / maxFlux) * 100;
        const effPct = (efficacy / maxEff) * 100;
        const cbcpPct = (file.maxIntensity / maxCbcp) * 100;

        const tr = document.createElement('tr');
        tr.dataset.fileId = file.id; // Key for cross-highlight correlation
        tr.className = `transition-all duration-200 cursor-pointer ${
            index === activeFileIndex ? 'bg-amber-500/10' : ''
        }`;

        tr.innerHTML = `
            <td data-col="file" class="py-3 px-3 font-semibold text-slate-900 max-w-[200px]" title="${escapeHTML(file.fileName)}">
                <div class="flex items-center space-x-1.5 min-w-0">
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                        ${escapeHTML(file.fileFormat || 'IES')}
                    </span>
                    <span class="truncate block font-semibold text-slate-800">${escapeHTML(file.fileName)}</span>
                </div>
            </td>
            <td data-col="type" class="py-3 px-2 font-bold text-amber-600">${escapeHTML(file.classifiedType)}</td>
            
            <td data-col="watts" class="py-3 px-2 text-right font-bold">
                <div class="inline-block text-right">
                    <span class="tech-val">${wattsText}</span>
                    ${watts > 0 ? `
                    <div class="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-0.5">
                        <div class="bg-slate-400 h-full rounded-full" style="width: ${wattsPct}%"></div>
                    </div>` : ''}
                </div>
            </td>
            
            <td data-col="flux" class="py-3 px-2 text-right font-bold">
                <div class="inline-block text-right">
                    <span class="tech-val">${Math.round(file.totalFlux).toLocaleString()}</span>
                    <div class="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-0.5">
                        <div class="bg-blue-500 h-full rounded-full" style="width: ${fluxPct}%"></div>
                    </div>
                </div>
            </td>
            
            <td data-col="eff" class="py-3 px-2 text-right font-bold text-emerald-600">
                <div class="inline-block text-right">
                    <span class="tech-val">${effText}</span>
                    ${watts > 0 ? `
                    <div class="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-0.5">
                        <div class="bg-[#8ac43f] h-full rounded-full" style="width: ${effPct}%"></div>
                    </div>` : ''}
                </div>
            </td>
            
            <td data-col="cbcp" class="py-3 px-2 text-right font-bold">
                <div class="inline-block text-right">
                    <span class="tech-val">${Math.round(file.maxIntensity).toLocaleString()}</span>
                    <div class="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-0.5">
                        <div class="bg-purple-500 h-full rounded-full" style="width: ${cbcpPct}%"></div>
                    </div>
                </div>
            </td>
            
            <td data-col="ba" class="py-3 px-3 text-right font-semibold text-blue-600">
                <span class="tech-val">${Math.round(file.fwhmC0.angle)}° / ${Math.round(file.fwhmC90.angle)}°</span>
            </td>
            
            <td data-col="use" class="py-3 px-3 text-xs text-slate-500 max-w-[180px] truncate" title="${escapeHTML(localizedUse(file))}">
                ${escapeHTML(localizedUse(file))}
            </td>
            
            <td class="py-3 px-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="viewSpecFromComparison(${index}, event)" class="text-[9px] px-2 py-1 rounded bg-slate-900 text-white hover:bg-slate-700 transition">View</button>
                    <button onclick="removeFromComparison(${index}, event)" class="text-[9px] px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 transition">Remove</button>
                    <button onclick="deleteFile(${index}, event)" class="text-[9px] px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition">Delete</button>
                </div>
            </td>
        `;

        // Click row activates spec
        tr.addEventListener('click', () => {
            setActiveFileIndex(index);
            updateFileList();
            renderReport(index);
            renderComparison(context);
            renderPolarOverlay();
        });

        // --- REQUIREMENT 3: Cross-Highlighting (清單與圖表聯動) ---
        tr.addEventListener('mouseenter', () => {
            tr.classList.add('bg-slate-100');
            const fileItem = document.querySelector(`#file-list div[data-file-id="${file.id}"]`);
            if (fileItem) {
                fileItem.classList.add('scale-[1.02]', 'shadow-sm');
                fileItem.style.borderColor = 'var(--accent)';
                fileItem.style.backgroundColor = 'var(--soft)';
            }
        });

        tr.addEventListener('mouseleave', () => {
            tr.classList.remove('bg-slate-100');
            const fileItem = document.querySelector(`#file-list div[data-file-id="${file.id}"]`);
            if (fileItem) {
                fileItem.classList.remove('scale-[1.02]', 'shadow-sm');
                fileItem.style.borderColor = '';
                fileItem.style.backgroundColor = '';
            }
        });

        matrixBody.appendChild(tr);
    });

    applyComparisonColumnVisibility();
}
