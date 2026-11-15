//BLOCO 1: abertura do objeto e variáveis (sempre bom começar de algum lugar né?)
window.VittaraScanner = {

    codeReader: null,
    controls: null,

    devices: [],
    deviceIndex: 0,
    currentDeviceId: null,

    lastLookup: null,
    seen: new Set(),

    // Controle do ciclo de vida da câmera
    cameraSession: 0,
    isScanning: false,

    //BLOCO 2: refresh
    refresh() {
        this.renderHomeCard(); //desenha o card de atalho na home
        this.renderPage(); //desenha a tela cheia do scanner (só na primeira vez)
        this.renderHistory(); //atualiza a lista do histórico na tela
    },

    //BLOCO 3: card da home
        // BLOCO 3: card da home
    renderHomeCard() {
        // Desativado: os 3 botões principais agora são gerenciados pela Home!
        return;
    },

    //BLOCO 4: montando a tela cheia
    renderPage() {
        const page = document.getElementById('page-scanner');
        //busca a section do id page scanner do index, linha 44

        if (!page) return;

        if (page.dataset.mounted === 'true') return;
        //TRAVA IMPORTANTE: se essa pagina ja foi desenhada antes, ela para aqui
        //sem isso, toda vez q voltasse pro scanner, o video seria recriado do zero
        //e a camera (ja ligada nele) perderia conexão

        page.dataset.mounted = 'true';
        //marca "ja montei" para proxima chamada de renderPage ser barrada acima

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
                                <p>Mantenha o produto estável e dentro da moldura.</p>
                            </div>
                            <i class="ti ti-camera scanner-heading-icon"></i>
                        </div>

                        <div class="scanner-video-box">
                            <video id="scanner-video" muted playsinline autoplay></video>
                            <div class="scanner-frame"></div>
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
            .addEventListener('click', () => this.start());
        //liga o clique do botão de iniciar a camera usando o metodo start
        //usar o "=>" ao invés de só "this.start" preserva a ideia de "isso" como o VittaraScanner
        //no momento que clicar

        document.getElementById('scanner-switch')
            .addEventListener('click', () => this.switchCamera());
        //mesma lógica, mas pra trocar a câmera

        // Desliga a câmera quando o usuário muda de aba
        document.addEventListener('visibilitychange', () => {

        if (document.hidden) {
            this.stop();
        }
    
        });

        // Desliga a câmera quando a página é abandonada
        window.addEventListener('pagehide', () => {
            this.stop();
        });

        const manualInput = document.getElementById('scanner-manual-input');
        if (manualInput) {
            // Garante apenas números em tempo real no mobile
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

        // BLOCO 5: envio manual do código de barras
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

        // Validação estrita do padrão EAN-13 (exatamente 13 dígitos numéricos)
        if (barcode.length !== 13) {
            const msg = `O código EAN-13 deve ter 13 dígitos (você digitou ${barcode.length}).`;
            if (errorEl) errorEl.textContent = msg;
            this.setStatus(msg, 'error');
            return;
        }

        // Fecha o teclado virtual no celular
        input.blur();

        this.setStatus(`Buscando código: ${barcode}...`, 'success');

        // Permite reconsultar mesmo que seja o mesmo código buscado antes
        this.lastLookup = null;

        // Dispara exatamente a mesma busca da câmera (Open Food Facts + Firestore)
        this.lookupProduct(barcode);
    },

    //BLOCO 6: ligar a Câmera (sem isso n funciona né?)
    async start() {

    const startBtn = document.getElementById('scanner-start');

    if (this.isScanning) return;

    if (startBtn) {
        startBtn.disabled = true;
    }

    // Identifica esta tentativa de inicialização
    const session = ++this.cameraSession;

    try {

        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            throw new Error('SECURE_CONTEXT_REQUIRED');
        }

        // Solicita acesso à câmera traseira, preferencialmente
        const tempStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });

        // Se o usuário saiu do scanner durante a solicitação,
        // encerra imediatamente o stream recebido
        if (session !== this.cameraSession) {
            tempStream.getTracks().forEach(track => track.stop());
            return;
        }

        // Libera o stream temporário
        tempStream.getTracks().forEach(track => track.stop());

        // Identifica as câmeras disponíveis
        const all = await navigator.mediaDevices.enumerateDevices();

        if (session !== this.cameraSession) return;

        this.devices = all.filter(device => device.kind === 'videoinput');

        if (!this.devices.length) {
            throw new Error('NotFoundError');
        }

        // Prioriza a câmera traseira
        const backCam = this.devices.find(device =>
            /back|traseira|rear|environment/i.test(device.label)
        );

        this.deviceIndex = backCam
            ? this.devices.indexOf(backCam)
            : 0;

        this.currentDeviceId = this.devices[this.deviceIndex].deviceId;

        this.isScanning = true;

        // Inicia a leitura
        await this.startScanning(this.currentDeviceId, session);

    } catch (e) {

        if (session !== this.cameraSession) return;

        const messages = {
            SECURE_CONTEXT_REQUIRED:
                'Abra o app em HTTPS ou localhost para utilizar a câmera.',

            NotAllowedError:
                'Acesso à câmera negado. Verifique as permissões.',

            PermissionDeniedError:
                'Acesso à câmera negado. Verifique as permissões.',

            NotFoundError:
                'Nenhuma câmera foi encontrada.',

            NotReadableError:
                'A câmera está sendo utilizada por outro aplicativo.',

            OverconstrainedError:
                'Não foi possível utilizar a câmera com as configurações solicitadas.'
        };

        this.isScanning = false;

        this.setStatus(
            messages[e.name] || `Erro ao acessar a câmera: ${e.message}`,
            'error'
        );

        if (startBtn) {
            startBtn.disabled = false;
        }

        console.error('Erro no scanner:', e);
    }
},

    //BLOCO 7: o loop de leitura the fato.
    async startScanning(deviceId, session = this.cameraSession) {

    if (!this.codeReader) {

        const hints = new Map();

        // Aceita especificamente códigos EAN-13
        hints.set(
            ZXing.DecodeHintType.POSSIBLE_FORMATS,
            [ZXing.BarcodeFormat.EAN_13]
        );

        // Aumenta o esforço de decodificação
        hints.set(
            ZXing.DecodeHintType.TRY_HARDER,
            true
        );

        // Cria o leitor com intervalo reduzido
        this.codeReader = new ZXing.BrowserMultiFormatReader(
            hints,
            50
        );
    }

    const video = document.getElementById('scanner-video');

    if (!video) return;

    try {

        this.setStatus('Preparando câmera...');

        const constraints = {
            video: {
                deviceId: deviceId
                    ? { exact: deviceId }
                    : undefined,

                width: { ideal: 1920 },
                height: { ideal: 1080 },

                frameRate: { ideal: 30 }
            },

            audio: false
        };

        // Inicia a leitura diretamente pelo fluxo de vídeo
        const controls = await this.codeReader.decodeFromConstraints(
            constraints,
            video,
            (result, error) => {

                // Ignora resultados de sessões encerradas
                if (session !== this.cameraSession) return;

                if (!this.isScanning) return;

                if (result) {

                    const barcode = result.getText();

                    // Confirma que a leitura é EAN-13 válido
                    if (!/^\d{13}$/.test(barcode)) return;

                    this.setStatus(
                        `Código detectado: ${barcode}`,
                        'success'
                    );

                    this.onDetect(
                        barcode,
                        result.getBarcodeFormat()
                    );
                }
            }
        );

        // Se o usuário saiu enquanto o ZXing iniciava,
        // encerra os controles recém-criados
        if (session !== this.cameraSession) {
            controls.stop();
            return;
        }

        this.controls = controls;

        this.setStatus(
            'Câmera ativa! Aponte para o código de barras.',
            'success'
        );

        const switchBtn = document.getElementById('scanner-switch');

        if (switchBtn) {
            switchBtn.disabled = this.devices.length < 2;
        }

    } catch (e) {

        if (session !== this.cameraSession) return;

        this.isScanning = false;

        this.setStatus(
            'Erro ao iniciar a leitura: ' + e.message,
            'error'
        );

        const startBtn = document.getElementById('scanner-start');

        if (startBtn) {
            startBtn.disabled = false;
        }

        console.error('Erro ZXing:', e);
    }
},

