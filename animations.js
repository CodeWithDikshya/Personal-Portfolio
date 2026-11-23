/**
 * Motion layer for the portfolio.
 * Runs before script.js so the reveal attributes it adds are picked up
 * by the existing IntersectionObserver in initScrollAnimations().
 */
(function () {
    'use strict';

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* -----------------------------------------
       Runs immediately (DOM is parsed: script sits at end of body)
    ----------------------------------------- */
    assignRevealVariants();
    initScrollProgress();

    if (!reduceMotion) {
        splitHeadline();
        prepareCodeTyping();
        decorateTimeline();
        tagStagger();
        initIconDraw();
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (reduceMotion) return;
        initSettleAfterReveal();
        initTimelineProgress();
        initStatPop();
        initProjectFilterAnimation();
        initFilterIndicator();
        initThemeSpin();
        initRipples();
        if (finePointer) {
            initHeroParallax();
            initCardTilt();
            initMagnetic();
            initCursorGlow();
        }
    });

    // Hide the loader once everything (fonts, images) is ready, with a short minimum
    const start = performance.now();
    const finishLoading = () => {
        const wait = Math.max(0, 650 - (performance.now() - start));
        setTimeout(() => root.classList.remove('is-loading'), wait);
    };
    if (document.readyState === 'complete') finishLoading();
    else window.addEventListener('load', finishLoading);

    /* -----------------------------------------
       Reveal variants + automatic stagger
    ----------------------------------------- */
    function assignRevealVariants() {
        const setDelays = (selector, perRow) => {
            document.querySelectorAll(selector).forEach((el, i) => {
                el.setAttribute('data-reveal', 'delay-' + ((i % perRow) + 1));
            });
        };

        setDelays('.portfolio-grid > .portfolio-card', 3);
        setDelays('.certificates-grid > .certificate-card', 3);

        document.querySelectorAll('.timeline-item').forEach((el, i) => {
            el.setAttribute('data-anim', i % 2 ? 'right' : 'left');
        });
        document.querySelectorAll('.certificate-card').forEach(el => el.setAttribute('data-anim', 'zoom'));
        document.querySelectorAll('.portfolio-card').forEach(el => el.setAttribute('data-anim', 'flip'));

        const contactForm = document.querySelector('.contact-form');
        const contactInfo = document.querySelector('.contact-info');
        if (contactForm) contactForm.setAttribute('data-anim', 'left');
        if (contactInfo) contactInfo.setAttribute('data-anim', 'right');

        // Footer columns were never animated: add reveals
        document.querySelectorAll('.footer-content > *').forEach((el, i) => {
            if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'delay-' + Math.min(i + 1, 4));
        });
    }

    // Once an element's entrance has played, remove its stagger delay so hover is instant
    function initSettleAfterReveal() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                const el = m.target;
                if (el.classList.contains('revealed') && !el.classList.contains('settled')) {
                    setTimeout(() => el.classList.add('settled'), 1400);
                }
            });
        });
        document.querySelectorAll('[data-reveal]').forEach(el => {
            observer.observe(el, { attributes: true, attributeFilter: ['class'] });
        });
    }

    /* -----------------------------------------
       Scroll progress bar
    ----------------------------------------- */
    function initScrollProgress() {
        const bar = document.getElementById('scroll-progress');
        if (!bar) return;
        let ticking = false;
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.setProperty('--progress', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
    }

    /* -----------------------------------------
       Hero headline: wrap each word for a masked slide-up
    ----------------------------------------- */
    function splitHeadline() {
        const h1 = document.querySelector('.hero-content h1');
        if (!h1) return;
        h1.removeAttribute('data-reveal');
        h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());

        let index = 0;
        const walk = (node) => {
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const parts = child.textContent.split(/(\s+)/);
                    const frag = document.createDocumentFragment();
                    parts.forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(' '));
                            return;
                        }
                        const outer = document.createElement('span');
                        outer.className = 'split-word';
                        outer.setAttribute('aria-hidden', 'true');
                        const inner = document.createElement('span');
                        inner.textContent = part;
                        inner.style.setProperty('--w', index++);
                        outer.appendChild(inner);
                        frag.appendChild(outer);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    walk(child);
                }
            });
        };
        walk(h1);
    }

    /* -----------------------------------------
       Code window: type each line in sequence
    ----------------------------------------- */
    function prepareCodeTyping() {
        const code = document.querySelector('.code-body code');
        if (!code) return;
        const lines = code.innerHTML.split('\n');
        code.innerHTML = lines
            .map((line, i) => '<span class="code-line" style="--l:' + i + '">' + (line || ' ') + '</span>')
            .join('\n') + '<span class="code-caret"></span>';
    }

    /* -----------------------------------------
       Hero: aurora parallax + code window tilt
    ----------------------------------------- */
    function initHeroParallax() {
        const hero = document.getElementById('hero');
        const box = document.querySelector('.code-snippet-box');
        if (!hero) return;
        let frame = null;

        hero.addEventListener('pointermove', (e) => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                const r = hero.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                hero.style.setProperty('--px', x.toFixed(3));
                hero.style.setProperty('--py', y.toFixed(3));
                if (box) {
                    box.style.setProperty('--cry', (x * 14).toFixed(2) + 'deg');
                    box.style.setProperty('--crx', (-y * 10).toFixed(2) + 'deg');
                }
            });
        });

        hero.addEventListener('pointerleave', () => {
            hero.style.setProperty('--px', 0);
            hero.style.setProperty('--py', 0);
            if (box) {
                box.style.setProperty('--cry', '0deg');
                box.style.setProperty('--crx', '0deg');
            }
        });
    }

    /* -----------------------------------------
       Cards: 3D tilt with glare
    ----------------------------------------- */
    function initCardTilt() {
        const cards = document.querySelectorAll('.portfolio-card, .certificate-card, .timeline-item, .contact-info, .about-intro, .about-point');
        const maxTilt = 5;

        cards.forEach(card => {
            card.classList.add('tilt-card');
            const glare = document.createElement('span');
            glare.className = 'card-glare';
            glare.setAttribute('aria-hidden', 'true');
            card.appendChild(glare);

            let frame = null;
            card.addEventListener('pointermove', (e) => {
                if (!card.classList.contains('settled') || frame) return;
                frame = requestAnimationFrame(() => {
                    frame = null;
                    const r = card.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width;
                    const y = (e.clientY - r.top) / r.height;
                    card.classList.add('is-tilting');
                    card.style.setProperty('--ry', ((x - 0.5) * maxTilt * 2).toFixed(2) + 'deg');
                    card.style.setProperty('--rx', ((0.5 - y) * maxTilt * 2).toFixed(2) + 'deg');
                    card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
                    card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
                });
            });

            card.addEventListener('pointerleave', () => {
                if (frame) { cancelAnimationFrame(frame); frame = null; }
                card.classList.remove('is-tilting');
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    }

    /* -----------------------------------------
       Magnetic buttons
    ----------------------------------------- */
    function initMagnetic() {
        const targets = document.querySelectorAll('.hero-btns .btn, #submit-btn, .back-to-top, .social-btn, .theme-btn');
        targets.forEach(el => {
            const strength = el.classList.contains('btn') ? 0.3 : 0.4;
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - (r.left + r.width / 2);
                const y = e.clientY - (r.top + r.height / 2);
                el.style.setProperty('--mx-btn', (x * strength).toFixed(1) + 'px');
                el.style.setProperty('--my-btn', (y * strength).toFixed(1) + 'px');
            });
            el.addEventListener('pointerleave', () => {
                el.style.setProperty('--mx-btn', '0px');
                el.style.setProperty('--my-btn', '0px');
            });
        });
    }

    /* -----------------------------------------
       Soft glow that trails the cursor
    ----------------------------------------- */
    function initCursorGlow() {
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        glow.setAttribute('aria-hidden', 'true');
        document.body.appendChild(glow);

        let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
        const loop = () => {
            cx += (tx - cx) * 0.12;
            cy += (ty - cy) * 0.12;
            glow.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
            if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) requestAnimationFrame(loop);
            else running = false;
        };

        window.addEventListener('pointermove', (e) => {
            tx = e.clientX;
            ty = e.clientY;
            glow.classList.add('active');
            if (!running) { running = true; requestAnimationFrame(loop); }
        }, { passive: true });

        document.addEventListener('pointerleave', () => glow.classList.remove('active'));
    }

    /* -----------------------------------------
       Timeline: dots + line that fills while scrolling
    ----------------------------------------- */
    function decorateTimeline() {
        document.querySelectorAll('.timeline-item').forEach(item => {
            const dot = document.createElement('span');
            dot.className = 'timeline-dot';
            dot.setAttribute('aria-hidden', 'true');
            item.appendChild(dot);
        });
    }

    function initTimelineProgress() {
        const wrap = document.querySelector('.timeline-wrapper');
        if (!wrap) return;
        const items = wrap.querySelectorAll('.timeline-item');
        let ticking = false;

        const update = () => {
            ticking = false;
            const r = wrap.getBoundingClientRect();
            const anchor = window.innerHeight * 0.6;
            const progress = Math.min(Math.max((anchor - r.top) / r.height, 0), 1);
            wrap.style.setProperty('--tl', progress.toFixed(3));
            items.forEach(item => {
                const ir = item.getBoundingClientRect();
                item.classList.toggle('lit', ir.top + 40 < anchor);
            });
        };

        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
    }

    /* -----------------------------------------
       Small details
    ----------------------------------------- */
    // Line icons in About draw themselves in when they scroll into view
    function initIconDraw() {
        const svgs = document.querySelectorAll('.about-bento svg');
        if (!svgs.length || !('IntersectionObserver' in window)) return;
        svgs.forEach(svg => svg.querySelectorAll('[pathLength]').forEach(shape => {
            shape.style.strokeDasharray = '1';
            shape.style.strokeDashoffset = '1';
        }));
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.querySelectorAll('[pathLength]').forEach((shape, i) => {
                    shape.style.setProperty('--draw-delay', (0.5 + i * 0.15) + 's');
                    shape.classList.add('drawn');
                });
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        svgs.forEach(svg => io.observe(svg));
    }

    function tagStagger() {
        document.querySelectorAll('.tags').forEach(group => {
            group.querySelectorAll('span').forEach((tag, i) => tag.style.setProperty('--t', i));
        });
    }

    function initStatPop() {
        document.querySelectorAll('.stat-number').forEach(stat => {
            const target = stat.getAttribute('data-target');
            const observer = new MutationObserver(() => {
                if (parseInt(stat.textContent, 10) === parseInt(target, 10)) {
                    stat.classList.add('counted');
                    observer.disconnect();
                }
            });
            observer.observe(stat, { childList: true, characterData: true, subtree: true });
        });
    }

    function initProjectFilterAnimation() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // script.js toggles visibility on the same click; animate on the next frame
                requestAnimationFrame(() => {
                    let i = 0;
                    document.querySelectorAll('.portfolio-card').forEach(card => {
                        card.classList.remove('filter-in');
                        if (card.style.display === 'none') return;
                        void card.offsetWidth;
                        card.style.setProperty('--f', i++);
                        card.classList.add('filter-in');
                    });
                });
            });
        });
    }

    // Sliding pill behind the active project filter
    function initFilterIndicator() {
        const wrap = document.querySelector('.filter-wrapper');
        if (!wrap) return;
        const pill = document.createElement('span');
        pill.className = 'filter-indicator';
        pill.setAttribute('aria-hidden', 'true');
        wrap.appendChild(pill);
        wrap.classList.add('has-indicator');

        const move = () => {
            const active = wrap.querySelector('.filter-btn.active');
            if (!active) return;
            pill.style.width = active.offsetWidth + 'px';
            pill.style.transform = 'translateX(' + active.offsetLeft + 'px)';
        };
        wrap.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => requestAnimationFrame(move));
        });
        window.addEventListener('resize', move, { passive: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(move);
        move();
    }

    function initThemeSpin() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            btn.classList.remove('spin');
            void btn.offsetWidth;
            btn.classList.add('spin');
        });
    }

    function initRipples() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                const r = btn.getBoundingClientRect();
                const size = Math.max(r.width, r.height);
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
                btn.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        });
    }
})();
