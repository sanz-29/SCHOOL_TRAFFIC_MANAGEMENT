/**
 * GateFlow AI
 * School-Gate Traffic Planning & Decision-Support System
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, ProtectedRoute, RoleGuard, getRoleLandingPage } from './auth';

import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { StepperNav } from './components/StepperNav';
import { GlobalFooter } from './components/GlobalFooter';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SchoolSetupPage } from './pages/SchoolSetupPage';
import { DemandProfilePage } from './pages/DemandProfilePage';
import { BaselineDiagnosisPage } from './pages/BaselineDiagnosisPage';
import { ConstraintsPage } from './pages/ConstraintsPage';
import { ScheduleSearchPage } from './pages/ScheduleSearchPage';
import { PickupZonesPage } from './pages/PickupZonesPage';
import { SimulationResultsPage } from './pages/SimulationResultsPage';
import { StressTestsPage } from './pages/StressTestsPage';
import { CompareApprovePage } from './pages/CompareApprovePage';
import { ParentNoticePage } from './pages/ParentNoticePage';
import { FollowUpPage } from './pages/FollowUpPage';
import { AssumptionsPage } from './pages/AssumptionsPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Component that resolves root "/" based on auth status
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !role) {
    return <LoginPage />;
  }

  return <Navigate to={getRoleLandingPage(role)} replace />;
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  const isLoginPage = location.pathname === '/login';
  const isPublicNotice = location.pathname.startsWith('/notice/public') || location.pathname.startsWith('/notice/notic_');
  const isErrorPage = location.pathname === '/403' || location.pathname === '/404';

  const isStandAloneView = isLoginPage || isPublicNotice;

  if (isStandAloneView) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] text-[#0F172A]">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/notice/public" element={<ParentNoticePage />} />
          <Route path="/notice/:planId" element={<ParentNoticePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFF] text-[#0F172A]">
      {/* Top Bar with Brand, Page Title, User Name, Role Pill, and Logout */}
      <TopBar />

      {/* Workflow Stepper Bar (Active only for Principal & Transport Coordinator on planning pages) */}
      {!isErrorPage && <StepperNav />}

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Role-Filtered Sidebar */}
        {!isErrorPage && <Sidebar />}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col justify-between">
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
              {/* Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* Protected Executive Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <DashboardPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Protected Planning & Input Routes */}
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <SchoolSetupPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/demand"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <DemandProfilePage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/baseline"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <BaselineDiagnosisPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/constraints"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <ConstraintsPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Protected Search & Simulation Routes */}
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <ScheduleSearchPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/zones"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <PickupZonesPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/simulation"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <SimulationResultsPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stress-tests"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <StressTestsPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Plan Compare & Approve (Viewable by Principal & Transport Coordinator) */}
              <Route
                path="/approve"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <CompareApprovePage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Parent Notice (Staff Editor) */}
              <Route
                path="/notice"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator']}>
                      <ParentNoticePage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Follow-up Measurement (Accessible to Gate Staff, Transport Coordinator, Principal) */}
              <Route
                path="/follow-up"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator', 'gate_staff']}>
                      <FollowUpPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Assumptions & Limits (Accessible to All Staff) */}
              <Route
                path="/assumptions"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['principal', 'transport_coordinator', 'gate_staff']}>
                      <AssumptionsPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* HTTP 403 Forbidden & HTTP 404 Not Found */}
              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>

          {/* Persistent Footer */}
          {!isErrorPage && (
            <div className="mt-8 pt-4">
              <GlobalFooter />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
