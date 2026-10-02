from datetime import datetime
from ..extensions import db

class Worker(db.Model):
    __tablename__ = 'workers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), nullable=False)
    specialization = db.Column(db.String(64), nullable=False)
    phone = db.Column(db.String(32), nullable=True)
    license = db.Column(db.String(64), nullable=True)
    duty_id = db.Column(db.String(32), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    complaints = db.relationship('Complaint', back_populates='assigned_worker', lazy='dynamic')

    def __init__(
        self,
        name: str,
        email: str,
        specialization: str,
        phone: str | None = None,
        license: str | None = None,
        duty_id: str | None = None,
        id: int | None = None,
        created_at: datetime | None = None
    ):
        if id is not None:
            self.id = id
        self.name = name
        self.email = email
        self.specialization = specialization
        self.phone = phone
        self.license = license
        self.duty_id = duty_id
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        # Calculate active jobs count dynamically
        try:
            from .complaint import Complaint
            active_count = self.complaints.filter(
                db.not_(db.func.lower(Complaint.status) == 'resolved')
            ).count()
        except Exception:
            active_count = 0

        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'specialization': self.specialization,
            'phone': self.phone,
            'license': self.license or f"LIC-{self.specialization[:3].upper()}-{100 + self.id}",
            'duty_id': self.duty_id or f"DUTY-W{self.id:02d}",
            'active_jobs': active_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
