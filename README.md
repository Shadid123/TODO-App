# TodoApp

A full-featured Todo application built with Express.js, MySQL, and Vanilla JavaScript.

## 📋 Project Structure

```
TODO-App/
├── backend/                 # Node.js Express backend
│   ├── server.js           # Main Express application
│   ├── config.js           # Database configuration
│   ├── package.json        # Node dependencies
│   ├── .env.example        # Environment variables template
│   ├── models/             # Database models
│   │   ├── user.js
│   │   └── task.js
│   ├── routes/             # API route handlers
│   │   ├── auth.js
│   │   ├── todos.js
│   │   └── student.js
│   └── middleware/         # Express middleware
│       └── auth.js
├── frontend/               # Frontend assets
│   ├── index.html         # Login/Register page
│   ├── app.html           # Main dashboard
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       └── app.js
└── others/                 # Database and configuration files
    └── db/
        └── schema.sql
```

## ✨ Features

- ✅ **Full CRUD Operations** - Create, read, update, and delete tasks
- 🔐 **User Authentication** - Register, login, logout with session-based auth
- 🏷️ **Categories** - Work, Personal, Shopping, Health, Education, Other
- 🎯 **Priorities** - Low, Medium, High, Urgent with color coding
- 📅 **Due Dates** - Visual indicators for overdue and upcoming tasks
- 🔍 **Filters & Sorting** - Filter by category, priority, completion; sort by date or priority
- 📱 **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js (Express.js)
- **Database**: MySQL (via mysql2)
- **Authentication**: Session-based (bcryptjs)

## 📦 Setup Instructions

### Prerequisites
- Node.js 14+
- MySQL 5.7+ or 8.0+
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd TODO-App
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Set up the database
```bash
mysql -u root -p < ../others/db/schema.sql
```

### 5. Run the application
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

Open http://localhost:5000 in your browser.

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/logout | Logout user |
| GET | /api/auth/me | Get current user info |

### Todos (CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/todos/ | Get all todos (with filters) |
| GET | /api/todos/:id | Get a specific todo by ID |
| POST | /api/todos/ | Create a new todo |
| PUT | /api/todos/:id | Update a todo |
| DELETE | /api/todos/:id | Delete a todo |
| PUT | /api/todos/:id/toggle | Toggle completion status |

### Student Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /student/ | Get current student/user information |

## 🔍 Query Parameters for Todos

### GET /api/todos/

Available filters:

```
?category=Work                    # Filter by category
?priority=High                    # Filter by priority
?completed=true                   # Filter by completion status
?sort_by=priority                 # Sort by field (default: created_at)
?order=ASC                        # Sort order: ASC or DESC
```

### Examples

```
GET /api/todos/?category=Work&priority=High
GET /api/todos/?completed=false&sort_by=due_date&order=ASC
```

## 💻 Frontend Usage Examples

### Register a new user
```javascript
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123'
  })
}).then(res => res.json()).then(data => console.log(data));
```

### Login
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    username: 'john_doe',
    password: 'password123'
  })
}).then(res => res.json()).then(data => console.log(data));
```

### Create a todo
```javascript
fetch('http://localhost:5000/api/todos/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    category: 'Shopping',
    priority: 'Medium',
    due_date: '2026-05-20'
  })
}).then(res => res.json()).then(data => console.log(data));
```

### Get all todos
```javascript
fetch('http://localhost:5000/api/todos/?category=Work&priority=High', {
  credentials: 'include'
}).then(res => res.json()).then(data => console.log(data));
```

### Get single todo
```javascript
fetch('http://localhost:5000/api/todos/1', {
  credentials: 'include'
}).then(res => res.json()).then(data => console.log(data));
```

### Update a todo
```javascript
fetch('http://localhost:5000/api/todos/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Updated title',
    completed: true
  })
}).then(res => res.json()).then(data => console.log(data));
```

### Delete a todo
```javascript
fetch('http://localhost:5000/api/todos/1', {
  method: 'DELETE',
  credentials: 'include'
}).then(res => res.json()).then(data => console.log(data));
```

### Toggle todo completion
```javascript
fetch('http://localhost:5000/api/todos/1/toggle', {
  method: 'PUT',
  credentials: 'include'
}).then(res => res.json()).then(data => console.log(data));
```

### Get student info
```javascript
fetch('http://localhost:5000/student/', {
  method: 'GET',
  credentials: 'include'
}).then(res => res.json()).then(data => console.log(data.student));
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    category ENUM('Work', 'Personal', 'Shopping', 'Health', 'Education', 'Other') DEFAULT 'Other',
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_priority (priority),
    INDEX idx_category (category),
    INDEX idx_due_date (due_date)
);
```

## 🧪 Testing with Postman

### Setup

1. Import the Postman collection (if available)
2. Set base URL: `http://localhost:5000`
3. Test endpoints in this order:
   - Register → Login → Create Todo → Get Todos → Update Todo → Delete Todo

## 🚀 Production Deployment

1. Set `DEBUG=false` in `.env`
2. Use a strong `SECRET_KEY`
3. Configure proper database credentials
4. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name "todo-app"
   ```
5. Set up environment variables on the server
6. Use a reverse proxy (nginx) for SSL/TLS

## 📝 Environment Variables

Create `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=todo_app

# Server Configuration
PORT=5000
SECRET_KEY=your-secret-key-here
DEBUG=true
```

## 🤝 Contributing

Feel free to fork and submit pull requests for any improvements.

## 📄 License

ISC
