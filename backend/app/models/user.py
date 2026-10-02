from datetime import datetime
from ..extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_identifier = db.Column(db.String(64), nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    complaints = db.relationship('Complaint', back_populates='user', lazy='dynamic')

    def __init__(
        self,
        user_identifier: str,
        name: str,
        email: str,
        id: int | None = None,
        created_at: datetime | None = None
    ):
        if id is not None:
            self.id = id
        self.user_identifier = user_identifier
        self.name = name
        self.email = email
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'user_identifier': self.user_identifier,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
