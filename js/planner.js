window.VittaraPlanner = {

    refresh() {
        this.montar();
        this.render();
    },

    _diasSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    _refeicoes: ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar'],

    montar() {
        const el = document.getElementById('planner-semanal');
        const hoje = new Date();
        const diasHtml = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(hoje);
            d.setDate(hoje.getDate() - hoje.getDay() + i);
            const dia = d.getDate();
            const ativo = i === hoje.getDay() ? 'ativo' : '';
            return `<button class="planner-dia ${ativo}" data-idx="${i}">
                        <span class="planner-dia-nome">${this._diasSemana[i]}</span>
                        <span class="planner-dia-num">${dia}</span>
                    </button>`;
        }).join('');

        el.innerHTML = `
        <div class="planner-wrap">
            <div class="planner-titulo-row">
                <h2 class="planner-titulo">Planejamento Alimentar</h2>
            </div>
            <div class="planner-semana">${diasHtml}</div>
            <div id="planner-refeicoes"></div>
        </div>`;

        el.querySelectorAll('.planner-dia').forEach(btn => {
            btn.addEventListener('click', () => {
                el.querySelectorAll('.planner-dia').forEach(b => b.classList.remove('ativo'));
                btn.classList.add('ativo');
                this.render();
            });
        });
    },

    render() {
        const container = document.getElementById('planner-refeicoes');
        if (!container) return;

        const refeicoesHtml = this._refeicoes.map((nome, i) => `
            <div class="planner-refeicao-card">
                <div class="planner-refeicao-header">
                    <span class="planner-refeicao-nome">${nome}</span>
                    <button class="planner-add-btn" title="Adicionar alimento">
                        <i class="ti ti-plus"></i>
                    </button>
                </div>
                <p class="planner-vazio">Nenhum alimento adicionado</p>
            </div>
        `).join('');

        container.innerHTML = refeicoesHtml;
    },
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