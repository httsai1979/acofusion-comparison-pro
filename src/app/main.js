import JSZip from "jszip";
import { locales as DICT } from "../i18n/index.js";
import { BRAND } from "./brand.js";
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
            const map = {
                W_COLOUR_CCT_MISSING: {
                    en: "CCT was not found in filename or metadata; colour field shows N/A. Confirm with manufacturer data.",
                    de: "CCT wurde weder im Dateinamen noch in den Metadaten gefunden; das Farbfeld zeigt N/A. Bitte mit Herstellerdaten abgleichen.",
                    es: "No se encontró CCT en el nombre de archivo ni en los metadatos; el campo de color muestra N/A. Verifique con datos del fabricante.",
                    fa: "CCT در نام فایل یا metadata یافت نشد؛ فیلد رنگ N/A نمایش می‌دهد. با داده سازنده کنترل شود.",
                    "zh-Hant": "檔名或 metadata 中未找到 CCT；色彩欄位顯示 N/A，請以原廠資料確認。",
                    "zh-Hans": "文件名或 metadata 中未找到 CCT；色彩字段显示 N/A，请以厂家数据确认。",
                    ja: "ファイル名または metadata に CCT が見つかりません。色データは N/A 表示です。メーカー資料で確認してください。"
                },
                W_COLOUR_CRI_MISSING: {
                    en: "CRI/Ra was not found in filename or metadata; colour field shows N/A. Confirm with manufacturer data.",
                    de: "CRI/Ra wurde weder im Dateinamen noch in den Metadaten gefunden; das Farbfeld zeigt N/A. Bitte mit Herstellerdaten abgleichen.",
                    es: "No se encontró CRI/Ra en el nombre de archivo ni en los metadatos; el campo de color muestra N/A. Verifique con datos del fabricante.",
                    fa: "CRI/Ra در نام فایل یا metadata یافت نشد؛ فیلد رنگ N/A نمایش می‌دهد. با داده سازنده کنترل شود.",
                    "zh-Hant": "檔名或 metadata 中未找到 CRI/Ra；色彩欄位顯示 N/A，請以原廠資料確認。",
                    "zh-Hans": "文件名或 metadata 中未找到 CRI/Ra；色彩字段显示 N/A，请以厂家数据确认。",
                    ja: "ファイル名または metadata に CRI/Ra が見つかりません。色データは N/A 表示です。メーカー資料で確認してください。"
                }
            };
            return map[w.code]?.[currentLang] || map[w.code]?.en || w.msg || String(w);
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
            setText('btn-export-comparison', 'exportComparison');
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
            document.getElementById('tab-btn-audit').innerText = dictionary.tabAudit;

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
                    showToast(`批次導入成功：共新增/更新了 ${loadedCount} 個 IES / LDT 檔案${skippedCount ? `，略過 ${skippedCount} 個非支援檔案` : ''}`);
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
                    parsed = parseLDT(text, fileName);
                } else if (lowerName.endsWith('.ies')) {
                    parsed = parseIES(text, fileName);
                } else {
                    throw new Error('Unsupported photometric file type');
                }

                parsed.rawText = text;
                parsed.fileFormat = lowerName.endsWith('.ldt') ? 'LDT' : 'IES';
                parsed.warnings = dedupeWarnings([...(parsed.warnings || []), ...validateParsedPhotometricFile(parsed)]);
                
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
                showToast(`解析失敗：${fileName}｜${err.message || 'Unsupported or malformed file'}`);
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
            ensureSelectOption(criSelect, cri, cri === 'N/A' ? 'Not provided / N/A' : `CRI ${cri}`);
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

        function parseIES(text, fileName) {
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
                if (tIdx >= tokens.length) throw new Error(`IES missing numeric field: ${label}`);
                const value = parseFloat(tokens[tIdx++]);
                if (!Number.isFinite(value)) throw new Error(`IES invalid numeric field: ${label}`);
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

            if (numVerticalAngles <= 0 || numHorizontalAngles <= 0) throw new Error('IES angle counts must be positive');
            if (tokens.length < 13 + numVerticalAngles + numHorizontalAngles + numVerticalAngles * numHorizontalAngles) {
                throw new Error('IES candela matrix is incomplete');
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

        function parseLDT(text, fileName) {
            const rawLines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
            if (rawLines.length < 30) throw new Error('LDT file is too short or incomplete');

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
                throw new Error('Invalid LDT angle count');
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
                    throw new Error('LDT candela matrix is incomplete');
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

        function validateParsedPhotometricFile(file) {
            const warnings = [];
            const fmt = file.fileFormat || 'IES';
            const add = (code, msg) => warnings.push({ code, msg });

            if (!Array.isArray(file.verticalAngles) || file.verticalAngles.length !== file.numVerticalAngles) add('W_ANGLE_VERTICAL_COUNT', `${fmt} 垂直角度數量與宣告值不一致。`);
            if (!Array.isArray(file.horizontalAngles) || file.horizontalAngles.length !== file.numHorizontalAngles) add('W_ANGLE_HORIZONTAL_COUNT', `${fmt} 水平角度數量與宣告值不一致。`);
            if (!Array.isArray(file.candelaMatrix) || file.candelaMatrix.length !== file.numHorizontalAngles) add('W_MATRIX_H_COUNT', `${fmt} candela matrix 水平列數與宣告值不一致。`);
            if (Array.isArray(file.candelaMatrix)) {
                file.candelaMatrix.forEach((row, idx) => {
                    if (!Array.isArray(row) || row.length !== file.numVerticalAngles) add('W_MATRIX_V_COUNT', `${fmt} candela matrix 第 ${idx + 1} 列的垂直數量不一致。`);
                    if (Array.isArray(row) && row.some(v => !Number.isFinite(v))) add('W_MATRIX_NAN', `${fmt} candela matrix 包含非數字資料。`);
                });
            }
            if (!Number.isFinite(file.maxIntensity) || file.maxIntensity <= 0) add('W_PEAK_INTENSITY', `${fmt} peak candela 無效或為 0。`);
            if (!Number.isFinite(file.totalFlux) || file.totalFlux <= 0) add('W_TOTAL_FLUX', `${fmt} calculated total flux 無效或為 0。`);
            if (!Number.isFinite(file.inputWatts) || file.inputWatts <= 0) add('W_INPUT_WATTS', `${fmt} input watts 缺失或為 0；光效將以 fallback 計算。`);

            const hAngles = file.horizontalAngles || [];
            const vAngles = file.verticalAngles || [];
            const monotonic = arr => arr.every((v, i) => i === 0 || v >= arr[i - 1]);
            if (hAngles.length > 1 && !monotonic(hAngles)) add('W_H_ANGLE_ORDER', `${fmt} 水平角度不是遞增排列，可能影響曲線與積分。`);
            if (vAngles.length > 1 && !monotonic(vAngles)) add('W_V_ANGLE_ORDER', `${fmt} 垂直角度不是遞增排列，可能影響曲線與積分。`);
            if (hAngles.length > 1) {
                const hSpan = hAngles[hAngles.length - 1] - hAngles[0];
                if (![0, 90, 180, 360].some(span => Math.abs(hSpan - span) < 5)) add('W_H_COVERAGE', `${fmt} 水平角度覆蓋範圍不是常見 0/90/180/360 度；總流明積分可能需人工核對。`);
            }

            const declaredFlux = (Number(file.numLamps) || 0) * (Number(file.lumensPerLamp) || 0);
            if (declaredFlux > 0 && Number.isFinite(file.totalFlux)) {
                const diffRatio = Math.abs(file.totalFlux - declaredFlux) / declaredFlux;
                if (diffRatio > 0.25) add('W_FLUX_DECLARED_DIFF', `Calculated flux (${Math.round(file.totalFlux)} lm) 與 declared lamp flux (${Math.round(declaredFlux)} lm) 差異超過 25%；請核對 multiplier、LOR、近場資料或檔案單位。`);
            }
            if (file.metadata && file.metadata.NEARFIELD !== undefined) add('W_NEARFIELD_PRESENT', `${fmt} 含 NEARFIELD metadata；本工具仍以遠場配光比較為主。`);
            return warnings;
        }

        // --- 核心：光型特徵多維度智能分类 ---
        function classifyDistribution(fwhmC0, fwhmC90, peakVAngle, fileName) {
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
                    warnings.push({
                        code: "W_T_WW_SYM",
                        msg: "產品命名包含 Wallwash，但實際配光峰值偏角接近0度，可能屬於假洗牆或光型測試有誤。"
                    });
                }
            }
            // 2. 橢圓光型 (Oval Beam)
            else if (isOval || nameLower.includes('oval') || nameLower.includes('ellip') || nameLower.includes('15x60')) {
                type = "Oval";
                use = "Linear objects, corridors, retail shelving and sculpture accent lighting"; useKey = "useOval";
                if (!isOval) {
                    warnings.push({
                        code: "W_T_OVAL_SYM",
                        msg: "產品命名寫有 Oval 橢圓，但 C0/C90 角度比極其接近對稱圓形，請核對配光正確性。"
                    });
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

        // --- 輔助：精確 FWHM 半值角計算與插值 ---
        function calculateFWHMForPlane(matrix, vAngles, hAngles, targetAngle1, targetAngle2) {
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

        function calculateTotalFlux(matrix, vAngles, hAngles) {
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

        // 🌟 輔助函數：從 IES 的指定水平/垂直剖面上，進行高精度線性插值獲得光強 (修正缺失問題)
        function getIntensityAtAngle(file, angle, rot) {
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
                item.dataset.fileName = String(file.fileName || '').toLowerCase();
                item.dataset.fileType = String(file.classifiedType || '').toLowerCase();
                item.dataset.fileFormat = (file.fileFormat || 'IES').toLowerCase();
                
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

        function computeAimingMetrics(file, h = ceilingHeight) {
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
            const iBelow = Math.max(0, getIntensityAtAngle(file, tilt, rotationAngle));
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

        function updateAimingSummary(file) {
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
                    <div><span class="text-slate-500">Offset</span> <b class="text-white">${m.offset.toFixed(2)} m</b></div>
                    <div><span class="text-slate-500">Slant</span> <b class="text-white">${m.slantDistance.toFixed(2)} m</b></div>
                    <div><span class="text-slate-500">Axis E</span> <b class="text-[#8ac43f]">${formatLux(m.eAxis)}</b></div>
                    <div><span class="text-slate-500">Below E</span> <b class="text-slate-100">${formatLux(m.eBelow)}</b></div>
                    <div><span class="text-slate-500">Major</span> <b class="text-white">${majorText}</b></div>
                    <div><span class="text-slate-500">Minor</span> <b class="text-white">${minorText}</b></div>
                    <div><span class="text-slate-500">Stretch</span> <b class="text-white">${stretchText}</b></div>
                    <div><span class="text-slate-500">Axis factor</span> <b class="text-white">${(m.relativeAxisFactor * 100).toFixed(0)}%</b></div>
                </div>
                <div class="mt-2 text-slate-500">Axis E uses peak candela and aiming geometry as an indicative value. Use project software for formal illuminance verification.</div>`;
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
                    <text x="174" y="${floorY / 2}" fill="#475569" font-size="9" font-weight="bold" text-anchor="middle" transform="rotate(-90 174 ${floorY/2})">Wallwash preview H ${m.h.toFixed(1)}m</text>
                    <text x="${cx}" y="${floorY + 26}" fill="#475569" font-size="9" font-weight="bold" text-anchor="middle">Setback / aiming preview only</text>`;
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
                    <text x="${targetX}" y="${Math.max(18, targetY - minorPx - 11)}" fill="#b45309" font-size="9" font-weight="bold" text-anchor="middle">Axis E ${formatLux(m.eAxis)}</text>
                    <text x="${cx + dx/2}" y="${floorY + 15}" fill="#475569" font-size="8" font-weight="bold" text-anchor="middle">Offset ${m.offset.toFixed(2)}m</text>
                    <text x="${cx}" y="${floorY + 33}" fill="#475569" font-size="8" font-weight="bold" text-anchor="middle">Major ${majorLabel} / Minor ${Number.isFinite(m.minor) ? m.minor.toFixed(2) + ' m' : 'N/A'}</text>`;
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

        // 🌟 重新改寫底層 Canvas 配光繪製，支持後台無 DOM 離線與白底繪製
        function drawPolarToCanvas(canvas, file, forceWidth, forceHeight) {
            const dpr = window.devicePixelRatio || 1;
            
            // 安全分度高度計算：如果未傳入強制尺寸，則讀取父容器。否則採用後台離線預設值
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
                    
                    // 防禦安全機制，防止零或負寬度渲染
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
            
            // 🌟 在背景繪製前填充「純白色底圖 (Solid White Background)」
            // 這樣可以完美防止匯出後的 PNG 圖檔在看圖軟體預設為深色底時「因全透明而呈現全黑看不見」的 Bug！
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

            // 1. 繪製極座標網格
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 0.8;
            ctx.fillStyle = '#64748b';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 同心半圓
            const rings = 5;
            for (let r = 1; r <= rings; r++) {
                const radius = (maxRadius / rings) * r;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI, false);
                ctx.stroke();

                // 🌟 優化關鍵：完全同步 image_f7f2cb.png 樣式
                // 將數值標示（如 1000, 2000, 3000）垂直繪製在 0 度軸線上
                const ringVal = Math.round((rMax / rings) * r);
                ctx.fillStyle = '#475569';
                ctx.font = 'bold 8px sans-serif';
                ctx.fillText(ringVal.toString(), cx, cy + radius);
            }

            // 放射線
            const angles = [-90, -60, -30, 0, 30, 60, 90];
            angles.forEach(ang => {
                const rad = (ang + 90) * Math.PI / 180;
                const x = cx + maxRadius * Math.cos(rad);
                const y = cy + maxRadius * Math.sin(rad);

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(x, y);
                ctx.stroke();

                // 標記角度文字 (左右對調符合投射習慣)
                const labelX = cx + (maxRadius + 14) * Math.cos(rad);
                const labelY = cy + (maxRadius + 14) * Math.sin(rad);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '8px sans-serif';
                ctx.fillText(`${ang}°`, labelX, labelY);
            });

            // 2. 獲取並繪製真實曲線
            function getHIndex(target) {
                let closestIdx = 0;
                let minDiff = Infinity;
                for (let i = 0; i < file.horizontalAngles.length; i++) {
                    let diff = Math.min(Math.abs(file.horizontalAngles[i] - target), Math.abs(360 - Math.abs(file.horizontalAngles[i] - target)));
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdx = i;
                    }
                }
                return closestIdx;
            }

            const c0Idx = getHIndex(0);
            const c90Idx = getHIndex(90);
            const c180Idx = getHIndex(180);
            const c270Idx = getHIndex(270);

            // 繪製 C0-180 (深藍色)
            drawPhotometricPlane(ctx, cx, cy, maxRadius, rMax, file, c0Idx, c180Idx, 'rgba(13, 110, 253, 0.95)');
            // 繪製 C90-270 (橘色)
            drawPhotometricPlane(ctx, cx, cy, maxRadius, rMax, file, c90Idx, c270Idx, 'rgba(249, 115, 22, 0.95)');
        }

        // --- TAB 2: 多檔案配光疊加圖 (Polar Overlays) ---
        function renderPolarOverlay() {
            const canvas = document.getElementById('polar-overlay-canvas');
            if (!canvas) return;

            const comparisonFiles = getSortedComparisonFiles();
            const legendContainer = document.getElementById('overlay-legends');
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
                ctx.fillText('No files selected for comparison.', width / 2, height / 2 - 8);
                ctx.fillText('Use Compare ON/OFF in the file list.', width / 2, height / 2 + 12);
                if (legendContainer) {
                    legendContainer.innerHTML = `<div class="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">目前沒有選擇任何檔案進行比較。請在左側 IES / LDT 檔案列表中開啟 Compare。</div>`;
                }
                return;
            }

            const cx = width / 2;
            const cy = 35;
            const maxRadius = Math.max(10, Math.min(width / 2 - 30, height - 60));

            // 尋找比較清單中的最大強度，不再使用所有已載入檔案
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

            // 繪製背景網格
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

            if (legendContainer) legendContainer.innerHTML = '';

            comparisonFiles.forEach((file, fIdx) => {
                const color = COMPARE_COLORS[fIdx % COMPARE_COLORS.length];
                if (legendContainer) {
                    const masterIndex = loadedIesFiles.indexOf(file);
                    const legendItem = document.createElement('div');
                    legendItem.className = "flex items-center justify-between gap-2 py-1.5 border-b border-slate-100";
                    legendItem.innerHTML = `
                        <div class="flex items-center min-w-0">
                            <span class="w-3 h-1 rounded mr-1.5 inline-block shrink-0" style="background-color: ${color}"></span>
                            <span class="truncate font-semibold text-slate-800" title="${escapeHTML(file.fileName)}">${escapeHTML(file.fileName)}</span>
                        </div>
                        <button onclick="removeFromComparison(${masterIndex}, event)" class="text-[9px] px-2 py-0.5 rounded bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200">Remove</button>
                    `;
                    legendContainer.appendChild(legendItem);
                }

                function getH0Index() {
                    let closestIdx = 0;
                    let minDiff = Infinity;
                    for (let i = 0; i < file.horizontalAngles.length; i++) {
                        let diff = Math.min(Math.abs(file.horizontalAngles[i] - 0), Math.abs(360 - Math.abs(file.horizontalAngles[i] - 0)));
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestIdx = i;
                        }
                    }
                    return closestIdx;
                }
                function getH180Index() {
                    let closestIdx = 0;
                    let minDiff = Infinity;
                    for (let i = 0; i < file.horizontalAngles.length; i++) {
                        let diff = Math.min(Math.abs(file.horizontalAngles[i] - 180), Math.abs(360 - Math.abs(file.horizontalAngles[i] - 180)));
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestIdx = i;
                        }
                    }
                    return closestIdx;
                }

                drawPhotometricPlane(ctx, cx, cy, maxRadius, rMax, file, getH0Index(), getH180Index(), color);
            });
        }

        // --- 核心對比表格矩陣更新 ---
        function updateComparisonMatrix() {
            const matrixBody = document.getElementById('comparison-matrix-body');
            if (!matrixBody) return;
            matrixBody.innerHTML = '';
            updateComparisonCount();

            const sortSelect = document.getElementById('comparison-sort-select');
            if (sortSelect && sortSelect.value !== comparisonSortKey) sortSelect.value = comparisonSortKey;
            const sortBtn = document.getElementById('comparison-sort-direction');
            if (sortBtn) sortBtn.innerText = comparisonSortDirection === 'asc' ? tx('asc') : tx('desc');

            const comparisonFiles = getSortedComparisonFiles();
            if (comparisonFiles.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td colspan="9" class="py-8 px-4 text-center text-slate-500 bg-slate-50">
                        <div class="font-bold text-slate-700 mb-1">No files selected for comparison.</div>
                        <div class="text-xs">請在左側 IES / LDT 檔案列表中開啟 Compare，將檔案加入 Multi Comparison Dashboard。</div>
                    </td>
                `;
                matrixBody.appendChild(tr);
                applyComparisonColumnVisibility();
                return;
            }

            comparisonFiles.forEach((file) => {
                const index = loadedIesFiles.indexOf(file);
                const watts = file.inputWatts > 0 ? file.inputWatts : 0;
                const efficiency = watts > 0 ? file.totalFlux / watts : 0;
                const wattsText = watts > 0 ? watts.toFixed(1) : 'N/A';
                const effText = watts > 0 ? efficiency.toFixed(1) : 'N/A';
                
                const tr = document.createElement('tr');
                tr.className = index === activeFileIndex ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-slate-50';
                
                tr.innerHTML = `
                    <td data-col="file" class="py-3 px-3 font-semibold text-slate-900 max-w-[200px]" title="${escapeHTML(file.fileName)}"><span class="text-[9px] mr-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">${escapeHTML(file.fileFormat || 'IES')}</span><span class="truncate">${escapeHTML(file.fileName)}</span></td>
                    <td data-col="type" class="py-3 px-2 font-bold text-amber-600">${escapeHTML(file.classifiedType)}</td>
                    <td data-col="watts" class="py-3 px-2 text-center font-bold">${wattsText}</td>
                    <td data-col="flux" class="py-3 px-2 text-center">${Math.round(file.totalFlux).toLocaleString()}</td>
                    <td data-col="eff" class="py-3 px-2 text-center text-emerald-600 font-bold">${effText}</td>
                    <td data-col="cbcp" class="py-3 px-2 text-center font-bold">${Math.round(file.maxIntensity).toLocaleString()}</td>
                    <td data-col="ba" class="py-3 px-3 text-center font-semibold text-blue-600">${Math.round(file.fwhmC0.angle)}° / ${Math.round(file.fwhmC90.angle)}°</td>
                    <td data-col="use" class="py-3 px-3 text-xs text-slate-500 max-w-[180px] truncate" title="${escapeHTML(localizedUse(file))}">${escapeHTML(localizedUse(file))}</td>
                    <td class="py-3 px-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="viewSpecFromComparison(${index}, event)" class="text-[9px] px-2 py-1 rounded bg-slate-900 text-white hover:bg-slate-700 transition">View</button>
                            <button onclick="removeFromComparison(${index}, event)" class="text-[9px] px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 transition">Remove</button>
                            <button onclick="deleteFile(${index}, event)" class="text-[9px] px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition">Delete</button>
                        </div>
                    </td>
                `;

                tr.addEventListener('click', () => {
                    activeFileIndex = index;
                    updateFileList();
                    renderReport(index); 
                    updateComparisonMatrix();
                    renderPolarOverlay();
                });

                matrixBody.appendChild(tr);
            });
            applyComparisonColumnVisibility();
        }

        // --- TAB 3: 數據審查報告 (Anomaly Prevention List) ---
        function renderAuditReport() {
            const container = document.getElementById('audit-reports-list');
            if (!container) return;
            const badge = document.getElementById('audit-badge');
            container.innerHTML = '';

            let totalWarningsCount = 0;

            loadedIesFiles.forEach(file => {
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
                        title: "命名與實際光型不一致 (Wallwash)",
                        level: "critical",
                        desc: "產品檔案名稱包含 'Wallwash'，但配光曲線測試報告的光強峰值角度、光強傾斜偏移不足，或高度對稱，實質配光屬於 Symmetric 對稱型，這可能導致洗牆面亮度均勻度不合格，或業務向客戶發送錯誤文件。"
                    });
                }

                if (nameLower.includes('oval') && !isOval) {
                    warnings.push({
                        title: "命名與實際光型不一致 (Oval)",
                        level: "high",
                        desc: "產品檔案名稱包含 'Oval' (橢圓光型)，但實際 FWHM C0與C90 角比極其接近 (1.0 附近)。請確認是否測試為對稱透鏡卻誤用了橢圓檔名。"
                    });
                }

                // 審查項 2：功耗功率比對 (防呆)
                const expectedWatts = file.inputWatts;
                const numW = nameLower.match(/(\d+)w/);
                if (numW && numW[1]) {
                    const parsedW = parseFloat(numW[1]);
                    if (Math.abs(expectedWatts - parsedW) > 5) {
                        warnings.push({
                            title: "功率標稱偏差過大 (Wattage Mismatch)",
                            level: "medium",
                            desc: `檔案名稱標記瓦數為 ${parsedW}W，但 IES 實測瓦數登錄為 ${expectedWatts.toFixed(1)}W。若登錄不準確可能在建立規格書時造成標稱矛盾。`
                        });
                    }
                }

                // 審查項 3：流明偏差防呆
                if (file.totalFlux < 50) {
                    warnings.push({
                        title: "流明數據過低警告 (Low Flux Warning)",
                        level: "high",
                        desc: "該 IES 計算的發光流明低於 50 lm。請確認是否未加入倍率因子 (Multiplier)，或檢測光源已嚴重損壞、或該IES為空數據。"
                    });
                }

                totalWarningsCount += warnings.length;

                // 渲染該燈具的警告看板
                if (warnings.length > 0) {
                    const fileCard = document.createElement('div');
                    fileCard.className = "border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50";
                    fileCard.innerHTML = `
                        <div class="flex justify-between items-center border-b border-slate-200 pb-2">
                            <span class="font-bold text-slate-800 text-sm truncate" title="${escapeHTML(file.fileName)}">${file.fileName}</span>
                            <span class="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full uppercase">${warnings.length} 個潛在異常</span>
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
            let csvContent = "\ufeff# Company," + csvCell(BRAND.companyName) + "\n" +
                "# Website," + csvCell(BRAND.website) + "\n" +
                "# Email," + csvCell(BRAND.email) + "\n" +
                "# Tool," + csvCell(BRAND.toolName) + "\n" +
                "# Version," + csvCell(BRAND.toolVersion) + "\n\n" +
                "File Name,Format,Included In Comparison,Type,Watts (W),Total Flux (lm),Efficacy (lm/W),Peak Candela (cd),FWHM C0,FWHM C90,Suggested Application\n";
            targetFiles.forEach(file => {
                const watts = file.inputWatts > 0 ? file.inputWatts : 50;
                const eff = file.totalFlux / watts;
                csvContent += [file.fileName, file.fileFormat || 'IES', file.includedInComparison !== false ? 'Yes' : 'No', file.classifiedType, watts.toFixed(1), Math.round(file.totalFlux), eff.toFixed(1), Math.round(file.maxIntensity), Math.round(file.fwhmC0.angle), Math.round(file.fwhmC90.angle), localizedUse(file)].map(csvCell).join(',') + "\n";
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
${BRAND.companyName.toUpperCase()} SPECIFICATION SHEET
=========================================
${brandMetadataLines()}
=========================================
FILE NAME: ${file.fileName}
FILE FORMAT: ${file.fileFormat || 'IES'}
INCLUDED IN COMPARISON: ${file.includedInComparison !== false ? 'YES' : 'NO'}
CLASSIFICATION: ${file.classifiedType}
TEST DATE: ${file.metadata['TESTDATE'] || 'Unknown'}

TECHNICAL METRICS:
- Input Power: ${watts.toFixed(1)} W
- Total Flux: ${Math.round(file.totalFlux)} lm
- Luminous Efficacy: ${eff.toFixed(1)} lm/W
- CBCP Peak Intensity: ${Math.round(file.maxIntensity)} cd
- Beam Spread (C0-180): ${Math.round(file.fwhmC0.angle)} deg
- Beam Spread (C90-270): ${Math.round(file.fwhmC90.angle)} deg

SUGGESTED USE:
${localizedUse(file)}

AIMING PREVIEW SETTINGS:
- Height: ${ceilingHeight.toFixed(2)} m
- Tilt: ${tiltAngle} deg
- Rotation: ${rotationAngle} deg
- Note: Aiming values are indicative and not a project-level lighting calculation.

SYSTEM REMARKS:
Generated automatically by ${BRAND.toolName} v${BRAND.toolVersion}.
This export is for photometric comparison and specification review, not project-level room calculation.
=========================================`;
                zip.file(`Single_Spec_Sheets/${cleanName}_Spec_Data.txt`, specText);
            });

            zip.file("README_SCOPE_AND_LIMITS.txt", `${BRAND.companyName} - ${BRAND.toolName}
${brandMetadataLines()}

Scope:
- IES / LDT photometric file review
- Product-level photometric comparison
- Sortable comparison matrix with optional column visibility
- Polar curve, CBCP, FWHM, flux, efficacy and audit export

Limits:
- This tool is not DIALux, Relux, AGi32 or Radiance.
- Aiming / footprint preview is indicative only and is not a project-level illuminance simulation.
- Glare risk is indicative only and is not a formal CIE 117 / EN 12464-1 UGR calculation.
- Declared colour data is taken from filename / metadata / manual input. TM-30, R9 and R15 require manufacturer data or SPD input and are not calculated here.
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
                    <text x="230" y="${floor_y + 28}" fill="#475569" font-size="8" font-weight="bold" text-anchor="middle">Setback</text>
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
