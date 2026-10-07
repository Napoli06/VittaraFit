window.VittaraRouter = {


    //lista todas as pag do app
    pages: ['home', 'planner', 'scanner', 'list', 'ai', 'profile'],

    init() {
        //inicia na home
        this.navigate('home');
    },

    navigate(pageId) {
        //esconde as paginas
        document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); });

        //desativa os botões da navegação
        document.querySelectorAll('.nav-item').forEach(b => { b.classList.remove('active'); });

        //moostra só a página solicitada
        const page = document.getElementById('page-' + pageId);
        if (page) {
            page.classList.add('active');
            page.scrollTop = 0;
        }

        //ativa so o botão correspondente
        const btn = document.getElementById('nav-' + pageId);
        if (btn) btn.classList.add('active');

        //renderiza a pagina carregando as infos na tela
        if (pageId === 'home')    VittaraHome.refresh();
        if (pageId === 'planner') VittaraPlanner.refresh();
        if (pageId === 'profile') VittaraProfile.refresh();
        if (pageId === 'list')    VittaraList.refresh();
        if (pageId === 'scanner') VittaraScanner.refresh();
    }
};