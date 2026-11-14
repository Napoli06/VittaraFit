window.VittaraState = {

    // Metas e dados do usuário (do perfil no Firestore)
    user: {
        name: '',
        email: '',
        peso: null,
        altura: null,
        metaDePeso: null,
        objetivo: '',
        metaAguaL: 2,
        metaKcalConsumo: 2000,     // NOVO: calorias diárias a consumir
        metaKcalGasto: 500,        // NOVO: calorias diárias a gastar
        metaAtividadeMin: 60,      // NOVO: tempo diário de atividade física (min)
        restricoes: [],
        alimentosFavoritos: [],
        profileComplete: false,
    },

    // Progresso registrado hoje
    today: {
        alvoKcal: 2000,
        kcalConsumidas: 0,
        kcalGastas: 0,             // NOVO
        aguaMl: 0,                 // mL bebidos hoje
        atividadeMin: 0,           // minutos de atividade hoje
    },

    scanHistory:  [],
    mealPlan:     {},
    shoppingList: [],

    get bmi() {
        if (!this.user.peso || !this.user.altura) return null;
        const h = this.user.altura;
        return (this.user.peso / (h * h)).toFixed(1);
    },
};