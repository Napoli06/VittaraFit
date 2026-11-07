//BLOCO 1: abertura do objeto e variáveis (sempre bom começar de algum lugar né?)
window.VittaraScanner = {

    codeReader: null, //guarda a instancia do leitor da lin ZXing
    devices: [], //lista de câmeras do cell (preenchida após permissão)
    deviceIndex: 0, //indice de qual câmera está ativa
    currentDeviceId: null, //id da câmera em uso
    lastLookup: null, //guarda o ultimo codigo de barras buscado, pra nao buscar denovo a toa
    seen: new Set(), //guarda codigos de barras lidos a poucos segundos, pra n duplicar no histótico

    //BLOCO 2: refresh
    refresh() {
        this.renderHomeCard(); //desenha o card de atalho na home
        this.renderPage(); //desenha a tela cheia do scanner (só na primeira vez)
        this.renderHistory(); //atualiza a lista do histórico na tela
    },

    //BLOCO 3: card da home
    renderHomeCard() {
        const el = document.getElementById('home-scanner'); //busca a div home scanner que tem no html, linha 34

        if (!el) return; //se essa div nao existir na tela atual (tipo, se vc n ta na home), simplesmente nao acontece nada

        el.innerHTML = `
    <div class="scanner-shortcut" onclick="VittaraRouter.navigate('scanner')">
        <i class ="ti ti-scan"></i>
        <div class="scanner-shortcut-text">
            <strong>Escanear produto</strong>
            <span>Aponte a câmera pro código de barras</span>
        </div>
        <i class="ti ti-chevron-right"></i>
    </div>
`;
        //injeta o html dentro da div, o onclick chama o mesmo vittararouter.navigate() que os botões da barra inferiror (linha 80 do index) ja usam
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
        //async pq essa função usa await la dentro (função assíncrona que permite "pausar" a execução esperando
        //uma promise (espaço reservado para um valor ainda n pronto, resultado de função assíncrona), sem travar a tela)

        const startBtn = document.getElementById('scanner-start');
        startBtn.disabled = true;
        //desabilita o botão assim q clicado pra evitar duplo-clique

        try {
            if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
                throw new Error('SECURE_CONTEXT_REQUIRED');
            }

            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            //pede permissão ao usuário para usar a câmera, e espera ele permitir (await)

            tempStream.getTracks().forEach(t => t.stop());
            //desliga o stream de teste imediatamente (serviu apenas para desbloquear a permissão);
            //não será oq aparecerá na tela

            const all = await navigator.mediaDevices.enumerateDevices();
            //lista TODOS os dispositivos de mídia (cam, mic...)

            this.devices = all.filter(d => d.kind === 'videoinput');
            //filtra apenas as câmeras, tirando o mic/auto-falante

            const backCam = this.devices.find(d => /back|traseira|rear|environment/i.test(d.label));
            //procura entre as cameras alguma que tenha esse nome com essas palavras
            //(varia conforme fabricante/idioma do cell) para identificar a traseira

            this.deviceIndex = backCam ? this.devices.indexOf(backCam) : 0;
            //se achou a cam usa o indice dela na lista, senao usa a primeira (0)

            this.currentDeviceId = this.devices[this.deviceIndex]?.deviceId;
            //guarda o id dessa cam. O "?." evita erro se por algum motivo n houver nenhuma cam na lista

            await this.startScanning(this.currentDeviceId);
            //agr sim, liga a cam escolhida de vdd (segue prox blocoo)
        } catch (e) {
            const messages = {
                SECURE_CONTEXT_REQUIRED: 'Abra o app em https:// ou http://localhost para usar a câmera.',
                NotAllowedError: 'A câmera foi bloqueada. Libere a permissão do site e do Windows e tente novamente.',
                PermissionDeniedError: 'A câmera foi bloqueada. Libere a permissão do site e do Windows e tente novamente.',
                NotFoundError: 'Nenhuma câmera foi encontrada neste computador.',
                NotReadableError: 'A câmera está sendo usada por outro aplicativo.',
                OverconstrainedError: 'A câmera não atende às configurações disponíveis.',
            };

            this.setStatus(messages[e.name] || `Erro ao acessar a câmera: ${e.message}`, 'error');
            startBtn.disabled = false;
            //se qlqr coisa no bloco try der erro (tipo o user negar a permissão),
            //mostra a mensagem e reabilita o btn pra tentar dnv
        }
    },

    //BLOCO 7: o loop de leitura the fato.
    async startScanning(deviceId) {
        if (!this.codeReader) {
            const hints = new Map();
            hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                ZXing.BarcodeFormat.EAN_13
            ]);
            hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

            this.codeReader = new ZXing.BrowserMultiFormatReader(hints, 100);
        }
        //cria o "motor" de leitura da Zxing só na primeira vez
        //nas proximas vzs (tipo trocando de cam) reaproveita o mesmo

        const video = document.getElementById('scanner-video');

        try {
            this.setStatus('Abrindo Câmera...');

            await this.codeReader.decodeFromVideoDevice(deviceId, video, (result, err) => {
                //liga a camera "deviceId", joga o video dentro do elemento <video>
                //e chama a função repetidamente, pra cada frame capturado

                if (result) {
                    //result so vem preenchido qnd um codigo foi encontrado NESSE frame

                    this.setStatus(`Lido: ${result.getText()}`, 'success');
                    this.onDetect(result.getText(), result.getBarcodeFormat());
                    //result.getText() = numero do codigo;
                    // result.getBarcodeFormat() = o tipo (EAN-13, QR Code, etc)
                }
            });

            this.setStatus('Câmera Ativa. Aponte para um código de barras.', 'success');
            document.getElementById('scanner-switch').disabled = this.devices.length < 2;
            //so habilita o botao de trocar a camera se for detectada 2 ou mais cameras
        } catch (e) {
            this.setStatus('Erro ao Acessar a Câmera: ' + e.message, 'error');
        }
    },

    //BLOCO 8: trocar de câmera (se vc quiser se ver enquanto escaneia o código de barras, pq não?)
    async switchCamera() {
        if (this.devices.length < 2) return;
        //se tem so 1 cam ent nem faz sentido trocar, so sai da função

        this.codeReader.reset();
        //desliga a cam atual antes de trocar

        this.deviceIndex = (this.deviceIndex + 1) % this.devices.length;
        //avança pro prox indice da lista. O "% this.devices.length" faz
        //o indice voltar ao começo, se ta no ultimo item volta pro primeiro

        this.currentDeviceId = this.devices[this.deviceIndex].deviceId;
        await this.startScanning(this.currentDeviceId);
        //liga a prox cam da lista
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