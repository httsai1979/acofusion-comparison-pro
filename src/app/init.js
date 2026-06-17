import JSZip from "jszip";
import { parseIES, validateParsedPhotometricFile } from "../parsers/iesParser.js";
import { parseLDT } from "../parsers/ldtParser.js";
import { calculateFWHMForPlane, calculateTotalFlux, getIntensityAtAngle } from "../photometry/calculations.js";
import { classifyDistribution as classifyDistributionCore } from "../photometry/classification.js";
import { computeAimingMetrics as computeAimingMetricsCore } from "../photometry/aiming.js";
import { buildAuditWarnings } from "../photometry/auditRules.js";
import { locales as DICT } from "../i18n/index.js";
import { BRAND } from "../config/brand.js";
import { renderComparison } from "../ui/renderComparison.js";
import { drawPolarToCanvas, renderPolarOverlay as renderPolarOverlayChart } from "../charts/polarCanvas.js";
import "../styles/main.css";

function applyBrand() {
    const logo = document.getElementById('brand-logo');
    if (logo) {
        logo.src = BRAND.logoPath;
        logo.alt = `${BRAND.companyName} logo`;
    }
    const toolName = document.getElementById('brand-tool-name');
    if (toolName) toolName.innerText = BRAND.toolName;
    const tagline = document.getElementById('brand-tagline');
    if (tagline) tagline.innerText = BRAND.tagline;
    const footerCompany = document.getElementById('footer-company');
    if (footerCompany) footerCompany.innerText = BRAND.companyName;
    const footerWebsite = document.getElementById('footer-website');
    if (footerWebsite) {
        footerWebsite.href = BRAND.website;
        footerWebsite.innerText = BRAND.website;
    }
    const footerEmail = document.getElementById('footer-email');
    if (footerEmail) {
        footerEmail.href = `mailto:${BRAND.email}`;
        footerEmail.innerText = BRAND.email;
    }
    const reportBrandContact = document.getElementById('report-brand-contact');
    if (reportBrandContact) reportBrandContact.innerText = `${BRAND.companyName} | ${BRAND.website} | ${BRAND.email} | v${BRAND.toolVersion}`;
}

