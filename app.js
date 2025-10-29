console.log('GetDone app initialized');

let currentSection = 'inbox';
let selectedProjectId = null;
let activeTagFilter = null;
let editingTaskId = null;
let draggedTaskId = null;

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
        quickAddBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleQuickAdd();
            }
        });
    }
    
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
    }
    
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            toggleSidebar();
        });
        
        sidebarOverlay.addEventListener('click', () => {
            closeSidebar();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-container');
            if (modal && modal.classList.contains('active')) {
                closeModal();
            } else {
                closeSidebar();
            }
        }
        
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            handleQuickAdd();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (sidebar && sidebarOverlay && menuToggle) {
        const isOpen = sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active', isOpen);
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen);
    }
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (sidebar && sidebarOverlay && menuToggle) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
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
            activeTagFilter = null;
            updateMainContent(section);
            
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
        
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                link.click();
            }
        });
        
        link.addEventListener('dragover', (e) => {
            if (draggedTaskId) {
                e.preventDefault();
                link.classList.add('drag-over');
            }
        });
        
        link.addEventListener('dragleave', (e) => {
            link.classList.remove('drag-over');
        });
        
        link.addEventListener('drop', (e) => {
            e.preventDefault();
            link.classList.remove('drag-over');
            
            if (!draggedTaskId) return;
            
            const section = link.getAttribute('href').substring(1);
            handleDropOnSection(draggedTaskId, section);
        });
    });
    
    if (navLinks.length > 0) {
        navLinks[0].classList.add('active');
    }
}

function handleDropOnSection(taskId, section) {
    const updates = {};
    
    switch(section) {
        case 'inbox':
            updates.isInbox = true;
            updates.type = 'inbox';
            updates.projectId = null;
            break;
        case 'someday':
            updates.isInbox = false;
            updates.type = 'someday';
            updates.projectId = null;
            break;
        case 'today':
            const today = new Date().toISOString().split('T')[0];
            updates.dueDate = today;
            updates.isInbox = false;
            if (!updates.type) updates.type = 'project';
            break;
        case 'upcoming':
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            updates.dueDate = tomorrow.toISOString().split('T')[0];
            updates.isInbox = false;
            if (!updates.type) updates.type = 'project';
            break;
        default:
            return;
    }
    
    DataStore.updateTask(taskId, updates);
    updateMainContent(currentSection);
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
        
        if (activeTagFilter) {
            tasks = tasks.filter(task => task.tags.includes(activeTagFilter));
        }
        
        renderTaskList(title, tasks);
    }
}

