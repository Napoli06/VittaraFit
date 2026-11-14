window.VittaraPlanner = {
    montado: false,
    diaSelecionadoKey: '',

    _diasSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    _refeicoes: ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar'],

    refresh() {
        if (!this.montado) this.montar();
        this.render();
    },

    montar() {
        const el = document.getElementById('planner-semanal');
        if (!el) return;

        const hoje = new Date();
        const diasSemana = [];

        // Sincroniza com os 7 dias da semana atual no calendário gregoriano
        for (let i = 0; i < 7; i++) {
            const d = new Date(hoje);
            d.setDate(hoje.getDate() - hoje.getDay() + i);
            const mesStr = String(d.getMonth() + 1).padStart(2, '0');
            const diaStr = String(d.getDate()).padStart(2, '0');
            const dataKey = `${d.getFullYear()}-${mesStr}-${diaStr}`;
            diasSemana.push({
                nome: this._diasSemana[d.getDay()],
                numero: d.getDate(),
                key: dataKey,
                isHoje: d.toDateString() === hoje.toDateString()
            });
        }

        if (!this.diaSelecionadoKey) {
            const hojeObj = diasSemana.find(d => d.isHoje) || diasSemana[0];
            this.diaSelecionadoKey = hojeObj.key;
        }

        const diasHtml = diasSemana.map(d => `
            <button class="planner-dia ${d.key === this.diaSelecionadoKey ? 'ativo' : ''}" data-key="${d.key}">
                <span class="planner-dia-nome">${d.nome}</span>
                <span class="planner-dia-num">${d.numero}</span>
            </button>
        `).join('');

        el.innerHTML = `
        <div class="planner-wrap">
            <div class="planner-titulo-row">
                <div class="planner-titulo-esq">
                    <h2 class="planner-titulo">Planejamento Alimentar</h2>
                    <button type="button" class="setup-obs-btn" onclick="VittaraPlanner.toggleObs(this)" title="Orientações médicas">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/></svg>
                    </button>
                </div>
                <button class="planner-btn-novo" onclick="VittaraPlanner.abrirModalAlimento()" title="Adicionar ao Planejamento">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>

            <div class="setup-obs" id="planner-obs" hidden>
                O planejamento alimentar deve ser muito bem estruturado por um profissional da saúde conforme suas necessidades e objetivos para melhor aproveitamento do aplicativo em segurança.
            </div>

            <div class="planner-semana">${diasHtml}</div>
            <div id="planner-refeicoes"></div>
        </div>`;

        el.querySelectorAll('.planner-dia').forEach(btn => {
            btn.addEventListener('click', () => {
                el.querySelectorAll('.planner-dia').forEach(b => b.classList.remove('ativo'));
                btn.classList.add('ativo');
                this.diaSelecionadoKey = btn.dataset.key;
                this.render();
            });
        });

        this.montado = true;
    },

    toggleObs(btn) {
        const obs = document.getElementById('planner-obs');
        if (obs) obs.hidden = !obs.hidden;
    },

    render() {
        const container = document.getElementById('planner-refeicoes');
        if (!container) return;

        const planoDia = VittaraState.mealPlan[this.diaSelecionadoKey] || {};

        container.innerHTML = this._refeicoes.map(refeicao => {
            const alimentos = planoDia[refeicao] || [];
            const listaHtml = alimentos.length ? alimentos.map((a, idx) => `
                <div class="planner-item-alimento">
                    <span class="planner-item-txt">
                        <strong>${a.nome}</strong>
                        <small>${a.medida === 'porcao' ? a.valor + 'g' : a.valor + ' un'}</small>
                    </span>
                    <button onclick="VittaraPlanner.removerAlimento('${refeicao}', ${idx})" class="planner-del-btn" title="Excluir">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            `).join('') : '<p class="planner-vazio">Nenhum alimento adicionado</p>';

            return `
            <div class="planner-refeicao-card">
                <div class="planner-refeicao-header">
                    <span class="planner-refeicao-nome">${refeicao}</span>
                    <button class="planner-add-btn" onclick="VittaraPlanner.abrirModalAlimento('${refeicao}')" title="Adicionar">
                        <i class="ti ti-plus"></i>
                    </button>
                </div>
                <div class="planner-refeicao-itens">${listaHtml}</div>
            </div>`;
        }).join('');
    },

    // ─── MODAL ELEGANTE DE ADICIONAR ALIMENTOS ───────────────────────────
    abrirModalAlimento(refeicaoPrevia = '') {
        const overlay = document.getElementById('modal-overlay');
        const body    = document.getElementById('modal-body');

        const opcoesRefeicao = this._refeicoes.map(r => `
            <option value="${r}" ${r === refeicaoPrevia ? 'selected' : ''}>${r}</option>
        `).join('');

        body.innerHTML = `
        <div class="setup-modal">
            <div class="setup-topo">
                <h2>Adicionar ao Planejamento</h2>
                <p>Monte o plano alimentar para o dia selecionado</p>
            </div>

            <form id="form-planner" onsubmit="event.preventDefault(); VittaraPlanner.salvarAlimentosModal();">
                <div class="setup-secao">
                    <label class="setup-label" for="pl-refeicao">Selecione a Refeição</label>
                    <select id="pl-refeicao" class="setup-input setup-select">
                        ${opcoesRefeicao}
                    </select>
                </div>

                <div class="setup-secao">
                    <label class="setup-label">Alimentos</label>
                    <div id="pl-lista-alimentos">
                        <!-- O primeiro item já vem criado -->
                        ${this._criarLinhaAlimentoHtml(0)}
                    </div>

                    <!-- Botão de adicionar mais alimentos abaixo -->
                    <button type="button" class="btn-add-outro-item" onclick="VittaraPlanner.adicionarLinhaAlimento()">
                        <i class="ti ti-plus"></i> Adicionar outro alimento a esta refeição
                    </button>
                </div>

                <div class="setup-acoes">
                    <button type="button" class="setup-btn-skip" onclick="VittaraPlanner.fecharModal()">Cancelar</button>
                    <button type="submit" class="setup-btn-salvar">Salvar no plano ✓</button>
                </div>
            </form>
        </div>`;

        overlay.classList.add('active');
    },

    fecharModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

        _criarLinhaAlimentoHtml(idx) {
        return `
        <div class="planner-linha-form" id="pl-linha-${idx}">
            <div class="planner-linha-campos">
                <input type="text" class="setup-input pl-input-nome" placeholder="Nome do alimento (ex: Frango)" required>
                
                <div class="planner-medida-row">
                    <!-- Seletor duplo em botões (Pílula) -->
                    <div class="planner-tipo-pills">
                        <button type="button" class="pill-tipo ativo" data-tipo="porcao" onclick="VittaraPlanner.alternarTipoMedida(this)">
                            Porção (g)
                        </button>
                        <button type="button" class="pill-tipo" data-tipo="quantidade" onclick="VittaraPlanner.alternarTipoMedida(this)">
                            Qtd (un)
                        </button>
                        <input type="hidden" class="pl-input-tipo" value="porcao">
                    </div>

                    <!-- Campo numérico com sufixo -->
                    <input type="number" step="0.1" min="0.1" class="setup-input pl-input-val" placeholder="Ex: 150g" required>
                </div>
            </div>
            ${idx > 0 ? `
            <button type="button" class="btn-remover-linha" onclick="VittaraPlanner.removerLinhaAlimento(${idx})" title="Remover">
                <i class="ti ti-trash"></i>
            </button>` : ''}
        </div>`;
    },

    alternarTipoMedida(btn) {
        const container = btn.closest('.planner-tipo-pills');
        container.querySelectorAll('.pill-tipo').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');

        const tipo = btn.dataset.tipo;
        container.querySelector('.pl-input-tipo').value = tipo;

        const inputVal = btn.closest('.planner-medida-row').querySelector('.pl-input-val');
        if (inputVal) {
            inputVal.placeholder = tipo === 'porcao' ? 'Ex: 150g' : 'Ex: 2 un';
        }
    },

    adicionarLinhaAlimento() {
        const container = document.getElementById('pl-lista-alimentos');
        if (!container) return;
        const novoIdx = container.children.length;
        const div = document.createElement('div');
        div.innerHTML = this._criarLinhaAlimentoHtml(novoIdx);
        container.appendChild(div.firstElementChild);
    },

    removerLinhaAlimento(idx) {
        const linha = document.getElementById(`pl-linha-${idx}`);
        if (linha) linha.remove();
    },

    atualizarPlaceholderQtd(select) {
        const inputVal = select.nextElementSibling;
        if (!inputVal) return;
        inputVal.placeholder = select.value === 'porcao' ? 'Ex: 150g' : 'Ex: 2 un';
    },

    salvarAlimentosModal() {
        const refeicao = document.getElementById('pl-refeicao').value;
        const container = document.getElementById('pl-lista-alimentos');
        const linhas = container.querySelectorAll('.planner-linha-form');

        const novosItens = [];
        linhas.forEach(linha => {
            const nome = linha.querySelector('.pl-input-nome').value.trim();
            const tipo = linha.querySelector('.pl-input-tipo').value;
            const val  = linha.querySelector('.pl-input-val').value.trim();

            if (nome && val) {
                novosItens.push({
                    nome,
                    medida: tipo,
                    valor: val
                });
            }
        });

        if (novosItens.length === 0) {
            VittaraUI.toast('Preencha ao menos um alimento', 'error');
            return;
        }

        // Garante estrutura no estado
        if (!VittaraState.mealPlan[this.diaSelecionadoKey]) {
            VittaraState.mealPlan[this.diaSelecionadoKey] = {};
        }
        if (!VittaraState.mealPlan[this.diaSelecionadoKey][refeicao]) {
            VittaraState.mealPlan[this.diaSelecionadoKey][refeicao] = [];
        }

        // Adiciona todos os itens preenchidos
        VittaraState.mealPlan[this.diaSelecionadoKey][refeicao].push(...novosItens);

        this.render();
        VittaraDB.saveMealPlan(this.diaSelecionadoKey, VittaraState.mealPlan[this.diaSelecionadoKey]);
        this.fecharModal();
        VittaraUI.toast('Plano atualizado com sucesso! 🥗', 'success');
    },

    removerAlimento(refeicao, idx) {
        if (!VittaraState.mealPlan[this.diaSelecionadoKey]?.[refeicao]) return;
        VittaraState.mealPlan[this.diaSelecionadoKey][refeicao].splice(idx, 1);
        this.render();
        VittaraDB.saveMealPlan(this.diaSelecionadoKey, VittaraState.mealPlan[this.diaSelecionadoKey]);
        VittaraUI.toast('Item removido!', 'info');
    }
};

