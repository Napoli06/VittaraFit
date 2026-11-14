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
        auth.onAuthStateChanged(async user => {
            if (user) {
                this.currentUser = user;
                // Espera carregar os dados antes de ir para a Home:
                await VittaraDB.loadUserProfile(user.uid);
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
            objetivo: '',
            metaAguaL: 2,
            restricoes: [],
            alimentosFavoritos: [],
            profileComplete: false,          // ← NOVO: indica que o perfil precisa ser completado
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    },

    //busca os dados do perfil e joga no VittaraState
    async loadUserProfile(uid) {
        const doc = await db.collection('usuarios').doc(uid).get();

        if (doc.exists) {
            Object.assign(VittaraState.user, doc.data());
            // Carrega o registro diário de hoje
            await this.loadDailyLog(VittaraHome.hojeKey());

            if (window.VittaraProfile) VittaraProfile.refresh();
            if (window.VittaraHome) VittaraHome.refresh();
            if (window.VittaraGoals) VittaraGoals.render();
        }
    },

    //salva alterações no perfil
        async updateProfile(data) {
        await db.collection('usuarios').doc(this.uid).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        // Atualiza o estado local
        Object.assign(VittaraState.user, data);

        // Atualiza as telas na mesma hora:
        if (window.VittaraProfile) VittaraProfile.refresh();
        if (window.VittaraHome) VittaraHome.refresh();

        VittaraUI.toast('Perfil atualizado!', 'success');
    },

    //PLANO ALIMENTAR

    //salva o plano de um dia específico
    //datakey tem o formato YYYY-MM-DD
    async saveMealPlan(dataKey, plan) {
        await db
            .collection('usuarios').doc(this.uid)
            .collection('mealPlans').doc(dataKey)
            .set({ ...plan, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        VittaraState.mealPlan[dataKey] = plan;
    },

    //LISTA DE COMPRAS

    //salva a lista completa
    async saveShoppingList(list) {
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
                kcalConsumidas: today.kcalConsumidas || 0,
                kcalGastas: today.kcalGastas || 0,
                aguaMl: today.aguaMl || 0,
                atividadeMin: today.atividadeMin || 0,
                date: dateKey,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
    },

    async loadDailyLog(dateKey) {
        const doc = await db
            .collection('usuarios').doc(this.uid)
            .collection('logs').doc(dateKey)
            .get();
        if (doc.exists) {
            const d = doc.data();
            VittaraState.today.kcalConsumidas = d.kcalConsumidas || 0;
            VittaraState.today.kcalGastas = d.kcalGastas || 0;
            VittaraState.today.aguaMl = d.aguaMl || 0;
            VittaraState.today.atividadeMin = d.atividadeMin || 0;
        }
    },

    async loadLogs() {
        const snap = await db
            .collection('usuarios').doc(this.uid)
            .collection('logs')
            .orderBy('date', 'desc')
            .limit(30)
            .get();

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
    },

    // Comprime a imagem e salva como Base64 no Firestore
    async uploadFotoPerfil(arquivo) {
        const base64 = await VittaraDB.comprimirImagem(arquivo, 200, 0.75);
        await this.updateProfile({ fotoPerfil: base64 });
        return base64;
    },

    // Redimensiona e comprime via Canvas — retorna string Base64
    comprimirImagem(arquivo, tamanhoMax = 200, qualidade = 0.75) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Mantém proporção mas limita ao tamanhoMax
                    const ratio = Math.min(tamanhoMax / img.width, tamanhoMax / img.height);
                    canvas.width  = Math.round(img.width  * ratio);
                    canvas.height = Math.round(img.height * ratio);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', qualidade));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(arquivo);
        });
    },
};