// Encerra os recursos da câmera atual
stopCurrentCamera() {

    // Encerra os controles fornecidos pelo ZXing
    if (this.controls) {

        try {
            this.controls.stop();
        } catch (e) {
            console.warn('Erro ao encerrar controles:', e);
        }

        this.controls = null;
    }

    // Reseta o leitor ZXing
    if (this.codeReader) {

        try {
            this.codeReader.reset();
        } catch (e) {
            console.warn('Erro ao resetar leitor:', e);
        }
    }

    // Encerra todas as trilhas de vídeo
    const video = document.getElementById('scanner-video');

    if (video) {

        if (video.srcObject) {

            video.srcObject.getTracks().forEach(track => {
                track.stop();
            });

            video.srcObject = null;
        }

        video.pause();
    }

},

// Encerra completamente o scanner
stop() {

    // Invalida qualquer inicialização pendente
    this.cameraSession++;

    this.isScanning = false;

    // Desliga todos os recursos da câmera
    this.stopCurrentCamera();

    // Atualiza os controles da interface
    const startBtn = document.getElementById('scanner-start');
    const switchBtn = document.getElementById('scanner-switch');

    if (startBtn) {
        startBtn.disabled = false;
    }

    if (switchBtn) {
        switchBtn.disabled = true;
    }

    // Atualiza o status
    this.setStatus('Câmera desligada.', '');

},

    //BLOCO 8: trocar de câmera (se vc quiser se ver enquanto escaneia o código de barras, pq não?)
    async switchCamera() {

    if (this.devices.length < 2) return;

    const session = this.cameraSession;

    // Encerra a câmera atual sem invalidar a sessão
    this.stopCurrentCamera();

    // Avança para a próxima câmera
    this.deviceIndex = (
        this.deviceIndex + 1
    ) % this.devices.length;

    this.currentDeviceId =
        this.devices[this.deviceIndex].deviceId;

    this.isScanning = true;

    await this.startScanning(
        this.currentDeviceId,
        session
    );
},

    //BLOCO 9: atualizar mensagem de status
    setStatus(msg, kind) {
        const el = document.getElementById('scanner-status');
        if (!el) return;
        el.textContent = msg;
        //muda o texto exibido

        el.className = 'scanner-status' + (kind ? ' ' + kind : '');
        //troca a classe do css, sempre tem scanner-status, e se kind foi passado,
        //como success ou error, adiciona tbm essa segunda classe,
        //que muda a cor do texto (definido em pages.css)
    },

    //BLOCO 10: o que o sistema faz quando detecta um código
    onDetect(text, format) {
        const key = format + ':' + text;
        //combina o tipo com um texto numa unica chave de identificação
        //ex: QR_CODE:290384799

        if (this.seen.has(key)) return;
        //se a chave ja foi vista a pouco tempo, ignora - isso evita
        //do mesmo codigo ser processado milhões de vezes por segundo
        //(decodeFromVideoDevice) chama esse fluxo em cada frame de video

        this.seen.add(key);
        setTimeout(() => this.seen.delete(key), 8000);
        //depois de 8 segundos, remove essa chave do "seen", permitindo que
        //o MESMO código seja lido dnv mais tarde (ex: escaneou o mesmo produto 2x)

        this.lookupProduct(text);
        //finalmente, dispara a busca pelo produto - próssimu bloko :)
    },

    //BLOCO 11: buscar o produto na Open Food Facts
    async lookupProduct(barcode) {
        if (this.lastLookup === barcode) return;
        //se o ultimo codigo buscado foi esse msm, n repete a chamada a toa

        this.lastLookup = barcode;

        const box = document.getElementById('scanner-product');
        const emptyState = document.getElementById('scanner-product-empty');
        if (emptyState) emptyState.hidden = true;
        box.classList.add('visible');
        //adiciona a classe q faz o card aparecer (css: .scanner-product.visible)

        box.innerHTML = `<p class="scanner-msg">Buscando Informações do Produto ${barcode}...</p>`;
        //mostra uma mensagem de "carregando" antes da resposta da API chegar

        try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
            //faz a requisição http para API publica da open food facts, usando o codigo de barras
            //lido diretamente na URL

            const data = await res.json();
            //espera a resposta e converte o corpo(json) num objeto(JS) utilizável

            if (data.status !== 1 || !data.product) {
                box.innerHTML = `<p class="scanner-msg">Produto Não Encontrado Para o Código ${barcode}.</p>`;
                return;
                //a API retorna status: 1 quando acha; qlqr outra coisa = não achou
            }

            const p = data.product;

            const produto = {
                barcode,

                nome: p.product_name_pt || p.product_name || 'Nome não informado',
                //tenta o nome em pt primeiro, se n tiver usa o genérico;
                //se n tiver nenhum usa texto padrão

                marca: p.brands || '',
                imagem: p.image_front_small_url || p.image_url || '',
                ingredientes: p.ingredients_text_pt || p.ingredients_text || 'Ingredientes não informados nesta base.',

                alergenos: (p.allergens_tags || []).map(a => a.replace('en:', '').replace(/-/g, ' ')).join(', '),
                //p.allergens_tags vem como ("en:milk"). O .map() limpa cada item (tira o prefixo "en:" e troca hífen por espaço),
                //e o .join(', ') junta tudo numa string separada por virgulas

                nutriscore: (p.nutriscore_grade || '').toUpperCase(),
                nova: p.nova_group || null,
            };
            //organiza tudo num objeto único "produto" - vamos usá-lo tanto pra mostrar na tela quanto pra salvar no Firestore

            this.renderProduct(produto);
            //desenha o card na tela (bloco 13, calma ai)

            if (window.VittaraAuth?.currentUser) {
                VittaraDB.saveScan(produto).then(() => VittaraDB.loadScanHistory());
            }
            //só salva no banco se o user ja estiver LOGADO
            //vittaraAuth.currentUser é nulo quando ngm logou
            //vittaraDB.saveScan() e loadScanHistory() já existiam prontas no firebase.js
            //a gnt so chama eles aqui. loadScanHistory ja termina chamando VittaraScanner.renderHistory sozinha
            //olhar o firebase.js, função loadScanHistory

            window.VittaraUI?.toast?.(`Produto Encontrado: ${produto.nome}`, 'success');
            //mostra uma notificação toast, SE o módulo VittaraUI (ui.js) já tiver
            //uma função toast() implementada. Os dois "?." evitam erro caso não tenha ainda.
        } catch (e) {
            box.innerHTML = `<p class="scanner-msg">Erro ao Consultar o Produto: ${e.message}</p>`;
            //se a internet cair ou a API falhar, mostra isso em vez de travar 
        }
    },

    //BLOCO 12: auxiliar da classificação NOVA (níveis 1, 2, 3 e 4)
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

    //BLOCO 13: Card do produto encontrado
    renderProduct(p) {
        const box = document.getElementById('scanner-product');
        if (!box) return;

        let badges = '';
        if (p.nutriscore) {
            badges += `<span class="scanner-badge">Nutri-Score ${p.nutriscore}</span>`;
        }

        // Adiciona o selo da classificação NOVA com descrição do nível
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
            
            <!-- Botão dinâmico que abre a pesquisa no Google em nova aba -->
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
        //cada "${condição ? '...' : ''}" só mostra aquele pedaço de HTML se a informação existir
    },

    //BLOCO 14: histórico de leituras
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

            // Botão no histórico com onclick="event.stopPropagation()" para não fechar a gaveta ao clicar
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
                    <!-- Área do efeito cascata com resumo e botão do Google -->
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

    //BLOCO 15: alternar abertura do efeito cascata
    toggleHistoryItem(el) {
        if (!el) return;
        el.classList.toggle('open');
    }
};