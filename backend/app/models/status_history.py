from datetime import datetime
from ..extensions import db

class StatusHistory(db.Model):
    __tablename__ = 'status_history'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.String(64), db.ForeignKey('complaints.complaint_id'), nullable=False, index=True)
    old_status = db.Column(db.String(32), nullable=True)
    new_status = db.Column(db.String(32), nullable=False)
    changed_by = db.Column(db.String(128), default='System', nullable=False)
    notes = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    complaint = db.relationship('Complaint', back_populates='timeline_entries')

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'status': self.new_status,
            'changed_by': self.changed_by,
            'actor': self.changed_by,
            'notes': self.notes,
            'note': self.notes or f"Status transitioned to {self.new_status}.",
            'timestamp': self.created_at.strftime('%d %b %Y, %I:%M %p') if self.created_at else 'Just now',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
