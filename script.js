let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const universalBackBtn = document.getElementById('universalBackBtn');

// Stack para manejar el estado de la vista (qué está abierto)
let viewStack = [];

// --- FUNCIONES DE NAVEGACIÓN ---

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function prevSlide() {
    goToSlide(currentSlide - 1);
}

function goToSlide(slideNumber) {
    if (slideNumber >= 0 && slideNumber < totalSlides) {
        currentSlide = slideNumber;
        updateSlide();
        updateNavigation();
        updateProgressBar();
        animateElements();
        saveProgress();
        // Limpiar el stack de vistas al cambiar de slide
        viewStack = [];
        updateUniversalBackBtn();
    }
}

// --- FUNCIONES DE ACTUALIZACIÓN DE UI ---

function updateSlide() {
    slides.forEach((slide, index) => {
        if (index === currentSlide) {
            slide.classList.add('active');
            // Resetear vistas interactivas al cambiar de slide
            slide.querySelectorAll('.interactive-summary-view, .nested-summary-view').forEach(v => v.classList.remove('hidden'));
            slide.querySelectorAll('.interactive-detail-view, .nested-detail-view').forEach(v => v.classList.add('hidden'));
        } else {
            slide.classList.remove('active');
        }
    });
}

function updateNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item, index) => {
        item.classList.toggle('active', index + 1 === currentSlide);
    });

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) {
        nextBtn.disabled = currentSlide === totalSlides - 1;
        nextBtn.textContent = currentSlide === totalSlides - 1 ? '🎉 Fin' : 'Siguiente →';
    }
}

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const contentSlides = totalSlides - 1;
        const currentProgress = currentSlide > 0 ? currentSlide : 0;
        const progress = (currentProgress / contentSlides) * 100;
        progressBar.style.width = progress + '%';
    }
}

function updateUniversalBackBtn() {
    if (viewStack.length > 0) {
        universalBackBtn.classList.remove('hidden');
    } else {
        universalBackBtn.classList.add('hidden');
    }
}

// --- LÓGICA INTERACTIVA Y DE INICIALIZACIÓN ---

function setupInteractiveSlides() {
    document.querySelectorAll('.summary-block').forEach(block => {
        block.addEventListener('click', (event) => {
            event.stopPropagation();
            const summaryView = block.closest('.interactive-summary-view, .nested-summary-view');
            const detailView = summaryView.nextElementSibling;
            const targetId = block.dataset.target;
            const targetDetail = detailView.querySelector('#' + targetId);

            summaryView.classList.add('hidden');
            detailView.classList.remove('hidden');

            // FIX: Manejar vistas con grupos de métodos (como en Slide 6)
            if (detailView.querySelectorAll('.method-group').length > 0) {
                // Ocultar todos los grupos de métodos primero
                detailView.querySelectorAll('.method-group').forEach(group => group.classList.add('hidden'));
                
                // Ocultar todo el contenido de detalles (buena práctica)
                detailView.querySelectorAll('.detail-content, .nested-detail-content').forEach(d => d.classList.add('hidden'));

                if (targetDetail) {
                    // Mostrar el contenido del detalle específico
                    targetDetail.classList.remove('hidden');
                    // Y mostrar su grupo de métodos padre
                    const parentGroup = targetDetail.closest('.method-group');
                    if (parentGroup) {
                        parentGroup.classList.remove('hidden');
                    }
                }
            } else {
                // Lógica original para otras diapositivas
                detailView.querySelectorAll('.detail-content, .nested-detail-content').forEach(d => d.classList.add('hidden'));
                if (targetDetail) {
                    targetDetail.classList.remove('hidden');
                }
            }

            // Añadir la vista actual al stack
            viewStack.push({ summary: summaryView, detail: detailView });
            updateUniversalBackBtn();
        });
    });
}

function handleUniversalBack() {
    if (viewStack.length > 0) {
        const lastView = viewStack.pop();
        lastView.detail.classList.add('hidden');
        lastView.summary.classList.remove('hidden');
        updateUniversalBackBtn();
    }
}

function setupEventListeners() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item, index) => {
        item.addEventListener('click', () => goToSlide(index + 1));
    });

    const indexItems = document.querySelectorAll('.index-list li');
    indexItems.forEach(item => {
        item.addEventListener('click', () => {
            const slideNum = parseInt(item.getAttribute('data-slide'), 10);
            goToSlide(slideNum);
        });
    });

    const logo = document.getElementById('logo-link');
    if (logo) {
        logo.addEventListener('click', () => goToSlide(0));
    }

    document.addEventListener('keydown', function(e) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
            return;
        }

        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
        } else if (e.key === 'Escape') { // Usar Escape para volver
            e.preventDefault();
            handleUniversalBack();
        } else if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });

    universalBackBtn.addEventListener('click', handleUniversalBack);
}

// --- FUNCIONES ADICIONALES ---

function animateElements() {
    const currentSlideElement = document.querySelector('.slide.active');
    if (!currentSlideElement) return;

    const elementsToAnimate = currentSlideElement.querySelectorAll('.summary-block, .index-list li');
    elementsToAnimate.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error al intentar activar pantalla completa: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// --- PERSISTENCIA DE PROGRESO ---

function saveProgress() {
    localStorage.setItem('ia-generativa-slide', currentSlide.toString());
}

function loadProgress() {
    const savedSlide = localStorage.getItem('ia-generativa-slide');
    if (savedSlide) {
        const slideNum = parseInt(savedSlide, 10);
        if (!isNaN(slideNum) && slideNum >= 0 && slideNum < totalSlides) {
            return slideNum;
        }
    }
    return 0;
}

// --- INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', function() {
    currentSlide = loadProgress();
    
    setupEventListeners();
    setupInteractiveSlides();

    updateSlide();
    updateNavigation();
    updateProgressBar();
    animateElements();
    
    console.log('🤖 IA Generativa - Presentación cargada correctamente');
    console.log('💡 Usa las flechas del teclado o los botones para navegar');
    console.log('🎯 Presiona F11 para pantalla completa');
});