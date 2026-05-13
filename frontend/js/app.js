const API_URL = 'http://localhost:5000';

// Load user info and todos on page load
async function loadPage() {
    await loadUserInfo();
    await loadTodos();
}

async function loadUserInfo() {
    try {
        const response = await fetch(`${API_URL}/student/`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '/';
            return;
        }

        const data = await response.json();
        if (data.success) {
            const userInfo = document.getElementById('user-info');
            userInfo.innerHTML = `
                <strong>${data.student.username}</strong><br>
                ${data.student.email}
            `;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

async function loadTodos() {
    try {
        const category = document.getElementById('filter-category').value;
        const priority = document.getElementById('filter-priority').value;
        const completed = document.getElementById('filter-status').value;

        let url = `${API_URL}/api/todos/?`;
        if (category) url += `category=${category}&`;
        if (priority) url += `priority=${priority}&`;
        if (completed !== '') url += `completed=${completed}&`;

        const response = await fetch(url, {
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
            displayTodos(data.todos);
        }
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

function displayTodos(todos) {
    const container = document.getElementById('todos-list');
    if (todos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No todos found. Create one!</p>';
        return;
    }

    container.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'todo-completed' : ''}">
            <div class="todo-content">
                <h3>${todo.title}</h3>
                ${todo.description ? `<p>${todo.description}</p>` : ''}
                <div class="todo-meta">
                    <span class="badge badge-${todo.category.toLowerCase()}">${todo.category}</span>
                    <span class="priority-${todo.priority.toLowerCase()}">${todo.priority}</span>
                    ${todo.due_date ? `<span>${todo.due_date}</span>` : ''}
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn-small btn-toggle" onclick="toggleTodo(${todo.id})">Toggle</button>
                <button class="btn-small btn-delete" onclick="deleteTodo(${todo.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function createTodo() {
    const title = document.getElementById('todo-title').value;
    const description = document.getElementById('todo-description').value;
    const category = document.getElementById('todo-category').value;
    const priority = document.getElementById('todo-priority').value;
    const due_date = document.getElementById('todo-due-date').value;

    if (!title) {
        alert('Please enter a title');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/todos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title, description, category, priority, due_date })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('todo-title').value = '';
            document.getElementById('todo-description').value = '';
            document.getElementById('todo-due-date').value = '';
            await loadTodos();
        } else {
            alert(data.error || 'Failed to create todo');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function toggleTodo(id) {
    try {
        const response = await fetch(`${API_URL}/api/todos/${id}/toggle`, {
            method: 'PUT',
            credentials: 'include'
        });

        if (response.ok) {
            await loadTodos();
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
        const response = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            await loadTodos();
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function applyFilters() {
    loadTodos();
}

async function logout() {
    try {
        await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/';
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Load on page load
window.addEventListener('load', loadPage);
