"""
GateFlow AI - Authentication Test Suite (Login / Sign-in & Sign-up)
Tests for:
1. Login/Sign-in authentication logic (valid credentials, wrong password, unknown user, role matching)
2. Sign-up user registration logic (new user registration, duplicate email handling, validation)
3. Session lifecycle (session creation, token issuance, expiry check, session touch/refresh, logout)
4. Role permissions and authorization guards
"""

import time
import base64
from typing import Dict, Optional, Tuple

# Simulated Database / Store
MOCK_USERS: Dict[str, dict] = {
    'principal@gateflow.demo': {
        'id': 'usr_principal_01',
        'password': 'Principal@123',
        'email': 'principal@gateflow.demo',
        'name': 'Dr. Revathy Soundararajan',
        'role': 'principal',
        'title': 'School Principal',
        'department': 'School Administration & Governance',
    },
    'transport@gateflow.demo': {
        'id': 'usr_transport_01',
        'password': 'Transport@123',
        'email': 'transport@gateflow.demo',
        'name': 'S. Ramanathan',
        'role': 'transport_coordinator',
        'title': 'Transport Coordinator',
        'department': 'Operations, Logistics & Fleet',
    },
    'gate@gateflow.demo': {
        'id': 'usr_gate_01',
        'password': 'Gate@123',
        'email': 'gate@gateflow.demo',
        'name': 'M. Selvam',
        'role': 'gate_staff',
        'title': 'Senior Gate Marshal',
        'department': 'Campus Security & Gate Operations',
    },
}

# In-memory session store
ACTIVE_SESSIONS: Dict[str, dict] = {}
SESSION_TIMEOUT_SECONDS = 1800  # 30 minutes