// ─── Lista de Compras ──────────────────────────────────────────────────────────

window.VittaraList = {

    refresh() {
        this.montar();
        this.render();
    },

    montar() {
        const p = document.getElementById('page-list');
        p.innerHTML = `
        <div class="lista-wrap">

            <div class="lista-topo">
                <h2 class="lista-titulo">Lista de Compras</h2>
                <button class="lista-icon-btn" onclick="VittaraList.exportar()" title="Exportar lista">
                    <i class="ti ti-share"></i>
                </button>
            </div>

            <!-- Adicionar item -->
            <div class="lista-add-form">
                <div class="lista-add-row">
                    <input id="lista-item-nome" type="text" class="lista-input"
                           placeholder="Nome do item (ex: Frango)">
                    <input id="lista-item-qtd" type="text" class="lista-input lista-input--qtd"
                           placeholder="Qtd">
                    <button onclick="VittaraList.adicionar()" class="lista-add-btn">
                        <i class="ti ti-plus"></i>
                    </button>
                </div>
            </div>

            <!-- Itens -->
            <div id="lista-itens-container"></div>

            <!-- Exportar -->
            <button class="lista-exportar-btn" onclick="VittaraList.exportar()">
                <i class="ti ti-download"></i> Exportar lista
            </button>

        </div>`;
    },

    render() {
        const container = document.getElementById('lista-itens-container');
        if (!container) return;
        const lista = VittaraState.shoppingList || [];

        if (lista.length === 0) {
            container.innerHTML = `<div class="lista-vazio">
                <i class="ti ti-shopping-cart"></i>
                <p>Sua lista está vazia.<br>Adicione itens acima!</p>
            </div>`;
            return;
        }

        // Agrupar por categoria
        const grupos = {};
        lista.forEach(item => {
            const cat = item.categoria || 'Outros';
            if (!grupos[cat]) grupos[cat] = [];
            grupos[cat].push(item);
        });

        container.innerHTML = Object.entries(grupos).map(([cat, items]) => `
            <div class="lista-grupo">
                <h3 class="lista-grupo-titulo">${cat}</h3>
                ${items.map((item, idx) => `
                <div class="lista-item ${item.comprado ? 'comprado' : ''}" data-idx="${idx}">
                    <label class="lista-item-check">
                        <input type="checkbox" ${item.comprado ? 'checked' : ''}
                               onchange="VittaraList.marcar(${lista.indexOf(item)})">
                        <span class="lista-item-nome">${item.nome}</span>
                    </label>
                    <span class="lista-item-qtd">${item.quantidade || ''}</span>
                    <button class="lista-item-del" onclick="VittaraList.remover(${lista.indexOf(item)})">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>`).join('')}
            </div>
        `).join('');
    },

    adicionar() {
        const nome = document.getElementById('lista-item-nome').value.trim();
        const qtd  = document.getElementById('lista-item-qtd').value.trim();
        if (!nome) { VittaraUI.toast('Digite o nome do item', 'error'); return; }

        VittaraState.shoppingList.push({ nome, quantidade: qtd, categoria: 'Outros', comprado: false });
        document.getElementById('lista-item-nome').value = '';
        document.getElementById('lista-item-qtd').value  = '';
        this.render();
        VittaraDB.saveShoppingList(VittaraState.shoppingList);
    },

    marcar(idx) {
        VittaraState.shoppingList[idx].comprado = !VittaraState.shoppingList[idx].comprado;
        this.render();
        VittaraDB.saveShoppingList(VittaraState.shoppingList);
    },

    remover(idx) {
        VittaraState.shoppingList.splice(idx, 1);
        this.render();
        VittaraDB.saveShoppingList(VittaraState.shoppingList);
    },

    exportar() {
        const lista = VittaraState.shoppingList;
        if (!lista.length) { VittaraUI.toast('A lista está vazia', 'error'); return; }
        const texto = lista.map(i => `${i.comprado ? '✓' : '○'} ${i.nome}${i.quantidade ? ' — ' + i.quantidade : ''}`).join('\n');
        navigator.clipboard.writeText(texto).then(() => VittaraUI.toast('Lista copiada!', 'success'));
    },
};