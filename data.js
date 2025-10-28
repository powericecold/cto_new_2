const DataStore = (() => {
    const STORAGE_KEY = 'getdone_app_state';
    const FIRST_RUN_KEY = 'getdone_first_run';
    
    let state = {
        tasks: [],
        projects: [],
        tags: []
    };
    
    let listeners = [];
    
    function generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    function createTask(data) {
        return {
            id: data.id || generateId(),
            title: data.title || '',
            notes: data.notes || '',
            status: data.status || 'pending',
            dueDate: data.dueDate || null,
            projectId: data.projectId || null,
            tags: data.tags || [],
            createdAt: data.createdAt || new Date().toISOString(),
            isInbox: data.isInbox !== undefined ? data.isInbox : true,
            type: data.type || 'inbox'
        };
    }
    
    function createProject(data) {
        return {
            id: data.id || generateId(),
            name: data.name || '',
            createdAt: data.createdAt || new Date().toISOString()
        };
    }
    
    function isFirstRun() {
        return localStorage.getItem(FIRST_RUN_KEY) === null;
    }
    
    function markFirstRunComplete() {
        localStorage.setItem(FIRST_RUN_KEY, 'false');
    }
    
    function loadState() {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const parsed = JSON.parse(savedState);
                state = {
                    tasks: parsed.tasks || [],
                    projects: parsed.projects || [],
                    tags: parsed.tags || []
                };
                console.log('State loaded from localStorage:', state);
                return true;
            }
        } catch (error) {
            console.error('Error loading state from localStorage:', error);
        }
        return false;
    }
    
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            console.log('State saved to localStorage');
            return true;
        } catch (error) {
            console.error('Error saving state to localStorage:', error);
            return false;
        }
    }
    
    function seedSampleData() {
        console.log('Seeding sample data...');
        
        const sampleProjects = [
            { name: 'Work' },
            { name: 'Personal' },
            { name: 'Home Improvement' }
        ];
        
        state.projects = sampleProjects.map(p => createProject(p));
        
        const workProject = state.projects[0];
        const personalProject = state.projects[1];
        const homeProject = state.projects[2];
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const sampleTasks = [
            {
                title: 'Review project proposal',
                notes: 'Check the latest version and provide feedback',
                status: 'pending',
                dueDate: today.toISOString().split('T')[0],
                projectId: workProject.id,
                tags: ['urgent', 'review'],
                isInbox: false,
                type: 'project'
            },
            {
                title: 'Call dentist for appointment',
                notes: '',
                status: 'pending',
                dueDate: today.toISOString().split('T')[0],
                projectId: personalProject.id,
                tags: ['health'],
                isInbox: false,
                type: 'project'
            },
            {
                title: 'Prepare presentation slides',
                notes: 'Include Q3 metrics and future roadmap',
                status: 'pending',
                dueDate: tomorrow.toISOString().split('T')[0],
                projectId: workProject.id,
                tags: ['presentation'],
                isInbox: false,
                type: 'project'
            },
            {
                title: 'Buy groceries',
                notes: 'Milk, eggs, bread, vegetables',
                status: 'pending',
                dueDate: tomorrow.toISOString().split('T')[0],
                projectId: personalProject.id,
                tags: ['shopping'],
                isInbox: false,
                type: 'project'
            },
            {
                title: 'Team sync meeting',
                notes: 'Weekly standup at 10 AM',
                status: 'pending',
                dueDate: nextWeek.toISOString().split('T')[0],
                projectId: workProject.id,
                tags: ['meeting'],
                isInbox: false,
                type: 'project'
            },
            {
                title: 'Fix leaky faucet',
                notes: 'Kitchen sink needs attention',
                status: 'pending',
                dueDate: nextWeek.toISOString().split('T')[0],
                projectId: homeProject.id,
                tags: ['maintenance'],
                isInbox: false,
                type: 'project'
            },
            {
                title: 'Random inbox task',
                notes: 'This task needs to be organized',
                status: 'pending',
                dueDate: null,
                projectId: null,
                tags: [],
                isInbox: true,
                type: 'inbox'
            },
            {
                title: 'Learn a new programming language',
                notes: 'Maybe Rust or Go?',
                status: 'pending',
                dueDate: null,
                projectId: null,
                tags: ['learning'],
                isInbox: false,
                type: 'someday'
            },
            {
                title: 'Write a book',
                notes: 'Fiction or technical?',
                status: 'pending',
                dueDate: null,
                projectId: null,
                tags: ['creative'],
                isInbox: false,
                type: 'someday'
            }
        ];
        
        state.tasks = sampleTasks.map(t => createTask(t));
        
        state.tags = ['urgent', 'review', 'health', 'presentation', 'shopping', 'meeting', 'maintenance', 'learning', 'creative'];
        
        saveState();
        markFirstRunComplete();
        
        console.log('Sample data seeded successfully');
    }
    
    function notifyListeners(event) {
        listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in listener:', error);
            }
        });
    }
    
    function addTask(taskData) {
        const task = createTask(taskData);
        state.tasks.push(task);
        saveState();
        notifyListeners({ type: 'task_added', data: task });
        return task;
    }
    
    function updateTask(taskId, updates) {
        const taskIndex = state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            console.error('Task not found:', taskId);
            return null;
        }
        
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
        saveState();
        notifyListeners({ type: 'task_updated', data: state.tasks[taskIndex] });
        return state.tasks[taskIndex];
    }
    
    function deleteTask(taskId) {
        const taskIndex = state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            console.error('Task not found:', taskId);
            return false;
        }
        
        const deletedTask = state.tasks.splice(taskIndex, 1)[0];
        saveState();
        notifyListeners({ type: 'task_deleted', data: deletedTask });
        return true;
    }
    
    function getTask(taskId) {
        return state.tasks.find(t => t.id === taskId) || null;
    }
    
    function getAllTasks() {
        return [...state.tasks];
    }
    
    function addProject(projectData) {
        const project = createProject(projectData);
        state.projects.push(project);
        saveState();
        notifyListeners({ type: 'project_added', data: project });
        return project;
    }
    
    function updateProject(projectId, updates) {
        const projectIndex = state.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            console.error('Project not found:', projectId);
            return null;
        }
        
        state.projects[projectIndex] = { ...state.projects[projectIndex], ...updates };
        saveState();
        notifyListeners({ type: 'project_updated', data: state.projects[projectIndex] });
        return state.projects[projectIndex];
    }
    
    function deleteProject(projectId) {
        const projectIndex = state.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            console.error('Project not found:', projectId);
            return false;
        }
        
        const deletedProject = state.projects.splice(projectIndex, 1)[0];
        
        state.tasks.forEach(task => {
            if (task.projectId === projectId) {
                task.projectId = null;
                task.isInbox = true;
                task.type = 'inbox';
            }
        });
        
        saveState();
        notifyListeners({ type: 'project_deleted', data: deletedProject });
        return true;
    }
    
    function getProject(projectId) {
        return state.projects.find(p => p.id === projectId) || null;
    }
    
    function getAllProjects() {
        return [...state.projects];
    }
    
    function getInboxTasks() {
        return state.tasks.filter(t => t.isInbox && t.status === 'pending');
    }
    
    function getTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        return state.tasks.filter(t => {
            if (t.status !== 'pending') return false;
            if (!t.dueDate) return false;
            const taskDate = t.dueDate.split('T')[0];
            return taskDate === today;
        });
    }
    
    function getUpcomingTasks() {
        const today = new Date().toISOString().split('T')[0];
        return state.tasks.filter(t => {
            if (t.status !== 'pending') return false;
            if (!t.dueDate) return false;
            const taskDate = t.dueDate.split('T')[0];
            return taskDate > today;
        }).sort((a, b) => {
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }
    
    function getSomedayTasks() {
        return state.tasks.filter(t => t.type === 'someday' && t.status === 'pending');
    }
    
    function getTasksByProject(projectId) {
        return state.tasks.filter(t => t.projectId === projectId && t.status === 'pending');
    }
    
    function getTasksByTag(tag) {
        return state.tasks.filter(t => t.tags.includes(tag) && t.status === 'pending');
    }
    
    function getCompletedTasks() {
        return state.tasks.filter(t => t.status === 'completed');
    }
    
    function getAllTags() {
        return [...state.tags];
    }
    
    function addTag(tag) {
        if (!state.tags.includes(tag)) {
            state.tags.push(tag);
            saveState();
            notifyListeners({ type: 'tag_added', data: tag });
        }
    }
    
    function subscribe(listener) {
        if (typeof listener === 'function') {
            listeners.push(listener);
            return () => {
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            };
        }
    }
    
    function initialize() {
        if (isFirstRun()) {
            console.log('First run detected, seeding sample data...');
            seedSampleData();
        } else {
            console.log('Loading existing state...');
            loadState();
        }
    }
    
    return {
        initialize,
        addTask,
        updateTask,
        deleteTask,
        getTask,
        getAllTasks,
        addProject,
        updateProject,
        deleteProject,
        getProject,
        getAllProjects,
        getInboxTasks,
        getTodayTasks,
        getUpcomingTasks,
        getSomedayTasks,
        getTasksByProject,
        getTasksByTag,
        getCompletedTasks,
        getAllTags,
        addTag,
        subscribe,
        saveState,
        loadState,
        isFirstRun
    };
})();
