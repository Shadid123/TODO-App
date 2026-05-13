# TodoApp

A full-featured Todo application built with Node.js, Express, MySQL, and Vanilla JavaScript.

## Features

- ✅ **Full CRUD** - Create, read, update, and delete tasks
- 🔐 **User Authentication** - Register, login, and logout with session-based auth
- 🏷️ **Categories** - Work, Personal, Shopping, Health, Education, Other
- 🎯 **Priorities** - Low, Medium, High, Urgent with color coding
- 📅 **Due Dates** - Visual indicators for overdue and upcoming tasks
- 🔍 **Filters & Sorting** - Filter by category, priority, completion; sort by date or priority
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js (Express)
- **Database**: MySQL (via mysql2)

## Project Structure

```
TODO-App/
├── server.js            # Main Express application
├── config.js            # Configuration & DB/session setup
├── package.json         # Node dependencies
├── .env.example         # Environment variable template
├── db/
│   └── schema.sql       # Database schema
├── models/
│   ├── user.js
│   └── task.js
├── routes/
│   ├── auth.js
│   ├── todos.js
│   └── student.js
├── middleware/
│   └── auth.js
├── static/              # Frontend assets
│   ├── css/style.css
│   └── js/
│       ├── auth.js
│       └── app.js
└── templates/           # HTML templates
    ├── index.html
    └── app.html
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 5.7+ or 8.0+

### 1. Clone the repository
```bash
git clone <repository-url>
cd TODO-App
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Set up the database
```bash
mysql -u root -p < db/schema.sql
```

### 5. Run the application
```bash
npm start
```

Open http://localhost:5000 in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user info |
| GET | /api/todos/ | Get all todos (with filters) |
| POST | /api/todos/ | Create a new todo |
| PUT | /api/todos/<id> | Update a todo |
| DELETE | /api/todos/<id> | Delete a todo |
| PUT | /api/todos/<id>/toggle | Toggle completion status |
| GET | /student/ | Get student info |

## Query Parameters for GET /api/todos/

- `category` - Filter by category (Work, Personal, Shopping, Health, Education, Other)
- `priority` - Filter by priority (Low, Medium, High, Urgent)
- `completed` - Filter by completion (true/false)
- `sort_by` - Sort by field (created_at, due_date, priority)
