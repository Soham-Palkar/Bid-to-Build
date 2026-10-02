from . import create_app
from .extensions import db
from .seed import seed_database

def reset_database():
    """
    Safely resets development SQLite database, drops old tables, creates schema, and runs seed script.
    """
    app = create_app()
    with app.app_context():
        print("[!] Resetting SmartFix SQLite Database...")
        db.drop_all()
        print("[+] Dropped all existing tables.")
        seed_database()

if __name__ == '__main__':
    reset_database()
