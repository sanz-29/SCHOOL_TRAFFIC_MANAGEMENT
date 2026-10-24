# GateFlow AI — School-Gate Traffic Planning & Decision-Support System

GateFlow AI is a specialized decision-support web application that helps school principals and transport coordinators evaluate staggered class arrival times and curbside pickup-zone assignments before implementing them on physical streets.

> **Decision-Support Governance:** GateFlow AI is a decision-support simulation tool for school leadership. It does not actuate road signals or automatically control physical gates; the school principal retains final statutory administrative discretion.

---

## Design System & Architecture

- **Color Palette (Blue and White Only):**
  - Primary Blue: `#1D4ED8`
  - Bright Blue: `#2563EB`
  - Light Blue Tint: `#EFF6FF`
  - Border Blue: `#DBEAFE`
  - Background: `#F8FAFF`
  - Semantic Status (Only for status): Green (`#16A34A`), Amber (`#D97706`), Red (`#DC2626`)
- **Typography:** Inter for headings and body; JetBrains Mono for tabular metrics (`tabular-nums font-mono`).
- **Data Provenance:** Every metric displays an explicit badge: `Observed` | `Synthetic` | `Assumed`.
- **Simulation Transparency:** Results carry an engine badge: `Fast model` | `SUMO` | `Fallback simulator`, and always the label `"Simulated"`.
- **Simulated Reductions:** Stated as `"Simulated change vs baseline"`, never guaranteed real-world percentages.
- **Safety Protocol:** Pickup zones display `"Legal/safety status: UNVERIFIED"` until a human auditor completes the 4-point safety verification checklist.

---

## Authentication & Role-Based Access Control (RBAC)

The application enforces authentication on all operational routes. Unauthenticated visitors are routed to the login page (`/login`). Once authenticated, users land on their role's designated workspace with role-level routing guards.

### Demo Accounts (Instant Fill on `/login`)
| Role | Email | Password | Landing Page | Key Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **School Principal** | `principal@gateflow.demo` | `Principal@123` | `/dashboard` | **Full access**: Sole authority to formally approve plans, release parent circulars, and verify zone safety checklists. |
| **Transport Coordinator** | `transport@gateflow.demo` | `Transport@123` | `/dashboard` | Setup, demand data, constraints, schedule searches, SUMO runs, stress tests. *Cannot approve plans or release notices.* |
| **Gate Staff & Security** | `gate@gateflow.demo` | `Gate@123` | `/follow-up` | Field count entry, approved schedule review, traffic anomaly monitoring. *No access to planning suites.* |
| **Parent & Guardian (Public)** | *(No account required)* | *(No login)* | `/notice/public` | Read-only public timetable and curbside instructions in English & Tamil. Zero tracking or telemetry. |

### Session Management & Security
- **Storage**: Sessions are persisted in browser `sessionStorage` and restored across page reloads.
- **Inactivity Timeout**: An automated 30-minute inactivity timer signs out idle sessions and displays a notice.
- **Lockout Protection**: After 5 consecutive failed login attempts, the login form locks for 30 seconds with a countdown timer.
- **Access Control Enforcement**: Attempting to access unauthorized URLs triggers an HTTP 403 Access Forbidden screen (`/403`) with a direct return button to the user's role workspace.

### Replacing Mock Auth with a Real Backend
All authentication logic is isolated in `src/auth/authService.ts`. To connect a real FastAPI backend:
1. Set the API URL in `.env`:
   ```bash
   VITE_API_BASE_URL="https://api.gateflow.school.edu"
   ```
2. Replace the methods in `src/auth/authService.ts`:
   - `login(credentials)` $\rightarrow$ `POST /auth/login` (returns JWT token and user profile)
   - `logout()` $\rightarrow$ `POST /auth/logout`
   - `getSession()` / `getCurrentUser()` $\rightarrow$ `GET /auth/me` with Bearer token header

---

## Core Mathematical Formulations

- **Total Vehicle Delay ($J_{\text{delay}}$):**
  $$J_{\text{delay}} = \sum (Q_t \times \Delta t) \quad \text{[vehicle-minutes]}$$