function renderTaskList(title, tasks) {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    let html = `<h2>${title}</h2>`;
    
    if (activeTagFilter) {
        html += `
            <div class="filter-bar">
                <span class="filter-label">Filtered by tag:</span>
                <span class="filter-tag">${escapeHtml(activeTagFilter)}</span>
                <button class="clear-filter-btn" onclick="clearTagFilter()">✕ Clear Filter</button>
            </div>
        `;
    }
    
    if (tasks.length === 0) {
        html += renderEmptyState(title);
    } else {
        html += '<div class="task-list" data-section="' + currentSection + '">';
        tasks.forEach(task => {
            html += renderTaskItem(task);
        });
        html += '</div>';
    }
    
    contentArea.innerHTML = html;
    attachTaskEventListeners();
    setupDropZone();
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
    const tagsHtml = task.tags.map(tag => 
        `<span class="tag-chip clickable" data-tag="${escapeHtml(tag)}" role="listitem" tabindex="0" aria-label="Tag: ${escapeHtml(tag)}">${escapeHtml(tag)} <button class="remove-tag-btn" data-task-id="${task.id}" data-tag="${escapeHtml(tag)}" aria-label="Remove ${escapeHtml(tag)} tag">×</button></span>`
    ).join('');
    const projectName = task.projectId ? getProjectName(task.projectId) : '';
    
    const isInbox = task.isInbox && task.type === 'inbox';
    
    return `
        <div class="task-item" data-task-id="${task.id}" draggable="true" role="article" aria-label="Task: ${escapeHtml(task.title)}">
            <div class="task-checkbox-wrapper">
                <input type="checkbox" 
                       class="task-checkbox" 
                       ${task.status === 'completed' ? 'checked' : ''}
                       data-task-id="${task.id}"
                       aria-label="Mark task as ${task.status === 'completed' ? 'incomplete' : 'complete'}">
            </div>
            <div class="task-content">
                <div class="task-title-row">
                    <span class="task-title ${task.status === 'completed' ? 'completed' : ''}" 
                          contenteditable="true" 
                          data-task-id="${task.id}" 
                          data-field="title"
                          role="textbox"
                          aria-label="Task title">${escapeHtml(task.title)}</span>
                    <div class="task-actions" role="group" aria-label="Task actions">
                        ${isInbox ? `<button class="task-action-btn process-task-btn" data-task-id="${task.id}" title="Process/Clarify" aria-label="Process or clarify task"><span aria-hidden="true">🔄</span></button>` : ''}
                        <button class="task-action-btn move-task-btn" data-task-id="${task.id}" title="Move to..." aria-label="Move task to another section"><span aria-hidden="true">📋</span></button>
                        <button class="task-action-btn add-tag-btn" data-task-id="${task.id}" title="Add tag" aria-label="Add tag to task"><span aria-hidden="true">🏷️</span></button>
                        <button class="task-action-btn edit-task-btn" data-task-id="${task.id}" title="Edit task" aria-label="Edit task details"><span aria-hidden="true">✏️</span></button>
                        <button class="task-action-btn delete-task-btn" data-task-id="${task.id}" title="Delete task" aria-label="Delete task"><span aria-hidden="true">🗑️</span></button>
                    </div>
                </div>
                ${task.notes ? `<div class="task-notes" contenteditable="true" data-task-id="${task.id}" data-field="notes" role="textbox" aria-label="Task notes">${escapeHtml(task.notes)}</div>` : 
                  `<div class="task-notes task-notes-empty" contenteditable="true" data-task-id="${task.id}" data-field="notes" placeholder="Add notes..." role="textbox" aria-label="Task notes"></div>`}
                <div class="task-meta">
                    ${dueDateDisplay ? `<span class="task-due-date" aria-label="Due date: ${dueDateDisplay}"><span aria-hidden="true">📅</span> ${dueDateDisplay}</span>` : ''}
                    ${projectName ? `<span class="task-project" aria-label="Project: ${escapeHtml(projectName)}"><span aria-hidden="true">📁</span> ${escapeHtml(projectName)}</span>` : ''}
                    ${tagsHtml ? `<div class="task-tags" role="list" aria-label="Task tags">${tagsHtml}</div>` : ''}
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
    
    if (activeTagFilter) {
        html += `
            <div class="filter-bar">
                <span class="filter-label">Filtered by tag:</span>
                <span class="filter-tag">${escapeHtml(activeTagFilter)}</span>
                <button class="clear-filter-btn" onclick="clearTagFilter()">✕ Clear Filter</button>
            </div>
        `;
    }
    
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
            let tasks = DataStore.getTasksByProject(selectedProjectId);
            
            if (activeTagFilter) {
                tasks = tasks.filter(task => task.tags.includes(activeTagFilter));
            }
            
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
    setupDropZone();
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
    
    const moveButtons = document.querySelectorAll('.move-task-btn');
    moveButtons.forEach(btn => {
        btn.addEventListener('click', handleMoveTask);
    });
    
    const addTagButtons = document.querySelectorAll('.add-tag-btn');
    addTagButtons.forEach(btn => {
        btn.addEventListener('click', handleAddTag);
    });
    
    const processButtons = document.querySelectorAll('.process-task-btn');
    processButtons.forEach(btn => {
        btn.addEventListener('click', handleProcessTask);
    });
    
    const editableFields = document.querySelectorAll('[contenteditable="true"]');
    editableFields.forEach(field => {
        field.addEventListener('blur', handleInlineEdit);
        field.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                field.blur();
            }
        });
    });
    
    const tagChips = document.querySelectorAll('.tag-chip.clickable');
    tagChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-tag-btn')) {
                const tag = chip.getAttribute('data-tag');
                if (tag) {
                    setTagFilter(tag);
                }
            }
        });
    });
    
    const removeTagButtons = document.querySelectorAll('.remove-tag-btn');
    removeTagButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleRemoveTag(e);
        });
    });
    
    const taskItems = document.querySelectorAll('.task-item[draggable="true"]');
    taskItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
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
        <div class="modal" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
            <div class="modal-header">
                <h3 id="modal-title">Quick Add Task</h3>
                <button class="modal-close-btn" onclick="closeModal()" aria-label="Close modal">✕</button>
            </div>
            <form class="modal-form" id="quick-add-form">
                <div class="form-group">
                    <label for="task-title">Task Title *</label>
                    <input type="text" 
                           id="task-title" 
                           name="title" 
                           placeholder="Enter task title..." 
                           required 
                           autofocus
                           aria-required="true">
                </div>
                <div class="form-group">
                    <label for="task-notes">Notes (optional)</label>
                    <textarea id="task-notes" 
                              name="notes" 
                              placeholder="Add any additional notes..."
                              rows="3"
                              aria-label="Task notes"></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add to Inbox</button>
                </div>
            </form>
        </div>
    `;
    
    modalContainer.classList.add('active');
    modalContainer.setAttribute('aria-hidden', 'false');
    
    const form = document.getElementById('quick-add-form');
    if (form) {
        form.addEventListener('submit', handleQuickAddSubmit);
    }
    
    const firstInput = document.getElementById('task-title');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
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
        <div class="modal" role="dialog" aria-labelledby="modal-title">
            <div class="modal-header">
                <h3 id="modal-title">Edit Task</h3>
                <button class="modal-close-btn" onclick="closeModal()" aria-label="Close modal">✕</button>
            </div>
            <form class="modal-form" id="edit-task-form">
                <div class="form-group">
                    <label for="edit-task-title">Task Title *</label>
                    <input type="text" 
                           id="edit-task-title" 
                           name="title" 
                           value="${escapeHtml(task.title)}"
                           required 
                           autofocus
                           aria-required="true">
                </div>
                <div class="form-group">
                    <label for="edit-task-notes">Notes</label>
                    <textarea id="edit-task-notes" 
                              name="notes" 
                              rows="3"
                              aria-label="Task notes">${escapeHtml(task.notes)}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-task-due-date">Due Date</label>
                    <input type="date" 
                           id="edit-task-due-date" 
                           name="dueDate"
                           value="${task.dueDate || ''}"
                           aria-label="Due date">
                </div>
                <div class="form-group">
                    <label for="edit-task-project">Project</label>
                    <select id="edit-task-project" name="projectId" aria-label="Select project">
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
                           placeholder="work, urgent, meeting"
                           aria-label="Task tags">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    modalContainer.classList.add('active');
    modalContainer.setAttribute('aria-hidden', 'false');
    
    const form = document.getElementById('edit-task-form');
    if (form) {
        form.addEventListener('submit', (e) => handleEditTaskSubmit(e, task.id));
    }
    
    const firstInput = document.getElementById('edit-task-title');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
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

function handleInlineEdit(e) {
    const taskId = e.target.getAttribute('data-task-id');
    const field = e.target.getAttribute('data-field');
    const newValue = e.target.textContent.trim();
    
    if (!taskId || !field) return;
    
    const task = DataStore.getTask(taskId);
    if (!task) return;
    
    if (task[field] !== newValue) {
        const updates = {};
        updates[field] = newValue;
        DataStore.updateTask(taskId, updates);
    }
}

function handleMoveTask(e) {
    const taskId = e.currentTarget.getAttribute('data-task-id');
    const task = DataStore.getTask(taskId);
    
    if (!task) return;
    
    showMoveTaskMenu(task, e.currentTarget);
}

function showMoveTaskMenu(task, buttonElement) {
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const projects = DataStore.getAllProjects();
    const rect = buttonElement.getBoundingClientRect();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    
    let menuItems = `
        <div class="context-menu-item" data-action="move-inbox" data-task-id="${task.id}">
            📥 Move to Inbox
        </div>
        <div class="context-menu-item" data-action="move-someday" data-task-id="${task.id}">
            💭 Move to Someday/Maybe
        </div>
        <div class="context-menu-divider"></div>
    `;
    
    if (projects.length > 0) {
        menuItems += '<div class="context-menu-label">Move to Project:</div>';
        projects.forEach(project => {
            menuItems += `
                <div class="context-menu-item" data-action="move-project" data-task-id="${task.id}" data-project-id="${project.id}">
                    📁 ${escapeHtml(project.name)}
                </div>
            `;
        });
    }
    
    menu.innerHTML = menuItems;
    document.body.appendChild(menu);
    
    menu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', handleMoveTaskAction);
    });
    
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
}

