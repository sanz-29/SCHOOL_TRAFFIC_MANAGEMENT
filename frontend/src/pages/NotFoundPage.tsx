import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleLandingPage } from '../auth';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const landing = isAuthenticated && role ? getRoleLandingPage(role) : '/login';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm max-w-md w-full p-6 text-center space-y-5">
        <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto border border-blue-200">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div>
          <div className="inline-block px-2.5 py-0.5 bg-blue-100/70 text-blue-900 rounded font-mono text-[11px] font-bold mb-2">
            HTTP 404 · NOT FOUND
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Page Not Located
          </h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            The requested GateFlow planning page or module could not be found. Check the URL or return to your operational dashboard.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => navigate(landing)}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
