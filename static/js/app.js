let currentUser = null;
let todos = [];
let editingTaskId = null;
let deletingTaskId = null;

const PRIORITY_ORDER = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
const CATEGORY_CLASSES = {
    'Work': 'badge-cat-work', 'Personal': 'badge-cat-personal',
    'Shopping': 'badge-cat-shopping', 'Health': 'badge-cat-health',
    'Education': 'badge-cat-education', 'Other': 'badge-cat-other'
};
const PRIORITY_CLASSES = {
    'Low': 'badge-priority-low', 'Medium': 'badge-priority-medium',
    'High': 'badge-priority-high', 'Urgent': 'badge-priority-urgent'
};

document.addEventListener('DOMContentLoaded', async function () {
    await checkAuth();
    setupEventListeners();
    await loadTodos();
});

async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
            window.location.href = '/';
            return;
        }
        const data = await res.json();
        currentUser = data.user;
        document.getElementById('welcome-msg').textContent = 'Hello, ' + currentUser.username + '!';
    } catch (err) {
        window.location.href = '/';
    }
}

function setupEventListeners() {
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    });

    document.getElementById('add-task-btn').addEventListener('click', () => openModal());

    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveTask();
    });

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-task').addEventListener('click', closeModal);
    document.getElementById('cancel-delete').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.add('hidden');
        deletingTaskId = null;
    });
    document.getElementById('confirm-delete').addEventListener('click', async () => {
        if (deletingTaskId !== null) {
            await deleteTask(deletingTaskId);
            document.getElementById('confirm-modal').classList.add('hidden');
            deletingTaskId = null;
        }
    });

    document.querySelector('#task-modal .modal-overlay').addEventListener('click', closeModal);
    document.querySelector('#confirm-modal .modal-overlay').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.add('hidden');
        deletingTaskId = null;
    });

    ['filter-category', 'filter-priority', 'filter-completed', 'sort-by'].forEach(id => {
        document.getElementById(id).addEventListener('change', loadTodos);
    });
}

function getFilters() {
    return {
        category: document.getElementById('filter-category').value,
        priority: document.getElementById('filter-priority').value,
        completed: document.getElementById('filter-completed').value,
        sort_by: document.getElementById('sort-by').value
    };
}

async function loadTodos() {
    const filters = getFilters();
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.completed !== '') params.append('completed', filters.completed);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);

    try {
        const res = await fetch('/api/todos/' + (params.toString() ? '?' + params.toString() : ''));
        if (!res.ok) {
            if (res.status === 401) { window.location.href = '/'; return; }
            throw new Error('Failed to load');
        }
        const data = await res.json();
        todos = data.todos || [];
        renderTodos();
        renderStats();
    } catch (err) {
        document.getElementById('tasks-container').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load tasks. Please refresh.</p></div>';
    }
}

function formatDateStr(date) {
    return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
}

function getTodayStr() {
    return formatDateStr(new Date());
}

function getSoonStr() {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return formatDateStr(d);
}

