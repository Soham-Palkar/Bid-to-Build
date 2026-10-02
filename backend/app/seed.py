import os
import csv
from datetime import datetime, timedelta
from pathlib import Path

from . import create_app
from .extensions import db
from .models import Location, Admin, Worker, User, Complaint, StatusHistory

DATA_DIR = Path(__file__).resolve().parent.parent / 'data'

def seed_database():
    app = create_app()
    with app.app_context():
        print("[*] Seeding SmartFix Database...")

        # 1. Create all tables if not exist
        db.create_all()

        # 2. Seed Campus Locations from CSV
        locations_csv = DATA_DIR / 'campus_locations.csv'
        if locations_csv.exists():
            with open(locations_csv, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    loc_id = row['location_id'].strip()
                    loc = Location.query.filter_by(location_id=loc_id).first()
                    if not loc:
                        loc = Location(
                            location_id=loc_id,
                            building=row['building'].strip(),
                            floor=int(row['floor']),
                            room=row['room'].strip(),
                            location_name=row['location_name'].strip(),
                            latitude=float(row['latitude']),
                            longitude=float(row['longitude']),
                            radius_m=float(row.get('radius_m', 20.0))
                        )
                        db.session.add(loc)
            db.session.commit()
            print("[+] Campus locations imported from campus_locations.csv")

        # 3. Seed Admin User
        admin = Admin.query.filter_by(username='admin').first()
        if not admin:
            admin = Admin(
                username='admin',
                name='Campus Facilities Director'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("[+] Default Admin account created (username: admin, password: admin123)")

        # 4. Seed Maintenance Workers with Configurable Real Inboxes
        primary_email = os.environ.get('SMTP_USERNAME', '202403047.sohamgpp@student.xavier.ac.in')
        workers_data = [
            {
                "name": "Raj Patil",
                "email": os.environ.get('WORKER_EMAIL_1', primary_email),
                "specialization": "Electrical",
                "phone": "+91 98200 11223",
                "license": "LIC-ELE-8821",
                "duty_id": "DUTY-W01"
            },
            {
                "name": "Amit Shah",
                "email": os.environ.get('WORKER_EMAIL_2', primary_email),
                "specialization": "Plumbing",
                "phone": "+91 98200 44556",
                "license": "LIC-PLU-4012",
                "duty_id": "DUTY-W02"
            },
            {
                "name": "Neha Joshi",
                "email": os.environ.get('WORKER_EMAIL_3', primary_email),
                "specialization": "HVAC",
                "phone": "+91 98200 77889",
                "license": "LIC-HVA-6503",
                "duty_id": "DUTY-W03"
            }
        ]

        for w_data in workers_data:
            worker = Worker.query.filter_by(name=w_data['name']).first()
            if not worker:
                worker = Worker(
                    name=w_data['name'],
                    email=w_data['email'],
                    specialization=w_data['specialization'],
                    phone=w_data['phone'],
                    license=w_data['license'],
                    duty_id=w_data['duty_id']
                )
                db.session.add(worker)
            else:
                worker.email = w_data['email']
                worker.specialization = w_data['specialization']
        db.session.commit()
        print(f"[+] Maintenance specialists created/updated with active inboxes ({primary_email})")

        # 5. Seed Historical Complaints for Recurrence Demonstration
        complaints_csv = DATA_DIR / 'seed_complaints.csv'
        if complaints_csv.exists():
            with open(complaints_csv, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                idx = 0
                for row in reader:
                    cid = row['complaint_id'].strip()
                    existing_c = Complaint.query.filter_by(complaint_id=cid).first()
                    if existing_c:
                        continue

                    # Create or find reporter
                    u_ident = row.get('user_identifier', f"STU{idx+1}").strip()
                    u_name = row.get('user_name', f"Student {idx+1}").strip()
                    u_email = row.get('user_email', f"student{idx+1}@campus.edu").strip()

                    user = User.query.filter_by(email=u_email).first()
                    if not user:
                        user = User(user_identifier=u_ident, name=u_name, email=u_email)
                        db.session.add(user)
                        db.session.flush()

                    loc_id = row['location_id'].strip()
                    cat = row['category'].strip()

                    created_dt = datetime.utcnow() - timedelta(days=14 - idx, hours=idx * 2)

                    complaint = Complaint(
                        complaint_id=cid,
                        user_id=user.id,
                        category=cat,
                        description=row['description'].strip(),
                        location_id=loc_id,
                        latitude=19.045266 if loc_id == 'LOC001' else 19.045216,
                        longitude=72.841845 if loc_id == 'LOC001' else 72.841769,
                        location_verified=True,
                        priority=row.get('priority', 'High').strip(),
                        priority_score=75 if row.get('priority') == 'High' else 50,
                        priority_reason=row.get('priority_reason', 'Historical logged complaint').strip(),
                        is_recurring=False,
                        previous_complaint_count=0,
                        status=row.get('status', 'Resolved').strip(),
                        confirmation_email_sent=True,
                        created_at=created_dt,
                        updated_at=created_dt + timedelta(hours=4)
                    )
                    db.session.add(complaint)

                    # Add status history
                    sh1 = StatusHistory(
                        complaint_id=cid,
                        old_status=None,
                        new_status='Reported',
                        changed_by='System',
                        notes='Initial complaint reported by student.',
                        created_at=created_dt
                    )
                    sh2 = StatusHistory(
                        complaint_id=cid,
                        old_status='Reported',
                        new_status='Resolved',
                        changed_by='Admin',
                        notes='Historical maintenance work resolved.',
                        created_at=created_dt + timedelta(hours=4)
                    )
                    db.session.add_all([sh1, sh2])
                    idx += 1

            db.session.commit()
            print("[+] Historical seed complaints loaded (at least 3 at LOC001 and 3 at LOC004)")

        print("[+] Database seeding complete! Ready for live demonstration.")

if __name__ == '__main__':
    seed_database()
