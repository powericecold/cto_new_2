console.log('GetDone app initialized');

let currentSection = 'inbox';
let selectedProjectId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    DataStore.initialize();
    
    initializeApp();
    
    runDataAPITests();
});

function initializeApp() {
    setupEventListeners();
    setupNavigation();
    updateMainContent('inbox');
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
            currentSection = section;
            selectedProjectId = null;
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
    
    if (section === 'projects') {
        renderProjectsView();
    } else {
        let tasks = [];
        
        switch(section) {
            case 'inbox':
                tasks = DataStore.getInboxTasks();
                break;
            case 'today':
                tasks = DataStore.getTodayTasks();
                break;
            case 'upcoming':
                tasks = DataStore.getUpcomingTasks();
                break;
            case 'someday':
                tasks = DataStore.getSomedayTasks();
                break;
            case 'calendar':
                tasks = [];
                break;
            default:
                tasks = [];
        }
        
        renderTaskList(title, tasks);
    }
}

function renderTaskList(title, tasks) {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    let html = `<h2>${title}</h2>`;
    
    if (tasks.length === 0) {
        html += renderEmptyState(title);
    } else {
        html += '<div class="task-list">';
        tasks.forEach(task => {
            html += renderTaskItem(task);
        });
        html += '</div>';
    }
    
    contentArea.innerHTML = html;
    attachTaskEventListeners();
}

function renderEmptyState(section) {
    const emptyMessages = {
        'Inbox': 'Your inbox is empty. Add tasks using the Quick Add button above.',
        'Today': 'No tasks due today. Enjoy your day!',
        'Upcoming': 'No upcoming tasks scheduled.',
        'Someday/Maybe': 'No someday tasks yet. Add tasks here for future consideration.',
        'Calendar': 'Calendar view coming soon.'
    };
    
    const message = emptyMessages[section] || 'No tasks found.';
    
    return `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <p class="empty-state-message">${message}</p>
        </div>
    `;
}

function renderTaskItem(task) {
    const dueDateDisplay = task.dueDate ? formatDate(task.dueDate) : '';
    const tagsHtml = task.tags.map(tag => `<span class="tag-chip">${tag}</span>`).join('');
    const projectName = task.projectId ? getProjectName(task.projectId) : '';
    
    return `
        <div class="task-item" data-task-id="${task.id}">
            <div class="task-checkbox-wrapper">
                <input type="checkbox" 
                       class="task-checkbox" 
                       ${task.status === 'completed' ? 'checked' : ''}
                       data-task-id="${task.id}">
            </div>
            <div class="task-content">
                <div class="task-title-row">
                    <span class="task-title ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.title)}</span>
                    <div class="task-actions">
                        <button class="task-action-btn edit-task-btn" data-task-id="${task.id}" title="Edit task">✏️</button>
                        <button class="task-action-btn delete-task-btn" data-task-id="${task.id}" title="Delete task">🗑️</button>
                    </div>
                </div>
                ${task.notes ? `<div class="task-notes">${escapeHtml(task.notes)}</div>` : ''}
                <div class="task-meta">
                    ${dueDateDisplay ? `<span class="task-due-date">📅 ${dueDateDisplay}</span>` : ''}
                    ${projectName ? `<span class="task-project">📁 ${escapeHtml(projectName)}</span>` : ''}
                    ${tagsHtml ? `<div class="task-tags">${tagsHtml}</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderProjectsView() {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    const projects = DataStore.getAllProjects();
    
    let html = '<h2>Projects</h2>';
    
    if (projects.length === 0) {
        html += renderEmptyState('Projects');
    } else {
        html += '<div class="projects-container">';
        html += '<div class="projects-list">';
        
        projects.forEach(project => {
            const taskCount = DataStore.getTasksByProject(project.id).length;
            const isSelected = selectedProjectId === project.id;
            
            html += `
                <div class="project-item ${isSelected ? 'selected' : ''}" data-project-id="${project.id}">
                    <div class="project-header">
                        <span class="project-icon">📁</span>
                        <span class="project-name">${escapeHtml(project.name)}</span>
                        <span class="project-count">${taskCount}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (selectedProjectId) {
            const project = DataStore.getProject(selectedProjectId);
            const tasks = DataStore.getTasksByProject(selectedProjectId);
            
            html += '<div class="project-tasks">';
            html += `<h3>${escapeHtml(project.name)} Tasks</h3>`;
            
            if (tasks.length === 0) {
                html += `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p class="empty-state-message">No tasks in this project yet.</p>
                    </div>
                `;
            } else {
                html += '<div class="task-list">';
                tasks.forEach(task => {
                    html += renderTaskItem(task);
                });
                html += '</div>';
            }
            
            html += '</div>';
        } else {
            html += `
                <div class="project-tasks project-tasks-placeholder">
                    <div class="empty-state">
                        <div class="empty-state-icon">👈</div>
                        <p class="empty-state-message">Select a project to view its tasks</p>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
    }
    
    contentArea.innerHTML = html;
    attachProjectEventListeners();
    attachTaskEventListeners();
}

function attachProjectEventListeners() {
    const projectItems = document.querySelectorAll('.project-item');
    
    projectItems.forEach(item => {
        item.addEventListener('click', () => {
            const projectId = item.getAttribute('data-project-id');
            selectedProjectId = projectId;
            renderProjectsView();
        });
    });
}

function attachTaskEventListeners() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleTaskToggle);
    });
    
    const deleteButtons = document.querySelectorAll('.delete-task-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', handleTaskDelete);
    });
    
    const editButtons = document.querySelectorAll('.edit-task-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', handleTaskEdit);
    });
}

