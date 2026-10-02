from ..extensions import db

class Location(db.Model):
    __tablename__ = 'locations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    location_id = db.Column(db.String(32), unique=True, nullable=False, index=True)
    building = db.Column(db.String(128), nullable=False)
    floor = db.Column(db.Integer, nullable=False)
    room = db.Column(db.String(64), nullable=False)
    location_name = db.Column(db.String(128), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    radius_m = db.Column(db.Float, default=20.0, nullable=False)

    complaints = db.relationship('Complaint', back_populates='location', foreign_keys='Complaint.location_id', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'location_id': self.location_id,
            'building': self.building,
            'floor': self.floor,
            'room': self.room,
            'location_name': self.location_name,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'radius_m': self.radius_m
        }
