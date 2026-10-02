import io
import os
import pytest
from unittest.mock import patch
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from sqlalchemy.pool import StaticPool
from app import create_app
from app.extensions import db
from app.models import User, Location, Admin, Worker, Complaint, StatusHistory
from app.services.priority_service import detect_priority
from app.services.location_service import verify_complaint_location, haversine_distance
from app.services.recurrence_service import check_recurrence
from app.services.exif_service import extract_gps_from_image
from app.services.email_service import send_complaint_confirmation_email, send_worker_assignment_email

@pytest.fixture
def app():
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_uploads'))
    os.makedirs(upload_dir, exist_ok=True)

    app = create_app(test_config={
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite://',
        'SQLALCHEMY_ENGINE_OPTIONS': {
            'connect_args': {'check_same_thread': False},
            'poolclass': StaticPool
        },
        'UPLOAD_FOLDER': upload_dir
    })

    with app.app_context():
        db.create_all()

        # Seed campus locations with 5m radius
        loc1 = Location(
            location_id='LOC001',
            building='Xavier Institute of Engineering',
            floor=1,
            room='DB Lab',
            location_name='First Floor DB Lab',
            latitude=19.045266,
            longitude=72.841845,
            radius_m=5.0
        )
        loc2 = Location(
            location_id='LOC002',
            building='Xavier Institute of Engineering',
            floor=1,
            room='CC Lab',
            location_name='First Floor CC Lab',
            latitude=19.045009,
            longitude=72.842012,
            radius_m=5.0
        )
        loc3 = Location(
            location_id='LOC004',
            building='Xavier Institute of Engineering',
            floor=1,
            room="Men's Washroom",
            location_name="First Floor Men's Washroom",
            latitude=19.045216,
            longitude=72.841769,
            radius_m=5.0
        )
        db.session.add_all([loc1, loc2, loc3])

        # Seed Admin
        admin = Admin(username='admin', name='Test Admin')
        admin.set_password('admin123')
        db.session.add(admin)

        # Seed Worker
        worker = Worker(
            name='Raj Patil',
            email='202403047.sohamgpp@student.xavier.ac.in',
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

@pytest.fixture(autouse=True)
def mock_smtp_globally():
    with patch('smtplib.SMTP') as mock_smtp:
        mock_instance = mock_smtp.return_value.__enter__.return_value
        mock_instance.send_message.return_value = {}
        yield mock_smtp

# ============================================================
# 1. GPS & DISTANCE TESTS
# ============================================================

def test_haversine_distance():
    # Identical points -> 0.0 distance
    d0 = haversine_distance(19.045266, 72.841845, 19.045266, 72.841845)
    assert round(d0, 2) == 0.0

    # DB Lab to CC Lab (~33m apart)
    d1 = haversine_distance(19.045266, 72.841845, 19.045009, 72.842012)
    assert 20.0 < d1 < 50.0

def test_location_verified_within_5m(app):
    with app.app_context():
        # Point within 2 meters of DB Lab
        res = verify_complaint_location('LOC001', 19.045266, 72.841845, altitude_m=12.4)
        assert res['verified'] is True
        assert res['distance_m'] <= 5.0
        assert res['allowed_radius_m'] == 5.0
        assert res['photo_altitude_m'] == 12.4

def test_location_mismatch_outside_5m(app):
    with app.app_context():
        # Point at CC Lab (33m away from DB Lab)
        res = verify_complaint_location('LOC001', 19.045009, 72.842012)
        assert res['verified'] is False
        assert res['distance_m'] > 5.0
        assert res['allowed_radius_m'] == 5.0

def test_location_authority_preserved_on_gps_mismatch(client):
    # Student selects DB Lab (LOC001), photo GPS is at CC Lab (LOC002)
    payload = {
        'user_id': 'TEIT30',
        'name': 'Soham',
        'email': 'soham@example.com',
        'category': 'Electrical',
        'location_id': 'LOC001',
        'description': 'Sparking from exposed wire near DB Lab',
        'latitude': 19.045009,
        'longitude': 72.842012
    }
    res = client.post('/api/complaints', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    # Selected location must remain authoritative (LOC001)
    assert data['location']['location_id'] == 'LOC001'
    assert data['location']['verified'] is False
    assert data['location']['name'] == 'First Floor DB Lab'

def test_exif_gps_missing(tmp_path):
    img = Image.new('RGB', (100, 100), color='blue')
    img_path = str(tmp_path / 'no_gps.jpg')
    img.save(img_path)

    res = extract_gps_from_image(img_path)
    assert res['gps_available'] is False
    assert res['latitude'] is None
    assert res['longitude'] is None
    assert res['altitude_m'] is None

def test_exif_gps_extraction(tmp_path):
    from PIL.TiffImagePlugin import IFDRational
    img = Image.new('RGB', (100, 100), color='red')
    img_path = str(tmp_path / 'with_gps.jpg')

    # Construct EXIF GPS info dict
    exif = img.getexif()
    gps_ifd = {
        1: 'N',
        2: (IFDRational(19, 1), IFDRational(2, 1), IFDRational(4295, 100)), # 19° 2' 42.95" N
        3: 'E',
        4: (IFDRational(72, 1), IFDRational(50, 1), IFDRational(3064, 100)), # 72° 50' 30.64" E
        5: 0,
        6: IFDRational(124, 10) # 12.4 m altitude
    }
    exif[0x8825] = gps_ifd
    img.save(img_path, exif=exif)

    res = extract_gps_from_image(img_path)
    assert res['gps_available'] is True
    assert round(res['latitude'], 4) == 19.0453
    assert round(res['longitude'], 4) == 72.8418
    assert round(res['altitude_m'], 1) == 12.4

def test_altitude_extraction(tmp_path):
    from PIL.TiffImagePlugin import IFDRational
    img = Image.new('RGB', (50, 50), color='green')
    img_path = str(tmp_path / 'alt_test.jpg')
    exif = img.getexif()
    gps_ifd = {
        1: 'N',
        2: (IFDRational(19, 1), IFDRational(2, 1), IFDRational(4200, 100)),
        3: 'E',
        4: (IFDRational(72, 1), IFDRational(50, 1), IFDRational(3000, 100)),
        5: 0, # Above sea level
        6: IFDRational(452, 10) # 45.2 m
    }
    exif[0x8825] = gps_ifd
    img.save(img_path, exif=exif)

    res = extract_gps_from_image(img_path)
    assert res['altitude_m'] == 45.2

# ============================================================
# 2. EMAIL TESTS (Mocked SMTP)
# ============================================================

@patch('smtplib.SMTP')
def test_student_confirmation_email(mock_smtp, app):
    with app.app_context():
        user = User(user_identifier='30', name='Soham', email='soham@example.com')
        loc = Location.query.filter_by(location_id='LOC001').first()
        complaint = Complaint(
            complaint_id='COM-2026-0001',
            user_id=1,
            category='Electrical',
            description='Sparking wire',
            location_id='LOC001',
            priority='Critical',
            status='Reported'
        )
        success, err = send_complaint_confirmation_email(complaint, user, loc)
        assert success is True
        assert err is None

@patch('smtplib.SMTP')
def test_worker_assignment_email(mock_smtp, app):
    with app.app_context():
        worker = Worker.query.filter_by(name='Raj Patil').first()
        loc = Location.query.filter_by(location_id='LOC001').first()
        complaint = Complaint(
            complaint_id='COM-2026-0001',
            user_id=1,
            category='Electrical',
            description='Sparking wire',
            location_id='LOC001',
            priority='Critical',
            status='Assigned'
        )
        success, err = send_worker_assignment_email(complaint, worker, loc)
        assert success is True
        assert err is None

@patch('smtplib.SMTP', side_effect=Exception('SMTP connection timeout'))
def test_email_failure_does_not_delete_complaint(mock_smtp, client):
    payload = {
        'user_id': 'TEIT30',
        'name': 'Soham',
        'email': 'soham@example.com',
        'category': 'Electrical',
        'location_id': 'LOC001',
        'description': 'Sparking from exposed wire near DB Lab'
    }
    res = client.post('/api/complaints', json=payload)
    # Complaint must still be created with 201 status despite SMTP error
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert data['complaint_id'].startswith('COM-')
    assert data['user_email_sent'] is False

# ============================================================
# 3. IMAGE UPLOAD AND SERVING TESTS
# ============================================================

def test_image_upload(client):
    img_byte_arr = io.BytesIO()
    img = Image.new('RGB', (100, 100), color='purple')
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)

    data = {
        'user_id': 'TEIT30',
        'name': 'Soham',
        'email': 'soham@example.com',
        'category': 'Electrical',
        'location_id': 'LOC001',
        'description': 'Sparking wire with evidence',
        'photo': (img_byte_arr, 'test_hazard.jpg')
    }

    res = client.post('/api/complaints', data=data, content_type='multipart/form-data')
    assert res.status_code == 201
    body = res.get_json()
    assert body['success'] is True
    assert 'photo_url' in body['data']
    assert '/uploads/' in body['data']['photo_url']

def test_uploaded_image_served(client, app):
    # Create test image in uploads folder
    upload_folder = app.config['UPLOAD_FOLDER']
    test_filename = 'COM-TEST-0001_photo.jpg'
    file_path = os.path.join(upload_folder, test_filename)
    img = Image.new('RGB', (50, 50), color='yellow')
    img.save(file_path)

    # Test GET /uploads/filename
    res = client.get(f'/uploads/{test_filename}')
    assert res.status_code == 200
    assert res.content_type == 'image/jpeg'

def test_tracking_returns_photo_url(client):
    img_byte_arr = io.BytesIO()
    img = Image.new('RGB', (60, 60), color='orange')
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)

    # Submit
    res = client.post('/api/complaints', data={
        'user_id': '30',
        'name': 'Soham',
        'email': 'soham@example.com',
        'category': 'Electrical',
        'location_id': 'LOC001',
        'description': 'Exposed wire hazard',
        'photo': (img_byte_arr, 'evidence.jpg')
    }, content_type='multipart/form-data')
    assert res.status_code == 201
    cid = res.get_json()['complaint_id']

    # Track
    track_res = client.post('/api/complaints/track', json={
        'complaint_id': cid,
        'email': 'soham@example.com'
    })
    assert track_res.status_code == 200
    track_data = track_res.get_json()
    assert 'photo_url' in track_data
    assert '/uploads/' in track_data['photo_url']

