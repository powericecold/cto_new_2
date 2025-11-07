# Quick Start Guide - Data Layer

## Getting Started (30 seconds)

1. Open `index.html` in your browser
2. Open Browser Console (F12)
3. See automatic tests run and sample data loaded!

## Basic Usage

```javascript
// Initialize (done automatically on page load)
DataStore.initialize();

// Get tasks by view
const inbox = DataStore.getInboxTasks();
const today = DataStore.getTodayTasks();
const upcoming = DataStore.getUpcomingTasks();
const someday = DataStore.getSomedayTasks();

// Add a task
const task = DataStore.addTask({
    title: 'Buy groceries',
    notes: 'Milk, eggs, bread',
    dueDate: '2024-12-31',
    tags: ['shopping', 'personal']
});

// Update a task
DataStore.updateTask(task.id, {
    status: 'completed'
});

// Delete a task
DataStore.deleteTask(task.id);

// Listen for changes
DataStore.subscribe((event) => {
    console.log('Something changed:', event.type);
    // Update your UI here
});
```

## Sample Data

On first run, you get:
- 3 Projects (Work, Personal, Home Improvement)
- 9 Tasks (mix of inbox, today, upcoming, someday)
- 9 Tags (urgent, review, health, etc.)

## Reset Everything

```javascript
localStorage.clear();
location.reload();
```

## Test Page

Open `test.html` for comprehensive automated tests with colorful console output!

## Documentation

- `DATA_LAYER.md` - Full API reference
- `ACCEPTANCE_TEST.md` - Test results and manual testing
- `IMPLEMENTATION_SUMMARY.md` - Technical details

## Support

Check the browser console for helpful debug messages and test results!
