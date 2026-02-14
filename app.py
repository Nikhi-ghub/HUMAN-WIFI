from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import uuid
from datetime import datetime, timedelta
import os

app = Flask(__name__, static_folder='.')
CORS(app)

users = {}
rooms = {}
tokens = {}
matches = {}

def generate_token():
    return str(uuid.uuid4())


def verify_token(token):
    return tokens.get(token)


def calculate_match_score(user1_interests, user2_interests):
    if not user1_interests or not user2_interests:
        return 0
    
    common = set(user1_interests) & set(user2_interests)
    total = set(user1_interests) | set(user2_interests)
    
    if len(total) == 0:
        return 0
    
    return int((len(common) / len(total)) * 100)


def generate_icebreaker(common_interests):
    icebreakers = {
        'AI': 'What excites you most about AI?',
        'Coding': "What's your favorite programming language and why?",
        'Music': 'What genre of music do you enjoy most?',
        'Gaming': "What's your all-time favorite game?",
        'Sports': 'Which sport do you follow most closely?',
        'Photography': "What's your favorite subject to photograph?",
        'Art': 'What art style resonates with you?',
        'Travel': "What's the most memorable place you've visited?",
        'Fitness': "What's your go-to workout routine?"
    }
    
    if common_interests:
        for interest in common_interests:
            if interest in icebreakers:
                return icebreakers[interest]
    
    return "What's something new you learned this week?"

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    
    required_fields = ['name', 'email', 'password', 'interests', 'mood', 'purpose']
    if not all(field in data for field in required_fields):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    if any(u['email'] == data['email'] for u in users.values()):
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    user_id = str(uuid.uuid4())
    users[user_id] = {
        'id': user_id,
        'name': data['name'],
        'email': data['email'],
        'password': data['password'],  
        'interests': data['interests'],
        'mood': data['mood'],
        'purpose': data['purpose'],
        'created_at': datetime.now().isoformat()
    }
    
    token = generate_token()
    tokens[token] = user_id
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user_id,
            'name': users[user_id]['name'],
            'mood': users[user_id]['mood'],
            'interests': users[user_id]['interests'],
            'purpose': users[user_id]['purpose']
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    
    user = None
    for u in users.values():
        if u['email'] == data['username'] or u['name'] == data['username']:
            if u['password'] == data['password']:
                user = u
                break
    
    if not user:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    token = generate_token()
    tokens[token] = user['id']
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'mood': user['mood'],
            'interests': user['interests'],
            'purpose': user['purpose']
        }
    })

@app.route('/api/join-room', methods=['POST'])
def join_room():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.json
    room_code = data['roomCode']
    
    if room_code not in rooms:
        rooms[room_code] = {
            'code': room_code,
            'users': [],
            'created_at': datetime.now().isoformat()
        }
    if user_id not in rooms[room_code]['users']:
        rooms[room_code]['users'].append(user_id)
    
    return jsonify({
        'success': True,
        'room': room_code,
        'userCount': len(rooms[room_code]['users'])
    })

@app.route('/api/room/<room_code>/users', methods=['GET'])
def get_room_users(room_code):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    if room_code not in rooms:
        return jsonify({'success': False, 'message': 'Room not found'}), 404
 
    room_users = []
    for uid in rooms[room_code]['users']:
        if uid != user_id and uid in users:
            user = users[uid]
            room_users.append({
                'id': user['id'],
                'name': user['name'],
                'interests': user['interests'],
                'mood': user['mood'],
                'purpose': user['purpose']
            })
    
    return jsonify({
        'success': True,
        'users': room_users
    })

@app.route('/api/confirm-meet', methods=['POST'])
def confirm_meet():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.json
    

    meeting_id = str(uuid.uuid4())
    if 'meetings' not in globals():
        global meetings
        meetings = {}
    
    meetings[meeting_id] = {
        'id': meeting_id,
        'user_id': user_id,
        'room': data['room'],
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify({
        'success': True,
        'meeting_id': meeting_id
    })


@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    total_users = len(users)
    total_rooms = len(rooms)

    total_matches = 0
    for room in rooms.values():
        room_users = room['users']
        if len(room_users) > 1:
            total_matches += len(room_users) * (len(room_users) - 1) // 2
    
    return jsonify({
        'success': True,
        'stats': {
            'totalUsers': total_users,
            'totalRooms': total_rooms,
            'totalMatches': total_matches,
            'activeRooms': len([r for r in rooms.values() if len(r['users']) > 0])
        }
    })

if __name__ == '__main__':

    demo_users = [
        {
            'name': 'Demo User',
            'email': 'demo@humanwifi.com',
            'password': 'demo123',
            'interests': ['AI', 'Coding', 'Music'],
            'mood': 'energized',
            'purpose': 'collaborate'
        },
        {
            'name': 'Admin User',
            'email': 'admin@humanwifi.com',
            'password': 'admin123',
            'interests': ['Management', 'Analytics', 'Strategy'],
            'mood': 'focused',
            'purpose': 'network'
        }
    ]
    
    for demo_user in demo_users:
        user_id = str(uuid.uuid4())
        users[user_id] = {
            'id': user_id,
            **demo_user,
            'created_at': datetime.now().isoformat()
        }
    
    print("\n" + "="*60)
    print("🎉 HUMAN WiFi SERVER STARTED! 🎉")
    print("="*60)
    print("\n📍 Access the application at: http://localhost:5000")
    print("\n👥 Demo Accounts:")
    print("   Email: demo@humanwifi.com | Password: demo123")
    print("   Email: admin@humanwifi.com | Password: admin123")
    print("\n🚀 Quick Start:")
    print("   1. Open http://localhost:5000 in your browser")
    print("   2. Sign up or login with demo account")
    print("   3. Join a room (try: HACK2026)")
    print("   4. Start making connections!")
    print("\n💡 Admin Dashboard: http://localhost:5000/admin.html")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
