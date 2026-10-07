const splash = document.getElementById('splash');
const dots = document.querySelectorAll('.dot');
const logoImg = document.querySelector('.logo-img');


let atual = 0;
const intervalo = setInterval(() => {
dots[atual].classList.remove('active');
atual = (atual + 1) % dots.length;
dots[atual].classList.add('active');

}, 800);

setTimeout(() => {
     clearInterval(intervalo);
     splash.classList.add('saindo');
      setTimeout(() => {
    window.location.href = 'login.html';
  }, 600); }, 3000);

  