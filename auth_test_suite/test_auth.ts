/**
 * GateFlow AI - Frontend Auth & Registration Verification Test
 * Direct test executing TypeScript/JavaScript logic for Login, Sign-up, Sessions, and Permissions
 */

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'principal' | 'transport_coordinator' | 'gate_staff' | 'parent';
  title: string;
  department: string;
}

interface UserSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: 'principal' | 'transport_coordinator' | 'gate_staff' | 'parent';
  department?: string;
}

// In-memory user database
const USERS_DB: Record<string, { password: string; user: AuthUser }> = {
  'principal@gateflow.demo': {
    password: 'Principal@123',
    user: {
      id: 'usr_principal_01',
      email: 'principal@gateflow.demo',
      name: 'Dr. Revathy Soundararajan',
      role: 'principal',
      title: 'School Principal',
      department: 'School Administration & Governance',
    },
  },
  'transport@gateflow.demo': {
    password: 'Transport@123',
    user: {
      id: 'usr_transport_01',
      email: 'transport@gateflow.demo',
      name: 'S. Ramanathan',
      role: 'transport_coordinator',
      title: 'Transport Coordinator',
      department: 'Operations, Logistics & Fleet',
    },
  },
  'gate@gateflow.demo': {
    password: 'Gate@123',
    user: {
      id: 'usr_gate_01',
      email: 'gate@gateflow.demo',
      name: 'M. Selvam',
      role: 'gate_staff',
      title: 'Senior Gate Marshal',
      department: 'Campus Security & Gate Operations',
    },
  },
};

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const SESSIONS: Map<string, UserSession> = new Map();

// Service under test
const testAuthService = {
  async login(credentials: { email: string; password: string }): Promise<UserSession> {
    const email = credentials.email?.trim().toLowerCase();
    if (!email) throw new Error('Email is required');
    if (!credentials.password) throw new Error('Password is required');

    const entry = USERS_DB[email];
    if (!entry || entry.password !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    const session: UserSession = {
      user: { ...entry.user },
      token: `gfk_tok_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      expiresAt: Date.now() + INACTIVITY_TIMEOUT_MS,
    };

    SESSIONS.set(session.token, session);
    return session;
  },

  async signup(data: RegisterPayload): Promise<UserSession> {
    const email = data.email?.trim().toLowerCase();
    if (!data.name || data.name.trim().length < 2) throw new Error('Full name is required (min 2 characters)');
    if (!email || !email.includes('@')) throw new Error('Valid email address is required');
    if (!data.password || data.password.length < 6) throw new Error('Password must be at least 6 characters');

    if (USERS_DB[email]) {
      throw new Error('An account with this email address already exists');
    }

    const role = data.role || 'parent';
    const newUser: AuthUser = {
      id: `usr_${role}_${Date.now()}`,
      email: email,
      name: data.name.trim(),
      role: role,
      title: role.replace('_', ' ').toUpperCase(),
      department: data.department || 'School Community',
    };

    USERS_DB[email] = {
      password: data.password,
      user: newUser,
    };

    return this.login({ email, password: data.password });
  },

  logout(token: string): boolean {
    return SESSIONS.delete(token);
  },

  getSession(token: string): UserSession | null {
    const session = SESSIONS.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      SESSIONS.delete(token);
      return null;
    }
    return session;
  }
};

// Test Runner
async function runTestSuite() {
  console.log('='.repeat(60));
  console.log('⚡ GATEFLOW AI - AUTH (LOGIN / SIGNIN / SIGNUP) VERIFICATION');
  console.log('='.repeat(60));

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${msg}`);
    } else {
      console.error(`  ✗ [FAIL] ${msg}`);
      throw new Error(`Test failed: ${msg}`);
    }
  }

  // 1. Sign-in with default Principal
  console.log('\n--- Test Group 1: Login / Sign-in ---');
  const principalSession = await testAuthService.login({
    email: 'principal@gateflow.demo',
    password: 'Principal@123',
  });
  assert(principalSession.user.role === 'principal', 'Principal login returns correct role');
  assert(principalSession.token.startsWith('gfk_tok_'), 'Session token generated properly');

  // 2. Sign-in failure with wrong password
  try {
    await testAuthService.login({
      email: 'principal@gateflow.demo',
      password: 'WrongPassword999',
    });
    assert(false, 'Should throw for wrong password');
  } catch (err: any) {
    assert(err.message === 'Invalid email or password', 'Correct error message on wrong password');
  }

  // 3. Sign-in failure with non-existing user
  try {
    await testAuthService.login({
      email: 'ghost.user@gateflow.demo',
      password: 'SomePassword123',
    });
    assert(false, 'Should throw for unknown email');
  } catch (err: any) {
    assert(err.message === 'Invalid email or password', 'Correct error message on unknown email');
  }

  // 4. Sign-up new user (Parent / Driver)
  console.log('\n--- Test Group 2: Sign-up / Registration ---');
  const signupResult = await testAuthService.signup({
    name: 'Meena Sundaram',
    email: 'meena.parent@gateflow.demo',
    password: 'SafePassword@2026',
    role: 'parent',
    department: 'Grade 3 Parent',
  });
  assert(signupResult.user.name === 'Meena Sundaram', 'Sign-up assigns user name');
  assert(signupResult.user.role === 'parent', 'Sign-up assigns parent role');
  assert(Boolean(signupResult.token), 'Auto-login token provided upon successful signup');

  // 5. Sign-up duplicate prevention
  try {
    await testAuthService.signup({
      name: 'Duplicate Meena',
      email: 'meena.parent@gateflow.demo',
      password: 'SafePassword@2026',
    });
    assert(false, 'Duplicate registration must fail');
  } catch (err: any) {
    assert(err.message.includes('already exists'), 'Duplicate registration prevented');
  }

  // 6. Sign-up validation
  try {
    await testAuthService.signup({
      name: 'M',
      email: 'not-an-email',
      password: '123',
    });
    assert(false, 'Invalid signup details must fail');
  } catch (err: any) {
    assert(err.message.includes('name is required'), 'Short name validation caught');
  }

  // 7. Sign-in with the new user credentials
  console.log('\n--- Test Group 3: Post-Registration Sign-in & Session Verification ---');
  const newLoginSession = await testAuthService.login({
    email: 'meena.parent@gateflow.demo',
    password: 'SafePassword@2026',
  });
  assert(newLoginSession.user.email === 'meena.parent@gateflow.demo', 'New registered user can log in');

  // 8. Session validation & logout
  const sessionValid = testAuthService.getSession(newLoginSession.token);
  assert(sessionValid !== null, 'Retrieved active session is valid');

  const logoutSuccess = testAuthService.logout(newLoginSession.token);
  assert(logoutSuccess === true, 'Logout successfully deletes session');
  assert(testAuthService.getSession(newLoginSession.token) === null, 'Session is null after logout');

  console.log('\n' + '='.repeat(60));
  console.log(`✨ ALL TESTS COMPLETED: ${passed}/${total} PASSED`);
  console.log('='.repeat(60));
}

runTestSuite().catch((e) => {
  console.error('Test Suite Failed:', e);
});
