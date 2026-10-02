import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root or parent directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'smartfix-default-dev-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f"sqlite:///{BASE_DIR / 'maintenance.db'}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Uploads
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', str(BASE_DIR / 'uploads'))
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 5 * 1024 * 1024)) # 5 MB default
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

    # SMTP Configuration
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    MAIL_FROM = os.getenv('MAIL_FROM', 'SmartFix Facilities <facilities@smartfix.campus.edu>')

    # CORS
    CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000').split(',') if origin.strip()]
