//config do firebase 
const firebaseConfig = {
  apiKey: "AIzaSyDjuOKVNw11ZPja_XOB7vmGC9KpOGA8q7E",
  authDomain: "vittarafit-71d7f.firebaseapp.com",
  projectId: "vittarafit-71d7f",
  storageBucket: "vittarafit-71d7f.firebasestorage.app",
  messagingSenderId: "538992150124",
  appId: "1:538992150124:web:cf6dd3caf172337fe6fa49"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth(); //autenticação
const db = firebase.firestore(); //banco de dados

//serviço de autenticação

window.VittaraAuth = {
    currentUser: null, //null = nenhum usuário

    init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                //usuário logado
                this.currentUser = user;
                //carrega os dados do usuário no app
                VittaraDB.loadUserProfile(user.uid);
                //vai para a pág principal
                VittaraRouter.navigate('home');
            } else {
                //usuário não logado
                this.currentUser = null;
                if (!window.location.pathname.endsWith('/login.html')) {
                    window.location.replace('login.html');
                }
            }
        });
    },

    //criar nova conta
    async register(name, email, password) {
        try {
            //cria usuário no firebase
            const result = await auth.createUserWithEmailAndPassword(email, password);
            const uid = result.user.uid;

            //salva no firestore
            await VittaraDB.createUserProfile(uid, { name, email });

            VittaraUI.toast('Conta criada com sucesso!', 'success');
            return { ok: true };
        } catch (error) {
            const msg = {
                'auth/email-already-in-use': 'Este email já está cadastrado',
                'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres',
                'auth/invalid-email': 'Email inválido',
            }[error.code] || 'Erro ao criar conta';
            VittaraUI.toast(msg, 'error');
            return { ok: false, error: msg };
        }
    },

    //login c email e senha
    async login(email, password) {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            return { ok: true };
        } catch (error) {
            const msg = {
                'auth/user-not-found': 'Email não encontrado',
                'auth/wrong-password': 'Senha incorreta',
                'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
            }[error.code] || 'Erro ao fazer login';

            VittaraUI.toast(msg, 'error');
            return { ok: false, error: msg };
        }
    },

    //logout
    async logout() {
        await auth.signOut();
        VittaraUI.toast('Até logo!', 'info');
    },

    //recuperar senha por email
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            VittaraUI.toast('Email de recuperação enviado!', 'success');
            return { ok: true };
        } catch (error) {
            VittaraUI.toast('Email não encontrado', 'error');
            return { ok: false };
        }
    }
};

window.VittaraDB = {
    //pega o UID do usuário logado
    get uid() {
        return VittaraAuth.currentUser?.uid;
    },

    //perfil do usuário!!!

    //cria o documento do usuário no firestore
    async createUserProfile(uid, data) {
        //db.collection('usuarios') cria/acessa
        await db.collection('usuarios').doc(uid).set({
            name: data.name,
            email: data.email,
            peso: null,
            altura: null,
            metaDePeso: null,
            objetivo: 'Perda de peso',
            restricoes: [],
            orcamento: 300,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            //serverTimestamp() usa horario do servidor do firebase (mais confiável q o do celular)
        });
    },

    //busca os dados do perfil e joga no VittaraState
    async loadUserProfile(uid) {
        //.get busca o doc de uma vez
        const doc = await db.collection('usuarios').doc(uid).get();

        if (doc.exists) {
            //doc.data() retorna os dados do doc
            //object.assign() copia tudo para o VittaraState.user
            Object.assign(VittaraState.user, doc.data());
            VittaraProfile.refresh(); //atualiza tela de perfil
        }
    },

    //salva alterações no perfil
    async updateProfile(data) {
        await db.collection('usuarios').doc(this.uid).update({
            ...data, //copia todos os campos de "data"
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        //atualiza localmente tbm
        Object.assign(VittaraState.user, data);
        VittaraUI.toast('Perfil atualizado!', 'success');
    },

    //PLANO ALIMENTAR

    //salva o plano de um dia específico
    //datakey tem o formato YYYY-MM-DD
    async saveMealPlan(dataKey, plan) {
        //subcoleção: users/{uid}/mealPlans/{data}
        await db
            .collection('usuarios').doc(this.uid)
            .collection('mealPlans').doc(dataKey)
            .get();

        if (doc.exists) {
            //salva no estado local
            VittaraState.mealPlan[dataKey] = doc.data();
            return doc.data();
        }
        return null;
    },

    //LISTA DE COMPRAS

    //salva a lista completa
    async loadShoppingList(list) {
        await db
            .collection('usuarios').doc(this.uid)
            .collection('lists').doc('current')
            .set({ items: list, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    },

    //busca a lista
    async loadShoppingList() {
        const doc = await db
            .collection('usuarios').doc(this.uid)
            .collection('lists').doc('current')
            .get();
        if (doc.exists) {
            VittaraState.shoppingList = doc.data().items;
            VittaraList.refresh();
        }
    },

    // REGISTRO DIARIO
    //salva macros diários (calorias, proteínas, carboidratos, gorduras, etc)

    async saveDailyLog(dateKey) {
        const { today } = VittaraState;
        await db
            .collection('usuarios').doc(this.uid)
            .collection('logs').doc(dateKey)
            .set({
                kcal: today.kcalConsumidas,
                proteina: today.proteina.consumida,
                carboidrato: today.carboidrato.consumido,
                gordura: today.gordura.consumida,
                agua: today.agua.consumida,
                date: dateKey,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
    },
    
    //busca os ultimos 30 dias de registros
    async loadLogs() {
        const snap = await db
        .collection('usuarios').doc(this.uid)
        .collection('logs')
        .orderBy('date', 'desc') //mais recente primeiro
        .limit (30)
        .get();

        //snap.docs é um array de docs
        return snap.docs.map(doc => doc.data());
    },

    // HISTORICO DO SCANNER
    async saveScan(product) {
        //addDoc cria um produto com ID automático
        await db
        .collection('usuarios').doc(this.uid)
        .collection('scans')
        .add({
            ...product,
            scannedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    },

    async loadScanHistory() {
        const snap = await db
        .collection('usuarios').doc(this.uid)
        .collection('scans')
        .orderBy('scannedAt', 'desc')
        .limit(10)
        .get();

        VittaraState.scanHistory = snap.docs.map(doc => doc.data());
        VittaraScanner.renderHistory();
    },

    //Diferente do .get() que busca uma vez, o .onSnapshot() fica "ouvindo" e atualiza, 
    // bom para sincronizar entre dispositivos

    listenToShoppingList() {
        return db
        .collection('usuarios').doc(this.uid)
        .collection('lists').doc('current')
        .onSnapshot((doc) => {
            if (doc.exists) {
                VittaraState.shoppingList = doc.data().items;
                VittaraList.refresh(); //atualiza a tela automaticamente
            }
        });
        // Guarde o retorno dessa função para cancelar a escuta:
        // const unsubscribe = VittaraDB.listenToShoppingList();
        // unsubscribe(); // cancela quando não precisar mais
    }
};