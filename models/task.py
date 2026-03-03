from config import get_db_connection

def get_all_tasks(user_id, filters=None):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM tasks WHERE user_id = %s"
        params = [user_id]

        if filters:
            if filters.get('category'):
                query += " AND category = %s"
                params.append(filters['category'])
            if filters.get('priority'):
                query += " AND priority = %s"
                params.append(filters['priority'])
            if filters.get('completed') is not None:
                query += " AND completed = %s"
                params.append(filters['completed'])
            sort_by = filters.get('sort_by', 'created_at')
            allowed_sorts = ['due_date', 'priority', 'created_at', 'updated_at']
            if sort_by not in allowed_sorts:
                sort_by = 'created_at'
            if sort_by == 'priority':
                query += " ORDER BY FIELD(priority, 'Urgent', 'High', 'Medium', 'Low')"
            elif sort_by == 'due_date':
                query += " ORDER BY due_date IS NULL, due_date ASC"
            else:
                query += f" ORDER BY {sort_by} DESC"
        else:
            query += " ORDER BY created_at DESC"

        cursor.execute(query, params)
        tasks = cursor.fetchall()
        for task in tasks:
            if task.get('due_date'):
                task['due_date'] = task['due_date'].isoformat()
            if task.get('created_at'):
                task['created_at'] = task['created_at'].isoformat()
            if task.get('updated_at'):
                task['updated_at'] = task['updated_at'].isoformat()
            task['completed'] = bool(task['completed'])
        return tasks
    except Exception as e:
        raise e
    finally:
        if conn:
            conn.close()

def get_task_by_id(task_id, user_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
        task = cursor.fetchone()
        if task:
            if task.get('due_date'):
                task['due_date'] = task['due_date'].isoformat()
            if task.get('created_at'):
                task['created_at'] = task['created_at'].isoformat()
            if task.get('updated_at'):
                task['updated_at'] = task['updated_at'].isoformat()
            task['completed'] = bool(task['completed'])
        return task
    except Exception as e:
        raise e
    finally:
        if conn:
            conn.close()

def create_task(user_id, data):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO tasks (user_id, title, description, category, priority, due_date)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                user_id,
                data.get('title'),
                data.get('description', ''),
                data.get('category', 'Other'),
                data.get('priority', 'Medium'),
                data.get('due_date') or None
            )
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

def update_task(task_id, user_id, data):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        fields = []
        params = []
        allowed_fields = ['title', 'description', 'category', 'priority', 'due_date', 'completed']
        for field in allowed_fields:
            if field in data:
                fields.append(f"{field} = %s")
                # Treat empty string as NULL for due_date
                if field == 'due_date' and data[field] == '':
                    params.append(None)
                else:
                    params.append(data[field])
        if not fields:
            return False
        params.extend([task_id, user_id])
        query = f"UPDATE tasks SET {', '.join(fields)} WHERE id = %s AND user_id = %s"
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

def delete_task(task_id, user_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

def toggle_task(task_id, user_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET completed = NOT completed WHERE id = %s AND user_id = %s",
            (task_id, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()