function getDueDateStatus(dueDate) {
    if (!dueDate) return null;
    const today = getTodayStr();
    const soon = getSoonStr();
    if (dueDate < today) return 'overdue';
    if (dueDate <= soon) return 'due-soon';
    return null;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m-1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderTodos() {
    const container = document.getElementById('tasks-container');
    if (!todos.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No tasks found. Add your first task!</p></div>';
        return;
    }

    container.innerHTML = todos.map(task => {
        const dueDateStatus = getDueDateStatus(task.due_date);
        const cardClasses = [
            'task-card',
            'priority-' + task.priority.toLowerCase(),
            task.completed ? 'completed-task' : '',
            !task.completed && dueDateStatus === 'overdue' ? 'overdue' : '',
            !task.completed && dueDateStatus === 'due-soon' ? 'due-soon' : ''
        ].filter(Boolean).join(' ');

        const dueBadge = task.due_date ? `
            <span class="due-date-badge ${!task.completed && dueDateStatus ? dueDateStatus : ''}">
                📅 ${formatDate(task.due_date)}
                ${!task.completed && dueDateStatus === 'overdue' ? ' (Overdue)' : ''}
                ${!task.completed && dueDateStatus === 'due-soon' ? ' (Soon)' : ''}
            </span>` : '';

        return `
        <div class="${cardClasses}" data-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" title="Toggle completion">
            <div class="task-body">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="badge ${PRIORITY_CLASSES[task.priority] || ''}">${task.priority}</span>
                    <span class="badge ${CATEGORY_CLASSES[task.category] || ''}">${task.category}</span>
                    ${dueBadge}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-edit" data-id="${task.id}" title="Edit">✏️</button>
                <button class="btn-icon btn-delete" data-id="${task.id}" title="Delete">🗑️</button>
            </div>
        </div>`;
    }).join('');

    // Attach events
    container.querySelectorAll('.task-checkbox').forEach(cb => {
        cb.addEventListener('change', async (e) => {
            await toggleTask(parseInt(e.target.dataset.id));
        });
    });
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const task = todos.find(t => t.id === id);
            if (task) openModal(task);
        });
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deletingTaskId = parseInt(e.currentTarget.dataset.id);
            document.getElementById('confirm-modal').classList.remove('hidden');
        });
    });
}

function renderStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const overdue = todos.filter(t => !t.completed && getDueDateStatus(t.due_date) === 'overdue').length;
    const statsEl = document.getElementById('task-stats');
    statsEl.innerHTML = `
        <div class="stat-item">Total: <span>${total}</span></div>
        <div class="stat-item">Completed: <span>${completed}</span></div>
        <div class="stat-item">Active: <span>${total - completed}</span></div>
        ${overdue ? `<div class="stat-item">Overdue: <span style="color:var(--danger)">${overdue}</span></div>` : ''}
    `;
}

function openModal(task = null) {
    editingTaskId = task ? task.id : null;
    document.getElementById('modal-title').textContent = task ? 'Edit Task' : 'Add New Task';
    document.getElementById('task-id').value = task ? task.id : '';
    document.getElementById('task-title').value = task ? task.title : '';
    document.getElementById('task-description').value = task ? (task.description || '') : '';
    document.getElementById('task-category').value = task ? task.category : 'Other';
    document.getElementById('task-priority').value = task ? task.priority : 'Medium';
    document.getElementById('task-due-date').value = task ? (task.due_date || '') : '';
    document.getElementById('task-form-error').classList.add('hidden');
    document.getElementById('task-modal').classList.remove('hidden');
    document.getElementById('task-title').focus();
}

function closeModal() {
    document.getElementById('task-modal').classList.add('hidden');
    editingTaskId = null;
}

async function saveTask() {
    const errorEl = document.getElementById('task-form-error');
    errorEl.classList.add('hidden');
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
        errorEl.textContent = 'Title is required';
        errorEl.classList.remove('hidden');
        return;
    }
    const data = {
        title,
        description: document.getElementById('task-description').value.trim(),
        category: document.getElementById('task-category').value,
        priority: document.getElementById('task-priority').value,
        due_date: document.getElementById('task-due-date').value || null
    };
    try {
        let res;
        if (editingTaskId) {
            res = await fetch('/api/todos/' + editingTaskId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            res = await fetch('/api/todos/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        if (!res.ok) {
            const err = await res.json();
            errorEl.textContent = err.error || 'Failed to save task';
            errorEl.classList.remove('hidden');
            return;
        }
        closeModal();
        await loadTodos();
    } catch (err) {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.classList.remove('hidden');
    }
}

async function toggleTask(id) {
    try {
        const res = await fetch('/api/todos/' + id + '/toggle', { method: 'PUT' });
        if (!res.ok) throw new Error('Toggle failed');
        await loadTodos();
    } catch (err) {
        console.error('Toggle error:', err);
    }
}

async function deleteTask(id) {
    try {
        const res = await fetch('/api/todos/' + id, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        await loadTodos();
    } catch (err) {
        console.error('Delete error:', err);
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
