/* sleever.com.pl – interakcje layoutu (Tailwind w index.html) */
(function () {
      'use strict';

      var yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

      var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Hero – wejście ze staggerem + parallax wizualu
      var heroSection = document.getElementById('hero');
      var heroVisual = document.getElementById('hero-visual');
      var heroVisualMedia = heroSection ? heroSection.querySelector('.hero-visual-media') : null;
      if (heroSection) {
        if (prefersReduced) {
          heroSection.classList.add('hero-ready');
        } else {
          requestAnimationFrame(function () {
            heroSection.classList.add('hero-ready');
          });
        }
      }
      var heroGridBg = document.getElementById('hero-grid-bg');
      var heroGlowBg = document.getElementById('hero-glow-bg');
      var heroMouseX = 0, heroMouseY = 0;
      var heroParallaxTicking = false;
      function updateHeroParallax() {
        heroParallaxTicking = false;
        if (!heroSection || prefersReduced) return;
        var rect = heroSection.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var progress = Math.min(1, Math.max(0, 1 - rect.top / window.innerHeight));
        var scrollY = progress * 10;
        var mx = heroMouseX * 14;
        var my = heroMouseY * 10;
        if (heroVisualMedia) {
          heroVisualMedia.style.transform = 'translate(' + (mx * 0.35) + 'px, ' + (scrollY + my * 0.25) + 'px)';
        }
        if (heroGridBg) {
          heroGridBg.style.transform = 'translate(' + mx + 'px, ' + (scrollY * 0.6 + my) + 'px)';
        }
        if (heroGlowBg) {
          heroGlowBg.style.transform = 'translate(' + (mx * 1.2) + 'px, ' + (scrollY * 0.8 + my * 0.8) + 'px)';
        }
      }
      function scheduleHeroParallax() {
        if (!heroParallaxTicking && !prefersReduced) {
          heroParallaxTicking = true;
          requestAnimationFrame(updateHeroParallax);
        }
      }
      if (heroSection && !prefersReduced) {
        heroSection.addEventListener('mousemove', function (e) {
          var r = heroSection.getBoundingClientRect();
          heroMouseX = (e.clientX - r.left) / r.width - 0.5;
          heroMouseY = (e.clientY - r.top) / r.height - 0.5;
          scheduleHeroParallax();
        }, { passive: true });
      }
      window.addEventListener('scroll', scheduleHeroParallax, { passive: true });

      // TODO: opcjonalne wideo hero – assets/hero-wykladarka.mp4 (podepnij w #hero-machine-video)

      // Sticky header, pasek postępu, przycisk „do góry” – jeden handler scrolla
      var header = document.getElementById('site-header');
      var progress = document.getElementById('scroll-progress');
      var toTop = document.getElementById('to-top');
      var ticking = false;
      function onScroll() {
        var y = window.scrollY || window.pageYOffset;
        if (header) {
          header.classList.toggle('header-scrolled', y > 8);
          header.classList.toggle('header-compact', y > 48);
        }
        if (progress) {
          var docH = document.documentElement.scrollHeight - window.innerHeight;
          var pct = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
          progress.style.width = pct + '%';
          progress.setAttribute('aria-valuenow', String(Math.round(pct)));
        }
        if (toTop) toTop.classList.toggle('is-visible', y > 600);
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
      }, { passive: true });
      onScroll();

      if (toTop) {
        toTop.addEventListener('click', function () {
          var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        });
      }

      // Scrollspy – podświetlanie aktywnej sekcji w nawigacji
      var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link, .mobile-nav-link'));
      var sections = navLinks
        .map(function (l) { return document.querySelector(l.getAttribute('href')); })
        .filter(function (s, i, arr) { return s && arr.indexOf(s) === i; });
      if ('IntersectionObserver' in window && sections.length) {
        var spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var id = '#' + entry.target.id;
              navLinks.forEach(function (l) {
                l.classList.toggle('is-active', l.getAttribute('href') === id);
              });
            }
          });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
        sections.forEach(function (s) { spy.observe(s); });
      }

      // Menu mobilne
      var menuToggle = document.getElementById('menu-toggle');
      var mobileMenu = document.getElementById('mobile-menu');
      if (menuToggle && mobileMenu) {
        function setMenu(open) {
          mobileMenu.classList.toggle('is-open', open);
          menuToggle.setAttribute('aria-expanded', String(open));
          menuToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
        }
        menuToggle.addEventListener('click', function () {
          setMenu(!mobileMenu.classList.contains('is-open'));
        });
        document.querySelectorAll('.mobile-nav-link').forEach(function (link) {
          link.addEventListener('click', function () { setMenu(false); });
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) { setMenu(false); menuToggle.focus(); }
        });
      }

      // Smooth scroll – offset pod fixed header
      document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
          var id = this.getAttribute('href');
          if (!id || id === '#') return;
          var target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          var offset = header ? header.offsetHeight + 12 : 12;
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
          history.pushState(null, '', id);
        });
      });

      // IntersectionObserver – animacje on-scroll (sekcje poza hero)
      if (!prefersReduced) {
        var revealObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        document.querySelectorAll('.reveal, .reveal-grid').forEach(function (el) { revealObserver.observe(el); });
      } else {
        document.querySelectorAll('.reveal, .reveal-grid').forEach(function (el) { el.classList.add('is-visible'); });
      }

      // Kroki procesu – zsynchronizowane z cyklem animacji (5,6 s, 3 kroki co ~1,87 s)
      var processStepsList = document.getElementById('process-steps');
      var jakDzialaSection = document.getElementById('jak-dziala');
      var processDiagram = document.getElementById('process-diagram');
      var processCycleSync = processDiagram ? processDiagram.querySelector('.proc-cycle-sync') : null;
      if (processDiagram && prefersReduced) {
        processDiagram.setAttribute('data-reduced', 'true');
      }
      function setProcessDiagramRunning(running) {
        if (!processDiagram || prefersReduced) return;
        processDiagram.classList.toggle('is-running', running);
      }
      if (processStepsList && jakDzialaSection) {
        var processSteps = Array.prototype.slice.call(processStepsList.querySelectorAll('.process-step'));
        var activeStepIndex = 0;
        var stepSyncTimers = [];
        var stepCycleRunning = false;
        var sectionInView = false;
        var PROC_CYCLE_MS = 5600;

        function highlightProcessStep(idx) {
          processSteps.forEach(function (step, i) {
            step.classList.toggle('is-active', i === idx);
          });
        }

        function clearStepSyncTimers() {
          stepSyncTimers.forEach(function (id) { window.clearTimeout(id); });
          stepSyncTimers = [];
        }

        function syncProcessStepsToAnimation() {
          if (!stepCycleRunning || prefersReduced) return;
          clearStepSyncTimers();
          activeStepIndex = 0;
          highlightProcessStep(0);
          var stepMs = Math.round(PROC_CYCLE_MS / processSteps.length);
          for (var s = 1; s < processSteps.length; s++) {
            (function (stepIndex) {
              stepSyncTimers.push(window.setTimeout(function () {
                if (!stepCycleRunning) return;
                activeStepIndex = stepIndex;
                highlightProcessStep(stepIndex);
              }, stepMs * stepIndex));
            })(s);
          }
        }

        function startProcessStepCycle() {
          if (prefersReduced || stepCycleRunning || !sectionInView) return;
          stepCycleRunning = true;
          syncProcessStepsToAnimation();
        }

        function stopProcessStepCycle() {
          stepCycleRunning = false;
          clearStepSyncTimers();
        }

        if (prefersReduced) {
          highlightProcessStep(0);
        } else {
          processStepsList.classList.add('is-paused');

          if (processCycleSync) {
            processCycleSync.addEventListener('animationstart', syncProcessStepsToAnimation);
            processCycleSync.addEventListener('animationiteration', syncProcessStepsToAnimation);
          }

          processStepsList.addEventListener('mouseenter', function () {
            stopProcessStepCycle();
          });
          processStepsList.addEventListener('mouseleave', function () {
            startProcessStepCycle();
          });

          processSteps.forEach(function (step, i) {
            step.addEventListener('click', function () {
              stopProcessStepCycle();
              activeStepIndex = i;
              highlightProcessStep(activeStepIndex);
            });
          });

          if ('IntersectionObserver' in window) {
            var processStepObs = new IntersectionObserver(function (entries) {
              entries.forEach(function (entry) {
                sectionInView = entry.isIntersecting;
                if (sectionInView) {
                  setProcessDiagramRunning(true);
                  startProcessStepCycle();
                } else {
                  stopProcessStepCycle();
                  setProcessDiagramRunning(false);
                }
              });
            }, { threshold: 0.3 });
            processStepObs.observe(jakDzialaSection);
          } else {
            sectionInView = true;
            setProcessDiagramRunning(true);
            startProcessStepCycle();
          }
        }
      }

      // Tabela porównania – stagger wierszy + podświetlenie kolumny MTM
      var compareSection = document.getElementById('porownanie');
      var compareTarget = compareSection && compareSection.querySelector('.compare-table-wrap');
      if (compareSection && 'IntersectionObserver' in window) {
        var compareObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            compareSection.classList.add('compare-ready');
            if (!prefersReduced) {
              window.setTimeout(function () {
                compareSection.classList.add('compare-highlight');
              }, 520);
            }
            compareObs.unobserve(entry.target);
          });
        }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
        compareObs.observe(compareTarget || compareSection);
      } else if (compareSection) {
        compareSection.classList.add('compare-ready');
      }
      if (prefersReduced && compareSection) {
        compareSection.classList.add('compare-ready');
        compareSection.classList.remove('compare-highlight');
      }

      // Branże — scroll-reveal kart
      var industryGrid = document.getElementById('industry-grid');
      if (industryGrid && 'IntersectionObserver' in window && !prefersReduced) {
        var industryObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            industryGrid.classList.add('is-ready');
            industryObs.unobserve(entry.target);
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
        industryObs.observe(industryGrid);
      } else if (industryGrid) {
        industryGrid.classList.add('is-ready');
      }

      // Liczniki count-up w pasku statystyk
      var counters = Array.prototype.slice.call(document.querySelectorAll('.counter'));
      function renderCounter(el, value) {
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        el.textContent = prefix + value.toLocaleString('pl-PL') + suffix;
      }
      function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-to'), 10) || 0;
        var duration = 1500, start = null;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min(1, (ts - start) / duration);
          var eased = 1 - Math.pow(1 - p, 3);
          renderCounter(el, Math.round(eased * target));
          if (p < 1) { window.requestAnimationFrame(step); } else {
            renderCounter(el, target);
            if (!prefersReduced) {
              el.classList.add('is-done');
              window.setTimeout(function () { el.classList.remove('is-done'); }, 600);
            }
          }
        }
        window.requestAnimationFrame(step);
      }
      if (counters.length) {
        if (prefersReduced || !('IntersectionObserver' in window)) {
          counters.forEach(function (el) { renderCounter(el, parseInt(el.getAttribute('data-to'), 10) || 0); });
        } else {
          var counterObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) { animateCounter(entry.target); counterObs.unobserve(entry.target); }
            });
          }, { threshold: 0.4 });
          counters.forEach(function (el) { counterObs.observe(el); });
        }
      }

      // Scroll do kontaktu z prefill pola „produkt”
      var produktField = document.getElementById('produkt');
      function scrollToKontaktWithPrefill(note) {
        if (produktField && note) {
          var existing = produktField.value.trim();
          produktField.value = existing ? existing + '\n\n' + note : note;
        }
        var kontakt = document.getElementById('kontakt');
        if (!kontakt) return;
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var offset = (header ? header.offsetHeight : 0) + 12;
        var top = kontakt.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
        history.pushState(null, '', '#kontakt');
        window.setTimeout(function () { if (produktField) produktField.focus(); }, reduce ? 0 : 450);
      }
      document.querySelectorAll('[data-prefill-kontakt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          scrollToKontaktWithPrefill(btn.getAttribute('data-prefill-kontakt') || '');
        });
      });

      // Schemat linii – desktop (tabs) + mobile (akordeon)
      var lineTabs = document.querySelectorAll('.line-step-btn[data-line-step]');
      var lineContents = document.querySelectorAll('.line-panel-content[data-line-content]');
      function activateLineStep(idx) {
        lineTabs.forEach(function (tab) {
          var on = parseInt(tab.getAttribute('data-line-step'), 10) === idx;
          tab.setAttribute('aria-selected', String(on));
        });
        lineContents.forEach(function (panel) {
          var on = parseInt(panel.getAttribute('data-line-content'), 10) === idx;
          panel.classList.toggle('hidden', !on);
        });
        var activeTab = document.getElementById('line-tab-' + idx);
        var linePanel = document.getElementById('line-panel');
        if (activeTab && linePanel) linePanel.setAttribute('aria-labelledby', activeTab.id);
      }
      lineTabs.forEach(function (tab) {
        tab.addEventListener('click', function () { activateLineStep(parseInt(tab.getAttribute('data-line-step'), 10)); });
        tab.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateLineStep(parseInt(tab.getAttribute('data-line-step'), 10)); }
        });
      });

      // Sposoby sleevowania – akordeon typów
      var sleeveShowcase = document.querySelector('.sleeve-showcase');
      var sleeveMarkers = document.querySelectorAll('.sleeve-showcase__markers li');
      function setSleeveHighlight(idx) {
        if (!sleeveShowcase) return;
        if (idx < 0) {
          sleeveShowcase.removeAttribute('data-active');
        } else {
          sleeveShowcase.setAttribute('data-active', String(idx));
        }
        sleeveMarkers.forEach(function (marker, i) {
          marker.classList.toggle('is-active', i === idx);
        });
      }
      function closeSleeveAccordionItems() {
        document.querySelectorAll('.sleeve-acc-item').forEach(function (item) {
          item.classList.remove('is-open');
        });
        document.querySelectorAll('.sleeve-acc-trigger').forEach(function (btn) {
          btn.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.sleeve-acc-panel').forEach(function (panel) {
          panel.classList.remove('is-open');
          panel.hidden = true;
        });
        setSleeveHighlight(-1);
      }
      function toggleSleeveAccordion(btn) {
        var panelId = btn.getAttribute('aria-controls');
        var panel = document.getElementById(panelId);
        var item = btn.closest('.sleeve-acc-item');
        var open = btn.getAttribute('aria-expanded') === 'true';
        closeSleeveAccordionItems();
        if (!open && panel && item) {
          btn.setAttribute('aria-expanded', 'true');
          item.classList.add('is-open');
          panel.classList.add('is-open');
          panel.hidden = false;
          var idx = parseInt(item.getAttribute('data-sleeve-type'), 10);
          if (!isNaN(idx)) setSleeveHighlight(idx);
        }
      }
      document.querySelectorAll('.sleeve-acc-trigger').forEach(function (btn) {
        btn.addEventListener('click', function () { toggleSleeveAccordion(btn); });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSleeveAccordion(btn); }
        });
      });

      document.querySelectorAll('.line-accordion-trigger').forEach(function (btn) {
        btn.addEventListener('click', function () { toggleLineAccordion(btn); });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLineAccordion(btn); }
        });
      });
      function toggleLineAccordion(btn) {
        var panelId = btn.getAttribute('aria-controls');
        var panel = document.getElementById(panelId);
        var open = btn.getAttribute('aria-expanded') === 'true';
        document.querySelectorAll('.line-accordion-trigger').forEach(function (b) {
          b.setAttribute('aria-expanded', 'false');
          var p = document.getElementById(b.getAttribute('aria-controls'));
          if (p) { p.classList.remove('is-open'); p.hidden = true; }
        });
        if (!open && panel) {
          btn.setAttribute('aria-expanded', 'true');
          panel.classList.add('is-open');
          panel.hidden = false;
        }
      }

      // Formularz – walidacja inline + wysyłka do mail.php
      var form = document.getElementById('lead-form');
      var status = document.getElementById('form-status');
      var submitBtn = document.getElementById('submit-btn');
      var requiredFields = ['imie', 'firma', 'email', 'produkt'];

      function errorFor(id) { return document.getElementById('err-' + id); }
      function validateField(field) {
        var err = errorFor(field.id);
        var valid = field.checkValidity();
        if (err) err.classList.toggle('is-shown', !valid);
        field.setAttribute('aria-invalid', String(!valid));
        return valid;
      }
      function clearField(field) {
        if (field.getAttribute('aria-invalid') === 'true' && field.checkValidity()) {
          field.setAttribute('aria-invalid', 'false');
          var err = errorFor(field.id);
          if (err) err.classList.remove('is-shown');
        }
      }
      requiredFields.forEach(function (id) {
        var field = document.getElementById(id);
        if (!field) return;
        field.addEventListener('blur', function () { validateField(field); });
        field.addEventListener('input', function () { clearField(field); });
      });

      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstInvalid = null;
        requiredFields.forEach(function (id) {
          var field = document.getElementById(id);
          if (field && !validateField(field) && !firstInvalid) firstInvalid = field;
        });
        if (firstInvalid) {
          firstInvalid.focus();
          status.textContent = 'Uzupełnij zaznaczone pola, aby wysłać zapytanie.';
          status.className = 'text-sm font-medium text-red-600 mt-2 block';
          status.classList.remove('hidden');
          return;
        }

        // Stan ładowania
        var spinner = submitBtn.querySelector('.btn-spinner');
        var label = submitBtn.querySelector('.btn-label');
        var arrow = submitBtn.querySelector('.btn-arrow');
        submitBtn.disabled = true;
        spinner.classList.remove('hidden');
        arrow.classList.add('hidden');
        label.textContent = 'Wysyłanie…';
        status.classList.add('hidden');

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        })
          .then(function (res) {
            return res.text().then(function (text) {
              var data = null;
              try { data = JSON.parse(text); } catch (e) { data = null; }
              return { ok: res.ok, status: res.status, data: data };
            });
          })
          .then(function (result) {
            spinner.classList.add('hidden');
            arrow.classList.remove('hidden');
            label.textContent = 'Wyślij wiadomość';
            submitBtn.disabled = false;
            if (result.data && result.data.ok) {
              status.textContent = result.data.message;
              status.className = 'text-sm font-medium text-green-600 mt-2 block';
              status.classList.remove('hidden');
              form.reset();
              return;
            }
            if (result.data && result.data.message) {
              status.textContent = result.data.message;
            } else if (result.status === 404) {
              status.textContent = 'Brak pliku mail.php na serwerze. Wgraj mail.php obok index.html.';
            } else {
              status.textContent = 'Błąd serwera (HTTP ' + result.status + '). Sprawdź, czy hosting obsługuje PHP.';
            }
            status.className = 'text-sm font-medium text-red-600 mt-2 block';
            status.classList.remove('hidden');
          })
          .catch(function () {
            spinner.classList.add('hidden');
            arrow.classList.remove('hidden');
            label.textContent = 'Wyślij wiadomość';
            submitBtn.disabled = false;
            status.textContent = 'Brak połączenia z serwerem. Formularz wymaga hostingu z PHP (mail.php).';
            status.className = 'text-sm font-medium text-red-600 mt-2 block';
            status.classList.remove('hidden');
          });
      });
    })();
