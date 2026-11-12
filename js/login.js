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

// Liga o botão de olho (ícone SVG) a um campo de senha.
function configurarOlho(campo, botao) {
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