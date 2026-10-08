// Configuração do projeto Firebase usado pela página de login.
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
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('login-message');
const submitButton = loginForm.querySelector('.submit-button');
const togglePassword = document.getElementById('toggle-password');

// Exibe ou oculta a senha ao clicar no botão.
togglePassword.addEventListener('click', () => {
    const showingPassword = passwordInput.type === 'text';
    passwordInput.type = showingPassword ? 'password' : 'text';
    togglePassword.textContent = showingPassword ? 'Mostrar' : 'Ocultar';
});

// Controla o envio do formulário de login.
loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    loginMessage.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';

    try {
        // Confere as credenciais no Firebase Authentication.
        await firebase.auth().signInWithEmailAndPassword(
            emailInput.value.trim(),
            passwordInput.value
        );

        // Abre a aplicação depois que o login for concluído.
        window.location.replace('index.html?splashDone=1');
    } catch (error) {
        // Traduz os principais erros do Firebase para mensagens em português.
        const messages = {
            'auth/invalid-credential': 'Email ou senha incorretos.',
            'auth/user-not-found': 'Email ou senha incorretos.',
            'auth/wrong-password': 'Email ou senha incorretos.',
            'auth/invalid-email': 'Digite um email válido.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
            'auth/operation-not-allowed': 'O login por email e senha está desativado no Firebase.',
            'auth/network-request-failed': 'Não foi possível conectar ao Firebase. Verifique sua internet.',
            'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'A chave da API do Firebase foi rejeitada. Confira a configuração do app Web.'
        };

        // Exibe o erro e libera o botão para uma nova tentativa.
        loginMessage.textContent = messages[error.code] || `Não foi possível fazer login. (${error.code || error.message})`;
        console.error('Erro de autenticação Firebase:', error.code, error.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
    }
});