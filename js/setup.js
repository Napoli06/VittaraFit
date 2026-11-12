window.VittaraSetup = {

    // Objetivos disponíveis
    objetivos: [
        { id: 'massa', label: 'Ganhar massa magra', icon: 'ti-barbell' },
        { id: 'emagrecer', label: 'Emagrecer', icon: 'ti-flame' },
        { id: 'alimentacao', label: 'Melhorar a alimentação', icon: 'ti-leaf' },
        { id: 'custo', label: 'Alimentação custo-benefício', icon: 'ti-coin' },
    ],

    // Abre o modal de setup
    abrir() {
        const overlay = document.getElementById('modal-overlay');
        const body = document.getElementById('modal-body');

        body.innerHTML = this._html();
        overlay.classList.add('active');

        // Fecha ao clicar fora do card
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.fechar();
        }, { once: true });

        // Liga os eventos dos chips de objetivo
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
        const obs = `
            <span class="setup-obs-titulo">💧 Como calcular?</span>
            Multiplique seu peso pela quantidade de ml conforme sua faixa etária:<br>
            <b>até 17 anos</b> → 40 ml/kg &nbsp;|&nbsp;
            <b>18–55 anos</b> → 35 ml/kg &nbsp;|&nbsp;
            <b>55–65 anos</b> → 30 ml/kg &nbsp;|&nbsp;
            <b>+66 anos</b> → 25 ml/kg
        `;

        const objetivosHtml = this.objetivos.map(o => `
            <button type="button" class="setup-objetivo" data-id="${o.id}">
                <i class="ti ${o.icon}"></i> ${o.label}
            </button>
        `).join('');

        return `
        <div class="setup-modal">
            <div class="setup-topo">
                <h2>⚙️ Termine de configurar<br>seu perfil</h2>
                <p>Essas informações ajudam a personalizar sua experiência</p>
            </div>

            <form id="setup-form" onsubmit="VittaraSetup.salvar(event)">

            <div class="setup-secao">
                <label class="setup-label" for="setup-nome">Nome de perfil</label>
                <input id="setup-nome" type="text" class="setup-input"
                    placeholder="Como quer ser chamado?"
                    value="${VittaraState.user.name || ''}">
            </div>

                <div class="setup-secao">
                    <label class="setup-label">Qual é o seu objetivo?</label>
                    <div class="setup-objetivos-grid">
                        ${objetivosHtml}
                    </div>
                </div>

                <div class="setup-secao">
                    <div class="setup-label-row">
                        <label class="setup-label" for="setup-agua">Litros de Água por Dia</label>
                        <button type="button" class="setup-obs-btn" onclick="VittaraSetup.toggleObs(this)"
                                aria-label="Ver observação">ℹ️</button>
                    </div>
                    <div class="setup-obs" hidden>${obs}</div>
                    <input id="setup-agua" type="number" step="0.1" min="0.5" max="10"
                           placeholder="Ex: 2.5" class="setup-input">
                </div>

                <div class="setup-secao setup-dois-col">
                    <div>
                        <label class="setup-label" for="setup-peso">Peso (kg)</label>
                        <input id="setup-peso" type="number" step="0.1" min="20" max="400"
                               placeholder="Ex: 70" class="setup-input">
                    </div>
                    <div>
                        <label class="setup-label" for="setup-altura">Altura (m)</label>
                        <input id="setup-altura" type="number" step="0.01" min="0.5" max="2.5"
                               placeholder="Ex: 1.70" class="setup-input">
                    </div>
                </div>

                <div class="setup-secao">
                    <label class="setup-label" for="setup-restricoes">Restrições alimentares</label>
                    <input id="setup-restricoes" type="text" class="setup-input"
                           placeholder="Ex: Lactose, Glúten, Amendoim…">
                    <span class="setup-hint">Separe por vírgula</span>
                </div>

                <div class="setup-secao">
                    <label class="setup-label" for="setup-favoritos">Alimentos favoritos</label>
                    <input id="setup-favoritos" type="text" class="setup-input"
                           placeholder="Ex: Frango, Arroz integral, Banana…">
                    <span class="setup-hint">Separe por vírgula</span>
                </div>

                <div class="setup-acoes">
                    <button type="button" class="setup-btn-skip"
                            onclick="VittaraSetup.pular()">Pular por agora</button>
                    <button type="submit" class="setup-btn-salvar">Salvar perfil ✓</button>
                </div>

            </form>
        </div>`;
    },

    toggleObs(btn) {
        const obs = btn.closest('.setup-label-row').nextElementSibling;
        const aberto = !obs.hidden;
        obs.hidden = aberto;
        btn.setAttribute('aria-expanded', String(!aberto));
    },

    async salvar(e) {
        e.preventDefault();
        const form = document.getElementById('setup-form');

        const objetivoEl = form.querySelector('.setup-objetivo.sel');
        const objetivo = objetivoEl ? objetivoEl.dataset.id : '';
        const nome = document.getElementById('setup-nome').value.trim() || VittaraState.user.name;
        const agua = parseFloat(document.getElementById('setup-agua').value) || VittaraState.user.metaAguaL;
        const peso = parseFloat(document.getElementById('setup-peso').value) || null;
        const altura = parseFloat(document.getElementById('setup-altura').value) || null;

        const restricoesRaw = document.getElementById('setup-restricoes').value;
        const favoritosRaw = document.getElementById('setup-favoritos').value;
        const restricoes = restricoesRaw ? restricoesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const alimentosFavoritos = favoritosRaw ? favoritosRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

        const dados = { name: nome, objetivo, metaAguaL: agua, peso, altura, restricoes, alimentosFavoritos, profileComplete: true };

        try {
            await VittaraDB.updateProfile(dados);
            VittaraUI.toast('Perfil configurado com sucesso! 🎉', 'success');
            this.fechar();
            VittaraHome.render();       // atualiza a home sem o banner
        } catch (err) {
            VittaraUI.toast('Não foi possível salvar o perfil', 'error');
        }
    },

    pular() {
        // Marca como "pulado" localmente para não exibir de novo nessa sessão
        sessionStorage.setItem('setupSkipped', '1');
        this.fechar();
    },
};