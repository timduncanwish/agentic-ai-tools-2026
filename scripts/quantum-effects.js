/**
 * QUANTUM TERMINAL EFFECTS
 * Particle systems, ripple interactions, and scroll animations
 */

// ===== QUANTUM PARTICLE SYSTEM =====
class QuantumParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.particleCount = 80;
    this.connectionDistance = 150;

    this.init();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    this.resizeCanvas();
    this.createParticles();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    const numberOfParticles = Math.floor((this.canvas.width * this.canvas.height) / 15000);

    for (let i = 0; i < numberOfParticles; i++) {
      const particle = {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3
      };
      this.particles.push(particle);
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.createParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
    });

    window.addEventListener('mouseout', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  updateParticles() {
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

      // Mouse interaction
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.mouse.radius) {
          const force = (this.mouse.radius - distance) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          particle.vx -= Math.cos(angle) * force * 0.3;
          particle.vy -= Math.sin(angle) * force * 0.3;
        }
      }

      // Apply friction
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Ensure minimum movement
      if (Math.abs(particle.vx) < 0.1) particle.vx = (Math.random() - 0.5) * 0.3;
      if (Math.abs(particle.vy) < 0.1) particle.vy = (Math.random() - 0.5) * 0.3;
    });
  }

  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.connectionDistance) {
          const opacity = (1 - distance / this.connectionDistance) * 0.15;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(0, 245, 255, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    this.particles.forEach(particle => {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);

      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 2
      );
      gradient.addColorStop(0, `rgba(0, 245, 255, ${particle.opacity})`);
      gradient.addColorStop(1, `rgba(139, 92, 246, 0)`);

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });
  }

  animate() {
    this.updateParticles();
    this.drawParticles();
    requestAnimationFrame(() => this.animate());
  }
}

// ===== RIPPLE EFFECT SYSTEM =====
class RippleEffectSystem {
  constructor(container) {
    this.container = container;
    this.rippleCount = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      this.createRipple(e.clientX, e.clientY);
    });
  }

  createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '20px';
    ripple.style.height = '20px';

    this.container.appendChild(ripple);
    this.rippleCount++;

    setTimeout(() => {
      ripple.remove();
      this.rippleCount--;
    }, 1000);
  }
}

// ===== SCROLL REVEAL ANIMATION =====
class ScrollRevealSystem {
  constructor() {
    this.elements = document.querySelectorAll('.reveal-on-scroll');
    this.setupObserver();
  }

  setupObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    this.elements.forEach(element => {
      observer.observe(element);
    });
  }
}

// ===== SMOOTH SCROLL =====
class SmoothScrollSystem {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
}

// ===== NAVIGATION SCROLL EFFECT =====
class NavScrollEffect {
  constructor(nav) {
    this.nav = nav;
    this.lastScrollY = window.scrollY;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        this.nav.style.background = 'rgba(3, 3, 5, 0.95)';
      } else {
        this.nav.style.background = 'rgba(3, 3, 5, 0.7)';
      }

      this.lastScrollY = currentScrollY;
    });
  }
}

// ===== INITIALIZE ALL SYSTEMS =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize particle system
  const canvas = document.getElementById('quantum-canvas');
  if (canvas) {
    new QuantumParticleSystem(canvas);
  }

  // Initialize ripple effects
  const rippleContainer = document.getElementById('ripple-container');
  if (rippleContainer) {
    new RippleEffectSystem(rippleContainer);
  }

  // Initialize scroll reveal
  new ScrollRevealSystem();

  // Initialize smooth scroll
  new SmoothScrollSystem();

  // Initialize nav scroll effect
  const nav = document.querySelector('.quantum-nav');
  if (nav) {
    new NavScrollEffect(nav);
  }

  // Add loading animation
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
  }, 100);
});

// ===== PARALLAX EFFECT FOR HERO =====
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const hero = document.querySelector('.quantum-hero');

  if (hero) {
    const rate = scrolled * -0.3;
    hero.style.transform = `translateY(${rate}px)`;
  }
});
