window.VittaraGoals = {
    montado: false,

    refresh() {
        if (!this.montado) this.montar();
        this.render();
    },

    montar() {
        const container = document.getElementById('goals-conteudo');
        if (!container) return;

        container.innerHTML = `
        <div class="goals-wrap">
            <div class="goals-header">
                <h2>Meus Objetivos Diários</h2>
                <p>Acompanhe e registre seu progresso diário</p>
            </div>

            <!-- Card 1: Calorias Consumidas -->
            <div class="card card-meta" onclick="VittaraGoals.registrar('caloriasConsumo')">
                <div class="meta-topo">
                    <div>
                        <span class="meta-rotulo">Alimentação</span>
                        <h3>Consumir <span id="g-meta-consumo">0</span> kcal</h3>
                    </div>
                    <i class="ti ti-tools-kitchen-2 meta-icone"></i>
                </div>
                <div class="meta-info">
                    <span id="g-info-consumo">0 / 0 kcal</span>
                    <span id="g-pct-consumo">0%</span>
                </div>
                <div class="barra"><div class="barra-cheia" id="g-barra-consumo"></div></div>
                <span class="meta-dica">Toque para registrar calorias ingeridas</span>
            </div>

            <!-- Card 2: Calorias Gastas -->
            <div class="card card-meta" onclick="VittaraGoals.registrar('caloriasGasto')">
                <div class="meta-topo">
                    <div>
                        <span class="meta-rotulo">Gasto Calórico</span>
                        <h3>Gastar <span id="g-meta-gasto">0</span> kcal</h3>
                    </div>
                    <i class="ti ti-flame meta-icone destaque-fogo"></i>
                </div>
                <div class="meta-info">
                    <span id="g-info-gasto">0 / 0 kcal</span>
                    <span id="g-pct-gasto">0%</span>
                </div>
                <div class="barra"><div class="barra-cheia barra-fogo" id="g-barra-gasto"></div></div>
                <span class="meta-dica">Toque para registrar calorias gastas</span>
            </div>

            <!-- Card 3: Hidratação (Água) -->
            <div class="card card-meta" onclick="VittaraGoals.registrar('agua')">
                <div class="meta-topo">
                    <div>
                        <span class="meta-rotulo">Hidratação</span>
                        <h3>Beber <span id="g-meta-agua">0</span>L de água</h3>
                    </div>
                    <i class="ti ti-droplet meta-icone destaque-agua"></i>
                </div>
                <div class="meta-info">
                    <span id="g-info-agua">0 / 0L</span>
                    <span id="g-pct-agua">0%</span>
                </div>
                <div class="barra"><div class="barra-cheia barra-agua" id="g-barra-agua"></div></div>
                <span class="meta-dica">Toque para registrar água em mL</span>
            </div>

            <!-- Card 4: Atividade Física -->
            <div class="card card-meta" onclick="VittaraGoals.registrar('atividade')">
                <div class="meta-topo">
                    <div>
                        <span class="meta-rotulo">Exercícios</span>
                        <h3><span id="g-meta-atividade">0</span> min de atividade</h3>
                    </div>
                    <i class="ti ti-run meta-icone destaque-run"></i>
                </div>
                <div class="meta-info">
                    <span id="g-info-atividade">0 / 0 min</span>
                    <span id="g-pct-atividade">0%</span>
                </div>
                <div class="barra"><div class="barra-cheia barra-run" id="g-barra-atividade"></div></div>
                <span class="meta-dica">Toque para registrar minutos de atividade</span>
            </div>
        </div>`;

        this.montado = true;
    },

    render() {
        if (!this.montado) this.montar();
        const { user, today } = VittaraState;

        // 1. Calorias Consumidas
        const metaConsumo = user.metaKcalConsumo || 2000;
        const consumido = today.kcalConsumidas || 0;
        const pctConsumo = Math.min(100, Math.round((consumido / metaConsumo) * 100));
        this._texto('g-meta-consumo', metaConsumo.toLocaleString('pt-BR'));
        this._texto('g-info-consumo', `${consumido.toLocaleString('pt-BR')} / ${metaConsumo.toLocaleString('pt-BR')} kcal`);
        this._texto('g-pct-consumo', `${pctConsumo}%`);
        this._barra('g-barra-consumo', pctConsumo);

        // 2. Calorias Gastas
        const metaGasto = user.metaKcalGasto || 500;
        const gasto = today.kcalGastas || 0;
        const pctGasto = Math.min(100, Math.round((gasto / metaGasto) * 100));
        this._texto('g-meta-gasto', metaGasto.toLocaleString('pt-BR'));
        this._texto('g-info-gasto', `${gasto.toLocaleString('pt-BR')} / ${metaGasto.toLocaleString('pt-BR')} kcal`);
        this._texto('g-pct-gasto', `${pctGasto}%`);
        this._barra('g-barra-gasto', pctGasto);

        // 3. Água
        const metaAguaL = user.metaAguaL || 2;
        const aguaMl = today.aguaMl || 0;
        const litros = (aguaMl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
        const pctAgua = Math.min(100, Math.round((aguaMl / (metaAguaL * 1000)) * 100));
        this._texto('g-meta-agua', metaAguaL);
        this._texto('g-info-agua', `${litros} / ${metaAguaL}L`);
        this._texto('g-pct-agua', `${pctAgua}%`);
        this._barra('g-barra-agua', pctAgua);

        // 4. Atividade
        const metaAtiv = user.metaAtividadeMin || 60;
        const ativMin = today.atividadeMin || 0;
        const pctAtiv = Math.min(100, Math.round((ativMin / metaAtiv) * 100));
        this._texto('g-meta-atividade', metaAtiv);
        this._texto('g-info-atividade', `${ativMin} / ${metaAtiv} min`);
        this._texto('g-pct-atividade', `${pctAtiv}%`);
        this._barra('g-barra-atividade', pctAtiv);
    },

    _texto(id, v) {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
    },

    _barra(id, pct) {
        const el = document.getElementById(id);
        if (el) el.style.width = pct + '%';
    },

        // Abre a caixa personalizada no mesmo estilo do perfil
    registrar(tipo) {
        const overlay = document.getElementById('modal-overlay');
        const body    = document.getElementById('modal-body');

        const configs = {
            caloriasConsumo: {
                titulo: 'Calorias Ingeridas',
                subtitulo: 'Quantas calorias (kcal) você consumiu?',
                rotulo: 'Calorias a adicionar (kcal)',
                placeholder: 'Ex: 350',
                step: '10'
            },
            caloriasGasto: {
                titulo: 'Calorias Gastas',
                subtitulo: 'Quantas calorias (kcal) você gastou no exercício?',
                rotulo: 'Calorias gastas a adicionar (kcal)',
                placeholder: 'Ex: 250',
                step: '10'
            },
            agua: {
                titulo: 'Registrar Hidratação',
                subtitulo: 'Quantos mililitros (mL) de água você bebeu?',
                rotulo: 'Quantidade em mililitros (mL)',
                placeholder: 'Ex: 250 (copo) ou 500 (garrafa)',
                step: '50'
            },
            atividade: {
                titulo: 'Atividade Física',
                subtitulo: 'Quantos minutos de exercício você realizou?',
                rotulo: 'Tempo em minutos',
                placeholder: 'Ex: 45',
                step: '5'
            }
        };

        const c = configs[tipo];
        if (!c) return;

        body.innerHTML = `
        <div class="setup-modal">
            <div class="setup-topo">
                <h2>${c.titulo}</h2>
                <p>${c.subtitulo}</p>
            </div>

            <form onsubmit="event.preventDefault(); VittaraGoals.salvarRegistro('${tipo}');">
                <div class="setup-secao">
                    <label class="setup-label" for="goals-input-val">${c.rotulo}</label>
                    <input type="number" step="${c.step}" min="1" id="goals-input-val" class="setup-input"
                           placeholder="${c.placeholder}" required autocomplete="off">
                </div>

                <div class="setup-acoes">
                    <button type="button" class="setup-btn-skip" onclick="VittaraGoals.fecharModal()">Cancelar</button>
                    <button type="submit" class="setup-btn-salvar">Salvar progresso ✓</button>
                </div>
            </form>
        </div>`;

        overlay.classList.add('active');

        // Foca automaticamente no campo de digitação
        setTimeout(() => {
            const inp = document.getElementById('goals-input-val');
            if (inp) inp.focus();
        }, 100);
    },

    fecharModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    async salvarRegistro(tipo) {
        const inp = document.getElementById('goals-input-val');
        if (!inp) return;

        const val = Number(inp.value.replace(',', '.'));
        if (isNaN(val) || val <= 0) {
            VittaraUI.toast('Digite um valor numérico válido', 'error');
            return;
        }

        // Aplica o valor somando ao progresso de hoje
        if (tipo === 'caloriasConsumo') {
            VittaraState.today.kcalConsumidas = (VittaraState.today.kcalConsumidas || 0) + val;
        } else if (tipo === 'caloriasGasto') {
            VittaraState.today.kcalGastas = (VittaraState.today.kcalGastas || 0) + val;
        } else if (tipo === 'agua') {
            VittaraState.today.aguaMl = (VittaraState.today.aguaMl || 0) + val;
        } else if (tipo === 'atividade') {
            VittaraState.today.atividadeMin = (VittaraState.today.atividadeMin || 0) + val;
        }

        this.render();
        if (window.VittaraHome) VittaraHome.render(); // Atualiza o resumo da Home instantaneamente
        this.fecharModal();

        try {
            await VittaraDB.saveDailyLog(VittaraHome.hojeKey());
            VittaraUI.toast('Progresso registrado! 🚀', 'success');
        } catch (e) {
            console.error(e);
            VittaraUI.toast('Erro ao salvar no banco', 'error');
        }
    }
};