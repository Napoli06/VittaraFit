window.VittaraRouter = {

    pages: ['home', 'planner', 'goals', 'scanner', 'list', 'profile'],

    init() {
        this.navigate('home');
    },

    navigate(pageId) {
        // Se estiver saindo do scanner para qualquer outra aba, desliga a câmera imediatamente
        if (pageId !== 'scanner' && window.VittaraScanner?.stop) {
            window.VittaraScanner.stop();
        }

        // Esconde as páginas
        document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); });

        // Desativa os botões da navegação
        document.querySelectorAll('.nav-item').forEach(b => {
            b.classList.remove('active');
            b.removeAttribute('aria-current');
        });

        // Mostra só a página solicitada
        const page = document.getElementById('page-' + pageId);
        if (page) {
            page.classList.add('active');
            page.scrollTop = 0;
        }

        // Ativa só o botão correspondente
        const btn = document.getElementById('nav-' + pageId);
        if (btn) {
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'page');
        }

        // Renderiza a página carregando as infos na tela
        if (pageId === 'home')    VittaraHome.refresh();
        if (pageId === 'planner') VittaraPlanner.refresh();
        if (pageId === 'goals')   VittaraGoals.refresh();
        if (pageId === 'profile') VittaraProfile.refresh();
        if (pageId === 'list')    VittaraList.refresh();
        if (pageId === 'scanner') VittaraScanner.refresh();
    }
};