function handleTaskToggle(e) {
    const taskId = e.target.getAttribute('data-task-id');
    const isCompleted = e.target.checked;
    
    DataStore.updateTask(taskId, {
        status: isCompleted ? 'completed' : 'pending'
    });
    
    updateMainContent(currentSection);
}

function handleTaskDelete(e) {
    const taskId = e.currentTarget.getAttribute('data-task-id');
    
    if (confirm('Are you sure you want to delete this task?')) {
        DataStore.deleteTask(taskId);
        updateMainContent(currentSection);
    }
}

function handleTaskEdit(e) {
    const taskId = e.currentTarget.getAttribute('data-task-id');
    const task = DataStore.getTask(taskId);
    
    if (task) {
        showEditTaskModal(task);
    }
}

function handleQuickAdd() {
    showQuickAddModal();
}

function showQuickAddModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    
    modalContainer.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>Quick Add Task</h3>
                <button class="modal-close-btn" onclick="closeModal()">✕</button>
            </div>
            <form class="modal-form" id="quick-add-form">
                <div class="form-group">
                    <label for="task-title">Task Title *</label>
                    <input type="text" 
                           id="task-title" 
                           name="title" 
                           placeholder="Enter task title..." 
                           required 
                           autofocus>
                </div>
                <div class="form-group">
                    <label for="task-notes">Notes (optional)</label>
                    <textarea id="task-notes" 
                              name="notes" 
                              placeholder="Add any additional notes..."
                              rows="3"></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add to Inbox</button>
                </div>
            </form>
        </div>
    `;
    
    modalContainer.classList.add('active');
    
    const form = document.getElementById('quick-add-form');
    if (form) {
        form.addEventListener('submit', handleQuickAddSubmit);
    }
}

function showEditTaskModal(task) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    
    const projects = DataStore.getAllProjects();
    const projectOptions = projects.map(p => 
        `<option value="${p.id}" ${task.projectId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join('');
    
    modalContainer.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>Edit Task</h3>
                <button class="modal-close-btn" onclick="closeModal()">✕</button>
            </div>
            <form class="modal-form" id="edit-task-form">
                <div class="form-group">
                    <label for="edit-task-title">Task Title *</label>
                    <input type="text" 
                           id="edit-task-title" 
                           name="title" 
                           value="${escapeHtml(task.title)}"
                           required 
                           autofocus>
                </div>
                <div class="form-group">
                    <label for="edit-task-notes">Notes</label>
                    <textarea id="edit-task-notes" 
                              name="notes" 
                              rows="3">${escapeHtml(task.notes)}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-task-due-date">Due Date</label>
                    <input type="date" 
                           id="edit-task-due-date" 
                           name="dueDate"
                           value="${task.dueDate || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-task-project">Project</label>
                    <select id="edit-task-project" name="projectId">
                        <option value="">No Project</option>
                        ${projectOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-task-tags">Tags (comma-separated)</label>
                    <input type="text" 
                           id="edit-task-tags" 
                           name="tags"
                           value="${task.tags.join(', ')}"
                           placeholder="work, urgent, meeting">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    modalContainer.classList.add('active');
    
    const form = document.getElementById('edit-task-form');
    if (form) {
        form.addEventListener('submit', (e) => handleEditTaskSubmit(e, task.id));
    }
}

function handleQuickAddSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const title = formData.get('title').trim();
    const notes = formData.get('notes').trim();
    
    if (!title) return;
    
    DataStore.addTask({
        title: title,
        notes: notes,
        isInbox: true,
        type: 'inbox'
    });
    
    closeModal();
    
    if (currentSection === 'inbox') {
        updateMainContent('inbox');
    }
}

function handleEditTaskSubmit(e, taskId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const title = formData.get('title').trim();
    const notes = formData.get('notes').trim();
    const dueDate = formData.get('dueDate') || null;
    const projectId = formData.get('projectId') || null;
    const tagsString = formData.get('tags').trim();
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
    
    if (!title) return;
    
    const updates = {
        title: title,
        notes: notes,
        dueDate: dueDate,
        projectId: projectId,
        tags: tags,
        isInbox: !projectId,
        type: projectId ? 'project' : 'inbox'
    };
    
    DataStore.updateTask(taskId, updates);
    
    closeModal();
    updateMainContent(currentSection);
}

function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.classList.remove('active');
        modalContainer.innerHTML = '';
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const tomorrowOnly = tomorrow.toISOString().split('T')[0];
    
    if (dateOnly === todayOnly) {
        return 'Today';
    } else if (dateOnly === tomorrowOnly) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

function getProjectName(projectId) {
    const project = DataStore.getProject(projectId);
    return project ? project.name : '';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
