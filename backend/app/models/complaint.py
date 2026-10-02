import os
from datetime import datetime
from ..extensions import db

class Complaint(db.Model):
    __tablename__ = 'complaints'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    category = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text, nullable=False)
    photo_path = db.Column(db.String(256), nullable=True)
    photo_filename = db.Column(db.String(128), nullable=True)
    photo_size = db.Column(db.String(32), nullable=True)

    location_id = db.Column(db.String(32), db.ForeignKey('locations.location_id'), nullable=False, index=True)
    detected_location_id = db.Column(db.String(32), nullable=True)

    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    altitude_m = db.Column(db.Float, nullable=True)
    location_verified = db.Column(db.Boolean, default=False, nullable=False)
    gps_distance_m = db.Column(db.Float, nullable=True)
    gps_radius_m = db.Column(db.Float, default=5.0, nullable=False)

    priority = db.Column(db.String(32), default='Medium', nullable=False)
    priority_score = db.Column(db.Integer, default=50, nullable=False)
    priority_reason = db.Column(db.String(256), nullable=True)
    detected_keywords = db.Column(db.String(256), nullable=True)

    is_recurring = db.Column(db.Boolean, default=False, nullable=False)
    previous_complaint_count = db.Column(db.Integer, default=0, nullable=False)

    assigned_worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=True)

    status = db.Column(db.String(32), default='Reported', nullable=False)

    confirmation_email_sent = db.Column(db.Boolean, default=False, nullable=False)
    confirmation_email_error = db.Column(db.String(256), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='complaints')
    location = db.relationship('Location', back_populates='complaints', foreign_keys=[location_id])
    assigned_worker = db.relationship('Worker', back_populates='complaints')
    timeline_entries = db.relationship(
        'StatusHistory',
        back_populates='complaint',
        order_by='StatusHistory.created_at.asc()',
        cascade='all, delete-orphan',
        lazy='joined'
    )

    def to_dict(self):
        # Format photo URL to point directly to backend uploads endpoint
        photo_url = None
        if self.photo_filename:
            photo_url = f"http://localhost:5000/uploads/{self.photo_filename}"
        elif self.photo_path:
            if self.photo_path.startswith(('http://', 'https://', 'data:')):
                photo_url = self.photo_path
            else:
                fname = os.path.basename(self.photo_path)
                photo_url = f"http://localhost:5000/uploads/{fname}"

        loc = self.location
        user = self.user
        worker = self.assigned_worker

        keywords = [k.strip() for k in self.detected_keywords.split(',')] if self.detected_keywords else []

        location_details = {
            'building': loc.building if loc else 'Xavier Institute of Engineering',
            'floor': f"Floor {loc.floor}" if loc else 'Floor 1',
            'room': loc.room if loc else 'Unknown Room',
            'name': loc.location_name if loc else 'Campus Location',
            'latitude': self.latitude,
            'longitude': self.longitude,
            'altitude_m': self.altitude_m,
            'verified': self.location_verified,
            'distance_m': self.gps_distance_m,
            'radius_m': self.gps_radius_m,
            'location_id': self.location_id
        }

        # Structured GPS metadata block
        has_gps = self.latitude is not None and self.longitude is not None
        gps_info = {
            "available": has_gps,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "altitude_m": self.altitude_m,
            "distance_m": self.gps_distance_m,
            "radius_m": self.gps_radius_m,
            "verified": self.location_verified,
            "detected_location_id": self.detected_location_id
        }

        # Format timeline from status history
        timeline = [entry.to_dict() for entry in self.timeline_entries] if self.timeline_entries else []
        if not timeline:
            timeline = [{
                'status': self.status,
                'timestamp': self.created_at.strftime('%d %b %Y, %I:%M %p') if self.created_at else 'Just now',
                'note': 'Complaint submitted and registered in system.',
                'actor': 'System'
            }]

        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'category': self.category,
            'description': self.description,
            'photo_url': photo_url,
            'photo_filename': self.photo_filename,
            'photo_size': self.photo_size or '1.5 MB',
            'user': user.to_dict() if user else {
                'id': 'Unknown',
                'name': 'Unknown Reporter',
                'email': 'unknown@campus.edu'
            },
            'location': location_details,
            'location_id': self.location_id,
            'gps': gps_info,
            'priority': self.priority,
            'priority_score': self.priority_score,
            'priority_reason': self.priority_reason or 'Automated safety assessment',
            'detected_keywords': keywords,
            'priority_source': 'Safety Rule Engine',
            'is_recurring': self.is_recurring,
            'previous_complaint_count': self.previous_complaint_count,
            'cluster_id': f"#CL-{self.location_id}-{self.category[:4].upper()}" if self.is_recurring else None,
            'advisory': f"Recurring {self.category} issues detected at {loc.location_name if loc else self.location_id}. Technical root-cause inspection advised." if self.is_recurring else None,
            'assigned_worker': worker.to_dict() if worker else None,
            'email_sent': self.confirmation_email_sent,
            'confirmation_email_sent': self.confirmation_email_sent,
            'confirmation_email_error': self.confirmation_email_error,
            'status': self.status,
            'timeline': timeline,
            'created_at': self.created_at.strftime('%d %b %Y, %I:%M %p') if self.created_at else 'Just now',
            'updated_at': self.updated_at.strftime('%d %b %Y, %I:%M %p') if self.updated_at else 'Just now'
        }
