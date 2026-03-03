from flask import Blueprint, request, jsonify, session
from models.task import get_all_tasks, get_task_by_id, create_task, update_task, delete_task, toggle_task
from middleware.auth import login_required

todos_bp = Blueprint('todos', __name__, url_prefix='/api/todos')

@todos_bp.route('/', methods=['GET'])
@login_required
def get_todos():
    user_id = session['user_id']
    filters = {}
    category = request.args.get('category')
    priority = request.args.get('priority')
    sort_by = request.args.get('sort_by', 'created_at')
    completed = request.args.get('completed')
    if category:
        filters['category'] = category
    if priority:
        filters['priority'] = priority
    if sort_by:
        filters['sort_by'] = sort_by
    if completed is not None:
        filters['completed'] = completed.lower() == 'true'
    try:
        tasks = get_all_tasks(user_id, filters)
        return jsonify({'todos': tasks}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch todos', 'details': str(e)}), 500

@todos_bp.route('/', methods=['POST'])
@login_required
def create_todo():
    user_id = session['user_id']
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    if len(title) > 200:
        return jsonify({'error': 'Title must be 200 characters or less'}), 400
    try:
        task_id = create_task(user_id, data)
        task = get_task_by_id(task_id, user_id)
        return jsonify({'message': 'Todo created', 'todo': task}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to create todo', 'details': str(e)}), 500

@todos_bp.route('/<int:task_id>', methods=['PUT'])
@login_required
def update_todo(task_id):
    user_id = session['user_id']
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    if 'title' in data:
        title = data.get('title', '').strip()
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        if len(title) > 200:
            return jsonify({'error': 'Title must be 200 characters or less'}), 400
        data['title'] = title
    try:
        updated = update_task(task_id, user_id, data)
        if not updated:
            return jsonify({'error': 'Todo not found or not authorized'}), 404
        task = get_task_by_id(task_id, user_id)
        return jsonify({'message': 'Todo updated', 'todo': task}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to update todo', 'details': str(e)}), 500

@todos_bp.route('/<int:task_id>', methods=['DELETE'])
@login_required
def delete_todo(task_id):
    user_id = session['user_id']
    try:
        deleted = delete_task(task_id, user_id)
        if not deleted:
            return jsonify({'error': 'Todo not found or not authorized'}), 404
        return jsonify({'message': 'Todo deleted'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to delete todo', 'details': str(e)}), 500

@todos_bp.route('/<int:task_id>/toggle', methods=['PUT'])
@login_required
def toggle_todo(task_id):
    user_id = session['user_id']
    try:
        toggled = toggle_task(task_id, user_id)
        if not toggled:
            return jsonify({'error': 'Todo not found or not authorized'}), 404
        task = get_task_by_id(task_id, user_id)
        return jsonify({'message': 'Todo toggled', 'todo': task}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to toggle todo', 'details': str(e)}), 500
