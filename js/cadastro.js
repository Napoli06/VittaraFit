// Configuração do projeto Firebase usado pela página de cadastro.
const firebaseConfig = {
    apiKey: "AIzaSyDjuOKVNw11ZPja_XOB7vmGC9KpOGA8q7E",
    authDomain: "vittarafit-71d7f.firebaseapp.com",
    projectId: "vittarafit-71d7f",
    storageBucket: "vittarafit-71d7f.firebasestorage.app",
    messagingSenderId: "538992150124",
    appId: "1:538992150124:web:cf6dd3caf172337fe6fa49"
};

// Evita erro de inicialização caso já tenha sido iniciado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

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

// Função que cria os ícones SVGs e alterna visibilidade da senha
function configurarOlho(campo, botao) {
    if (!campo || !botao) return;

    const iconeOlhoAberto = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>`;

    const iconeOlhoRiscado = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" x2="22" y1="2" y2="22"/>
      </svg>`;

    botao.innerHTML = campo.type === 'password' ? iconeOlhoAberto : iconeOlhoRiscado;

    botao.addEventListener('click', () => {
        const oculta = campo.type === 'password';
        campo.type = oculta ? 'text' : 'password';
        botao.innerHTML = oculta ? iconeOlhoRiscado : iconeOlhoAberto;
        botao.setAttribute('aria-label', oculta ? 'Ocultar senha' : 'Mostrar senha');
    });
}

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
            // Cria o perfil inicial do usuário no Firestore com profileComplete: false
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