window.VittaraProfile = {

    refresh() {
        this.montar();
        this.render();
    },

    montar() {
        const p = document.getElementById('page-profile');
        p.innerHTML = `
        <div class="profile-wrap">

            <!-- Cabeçalho -->
            <div class="profile-header">
                <div class="profile-avatar" id="p-avatar">
                    <i class="ti ti-user"></i>
                </div>
                <div class="profile-info">
                    <h2 id="p-nome">—</h2>
                    <span id="p-email" class="profile-email">—</span>
                </div>
                <button class="profile-icon-btn" onclick="VittaraSetup.abrir()" title="Editar perfil">
                    <i class="ti ti-settings"></i>
                </button>
            </div>

            <!-- Dados principais -->
            <div class="profile-card">
                <h3 class="profile-card-titulo">Meus dados</h3>
                <div class="profile-dados-grid">
                    <div class="profile-dado">
                        <span class="profile-dado-label">Objetivo</span>
                        <span id="p-objetivo" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado">
                        <span class="profile-dado-label">Peso</span>
                        <span id="p-peso" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado">
                        <span class="profile-dado-label">Altura</span>
                        <span id="p-altura" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado">
                        <span class="profile-dado-label">IMC</span>
                        <span id="p-imc" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado profile-dado--full">
                        <span class="profile-dado-label">Restrições</span>
                        <span id="p-restricoes" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado profile-dado--full">
                        <span class="profile-dado-label">Alimentos preferidos</span>
                        <span id="p-favoritos" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado profile-dado--full">
                        <span class="profile-dado-label">Meta de Água</span>
                        <span id="p-agua" class="profile-dado-valor">—</span>
                    </div>
                </div>
            </div>

            <!-- Ações -->
            <div class="profile-acoes">
                <button class="profile-btn profile-btn--primary" onclick="VittaraSetup.abrir()">
                    <i class="ti ti-edit"></i> Editar perfil
                </button>
                <button class="profile-btn profile-btn--danger" onclick="VittaraAuth.logout()">
                    <i class="ti ti-logout"></i> Sair da conta
                </button>
            </div>

        </div>`;
    },

    render() {
        const { user } = VittaraState;

        this._t('p-nome',   user.name  || '—');
        this._t('p-email',  user.email || '—');

        const objetivoMap = {
            massa:       'Ganhar massa magra',
            emagrecer:   'Emagrecer',
            alimentacao: 'Melhorar a alimentação',
            custo:       'Alimentação custo-benefício',
        };
        this._t('p-objetivo', objetivoMap[user.objetivo] || user.objetivo || '—');
        this._t('p-peso',    user.peso   ? user.peso + ' kg'  : '—');
        this._t('p-altura',  user.altura ? user.altura + ' m' : '—');
        this._t('p-imc',     VittaraState.bmi || '—');
        this._t('p-restricoes',  (user.restricoes?.length)       ? user.restricoes.join(', ')       : 'Nenhuma');
        this._t('p-favoritos',   (user.alimentosFavoritos?.length)? user.alimentosFavoritos.join(','): '—');
        this._t('p-agua',    (user.metaAguaL || 2) + ' L/dia');
    },

    _t(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    },
};