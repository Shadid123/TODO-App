import os
import logging
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

_DEFAULT_SECRET = 'dev-secret-key-change-in-production'

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', _DEFAULT_SECRET)
    if SECRET_KEY == _DEFAULT_SECRET:
        logging.warning("WARNING: Using default SECRET_KEY. Set a strong SECRET_KEY in production!")
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = int(os.environ.get('DB_PORT', 3306))
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    DB_NAME = os.environ.get('DB_NAME', 'todo_app')

def get_db_connection():
    conn = mysql.connector.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME
    )
    return conn
