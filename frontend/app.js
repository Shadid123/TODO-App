// ============================================
// MODERN TODO APP - JAVASCRIPT LOGIC
// ============================================

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    users: JSON.parse(localStorage.getItem('users')) || [],
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    currentView: 'today',
    theme: localStorage.getItem('theme') || 'dark-mode',
};

// ============================================
// DOM ELEMENTS
// ============================================

const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const signupForm = document.getElementById('signupForm');
const signInForm = document.getElementById('signInForm');
const signupFormElement = document.getElementById('signupFormElement');
const signInFormElement = document.getElementById('signInFormElement');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const addTaskForm = document.getElementById('addTaskForm');
const taskModal = document.getElementById('taskModal');
const editTaskForm = document.getElementById('editTaskForm');
const notificationContainer = document.getElementById('notificationContainer');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    initializeApp();
    setupEventListeners();
    setDefaultDate();
});

function initializeApp() {
    if (state.currentUser) {
        showApp();
        loadUserTasks();
        updateProgressTracker();
        renderTasks();
        updateUserGreeting();
    } else {
        showAuth();
    }
}

function setupEventListeners() {
    // Auth Events
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', handleSignUp);
    }
    if (signInFormElement) {
        signInFormElement.addEventListener('submit', handleSignIn);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleSignOut);
    }

    // Theme
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Tasks
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', handleAddTask);
    }
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', handleEditTask);
    }

    // Navigation buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', handleNavigation);

        // Filters
        const categoryFilter = document.getElementById('categoryFilter');
        const searchInput = document.getElementById('searchInput');
    
        if (categoryFilter) {
            categoryFilter.addEventListener('change', renderTasks);
        }
        if (searchInput) {
            searchInput.addEventListener('input', renderTasks);
        }
    });
}

// ============================================
// AUTHENTICATION
// ============================================

function handleSignUp(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!name || !email || !password) {
        showNotification('error', 'Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('error', 'Passwords do not match');
        return;
    }

    if (password.length < 4) {
        showNotification('error', 'Password must be at least 4 characters');
        return;
    }

    if (state.users.some(u => u.email === email)) {
        showNotification('error', 'Email already registered');
        return;
    }

    // Create user
    const user = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString(),
    };

    state.users.push(user);
    localStorage.setItem('users', JSON.stringify(state.users));

    showNotification('success', 'Account created successfully! Please sign in.');
    setTimeout(() => {
        signupFormElement.reset();
        toggleAuthForms();
    }, 1500);
}

function handleSignIn(e) {
    e.preventDefault();

    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;

    if (!email || !password) {
        showNotification('error', 'Please enter email and password');
        return;
    }

    const user = state.users.find(u => u.email === email && u.password === password);

    if (!user) {
        showNotification('error', 'Invalid email or password');
        return;
    }

    state.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    showNotification('success', `Welcome back, ${user.name}!`);
    signInFormElement.reset();
    
    setTimeout(() => {
        location.reload();
    }, 1000);
}

