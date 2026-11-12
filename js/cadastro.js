// Configuração do projeto Firebase usado pela página de cadastro.
const firebaseConfig = {
    apiKey: "AIzaSyDjuOKVNw11ZPja_XOB7vmGC9KpOGA8q7E",
    authDomain: "vittarafit-71d7f.firebaseapp.com",
    projectId: "vittarafit-71d7f",
    storageBucket: "vittarafit-71d7f.firebasestorage.app",
    messagingSenderId: "538992150124",
    appId: "1:538992150124:web:cf6dd3caf172337fe6fa49"
};

firebase.initializeApp(firebaseConfig);

// Referências aos campos e controles da tela.
const signupForm = document.getElementById('signup-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const signupMessage = document.getElementById('signup-message');
const submitButton = signupForm.querySelector('.submit-button');
const togglePassword = document.getElementById('toggle-password');
const toggleConfirm = document.getElementById('toggle-confirm');

configurarOlho(passwordInput, togglePassword);
configurarOlho(confirmPasswordInput, toggleConfirm);

// Controla o envio do formulário e o fluxo de criação da conta.
signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    signupMessage.textContent = '';

    // Impede o envio quando a confirmação não corresponde à senha.
    if (passwordInput.value !== confirmPasswordInput.value) {
        signupMessage.textContent = 'As senhas não são iguais.';
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Criando conta...';

    try {
        // Cria o usuário no Firebase Authentication usando email e senha.
        const result = await firebase.auth().createUserWithEmailAndPassword(
            emailInput.value.trim(),
            passwordInput.value
        );

        try {
            // Cria o perfil inicial do usuário no Firestore.
            await firebase.firestore().collection('usuarios').doc(result.user.uid).set({
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                peso: null,
                altura: null,
                metaDePeso: null,
                objetivo: 'Perda de peso',
                metaAguaL: 2,
                restricoes: [],
                alimentosFavoritos: [],
                profileComplete: false, 
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (profileError) {
            if (profileError.code === 'permission-denied') {
                signupMessage.textContent = 'Conta criada, mas o perfil não pôde ser salvo. Verifique as regras do Firestore.';
                console.error('A conta foi criada, mas o perfil foi recusado pelo Firestore:', profileError.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Criar minha conta';
                return;
            }

            throw profileError;
        }

        // Envia o usuário para a aplicação após concluir o cadastro.
        window.location.replace('index.html');
    } catch (error) {
        // Traduz os principais erros do Firebase para mensagens em português.
        const messages = {
            'auth/email-already-in-use': 'Este email já está cadastrado.',
            'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
            'auth/invalid-email': 'Digite um email válido.',
            'auth/operation-not-allowed': 'O cadastro por email está desativado no Firebase.',
            'auth/network-request-failed': 'Não foi possível conectar ao Firebase. Verifique sua internet.'
        };

        // Exibe o erro e libera o botão para uma nova tentativa.
        signupMessage.textContent = messages[error.code] || `Não foi possível criar a conta. (${error.code || error.message})`;
        console.error('Erro de cadastro Firebase:', error.code, error.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Criar minha conta';
    }
});