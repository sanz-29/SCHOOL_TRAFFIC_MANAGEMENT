import { UserRole } from '../types';

export type AuthAction =
  | 'view_dashboard'
  | 'edit_school_setup'
  | 'edit_demand_profile'
  | 'run_baseline_diagnosis'
  | 'edit_constraints'
  | 'run_schedule_search'
  | 'edit_pickup_zones'
  | 'verify_zone_safety'
  | 'run_simulation'
  | 'run_stress_tests'
  | 'view_plan_compare'
  | 'approve_plan'
  | 'edit_parent_notice'
  | 'release_parent_notice'
  | 'view_public_notice'
  | 'view_followup'
  | 'enter_followup_counts'
  | 'view_assumptions';

export interface RolePermissions {
  allowedRoutes: string[];
  landingPage: string;
  roleTitle: string;
}

export const ROLE_CONFIG: Record<UserRole, RolePermissions> = {
  principal: {
    landingPage: '/dashboard',
    roleTitle: 'School Principal',
    allowedRoutes: [
      '/dashboard',
      '/setup',
      '/demand',
      '/baseline',
      '/constraints',
      '/search',
      '/zones',
      '/simulation',
      '/stress-tests',
      '/approve',
      '/notice',
      '/notice/public',
      '/follow-up',
      '/assumptions',
    ],
  },
  transport_coordinator: {
    landingPage: '/dashboard',
    roleTitle: 'Transport Coordinator',
    allowedRoutes: [
      '/dashboard',
      '/setup',
      '/demand',
      '/baseline',
      '/constraints',
      '/search',
      '/zones',
      '/simulation',
      '/stress-tests',
      '/approve',
      '/notice',
      '/notice/public',
      '/follow-up',
      '/assumptions',
    ],
  },
  gate_staff: {
    landingPage: '/follow-up',
    roleTitle: 'Gate Staff & Security',
    allowedRoutes: [
      '/follow-up',
      '/notice/public',
      '/assumptions',
    ],
  },
  parent: {
    landingPage: '/notice/public',
    roleTitle: 'Parent & Guardian',
    allowedRoutes: [
      '/notice/public',
    ],
  },
};

/**
 * Check if a role has permission to perform a specific action
 */
export function can(role: UserRole | null | undefined, action: AuthAction): boolean {
  if (!role) {
    return action === 'view_public_notice';
  }

  switch (action) {
    // Only the Principal can: approve a plan, release the parent notice, and verify zone checklist
    case 'approve_plan':
    case 'release_parent_notice':
    case 'verify_zone_safety':
      return role === 'principal';

    // Planning & simulation editing actions: Principal & Transport Coordinator
    case 'view_dashboard':
    case 'edit_school_setup':
    case 'edit_demand_profile':
    case 'run_baseline_diagnosis':
    case 'edit_constraints':
    case 'run_schedule_search':
    case 'edit_pickup_zones':
    case 'run_simulation':
    case 'run_stress_tests':
    case 'view_plan_compare':
    case 'edit_parent_notice':
      return role === 'principal' || role === 'transport_coordinator';

    // Gate observation entry: Gate Staff, plus Coordinator and Principal
    case 'enter_followup_counts':
      return role === 'gate_staff' || role === 'principal' || role === 'transport_coordinator';

    case 'view_followup':
      return role === 'gate_staff' || role === 'principal' || role === 'transport_coordinator';

    case 'view_assumptions':
      return role === 'principal' || role === 'transport_coordinator' || role === 'gate_staff';

    case 'view_public_notice':
      return true;

    default:
      return false;
  }
}

/**
 * Returns default landing page after successful login
 */
export function getRoleLandingPage(role: UserRole): string {
  return ROLE_CONFIG[role]?.landingPage || '/dashboard';
}

/**
 * Checks if a specific route is accessible by the user's role
 */
export function isRouteAllowedForRole(role: UserRole, path: string): boolean {
  // Public notice is always accessible to everyone
  if (path.startsWith('/notice/public') || path.startsWith('/notice/')) {
    return true;
  }

  // System error routes
  if (path === '/403' || path === '/404' || path === '/login') {
    return true;
  }

  const allowed = ROLE_CONFIG[role]?.allowedRoutes || [];
  // Direct match or parent path match
  return allowed.some((allowedPath) => path === allowedPath || path.startsWith(allowedPath + '/'));
}
