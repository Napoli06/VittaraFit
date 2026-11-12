window.VittaraUI = {

    toast(msg, tipo = 'info', duracao = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = `toast ${tipo}`;
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(() => el.remove(), duracao);
    },

};