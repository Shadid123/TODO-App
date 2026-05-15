(() => {
  'use strict';

  const KEYS = {
    users: 'todo_users',
    currentUser: 'todo_current_user',
    tasks: 'todo_tasks_by_user',
    theme: 'todo_theme',
    reminders: 'todo_reminders_sent',
    pomodoro: 'todo_pomodoro_state'
  };

  const WORK_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;
  const REMINDER_WINDOW_MINUTES = 30;
  const REMINDER_CHECK_INTERVAL_MS = 60000;
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let users = read(KEYS.users, []);
  let currentUserId = localStorage.getItem(KEYS.currentUser) || '';
  let tasksByUser = read(KEYS.tasks, {});
  let remindersSent = read(KEYS.reminders, {});
  let selectedFilter = 'all';
  let searchTerm = '';
  let calendarDate = new Date();
  let uidCounter = 0;
  let pomodoro = read(KEYS.pomodoro, { mode: 'work', secondsLeft: WORK_SECONDS, running: false, updatedAt: Date.now() });
  let timerId = null;

  const els = {
    authSection: q('#authSection'),
    appSection: q('#appSection'),
    signupForm: q('#signupForm'),
    loginForm: q('#loginForm'),
    signupName: q('#signupName'),
    signupEmail: q('#signupEmail'),
    signupPassword: q('#signupPassword'),
    loginEmail: q('#loginEmail'),
    loginPassword: q('#loginPassword'),
    welcomeText: q('#welcomeText'),
    logoutBtn: q('#logoutBtn'),
    themeToggle: q('#themeToggle'),
    taskForm: q('#taskForm'),
    taskId: q('#taskId'),
    taskTitle: q('#taskTitle'),
    taskDescription: q('#taskDescription'),
    taskDate: q('#taskDate'),
    taskTime: q('#taskTime'),
    taskPriority: q('#taskPriority'),
    taskCategory: q('#taskCategory'),
    taskSubmitBtn: q('#taskSubmitBtn'),
    searchInput: q('#searchInput'),
    taskList: q('#taskList'),
    progressText: q('#progressText'),
    progressFill: q('#progressFill'),
    filterButtons: Array.from(document.querySelectorAll('.filter-btn')),
    calendarMonth: q('#calendarMonth'),
    calendarGrid: q('#calendarGrid'),
    prevMonth: q('#prevMonth'),
    nextMonth: q('#nextMonth'),
    pomodoroMode: q('#pomodoroMode'),
    pomodoroTime: q('#pomodoroTime'),
    pomodoroStart: q('#pomodoroStart'),
    pomodoroPause: q('#pomodoroPause'),
    pomodoroReset: q('#pomodoroReset'),
    toast: q('#toast')
  };

  init();

  async function init() {
    await migrateLegacyUsers();
    applyTheme();
    bindEvents();
    updatePomodoroFromElapsedTime();
    renderAuthState();
    startReminderLoop();
  }

  function bindEvents() {
    els.signupForm.addEventListener('submit', onSignup);
    els.loginForm.addEventListener('submit', onLogin);
    els.logoutBtn.addEventListener('click', onLogout);
    els.themeToggle.addEventListener('click', toggleTheme);
    els.taskForm.addEventListener('submit', onTaskSubmit);
    els.searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderTasks();
    });

    els.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedFilter = btn.dataset.filter;
        els.filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderTasks();
      });
    });

    els.prevMonth.addEventListener('click', () => {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderCalendar();
    });
    els.nextMonth.addEventListener('click', () => {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderCalendar();
    });

    els.pomodoroStart.addEventListener('click', startPomodoro);
    els.pomodoroPause.addEventListener('click', pausePomodoro);
    els.pomodoroReset.addEventListener('click', resetPomodoro);
  }

  async function onSignup(e) {
    e.preventDefault();
    const name = els.signupName.value.trim();
    const email = els.signupEmail.value.trim().toLowerCase();
    const password = els.signupPassword.value;
    const passwordHash = await hashPassword(password);
    if (!passwordHash) return toast('Secure password hashing is not supported in this browser.');

    if (users.some((u) => u.email === email)) {
      return toast('Account already exists for this email');
    }

    const newUser = { id: uid(), name, email, passwordHash };
    users.push(newUser);
    write(KEYS.users, users);
    currentUserId = newUser.id;
    localStorage.setItem(KEYS.currentUser, currentUserId);
    toast('Account created successfully');
    els.signupForm.reset();
    renderAuthState();
  }

  async function onLogin(e) {
    e.preventDefault();
    const email = els.loginEmail.value.trim().toLowerCase();
    const password = els.loginPassword.value;
    const passwordHash = await hashPassword(password);
    if (!passwordHash) return toast('Secure password hashing is not supported in this browser.');
    const user = users.find((u) => u.email === email && u.passwordHash === passwordHash);

    if (!user) return toast('Invalid credentials');

    currentUserId = user.id;
    localStorage.setItem(KEYS.currentUser, currentUserId);
    els.loginForm.reset();
    toast('Login successful');
    renderAuthState();
  }

  function onLogout() {
    currentUserId = '';
    localStorage.removeItem(KEYS.currentUser);
    renderAuthState();
  }

  function onTaskSubmit(e) {
    e.preventDefault();
    const payload = {
      id: els.taskId.value || uid(),
      title: els.taskTitle.value.trim(),
      description: els.taskDescription.value.trim(),
      date: els.taskDate.value,
      time: els.taskTime.value,
      priority: els.taskPriority.value,
      category: els.taskCategory.value.trim(),
      completed: false
    };

    const dateObj = new Date(`${payload.date}T${payload.time || '00:00'}`);
    payload.month = dateObj.toLocaleString('default', { month: 'long' });
    payload.weekday = DAY_NAMES[dateObj.getDay()];

    const tasks = getCurrentTasks();
    const index = tasks.findIndex((t) => t.id === payload.id);

    if (index > -1) {
      payload.completed = tasks[index].completed;
      tasks[index] = payload;
      toast('Task updated');
    } else {
      tasks.push(payload);
      toast('Task added');
    }

    saveCurrentTasks(tasks);
    resetTaskForm();
    renderTasks();
  }

  function resetTaskForm() {
    els.taskForm.reset();
    els.taskId.value = '';
    els.taskSubmitBtn.textContent = 'Add Task';
  }

  function renderAuthState() {
    const user = users.find((u) => u.id === currentUserId);
    const isLoggedIn = Boolean(user);

    els.authSection.classList.toggle('hidden', isLoggedIn);
    els.appSection.classList.toggle('hidden', !isLoggedIn);
    els.logoutBtn.classList.toggle('hidden', !isLoggedIn);

    if (!isLoggedIn) return;

    els.welcomeText.textContent = `Welcome, ${user.name}`;
    renderTasks();
    renderCalendar();
    renderPomodoro();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function getCurrentTasks() {
    if (!currentUserId) return [];
    return Array.isArray(tasksByUser[currentUserId]) ? tasksByUser[currentUserId] : [];
  }

  function saveCurrentTasks(tasks) {
    tasksByUser[currentUserId] = tasks;
    write(KEYS.tasks, tasksByUser);
  }

  function getFilteredTasks() {
    const tasks = getCurrentTasks();
    const today = new Date().toISOString().slice(0, 10);

    return tasks.filter((task) => {
      const matchedSearch = `${task.title} ${task.description}`.toLowerCase().includes(searchTerm);
      if (!matchedSearch) return false;

      if (selectedFilter === 'completed') return task.completed;
      if (selectedFilter === 'pending') return !task.completed;
      if (selectedFilter === 'today') return task.date === today;
      return true;
    });
  }

  function renderTasks() {
    const tasks = getFilteredTasks();
    els.taskList.innerHTML = '';

    if (!tasks.length) {
      els.taskList.innerHTML = '<p>No tasks found.</p>';
      updateProgress();
      renderCalendar();
      return;
    }

    tasks.forEach((task) => {
      const item = document.createElement('article');
      item.className = `task-item ${task.completed ? 'completed' : ''}`;
      item.draggable = true;
      item.dataset.id = task.id;

      item.innerHTML = `
        <div class="task-top">
          <div>
            <strong class="task-title">${escapeHtml(task.title)}</strong>
            <p>${escapeHtml(task.description)}</p>
          </div>
          <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle complete" />
        </div>
        <div class="badges">
          <span class="badge priority-${task.priority}">${task.priority}</span>
          <span class="badge">${escapeHtml(task.category)}</span>
          <span class="badge">${task.date} ${task.time}</span>
          <span class="badge">${task.month} · ${task.weekday}</span>
        </div>
        <div class="task-actions">
          <button class="btn btn-secondary edit-btn">Edit</button>
          <button class="btn btn-danger delete-btn">Delete</button>
        </div>
      `;

      const checkbox = item.querySelector('input[type="checkbox"]');
      const editBtn = item.querySelector('.edit-btn');
      const deleteBtn = item.querySelector('.delete-btn');

      checkbox.addEventListener('change', () => toggleTask(task.id));
      editBtn.addEventListener('click', () => populateTaskForm(task.id));
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
      });
      item.addEventListener('dragover', (e) => e.preventDefault());
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        reorderTasks(draggedId, task.id);
      });

      els.taskList.appendChild(item);
    });

    updateProgress();
    renderCalendar();
    checkReminders();
  }

  function toggleTask(taskId) {
    const tasks = getCurrentTasks().map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveCurrentTasks(tasks);
    renderTasks();
  }

  function populateTaskForm(taskId) {
    const task = getCurrentTasks().find((t) => t.id === taskId);
    if (!task) return;

    els.taskId.value = task.id;
    els.taskTitle.value = task.title;
    els.taskDescription.value = task.description;
    els.taskDate.value = task.date;
    els.taskTime.value = task.time;
    els.taskPriority.value = task.priority;
    els.taskCategory.value = task.category;
    els.taskSubmitBtn.textContent = 'Update Task';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteTask(taskId) {
    const tasks = getCurrentTasks().filter((task) => task.id !== taskId);
    saveCurrentTasks(tasks);
    toast('Task deleted');
    renderTasks();
  }

  function reorderTasks(sourceId, targetId) {
    if (sourceId === targetId) return;

    const tasks = [...getCurrentTasks()];
    const sourceIdx = tasks.findIndex((t) => t.id === sourceId);
    const targetIdx = tasks.findIndex((t) => t.id === targetId);
    if (sourceIdx < 0 || targetIdx < 0) return;

    const [moved] = tasks.splice(sourceIdx, 1);
    tasks.splice(targetIdx, 0, moved);
    saveCurrentTasks(tasks);
    renderTasks();
  }

  function updateProgress() {
    const tasks = getCurrentTasks();
    const completed = tasks.filter((task) => task.completed).length;
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    els.progressText.textContent = `${percent}%`;
    els.progressFill.style.width = `${percent}%`;
  }

  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const tasks = getCurrentTasks();

    const taskCountByDate = tasks.reduce((acc, task) => {
      acc[task.date] = (acc[task.date] || 0) + 1;
      return acc;
    }, {});

    els.calendarMonth.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;
    els.calendarGrid.innerHTML = '';

    DAY_NAMES.forEach((day) => {
      const head = document.createElement('div');
      head.className = 'cal-cell cal-head';
      head.textContent = day;
      els.calendarGrid.appendChild(head);
    });

    for (let i = 0; i < firstDay.getDay(); i += 1) {
      const blank = document.createElement('div');
      blank.className = 'cal-cell';
      els.calendarGrid.appendChild(blank);
    }

    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const dateObj = new Date(year, month, day);
      const dateStr = toDateString(dateObj);
      const cell = document.createElement('div');
      cell.className = 'cal-cell';

      const isToday =
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear();

      if (isToday) cell.classList.add('cal-today');

      const hasTasks = taskCountByDate[dateStr] > 0;
      const taskInfoHtml = hasTasks
        ? `<small>${taskCountByDate[dateStr]} task(s)</small><div class="dot"></div>`
        : '';
      cell.innerHTML = `<div>${day}</div>${taskInfoHtml}`;
      els.calendarGrid.appendChild(cell);
    }
  }

  function startPomodoro() {
    if (pomodoro.running) return;
    pomodoro.running = true;
    pomodoro.updatedAt = Date.now();
    savePomodoro();
    timerId = setInterval(tickPomodoro, 1000);
  }

  function pausePomodoro() {
    pomodoro.running = false;
    pomodoro.updatedAt = Date.now();
    savePomodoro();
    clearInterval(timerId);
  }

  function resetPomodoro() {
    pomodoro.mode = 'work';
    pomodoro.secondsLeft = WORK_SECONDS;
    pomodoro.running = false;
    pomodoro.updatedAt = Date.now();
    savePomodoro();
    clearInterval(timerId);
    renderPomodoro();
  }

  function tickPomodoro() {
    if (!pomodoro.running) return;

    pomodoro.secondsLeft -= 1;
    if (pomodoro.secondsLeft <= 0) {
      pomodoro.mode = pomodoro.mode === 'work' ? 'break' : 'work';
      pomodoro.secondsLeft = pomodoro.mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;
      notify(`Pomodoro switched to ${pomodoro.mode === 'work' ? 'work' : 'break'} session`);
    }

    pomodoro.updatedAt = Date.now();
    savePomodoro();
    renderPomodoro();
  }

  function updatePomodoroFromElapsedTime() {
    if (!pomodoro.running) {
      renderPomodoro();
      return;
    }

    const elapsed = Math.floor((Date.now() - (pomodoro.updatedAt || Date.now())) / 1000);
    if (elapsed > 0) {
      pomodoro.secondsLeft = Math.max(pomodoro.secondsLeft - elapsed, 0);
      if (pomodoro.secondsLeft === 0) {
        pomodoro.mode = pomodoro.mode === 'work' ? 'break' : 'work';
        pomodoro.secondsLeft = pomodoro.mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;
      }
      pomodoro.updatedAt = Date.now();
      savePomodoro();
    }

    renderPomodoro();
    clearInterval(timerId);
    timerId = setInterval(tickPomodoro, 1000);
  }

  function renderPomodoro() {
    const mins = Math.floor(pomodoro.secondsLeft / 60);
    const secs = pomodoro.secondsLeft % 60;
    els.pomodoroMode.textContent = pomodoro.mode === 'work' ? 'Work Session' : 'Break Session';
    els.pomodoroTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function savePomodoro() {
    write(KEYS.pomodoro, pomodoro);
  }

  function startReminderLoop() {
    setInterval(checkReminders, REMINDER_CHECK_INTERVAL_MS);
  }

  function checkReminders() {
    if (!currentUserId) return;

    const now = new Date();
    const tasks = getCurrentTasks().filter((t) => !t.completed);
    const sentForUser = remindersSent[currentUserId] || {};

    tasks.forEach((task) => {
      const taskTime = new Date(`${task.date}T${task.time || '00:00'}`);
      const diffMin = Math.floor((taskTime - now) / 60000);
      const shouldNotify = diffMin >= 0 && diffMin <= REMINDER_WINDOW_MINUTES;

      if (shouldNotify && !sentForUser[task.id]) {
        notify(`Reminder: "${task.title}" is due at ${task.time}`);
        sentForUser[task.id] = true;
      }
    });

    remindersSent[currentUserId] = sentForUser;
    write(KEYS.reminders, remindersSent);
  }

  function notify(message) {
    toast(message);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Todo App', { body: message });
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem(KEYS.theme, isDark ? 'dark' : 'light');
    applyTheme();
  }

  function applyTheme() {
    const mode = localStorage.getItem(KEYS.theme) || 'light';
    document.body.classList.toggle('dark', mode === 'dark');
    els.themeToggle.textContent = mode === 'dark' ? '☀️ Light' : '🌙 Dark';
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove('hidden');
    setTimeout(() => els.toast.classList.add('hidden'), 2200);
  }

  function q(selector) {
    return document.querySelector(selector);
  }

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    uidCounter += 1;
    return `${Date.now()}-${uidCounter}`;
  }

  async function migrateLegacyUsers() {
    let changed = false;
    for (const user of users) {
      if (user.password && !user.passwordHash) {
        user.passwordHash = await hashPassword(user.password);
        delete user.password;
        changed = true;
      }
    }
    if (changed) write(KEYS.users, users);
  }

  async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) return '';
    const data = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