function brandMetadataLines(prefix = '') {
    return [
        `${prefix}Company: ${BRAND.companyName}`,
        `${prefix}Website: ${BRAND.website}`,
        `${prefix}Email: ${BRAND.email}`,
        `${prefix}Tool: ${BRAND.toolName}`,
        `${prefix}Version: ${BRAND.toolVersion}`
    ].join('\n');
}
function tx(key, params = {}, fallback = '') {
            const dict = DICT[currentLang] || DICT.en;
            let value = dict[key] ?? DICT.en[key] ?? fallback ?? key;
            Object.entries(params).forEach(([k, v]) => value = String(value).replaceAll("{"+k+"}", v));
            return value;
        }

        function localizedUse(file) {
            if (!file) return '';
            if (file.suggestedUseKey) return tx(file.suggestedUseKey);
            return file.suggestedUse || '';
        }

        function translateWarning(w) {
            if (!w) return '';
            const warningKeyMap = {
                W_COLOUR_CCT_MISSING: 'warning.colourCctMissing',
                W_COLOUR_CRI_MISSING: 'warning.colourCriMissing'
            };
            const key = warningKeyMap[w.code];
            return w.msgKey ? tx(w.msgKey, w.msgParams || {}) : (key ? tx(key) : (w.msg || String(w)));
        }


        let currentLang = "zh-Hant";
        let currentMode = "factory"; // data package export mode 或 pro
        let activeTab = "single";    // single, compare, audit

        // --- 預載預設 IES 數據 (S71-3 Wallwash) ---
        const DEFAULT_IES_NAME = "S71-3 3535 4000K CIR97 50W Wallwash.IES";
        const DEFAULT_IES_CONTENT = `IESNA:LM-63-1995
[TEST] S71-3 3535 4000K CIR97 50W Wallwash
[TESTLAB] 
[TESTDATE] 2023-12-20
[ISSUEDATE] 2023-12-21 09:12:06
[NEARFIELD] 
[LAMPPOSITION] 0,0
[OTHER] EVERFINE GO-2000A_V1 SYSTEM
[MANUFAC] 
[LUMCAT] 
TILT=NONE
1 2335.8 1 91 5 1 2 0.000 0.000 0.000
1.000 1 46.2965
0.0    1.0    2.0    3.0    4.0    5.0    6.0    7.0    8.0    9.0    
 10.0   11.0   12.0   13.0   14.0   15.0   16.0   17.0   18.0   19.0   
 20.0   21.0   22.0   23.0   24.0   25.0   26.0   27.0   28.0   29.0   
 30.0   31.0   32.0   33.0   34.0   35.0   36.0   37.0   38.0   39.0   
 40.0   41.0   42.0   43.0   44.0   45.0   46.0   47.0   48.0   49.0   
 50.0   51.0   52.0   53.0   54.0   55.0   56.0   57.0   58.0   59.0   
 60.0   61.0   62.0   63.0   64.0   65.0   66.0   67.0   68.0   69.0   
 70.0   71.0   72.0   73.0   74.0   75.0   76.0   77.0   78.0   79.0   
 80.0   81.0   82.0   83.0   84.0   85.0   86.0   87.0   88.0   89.0   
 90.0   
0.0    90.0   180.0  270.0  360.0  
4208.80  4109.99  4014.24  3921.62  3823.76  3726.59  3625.32  3525.18  3417.12  3305.81  
 3189.31  3061.28  2933.39  2814.93  2699.14  2582.93  2467.64  2354.39  2240.63  2127.30  
 2012.93  1897.29  1780.64  1662.00  1543.04  1422.26  1304.83  1188.11  1074.84  967.03   
 866.60   772.24   685.80   608.87   539.03   477.77   424.73   377.27   336.58   301.55   
 272.53   243.59   220.80   201.05   183.65   168.64   155.40   143.77   133.39   124.13   
 115.93   108.50   101.85   95.75    90.18    85.09    80.39    76.00    71.87    68.02    
 64.34    60.86    57.52    54.28    51.20    48.21    45.29    42.52    39.78    37.13    
 34.54    32.04    29.61    27.24    24.97    22.75    20.64    18.72    16.86    15.03    
 13.18    11.35    9.56     8.07     6.71     5.47     4.59     4.27     4.04     3.83     
 3.78     
4180.79  4224.50  4255.15  4268.79  4260.89  4237.44  4189.67  4130.83  4048.62  3957.49  
 3852.09  3735.59  3606.19  3469.93  3319.29  3162.19  2971.02  2779.73  2580.04  2372.51  
 2157.15  1938.62  1723.72  1518.40  1325.72  1150.04  994.69   858.87   740.82   641.75   
 558.41   487.76   428.78   378.60   337.19   301.86   273.77   245.68   224.15   205.46   
 189.14   174.88   162.66   151.62   142.09   133.55   125.84   118.88   112.58   106.86   
 101.56   96.61    92.14    87.76    83.81    80.04    76.33    72.94    69.59    66.38    
 63.23    60.15    57.19    54.10    51.22    48.30    45.46    42.69    39.96    37.26    
 34.65    32.18    29.71    27.40    25.18    23.06    21.02    19.16    17.31    15.41    
 13.51    11.68    10.09    8.61     7.24     6.24     5.59     5.29     5.01     4.79     
 4.74     
4208.80  4304.27  4398.06  4490.61  4576.55  4655.13  4721.15  4774.27  4812.92  4822.80  
 4809.59  4761.21  4675.66  4547.44  4370.53  4147.40  3882.12  3585.17  3261.15  2927.45  
 2594.59  2271.34  1974.08  1704.54  1466.57  1268.60  1071.04  919.79   793.12   686.10   
 596.58   521.78   459.00   405.99   361.34   323.70   291.34   263.76   239.89   219.67   
 201.86   186.17   172.74   160.83   150.27   141.30   132.34   124.84   118.05   111.91   
 106.23   101.02   96.19    91.65    87.41    83.44    79.64    75.96    72.48    69.11    
 65.85    62.65    59.49    56.39    53.34    50.29    47.33    44.40    41.58    38.76    
 35.98    33.34    30.74    28.21    25.79    23.49    21.31    19.31    17.44    15.57    
 13.54    11.71    10.24    8.75     7.23     6.28     5.65     5.37     5.12     4.91     
 4.79     
4180.79  4122.02  4046.67  3964.27  3866.60  3761.14  3643.66  3519.74  3388.06  3249.94  
 3113.07  2977.01  2835.95  2700.52  2570.29  2441.29  2317.07  2197.19  2079.71  1961.68  
 1844.97  1726.89  1609.50  1491.11  1375.70  1256.56  1137.37  1031.07  931.26   838.38   
 752.05   674.58   602.87   540.38   483.75   433.25   389.52   350.21   315.84   285.61   
 259.28   235.77   215.35   197.26   181.09   167.16   154.48   143.63   132.78   123.80   
 115.65   108.13   101.39   95.25    89.59    84.40    79.60    75.07    70.92    67.03    
 63.33    59.78    56.49    53.27    50.12    47.05    44.16    41.31    38.55    35.86    
 33.23    30.72    28.33    25.99    23.77    21.65    19.67    17.80    16.09    14.40    
 12.66    10.95    9.44     8.07     6.76     5.63     4.76     4.35     4.12     3.93     
 3.79     
4208.80  4109.99  4014.24  3921.62  3823.76  3726.59  3625.32  3525.18  3417.12  3305.81  
 3189.31  3061.28  2933.39  2814.93  2699.14  2582.93  2467.64  2354.39  2240.63  2127.30  
 2012.93  1897.29  1780.64  1662.00  1543.04  1422.26  1304.83  1188.11  1074.84  967.03   
 866.60   772.24   685.80   608.87   539.03   477.77   424.73   377.27   336.58   301.55   
 272.53   243.59   220.80   201.05   183.65   168.64   155.40   143.77   133.39   124.13   
 115.93   108.50   101.85   95.75    90.18    85.09    80.39    76.00    71.87    68.02    
 64.34    60.86    57.52    54.28    51.20    48.21    45.29    42.52    39.78    37.13    
 34.54    32.04    29.61    27.24    24.97    22.75    20.64    18.72    16.86    15.03    
 13.18    11.35    9.56     8.07     6.71     5.47     4.59     4.27     4.04     3.83     
 3.78     
`;

        // --- 全域狀態管理 ---
        let loadedIesFiles = []; // 儲存多個已解析的物件
        let activeFileIndex = -1; // 當前聚焦的規格書
        let ceilingHeight = 5.0;  // 安裝高度
        let tiltAngle = 0;        // 仰角 (0 ~ 60)
        let rotationAngle = 0;    // 水平旋轉角 (0 ~ 360)
        let fileUidCounter = 0;   // 穩定檔案 ID，用於 Master List 與 Comparison Set 雙向連動
        let comparisonSortKey = "fileName";
        let comparisonSortDirection = "asc";

        function createFileId(fileName) {
            fileUidCounter += 1;
            return `${Date.now()}_${fileUidCounter}_${fileName.replace(/[^a-z0-9]+/gi, '_')}`;
        }

        function getComparisonFiles() {
            return loadedIesFiles.filter(file => file.includedInComparison !== false);
        }

        function updateComparisonCount() {
            const el = document.getElementById('comparison-count');
            if (el) {
                el.innerText = tx("compared", { selected: getComparisonFiles().length, total: loadedIesFiles.length });
            }
        }

        function getFileMetric(file, key) {
            const watts = file.inputWatts > 0 ? file.inputWatts : 0;
            switch (key) {
                case 'fileName': return String(file.fileName || '').toLowerCase();
                case 'classifiedType': return String(file.classifiedType || '').toLowerCase();
                case 'inputWatts': return watts;
                case 'totalFlux': return Number(file.totalFlux) || 0;
                case 'efficacy': return watts > 0 ? (Number(file.totalFlux) || 0) / watts : 0;
                case 'maxIntensity': return Number(file.maxIntensity) || 0;
                case 'beamAngle': return Number(file.fwhmC0?.angle) || 0;
                default: return String(file.fileName || '').toLowerCase();
            }
        }

        function getSortedComparisonFiles() {
            const files = [...getComparisonFiles()];
            files.sort((a, b) => {
                const av = getFileMetric(a, comparisonSortKey);
                const bv = getFileMetric(b, comparisonSortKey);
                let result = 0;
                if (typeof av === 'string' || typeof bv === 'string') {
                    result = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
                } else {
                    result = av - bv;
                }
                return comparisonSortDirection === 'asc' ? result : -result;
            });
            return files;
        }

        function setComparisonSort(key) {
            comparisonSortKey = key || 'fileName';
            updateComparisonMatrix();
            renderPolarOverlay();
        }

        function toggleComparisonSortDirection() {
            comparisonSortDirection = comparisonSortDirection === 'asc' ? 'desc' : 'asc';
            const btn = document.getElementById('comparison-sort-direction');
            if (btn) btn.innerText = comparisonSortDirection === 'asc' ? tx('asc') : tx('desc');
            updateComparisonMatrix();
            renderPolarOverlay();
        }

        function applyComparisonColumnVisibility() {
            const toggles = document.querySelectorAll('.comparison-col-toggle');
            toggles.forEach(toggle => {
                const col = toggle.dataset.colToggle;
                document.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
                    el.classList.toggle('comparison-col-hidden', !toggle.checked);
                });
            });
        }

        function resetComparisonColumns() {
            document.querySelectorAll('.comparison-col-toggle').forEach(toggle => {
                toggle.checked = true;
            });
            applyComparisonColumnVisibility();
        }


        function escapeHTML(value) {
            return String(value ?? '').replace(/[&<>'"]/g, ch => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[ch]));
        }

        function csvCell(value) {
            const safe = String(value ?? '').replace(/"/g, '""');
            return `"${safe}"`;
        }

        function numberOrFallback(value, fallback = 0) {
            const n = Number(value);
            return Number.isFinite(n) ? n : fallback;
        }

        function ensureSelectOption(selectEl, value, label) {
            if (!selectEl || value === undefined || value === null || value === '') return;
            const exists = Array.from(selectEl.options).some(opt => opt.value === value);
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = label || value;
                selectEl.appendChild(opt);
            }
            selectEl.value = value;
        }

        function dedupeWarnings(warnings = []) {
            const seen = new Set();
            return warnings.filter(w => {
                const key = `${w.code || 'WARN'}|${w.msg || String(w)}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        function refreshAllViews(options = {}) {
            updateComparisonCount();
            updateFileList();
            if (loadedIesFiles.length > 0 && activeFileIndex >= 0) {
                if (options.renderReport !== false) renderReport(activeFileIndex);
            } else {
                clearReport();
            }
            updateComparisonMatrix();
            renderPolarOverlay();
            renderAuditReport();
        }

        // 比較圖層用顏色板 (ERCO風格專用)
        const COMPARE_COLORS = [
            'rgba(13, 110, 253, 0.95)',  // 寶藍
            'rgba(249, 115, 22, 0.95)',  // 橙黃
            'rgba(16, 185, 129, 0.95)',  // 翡翠綠
            'rgba(139, 92, 246, 0.95)',  // 丁香紫
            'rgba(236, 72, 153, 0.95)',  // 胭脂紅
            'rgba(100, 116, 139, 0.95)'  // 岩石灰
        ];

        // --- 初始化頁面 ---
        window.addEventListener('DOMContentLoaded', () => {
            applyBrand();
            initDropZone();
            initSliders();
            
            // 載入預載預設檔案
            loadAndParseIes(DEFAULT_IES_NAME, DEFAULT_IES_CONTENT);
            changeLanguage(currentLang);
            
            // 響應式圖表重繪
            window.addEventListener('resize', () => {
                if (activeFileIndex !== -1) {
                    renderPolarCurve(loadedIesFiles[activeFileIndex]);
                }
                if (getComparisonFiles().length > 0) {
                    renderPolarOverlay();
                }
            });
        });

        // --- 多語言切換處理 ---
        function changeLanguage(lang) {
            currentLang = DICT[lang] ? lang : 'en';
            lang = currentLang;
            const body = document.body;
            
            // 設定 RTL 樣式
            if (lang === 'fa') {
                body.classList.add('rtl');
            } else {
                body.classList.remove('rtl');
            }

            // 更新文字內容
            const dictionary = DICT[lang] || DICT.en;
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
            document.title = dictionary.title;
            for (let key in dictionary) {
                const el = document.getElementById(`lbl-${key}`) || 
                           document.getElementById(`btn-${key}`) || 
                           document.getElementById(`th-${key}`);
                if (el) {
                    el.innerText = dictionary[key];
                }
            }

            const setText = (id, key) => { const el = document.getElementById(id); if (el) el.innerText = dictionary[key] ?? DICT.en[key] ?? ''; };
            const setPlaceholder = (id, key) => { const el = document.getElementById(id); if (el) el.placeholder = dictionary[key] ?? DICT.en[key] ?? ''; };
            setText('btn-mode-factory', 'modeFactory');
            setText('btn-mode-pro', 'modePro');
            setText('lbl-colour-title', 'colourTitle');
            setText('lbl-cct-label', 'cctLabel');
            setText('lbl-cri-label', 'criLabel');
            setText('btn-export-zip', 'exportZip');
            setText('btn-export-comparison', 'exportComparison');
            setText('btn-print-pdf', 'printPdf');
            setText('tab-btn-aiming', 'tabAiming');
            setText('tab-btn-export', 'tabExport');
            setText('export-tab-title', 'exportTabTitle');
            setText('export-tab-desc', 'exportTabDesc');
            setText('export-all-files', 'exportAllFiles');
            setText('export-comparison-set', 'exportComparisonSet');
            setText('export-scope-note', 'scopeNote');
            setText('aiming-tab-title', 'aimingTabTitle');
            setText('aiming-tab-desc', 'aimingTabDesc');
            setText('audit-empty-state', 'auditEmpty');
            setText('lbl-pro-desc', 'proDesc');
            setText('btn-reset', 'reset');
            setText('lbl-preview-summary', 'previewSummary');
            setText('lbl-indicative-only', 'indicativeOnly');
            setText('report-subtitle', 'reportSubtitle');
            setText('lbl-classified-type', 'classifiedType');
            setText('lbl-sort', 'sort');
            setText('lbl-columns', 'columns');
            setText('btn-reset-columns', 'resetColumns');
            setPlaceholder('ies-search-input', 'searchPlaceholder');
            const setOptionText = (selectId, value, key) => {
                const select = document.getElementById(selectId);
                const option = select ? Array.from(select.options).find(opt => opt.value === value) : null;
                if (option) option.textContent = tx(key);
            };
            setOptionText('cct-select', 'N/A', 'notProvided');
            setOptionText('cct-select', '2700K', 'cct2700');
            setOptionText('cct-select', '3000K', 'cct3000');
            setOptionText('cct-select', '4000K', 'cct4000');
            setOptionText('cct-select', '5000K', 'cct5000');
            setOptionText('cri-select', 'N/A', 'notProvided');
            setOptionText('cri-select', '80', 'cri80');
            setOptionText('cri-select', '90', 'cri90');
            setOptionText('cri-select', '97', 'cri97');
            updateComparisonCount();
            const sortBtnLive = document.getElementById('comparison-sort-direction');
            if (sortBtnLive) sortBtnLive.innerText = comparisonSortDirection === 'asc' ? dictionary.asc : dictionary.desc;
            // 更新特定表格與常規標記
            document.getElementById('lbl-step1').innerText = dictionary.step1;
            document.getElementById('lbl-drag-text').innerText = dictionary.dragText;
            document.getElementById('lbl-drag-sub').innerText = dictionary.dragSub;
            document.getElementById('lbl-batch-list').innerText = dictionary.batchList;
            document.getElementById('lbl-sim-h').innerText = dictionary.simH;
            document.getElementById('lbl-sim-tilt').innerText = dictionary.simTilt;
            document.getElementById('lbl-sim-rot').innerText = dictionary.simRot;
            
            document.getElementById('tab-btn-single').innerText = dictionary.tabSingle;
            document.getElementById('tab-btn-compare').innerText = dictionary.tabCompare;
            document.getElementById('tab-btn-audit').childNodes[0].nodeValue = dictionary.tabAudit + ' ';
            document.getElementById('tab-btn-aiming').innerText = dictionary.tabAiming;
            document.getElementById('tab-btn-export').innerText = dictionary.tabExport;

            document.getElementById('lbl-data-watts').innerText = dictionary.dataWatts;
            document.getElementById('lbl-data-efficacy').innerText = dictionary.dataEfficacy;
            document.getElementById('lbl-data-lumens').innerText = dictionary.dataLumens;
            document.getElementById('lbl-data-cbcp').innerText = dictionary.dataCbcp;
            document.getElementById('lbl-data-ba-c0').innerText = dictionary.dataBaC0;
            document.getElementById('lbl-data-ba-c90').innerText = dictionary.dataBaC90;

            document.getElementById('lbl-chart-polar').innerText = dictionary.chartPolar;
            document.getElementById('lbl-chart-visual').innerText = dictionary.chartVisual;
            document.getElementById('lbl-table-matrix').innerText = dictionary.tableMatrix;
            document.getElementById('lbl-table-sub').innerText = dictionary.tableSub;

            // 比較欄表頭
            const thMap = {
                'th-height': 'thHeight', 'th-e0': 'thE0', 'th-emax': 'thEmax', 
                'th-offset': 'thOffset', 'th-dmajor': 'thDmajor', 'th-dminor': 'thDminor',
                'th-comp-file': 'thCompFile', 'th-comp-type': 'thCompType', 'th-comp-watts': 'thCompWatts',
                'th-comp-flux': 'thCompFlux', 'th-comp-eff': 'thCompEff', 'th-comp-cbcp': 'thCompCbcp',
                'th-comp-ba': 'thCompBa', 'th-comp-use': 'thCompUse'
            };
            for (let id in thMap) {
                const el = document.getElementById(id);
                if (el) el.innerText = dictionary[thMap[id]];
            }
            const actionTh = document.getElementById('th-comp-action');
            if (actionTh) actionTh.innerText = dictionary.action;
            const staticMap = {
                'print-colour-heading': 'label.declaredColourDataHeading',
                'print-cct-label': 'label.colourCct',
                'print-cri-label': 'label.colourRa',
                'print-shielding-label': 'label.shieldingAngle',
                'print-glare-label': 'label.indicativeGlareRisk',
                'print-bug-label': 'label.bugRating',
                'print-comfort-heading': 'label.comfortRiskIndicator',
                'print-glare-note': 'note.glareRisk',
                'risk-low-label': 'risk.low',
                'risk-medium-label': 'risk.medium',
                'risk-high-label': 'risk.high'
            };
            Object.entries(staticMap).forEach(([id, key]) => { const el = document.getElementById(id); if (el) el.innerText = tx(key); });
            const sortSelect = document.getElementById('comparison-sort-select');
            if (sortSelect) {
                const optionKeys = ['sortFileName','sortClassification','sortWatts','sortFlux','sortEfficacy','sortCbcp','sortBeamAngle'];
                Array.from(sortSelect.options).forEach((opt, idx) => { if (optionKeys[idx]) opt.textContent = tx(optionKeys[idx]); });
            }
            document.querySelectorAll('[data-col-label]').forEach(el => { el.childNodes[el.childNodes.length - 1].nodeValue = ' ' + tx(el.dataset.colLabel); });

            // 更新動態產出的部分
            if (activeFileIndex !== -1) {
                renderReport(activeFileIndex);
            }
            if (loadedIesFiles.length > 0) {
                updateComparisonMatrix();
                renderPolarOverlay();
            }
        }

        // --- 工廠模式與專業模式切換 ---
        function setMode(mode) {
            currentMode = mode;
            const btnFactory = document.getElementById('btn-mode-factory');
            const btnPro = document.getElementById('btn-mode-pro');
            
            const factoryPanel = document.getElementById('factory-actions-panel');
            const proPanel = document.getElementById('pro-controls-panel');

            if (mode === 'factory') {
                btnFactory.className = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-[#8ac43f] text-slate-950 shadow-md";
                btnPro.className = "px-4 py-2 rounded-lg font-semibold text-slate-400 hover:text-white transition-all duration-300";
                factoryPanel.classList.remove('hidden');
                proPanel.classList.add('hidden');
            } else {
                btnPro.className = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-[#8ac43f] text-slate-950 shadow-md";
                btnFactory.className = "px-4 py-2 rounded-lg font-semibold text-slate-400 hover:text-white transition-all duration-300";
                proPanel.classList.remove('hidden');
                factoryPanel.classList.add('hidden');
            }
        }

        // --- 標籤頁面切換 ---
        function switchTab(tab) {
            activeTab = tab;
            const allButtons = ['single', 'compare', 'aiming', 'audit', 'export']
                .map(name => document.getElementById(`tab-btn-${name}`))
                .filter(Boolean);
            const allPanels = ['single', 'compare', 'aiming', 'audit', 'export']
                .map(name => document.getElementById(`tab-${name}`))
                .filter(Boolean);

            allButtons.forEach(btn => {
                btn.className = "tab-button";
            });
            allPanels.forEach(panel => panel.classList.add('hidden'));

            const activeButton = document.getElementById(`tab-btn-${tab}`);
            const activePanel = document.getElementById(`tab-${tab}`);
            if (activeButton) activeButton.className = "tab-button is-active";
            if (activePanel) activePanel.classList.remove('hidden');

            if (tab === 'compare') {
                updateComparisonMatrix();
                renderPolarOverlay();
            } else if (tab === 'aiming') {
                setMode('pro');
                updateDynamicVisuals();
            } else if (tab === 'audit') {
                renderAuditReport();
            }
        }

        // --- Aiming Preview controls: range + number inputs + preset chips ---
        function clampNumber(value, min, max, fallback = 0) {
            const num = Number(value);
            if (!Number.isFinite(num)) return fallback;
            return Math.min(max, Math.max(min, num));
        }

        function normaliseRotation(value) {
            const num = Number(value);
            if (!Number.isFinite(num)) return 0;
            return ((num % 360) + 360) % 360;
        }

        function syncAimingInputs() {
            const pairs = [
                ['height-slider', 'height-input', ceilingHeight, 2],
                ['tilt-slider', 'tilt-input', tiltAngle, 0],
                ['rot-slider', 'rot-input', rotationAngle, 0]
            ];
            pairs.forEach(([sliderId, inputId, value, decimals]) => {
                const slider = document.getElementById(sliderId);
                const input = document.getElementById(inputId);
                if (slider) slider.value = value;
                if (input) input.value = decimals ? Number(value).toFixed(decimals) : Math.round(value);
            });
            const hVal = document.getElementById('height-val');
            const tVal = document.getElementById('tilt-val');
            const rVal = document.getElementById('rot-val');
            if (hVal) hVal.innerText = `${ceilingHeight.toFixed(2)} m`;
            if (tVal) tVal.innerText = `${Math.round(tiltAngle)}°`;
            if (rVal) rVal.innerText = `${Math.round(rotationAngle)}°`;
        }

        function setAimingValue(type, value) {
            if (type === 'height') ceilingHeight = clampNumber(value, 0.5, 20, 5);
            if (type === 'tilt') tiltAngle = clampNumber(value, 0, 75, 0);
            if (type === 'rotation') rotationAngle = normaliseRotation(value);
            syncAimingInputs();
            updateDynamicVisuals();
        }

        function resetAimingControls() {
            ceilingHeight = 5.0;
            tiltAngle = 0;
            rotationAngle = 0;
            syncAimingInputs();
            updateDynamicVisuals();
            showToast(tx('aimingReset'));
        }

        function initSliders() {
            const bindings = [
                { slider: 'height-slider', input: 'height-input', type: 'height' },
                { slider: 'tilt-slider', input: 'tilt-input', type: 'tilt' },
                { slider: 'rot-slider', input: 'rot-input', type: 'rotation' }
            ];
            bindings.forEach(({slider, input, type}) => {
                const sliderEl = document.getElementById(slider);
                const inputEl = document.getElementById(input);
                if (sliderEl) sliderEl.addEventListener('input', e => setAimingValue(type, e.target.value));
                if (inputEl) inputEl.addEventListener('change', e => setAimingValue(type, e.target.value));
                if (inputEl) inputEl.addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        setAimingValue(type, e.target.value);
                    }
                });
            });
            syncAimingInputs();
        }

        // --- 拖放上傳邏輯        // --- 拖放上傳邏輯 (批次) ---
        function initDropZone() {
            const dropZone = document.getElementById('drop-zone');
            const fileInput = document.getElementById('file-input');

            dropZone.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                handleFiles(e.target.files);
                e.target.value = '';
            });

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-amber-500', 'bg-slate-900/80');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('border-amber-500', 'bg-slate-900/80');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-amber-500', 'bg-slate-900/80');
                handleFiles(e.dataTransfer.files);
            });
        }

        function handleFiles(files) {
            let loadedCount = 0;
            let skippedCount = 0;
            const promises = Array.from(files).map(file => {
                return new Promise((resolve) => {
                    const lowerName = file.name.toLowerCase();
                    const isSupported = lowerName.endsWith('.ies') || lowerName.endsWith('.ldt');
                    if (isSupported) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const ok = loadAndParsePhotometricFile(file.name, e.target.result);
                            if (ok) loadedCount++;
                            resolve();
                        };
                        reader.onerror = function() {
                            skippedCount++;
                            resolve();
                        };
                        reader.readAsText(file);
                    } else {
                        skippedCount++;
                        resolve();
                    }
                });
            });

            Promise.all(promises).then(() => {
                if (loadedCount > 0) {
                    showToast(tx('importSuccess', { loaded: loadedCount, skipped: skippedCount ? tx('skippedFiles', { count: skippedCount }) : '' }));
                } else if (skippedCount > 0) {
                    showToast(tx('importNone'));
                }
            });
        }

        // --- IES / LDT 核心解析與智能光型分類引擎 ---
        function loadAndParsePhotometricFile(fileName, text) {
            try {
                const lowerName = fileName.toLowerCase();
                let parsed;
                if (lowerName.endsWith('.ldt')) {
                    parsed = parseLDT(text, fileName, { tx, calculateFWHMForPlane, calculateTotalFlux, classifyDistribution: (...args) => classifyDistributionCore(...args, tx) });
                } else if (lowerName.endsWith('.ies')) {
                    parsed = parseIES(text, fileName, { tx, calculateFWHMForPlane, calculateTotalFlux, classifyDistribution: (...args) => classifyDistributionCore(...args, tx) });
                } else {
                    throw new Error(tx('parser.unsupportedType'));
                }

                parsed.rawText = text;
                parsed.fileFormat = lowerName.endsWith('.ldt') ? 'LDT' : 'IES';
                parsed.warnings = dedupeWarnings([...(parsed.warnings || []), ...validateParsedPhotometricFile(parsed, tx)]);
                
                const dupIndex = loadedIesFiles.findIndex(f => f.fileName === fileName);
                if (dupIndex !== -1) {
                    const previous = loadedIesFiles[dupIndex];
                    parsed.id = previous.id || createFileId(fileName);
                    parsed.includedInComparison = previous.includedInComparison !== false;
                    loadedIesFiles[dupIndex] = parsed;
                    activeFileIndex = dupIndex;
                } else {
                    parsed.id = createFileId(fileName);
                    parsed.includedInComparison = true;
                    loadedIesFiles.push(parsed);
                    activeFileIndex = loadedIesFiles.length - 1;
                }

                autoDetectSpectral(parsed);
                refreshAllViews();
                return true;
            } catch (err) {
                console.error(err);
                showToast(tx('parseFailed', { file: fileName, error: err.message || tx('parser.unsupportedMalformed') }));
                return false;
            }
        }

        // Backward-compatible alias for existing internal calls
        function loadAndParseIes(fileName, text) {
            return loadAndParsePhotometricFile(fileName, text);
        }

        // 🌟 自動辨識色溫顯指函式 (CCT & CRI)
        function autoDetectSpectral(fileObj) {
            let cct = 'N/A';
            let cri = 'N/A';
            let cctSource = 'not provided';
            let criSource = 'not provided';
            const testMeta = fileObj.metadata?.TEST || fileObj.metadata?.TESTLAB || '';

            const cctMatch = fileObj.fileName.match(/(?:^|[^0-9])(18|22|24|27|30|35|40|50|57|60|65)00\s*K/i) || fileObj.fileName.match(/(\d{4})\s*K/i);
            if (cctMatch) {
                cct = (cctMatch[1].length === 2 ? cctMatch[1] + '00' : cctMatch[1]) + 'K';
                cctSource = 'file name';
            } else if (testMeta && testMeta.match(/(\d{4})\s*K/i)) {
                cct = testMeta.match(/(\d{4})\s*K/i)[1] + 'K';
                cctSource = 'metadata';
            }

            const criMatch = fileObj.fileName.match(/(?:CRI|CIR|RA)\s*[_-]?\s*(\d{2})/i);
            if (criMatch) {
                cri = criMatch[1];
                criSource = 'file name';
            } else if (testMeta && testMeta.match(/(?:CRI|CIR|RA)\s*[_-]?\s*(\d{2})/i)) {
                cri = testMeta.match(/(?:CRI|CIR|RA)\s*[_-]?\s*(\d{2})/i)[1];
                criSource = 'metadata';
            }

            fileObj.detectedCCT = cct;
            fileObj.detectedCRI = cri;
            fileObj.detectedCCTSource = cctSource;
            fileObj.detectedCRISource = criSource;

            if (cct === 'N/A') fileObj.warnings = [...(fileObj.warnings || []), { code: 'W_COLOUR_CCT_MISSING', msg: 'CCT 未在檔名或 metadata 中找到；色彩欄位顯示 N/A，請以原廠資料補充。' }];
            if (cri === 'N/A') fileObj.warnings = [...(fileObj.warnings || []), { code: 'W_COLOUR_CRI_MISSING', msg: 'CRI/Ra 未在檔名或 metadata 中找到；色彩欄位顯示 N/A，請以原廠資料補充。' }];
            fileObj.warnings = dedupeWarnings(fileObj.warnings || []);

            const cctSelect = document.getElementById('spec-cct-select');
            const criSelect = document.getElementById('spec-cri-select');
            ensureSelectOption(cctSelect, cct, cct);
            ensureSelectOption(criSelect, cri, cri === 'N/A' ? tx('notProvided') : `CRI ${cri}`);
        }

        // 🌟 手動自訂色彩與顯色後的覆寫重算機制
        function overrideSpectral() {
            if (activeFileIndex === -1) return;
            const file = loadedIesFiles[activeFileIndex];
            if (!file) return;

            const cct = document.getElementById('spec-cct-select').value;
            const cri = document.getElementById('spec-cri-select').value;

            file.detectedCCT = cct || 'N/A';
            file.detectedCRI = cri || 'N/A';
            file.detectedCCTSource = file.detectedCCT === 'N/A' ? 'not provided' : 'manual override';
            file.detectedCRISource = file.detectedCRI === 'N/A' ? 'not provided' : 'manual override';

            renderReport(activeFileIndex);
            renderAuditReport();
        }

        // --- 核心：光型特徵多維度智能分类 ---
        // --- 輔助：精確 FWHM 半值角計算與插值 ---
        // 🌟 輔助函數：從 IES 的指定水平/垂直剖面上，進行高精度線性插值獲得光強 (修正缺失問題)
        // --- 介面清單維護 ---
        function updateFileList() {
            const listContainer = document.getElementById('file-list');
            const fileCountSpan = document.getElementById('file-count');
            
            listContainer.innerHTML = '';
            fileCountSpan.innerText = loadedIesFiles.length;
            updateComparisonCount();

            loadedIesFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = `flex justify-between items-center px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-300 text-xs ${
                    index === activeFileIndex 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md transform scale-[1.02]' 
                        : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700'
                }`;
                item.dataset.fileId = file.id;
                item.dataset.fileName = String(file.fileName || '').toLowerCase();
                item.dataset.fileType = String(file.classifiedType || '').toLowerCase();
                item.dataset.fileFormat = (file.fileFormat || 'IES').toLowerCase();

                // Bidirectional Hover Highlight Link
                item.addEventListener('mouseenter', () => {
                    window.hoveredFileId = file.id;
                    renderPolarOverlay();
                    const row = document.querySelector(`#comparison-matrix-body tr[data-file-id="${file.id}"]`);
                    if (row) {
                        row.classList.add('bg-slate-100');
                    }
                });
                item.addEventListener('mouseleave', () => {
                    const row = document.querySelector(`#comparison-matrix-body tr[data-file-id="${file.id}"]`);
                    if (row) {
                        row.classList.remove('bg-slate-100');
                    }
                });
                
                // 動態光型標籤
                let badgeColor = "bg-slate-855 text-slate-300 border border-slate-700/50";
                if (file.classifiedType === 'Wallwash') badgeColor = "bg-blue-955/60 text-blue-300 border border-blue-900/40";
                if (file.classifiedType === 'Oval') badgeColor = "bg-purple-955/60 text-purple-300 border border-purple-900/40";

                const safeFileName = escapeHTML(file.fileName);
                const displayName = file.fileName.length > 25 ? escapeHTML(file.fileName.substring(0, 22) + '...') : safeFileName;
                const compareOn = file.includedInComparison !== false;
                const compareClass = compareOn
                    ? 'bg-[#8ac43f] text-slate-950 border-[#8ac43f]'
                    : 'bg-slate-800 text-slate-400 border-slate-700';
                const compareText = compareOn ? 'Compare ON' : 'Compare OFF';

                item.innerHTML = `
                    <div class="flex items-center space-x-2 truncate min-w-0">
                        <span class="w-1.5 h-1.5 rounded-full ${index === activeFileIndex ? 'bg-slate-950' : 'bg-slate-600'}"></span>
                        <span class="truncate" title="${safeFileName}">${displayName}</span>
                    </div>
                    <div class="flex items-center space-x-2 shrink-0">
                        <span class="text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">${escapeHTML(file.fileFormat || 'IES')}</span>
                        <span class="text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase ${badgeColor}">${escapeHTML(file.classifiedType)}</span>
                        <button onclick="toggleComparison(${index}, event)" class="text-[9px] px-2 py-1 rounded border font-black tracking-wider transition ${compareClass}" title="Add / remove this file from Multi Comparison Dashboard">
                            ${compareText}
                        </button>
                        <button onclick="deleteFile(${index}, event)" class="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-500 transition duration-150" title="Remove IES completely">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    activeFileIndex = index;
                    updateFileList();
                    renderReport(index); 
                    if (activeTab === 'compare') {
                        updateComparisonMatrix();
                        renderPolarOverlay();
                    } else if (activeTab === 'audit') {
                        renderAuditReport();
                    }
                });
                
                listContainer.appendChild(item);
            });
        }

        function toggleComparison(index, event) {
            if (event) event.stopPropagation();
            const file = loadedIesFiles[index];
            if (!file) return;
            file.includedInComparison = file.includedInComparison === false;
            updateFileList();
            updateComparisonMatrix();
            renderPolarOverlay();
            updateComparisonCount();
            showToast(file.includedInComparison ? tx("addedCompare") : tx("removedCompare"));
        }

        function removeFromComparison(index, event) {
            if (event) event.stopPropagation();
            const file = loadedIesFiles[index];
            if (!file) return;
            file.includedInComparison = false;
            updateFileList();
            updateComparisonMatrix();
            renderPolarOverlay();
            updateComparisonCount();
            showToast(tx("removedCompare"));
        }

        function viewSpecFromComparison(index, event) {
            if (event) event.stopPropagation();
            if (!loadedIesFiles[index]) return;
            activeFileIndex = index;
            switchTab('single');
            updateFileList();
            renderReport(index);
        }

        // 🌟 一鍵刪除 IES 文件邏輯：Master List 與 Comparison Dashboard 同步移除
        function deleteFile(index, event) {
            if (event) event.stopPropagation();
            if (!loadedIesFiles[index]) return;
            loadedIesFiles.splice(index, 1);
            if (loadedIesFiles.length === 0) {
                clearReport();
                updateFileList();
                updateComparisonMatrix();
                renderPolarOverlay();
                renderAuditReport();
                showToast(tx("fileRemoved"));
                return;
            }
            if (activeFileIndex === index) {
                activeFileIndex = Math.min(index, loadedIesFiles.length - 1);
            } else if (activeFileIndex > index) {
                activeFileIndex--;
            }
            refreshAllViews();
            showToast(tx("fileRemoved"));
        }

        // 🌟 重置規格書顯示 (當無任何檔案時)
        function clearReport() {
            activeFileIndex = -1;
            document.getElementById('report-title').innerText = tx("reportEmptyTitle");
            document.getElementById('report-id').innerText = `${tx("fileLabel")}: -`;
            document.getElementById('report-date').innerText = `${tx("testDate")}: -`;
            document.getElementById('spec-power').innerHTML = "-";
            document.getElementById('spec-efficacy').innerHTML = "-";
            document.getElementById('spec-lumens').innerHTML = "-";
            document.getElementById('spec-peak-cd').innerHTML = "-";
            document.getElementById('spec-ba-c0').innerHTML = "-";
            document.getElementById('spec-ba-c90').innerHTML = "-";
            
            document.getElementById('print-cct-val').innerText = "-";
            document.getElementById('print-cri-val').innerText = "-";
            document.getElementById('print-rf-val').innerText = "-";
            document.getElementById('text-r9-val').innerText = "-";
            document.getElementById('text-r15-val').innerText = "-";
            document.getElementById('bar-r9').style.width = "0%";
            document.getElementById('bar-r15').style.width = "0%";
            document.getElementById('print-ugr-val').innerText = "-";
            document.getElementById('print-bug-val').innerText = "-";
            document.getElementById('shielding-angle-val').innerText = "-";
            
            const polarCanvas = document.getElementById('polar-canvas');
            if (polarCanvas) {
                const ctx = polarCanvas.getContext('2d');
                ctx.clearRect(0, 0, polarCanvas.width, polarCanvas.height);
            }
            const container = document.getElementById('visualizer-container');
            if (container) container.innerHTML = "";
            const tableBody = document.getElementById('cone-table-body');
            if (tableBody) tableBody.innerHTML = "";
            const matrixBody = document.getElementById('comparison-matrix-body');
            if (matrixBody) matrixBody.innerHTML = "";
            const overlayCanvas = document.getElementById('polar-overlay-canvas');
            if (overlayCanvas) {
                const ctx = overlayCanvas.getContext('2d');
                ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            }
            const legends = document.getElementById('overlay-legends');
            if (legends) legends.innerHTML = "";
            updateComparisonCount();
        }

        // 🌟 Google式智慧過濾搜尋
        function filterFileList() {
            const query = document.getElementById('ies-search-input').value.toLowerCase();
            const listItems = document.querySelectorAll('#file-list > div');
            listItems.forEach(item => {
                const matchesName = (item.dataset.fileName || '').includes(query);
                const matchesType = (item.dataset.fileType || '').includes(query);
                const matchesFormat = (item.dataset.fileFormat || '').includes(query);
                if (matchesName || matchesType || matchesFormat) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        }

        // --- 單個燈具規格書卡片渲染 ---
        function renderReport(index) {
            const file = loadedIesFiles[index];
            if (!file) return;

            const lampName = file.metadata['TEST'] || file.fileName.replace(/\.[^/.]+$/, "");
            
            // 安全防守與 DOM 渲染保護
            const reportTitleEl = document.getElementById('report-title');
            if (reportTitleEl) reportTitleEl.innerText = lampName;
            
            const reportIdEl = document.getElementById('report-id');
            if (reportIdEl) {
                const fmt = file.fileFormat || 'IES';
                const sourceId = file.metadata['TEST'] || file.metadata['LUMCAT'] || file.metadata['SOURCE_FILE'] || file.fileName;
                reportIdEl.innerText = `${fmt}: ${sourceId}`;
            }
            
            const reportDateEl = document.getElementById('report-date');
            if (reportDateEl) reportDateEl.innerText = `${tx("testDate")}: ${file.metadata['TESTDATE'] || tx("unknown")}`;

            const watts = file.inputWatts > 0 ? file.inputWatts : 50;
            const efficiency = file.totalFlux / watts;
            
            const specPowerEl = document.getElementById('spec-power');
            if (specPowerEl) specPowerEl.innerHTML = `${watts.toFixed(1)} <span class="text-[10px] text-slate-500">W</span>`;
            
            const specEfficacyEl = document.getElementById('spec-efficacy');
            if (specEfficacyEl) specEfficacyEl.innerHTML = `${efficiency.toFixed(1)} <span class="text-[10px] text-slate-500">lm/W</span>`;
            
            const specLumensEl = document.getElementById('spec-lumens');
            if (specLumensEl) specLumensEl.innerHTML = `${Math.round(file.totalFlux).toLocaleString()} <span class="text-[10px] text-slate-500">lm</span>`;
            
            const specPeakCdEl = document.getElementById('spec-peak-cd');
            if (specPeakCdEl) specPeakCdEl.innerHTML = `${Math.round(file.maxIntensity).toLocaleString()} <span class="text-[10px] text-slate-500">cd</span>`;
            
            const specBaC0El = document.getElementById('spec-ba-c0');
            if (specBaC0El) specBaC0El.innerHTML = `${Math.round(file.fwhmC0.angle)}°`;
            
            const specBaC90El = document.getElementById('spec-ba-c90');
            if (specBaC90El) specBaC90El.innerHTML = `${Math.round(file.fwhmC90.angle)}°`;

            // 光型標記
            const badge = document.getElementById('report-type-badge');
            if (badge) {
                badge.innerText = file.classifiedType;
                if (file.classifiedType === 'Wallwash') {
                    badge.className = "text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded font-bold uppercase inline-block my-1";
                } else if (file.classifiedType === 'Oval') {
                    badge.className = "text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded font-bold uppercase inline-block my-1";
                } else {
                    badge.className = "text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-bold uppercase inline-block my-1";
                }
            }

            // 🌟 更新：CCT, CRI, R9, R15 與 Glare Risk 物理渲染與進度條聯動 (100% 完美呈現)
            renderSpectralAndVisualGlare(file);

            renderPolarCurve(file);
            updateDynamicVisuals();
        }

        // 🌟 核心：更新規格書上的高級光譜與 Glare Risk 條
        function renderSpectralAndVisualGlare(file) {
            const cct = file.detectedCCT || 'N/A';
            const criRaw = file.detectedCRI || 'N/A';
            const criVal = parseInt(criRaw, 10);

            document.getElementById('print-cct-val').innerText = cct === 'N/A' ? 'N/A' : cct;
            document.getElementById('print-cri-val').innerText = Number.isFinite(criVal) ? `CRI ${criVal}` : 'N/A';

            // R9 / R15 / Rf / Rg 不應由 CRI 推估；沒有原廠資料或 SPD 時顯示 N/A。
            document.getElementById('print-rf-val').innerText = 'N/A';
            document.getElementById('text-r9-val').innerText = 'N/A';
            document.getElementById('text-r15-val').innerText = 'N/A';
            document.getElementById('bar-r9').style.width = '0%';
            document.getElementById('bar-r15').style.width = '0%';

            // 初步眩光風險提示器：只作選型風險提示，非正式 UGR。
            const beamAngle = numberOrFallback(file.fwhmC0?.angle, 30);
            const peakCd = Math.max(1, numberOrFallback(file.maxIntensity, 1));
            let glareRisk = 10.0;
            glareRisk += (beamAngle - 10) * 0.12;
            glareRisk += Math.log10(peakCd) * 0.9;
            if (tiltAngle > 0) glareRisk += Math.pow(tiltAngle, 1.35) * 0.12;
            glareRisk += (7.0 - ceilingHeight) * 0.65;
            glareRisk = Math.max(8.0, Math.min(30.0, glareRisk));

            const ugrEl = document.getElementById('print-ugr-val');
            const riskLabel = glareRisk < 16 ? 'Low Risk' : glareRisk < 22 ? 'Medium Risk' : 'High Risk';
            ugrEl.innerText = `${riskLabel} (${glareRisk.toFixed(1)})`;

            const indicator = document.getElementById('ugr-indicator');
            const percent = ((glareRisk - 8) / (30 - 8)) * 100;
            indicator.style.left = `${Math.min(95, Math.max(2, percent))}%`;
            if (glareRisk < 16) {
                ugrEl.className = 'text-base font-bold text-emerald-600';
                indicator.className = 'absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow transition-all duration-500';
            } else if (glareRisk < 22) {
                ugrEl.className = 'text-base font-bold text-amber-500';
                indicator.className = 'absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white shadow transition-all duration-500';
            } else {
                ugrEl.className = 'text-base font-bold text-red-500 animate-pulse';
                indicator.className = 'absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow transition-all duration-500';
            }

            let shielding = '30°';
            if (beamAngle < 15) shielding = '45°';
            else if (beamAngle > 40) shielding = '15°';
            document.getElementById('shielding-angle-val').innerText = shielding;
        }

        // --- Aiming & Footprint Preview engine：快速選型預覽，不是完整空間照度模擬 ---
        function degToRad(deg) {
            return (Number(deg) || 0) * Math.PI / 180;
        }

        function safeTanDeg(deg, fallback = null) {
            if (Math.abs(deg) >= 89.5) return fallback;
            return Math.tan(degToRad(deg));
        }

        function formatLux(value) {
            if (!Number.isFinite(value) || value < 0) return 'N/A';
            if (value >= 1000) return Math.round(value).toLocaleString('en-US') + ' lx';
            if (value >= 100) return Math.round(value).toLocaleString('en-US') + ' lx';
            if (value >= 10) return value.toFixed(1) + ' lx';
            return value.toFixed(2) + ' lx';
        }



        const classifyDistribution = (...args) => classifyDistributionCore(...args, tx);

        function computeAimingMetrics(file, h = ceilingHeight) {
            return computeAimingMetricsCore(file, h, {
                ceilingHeight,
                tiltAngle,
                rotationAngle,
                numberOrFallback,
                clampNumber,
                degToRad,
                safeTanDeg,
                getIntensityAtAngle
            });
        }        function updateAimingSummary(file) {
            const panel = document.getElementById('aiming-summary-text');
            if (!panel) return;
            if (!file) {
                panel.innerHTML = tx('aimingEmpty');
                return;
            }
            const m = computeAimingMetrics(file, ceilingHeight);
            const majorText = m.major === null ? tx('spreadBeyondPreview') : `${m.major.toFixed(2)} m`;
            const minorText = Number.isFinite(m.minor) ? `${m.minor.toFixed(2)} m` : 'N/A';
            const stretchText = m.verticalStretch ? `${m.verticalStretch.toFixed(2)}×` : 'N/A';
            panel.innerHTML = `
                <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div><span class="text-slate-500">${tx('offset')}</span> <b class="text-white">${m.offset.toFixed(2)} m</b></div>
                    <div><span class="text-slate-500">Slant</span> <b class="text-white">${m.slantDistance.toFixed(2)} m</b></div>
                    <div><span class="text-slate-500">${tx('axisE')}</span> <b class="text-[#8ac43f]">${formatLux(m.eAxis)}</b></div>
                    <div><span class="text-slate-500">Below E</span> <b class="text-slate-100">${formatLux(m.eBelow)}</b></div>
                    <div><span class="text-slate-500">${tx('major')}</span> <b class="text-white">${majorText}</b></div>
                    <div><span class="text-slate-500">${tx('minor')}</span> <b class="text-white">${minorText}</b></div>
                    <div><span class="text-slate-500">Stretch</span> <b class="text-white">${stretchText}</b></div>
                    <div><span class="text-slate-500">Axis factor</span> <b class="text-white">${(m.relativeAxisFactor * 100).toFixed(0)}%</b></div>
                </div>
                <div class="mt-2 text-slate-500">${tx('aimingSummaryNote')}</div>`;
        }

        function updateDynamicVisuals() {
            const file = loadedIesFiles[activeFileIndex];
            if (!file) {
                updateAimingSummary(null);
                return;
            }

            renderDynamicFootprint(file);
            updateAimingSummary(file);

            const tableBody = document.getElementById('cone-table-body');
            if (tableBody) {
                tableBody.innerHTML = '';
                const heights = [1.00, 2.00, 2.70, 3.00, 4.00, 5.00, 7.00];
                if (!heights.some(v => Math.abs(v - ceilingHeight) < 0.001)) {
                    heights.push(ceilingHeight);
                    heights.sort((a, b) => a - b);
                }

                heights.forEach(h => {
                    const m = computeAimingMetrics(file, h);
                    const row = document.createElement('tr');
                    const isSelected = Math.abs(h - ceilingHeight) < 0.01;
                    row.className = isSelected
                        ? 'bg-amber-50 text-slate-900 border-l-4 border-amber-500 font-bold'
                        : 'hover:bg-slate-50/80 transition duration-150 cursor-pointer';

                    const majorText = m.major === null ? 'Spread' : `${m.major.toFixed(2)} m`;
                    const minorText = Number.isFinite(m.minor) ? `${m.minor.toFixed(2)} m` : 'N/A';
                    row.innerHTML = `
                        <td class="py-3.5 px-4 text-center font-bold text-slate-800">${h.toFixed(2)} m</td>
                        <td class="py-3.5 px-2 text-center text-slate-600">${formatLux(m.eBelow)}</td>
                        <td class="py-3.5 px-2 text-center text-amber-600 font-bold">${formatLux(m.eAxis)}</td>
                        <td class="py-3.5 px-2 text-center text-slate-500">${m.offset.toFixed(2)} m</td>
                        <td class="py-3.5 px-4 text-center font-medium">${majorText}</td>
                        <td class="py-3.5 px-4 text-center font-medium">${minorText}</td>
                    `;
                    row.addEventListener('click', () => setAimingValue('height', h));
                    tableBody.appendChild(row);
                });
            }

            renderSpectralAndVisualGlare(file);
        }

        function renderDynamicFootprint(file) {
            const container = document.getElementById('visualizer-container');
            if (!container) return;
            container.innerHTML = '';

            const width = 420;
            const height = 280;
            const floorY = height - 46;
            const lumY = 34;
            const cx = width / 2;
            const m = computeAimingMetrics(file, ceilingHeight);
            const tiltRad = degToRad(m.tilt);
            const rotRad = degToRad(m.rotation);
            const pixelScale = Math.min(34, Math.max(10, 165 / Math.max(1, m.h * 0.9 + Math.abs(m.offset))));
            const dx = Math.max(-150, Math.min(150, m.offset * pixelScale * Math.cos(rotRad)));
            const dy = Math.max(-32, Math.min(32, m.offset * pixelScale * Math.sin(rotRad) * 0.28));
            const targetX = cx + dx;
            const targetY = floorY + dy;
            const majorPx = m.major === null ? 160 : Math.max(12, Math.min(160, (m.major / 2) * pixelScale));
            const minorPx = Math.max(5, Math.min(95, (m.minor / 2) * pixelScale * 0.25));
            const majorLabel = m.major === null ? tx('spreadBeyondPreview') : `${m.major.toFixed(2)} m`;

            let innerSvg = '';
            if (file.classifiedType === 'Wallwash') {
                const setbackPx = Math.max(20, Math.min(110, Math.abs(dx) + 48));
                const wallGlowX = 118 + Math.sin(tiltRad) * 28;
                const wallGlowY = 55 + Math.abs(dx) * 0.06;
                innerSvg = `
                    <polygon points="48,24 48,${floorY} 185,${floorY} 185,24" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
                    <polygon points="185,24 185,${floorY} 365,${floorY} 365,24" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1.5" />
                    <defs>
                        <radialGradient id="wallwash-grad" cx="${wallGlowX / width * 100}%" cy="${wallGlowY / height * 100}%" r="70%">
                            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.76" />
                            <stop offset="44%" stop-color="#fbbf24" stop-opacity="0.34" />
                            <stop offset="100%" stop-color="#fef08a" stop-opacity="0.0" />
                        </radialGradient>
                    </defs>
                    <path d="M92,42 Q185,18 278,42 Q315,145 185,${floorY - 18} Q55,145 92,42 Z" fill="url(#wallwash-grad)" />
                    <line x1="${cx}" y1="${lumY}" x2="${cx + Math.cos(rotRad) * setbackPx}" y2="${lumY + 108}" stroke="#b45309" stroke-width="2" marker-end="url(#arrow)" />
                    <line x1="185" y1="24" x2="185" y2="${floorY}" stroke="#475569" stroke-width="1" stroke-dasharray="2,2" />
                    <text x="174" y="${floorY / 2}" fill="#475569" font-size="9" font-weight="bold" text-anchor="middle" transform="rotate(-90 174 ${floorY/2})">${tx('svg.wallwashPreview', { height: m.h.toFixed(1) })}</text>
                    <text x="${cx}" y="${floorY + 26}" fill="#475569" font-size="9" font-weight="bold" text-anchor="middle">${tx('svg.setbackPreview')}</text>`;
            } else {
                const isOval = file.classifiedType === 'Oval';
                const ellipseOpacity = isOval ? 0.24 : 0.18;
                innerSvg = `
                    <ellipse cx="${cx}" cy="${floorY}" rx="150" ry="28" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
                    <polygon points="${cx},${lumY} ${targetX - majorPx},${targetY} ${targetX + majorPx},${targetY}" fill="url(#beam-grad-standard)" opacity="0.52" />
                    <line x1="${cx}" y1="${lumY}" x2="${cx}" y2="${floorY}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4" />
                    <line x1="${cx}" y1="${lumY}" x2="${targetX}" y2="${targetY}" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="2,2" />
                    <g transform="translate(${targetX}, ${targetY}) rotate(${m.rotation})">
                        <ellipse cx="0" cy="0" rx="${majorPx}" ry="${minorPx}" fill="rgba(251,191,36,${ellipseOpacity})" stroke="#f59e0b" stroke-width="1.5" />
                        <line x1="-${majorPx}" y1="0" x2="${majorPx}" y2="0" stroke="#b45309" stroke-width="1.1" />
                        <line x1="0" y1="-${minorPx}" x2="0" y2="${minorPx}" stroke="#0284c7" stroke-width="1.1" />
                    </g>
                    <g transform="translate(${cx}, ${lumY}) rotate(${m.tilt})">
                        <rect x="-13" y="-11" width="26" height="13" rx="2" fill="#475569" />
                        <line x1="-11" y1="1" x2="11" y2="1" stroke="#fbbf24" stroke-width="2.5" />
                        <circle cx="0" cy="5" r="3" fill="#fbbf24" />
                    </g>
                    <text x="${targetX}" y="${Math.max(18, targetY - minorPx - 11)}" fill="#b45309" font-size="9" font-weight="bold" text-anchor="middle">${tx('svg.axisE', { value: formatLux(m.eAxis) })}</text>
                    <text x="${cx + dx/2}" y="${floorY + 15}" fill="#475569" font-size="8" font-weight="bold" text-anchor="middle">${tx('svg.offset', { value: m.offset.toFixed(2) })}</text>
                    <text x="${cx}" y="${floorY + 33}" fill="#475569" font-size="8" font-weight="bold" text-anchor="middle">${tx('svg.majorMinor', { major: majorLabel, minor: Number.isFinite(m.minor) ? m.minor.toFixed(2) + ' m' : 'N/A' })}</text>`;
            }

            container.innerHTML = `
                <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="overflow-visible">
                    <defs>
                        <linearGradient id="beam-grad-standard" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.58"/>
                            <stop offset="58%" stop-color="#fef08a" stop-opacity="0.24"/>
                            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0"/>
                        </linearGradient>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                        </marker>
                    </defs>
                    ${innerSvg}
                </svg>`;
        }

        function currentHOffset() {
            return ceilingHeight * Math.tan(degToRad(tiltAngle));
        }

        // --- 高清單一極座標圖渲染        // --- 高清單一極座標圖渲染 (100% 同步自 image_f7f2cb.png 奢華格式) ---
        function renderPolarCurve(file) {
            const canvas = document.getElementById('polar-canvas');
            if (!canvas) return;
            drawPolarToCanvas(canvas, file);
        }

        // --- 高清單一極座標圖渲染 (100% 同步自 image_f7f2cb.png 奢華格式) ---


        // --- TAB 2: 多檔案配光疊加圖 (Polar Overlays) ---
        function renderPolarOverlay() {
            const canvas = document.getElementById('polar-overlay-canvas');
            if (!canvas) return;

            const legendContainer = document.getElementById('overlay-legends');
            
            // Set up crosshair and tooltip listeners once
            if (!canvas.dataset.hasCrosshair) {
                canvas.dataset.hasCrosshair = "true";

                canvas.addEventListener('mousemove', (event) => {
                    const rect = canvas.getBoundingClientRect();
                    const mx = event.clientX - rect.left;
                    const my = event.clientY - rect.top;

                    const width = rect.width;
                    const height = rect.width * 0.75;
                    const cx = width / 2;
                    const cy = 35;

                    const dx = mx - cx;
                    const dy = my - cy;

                    if (dy >= 0) {
                        const rad = Math.atan2(dy, dx);
                        const deg = rad * 180 / Math.PI;
                        const ang = Math.round(deg - 90);
                        const gamma = Math.abs(ang);

                        let tooltip = document.getElementById('polar-chart-tooltip');
                        if (!tooltip) {
                            tooltip = document.createElement('div');
                            tooltip.id = 'polar-chart-tooltip';
                            tooltip.className = 'absolute hidden pointer-events-none bg-slate-950/90 text-white p-3 rounded-lg shadow-xl text-xs z-50 backdrop-blur-sm border border-slate-800 transition-opacity duration-150';
                            document.body.appendChild(tooltip);
                        }

                        const comparisonFiles = getSortedComparisonFiles();
                        let tooltipHTML = `<div class="font-bold border-b border-slate-700 pb-1 mb-1.5 text-slate-300">Angle: C0-180 | ${gamma}°</div>`;

                        comparisonFiles.forEach((file, fIdx) => {
                            let closestIdx = 0;
                            let minDiff = Infinity;
                            for (let i = 0; i < file.verticalAngles.length; i++) {
                                const diff = Math.abs(file.verticalAngles[i] - gamma);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closestIdx = i;
                                }
                            }
                            const getHIndex = (targetAngle) => {
                                let closest = 0;
                                let minD = Infinity;
                                for (let i = 0; i < file.horizontalAngles.length; i++) {
                                    let diff = Math.min(Math.abs(file.horizontalAngles[i] - targetAngle), Math.abs(360 - Math.abs(file.horizontalAngles[i] - targetAngle)));
                                    if (diff < minD) {
                                        minD = diff;
                                        closest = i;
                                    }
                                }
                                return closest;
                            };

                            const planeIdx = ang < 0 ? getHIndex(0) : getHIndex(180);
                            const candela = Math.round(file.candelaMatrix[planeIdx][closestIdx]);
                            const color = COMPARE_COLORS[fIdx % COMPARE_COLORS.length];

                            tooltipHTML += `
                                <div class="flex items-center justify-between gap-4 py-0.5">
                                    <div class="flex items-center min-w-0">
                                        <span class="w-2.5 h-1 rounded mr-1.5 inline-block shrink-0" style="background-color: ${color}"></span>
                                        <span class="truncate max-w-[120px] text-slate-200">${escapeHTML(file.fileName)}</span>
                                    </div>
                                    <span class="font-mono font-bold">${candela.toLocaleString()} cd</span>
                                </div>
                            `;
                        });

                        tooltip.innerHTML = tooltipHTML;
                        tooltip.style.left = `${event.pageX + 15}px`;
                        tooltip.style.top = `${event.pageY + 15}px`;
                        tooltip.classList.remove('hidden');

                        renderPolarOverlayChart({
                            loadedIesFiles,
                            activeFileIndex,
                            getSortedComparisonFiles,
                            updateComparisonCount,
                            legendContainer,
                            tx,
                            escapeHTML,
                            canvas
                        }, { ang, gamma, mx, my });
                    } else {
                        hideCrosshair();
                    }
                });

                canvas.addEventListener('mouseleave', hideCrosshair);

                function hideCrosshair() {
                    const tooltip = document.getElementById('polar-chart-tooltip');
                    if (tooltip) tooltip.classList.add('hidden');

                    renderPolarOverlayChart({
                        loadedIesFiles,
                        activeFileIndex,
                        getSortedComparisonFiles,
                        updateComparisonCount,
                        legendContainer,
                        tx,
                        escapeHTML,
                        canvas
                    });
                }
            }

            renderPolarOverlayChart({
                loadedIesFiles,
                activeFileIndex,
                getSortedComparisonFiles,
                updateComparisonCount,
                legendContainer,
                tx,
                escapeHTML,
                canvas
            });
        }

        // --- 核心對比表格矩陣更新 ---
        function updateComparisonMatrix() {
            renderComparison({
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
                setActiveFileIndex: (idx) => { activeFileIndex = idx; },
                updateFileList,
                renderReport,
                renderPolarOverlay,
                viewSpecFromComparison,
                removeFromComparison,
                deleteFile
            });
        }

        // --- TAB 3: 數據審查報告 (Anomaly Prevention List) ---
        function renderAuditReport() {
            const container = document.getElementById('audit-reports-list');
            if (!container) return;
            const badge = document.getElementById('audit-badge');
            container.innerHTML = '';

            let totalWarningsCount = 0;

            loadedIesFiles.forEach(file => {
                const warnings = buildAuditWarnings(file, { tx, translateWarning });

                totalWarningsCount += warnings.length;

                // 渲染該燈具的警告看板
                if (warnings.length > 0) {
                    const fileCard = document.createElement('div');
                    fileCard.className = "border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50";
                    fileCard.innerHTML = `
                        <div class="flex justify-between items-center border-b border-slate-200 pb-2">
                            <span class="font-bold text-slate-800 text-sm truncate" title="${escapeHTML(file.fileName)}">${file.fileName}</span>
                            <span class="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full uppercase">${tx('potentialIssues', { count: warnings.length })}</span>
                        </div>
                        <div class="space-y-3">
                            ${warnings.map(w => `
                                <div class="flex items-start space-x-2 text-xs">
                                    <span class="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                                    <div>
                                        <h4 class="font-bold text-red-700">${escapeHTML(w.title)}</h4>
                                        <p class="text-slate-600 mt-0.5">${escapeHTML(w.desc)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    container.appendChild(fileCard);
                }
            });

            // 更新 Badge
            if (badge) {
                if (totalWarningsCount > 0) {
                    badge.innerText = totalWarningsCount;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                    container.innerHTML = `<p class="text-sm text-slate-400 py-6 text-center">${tx("auditPass")}</p>`;
                }
            }
        }

        // 輔助曲線繪製
        function drawPhotometricPlane(ctx, cx, cy, maxRadius, rMax, file, leftHIdx, rightHIdx, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
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

        // --- 資料包輸出 ZIP 導出引擎 ---
        function exportBatchZIP(scope = 'all') {
            if (loadedIesFiles.length === 0) {
                showToast(tx("noFilesZip"));
                return;
            }

            const targetFiles = scope === 'comparison' ? getComparisonFiles() : loadedIesFiles;
            if (targetFiles.length === 0) {
                showToast(tx("noComparisonZip"));
                return;
            }

            const isComparisonOnly = scope === 'comparison';
            showToast(isComparisonOnly ? tx("buildingComparisonZip") : tx("buildingFullZip"));

            const zip = new JSZip();
            const offscreenCanvas = document.createElement('canvas');

            // 1. 匯出比較摘要表：Comparison scope 只使用已選檔案；All scope 使用全部檔案
            let csvContent = "\ufeff# " + tx('csv.company') + "," + csvCell(BRAND.companyName) + "\n" +
                "# " + tx('csv.website') + "," + csvCell(BRAND.website) + "\n" +
                "# " + tx('csv.email') + "," + csvCell(BRAND.email) + "\n" +
                "# " + tx('csv.tool') + "," + csvCell(BRAND.toolName) + "\n" +
                "# " + tx('csv.version') + "," + csvCell(BRAND.toolVersion) + "\n\n" +
                [tx('csv.fileName'), tx('csv.format'), tx('csv.includedInComparison'), tx('csv.type'), tx('csv.wattsW'), tx('csv.totalFluxLm'), tx('csv.efficacy'), tx('csv.peakCandela'), tx('csv.fwhmC0'), tx('csv.fwhmC90'), tx('csv.suggestedApplication')].map(csvCell).join(',') + "\n";
            targetFiles.forEach(file => {
                const watts = file.inputWatts > 0 ? file.inputWatts : 50;
                const eff = file.totalFlux / watts;
                csvContent += [file.fileName, file.fileFormat || 'IES', file.includedInComparison !== false ? tx('yes') : tx('no'), file.classifiedType, watts.toFixed(1), Math.round(file.totalFlux), eff.toFixed(1), Math.round(file.maxIntensity), Math.round(file.fwhmC0.angle), Math.round(file.fwhmC90.angle), localizedUse(file)].map(csvCell).join(',') + "\n";
            });
            zip.file(isComparisonOnly ? "Data/Comparison_Set_Summary_Table.csv" : "Data/All_Files_Summary_Table.csv", csvContent);

            // 2. Audit log：保留 comparison 狀態，方便回溯
            const auditLog = {
                company: BRAND.companyName,
                website: BRAND.website,
                email: BRAND.email,
                tool: BRAND.toolName,
                version: BRAND.toolVersion,
                generatedAt: new Date().toISOString(),
                files: targetFiles.map(file => ({
                id: file.id,
                fileName: file.fileName,
                fileFormat: file.fileFormat || 'IES',
                includedInComparison: file.includedInComparison !== false,
                classification: file.classifiedType,
                warnings: file.warnings || [],
                totalFlux: Math.round(file.totalFlux),
                peakCandela: Math.round(file.maxIntensity),
                fwhmC0: Math.round(file.fwhmC0.angle),
                fwhmC90: Math.round(file.fwhmC90.angle)
            }))
            };
            zip.file("Data/Audit_Log.json", JSON.stringify(auditLog, null, 2));

            // 3. 批次遍歷目標檔案：PNG、SVG、原始 IES、規格文本
            targetFiles.forEach(file => {
                const cleanName = file.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]+/gi, "_");
                const watts = file.inputWatts > 0 ? file.inputWatts : 50;
                const eff = file.totalFlux / watts;

                if (file.rawText) {
                    zip.file("Photometric_Original_IES_LDT/" + file.fileName, file.rawText);
                }

                drawPolarToCanvas(offscreenCanvas, file, 800, 600);
                const imgDataUrl = offscreenCanvas.toDataURL('image/png');
                const base64Data = imgDataUrl.split(',')[1];
                zip.file("Images_PNG_Polar/" + cleanName + "_polar.png", base64Data, {base64: true});

                const tempDiv = document.createElement('div');
                renderBeamVisualizerForBatch(tempDiv, file);
                const svgElement = tempDiv.querySelector('svg');
                if (svgElement) {
                    const svgString = new XMLSerializer().serializeToString(svgElement);
                    zip.file("Images_SVG_Footprint/" + cleanName + "_footprint.svg", svgString);
                }

                const specText = `=========================================
${BRAND.companyName.toUpperCase()} ${tx('report.specificationSheet')}
=========================================
${brandMetadataLines()}
=========================================
${tx('report.fileName')}: ${file.fileName}
${tx('report.fileFormat')}: ${file.fileFormat || 'IES'}
${tx('report.includedInComparison')}: ${file.includedInComparison !== false ? tx('yes').toUpperCase() : tx('no').toUpperCase()}
${tx('report.classification')}: ${file.classifiedType}
${tx('report.testDate')}: ${file.metadata['TESTDATE'] || tx('unknown')}

${tx('report.technicalMetrics')}:
- ${tx('report.inputPower')}: ${watts.toFixed(1)} W
- ${tx('report.totalFlux')}: ${Math.round(file.totalFlux)} lm
- ${tx('report.luminousEfficacy')}: ${eff.toFixed(1)} lm/W
- ${tx('report.cbcpPeakIntensity')}: ${Math.round(file.maxIntensity)} cd
- ${tx('report.beamSpreadC0')}: ${Math.round(file.fwhmC0.angle)} deg
- ${tx('report.beamSpreadC90')}: ${Math.round(file.fwhmC90.angle)} deg

${tx('report.suggestedUse')}:
${localizedUse(file)}

${tx('report.aimingPreviewSettings')}:
- ${tx('report.height')}: ${ceilingHeight.toFixed(2)} m
- ${tx('report.tilt')}: ${tiltAngle} deg
- ${tx('report.rotation')}: ${rotationAngle} deg
- ${tx('report.aimingNote')}

${tx('report.systemRemarks')}:
${tx('report.generatedAutomatically', { tool: BRAND.toolName, version: BRAND.toolVersion })}
${tx('report.exportPurpose')}
=========================================`;
                zip.file(`Single_Spec_Sheets/${cleanName}_Spec_Data.txt`, specText);
            });

            zip.file("README_SCOPE_AND_LIMITS.txt", `${BRAND.companyName} - ${BRAND.toolName}
${brandMetadataLines()}

${tx('readme.scope')}:
- ${tx('readme.scopeReview')}
- ${tx('readme.scopeComparison')}
- ${tx('readme.scopeMatrix')}
- ${tx('readme.scopeExport')}

${tx('readme.limits')}:
- ${tx('readme.limitSoftware')}
- ${tx('readme.limitAiming')}
- ${tx('readme.limitGlare')}
- ${tx('readme.limitColour')}
`);

            // 4. 打包生成下載
            zip.generateAsync({type:"blob"}).then(function(content) {
                const element = document.createElement('a');
                element.href = URL.createObjectURL(content);
                element.download = isComparisonOnly ? "ACOFUSION_Comparison_Set_Output.zip" : "ACOFUSION_All_Photometrics_Output.zip";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                showToast(isComparisonOnly ? tx("comparisonZipDone") : tx("fullZipDone"));
            });
        }

        // 後台靜態調用生成 SVG 的輔助函式 (避免操作 DOM 產生閃爍)
        function renderBeamVisualizerForBatch(container, file) {
            const width = 400;
            const height = 260;
            const floor_y = height - 40;
            const cy_lum = 25;
            const cx = width / 2;
            let innerSvg = "";

            if (file.classifiedType === "Wallwash") {
                innerSvg = `
                    <polygon points="50,25 50,${floor_y} 180,${floor_y} 180,25" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
                    <polygon points="180,25 180,${floor_y} 350,${floor_y} 350,25" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1.5" />
                    <path d="M120,40 Q180,20 240,40 Q290,140 180,${floor_y - 20} Q70,140 120,40 Z" fill="url(#ww-batch-grad)" />
                    <line x1="180" y1="${floor_y}" x2="180" y2="${floor_y + 25}" stroke="#475569" stroke-width="1" />
                    <line x1="280" y1="${floor_y}" x2="280" y2="${floor_y + 25}" stroke="#475569" stroke-width="1" />
                    <path d="M180,${floor_y + 15} L280,${floor_y + 15}" stroke="#475569" stroke-width="1" />
                    <text x="230" y="${floor_y + 28}" fill="#475569" font-size="8" font-weight="bold" text-anchor="middle">${tx('svg.setback')}</text>
                `;
            } else if (file.classifiedType === "Oval") {
                const rMajor = 5.0 * Math.tan((file.fwhmC0.angle / 2) * Math.PI / 180);
                const rMinor = 5.0 * Math.tan((file.fwhmC90.angle / 2) * Math.PI / 180);
                const pxMajor = Math.min(130, rMajor * 15);
                const pxMinor = Math.min(65, rMinor * 15);
                innerSvg = `
                    <ellipse cx="${cx}" cy="${floor_y}" rx="130" ry="25" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2" />
                    <ellipse cx="${cx}" cy="${floor_y}" rx="${pxMajor}" ry="${pxMinor}" fill="url(#oval-batch-grad)" stroke="#f59e0b" stroke-width="1.5" />
                    <line x1="${cx - pxMajor}" y1="${floor_y}" x2="${cx + pxMajor}" y2="${floor_y}" stroke="#b45309" stroke-width="1.2" />
                    <line x1="${cx}" y1="${floor_y - pxMinor}" x2="${cx}" y2="${floor_y + pxMinor}" stroke="#0284c7" stroke-width="1.2" />
                `;
            } else {
                const baRad = (file.fwhmC0.angle * Math.PI) / 180;
                const spotRadius = 5.0 * Math.tan(baRad / 2);
                const pxRad = Math.min(130, spotRadius * 20);
                innerSvg = `
                    <ellipse cx="${cx}" cy="${floor_y}" rx="140" ry="25" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
                    <polygon points="${cx},${cy_lum} ${cx - pxRad},${floor_y} ${cx + pxRad},${floor_y}" fill="url(#beam-batch-grad)" />
                    <ellipse cx="${cx}" cy="${floor_y}" rx="${pxRad}" ry="${pxRad * 0.18}" fill="rgba(251, 191, 36, 0.12)" stroke="#f59e0b" stroke-width="1.5" />
                `;
            }

            container.innerHTML = `
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                    <defs>
                        <radialGradient id="ww-batch-grad" cx="50%" cy="15%" r="65%">
                            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.8" />
                            <stop offset="100%" stop-color="#fef08a" stop-opacity="0.0" />
                        </radialGradient>
                        <radialGradient id="oval-batch-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.6"/>
                            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0"/>
                        </radialGradient>
                        <linearGradient id="beam-batch-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.55"/>
                            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0"/>
                        </linearGradient>
                    </defs>
                    ${innerSvg}
                </svg>
            `;
        }

        // --- 顯示 Toast 彈窗 ---
        function showToast(message) {
            const toast = document.getElementById('toast');
            if (!toast) return;
            document.getElementById('toast-message').innerText = message;
            
            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3500);
        }

        // --- 觸發 A4 同名列印 ---
        function triggerPrint() {
            const file = loadedIesFiles[activeFileIndex];
            if (!file) {
                showToast(tx("noValidData"));
                return;
            }

            const originalTitle = document.title;
            const cleanName = file.fileName.replace(/\.[^/.]+$/, "");
            
            // 同步標題
            document.title = cleanName;
            window.print();

            setTimeout(() => {
                document.title = originalTitle;
            }, 1500);
        }
    

Object.assign(window, {
  changeLanguage,
  setMode,
  switchTab,
  setAimingValue,
  resetAimingControls,
  filterFileList,
  BRAND,
  exportBatchZIP,
  triggerPrint,
  overrideSpectral,
  setComparisonSort,
  toggleComparisonSortDirection,
  resetComparisonColumns,
  applyComparisonColumnVisibility,
  toggleComparison,
  deleteFile,
  viewSpecFromComparison,
  removeFromComparison
});
