//esse comando significa q a variável estará visivel no app todo

window.VittaraState = {

    //dados do usuário, quando conectado com firebase esses dados firão do firestore
    usuario: {
        nome: 'Roberto',
        email: 'roberto@email.com',
        peso: 85,
        altura: 1.75,
        metaDePeso: 70,
        orcamento: 1000
    },

    //dados nutricionais do dia
    hoje: {
        alvoKcal: 1800,
        kcalConsumidas: 1450,
        proteina: { consumida: 80, alvo: 130 },
        carboidrato: { consumido: 142, alvo: 150 },
        gordura: { consumida: 44, alvo: 55 }
    },

    //histórico de produtos escaneados, plano alimentar e lista de compras
    scanHistory: [],
    mealPlan: [],
    shoppingList: [],

    //get é uma propriedade calculada automaticamente, ou seja, não precisa ser chamada como uma função
    get bmi() {
        const alturaMetros = this.usuario.altura / 100;
        return (this.usuario.peso / (alturaMetros * alturaMetros)).toFixed(1);
    },

};