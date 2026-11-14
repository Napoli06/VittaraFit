window.VittaraSetup = {

    objetivos: [
        { id: 'massa',       label: 'Ganhar massa magra',         icon: 'ti-barbell' },
        { id: 'emagrecer',   label: 'Emagrecer',                  icon: 'ti-flame'   },
        { id: 'alimentacao', label: 'Melhorar a alimentação',     icon: 'ti-leaf'    },
        { id: 'custo',       label: 'Alimentação custo-benefício',icon: 'ti-coin'    },
    ],

    abrir() {
        const overlay = document.getElementById('modal-overlay');
        const body    = document.getElementById('modal-body');

        body.innerHTML = this._html();
        overlay.classList.add('active');

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.fechar();
        }, { once: true });

        body.querySelectorAll('.setup-objetivo').forEach(btn => {
            btn.addEventListener('click', () => {
                body.querySelectorAll('.setup-objetivo').forEach(b => b.classList.remove('sel'));
                btn.classList.add('sel');
            });
        });
    },

    fechar() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    _html() {
        const u = VittaraState.user || {};

        const obsAgua = `
            <span class="setup-obs-titulo">💧 Como calcular?</span>
            Multiplique seu peso pela quantidade de ml conforme sua faixa etária:<br>
            <b>até 17 anos</b> → 40 ml/kg &nbsp;|&nbsp;
            <b>18–55 anos</b> → 35 ml/kg &nbsp;|&nbsp;
            <b>55–65 anos</b> → 30 ml/kg &nbsp;|&nbsp;
            <b>+66 anos</b> → 25 ml/kg
        `;

        const obsMetas = `
            <div class="setup-obs-aviso">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>As calorias a serem ingeridas e as serem gastas, além do tempo de atividade física, devem ser orientadas por um profissional da saúde para que o usuário possa ter o máximo de aproveitamento do aplicativo em segurança.</span>
            </div>
        `;

        const objetivosHtml = this.objetivos.map(o => `
            <button type="button" class="setup-objetivo ${u.objetivo === o.id ? 'sel' : ''}" data-id="${o.id}">
                <i class="ti ${o.icon}"></i> ${o.label}
            </button>
        `).join('');

        const restricoesVal = Array.isArray(u.restricoes) ? u.restricoes.join(', ') : (u.restricoes || '');
        const favoritosVal  = Array.isArray(u.alimentosFavoritos) ? u.alimentosFavoritos.join(', ') : (u.alimentosFavoritos || '');

        return `
        <div class="setup-modal">
            <div class="setup-topo">
                <h2>
                    <svg class="setup-icone" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path>
                        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
                    </svg>
                    <span>Configurar Perfil</span>
                </h2>
                <p>Personalize suas metas e preferências</p>
            </div>

            <form id="setup-form" onsubmit="VittaraSetup.salvar(event)">

                <div class="setup-secao">
                    <label class="setup-label" for="setup-nome">Nome de perfil</label>
                    <input id="setup-nome" type="text" class="setup-input"
                           placeholder="Como quer ser chamado?"
                           value="${u.name || ''}">
                </div>

                <div class="setup-secao">
                    <label class="setup-label">Qual é o seu objetivo?</label>
                    <div class="setup-objetivos-grid">
                        ${objetivosHtml}
                    </div>
                </div>

                <!-- METAS DE SAÚDE COM INFORMATIVO -->
                <div class="setup-secao-destaque">
                    <div class="setup-label-row">
                        <label class="setup-label">Metas Diárias de Saúde</label>
                        <button type="button" class="setup-obs-btn" onclick="VittaraSetup.toggleObs(this)"
                                title="Informações de saúde">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            <span>Orientações</span>
                        </button>
                    </div>
                    <div class="setup-obs" hidden>${obsMetas}</div>

                    <div class="setup-dois-col">
                        <div>
                            <label class="setup-label" for="setup-kcal-consumo">Calorias a Ingerir (kcal)</label>
                            <input id="setup-kcal-consumo" type="number" step="10" min="500" max="10000"
                                   placeholder="Ex: 2000" class="setup-input"
                                   value="${u.metaKcalConsumo || 2000}">
                        </div>
                        <div>
                            <label class="setup-label" for="setup-kcal-gasto">Calorias a Gastar (kcal)</label>
                            <input id="setup-kcal-gasto" type="number" step="10" min="0" max="5000"
                                   placeholder="Ex: 500" class="setup-input"
                                   value="${u.metaKcalGasto || 500}">
                        </div>
                    </div>

                    <div style="margin-top: 10px;">
                        <label class="setup-label" for="setup-atividade">Tempo de Atividade Física (minutos)</label>
                        <input id="setup-atividade" type="number" step="5" min="0" max="300"
                               placeholder="Ex: 60" class="setup-input"
                               value="${u.metaAtividadeMin || 60}">
                    </div>
                </div>

                <div class="setup-secao">
                    <div class="setup-label-row">
                        <label class="setup-label" for="setup-agua">Litros de Água por Dia</label>
                        <button type="button" class="setup-obs-btn" onclick="VittaraSetup.toggleObs(this)">Como calcular?</button>
                    </div>
                    <div class="setup-obs" hidden>${obsAgua}</div>
                    <input id="setup-agua" type="number" step="0.1" min="0.5" max="10"
                           placeholder="Ex: 2.5" class="setup-input"
                           value="${u.metaAguaL || 2}">
                </div>

                <div class="setup-secao setup-dois-col">
                    <div>
                        <label class="setup-label" for="setup-peso">Peso (kg)</label>
                        <input id="setup-peso" type="number" step="0.1" min="20" max="400"
                               placeholder="Ex: 70" class="setup-input"
                               value="${u.peso || ''}">
                    </div>
                    <div>
                        <label class="setup-label" for="setup-altura">Altura (m)</label>
                        <input id="setup-altura" type="number" step="0.01" min="0.5" max="2.5"
                               placeholder="Ex: 1.70" class="setup-input"
                               value="${u.altura || ''}">
                    </div>
                </div>

                <div class="setup-secao">
                    <label class="setup-label" for="setup-restricoes">Restrições alimentares</label>
                    <input id="setup-restricoes" type="text" class="setup-input"
                           placeholder="Ex: Lactose, Glúten, Amendoim…"
                           value="${restricoesVal}">
                    <span class="setup-hint">Separe por vírgula</span>
                </div>

                <div class="setup-secao">
                    <label class="setup-label" for="setup-favoritos">Alimentos favoritos</label>
                    <input id="setup-favoritos" type="text" class="setup-input"
                           placeholder="Ex: Frango, Arroz integral, Banana…"
                           value="${favoritosVal}">
                    <span class="setup-hint">Separe por vírgula</span>
                </div>

                <div class="setup-acoes">
                    <button type="button" class="setup-btn-skip"
                            onclick="VittaraSetup.fechar()">Cancelar</button>
                    <button type="submit" class="setup-btn-salvar">Salvar perfil ✓</button>
                </div>

            </form>
        </div>`;
    },

    toggleObs(btn) {
        const obs = btn.closest('.setup-label-row').nextElementSibling;
        if (!obs) return;
        obs.hidden = !obs.hidden;
    },

    async salvar(e) {
        e.preventDefault();
        const form = document.getElementById('setup-form');

        const objetivoEl = form.querySelector('.setup-objetivo.sel');
        const objetivo   = objetivoEl ? objetivoEl.dataset.id : '';
        const nome       = document.getElementById('setup-nome').value.trim() || VittaraState.user.name;
        
        const kcalConsumo = parseInt(document.getElementById('setup-kcal-consumo').value, 10) || 2000;
        const kcalGasto   = parseInt(document.getElementById('setup-kcal-gasto').value, 10) || 500;
        const atividadeMin = parseInt(document.getElementById('setup-atividade').value, 10) || 60;
        const agua        = parseFloat(document.getElementById('setup-agua').value) || 2;
        
        const peso   = parseFloat(document.getElementById('setup-peso').value) || null;
        const altura = parseFloat(document.getElementById('setup-altura').value) || null;

        const restricoesRaw  = document.getElementById('setup-restricoes').value;
        const favoritosRaw   = document.getElementById('setup-favoritos').value;
        const restricoes     = restricoesRaw ? restricoesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const alimentosFavoritos = favoritosRaw ? favoritosRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

        const dados = {
            name: nome,
            objetivo,
            metaKcalConsumo: kcalConsumo,
            metaKcalGasto: kcalGasto,
            metaAtividadeMin: atividadeMin,
            metaAguaL: agua,
            peso,
            altura,
            restricoes,
            alimentosFavoritos,
            profileComplete: true,
        };

        try {
            await VittaraDB.updateProfile(dados);
            VittaraUI.toast('Perfil salvo com sucesso! 🎉', 'success');
            this.fechar();
            
            if (window.VittaraProfile) VittaraProfile.render();
            if (window.VittaraHome) VittaraHome.render();
            if (window.VittaraGoals) VittaraGoals.render();
        } catch (err) {
            console.error(err);
            VittaraUI.toast('Não foi possível salvar o perfil', 'error');
        }
    },
};