function handleMoveTaskAction(e) {
    const action = e.currentTarget.getAttribute('data-action');
    const taskId = e.currentTarget.getAttribute('data-task-id');
    const projectId = e.currentTarget.getAttribute('data-project-id');
    
    const updates = {};
    
    if (action === 'move-inbox') {
        updates.isInbox = true;
        updates.type = 'inbox';
        updates.projectId = null;
    } else if (action === 'move-someday') {
        updates.isInbox = false;
        updates.type = 'someday';
        updates.projectId = null;
    } else if (action === 'move-project' && projectId) {
        updates.isInbox = false;
        updates.type = 'project';
        updates.projectId = projectId;
    }
    
    DataStore.updateTask(taskId, updates);
    
    const menu = document.querySelector('.context-menu');
    if (menu) menu.remove();
    
    updateMainContent(currentSection);
}

function handleAddTag(e) {
    const taskId = e.currentTarget.getAttribute('data-task-id');
    const task = DataStore.getTask(taskId);
    
    if (!task) return;
    
    const tagName = prompt('Enter tag name:');
    if (tagName && tagName.trim()) {
        const trimmedTag = tagName.trim().toLowerCase();
        if (!task.tags.includes(trimmedTag)) {
            const updatedTags = [...task.tags, trimmedTag];
            DataStore.updateTask(taskId, { tags: updatedTags });
            DataStore.addTag(trimmedTag);
            updateMainContent(currentSection);
        }
    }
}

