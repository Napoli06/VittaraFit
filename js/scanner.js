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
                <div class="scanner-video-box">
                    <video id="scanner-video" muted playsinline autoplay></video>
                    <div class="scanner-frame"></div>
                </div>
                
                <p id="scanner-status" class="scanner-status">
                    Toque em "iniciar câmera" para começar.
                </p>
                
                <div class="scanner-controls">
                    <button class="btn-primary" id="scanner-start">Iniciar câmera</button>
                    <button class="btn-secondary" id="scanner-switch" disabled>Trocar câmera</button>
                </div>
                
                <div id="scanner-product" class="scanner-product"></div>
                
                <div class="scanner-history">
                    <h3>Histórico de Leituras</h3>
                    <div id="scanner-history-list"></div>
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
    },

    //BLOCO 5: ligar a Câmera (sem isso n funciona né?)
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

    //BLOCO 6: o loop de leitura the fato.
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

    //BLOCO 7: trocar de câmera (se vc quiser se ver enquanto escaneia o código de barras, pq não?)
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

    //BLOCO 8: atualizar mensagem de status
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

    //BLOCO 9: o que o sistema faz quando detecta um código
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

    //BLOCO 10: buscar o produto na Open Food Facts
    async lookupProduct(barcode) {
        if (this.lastLookup === barcode) return;
        //se o ultimo codigo buscado foi esse msm, n repete a chamada a toa

        this.lastLookup = barcode;

        const box = document.getElementById('scanner-product');
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
            //desenha o card na tela (bloco 11, calma ai)

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

    //BLOCO 11: Card do produto
        renderProduct(p) {
        const box = document.getElementById('scanner-product');
        if (!box) return;

        let badges = '';
        if (p.nutriscore) {
            badges += `<span class="scanner-badge">Nutri-Score ${p.nutriscore}</span>`;
        }
        //só adiciona o selo de Nutri-Score se essa informação existir

        if (p.nova) {
            const alerta = p.nova >= 4 ? ' warn' : '';
            const texto = p.nova >= 4 ? ` (ultraprocessado)` : '';
            badges += `<span class="scanner-badge${alerta}">NOVA ${p.nova}${texto}</span>`;
        }
        //grupo NOVA 4 = ultraprocessado. Se for o caso, adiciona a classe
        //"warn" (deixa o selo vermelho, ver em pages.css) e o texto de aviso

        box.innerHTML = `
            <div class="scanner-product-top">
                ${p.imagem ? `<img src="${p.imagem}" alt="${p.nome}">` : ''}
                <div>
                    <div class="scanner-product-name">${p.nome}</div>
                    ${p.marca ? `<div class="scanner-product-brand">${p.marca}</div>` : ''}
                </div>
            </div>
            ${badges ? `<div class="scanner-badges">${badges}</div>` : ''}
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
        //evita, por exemplo, uma seção "Alérgenos" vazia
    },

    //BLOCO 12: histórico de leituras
    renderHistory() {
        const list = document.getElementById('scanner-history-list');
        if (!list) return;

        const history = window.VittaraState?.scanHistory || [];
        //pega o histórico do VittaraState (que ta no state.js)
        //"|| []" garante uma lista vazia como segurança, caso ainda n exista

        if (history.length === 0) {
            list.innerHTML = `<p class="scanner-msg">Nenhum produto escaneado ainda.</p>`;
            return;
        }

        list.innerHTML = history.map(item => `
            <div class="scanner-history-item">
                <span>${item.nome || item.barcode}</span>
                <small>${item.barcode}</small>
            </div>
        `).join('');
        //.map() transforma cada produto do histórico numa linha de HTML;
        //.join('') cola todas as linhas numa única string, sem separador,
        //pronta pra jogar direto no innerHTML
    }
};