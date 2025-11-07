#!/bin/bash

echo "======================================"
echo "  GetDone Calendar Status Check"
echo "======================================"
echo ""

# Check if files exist
echo "📁 Checking files..."
if [ -f "app.js" ]; then
    lines=$(wc -l < app.js)
    size=$(ls -lh app.js | awk '{print $5}')
    echo "  ✅ app.js exists ($lines lines, $size)"
else
    echo "  ❌ app.js missing!"
fi

if [ -f "styles.css" ]; then
    lines=$(wc -l < styles.css)
    size=$(ls -lh styles.css | awk '{print $5}')
    echo "  ✅ styles.css exists ($lines lines, $size)"
else
    echo "  ❌ styles.css missing!"
fi

if [ -f "index.html" ]; then
    echo "  ✅ index.html exists"
else
    echo "  ❌ index.html missing!"
fi

echo ""
echo "🔍 Checking for calendar functions in app.js..."
count=$(grep -c "function renderCalendarView" app.js)
if [ "$count" -eq 1 ]; then
    echo "  ✅ renderCalendarView found"
else
    echo "  ❌ renderCalendarView not found!"
fi

count=$(grep -c "function navigateCalendar" app.js)
if [ "$count" -eq 1 ]; then
    echo "  ✅ navigateCalendar found"
else
    echo "  ❌ navigateCalendar not found!"
fi

count=$(grep -c "function attachCalendarEventListeners" app.js)
if [ "$count" -eq 1 ]; then
    echo "  ✅ attachCalendarEventListeners found"
else
    echo "  ❌ attachCalendarEventListeners not found!"
fi

echo ""
echo "🎨 Checking for calendar styles in styles.css..."
count=$(grep -c "\.calendar-container" styles.css)
if [ "$count" -ge 1 ]; then
    echo "  ✅ .calendar-container found"
else
    echo "  ❌ .calendar-container not found!"
fi

count=$(grep -c "\.calendar-grid" styles.css)
if [ "$count" -ge 1 ]; then
    echo "  ✅ .calendar-grid found"
else
    echo "  ❌ .calendar-grid not found!"
fi

echo ""
echo "🔗 Checking calendar integration..."
count=$(grep -c 'case .calendar.:' app.js)
if [ "$count" -ge 1 ]; then
    echo "  ✅ Calendar case in switch statement found"
else
    echo "  ❌ Calendar case not found!"
fi

count=$(grep -c 'href="#calendar"' index.html)
if [ "$count" -ge 1 ]; then
    echo "  ✅ Calendar link in navigation found"
else
    echo "  ❌ Calendar link not found!"
fi

echo ""
echo "📊 Git status..."
git log --oneline -1

echo ""
echo "======================================"
echo "  Status Summary"
echo "======================================"
echo ""
echo "If all checks passed (✅), the calendar is properly installed."
echo ""
echo "To test:"
echo "  1. Start server: python3 -m http.server 8080"
echo "  2. Open: http://localhost:8080"
echo "  3. Click 'Calendar' in sidebar"
echo "  4. Press F12 and check Console for errors"
echo ""
echo "If you see 'Calendar view coming soon', try:"
echo "  - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "  - Clear browser cache"
echo "  - Check browser console (F12) for errors"
echo ""
echo "For detailed help, see:"
echo "  📖 README.md"
echo "  🔧 CALENDAR_TROUBLESHOOTING.md"
echo "  🧪 debug_calendar.html"
echo ""
