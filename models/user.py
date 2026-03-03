from config import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash

def create_user(username, email, password):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (username, email, password_hash)
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

def get_user_by_username(username):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        return cursor.fetchone()
    except Exception as e:
        raise e
    finally:
        if conn:
            conn.close()

def get_user_by_id(user_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()
    except Exception as e:
        raise e
    finally:
        if conn:
            conn.close()

def get_user_by_email(email):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    except Exception as e:
        raise e
    finally:
        if conn:
            conn.close()

def verify_password(user, password):
    return check_password_hash(user['password_hash'], password)
