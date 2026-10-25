import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, 
  Upload, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon,
  Database
} from 'lucide-react';

export default function Navbar({ onOpenUploadModal, onSeedData, isSeeding }) {
  const { user, isOwner, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Compass className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Recruiter<span className="text-indigo-400">Radar</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                  CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Professional Outreach & Recruiter Intelligence
              </p>
            </div>
          </div>

          {/* User Controls & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isOwner && (
              <>
                <button
                  onClick={onOpenUploadModal}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all border border-indigo-400/20 active:scale-95"
                  title="Upload Excel or CSV Sheet"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Excel</span>
                </button>

                <button
                  onClick={onSeedData}
                  disabled={isSeeding}
                  className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
                  title="Reload original 1,840+ recruiters from Google Sheet"
                >
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSeeding ? 'Seeding...' : 'Reload Sheet'}</span>
                </button>
              </>
            )}

            {/* User Profile Pill */}
            <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">
                  {user?.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {user?.email}
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                {isOwner ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Owner</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    <UserIcon className="w-3 h-3 text-slate-400" />
                    <span>Member</span>
                  </span>
                )}

                <button
                  onClick={logout}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
