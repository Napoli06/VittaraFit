window.VittaraState = {

    // Dados do usuário (vêm do Firestore após login)
    user: {
        name: '',
        email: '',
        peso: null,
        altura: null,
        metaDePeso: null,
        objetivo: '',
        metaAguaL: 2,
        restricoes: [],
        alimentosFavoritos: [],
        profileComplete: false,
    },

    // Dados nutricionais do dia
    today: {
        alvoKcal: 1800,
        kcalConsumidas: 0,
        proteina:    { consumida: 0, alvo: 130 },
        carboidrato: { consumido: 0, alvo: 150 },
        gordura:     { consumida: 0, alvo: 55  },
        agua:        { consumida: 0 },
        atividade: 0,
    },

    // Histórico de scans, plano e lista de compras
    scanHistory:  [],
    mealPlan:     {},
    shoppingList: [],

    get bmi() {
        if (!this.user.peso || !this.user.altura) return null;
        const h = this.user.altura; // já em metros
        return (this.user.peso / (h * h)).toFixed(1);
    },
};