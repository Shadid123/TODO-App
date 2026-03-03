from flask import Flask, render_template, session
from config import Config
from routes.auth import auth_bp
from routes.todos import todos_bp

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = Config.SECRET_KEY

app.register_blueprint(auth_bp)
app.register_blueprint(todos_bp)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/app')
def dashboard():
    return render_template('app.html')

if __name__ == '__main__':
    app.run(debug=Config.DEBUG)
