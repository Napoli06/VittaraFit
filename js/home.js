const salvarDia = () => VittaraDB.saveDailyLog(VittaraHome.hojeKey());

window.VittaraHome = {
  montado: false,

  hojeKey() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  },

  refresh() {
    if (!this.montado) this.montar();
    this.render();

    // exibe banner de configuração de perfil se necessário
    this.mostrarBannerSetup();
  },

  montar() {
    document.getElementById('home-comeco').innerHTML = `
        <div class="home-topo-row">
          <div class="home-saudacao">
            <h1>Olá, <span id="h-nome" onclick="VittaraHome.abrirModalNome()" title="Clique 
            para alterar seu nome"></span>! 👋</h1>
            <p>Que bom ter você aqui!</p>
          </div>
        <div id="home-setup-slot"></div>
      </div>
      <div class="card">
        <h2>Resumo do dia</h2>
        <div class="home-resumo home-resumo--quatro">
          <div class="stat">
            <strong id="h-calorias-consumidas">0</strong>
            <span>Calorias<br>consumidas</span>
          </div>
          <div class="stat">
            <strong id="h-calorias-gastas">0</strong>
            <span>Calorias<br>gastas</span>
          </div>
          <div class="stat">
            <strong id="h-agua" class="destaque">0</strong>
            <span>ml<br>Água</span>
          </div>
          <div class="stat">
            <strong id="h-atividade">0</strong>
            <span>min<br>Atividade</span>
          </div>
        </div>
      </div>`;

    document.getElementById('home-scanner').innerHTML = `
      <div class="home-atalhos-coluna">
        <button onclick="VittaraRouter.navigate('scanner')">
          <div class="home-atalho-esq">
            <i class="ti ti-scan"></i>
            <span>Escanear Alimento</span>
          </div>
          <i class="ti ti-chevron-right seta"></i>
        </button>
        <button onclick="VittaraRouter.navigate('planner')">
          <div class="home-atalho-esq">
            <i class="ti ti-calendar-week"></i>
            <span>Planejamento Alimentar</span>
          </div>
          <i class="ti ti-chevron-right seta"></i>
        </button>
        <button onclick="VittaraRouter.navigate('list')">
          <div class="home-atalho-esq">
            <i class="ti ti-shopping-cart"></i>
            <span>Lista de Compras</span>
          </div>
          <i class="ti ti-chevron-right seta"></i>
        </button>
      </div>`;

    const elAgua = document.getElementById('home-agua');
    if (elAgua) elAgua.innerHTML = '';

    this.ligarEventos();
    this.montado = true;
  },

  ligarEventos() {
    document.getElementById('page-home').addEventListener('click', (e) => {
      const alvo = e.target.closest('[data-campo]');
      if (alvo) this.editar(alvo.dataset.campo);
    });
  },

  texto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  },

    render() {
    // Garante que a página foi montada antes de tentar desenhar nela
    if (!this.montado) this.montar();

    const { user, today } = VittaraState;
    const nome = user.name || 'Usuário';
    this.texto('h-nome', nome.split(' ')[0]);

    this.texto('h-calorias-consumidas', (today.kcalConsumidas || 0).toLocaleString('pt-BR'));
    this.texto('h-calorias-gastas',     (today.kcalGastas || 0).toLocaleString('pt-BR'));
    this.texto('h-agua',                (today.aguaMl || 0).toLocaleString('pt-BR'));
    this.texto('h-atividade',           (today.atividadeMin || 0));

    this.mostrarBannerSetup();
  },

  campos: {
    nome: {
      rotulo: 'Seu nome', tipo: 'texto',
      ler: () => VittaraState.user.name,
      aplicar: (v) => { VittaraState.user.name = v; },
      salvar: () => VittaraDB.updateProfile({ name: VittaraState.user.name })
    },
    calorias: {
      rotulo: 'Calorias consumidas hoje (kcal)', tipo: 'numero',
      ler: () => VittaraState.today.kcalConsumidas,
      aplicar: (v) => { VittaraState.today.kcalConsumidas = v; },
      salvar: salvarDia
    },
    aguaMl: {
      rotulo: 'Água consumida hoje (ml)', tipo: 'numero',
      ler: () => VittaraState.today.agua.consumida,
      aplicar: (v) => { VittaraState.today.agua.consumida = v; },
      salvar: salvarDia
    },
    atividade: {
      rotulo: 'Atividade de hoje (minutos)', tipo: 'numero',
      ler: () => VittaraState.today.atividade,
      aplicar: (v) => { VittaraState.today.atividade = v; },
      salvar: salvarDia
    },
    metaAguaL: {
      rotulo: 'Meta de água (litros)', tipo: 'numero',
      ler: () => VittaraState.user.metaAguaL || 2,
      aplicar: (v) => { VittaraState.user.metaAguaL = v; },
      salvar: () => VittaraDB.updateProfile({ metaAguaL: VittaraState.user.metaAguaL })
    }
  },

    async editar(campo) {
    if (campo === 'nome') {
      this.abrirModalNome();
      return;
    }

    const cfg = this.campos[campo];
    const resposta = prompt(cfg.rotulo + ':', cfg.ler());
    if (resposta === null) return;
    const limpo = resposta.trim();
    let valor;
    if (cfg.tipo === 'numero') {
      valor = Number(limpo.replace(',', '.'));
      if (limpo === '' || isNaN(valor) || valor < 0) {
        VittaraUI.toast('Digite um número válido', 'error');
        return;
      }
    } else {
      if (!limpo) return;
      valor = limpo;
    }

    cfg.aplicar(valor);
    this.render();
    try {
      await cfg.salvar();
    } catch (erro) {
      console.error(erro);
      VittaraUI.toast('Não foi possível salvar', 'error');
    }
  },

  abrirModalNome() {
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const nomeAtual = VittaraState.user.name || '';

    body.innerHTML = `
      <div class="setup-modal">
        <div class="setup-topo">
          <h2>Quer atualizar seu nome de perfil?</h2>
          <p>Como gostaria de ser chamado?</p>
        </div>

        <form onsubmit="event.preventDefault(); VittaraHome.salvarNovoNome();">
          <div class="setup-secao">
            <label class="setup-label" for="input-novo-nome">Nome de perfil</label>
            <input type="text" id="input-novo-nome" class="setup-input" 
                   placeholder="Digite seu nome..." value="${nomeAtual}" autocomplete="off">
          </div>

          <div class="setup-acoes">
            <button type="button" class="setup-btn-skip" onclick="VittaraHome.fecharModalNome()">Cancelar</button>
            <button type="submit" class="setup-btn-salvar">Salvar nome ✓</button>
          </div>
        </form>
      </div>
    `;

    overlay.classList.add('active');

    // Foca automaticamente no campo de texto
    setTimeout(() => {
      const inp = document.getElementById('input-novo-nome');
      if (inp) {
        inp.focus();
        inp.select();
      }
    }, 100);
  },

  fecharModalNome() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  async salvarNovoNome() {
    const input = document.getElementById('input-novo-nome');
    const novoNome = input ? input.value.trim() : '';

    if (!novoNome) {
      VittaraUI.toast('Digite um nome válido', 'error');
      return;
    }

    VittaraState.user.name = novoNome;
    this.render();
    if (window.VittaraProfile) VittaraProfile.render();
    this.fecharModalNome();

    try {
      await VittaraDB.updateProfile({ name: novoNome });
      VittaraUI.toast('Nome atualizado! ✨', 'success');
    } catch (e) {
      VittaraUI.toast('Erro ao salvar no banco de dados', 'error');
    }
  },

  mostrarBannerSetup() {
    const slot = document.getElementById('home-setup-slot');
    if (!slot) return;

    const { user } = VittaraState;

    // Se o perfil já estiver concluído (profileComplete === true), esconde o botão
    if (user.profileComplete) {
      slot.innerHTML = '';
      return;
    }

    // Se o perfil for novo/incompleto (false ou não preenchido), exibe o botão
    slot.innerHTML = `
      <button class="setup-pill-btn" onclick="VittaraSetup.abrir()" title="Terminar de configurar seu perfil">
        <div class="setup-pill-icone">
          <i class="ti ti-settings"></i>
        </div>
        <div class="setup-pill-textos">
          <strong>Complete seu perfil</strong>
          <span>Defina metas e medidas</span>
        </div>
        <i class="ti ti-chevron-right setup-pill-seta"></i>
      </button>
    `;
  },
};