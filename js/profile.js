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

        <!-- Foto de perfil clicável -->
        <button
        type="button"
        class="profile-avatar"
        id="p-avatar"
        onclick="VittaraProfile.abrirMenuFoto()"
        aria-label="Alterar foto de perfil"
        title="Alterar foto">

        <i class="ti ti-user" id="p-avatar-icon"></i>

        <img
            id="p-avatar-img"
            src=""
            alt="Foto de perfil"
            style="
                display:none;
                width:100%;
                height:100%;
                object-fit:cover;
                border-radius:50%;
            "
        >

        <!-- Overlay agora fica DENTRO da foto -->
        <span class="profile-avatar-overlay" aria-hidden="true">
            <i class="ti ti-camera"></i>
        </span>

        </button>

        <div class="profile-info">
            <h2 id="p-nome">—</h2>
            <span id="p-email" class="profile-email">—</span>
        </div>

        <!-- Menu de seleção de foto -->
        <div
            id="profile-foto-menu"
            class="profile-foto-menu"
            style="display:none;">

            <button onclick="VittaraProfile.escolherFoto('camera')">
                <i class="ti ti-camera"></i>
                Tirar foto
            </button>

            <button onclick="VittaraProfile.escolherFoto('galeria')">
                <i class="ti ti-photo"></i>
                Escolher da galeria
            </button>

            <button
                class="profile-foto-menu-cancelar"
                onclick="VittaraProfile.fecharMenuFoto()"
            >
                Cancelar
            </button>

            </div>

            <input
                type="file"
                id="profile-foto-input"
                accept="image/*"
                style="display:none;"
                onchange="VittaraProfile.processarFoto(this)"
            >
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

                    <!-- NOVAS METAS DE SAÚDE -->
                    <div class="profile-dado">
                        <span class="profile-dado-label">Calorias a Ingerir</span>
                        <span id="p-kcal-consumo" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado">
                        <span class="profile-dado-label">Calorias a Gastar</span>
                        <span id="p-kcal-gasto" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado">
                        <span class="profile-dado-label">Atividade Física</span>
                        <span id="p-atividade" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado">
                        <span class="profile-dado-label">Meta de Água</span>
                        <span id="p-agua" class="profile-dado-valor">—</span>
                    </div>

                    <div class="profile-dado profile-dado--full">
                        <span class="profile-dado-label">Restrições</span>
                        <span id="p-restricoes" class="profile-dado-valor">—</span>
                    </div>
                    <div class="profile-dado profile-dado--full">
                        <span class="profile-dado-label">Alimentos preferidos</span>
                        <span id="p-favoritos" class="profile-dado-valor">—</span>
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

        this._t('p-nome', user.name || '—');
        this._t('p-email', user.email || '—');

        const objetivoMap = {
            massa: 'Ganhar massa magra',
            emagrecer: 'Emagrecer',
            alimentacao: 'Melhorar a alimentação',
            custo: 'Alimentação custo-benefício',
        };
        this._t('p-objetivo', objetivoMap[user.objetivo] || user.objetivo || '—');
        this._t('p-peso', user.peso ? user.peso + ' kg' : '—');
        this._t('p-altura', user.altura ? user.altura + ' m' : '—');
        this._t('p-imc', VittaraState.bmi || '—');
        this._t('p-restricoes', (user.restricoes?.length) ? user.restricoes.join(', ') : 'Nenhuma');
        this._t('p-favoritos', (user.alimentosFavoritos?.length) ? user.alimentosFavoritos.join(',') : '—');
        this._t('p-kcal-consumo', (user.metaKcalConsumo || 2000) + ' kcal');
        this._t('p-kcal-gasto', (user.metaKcalGasto || 500) + ' kcal');
        this._t('p-atividade', (user.metaAtividadeMin || 60) + ' min');
        this._t('p-agua', (user.metaAguaL || 2) + ' L/dia');

        // Carrega foto de perfil se existir
        if (user.fotoPerfil) {
            this._mostrarFoto(user.fotoPerfil);
        }
    },

    _t(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    },

    abrirMenuFoto() {
        const menu = document.getElementById('profile-foto-menu');
        menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';

        // Fecha ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', VittaraProfile._fecharMenuFotoFora, { once: true });
        }, 50);
    },

    _fecharMenuFotoFora(e) {
        const menu = document.getElementById('profile-foto-menu');
        const avatar = document.getElementById('p-avatar');
        if (menu && !menu.contains(e.target) && !avatar.contains(e.target)) {
            menu.style.display = 'none';
        }
    },

    fecharMenuFoto() {
        document.getElementById('profile-foto-menu').style.display = 'none';
    },

    escolherFoto(modo) {
        this.fecharMenuFoto();
        const input = document.getElementById('profile-foto-input');
        // 'camera' usa a câmera frontal; 'galeria' abre o seletor normal
        if (modo === 'camera') {
            input.setAttribute('capture', 'user');
        } else {
            input.removeAttribute('capture');
        }
        input.click();
    },

    async processarFoto(input) {
        const arquivo = input.files[0];
        if (!arquivo) return;

        // Pré-visualiza imediatamente
        const url = URL.createObjectURL(arquivo);
        this._mostrarFoto(url);

        try {
            VittaraUI.toast('Enviando foto…', 'info');
            const urlFirebase = await VittaraDB.uploadFotoPerfil(arquivo);
            this._mostrarFoto(urlFirebase);
            VittaraUI.toast('Foto atualizada! 📸', 'success');
        } catch (err) {
            VittaraUI.toast('Erro ao enviar a foto', 'error');
            console.error(err);
        }

        input.value = ''; // reseta o input para permitir re-seleção
    },

    _mostrarFoto(url) {
        const img = document.getElementById('p-avatar-img');
        const icon = document.getElementById('p-avatar-icon');
        if (!img) return;
        img.src = url;
        img.style.display = 'block';
        if (icon) icon.style.display = 'none';
    },
};