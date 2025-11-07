# Data Layer Documentation

## Overview

The data layer provides a complete LocalStorage-backed data management system for the GetDone task management application. It includes data models, CRUD operations, query helpers, and an event system for UI notifications.

## Data Models

### Task Model

```javascript
{
    id: string,              // Unique identifier (auto-generated)
    title: string,           // Task title
    notes: string,           // Task notes/description
    status: string,          // 'pending' or 'completed'
    dueDate: string | null,  // ISO date string or null
    projectId: string | null,// Reference to project ID or null
    tags: string[],          // Array of tag strings
    createdAt: string,       // ISO date string (auto-generated)
    isInbox: boolean,        // Flag for inbox tasks
    type: string            // 'inbox', 'project', or 'someday'
}
```

### Project Model

```javascript
{
    id: string,              // Unique identifier (auto-generated)
    name: string,            // Project name
    createdAt: string        // ISO date string (auto-generated)
}
```

### Tags

Tags are stored as simple strings in an array.

## API Methods

### Initialization

#### `DataStore.initialize()`
Initializes the data store. On first run, seeds sample data. On subsequent runs, loads existing data from localStorage.

```javascript
DataStore.initialize();
```

### Task CRUD Operations

#### `DataStore.addTask(taskData)`
Creates a new task.

```javascript
const task = DataStore.addTask({
    title: 'Complete project proposal',
    notes: 'Include budget and timeline',
    dueDate: '2024-12-31',
    tags: ['work', 'urgent']
});
```

#### `DataStore.updateTask(taskId, updates)`
Updates an existing task.

```javascript
const updated = DataStore.updateTask(taskId, {
    status: 'completed',
    notes: 'Finished ahead of schedule'
});
```

#### `DataStore.deleteTask(taskId)`
Deletes a task. Returns `true` on success, `false` if task not found.

```javascript
const deleted = DataStore.deleteTask(taskId);
```

#### `DataStore.getTask(taskId)`
Retrieves a single task by ID. Returns task object or `null`.

```javascript
const task = DataStore.getTask(taskId);
```

#### `DataStore.getAllTasks()`
Returns all tasks (including completed).

```javascript
const allTasks = DataStore.getAllTasks();
```

### Project CRUD Operations

#### `DataStore.addProject(projectData)`
Creates a new project.

```javascript
const project = DataStore.addProject({
    name: 'Q4 Marketing Campaign'
});
```

#### `DataStore.updateProject(projectId, updates)`
Updates an existing project.

```javascript
const updated = DataStore.updateProject(projectId, {
    name: 'Updated Project Name'
});
```

#### `DataStore.deleteProject(projectId)`
Deletes a project. Tasks associated with the project are moved to inbox. Returns `true` on success.

```javascript
const deleted = DataStore.deleteProject(projectId);
```

#### `DataStore.getProject(projectId)`
Retrieves a single project by ID. Returns project object or `null`.

```javascript
const project = DataStore.getProject(projectId);
```

#### `DataStore.getAllProjects()`
Returns all projects.

```javascript
const projects = DataStore.getAllProjects();
```

### Query Helpers

#### `DataStore.getInboxTasks()`
Returns all pending tasks marked as inbox tasks.

```javascript
const inboxTasks = DataStore.getInboxTasks();
```

#### `DataStore.getTodayTasks()`
Returns all pending tasks due today.

```javascript
const todayTasks = DataStore.getTodayTasks();
```

#### `DataStore.getUpcomingTasks()`
Returns all pending tasks due in the future, sorted by due date.

```javascript
const upcomingTasks = DataStore.getUpcomingTasks();
```

#### `DataStore.getSomedayTasks()`
Returns all pending tasks marked as "someday/maybe".

```javascript
const somedayTasks = DataStore.getSomedayTasks();
```

#### `DataStore.getTasksByProject(projectId)`
Returns all pending tasks for a specific project.

```javascript
const projectTasks = DataStore.getTasksByProject(projectId);
```

#### `DataStore.getTasksByTag(tag)`
Returns all pending tasks with a specific tag.

```javascript
const taggedTasks = DataStore.getTasksByTag('urgent');
```

#### `DataStore.getCompletedTasks()`
Returns all completed tasks.

```javascript
const completed = DataStore.getCompletedTasks();
```

### Tag Operations

#### `DataStore.getAllTags()`
Returns all available tags.

```javascript
const tags = DataStore.getAllTags();
```

#### `DataStore.addTag(tag)`
Adds a new tag to the tag list (if it doesn't already exist).

```javascript
DataStore.addTag('new-tag');
```

### Event System

#### `DataStore.subscribe(listener)`
Subscribes to data change events. Returns an unsubscribe function.

```javascript
const unsubscribe = DataStore.subscribe((event) => {
    console.log('Event type:', event.type);
    console.log('Event data:', event.data);
});

// Later, to unsubscribe:
unsubscribe();
```

**Event Types:**
- `task_added` - Fired when a task is created
- `task_updated` - Fired when a task is modified
- `task_deleted` - Fired when a task is removed
- `project_added` - Fired when a project is created
- `project_updated` - Fired when a project is modified
- `project_deleted` - Fired when a project is removed
- `tag_added` - Fired when a new tag is added

### Storage Operations

#### `DataStore.saveState()`
Manually saves the current state to localStorage. (Usually called automatically)

```javascript
DataStore.saveState();
```

#### `DataStore.loadState()`
Manually loads state from localStorage. (Usually called automatically)

```javascript
DataStore.loadState();
```

#### `DataStore.isFirstRun()`
Checks if this is the first time the app is running.

```javascript
if (DataStore.isFirstRun()) {
    console.log('Welcome to GetDone!');
}
```

## Sample Data

On first run, the data layer seeds the following sample data:

- **3 Projects:** Work, Personal, Home Improvement
- **9 Tasks:** Including tasks for today, upcoming, inbox, and someday/maybe
- **9 Tags:** urgent, review, health, presentation, shopping, meeting, maintenance, learning, creative

## Testing

Open `test.html` in a browser and check the console to verify all data layer functionality.

To test persistence:
1. Open the app in a browser
2. Make changes to tasks/projects
3. Reload the page
4. Verify that changes persist

To reset the app (clear all data):
```javascript
localStorage.clear();
location.reload();
```

## Usage Example

```javascript
// Initialize the data store
DataStore.initialize();

// Subscribe to changes
DataStore.subscribe((event) => {
    if (event.type === 'task_added') {
        renderTaskList();
    }
});

// Add a new task
const task = DataStore.addTask({
    title: 'Buy groceries',
    dueDate: new Date().toISOString().split('T')[0],
    tags: ['shopping', 'personal']
});

// Get today's tasks and render them
const todayTasks = DataStore.getTodayTasks();
todayTasks.forEach(task => {
    console.log(task.title);
});

// Mark task as complete
DataStore.updateTask(task.id, { status: 'completed' });
```
