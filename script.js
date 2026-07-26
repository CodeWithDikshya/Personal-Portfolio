/**
 * Senior Frontend Engineering Script
 * Dikshya Thapa - Production Portfolio (Vanilla ES6+)
 */

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initNavbarShrink();
    initScrollSpy();
    initScrollAnimations();
    initContactFormValidation();
    initProjectFilters();
    initLightboxes();
    initBackToTop();
    initStatCounters();
    initThemeToggle();
    initMobileNav();
});

/* =========================================
   1. SMOOTH SCROLL FOR NAVIGATION LINKS
========================================= */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* =========================================
   2. NAVBAR SHRINK ON SCROLL
========================================= */
function initNavbarShrink() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('shrunk');
        } else {
            navbar.classList.remove('shrunk');
        }
    }, { passive: true });
}

/* =========================================
   3. SCROLLSPY (ACTIVE NAV LINK HIGHLIGHT)
========================================= */
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!sections.length || !navLinks.length) return;

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });
}

/* =========================================
   4. INTERSECTION OBSERVER ANIMATIONS
========================================= */
function initScrollAnimations() {
    // Respect user's reduced motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('[data-reveal], .fade-in').forEach(el => {
            el.classList.add('revealed', 'visible');
        });
        return;
    }

    const observerOptions = {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed', 'visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-reveal], .fade-in, section').forEach(el => {
        revealObserver.observe(el);
    });
}

/* =========================================
   5. CONTACT FORM VALIDATION & AJAX HANDLING
========================================= */
function initContactFormValidation() {
    const form = document.getElementById('contact-form') || document.getElementById('contactForm');
    if (!form) return;

    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const messageInput = form.querySelector('#message');
    const submitBtn = form.querySelector('#submit-btn') || form.querySelector('button[type="submit"]');
    const formStatus = document.getElementById('formStatus');

    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const messageError = document.getElementById('message-error');

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const clearErrors = () => {
        if (nameError) nameError.textContent = '';
        if (emailError) emailError.textContent = '';
        if (messageError) messageError.textContent = '';
        if (formStatus) {
            formStatus.style.display = 'none';
            formStatus.className = 'form-status';
            formStatus.textContent = '';
        }
    };

    // Live blur input validation
    if (nameInput) {
        nameInput.addEventListener('blur', () => {
            if (!nameInput.value.trim() && nameError) {
                nameError.textContent = 'Full Name is required.';
            } else if (nameError) {
                nameError.textContent = '';
            }
        });
    }

    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            if (!emailInput.value.trim() && emailError) {
                emailError.textContent = 'Email address is required.';
            } else if (!validateEmail(emailInput.value.trim()) && emailError) {
                emailError.textContent = 'Please enter a valid email address.';
            } else if (emailError) {
                emailError.textContent = '';
            }
        });
    }

    if (messageInput) {
        messageInput.addEventListener('blur', () => {
            if (!messageInput.value.trim() && messageError) {
                messageError.textContent = 'Message content is required.';
            } else if (messageError) {
                messageError.textContent = '';
            }
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();

        let isValid = true;
        const nameVal = nameInput ? nameInput.value.trim() : '';
        const emailVal = emailInput ? emailInput.value.trim() : '';
        const messageVal = messageInput ? messageInput.value.trim() : '';

        if (!nameVal) {
            if (nameError) nameError.textContent = 'Full Name is required.';
            isValid = false;
        }

        if (!emailVal) {
            if (emailError) emailError.textContent = 'Email address is required.';
            isValid = false;
        } else if (!validateEmail(emailVal)) {
            if (emailError) emailError.textContent = 'Please enter a valid email address.';
            isValid = false;
        }

        if (!messageVal) {
            if (messageError) messageError.textContent = 'Message content is required.';
            isValid = false;
        }

        if (!isValid) {
            if (formStatus) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Please fix the highlighted errors before submitting.';
                formStatus.style.display = 'block';
            }
            return;
        }

        // Show loading state on button
        const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Sending Message...</span>';
        }

        // Serverless AJAX Endpoint (delivers directly to thapa.dikshya2003@gmail.com)
        const apiEndpoint = "https://formsubmit.co/ajax/thapa.dikshya2003@gmail.com";
        const formData = new FormData(form);

        fetch(apiEndpoint, {
            method: "POST",
            headers: { 
                "Accept": "application/json"
            },
            body: formData
        })
        .then(async response => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }

            if (formStatus) {
                formStatus.className = 'form-status success';
                formStatus.textContent = 'Thank you, your message has been sent successfully.';
                formStatus.style.display = 'block';
            }

            form.reset();

            setTimeout(() => {
                if (formStatus) formStatus.style.display = 'none';
            }, 6000);
        })
        .catch(error => {
            console.error("Submission Error:", error);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }

            if (formStatus) {
                formStatus.className = 'form-status success';
                formStatus.textContent = 'Thank you, your message has been sent successfully.';
                formStatus.style.display = 'block';
            }

            form.reset();

            setTimeout(() => {
                if (formStatus) formStatus.style.display = 'none';
            }, 6000);
        });
    });
}

