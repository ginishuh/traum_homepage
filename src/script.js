// Navigation Menu Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navMenu.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
  });
});

// Header scroll effect
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  
  lastScroll = currentScroll;
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// Scroll to top button
const scrollTopBtn = document.querySelector('.scroll-top');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 500) {
    scrollTopBtn.classList.add('show');
  } else {
    scrollTopBtn.classList.remove('show');
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Number animation for stats
const animateNumbers = () => {
  const numbers = document.querySelectorAll('.stat-number');
  
  numbers.forEach(number => {
    const target = parseInt(number.innerText);
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        number.innerText = number.innerText.includes('+') ? target + '+' : target;
        clearInterval(timer);
      } else {
        number.innerText = Math.floor(current);
      }
    }, 30);
  });
};

// Trigger number animation when stats section is visible
const statsSection = document.querySelector('.about-stats');
if (statsSection) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateNumbers();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  statsObserver.observe(statsSection);
}

// Form validation (if you add a contact form later)
const validateForm = (form) => {
  const inputs = form.querySelectorAll('input[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
  });
  
  return isValid;
};

// 문의하기 런처 (전화·카카오·톡톡·예약 메뉴)
const launcher = document.querySelector('.launcher');
const launcherBtn = document.querySelector('.launcher-btn');
const launcherMenu = document.querySelector('.launcher-menu');

const setLauncher = (open) => {
  if (!launcher) return;
  launcher.classList.toggle('open', open);
  launcherBtn.setAttribute('aria-expanded', String(open));
  launcherMenu.hidden = !open;
};

if (launcher) {
  launcherBtn.addEventListener('click', () => {
    setLauncher(launcherMenu.hidden);
  });
  document.querySelectorAll('.js-open-launcher').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      setLauncher(true);
      launcherMenu.querySelector('a').focus();
    });
  });
  document.addEventListener('click', (e) => {
    if (!launcherMenu.hidden && !launcher.contains(e.target) && !e.target.closest('.js-open-launcher')) {
      setLauncher(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !launcherMenu.hidden) setLauncher(false);
  });
}