- **Schedule Disruption ($J_{\text{disruption}}$):**
  $$J_{\text{disruption}} = \sum (N_g \times |\text{shift}_g|) \quad \text{[student-minutes]}$$
- **Kerbside Bay Capacity:**
  $$\text{Capacity} = \lfloor L_{\text{usable}} / (L_{\text{vehicle}} + \text{gap}) \rfloor \quad \text{[concurrent vehicles]}$$
- **Simulated Change:**
  $$\text{Simulated Change} = 100 \times (\text{Baseline} - \text{Candidate}) / \text{Baseline}$$

---

## Application Workflow (10 Steps)

1. **School Setup (`/setup`):** Institution parameters, six student cohorts, vehicle mix (must total 100%), gate-side bay capacity (8 vehicles), and Leaflet GIS map.
2. **Demand Profile (`/demand`):** Source selector (Observed / Synthetic / Assumed), 4 × 5-minute peak arrival bins, stopping duration dwell distributions, and arrival-rate chart with uncertainty envelopes.
3. **Baseline Diagnosis (`/baseline`):** Evaluates single-bell morning peak (07:50 AM arrival for all 1,840 students), showing 18.5 minutes of road spillback, wait distribution, and simulation replay scrubber.
4. **Constraints (`/constraints`):** Hard invariants (pediatric kindergarten floor, ±15m limit) vs soft comfort heuristics (sibling alignment); live pre-search conflict report; free-text natural language policy parser.
5. **Schedule Search (`/search`):** Combinatorial space reduction (117,649 raw permutations $\rightarrow$ 421 feasible candidates); interactive Pareto scatter plot ($J_{\text{delay}}$ vs $J_{\text{disruption}}$); optional $\alpha/\beta$ objective weighting.
6. **Pickup Zones (`/zones`):** Leaflet map with 3 candidate zones (Zone A Main Gate, Zone B North Loop, Zone C South Lane); mathematical capacity validation; rejection of over-capacity assignments; 4-item legal/safety verification checklist.
7. **Simulation Results (`/simulation`):** High-fidelity comparison of Existing vs Uniform Stagger vs GateFlow Candidates; prominent mismatch resolution banner where SUMO micro-simulation wins over Fast analytical model.
8. **Stress Tests (`/stress-tests`):** 4-scenario matrix (Normal, +30% monsoon rain surge, +40% dwell delays, 60% compliance); mean, P95, and worst-case queues; fragility alerts.
9. **Plan Compare & Approve (`/approve`):** Four option cards (Minimal Change, Balanced, Congestion-Focused, Baseline); side-by-side spec comparison; statutory approval modal (Principal only) with legal confirmation checkbox.
10. **Parent Notice (`/notice`):** Automated circular populated from approved plan; bilingual English and Tamil toggle; verifier audit panel checking every cohort's timing and zone against the approved plan (pass/fail); public preview mode.
11. **Follow-Up Measurement (`/follow-up`):** Gate staff field count entry; observed vs predicted chart with uncertainty threshold; anomaly detection flags.
12. **Assumptions & Limits (`/assumptions`):** Scope boundaries, provenance categories breakdown, and engineering glossary.

---

## Mock API Layer & Connecting a Real Backend

All backend calls are centralized in **`src/api/`**:
- `src/api/mockData.ts`: In-memory fixtures, calibrated school parameters, candidate schedules, and simulation runs.
- `src/api/index.ts`: Typed mock API methods returning promises with simulated network latency.

### How to connect a real FastAPI backend:
1. Define your backend URL in `.env`:
   ```bash
   VITE_API_BASE_URL="http://localhost:8000"
   ```
2. In `src/api/index.ts`, replace the in-memory returns with `fetch(`${API_BASE}/api/v1/...`)` calls. The TypeScript signatures in `src/types/index.ts` already match the FastAPI schemas.

---

## Running Locally

```bash
# Install dependencies
npm install

# Run Vite development server (Port 3000)
npm run dev

# Compile TypeScript and build for production
npm run build
```
