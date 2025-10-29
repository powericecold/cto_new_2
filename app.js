console.log('GetDone app initialized');

let currentSection = 'inbox';
let selectedProjectId = null;
let activeTagFilter = null;
let editingTaskId = null;
let draggedTaskId = null;
let currentCalendarDate = new Date();
let touchStartX = 0;
let touchStartY = 0;
let draggedElement = null;

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
            activeTagFilter = null;
            updateMainContent(section);
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
    console.log('updateMainContent called with section:', section);
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) {
        console.error('contentArea not found');
        return;
    }
    
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
    } else if (section === 'calendar') {
        console.log('Rendering calendar view...');
        try {
            renderCalendarView();
            console.log('Calendar view rendered successfully');
        } catch (error) {
            console.error('Error rendering calendar:', error);
            contentArea.innerHTML = `
                <h2>Calendar</h2>
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p class="empty-state-message">Error loading calendar: ${error.message}</p>
                </div>
            `;
        }
        return;
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
        `<span class="tag-chip clickable" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)} <button class="remove-tag-btn" data-task-id="${task.id}" data-tag="${escapeHtml(tag)}">×</button></span>`
    ).join('');
    const projectName = task.projectId ? getProjectName(task.projectId) : '';
    
    const isInbox = task.isInbox && task.type === 'inbox';
    
    return `
        <div class="task-item" data-task-id="${task.id}" draggable="true">
            <div class="task-checkbox-wrapper">
                <input type="checkbox" 
                       class="task-checkbox" 
                       ${task.status === 'completed' ? 'checked' : ''}
                       data-task-id="${task.id}">
            </div>
            <div class="task-content">
                <div class="task-title-row">
                    <span class="task-title ${task.status === 'completed' ? 'completed' : ''}" 
                          contenteditable="true" 
                          data-task-id="${task.id}" 
                          data-field="title">${escapeHtml(task.title)}</span>
                    <div class="task-actions">
                        ${isInbox ? `<button class="task-action-btn process-task-btn" data-task-id="${task.id}" title="Process/Clarify">🔄</button>` : ''}
                        <button class="task-action-btn move-task-btn" data-task-id="${task.id}" title="Move to...">📋</button>
                        <button class="task-action-btn add-tag-btn" data-task-id="${task.id}" title="Add tag">🏷️</button>
                        <button class="task-action-btn edit-task-btn" data-task-id="${task.id}" title="Edit task">✏️</button>
                        <button class="task-action-btn delete-task-btn" data-task-id="${task.id}" title="Delete task">🗑️</button>
                    </div>
                </div>
                ${task.notes ? `<div class="task-notes" contenteditable="true" data-task-id="${task.id}" data-field="notes">${escapeHtml(task.notes)}</div>` : 
                  `<div class="task-notes task-notes-empty" contenteditable="true" data-task-id="${task.id}" data-field="notes" placeholder="Add notes..."></div>`}
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

function renderCalendarView() {
    console.log('renderCalendarView called');
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) {
        console.error('contentArea not found in renderCalendarView');
        return;
    }
    
    console.log('currentCalendarDate:', currentCalendarDate);
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    console.log('Rendering calendar for:', year, month);
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const allTasks = DataStore.getAllTasks();
    const tasksByDate = {};
    
    allTasks.forEach(task => {
        if (task.dueDate && task.status === 'pending') {
            const dateKey = task.dueDate.split('T')[0];
            if (!tasksByDate[dateKey]) {
                tasksByDate[dateKey] = [];
            }
            tasksByDate[dateKey].push(task);
        }
    });
    
    let html = `
        <div class="calendar-container">
            <div class="calendar-header">
                <h2>${monthNames[month]} ${year}</h2>
                <div class="calendar-nav">
                    <button class="calendar-nav-btn" onclick="navigateCalendar(-1)" title="Previous month">
                        ◀
                    </button>
                    <button class="calendar-nav-btn" onclick="navigateCalendarToday()" title="Today">
                        Today
                    </button>
                    <button class="calendar-nav-btn" onclick="navigateCalendar(1)" title="Next month">
                        ▶
                    </button>
                </div>
            </div>
            
            <div class="calendar-weekdays">
                <div class="calendar-weekday">Sun</div>
                <div class="calendar-weekday">Mon</div>
                <div class="calendar-weekday">Tue</div>
                <div class="calendar-weekday">Wed</div>
                <div class="calendar-weekday">Thu</div>
                <div class="calendar-weekday">Fri</div>
                <div class="calendar-weekday">Sat</div>
            </div>
            
            <div class="calendar-grid">
    `;
    
    for (let i = 0; i < startDayOfWeek; i++) {
        html += '<div class="calendar-day calendar-day-empty"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const tasksForDay = tasksByDate[dateStr] || [];
        
        html += `
            <div class="calendar-day ${isToday ? 'calendar-day-today' : ''}" 
                 data-date="${dateStr}">
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-day-tasks">
        `;
        
        tasksForDay.forEach(task => {
            const projectName = task.projectId ? getProjectName(task.projectId) : '';
            html += `
                <div class="calendar-task-chip" 
                     data-task-id="${task.id}" 
                     draggable="true"
                     title="${escapeHtml(task.title)}${projectName ? ' - ' + escapeHtml(projectName) : ''}">
                    <span class="calendar-task-title">${escapeHtml(task.title)}</span>
                    <button class="calendar-task-remove" 
                            data-task-id="${task.id}" 
                            title="Clear due date">×</button>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
            
            <div class="calendar-sidebar">
                <h3>Unscheduled Tasks</h3>
                <div class="calendar-unscheduled-tasks">
    `;
    
    const unscheduledTasks = allTasks.filter(task => 
        !task.dueDate && task.status === 'pending' && task.type !== 'someday'
    );
    
    if (unscheduledTasks.length === 0) {
        html += `
            <div class="empty-state-small">
                <p>All tasks are scheduled! 🎉</p>
            </div>
        `;
    } else {
        unscheduledTasks.forEach(task => {
            const projectName = task.projectId ? getProjectName(task.projectId) : '';
            html += `
                <div class="calendar-task-chip calendar-task-chip-unscheduled" 
                     data-task-id="${task.id}" 
                     draggable="true"
                     title="${escapeHtml(task.title)}${projectName ? ' - ' + escapeHtml(projectName) : ''}">
                    <span class="calendar-task-title">${escapeHtml(task.title)}</span>
                    ${projectName ? `<span class="calendar-task-project">${escapeHtml(projectName)}</span>` : ''}
                </div>
            `;
        });
    }
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
    attachCalendarEventListeners();
}

function navigateCalendar(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendarView();
}

function navigateCalendarToday() {
    currentCalendarDate = new Date();
    renderCalendarView();
}

function attachCalendarEventListeners() {
    const calendarDays = document.querySelectorAll('.calendar-day:not(.calendar-day-empty)');
    
    calendarDays.forEach(day => {
        day.addEventListener('dragover', handleCalendarDragOver);
        day.addEventListener('dragleave', handleCalendarDragLeave);
        day.addEventListener('drop', handleCalendarDrop);
        
        day.addEventListener('touchmove', handleTouchMove);
        day.addEventListener('touchend', handleTouchEnd);
    });
    
    const taskChips = document.querySelectorAll('.calendar-task-chip');
    taskChips.forEach(chip => {
        chip.addEventListener('dragstart', handleCalendarTaskDragStart);
        chip.addEventListener('dragend', handleCalendarTaskDragEnd);
        
        chip.addEventListener('touchstart', handleTouchStart);
    });
    
    const removeButtons = document.querySelectorAll('.calendar-task-remove');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', handleClearDueDate);
    });
    
    const unscheduledArea = document.querySelector('.calendar-unscheduled-tasks');
    if (unscheduledArea) {
        unscheduledArea.addEventListener('dragover', handleCalendarDragOver);
        unscheduledArea.addEventListener('dragleave', handleCalendarDragLeave);
        unscheduledArea.addEventListener('drop', handleUnscheduledDrop);
    }
}

function handleCalendarDragOver(e) {
    if (draggedTaskId) {
        e.preventDefault();
        e.currentTarget.classList.add('calendar-drop-target');
    }
}

function handleCalendarDragLeave(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    e.currentTarget.classList.remove('calendar-drop-target');
}

function handleCalendarDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('calendar-drop-target');
    
    if (!draggedTaskId) return;
    
    const dateStr = e.currentTarget.getAttribute('data-date');
    if (dateStr) {
        DataStore.updateTask(draggedTaskId, { dueDate: dateStr });
        renderCalendarView();
        updateOtherViews();
    }
}

function handleUnscheduledDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('calendar-drop-target');
    
    if (!draggedTaskId) return;
    
    DataStore.updateTask(draggedTaskId, { dueDate: null });
    renderCalendarView();
    updateOtherViews();
}

function handleCalendarTaskDragStart(e) {
    draggedTaskId = e.currentTarget.getAttribute('data-task-id');
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleCalendarTaskDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    draggedTaskId = null;
}

function handleClearDueDate(e) {
    e.stopPropagation();
    const taskId = e.currentTarget.getAttribute('data-task-id');
    
    if (taskId) {
        DataStore.updateTask(taskId, { dueDate: null });
        renderCalendarView();
        updateOtherViews();
    }
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    draggedTaskId = e.currentTarget.getAttribute('data-task-id');
    draggedElement = e.currentTarget;
    
    setTimeout(() => {
        if (draggedElement) {
            draggedElement.classList.add('dragging');
        }
    }, 100);
}

function handleTouchMove(e) {
    if (!draggedTaskId) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
    
    document.querySelectorAll('.calendar-drop-target').forEach(el => {
        el.classList.remove('calendar-drop-target');
    });
    
    let dropTarget = elementAtPoint;
    while (dropTarget && !dropTarget.classList.contains('calendar-day') && 
           !dropTarget.classList.contains('calendar-unscheduled-tasks')) {
        dropTarget = dropTarget.parentElement;
    }
    
    if (dropTarget && (dropTarget.classList.contains('calendar-day') || 
                       dropTarget.classList.contains('calendar-unscheduled-tasks'))) {
        dropTarget.classList.add('calendar-drop-target');
    }
}

function handleTouchEnd(e) {
    if (!draggedTaskId) return;
    
    const touch = e.changedTouches[0];
    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
    
    let dropTarget = elementAtPoint;
    while (dropTarget && !dropTarget.classList.contains('calendar-day') && 
           !dropTarget.classList.contains('calendar-unscheduled-tasks')) {
        dropTarget = dropTarget.parentElement;
    }
    
    if (dropTarget) {
        if (dropTarget.classList.contains('calendar-day')) {
            const dateStr = dropTarget.getAttribute('data-date');
            if (dateStr) {
                DataStore.updateTask(draggedTaskId, { dueDate: dateStr });
            }
        } else if (dropTarget.classList.contains('calendar-unscheduled-tasks')) {
            DataStore.updateTask(draggedTaskId, { dueDate: null });
        }
    }
    
    document.querySelectorAll('.calendar-drop-target').forEach(el => {
        el.classList.remove('calendar-drop-target');
    });
    
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    
    draggedTaskId = null;
    draggedElement = null;
    
    renderCalendarView();
    updateOtherViews();
}

function updateOtherViews() {
    if (currentSection !== 'calendar') {
        updateMainContent(currentSection);
    }
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
