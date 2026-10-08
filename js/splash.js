const splash = document.getElementById('splash');
const dots = document.querySelectorAll('.dot');
const logos = document.querySelectorAll('.logo-img');

function mostrarAnimacao(indice) {
  logos.forEach((logo, i) => logo.classList.toggle('active', i === indice));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === indice));
}

// Mostra a segunda logo após a primeira animação.
setTimeout(() => mostrarAnimacao(1), 1500);

setTimeout(() => {
  splash.classList.add('saindo');
  setTimeout(() => {
    window.location.replace('index.html?splashDone=1');
  }, 600);
}, 3000);

  