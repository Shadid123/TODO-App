from flask import Blueprint, jsonify, session
from middleware.auth import login_required
from models.user import get_user_by_id

student_bp = Blueprint('student', __name__, url_prefix='/student')

@student_bp.route('/', methods=['GET'])
@login_required
def get_student_info():
    """
    Returns current student/user information as JSON
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'Student not found'}), 404
        
        student_info = {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'created_at': user['created_at'].isoformat() if user['created_at'] else None
        }
        
        return jsonify({
            'success': True,
            'student': student_info
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve student information',
            'details': str(e)
        }), 500
