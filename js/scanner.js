window.VittaraScanner = {

    zxingMulti: null,
    barcodeDetector: null,
    scanCanvas: null,
    scanCtx: null,
    devices: [],
    deviceIndex: 0,
    currentDeviceId: null,
    lastLookup: null,
    seen: new Set(),
    activeStream: null,
    scanLoopActive: false,
    scanTimer: null,
    pendingCode: null,
    pendingCount: 0,

    refresh() {
        this.renderHomeCard();
        this.renderPage();
        this.renderHistory();
    },

    renderHomeCard() {
        return; // Gerenciado pela Home
    },

    renderPage() {
        const page = document.getElementById('page-scanner');
        if (!page) return;
        if (page.dataset.mounted === 'true') return;
        page.dataset.mounted = 'true';

        page.innerHTML = `
            <div class="scanner-wrap">
                <header class="scanner-heading">
                    <div>
                        <span class="scanner-eyebrow">VITTARAFIT · ALIMENTOS</span>
                        <h1>Scanner de produtos</h1>
                        <p>Descubra informações e acompanhe os produtos que você já leu.</p>
                    </div>
                    <span class="scanner-mode"><i class="ti ti-scan"></i> Leitor de código</span>
                </header>
                <div class="scanner-layout">
                    <section class="scanner-card scanner-camera-card">
                        <div class="scanner-card-heading">
                            <div>
                                <span class="scanner-step">01 · LEITOR</span>
                                <h2>Aponte para o código de barras</h2>
                                <p>Mantenha o código dentro da moldura central.</p>
                            </div>
                            <i class="ti ti-camera scanner-heading-icon"></i>
                        </div>

                        <div class="scanner-video-box">
                            <video id="scanner-video" muted playsinline></video>
                            <div class="scanner-frame" id="scanner-frame-box"></div>
                            <span class="scanner-viewfinder"><i class="ti ti-scan"></i></span>
                        </div>

                        <p id="scanner-status" class="scanner-status">
                            Toque em “Iniciar câmera” para começar.
                        </p>

                        <div class="scanner-controls">
                            <button class="btn-primary" id="scanner-start"><i class="ti ti-camera"></i> Iniciar câmera</button>
                            <button class="btn-secondary" id="scanner-switch" disabled><i class="ti ti-switch-2"></i> Trocar câmera</button>
                        </div>

                        <div class="scanner-divider">
                            <span>ou digite o código de barras</span>
                        </div>
                        <form id="scanner-manual-form" class="scanner-manual-form">
                            <div class="scanner-input-group">
                                <i class="ti ti-barcode"></i>
                                <input 
                                    type="text" 
                                    id="scanner-manual-input" 
                                    placeholder="Digite os 13 dígitos do EAN-13" 
                                    inputmode="numeric" 
                                    pattern="[0-9]*" 
                                    maxlength="13" 
                                    autocomplete="off"
                                >
                                <button type="submit" id="scanner-manual-btn" class="btn-primary" aria-label="Buscar produto" title="Buscar produto">
                                    <i class="ti ti-search"></i>
                                </button>
                            </div>
                            <span id="scanner-manual-error" class="scanner-manual-error"></span>
                        </form>
                    </section>

                    <div class="scanner-side-column">
                        <section class="scanner-card scanner-info-card">
                            <div class="scanner-card-heading compact">
                                <div>
                                    <span class="scanner-step">02 · INFORMAÇÕES</span>
                                    <h2>Produto encontrado</h2>
                                </div>
                                <i class="ti ti-package scanner-heading-icon"></i>
                            </div>
                            <div id="scanner-product-empty" class="scanner-empty-state">
                                <i class="ti ti-barcode"></i>
                                <p>As informações do produto aparecerão aqui após a leitura.</p>
                            </div>
                            <div id="scanner-product" class="scanner-product"></div>
                        </section>

                        <section class="scanner-card scanner-history">
                            <div class="scanner-card-heading compact">
                                <div>
                                    <span class="scanner-step">SUA BIBLIOTECA</span>
                                    <h2>Produtos já cadastrados</h2>
                                    <p>Itens lidos e salvos na sua conta.</p>
                                </div>
                                <i class="ti ti-list-check scanner-heading-icon"></i>
                            </div>
                            <div id="scanner-history-list"></div>
                        </section>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('scanner-start')
            ?.addEventListener('click', () => this.start());

        document.getElementById('scanner-switch')
            ?.addEventListener('click', () => this.switchCamera());

        const manualInput = document.getElementById('scanner-manual-input');
        if (manualInput) {
            manualInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 13);
            });
        }
        const manualForm = document.getElementById('scanner-manual-form');
        if (manualForm) {
            manualForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleManualSubmit();
            });
        }
    },

    handleManualSubmit() {
        const input = document.getElementById('scanner-manual-input');
        const errorEl = document.getElementById('scanner-manual-error');
        if (!input) return;

        const barcode = input.value.trim();
        if (errorEl) errorEl.textContent = '';

        if (!barcode) {
            const msg = 'Por favor, digite o código de barras.';
            if (errorEl) errorEl.textContent = msg;
            this.setStatus(msg, 'error');
            return;
        }

        if (barcode.length !== 13) {
            const msg = `O código EAN-13 deve ter 13 dígitos (você digitou ${barcode.length}).`;
            if (errorEl) errorEl.textContent = msg;
            this.setStatus(msg, 'error');
            return;
        }

        input.blur();
        this.setStatus(`Buscando código: ${barcode}...`, 'success');
        this.lastLookup = null;
        this.lookupProduct(barcode);
    },

    // Configurado estritamente para EAN-13 (evita ler metade do código como EAN-8)
    initEngines() {
        if (window.ZXing && !this.zxingMulti) {
            const hints = new Map();
            hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                ZXing.BarcodeFormat.EAN_13
            ]);
            hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

            this.zxingMulti = new ZXing.MultiFormatReader();
            this.zxingMulti.setHints(hints);
        }

        if (!this.scanCanvas) {
            this.scanCanvas = document.createElement('canvas');
            this.scanCtx = this.scanCanvas.getContext('2d', { willReadFrequently: true });
        }

        if (!this.barcodeDetector && 'BarcodeDetector' in window) {
            try {
                this.barcodeDetector = new BarcodeDetector({
                    formats: ['ean_13']
                });
            } catch (e) {}
        }
    },

    // Valida se o código tem exatamente 13 dígitos e se o dígito verificador EAN-13 é autêntico
    isValidEAN13(code) {
        if (!/^\d{13}$/.test(code)) return false;
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(code[i], 10);
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(code[12], 10);
    },

    // Filtra para manter apenas 1 Traseira Principal (alta resolução) e 1 Frontal
    async buildCleanCameraList() {
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = all.filter(d => d.kind === 'videoinput');

        const backCams = videoInputs.filter(d => /back|traseira|rear|environment/i.test(d.label));
        const frontCams = videoInputs.filter(d => /front|frontal|user|selfie|facetime/i.test(d.label));

        if (backCams.length > 0 || frontCams.length > 0) {
            const list = [];

            if (backCams.length > 0) {
                const bestBack = backCams.length > 1 ? backCams[1] : backCams[0];
                list.push(bestBack);
            }

            if (frontCams.length > 0) {
                list.push(frontCams[0]);
            }

            this.devices = list;
        } else {
            this.devices = videoInputs;
        }
    },

    async start() {
        const startBtn = document.getElementById('scanner-start');
        if (startBtn) startBtn.disabled = true;

        try {
            if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
                throw new Error('SECURE_CONTEXT_REQUIRED');
            }

            this.initEngines();
            await this.buildCleanCameraList();

            this.deviceIndex = 0;
            this.currentDeviceId = this.devices[0]?.deviceId || null;

            await this.startScanning(this.currentDeviceId);
        } catch (e) {
            const messages = {
                SECURE_CONTEXT_REQUIRED: 'Abra o app em https:// ou http://localhost para usar a câmera.',
                NotAllowedError: 'A permissão da câmera foi negada. Libere o acesso no navegador.',
                PermissionDeniedError: 'A permissão da câmera foi negada.',
                NotFoundError: 'Nenhuma câmera encontrada neste aparelho.',
                NotReadableError: 'A câmera está ocupada por outro aplicativo.',
            };

            this.setStatus(messages[e.name] || `Erro ao acessar câmera: ${e.message}`, 'error');
            if (startBtn) startBtn.disabled = false;
        }
    },

    async startScanning(deviceId) {
        this.stop(true);

        const video = document.getElementById('scanner-video');
        if (!video) return;

        this.setStatus('Abrindo câmera...');

        const constraints = {
            audio: false,
            video: deviceId
                ? {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
                : {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.activeStream = stream;

            video.muted = true;
            video.playsInline = true;
            video.srcObject = stream;

            await new Promise((resolve) => {
                if (video.readyState >= 1) return resolve();
                const onLoaded = () => {
                    video.removeEventListener('loadedmetadata', onLoaded);
                    resolve();
                };
                video.addEventListener('loadedmetadata', onLoaded);
                setTimeout(resolve, 500);
            });

            try {
                await video.play();
            } catch (playErr) {
                console.warn('Aviso de play ignorado:', playErr);
            }

            await this.buildCleanCameraList();

            const track = stream.getVideoTracks()[0];
            if (track && track.getCapabilities) {
                const caps = track.getCapabilities();
                if (caps.focusMode && caps.focusMode.includes('continuous')) {
                    track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
                }
            }

            this.scanLoopActive = true;
            this.pendingCode = null;
            this.pendingCount = 0;
            this.setStatus('Câmera ativa! Aponte para o código de barras.', 'success');

            const startBtn = document.getElementById('scanner-start');
            if (startBtn) startBtn.disabled = true;

            const switchBtn = document.getElementById('scanner-switch');
            if (switchBtn) switchBtn.disabled = this.devices.length < 2;

            this.scheduleNextScan(video);

        } catch (e) {
            this.setStatus('Erro ao abrir câmera: ' + e.message, 'error');
            const startBtn = document.getElementById('scanner-start');
            if (startBtn) startBtn.disabled = false;
        }
    },

    scheduleNextScan(video) {
        if (!this.scanLoopActive) return;
        this.scanTimer = setTimeout(() => this.scanFrame(video), 70);
    },

    async scanFrame(video) {
        if (!this.scanLoopActive || !video || video.readyState < 2 || !video.videoWidth) {
            this.scheduleNextScan(video);
            return;
        }

        const vw = video.videoWidth;
        const vh = video.videoHeight;

        // 1. BarcodeDetector nativo (Android - já garante leitura real)
        if (this.barcodeDetector) {
            try {
                const barcodes = await this.barcodeDetector.detect(video);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    const candidate = String(barcodes[0].rawValue).trim();
                    if (this.isValidEAN13(candidate)) {
                        this.confirmAndDetect(candidate, true);
                        this.scheduleNextScan(video);
                        return;
                    }
                }
            } catch (e) {}
        }

        // 2. Quadro inteiro no Canvas (ZXing)
        const scale = Math.min(1, 800 / vw);
        const cw = Math.floor(vw * scale);
        const ch = Math.floor(vh * scale);

        this.scanCanvas.width = cw;
        this.scanCanvas.height = ch;
        this.scanCtx.filter = 'none';
        this.scanCtx.drawImage(video, 0, 0, cw, ch);

        let code = this.tryDecodeCanvas(this.scanCanvas);
        if (code) {
            this.confirmAndDetect(code);
            this.scheduleNextScan(video);
            return;
        }

        // 3. Recorte Central (Zoom na mira) + Alto Contraste
        const cropX = Math.floor(vw * 0.10);
        const cropY = Math.floor(vh * 0.20);
        const cropW = Math.floor(vw * 0.80);
        const cropH = Math.floor(vh * 0.60);

        this.scanCanvas.width = 640;
        this.scanCanvas.height = 360;
        this.scanCtx.filter = 'contrast(1.45) grayscale(1)';
        this.scanCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 640, 360);

        code = this.tryDecodeCanvas(this.scanCanvas);
        if (code) {
            this.confirmAndDetect(code);
            this.scheduleNextScan(video);
            return;
        }

        // 4. Recorte Desespelhado (para Webcams de PC e Câmera Frontal)
        this.scanCtx.save();
        this.scanCtx.scale(-1, 1);
        this.scanCtx.drawImage(video, cropX, cropY, cropW, cropH, -640, 0, 640, 360);
        this.scanCtx.restore();

        code = this.tryDecodeCanvas(this.scanCanvas);
        if (code) {
            this.confirmAndDetect(code);
            this.scheduleNextScan(video);
            return;
        }

        this.scheduleNextScan(video);
    },

    tryDecodeCanvas(canvas) {
        if (!this.zxingMulti || !window.ZXing) return null;

        try {
            const luminance = new ZXing.HTMLCanvasElementLuminanceSource(canvas);

            try {
                const bitmap1 = new ZXing.BinaryBitmap(new ZXing.GlobalHistogramBinarizer(luminance));
                const res1 = this.zxingMulti.decodeWithState(bitmap1);
                if (res1 && this.isValidEAN13(res1.getText())) return res1.getText();
            } catch (e1) {}

            try {
                const bitmap2 = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminance));
                const res2 = this.zxingMulti.decodeWithState(bitmap2);
                if (res2 && this.isValidEAN13(res2.getText())) return res2.getText();
            } catch (e2) {}
        } catch (e) {}

        return null;
    },

    // Confirma o código em 2 leituras seguidas (70ms) para eliminar 100% leituras falsas de imagem tremida
    confirmAndDetect(code, instant = false) {
        const clean = String(code || '').trim();
        if (!this.isValidEAN13(clean)) return;

        if (instant) {
            this.onDetect(clean);
            return;
        }

        if (this.pendingCode === clean) {
            this.pendingCount++;
            if (this.pendingCount >= 2) {
                this.pendingCode = null;
                this.pendingCount = 0;
                this.onDetect(clean);
            }
        } else {
            this.pendingCode = clean;
            this.pendingCount = 1;
        }
    },

    stop(silent = false) {
        this.scanLoopActive = false;
        this.pendingCode = null;
        this.pendingCount = 0;

        if (this.scanTimer) {
            clearTimeout(this.scanTimer);
            this.scanTimer = null;
        }

        if (this.activeStream) {
            this.activeStream.getTracks().forEach(track => {
                try { track.stop(); } catch (e) {}
            });
            this.activeStream = null;
        }

        const video = document.getElementById('scanner-video');
        if (video) {
            if (video.srcObject) {
                try {
                    video.srcObject.getTracks().forEach(t => t.stop());
                } catch (e) {}
                video.srcObject = null;
            }
        }

        if (!silent) {
            const startBtn = document.getElementById('scanner-start');
            if (startBtn) startBtn.disabled = false;
            const switchBtn = document.getElementById('scanner-switch');
            if (switchBtn) switchBtn.disabled = true;
            this.setStatus('Câmera desligada.');
        }
    },

    async switchCamera() {
        if (this.devices.length < 2) return;
        this.stop(true);
        await new Promise(r => setTimeout(r, 150));
        this.deviceIndex = (this.deviceIndex + 1) % this.devices.length;
        this.currentDeviceId = this.devices[this.deviceIndex].deviceId;
        await this.startScanning(this.currentDeviceId);
    },

    setStatus(msg, kind) {
        const el = document.getElementById('scanner-status');
        if (!el) return;
        el.textContent = msg;
        el.className = 'scanner-status' + (kind ? ' ' + kind : '');
    },

    onDetect(rawText) {
        const text = String(rawText || '').trim();
        if (!this.isValidEAN13(text)) return;

        if (this.seen.has(text)) return;
        this.seen.add(text);
        setTimeout(() => this.seen.delete(text), 4000);

        const frame = document.getElementById('scanner-frame-box');
        if (frame) {
            frame.style.borderColor = '#4ade80';
            frame.style.boxShadow = '0 0 25px rgba(74, 222, 128, 0.7), 0 0 0 999px rgba(2, 10, 13, 0.46)';
            setTimeout(() => {
                frame.style.borderColor = '';
                frame.style.boxShadow = '';
            }, 600);
        }

        try {
            navigator.vibrate?.([70]);
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(1150, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.09);
        } catch (e) {}

        this.setStatus(`Código lido: ${text}! Buscando informações...`, 'success');
        this.lastLookup = null;
        this.lookupProduct(text);
    },

    async lookupProduct(barcode) {
        if (this.lastLookup === barcode) return;
        this.lastLookup = barcode;

        const box = document.getElementById('scanner-product');
        const emptyState = document.getElementById('scanner-product-empty');
        if (emptyState) emptyState.hidden = true;
        if (box) {
            box.classList.add('visible');
            box.innerHTML = `<p class="scanner-msg">Buscando produto do código <strong>${barcode}</strong>...</p>`;
            box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
            const data = await res.json();

            if (data.status !== 1 || !data.product) {
                const notFoundMsg = `Código ${barcode} lido com sucesso, mas este produto não foi encontrado na base Open Food Facts.`;
                if (box) box.innerHTML = `<p class="scanner-msg">${notFoundMsg}</p>`;
                this.setStatus(notFoundMsg, 'error');
                window.VittaraUI?.toast?.(`Código ${barcode} lido (não encontrado na base)`, 'error');
                return;
            }

            const p = data.product;
            const produto = {
                barcode,
                nome: p.product_name_pt || p.product_name || 'Nome não informado',
                marca: p.brands || '',
                imagem: p.image_front_small_url || p.image_url || '',
                ingredientes: p.ingredients_text_pt || p.ingredients_text || 'Ingredientes não informados nesta base.',
                alergenos: (p.allergens_tags || []).map(a => a.replace('en:', '').replace(/-/g, ' ')).join(', '),
                nutriscore: (p.nutriscore_grade || '').toUpperCase(),
                nova: p.nova_group || null,
            };

            this.setStatus(`Produto encontrado: ${produto.nome}`, 'success');
            this.renderProduct(produto);

            if (window.VittaraAuth?.currentUser) {
                VittaraDB.saveScan(produto).then(() => VittaraDB.loadScanHistory());
            }

            window.VittaraUI?.toast?.(`Produto encontrado: ${produto.nome}`, 'success');
        } catch (e) {
            if (box) box.innerHTML = `<p class="scanner-msg">Erro ao consultar produto: ${e.message}</p>`;
            this.setStatus(`Erro ao consultar código ${barcode}`, 'error');
        }
    },

    getNovaInfo(novaLevel) {
        if (!novaLevel) return null;
        const level = Number(novaLevel);
        const descriptions = {
            1: 'in natura ou minimamente processado',
            2: 'ingrediente culinário processado',
            3: 'alimento processado',
            4: 'ultraprocessado'
        };

        const desc = descriptions[level] || `nível ${level}`;
        const query = encodeURIComponent(`o que é a classificação NOVA ${level}`);
        const searchUrl = `https://www.google.com/search?q=${query}`;

        return {
            level,
            desc,
            badgeClass: `scanner-badge nova-${level}${level >= 4 ? ' warn' : ''}`,
            buttonText: `O que é o NOVA ${level}?`,
            searchUrl
        };
    },

    renderProduct(p) {
        const box = document.getElementById('scanner-product');
        if (!box) return;

        let badges = '';
        if (p.nutriscore) {
            badges += `<span class="scanner-badge">Nutri-Score ${p.nutriscore}</span>`;
        }

        const novaInfo = this.getNovaInfo(p.nova);
        if (novaInfo) {
            badges += `<span class="${novaInfo.badgeClass}">NOVA ${novaInfo.level} (${novaInfo.desc})</span>`;
        }

        box.innerHTML = `
            <div class="scanner-product-top">
                ${p.imagem ? `<img src="${p.imagem}" alt="${p.nome}">` : ''}
                <div>
                    <div class="scanner-product-name">${p.nome}</div>
                    ${p.marca ? `<div class="scanner-product-brand">${p.marca}</div>` : ''}
                </div>
            </div>
            ${badges ? `<div class="scanner-badges">${badges}</div>` : ''}
            
            ${novaInfo ? `
                <div class="scanner-nova-action">
                    <a href="${novaInfo.searchUrl}" target="_blank" rel="noopener noreferrer" class="btn-nova-explain">
                        <i class="ti ti-help-circle"></i> ${novaInfo.buttonText}
                    </a>
                </div>
            ` : ''}

            <div class="scanner-section">
                <h4>Ingredientes</h4>
                <p>${p.ingredientes}</p>
            </div>
            ${p.alergenos ? `
            <div class="scanner-section">
                <h4>Alérgenos</h4>
                <p>${p.alergenos}</p>
            </div>` : ''}
        `;
    },

    renderHistory() {
        const list = document.getElementById('scanner-history-list');
        if (!list) return;

        const history = window.VittaraState?.scanHistory || [];

        if (history.length === 0) {
            list.innerHTML = `
                <div class="scanner-history-empty">
                    <i class="ti ti-inbox"></i>
                    <p>Nenhum produto salvo ainda.</p>
                    <span>Os produtos lidos aparecerão nesta lista.</span>
                </div>`;
            return;
        }

        list.innerHTML = history.map(item => {
            const nutriBadge = item.nutriscore
                ? `<span class="scanner-badge">Nutri-Score ${item.nutriscore}</span>`
                : `<span class="scanner-badge muted">Nutri-Score N/A</span>`;

            const novaInfo = this.getNovaInfo(item.nova);
            const novaBadge = novaInfo
                ? `<span class="${novaInfo.badgeClass}">NOVA ${novaInfo.level} (${novaInfo.desc})</span>`
                : `<span class="scanner-badge muted">NOVA N/A</span>`;

            const novaButton = novaInfo
                ? `
                    <div class="scanner-nova-action">
                        <a href="${novaInfo.searchUrl}" target="_blank" rel="noopener noreferrer" class="btn-nova-explain" onclick="event.stopPropagation()">
                            <i class="ti ti-help-circle"></i> ${novaInfo.buttonText}
                        </a>
                    </div>
                `
                : '';

            return `
                <div class="scanner-history-item" onclick="VittaraScanner.toggleHistoryItem(this)">
                    <div class="scanner-history-header">
                        <span class="scanner-history-icon"><i class="ti ti-package"></i></span>
                        <span class="scanner-history-info">
                            <strong>${item.nome || item.barcode}</strong>
                            <small><i class="ti ti-barcode"></i> ${item.barcode}</small>
                        </span>
                        <i class="ti ti-chevron-right scanner-history-arrow"></i>
                    </div>
                    <div class="scanner-history-details">
                        <div class="scanner-history-badges">
                            ${nutriBadge}
                            ${novaBadge}
                        </div>
                        ${novaButton}
                    </div>
                </div>
            `;
        }).join('');
    },

    toggleHistoryItem(el) {
        if (!el) return;
        el.classList.toggle('open');
    }
};

// Desliga a câmera se o usuário minimizar o navegador ou trocar de guia
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.VittaraScanner) {
        window.VittaraScanner.stop();
    }
});