function handleSignOut() {
    if (confirm('Are you sure you want to sign out?')) {
        state.currentUser = null;
        localStorage.removeItem('currentUser');
        state.tasks = [];
        showAuth();
        showNotification('success', 'You have been signed out');
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

function toggleAuthForms() {
    if (signupForm) signupForm.classList.toggle('hidden');
    if (signInForm) signInForm.classList.toggle('hidden');
}

// ============================================
// UI STATE MANAGEMENT
// ============================================

function showAuth() {
    if (authContainer) authContainer.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
}

function showApp() {
    if (authContainer) authContainer.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
}

function updateUserGreeting() {
    const userNameSpan = document.getElementById('userName');
    if (!userNameSpan || !state.currentUser) return;
    
    userNameSpan.textContent = state.currentUser.name;
}

// ============================================
// THEME MANAGEMENT
// ============================================

function toggleTheme() {
    state.theme = state.theme === 'dark-mode' ? 'light-mode' : 'dark-mode';
    localStorage.setItem('theme', state.theme);
    applyTheme();
}

function applyTheme() {
    document.body.classList.remove('dark-mode', 'light-mode');
    document.body.classList.add(state.theme);

    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('span');
        if (themeIcon) {
            themeIcon.textContent = state.theme === 'dark-mode' ? '🌙' : '☀️';
        }
    }
}

// ============================================
// TASK MANAGEMENT
// ============================================

function handleAddTask(e) {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value;

    if (!title || !date || !priority || !category) {
        showNotification('error', 'Please fill in all required fields');
        return;
    }

    const task = {
        id: Date.now(),
        userId: state.currentUser.id,
        title: title,
        description: description,
        date: date,
        time: time || '00:00',
        priority: priority,
        category: category,
        completed: false,
        createdAt: new Date().toISOString(),
        reminder: false,
    };

    state.tasks.push(task);
    saveTasks();
    addTaskForm.reset();
    setDefaultDate();
    renderTasks();
    updateProgressTracker();
    showNotification('success', 'Task added successfully! ✨');
}

function handleEditTask(e) {
    e.preventDefault();

    if (!state.currentUser) return;

    const editingTaskId = parseInt(document.getElementById('editTaskTitle').dataset.taskId || 0);
    if (!editingTaskId) return;

    const task = state.tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    task.title = document.getElementById('editTaskTitle').value.trim();
    task.description = document.getElementById('editTaskDescription').value.trim();
    task.date = document.getElementById('editTaskDate').value;
    task.time = document.getElementById('editTaskTime').value;
    task.priority = document.getElementById('editTaskPriority').value;
    task.category = document.getElementById('editTaskCategory').value;

    saveTasks();
    closeTaskModal();
    renderTasks();
    updateProgressTracker();
    showNotification('success', 'Task updated successfully! 📝');
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        updateProgressTracker();
        showNotification('success', 'Task deleted successfully! 🗑️');
    }
}

function toggleTaskStatus(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateProgressTracker();
        showNotification('success', task.completed ? 'Task completed! 🎉' : 'Task marked as pending ⏳');
    }
}

function openTaskModal(taskId) {
    if (!taskModal) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskTitle').dataset.taskId = taskId;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskDate').value = task.date;
    document.getElementById('editTaskTime').value = task.time;
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskCategory').value = task.category;

    taskModal.classList.remove('hidden');
}

function closeTaskModal() {
    if (taskModal) {
        taskModal.classList.add('hidden');
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

function loadUserTasks() {
    if (!state.currentUser) return;
    
    const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    state.tasks = allTasks.filter(t => t.userId === state.currentUser.id);
}

// ============================================
// NAVIGATION
// ============================================

function handleNavigation(e) {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const btn = e.target.closest('.nav-btn');
    if (btn) {
        btn.classList.add('active');
        state.currentView = btn.dataset.view || 'today';
        
        // Hide all view sections and remove active class
        const viewSections = document.querySelectorAll('.view-section');
        viewSections.forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });
        
        // Show the selected view section
        const viewId = state.currentView + 'View';
        const selectedView = document.getElementById(viewId);
        if (selectedView) {
            selectedView.classList.remove('hidden');
            selectedView.classList.add('active');
        }
        
        // Render calendar if calendar view is selected
        if (state.currentView === 'calendar') {
            renderCalendar();
        }
        
        renderTasks();
    }
}

// ============================================
// RENDERING
// ============================================

function renderTasks() {
    if (!state.currentUser) return;

    const todayTasksContainer = document.getElementById('todayTasksContainer');
    const allTasksContainer = document.getElementById('allTasksContainer');
    const completedTasksContainer = document.getElementById('completedTasksContainer');
    const pendingTasksContainer = document.getElementById('pendingTasksContainer');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get tasks for each category
    const userTasks = state.tasks.filter(t => t.userId === state.currentUser.id);
    const todayTasks = userTasks.filter(t => t.date === today);
    const completedTasks = userTasks.filter(t => t.completed);
    const pendingTasks = userTasks.filter(t => !t.completed);

    // Apply filters to all tasks
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    let filteredAllTasks = userTasks;
    
    if (categoryFilter) {
        filteredAllTasks = filteredAllTasks.filter(t => t.category === categoryFilter);
    }
    
    if (searchInput) {
        filteredAllTasks = filteredAllTasks.filter(t => 
            t.title.toLowerCase().includes(searchInput) || 
            t.description.toLowerCase().includes(searchInput)
        );
    }
    // Render each view
    if (todayTasksContainer) renderTasksInContainer(todayTasks, todayTasksContainer);
    if (allTasksContainer) renderTasksInContainer(filteredAllTasks, allTasksContainer);
    if (completedTasksContainer) renderTasksInContainer(completedTasks, completedTasksContainer);
    if (pendingTasksContainer) renderTasksInContainer(pendingTasks, pendingTasksContainer);
}

