# Calendar Troubleshooting Guide

## Problem: Calendar shows "Calendar view coming soon" instead of the actual calendar

### Quick Fixes

#### 1. Clear Browser Cache (Most Common Solution)
The browser might be using an old cached version of `app.js`:

**Chrome/Edge:**
- Press `Ctrl + Shift + Delete` (Windows/Linux) or `Cmd + Shift + Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"
- OR: Press `Ctrl + F5` to hard refresh the page

**Firefox:**
- Press `Ctrl + Shift + Delete` (Windows/Linux) or `Cmd + Shift + Delete` (Mac)
- Select "Cache"
- Click "Clear Now"
- OR: Press `Ctrl + Shift + R` to hard refresh

**Safari:**
- Press `Cmd + Option + E` to empty caches
- Then refresh with `Cmd + R`

#### 2. Check Browser Console for Errors
1. Open Developer Tools:
   - Press `F12` (Windows/Linux)
   - Press `Cmd + Option + I` (Mac)
2. Click on the "Console" tab
3. Click on "Calendar" in the sidebar
4. Look for any error messages (red text)

**Expected console output when working correctly:**
```
updateMainContent called with section: calendar
Rendering calendar view...
renderCalendarView called
currentCalendarDate: [Date object]
Rendering calendar for: 2025 10
Calendar view rendered successfully
```

**If you see errors:**
- Take a screenshot of the console
- Note the error message

#### 3. Verify File Version
Open `http://localhost:8080/app.js` (or your server URL + `/app.js`) in a new tab and search for "renderCalendarView". 
- If found: Your files are correct, clear cache
- If not found: The file wasn't updated properly

### Debug Tools

#### Test Page
Open `debug_calendar.html` in your browser to see detailed debugging information and test the calendar rendering directly.

### Technical Details

The calendar feature is implemented with:
- **15 functions** in `app.js`
- **28 CSS classes** in `styles.css`
- **Full drag-and-drop** support for desktop
- **Touch support** for mobile/tablet
- **Responsive design** with breakpoints at 1024px and 768px

### What Should You See?

When the calendar is working correctly, you should see:
1. **Monthly grid** with 7 columns (Sun-Sat)
2. **Navigation buttons**: ◀ Today ▶
3. **Current month and year** as the header
4. **Today's date highlighted** in blue
5. **Tasks displayed** as colored chips on their due dates
6. **Unscheduled tasks sidebar** on the right
7. **Drag-and-drop** - you can drag tasks between dates

### Still Not Working?

If none of the above solutions work:

1. **Check that all files are present:**
   ```bash
   ls -lh app.js styles.css data.js index.html
   ```
   - app.js should be ~43KB
   - styles.css should be ~23KB

2. **Verify the server is serving the latest files:**
   ```bash
   curl -s http://localhost:8080/app.js | grep -c "renderCalendarView"
   ```
   Should return: 1

3. **Check git status:**
   ```bash
   git log --oneline -1
   ```
   Should show: "feat(calendar): add calendar scheduling view..."

4. **Browser compatibility:**
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

### Contact Support

If you've tried all the above and still see "Calendar view coming soon", please provide:
- Browser name and version
- Screenshot of the browser console (F12 → Console tab)
- Output of: `git log --oneline -1`
- Whether you can access the debug page at `debug_calendar.html`
