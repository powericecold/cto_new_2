console.log('GetDone app initialized');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    DataStore.initialize();
    
    initializeApp();
    
    runDataAPITests();
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

function runDataAPITests() {
    console.log('\n=== Data API Tests ===\n');
    
    console.log('1. Get all tasks:', DataStore.getAllTasks().length, 'tasks');
    console.log('2. Get all projects:', DataStore.getAllProjects());
    console.log('3. Get inbox tasks:', DataStore.getInboxTasks());
    console.log('4. Get today tasks:', DataStore.getTodayTasks());
    console.log('5. Get upcoming tasks:', DataStore.getUpcomingTasks());
    console.log('6. Get someday tasks:', DataStore.getSomedayTasks());
    console.log('7. Get all tags:', DataStore.getAllTags());
    
    const projects = DataStore.getAllProjects();
    if (projects.length > 0) {
        console.log('8. Get tasks by project:', DataStore.getTasksByProject(projects[0].id));
    }
    
    const tags = DataStore.getAllTags();
    if (tags.length > 0) {
        console.log('9. Get tasks by tag:', DataStore.getTasksByTag(tags[0]));
    }
    
    console.log('\n=== Testing CRUD Operations ===\n');
    
    const newTask = DataStore.addTask({
        title: 'Test Task',
        notes: 'This is a test task',
        tags: ['test']
    });
    console.log('10. Created new task:', newTask);
    
    const updatedTask = DataStore.updateTask(newTask.id, {
        title: 'Updated Test Task'
    });
    console.log('11. Updated task:', updatedTask);
    
    const deleted = DataStore.deleteTask(newTask.id);
    console.log('12. Deleted task:', deleted);
    
    console.log('\n=== Data API Tests Complete ===\n');
}

DataStore.subscribe((event) => {
    console.log('Data event received:', event.type, event.data);
});
