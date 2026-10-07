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
    },

      montar() {
    document.getElementById('home-comeco').innerHTML = `
      <div class="home-saudacao">
        <h1>Olá, <span id="h-nome" data-campo="nome"></span>! 👋</h1>
        <p>Que bom ter você aqui!</p>
      </div>
      <div class="card">
        <h2>Resumo do dia</h2>
        <div class="home-resumo">
          <div class="stat" data-campo="calorias">
            <strong id="h-calorias"></strong>
            <span>Calorias<br>restantes</span>
          </div>
          <div class="stat" data-campo="aguaMl">
            <strong id="h-agua" class="destaque"></strong>
            <span>ml<br>Água</span>
          </div>
          <div class="stat" data-campo="atividade">
            <strong id="h-atividade"></strong>
            <span>min<br>Atividade</span>
          </div>
        </div>
      </div>`;

    document.getElementById('home-scanner').innerHTML = `
      <div class="home-atalhos">
        <button onclick="VittaraRouter.navigate('scanner')">
          <i class="ti ti-scan"></i><span>Escanear<br>Alimento</span>
        </button>
        <button onclick="VittaraRouter.navigate('planner')">
          <i class="ti ti-calendar-week"></i><span>Planejamento<br>Alimentar</span>
        </button>
        <button onclick="VittaraRouter.navigate('ai')">
          <i class="ti ti-chef-hat"></i><span>Receitas<br>Saudáveis</span>
        </button>
        <button onclick="VittaraRouter.navigate('list')">
          <i class="ti ti-shopping-cart"></i><span>Lista de<br>Compras</span>
        </button>
      </div>`;

    document.getElementById('home-agua').innerHTML = `
      <div class="card">
        <h2>Meta diária</h2>
        <div class="home-meta-topo">
          <p>Beber <span id="h-meta" data-campo="metaAguaL"></span>L de água</p>
          <i class="ti ti-droplet gota"></i>
        </div>
        <div class="home-meta-info">
          <span id="h-agua-texto"></span>
          <span id="h-agua-pct"></span>
        </div>
        <div class="barra"><div class="barra-cheia" id="h-barra"></div></div>
      </div>`;

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
    const { user, today } = VittaraState;
    const nome = user.name || 'Usuário';
    this.texto('h-nome', nome.split(' ')[0]);

    const restantes = Math.max(0, today.alvoKcal - today.kcalConsumidas);
    this.texto('h-calorias', restantes.toLocaleString('pt-BR'));
    this.texto('h-agua', today.agua.consumida.toLocaleString('pt-BR'));
    this.texto('h-atividade', today.atividade);

    const metaL = user.metaAguaL || 2;
    this.texto('h-meta', metaL);

    const litros = today.agua.consumida / 1000;
    const pct = Math.min(100, Math.round((today.agua.consumida / (metaL * 1000)) * 100));
    this.texto('h-agua-texto', litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' / ' + metaL + 'L');
    this.texto('h-agua-pct', pct + '%');
    document.getElementById('h-barra').style.width = pct + '%';

    const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
    const avatar = document.querySelector('.user-avatar');
    if (avatar) avatar.textContent = iniciais;
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
  }
};