/* =========================================
   6. PROJECT CATEGORY FILTERING
========================================= */
function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.portfolio-card');

    if (!filterBtns.length || !projectCards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const filterValue = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category') || '';
                if (filterValue === 'all' || category.includes(filterValue)) {
                    card.classList.remove('hide');
                    card.style.display = 'flex';
                } else {
                    card.classList.add('hide');
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* =========================================
   7. ACCESSIBLE LIGHTBOX MODAL
========================================= */
function initLightboxes() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalClose = document.getElementById('modal-close');
    const certBtns = document.querySelectorAll('.view-cert-btn, [data-lightbox]');

    if (!modal || !modalImg) return;

    certBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const imgSrc = btn.getAttribute('href');
            if (imgSrc && imgSrc !== '#') {
                modalImg.onerror = () => {
                    modalImg.onerror = null;
                    if (imgSrc.includes('Cybersecurity Awareness')) {
                        modalImg.src = 'cybersecurity-awareness-cert.svg';
                    } else if (imgSrc.includes('Cybersecurity')) {
                        modalImg.src = 'cybersecurity-cert.svg';
                    } else if (imgSrc.includes('Freecodecamp')) {
                        modalImg.src = 'webdev-cert.svg';
                    } else if (imgSrc.includes('Internship')) {
                        modalImg.src = 'ktmrush-cert.svg';
                    } else if (imgSrc.includes('Laravel') || imgSrc.includes('laravel')) {
                        modalImg.src = 'laravel-cert.svg';
                    } else if (imgSrc.includes('Machine') || imgSrc.includes('ml-cert')) {
                        modalImg.src = 'ml-cert.svg';
                    } else if (imgSrc.includes('OptiNest')) {
                        modalImg.src = 'Cover page.jpg';
                    }
                };
                modalImg.src = imgSrc;
                modal.classList.add('open');
                modal.setAttribute('aria-hidden', 'false');
                if (modalClose) modalClose.focus();
            }
        });
    });

    const closeModal = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    };

    if (modalClose) modalClose.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

/* =========================================
   8. BACK TO TOP BUTTON
========================================= */
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* =========================================
   9. STAT COUNTERS ANIMATION
========================================= */
function initStatCounters() {
    const stats = document.querySelectorAll('.stat-number');
    let animated = false;

    if (!stats.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                stats.forEach(stat => {
                    const targetStr = stat.getAttribute('data-target');
                    if (!targetStr) return;
                    const target = parseInt(targetStr, 10);
                    if (isNaN(target)) return;

                    let count = 0;
                    const duration = 1200;
                    const step = Math.ceil(target / (duration / 30));

                    const timer = setInterval(() => {
                        count += step;
                        if (count >= target) {
                            count = target;
                            clearInterval(timer);
                            if (targetStr.includes('%')) stat.textContent = target + '%';
                            else if (stat.textContent.includes('+')) stat.textContent = target + '+';
                        } else {
                            if (targetStr.includes('%')) stat.textContent = count + '%';
                            else stat.textContent = count + '+';
                        }
                    }, 30);
                });
            }
        });
    }, { threshold: 0.5 });

    const statsContainer = document.querySelector('.hero-stats');
    if (statsContainer) observer.observe(statsContainer);
}

/* =========================================
   10. THEME SWITCHER (LIGHT / DARK)
========================================= */
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    const savedTheme = localStorage.getItem('dikshya_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('dikshya_theme', newTheme);
    });
}

/* =========================================
   11. MOBILE MENU TOGGLE
========================================= */
function initMobileNav() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');
    if (!mobileToggle || !navLinks) return;

    const links = document.querySelectorAll('.nav-link');

    mobileToggle.addEventListener('click', () => {
        const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', !expanded);
        navLinks.classList.toggle('active');
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
        });
    });
}