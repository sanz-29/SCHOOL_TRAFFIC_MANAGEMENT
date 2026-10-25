# GateFlow AI — Authentication Test Suite (Login, Sign-in & Sign-up)

This folder contains standalone test suites covering **Login**, **Sign-in**, **Sign-up (Registration)**, and **Session Management** for GateFlow AI.

---

## 📁 Files Included

1. **[`test_auth.py`](file:///d:/ai%20hackathon%20road%20traffic/ai%20taffic%20code/auth_test_suite/test_auth.py)**:
   - Standalone Python test suite (zero external dependencies).
   - Covers:
     - Sign-in / Login authentication for all demo roles (`principal`, `transport_coordinator`, `gate_staff`).
     - Case-insensitive & trimmed email handling.
     - Invalid password rejection.
     - Unknown user rejection.
     - Empty credentials validation.
     - Sign-up (registration) of new users (e.g., `parent` / driver).
     - Duplicate email prevention.
     - Minimum name and password strength checks.
     - Auto-session creation upon sign-up.
     - Sign-in with newly registered user credentials.
     - Session lookup, inactivity touch/refresh, and logout termination.

2. **[`test_auth.ts`](file:///d:/ai%20hackathon%20road%20traffic/ai%20taffic%20code/auth_test_suite/test_auth.ts)**:
   - TypeScript equivalent matching the frontend contracts in [`frontend/src/auth/authService.ts`](file:///d:/ai%20hackathon%20road%20traffic/ai%20taffic%20code/frontend/src/auth/authService.ts) and [`frontend/src/types/index.ts`](file:///d:/ai%20hackathon%20road%20traffic/ai%20taffic%20code/frontend/src/types/index.ts).

---

## 🚀 How to Run

### Option 1: Python
Run directly in your terminal:
```bash
python test_auth.py
```

### Option 2: TypeScript / Node / Bun / tsx
From the frontend directory:
```bash
npx tsx ../auth_test_suite/test_auth.ts
```
or with Bun:
```bash
bun ../auth_test_suite/test_auth.ts
```
