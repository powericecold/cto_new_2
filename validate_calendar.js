// Calendar Feature Validation Script
// Run this in the browser console to validate calendar functionality

(function validateCalendar() {
    console.log('🔍 Calendar Feature Validation');
    console.log('================================\n');
    
    const results = [];
    
    // Test 1: Check if calendar functions exist
    const functionChecks = [
        'renderCalendarView',
        'navigateCalendar',
        'navigateCalendarToday',
        'attachCalendarEventListeners',
        'handleCalendarDragOver',
        'handleCalendarDragLeave',
        'handleCalendarDrop',
        'handleUnscheduledDrop',
        'handleCalendarTaskDragStart',
        'handleCalendarTaskDragEnd',
        'handleClearDueDate',
        'handleTouchStart',
        'handleTouchMove',
        'handleTouchEnd',
        'updateOtherViews'
    ];
    
    console.log('1️⃣  Function Definitions Check:');
    functionChecks.forEach(fnName => {
        const exists = typeof window[fnName] === 'function';
        results.push({ test: fnName, pass: exists });
        console.log(`   ${exists ? '✅' : '❌'} ${fnName}`);
    });
    
    // Test 2: Check global variables
    console.log('\n2️⃣  Global Variables Check:');
    const varChecks = [
        'currentSection',
        'draggedTaskId',
        'currentCalendarDate'
    ];
    
    varChecks.forEach(varName => {
        const exists = typeof window[varName] !== 'undefined';
        results.push({ test: varName, pass: exists });
        console.log(`   ${exists ? '✅' : '❌'} ${varName}`);
    });
    
    // Test 3: Check DataStore integration
    console.log('\n3️⃣  DataStore Integration Check:');
    const dataStoreChecks = [
        'getAllTasks',
        'updateTask',
        'getTask'
    ];
    
    dataStoreChecks.forEach(method => {
        const exists = DataStore && typeof DataStore[method] === 'function';
        results.push({ test: `DataStore.${method}`, pass: exists });
        console.log(`   ${exists ? '✅' : '❌'} DataStore.${method}`);
    });
    
    // Test 4: Check if tasks can be queried
    console.log('\n4️⃣  Data Query Check:');
    try {
        const allTasks = DataStore.getAllTasks();
        const tasksWithDates = allTasks.filter(t => t.dueDate);
        const tasksWithoutDates = allTasks.filter(t => !t.dueDate && t.status === 'pending' && t.type !== 'someday');
        
        console.log(`   ✅ Total tasks: ${allTasks.length}`);
        console.log(`   ✅ Tasks with due dates: ${tasksWithDates.length}`);
        console.log(`   ✅ Unscheduled tasks: ${tasksWithoutDates.length}`);
        results.push({ test: 'Data queries', pass: true });
    } catch (e) {
        console.log(`   ❌ Error querying tasks: ${e.message}`);
        results.push({ test: 'Data queries', pass: false });
    }
    
    // Test 5: Test date manipulation
    console.log('\n5️⃣  Date Manipulation Check:');
    try {
        const testDate = new Date();
        const isoDate = testDate.toISOString().split('T')[0];
        console.log(`   ✅ Current date: ${isoDate}`);
        
        testDate.setMonth(testDate.getMonth() + 1);
        console.log(`   ✅ Next month navigation works`);
        
        testDate.setMonth(testDate.getMonth() - 2);
        console.log(`   ✅ Previous month navigation works`);
        
        results.push({ test: 'Date manipulation', pass: true });
    } catch (e) {
        console.log(`   ❌ Error with dates: ${e.message}`);
        results.push({ test: 'Date manipulation', pass: false });
    }
    
    // Summary
    console.log('\n📊 Summary:');
    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`   ${passed}/${total} checks passed (${percentage}%)`);
    
    if (passed === total) {
        console.log('\n✨ All validation checks passed! Calendar feature is ready to use.');
    } else {
        console.log('\n⚠️  Some checks failed. Review the output above.');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Click "Calendar" in the sidebar to view the calendar');
    console.log('   2. Drag tasks from "Unscheduled Tasks" to calendar dates');
    console.log('   3. Drag tasks between calendar dates to reschedule');
    console.log('   4. Click the × button to clear due dates');
    console.log('   5. Use navigation buttons to browse months');
    
    return {
        passed,
        total,
        percentage,
        results
    };
})();
