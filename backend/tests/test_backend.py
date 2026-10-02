import pytest
from sqlalchemy.pool import StaticPool
from app import create_app
from app.extensions import db
from app.models import User, Location, Admin, Worker, Complaint, StatusHistory
from app.services.priority_service import detect_priority
from app.services.location_service import verify_complaint_location, haversine_distance
from app.services.recurrence_service import check_recurrence
from app.services.exif_service import extract_gps_from_image

@pytest.fixture
def app():
    app = create_app(test_config={
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite://',
        'SQLALCHEMY_ENGINE_OPTIONS': {
            'connect_args': {'check_same_thread': False},
            'poolclass': StaticPool
        },
        'UPLOAD_FOLDER': 'test_uploads'
    })

    with app.app_context():
        db.create_all()

        # Seed locations
        loc1 = Location(
            location_id='LOC001',
            building='Xavier Institute of Engineering',
            floor=1,
            room='DB Lab',
            location_name='First Floor DB Lab',
            latitude=19.045266,
            longitude=72.841845,
            radius_m=20.0
        )
        loc2 = Location(
            location_id='LOC002',
            building='Xavier Institute of Engineering',
            floor=1,
            room='CC Lab',
            location_name='First Floor CC Lab',
            latitude=19.045009,
            longitude=72.842012,
            radius_m=20.0
        )
        loc3 = Location(
            location_id='LOC004',
            building='Xavier Institute of Engineering',
            floor=1,
            room="Men's Washroom",
            location_name="First Floor Men's Washroom",
            latitude=19.045216,
            longitude=72.841769,
            radius_m=20.0
        )
        db.session.add_all([loc1, loc2, loc3])

        # Seed Admin
        admin = Admin(username='admin', name='Test Admin')
        admin.set_password('admin123')
        db.session.add(admin)

        # Seed Worker
        worker = Worker(
            name='Raj Patil',
            email='raj.patil@campus.edu',
            specialization='Electrical',
            phone='+91 98200 11223'
        )
        db.session.add(worker)

        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_check(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['status'] == 'healthy'

def test_get_locations(client):
    res = client.get('/api/locations')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert len(data['data']) >= 3
    assert data['data'][0]['location_id'] == 'LOC001'

def test_priority_engine():
    # Critical checks
    crit1 = detect_priority('Electrical', 'Sparking from exposed wire near DB Lab')
    assert crit1['priority'] == 'Critical'
    assert crit1['score'] >= 90
    assert any(k in crit1['detected_keywords'] for k in ['sparking', 'exposed wire'])

    # High checks
    high1 = detect_priority('Plumbing', 'Major water leakage in washroom')
    assert high1['priority'] == 'High'

    # Medium checks
    med1 = detect_priority('HVAC', 'Fan not working in classroom')
    assert med1['priority'] == 'Medium'

    # Low checks
    low1 = detect_priority('Civil / Infrastructure', 'Paint peeling on wall')
    assert low1['priority'] == 'Low'

def test_location_verification(app):
    with app.app_context():
        # Same coordinates as LOC001
        geo_exact = verify_complaint_location('LOC001', 19.045266, 72.841845)
        assert geo_exact['verified'] is True
        assert geo_exact['distance_m'] < 5.0

        # Distant coordinates
        geo_far = verify_complaint_location('LOC001', 19.055000, 72.855000)
        assert geo_far['verified'] is False
        assert geo_far['distance_m'] > 100.0

def test_complaint_submission_and_tracking(client):
    # 1. Submit complaint
    payload = {
        'user_id': 'TEIT30',
        'name': 'Soham',
        'email': 'soham@example.com',
        'category': 'Electrical',
        'location_id': 'LOC001',
        'description': 'Sparking from exposed wire near DB Lab switchboard',
        'gps_mode': 'verified'
    }

    res = client.post('/api/complaints', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    complaint_id = data['complaint_id']
    assert complaint_id.startswith('COM-')
    assert data['priority'] == 'Critical'
    assert data['location']['verified'] is True

    # 2. Track complaint with correct email
    track_res = client.post('/api/complaints/track', json={
        'complaint_id': complaint_id,
        'email': 'soham@example.com'
    })
    assert track_res.status_code == 200
    track_data = track_res.get_json()
    assert track_data['complaint_id'] == complaint_id
    assert track_data['status'] == 'Reported'
    assert len(track_data['timeline']) >= 1

    # 3. Track with wrong email should fail (403)
    wrong_track = client.post('/api/complaints/track', json={
        'complaint_id': complaint_id,
        'email': 'wrong@example.com'
    })
    assert wrong_track.status_code == 403

def test_recurrence_detection(client):
    # Seed 3 prior complaints at LOC001 for Electrical
    for i in range(3):
        res = client.post('/api/complaints', json={
            'user_id': f'STU{i+1}',
            'name': f'Student {i+1}',
            'email': f'student{i+1}@campus.edu',
            'category': 'Electrical',
            'location_id': 'LOC001',
            'description': f'Historical electrical issue {i+1}',
            'gps_mode': 'verified'
        })
        assert res.status_code == 201

    # Now 4th complaint at LOC001 for Electrical should be flagged recurring
    res4 = client.post('/api/complaints', json={
        'user_id': 'TEIT30',
        'name': 'Soham',
        'email': 'soham@example.com',
        'category': 'Electrical',
        'location_id': 'LOC001',
        'description': 'Sparking from exposed wire near DB Lab',
        'gps_mode': 'verified'
    })
    assert res4.status_code == 201
    data4 = res4.get_json()
    assert data4['is_recurring'] is True
    assert data4['previous_complaint_count'] >= 3

def test_admin_flow_and_worker_assignment(client):
    # 1. Admin login
    login_res = client.post('/api/admin/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert login_data['success'] is True
    assert 'token' in login_data

    # 2. Submit a complaint
    sub_res = client.post('/api/complaints', json={
        'user_id': 'TEIT30',
        'name': 'Soham',
        'email': 'soham@example.com',
        'category': 'Electrical',
        'location_id': 'LOC001',
        'description': 'Sparking from exposed wire',
        'gps_mode': 'verified'
    })
    cid = sub_res.get_json()['complaint_id']

    # 3. Get Dashboard
    dash_res = client.get('/api/admin/dashboard')
    assert dash_res.status_code == 200
    dash = dash_res.get_json()
    assert dash['total'] >= 1
    assert dash['priority']['critical'] >= 1

    # 4. Get complaints list
    list_res = client.get('/api/admin/complaints')
    assert list_res.status_code == 200
    complaints = list_res.get_json()
    assert len(complaints) >= 1

    # 5. Assign worker
    assign_res = client.post(f'/api/admin/complaints/{cid}/assign', json={'worker_id': 1})
    assert assign_res.status_code == 200
    assign_data = assign_res.get_json()
    assert assign_data['status'] == 'Assigned'
    assert assign_data['worker']['name'] == 'Raj Patil'

    # 6. Update status to In Progress
    status_res = client.patch(f'/api/admin/complaints/{cid}/status', json={'status': 'In Progress'})
    assert status_res.status_code == 200
    assert status_res.get_json()['status'] == 'In Progress'

    # 7. Update status to Resolved
    resolved_res = client.patch(f'/api/admin/complaints/{cid}/status', json={'status': 'Resolved'})
    assert resolved_res.status_code == 200
    assert resolved_res.get_json()['status'] == 'Resolved'

    # 8. Check complaint details timeline has all steps
    detail_res = client.get(f'/api/admin/complaints/{cid}')
    assert detail_res.status_code == 200
    detail = detail_res.get_json()
    statuses = [item['status'] for item in detail['timeline']]
    assert 'Reported' in statuses
    assert 'Assigned' in statuses
    assert 'In Progress' in statuses
    assert 'Resolved' in statuses
