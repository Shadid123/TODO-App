from flask import Blueprint, request, jsonify, session
from models.user import create_user, get_user_by_username, get_user_by_email, get_user_by_id, verify_password
from middleware.auth import login_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    if not username or not email or not password:
        return jsonify({'error': 'Username, email and password are required'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    # Validate email format: must have exactly one @, with non-empty local and domain parts
    at_idx = email.find('@')
    if at_idx <= 0 or at_idx == len(email) - 1 or '.' not in email[at_idx:] or email.endswith('.'):
        return jsonify({'error': 'Invalid email address'}), 400
    try:
        if get_user_by_username(username):
            return jsonify({'error': 'Username already exists'}), 409
        if get_user_by_email(email):
            return jsonify({'error': 'Email already registered'}), 409
        user_id = create_user(username, email, password)
        session['user_id'] = user_id
        session['username'] = username
        return jsonify({'message': 'Registration successful', 'user': {'id': user_id, 'username': username, 'email': email}}), 201
    except Exception as e:
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    try:
        user = get_user_by_username(username)
        if not user or not verify_password(user, password):
            return jsonify({'error': 'Invalid username or password'}), 401
        session['user_id'] = user['id']
        session['username'] = user['username']
        return jsonify({'message': 'Login successful', 'user': {'id': user['id'], 'username': user['username'], 'email': user['email']}}), 200
    except Exception as e:
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@login_required
def me():
    try:
        user = get_user_by_id(session['user_id'])
        if not user:
            session.clear()
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'user': {'id': user['id'], 'username': user['username'], 'email': user['email']}}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get user info', 'details': str(e)}), 500