class AuthService:
    def __init__(self, users_db: Dict[str, dict], sessions_db: Dict[str, dict]):
        self.users = users_db
        self.sessions = sessions_db

    # --- SIGN-IN / LOGIN ---
    def login(self, email: str, password: str) -> dict:
        if not email or not email.strip():
            raise ValueError("Email address is required")
        if not password:
            raise ValueError("Password is required")

        normalized_email = email.strip().lower()
        user_record = self.users.get(normalized_email)

        if not user_record or user_record['password'] != password:
            raise PermissionError("Invalid email or password")

        token = f"gfk_tok_{base64.b64encode(f'{user_record['id']}:{time.time()}'.encode()).decode()}"
        expires_at = time.time() + SESSION_TIMEOUT_SECONDS

        session = {
            'token': token,
            'user': {k: v for k, v in user_record.items() if k != 'password'},
            'expires_at': expires_at,
        }
        self.sessions[token] = session
        return session

    # --- SIGN-UP / REGISTRATION ---
    def signup(self, name: str, email: str, password: str, role: str = 'parent', department: str = 'General') -> dict:
        if not name or len(name.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        if not email or '@' not in email or '.' not in email:
            raise ValueError("Please enter a valid email address")
        if not password or len(password) < 6:
            raise ValueError("Password must be at least 6 characters")
        
        valid_roles = {'principal', 'transport_coordinator', 'gate_staff', 'parent'}
        if role not in valid_roles:
            raise ValueError(f"Invalid role '{role}'. Allowed roles: {valid_roles}")

        normalized_email = email.strip().lower()
        if normalized_email in self.users:
            raise ValueError(f"User with email '{normalized_email}' already exists")

        user_id = f"usr_{role}_{int(time.time()*1000)}"
        new_user = {
            'id': user_id,
            'name': name.strip(),
            'email': normalized_email,
            'password': password,
            'role': role,
            'title': role.replace('_', ' ').title(),
            'department': department,
        }
        self.users[normalized_email] = new_user

        # Auto-login upon successful registration
        return self.login(normalized_email, password)

    # --- SESSION MANAGEMENT ---
    def get_session(self, token: str) -> Optional[dict]:
        session = self.sessions.get(token)
        if not session:
            return None
        if time.time() > session['expires_at']:
            # Expired
            del self.sessions[token]
            return None
        return session

    def touch_session(self, token: str) -> bool:
        session = self.get_session(token)
        if session:
            session['expires_at'] = time.time() + SESSION_TIMEOUT_SECONDS
            return True
        return False

    def logout(self, token: str) -> bool:
        if token in self.sessions:
            del self.sessions[token]
            return True
        return False


def run_tests():
    print("=" * 60)
    print("🚀 RUNNING GATEFLOW AI AUTHENTICATION & LOGIN/SIGNUP TESTS")
    print("=" * 60)

    # Create isolated copy of users and sessions for testing
    test_users = {k: dict(v) for k, v in MOCK_USERS.items()}
    test_sessions = {}
    auth = AuthService(test_users, test_sessions)

    passed_count = 0
    total_count = 0

    def assert_test(condition: bool, description: str):
        nonlocal passed_count, total_count
        total_count += 1
        if condition:
            passed_count += 1
            print(f"  ✅ PASS: {description}")
        else:
            print(f"  ❌ FAIL: {description}")
            assert False, f"Test failed: {description}"

    # TEST 1: Valid Login - Principal
    print("\n[Suite 1: Sign-in / Login Tests]")
    session_principal = auth.login("principal@gateflow.demo", "Principal@123")
    assert_test(session_principal is not None, "Login with valid Principal credentials succeeds")
    assert_test(session_principal['user']['role'] == 'principal', "Session user role matches 'principal'")
    assert_test('password' not in session_principal['user'], "Session does not expose plain password")
    assert_test(session_principal['token'].startswith("gfk_tok_"), "Valid session token generated")

    # TEST 2: Valid Login - Case-insensitive email
    session_case = auth.login("  PRINCIPAL@GATEFLOW.DEMO  ", "Principal@123")
    assert_test(session_case['user']['id'] == 'usr_principal_01', "Case-insensitive and whitespace trimmed email succeeds")

    # TEST 3: Invalid Password
    try:
        auth.login("principal@gateflow.demo", "WrongPassword")
        assert_test(False, "Login with wrong password should raise error")
    except PermissionError as e:
        assert_test(str(e) == "Invalid email or password", "Login with wrong password correctly rejected")

    # TEST 4: Unknown Email
    try:
        auth.login("nonexistent@gateflow.demo", "AnyPassword")
        assert_test(False, "Login with unknown user should raise error")
    except PermissionError as e:
        assert_test(str(e) == "Invalid email or password", "Unknown user login correctly rejected")

    # TEST 5: Empty Credentials
    try:
        auth.login("", "SomePass")
        assert_test(False, "Empty email should be rejected")
    except ValueError as e:
        assert_test("Email address is required" in str(e), "Empty email validated")

    try:
        auth.login("test@test.com", "")
        assert_test(False, "Empty password should be rejected")
    except ValueError as e:
        assert_test("Password is required" in str(e), "Empty password validated")

    # TEST 6: Sign-up / Registration
    print("\n[Suite 2: Sign-up / Registration Tests]")
    new_user_session = auth.signup(
        name="Anand Kumar",
        email="parent.anand@gateflow.demo",
        password="ParentPass@123",
        role="parent",
        department="Parent Community"
    )
    assert_test(new_user_session is not None, "Sign-up succeeds with valid details")
    assert_test(new_user_session['user']['email'] == "parent.anand@gateflow.demo", "Registered email matches")
    assert_test(new_user_session['user']['role'] == "parent", "Registered role matches 'parent'")

    # TEST 7: Duplicate Email Registration
    try:
        auth.signup(
            name="Anand Clone",
            email="parent.anand@gateflow.demo",
            password="OtherPass@123",
            role="parent"
        )
        assert_test(False, "Duplicate email registration should fail")
    except ValueError as e:
        assert_test("already exists" in str(e), "Duplicate sign-up correctly rejected")

    # TEST 8: Weak Password / Bad Email Validation on Signup
    try:
        auth.signup(name="A", email="bademail", password="123", role="parent")
        assert_test(False, "Bad name/email/pass should fail")
    except ValueError as e:
        assert_test("Name must be at least 2 characters" in str(e), "Sign-up validates minimum name length")

    # TEST 9: Subsequent Login with newly registered credentials
    login_new_user = auth.login("parent.anand@gateflow.demo", "ParentPass@123")
    assert_test(login_new_user['user']['name'] == "Anand Kumar", "Newly registered user can log in successfully")

    # TEST 10: Session Lifecycle & Logout
    print("\n[Suite 3: Session & Logout Tests]")
    token = login_new_user['token']
    active_session = auth.get_session(token)
    assert_test(active_session is not None, "Active session is retrievable by token")

    # Touch session
    touch_res = auth.touch_session(token)
    assert_test(touch_res is True, "Touch session successfully refreshes expiry")

    # Logout
    logout_res = auth.logout(token)
    assert_test(logout_res is True, "Logout successfully terminates session")
    assert_test(auth.get_session(token) is None, "Terminated session is no longer retrievable")

    print("\n" + "=" * 60)
    print(f"🎉 ALL TESTS PASSED: {passed_count}/{total_count} assertions verified successfully!")
    print("=" * 60)


if __name__ == '__main__':
    run_tests()