function renderTasksInContainer(tasks, container) {
    container.innerHTML = '';

    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No tasks found. Add one to get started! 🚀</p></div>';
        return;
    }

    // Sort tasks by date and priority
    tasks.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;

        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item ${task.completed ? 'completed' : ''}`;
    div.dataset.taskId = task.id;
    
    div.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <span class="task-meta-item">📅 ${task.date}</span>
                <span class="task-meta-item">🕐 ${task.time}</span>
                <span class="priority-tag ${task.priority.toLowerCase()}">${task.priority}</span>
                <span class="category-tag">${task.category}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="btn-edit btn btn-secondary btn-small">Edit</button>
            <button class="btn-delete btn btn-danger btn-small">Delete</button>
        </div>
    `;

    const checkbox = div.querySelector('.task-checkbox');
    const editBtn = div.querySelector('.btn-edit');
    const deleteBtn = div.querySelector('.btn-delete');

    checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
    editBtn.addEventListener('click', () => openTaskModal(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return div;
}

// ============================================
// PROGRESS TRACKER
// ============================================

function updateProgressTracker() {
    if (!state.currentUser) return;

    const userTasks = state.tasks.filter(t => t.userId === state.currentUser.id);
    const completedTasks = userTasks.filter(t => t.completed).length;
    const totalTasks = userTasks.length;

    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const progressFillEl = document.getElementById('progressFill');

    if (totalTasksEl) totalTasksEl.textContent = totalTasks;
    if (completedTasksEl) completedTasksEl.textContent = completedTasks;

    if (progressFillEl) {
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        progressFillEl.style.width = progress + '%';
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(type, message) {
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.classList.add('notification', type);

    const emojis = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
    };

    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-message">${emojis[type]} ${message}</div>
        </div>
    `;

    notification.style.padding = '1rem';
    notification.style.marginBottom = '0.5rem';
    notification.style.borderRadius = '0.5rem';
    notification.style.animation = 'slideInRight 0.3s ease-out';

    if (type === 'success') {
        notification.style.background = '#10b981';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.background = '#ef4444';
        notification.style.color = 'white';
    } else {
        notification.style.background = '#3b82f6';
        notification.style.color = 'white';
    }

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// UTILITIES
// ============================================

function setDefaultDate() {
    const taskDateEl = document.getElementById('taskDate');
    if (taskDateEl) {
        const today = new Date().toISOString().split('T')[0];
        taskDateEl.value = today;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// CALENDAR FUNCTIONALITY
// ============================================

let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar');
    const currentMonth = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    if (!calendarGrid || !currentMonth) return;

    // Set up month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonth.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;

    // Clear calendar
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }

    // Add days of month
    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Highlight today
        if (dateStr === today) {
            dayCell.classList.add('today');
        }

        // Check if date has tasks
        const hasTasks = state.tasks.some(t => t.date === dateStr && t.userId === state.currentUser.id);
        if (hasTasks) {
            dayCell.classList.add('has-tasks');
        }

        dayCell.addEventListener('click', () => showCalendarTasks(dateStr));
        calendarGrid.appendChild(dayCell);
    }

    // Set up month navigation
    prevMonthBtn.onclick = () => {
        currentCalendarMonth--;
        if (currentCalendarMonth < 0) {
            currentCalendarMonth = 11;
            currentCalendarYear--;
        }
        renderCalendar();
    };

    nextMonthBtn.onclick = () => {
        currentCalendarMonth++;
        if (currentCalendarMonth > 11) {
            currentCalendarMonth = 0;
            currentCalendarYear++;
        }
        renderCalendar();
    };
}

function showCalendarTasks(dateStr) {
    const calendarTasksList = document.getElementById('calendarTasksList');
    if (!calendarTasksList) return;

    const tasksOnDate = state.tasks.filter(t => t.date === dateStr && t.userId === state.currentUser.id);

    calendarTasksList.innerHTML = `<div class="section-header"><h3>Tasks on ${dateStr}</h3></div>`;

    if (tasksOnDate.length === 0) {
        calendarTasksList.innerHTML += '<div class="empty-state"><p>No tasks on this date</p></div>';
        return;
    }

    const container = document.createElement('div');
    container.className = 'tasks-container';
    tasksOnDate.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });

    calendarTasksList.appendChild(container);
}
