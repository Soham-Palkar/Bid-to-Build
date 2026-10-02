from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db

class Admin(db.Model):
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(128), default='Campus Facilities Director')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(
        self,
        username: str,
        name: str = 'Campus Facilities Director',
        password_hash: str = '',
        id: int | None = None,
        created_at: datetime | None = None
    ):
        if id is not None:
            self.id = id
        self.username = username
        self.name = name
        self.password_hash = password_hash
        self.created_at = created_at or datetime.utcnow()

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