function handleRemoveTag(e) {
    const taskId = e.currentTarget.getAttribute('data-task-id');
    const tag = e.currentTarget.getAttribute('data-tag');
    
    const task = DataStore.getTask(taskId);
    if (!task) return;
    
    const updatedTags = task.tags.filter(t => t !== tag);
    DataStore.updateTask(taskId, { tags: updatedTags });
    updateMainContent(currentSection);
}

function handleProcessTask(e) {
    const taskId = e.currentTarget.getAttribute('data-task-id');
    const task = DataStore.getTask(taskId);
    
    if (!task) return;
    
    showProcessTaskModal(task);
}

function showProcessTaskModal(task) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    
    const projects = DataStore.getAllProjects();
    const projectOptions = projects.map(p => 
        `<option value="${p.id}">${escapeHtml(p.name)}</option>`
    ).join('');
    
    modalContainer.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>Process Task</h3>
                <button class="modal-close-btn" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-form">
                <p class="clarify-text">Convert this inbox item to an actionable task:</p>
                <div class="form-group">
                    <label>Current Title:</label>
                    <p><strong>${escapeHtml(task.title)}</strong></p>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="convertToProject('${task.id}')">
                        📁 Assign to Project
                    </button>
                    <button class="btn btn-secondary" onclick="convertToSomeday('${task.id}')">
                        💭 Move to Someday
                    </button>
                    <button class="btn btn-primary" onclick="convertToAction('${task.id}')">
                        ✅ Make Next Action
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modalContainer.classList.add('active');
}

function setTagFilter(tag) {
    activeTagFilter = tag;
    updateMainContent(currentSection);
}

function clearTagFilter() {
    activeTagFilter = null;
    updateMainContent(currentSection);
}

function convertToProject(taskId) {
    const task = DataStore.getTask(taskId);
    if (!task) return;
    
    const projects = DataStore.getAllProjects();
    if (projects.length === 0) {
        alert('No projects available. Please create a project first.');
        return;
    }
    
    const projectId = projects[0].id;
    DataStore.updateTask(taskId, {
        isInbox: false,
        type: 'project',
        projectId: projectId
    });
    
    closeModal();
    updateMainContent(currentSection);
}

function convertToSomeday(taskId) {
    DataStore.updateTask(taskId, {
        isInbox: false,
        type: 'someday',
        projectId: null
    });
    
    closeModal();
    updateMainContent(currentSection);
}

function convertToAction(taskId) {
    const task = DataStore.getTask(taskId);
    if (!task) return;
    
    const today = new Date().toISOString().split('T')[0];
    DataStore.updateTask(taskId, {
        isInbox: false,
        type: 'project',
        dueDate: today
    });
    
    closeModal();
    updateMainContent(currentSection);
}

function handleDragStart(e) {
    draggedTaskId = e.currentTarget.getAttribute('data-task-id');
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    draggedTaskId = null;
}

function setupDropZone() {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;
    
    taskList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    taskList.addEventListener('drop', (e) => {
        e.preventDefault();
    });
}

function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.classList.remove('active');
        modalContainer.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            modalContainer.innerHTML = '';
        }, 300);
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
