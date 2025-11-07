# GetDone - Task Management Application

A modern, GTD-inspired task management application with calendar scheduling, built with vanilla JavaScript.

## Features

✅ **Task Management**
- Inbox for capturing quick tasks
- Today view for tasks due today
- Upcoming view for future tasks
- Someday/Maybe for backlog items
- Projects organization
- Tags and filtering

📆 **Calendar Scheduling** (NEW!)
- Monthly calendar view
- Drag-and-drop tasks onto dates
- Visual due date management
- Touch support for mobile/tablet
- Responsive design

💾 **Data Persistence**
- LocalStorage-based data layer
- Automatic saving
- Sample data on first load

## Quick Start

### 1. Open the Application

**Option A: Using Python (Recommended)**
```bash
python3 -m http.server 8080
```
Then open: http://localhost:8080

**Option B: Using Node.js**
```bash
npx http-server -p 8080
```
Then open: http://localhost:8080

**Option C: Using PHP**
```bash
php -S localhost:8080
```
Then open: http://localhost:8080

**Option D: Direct File Access**
Simply open `index.html` in your browser (some features may be limited)

### 2. Navigate to Calendar

1. Click **"Calendar"** in the left sidebar (📆 icon)
2. You should see a monthly calendar grid
3. Tasks with due dates appear on their respective dates
4. Unscheduled tasks appear in the right sidebar

### 3. Using the Calendar

**Assign due dates:**
- Drag a task from "Unscheduled Tasks" to any calendar date

**Reschedule tasks:**
- Drag a task from one date to another

**Clear due dates:**
- Click the **×** button on a task chip
- OR drag the task back to "Unscheduled Tasks"

**Navigate months:**
- Click **◀** for previous month
- Click **▶** for next month
- Click **Today** to jump to current month

## Troubleshooting

### "Calendar view coming soon" appears instead of calendar?

This is likely a **browser cache issue**. Try:

1. **Hard refresh:** `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. **Clear cache:** See `CALENDAR_TROUBLESHOOTING.md` for detailed instructions
3. **Check console:** Press F12 → Console tab for error messages

See **CALENDAR_TROUBLESHOOTING.md** for complete troubleshooting guide.

## File Structure

```
.
├── index.html              # Main HTML file
├── app.js                  # Application logic (1,329 lines)
├── data.js                 # Data layer with LocalStorage
├── styles.css              # Styles including calendar (1,125 lines)
├── debug_calendar.html     # Debug tool for calendar
├── calendar_test.html      # Manual testing guide
├── validate_calendar.js    # Automated validation script
└── docs/
    ├── CALENDAR_FEATURE.md              # Calendar feature docs
    ├── CALENDAR_IMPLEMENTATION_SUMMARY.md
    └── CALENDAR_TROUBLESHOOTING.md      # Troubleshooting guide
```

## Testing

### Manual Testing
Open `calendar_test.html` for a comprehensive manual testing checklist.

### Automated Validation
Open the browser console on `index.html` and run:
```javascript
// Load and run validation script
const script = document.createElement('script');
script.src = 'validate_calendar.js';
document.head.appendChild(script);
```

### Debug Tool
Open `debug_calendar.html` for detailed debugging information.

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Data Storage

All data is stored in browser's LocalStorage:
- **Key:** `getdone_app_state`
- **First Run Flag:** `getdone_first_run`

To reset all data:
```javascript
localStorage.clear();
location.reload();
```

## API Documentation

### DataStore Methods

```javascript
// Tasks
DataStore.getAllTasks()
DataStore.getInboxTasks()
DataStore.getTodayTasks()
DataStore.getUpcomingTasks()
DataStore.getSomedayTasks()
DataStore.getTasksByProject(projectId)
DataStore.getTasksByTag(tag)
DataStore.addTask(taskData)
DataStore.updateTask(taskId, updates)
DataStore.deleteTask(taskId)

// Projects
DataStore.getAllProjects()
DataStore.addProject(projectData)
DataStore.updateProject(projectId, updates)
DataStore.deleteProject(projectId)

// Tags
DataStore.getAllTags()

// Events
DataStore.subscribe(callback)
```

### Calendar Functions

```javascript
// Render calendar view
renderCalendarView()

// Navigate months
navigateCalendar(-1)  // Previous month
navigateCalendar(1)   // Next month
navigateCalendarToday()  // Jump to today
```

## Development

### No Build Step Required
This is a pure vanilla JavaScript application. No npm, webpack, or build tools needed!

### Adding Sample Data
Sample data is automatically added on first load. To add more:
```javascript
DataStore.addTask({
    title: 'My Task',
    notes: 'Description',
    dueDate: '2025-12-31',
    tags: ['important'],
    projectId: null
});
```

## Contributing

1. Make changes to source files
2. Test in browser
3. Validate with `validate_calendar.js`
4. Check manual tests in `calendar_test.html`

## License

MIT License - see project repository for details.

## Support

- 📖 See `CALENDAR_FEATURE.md` for complete feature documentation
- 🔧 See `CALENDAR_TROUBLESHOOTING.md` for troubleshooting
- 🧪 See `calendar_test.html` for testing guide
- 💬 Check browser console for debug messages (F12)

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Calendar Feature:** ✅ Fully Implemented
