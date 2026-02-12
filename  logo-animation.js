/**
 * Logo Animation System
 * Nozha 2 - Advanced Logo Effects
 */

export class LogoAnimation {
  constructor(selector = '.logo') {
    this.logo = document.querySelector(selector);
    this.init();
  }

  init() {
    if (!this.logo) return;

    this.addHoverEffect();
    this.addGlowPulse();
    this.addClickBurst();
  }

  addHoverEffect() {
    this.logo.addEventListener('mouseenter', () => {
      this.logo.style.transform = 'scale(1.1) rotate(3deg)';
      this.logo.style.transition = 'all 0.4s cubic-bezier(.68,-0.55,.27,1.55)';
    });

    this.logo.addEventListener('mouseleave', () => {
      this.logo.style.transform = 'scale(1) rotate(0deg)';
    });
  }

  addGlowPulse() {
    this.logo.style.animation = 'float 3s ease-in-out infinite';
    this.logo.classList.add('hover-glow');
  }

  addClickBurst() {
    this.logo.addEventListener('click', (e) => {
      this.createBurst(e.clientX, e.clientY);
    });
  }

  createBurst(x, y) {
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'logo-particle';
      document.body.appendChild(particle);

      const angle = (i / 12) * Math.PI * 2;
      const radius = 80;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.position = 'fixed';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.borderRadius = '50%';
      particle.style.background = 'var(--primary-orange)';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';

      setTimeout(() => {
        particle.style.transition = 'all 0.6s ease-out';
        particle.style.transform = `translate(${Math.cos(angle)*radius}px, ${Math.sin(angle)*radius}px)`;
        particle.style.opacity = '0';
      }, 10);

      setTimeout(() => particle.remove(), 700);
    }
  }
}

export default LogoAnimation;