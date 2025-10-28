console.log('GetDone app initialized');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupNavigation();
}

function setupEventListeners() {
    const quickAddBtn = document.querySelector('.quick-add-btn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', handleQuickAdd);
    }
    
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const section = link.getAttribute('href').substring(1);
            updateMainContent(section);
        });
    });
    
    if (navLinks.length > 0) {
        navLinks[0].classList.add('active');
    }
}

function updateMainContent(section) {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    const sectionTitles = {
        'inbox': 'Inbox',
        'today': 'Today',
        'upcoming': 'Upcoming',
        'projects': 'Projects',
        'someday': 'Someday/Maybe',
        'calendar': 'Calendar'
    };
    
    const title = sectionTitles[section] || 'GetDone';
    
    contentArea.innerHTML = `
        <h2>${title}</h2>
        <p>Your ${section} tasks will appear here.</p>
    `;
}

function handleQuickAdd() {
    console.log('Quick add button clicked');
}

function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.classList.remove('active');
    }
}