def test_missing_smtp_credentials_returns_failure(app):
    with app.app_context():
        with patch('app.config.Config.SMTP_USERNAME', ''):
            with patch('app.config.Config.SMTP_PASSWORD', ''):
                user = User(user_identifier='30', name='Soham', email='soham@example.com')
                complaint = Complaint(
                    complaint_id='COM-2026-0001',
                    user_id=1,
                    category='Electrical',
                    description='Wire spark',
                    location_id='LOC001',
                    priority='Critical',
                    status='Reported'
                )
                success, err = send_complaint_confirmation_email(complaint, user)
                assert success is False
                assert 'SMTP credentials are not configured' in err

def test_extract_gps_from_real_sample_images():
    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'SmartFix', 'src', 'assets', 'images'))
    elec_path = os.path.join(sample_dir, 'incident_electrical_spark_1790921884186.jpg')
    if os.path.exists(elec_path):
        res = extract_gps_from_image(elec_path)
        assert res['gps_available'] is True
        assert round(res['latitude'], 4) == 19.0453
        assert round(res['longitude'], 4) == 72.8418
        assert res['altitude_m'] == 12.4

# ============================================================
# 4. PRIORITY & RECURRENCE TESTS
# ============================================================

def test_priority_engine():
    crit = detect_priority('Electrical', 'Sparking from exposed wire near DB Lab')
    assert crit['priority'] == 'Critical'
    assert crit['score'] >= 90

    high = detect_priority('Plumbing', 'Major water leakage in washroom')
    assert high['priority'] == 'High'

    med = detect_priority('HVAC', 'Fan not working in classroom')
    assert med['priority'] == 'Medium'

    low = detect_priority('Civil / Infrastructure', 'Paint peeling on wall')
    assert low['priority'] == 'Low'

def test_recurrence_detection(client):
    for i in range(3):
        res = client.post('/api/complaints', json={
            'user_id': f'STU{i+1}',
            'name': f'Student {i+1}',
            'email': f'student{i+1}@campus.edu',
            'category': 'Electrical',
            'location_id': 'LOC001',
            'description': f'Historical electrical issue {i+1}'
        })
        assert res.status_code == 201

    res4 = client.post('/api/complaints', json={
        'user_id': 'TEIT30',
        'name': 'Soham',
        'email': 'soham@example.com',
        'category': 'Electrical',
        'location_id': 'LOC001',
        'description': 'Sparking from exposed wire near DB Lab'
    })
    assert res4.status_code == 201
    data4 = res4.get_json()
    assert data4['is_recurring'] is True
    assert data4['previous_complaint_count'] >= 3

# ============================================================
# 5. ADMIN WORKFLOW & STATUS TIMELINE TESTS
# ============================================================

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
        'description': 'Sparking from exposed wire'
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
