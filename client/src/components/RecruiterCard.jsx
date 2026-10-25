import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Check, 
  Clock, 
  Globe, 
  ExternalLink,
  MessageSquare,
  UserCheck,
  Send,
  Save,
  CheckCircle2
} from 'lucide-react';

// Authentic Social Media SVG Icons
const LinkedInIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const TwitterXIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
  </svg>
);

export default function RecruiterCard({ recruiter, onUpdate }) {
  const [requested, setRequested] = useState(recruiter.requested || false);
  const [messaged, setMessaged] = useState(recruiter.messaged || false);
  const [statusNotes, setStatusNotes] = useState(recruiter.statusNotes || '');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  const notesTimeoutRef = useRef(null);

  // Sync state if props change from outside
  useEffect(() => {
    setRequested(recruiter.requested || false);
    setMessaged(recruiter.messaged || false);
    setStatusNotes(recruiter.statusNotes || '');
  }, [recruiter._id, recruiter.requested, recruiter.messaged, recruiter.statusNotes]);

  // Handle Checkbox Changes
  const handleToggleRequested = async () => {
    const nextVal = !requested;
    setRequested(nextVal);
    setSaveStatus('saving');
    try {
      await onUpdate(recruiter._id, { requested: nextVal });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setRequested(!nextVal);
      setSaveStatus('idle');
    }
  };

  const handleToggleMessaged = async () => {
    const nextVal = !messaged;
    setMessaged(nextVal);
    setSaveStatus('saving');
    try {
      await onUpdate(recruiter._id, { messaged: nextVal });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setMessaged(!nextVal);
      setSaveStatus('idle');
    }
  };

  // Handle Status Notes with auto-save debounce
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setStatusNotes(val);
    setSaveStatus('saving');

    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = setTimeout(async () => {
      try {
        await onUpdate(recruiter._id, { statusNotes: val });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err) {
        console.error('Failed to save status note:', err);
        setSaveStatus('idle');
      }
    }, 800);
  };

  const handleBlurNotes = async () => {
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    if (statusNotes !== recruiter.statusNotes) {
      setSaveStatus('saving');
      try {
        await onUpdate(recruiter._id, { statusNotes });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }
  };

  // Format URLs properly with http:// if missing
  const formatUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  };

  const recruiterLinkedin = formatUrl(recruiter.linkedinUrl);
  const companyWeb = formatUrl(recruiter.companyWebsite);
  const companyLi = formatUrl(recruiter.companyLinkedin);
  const companyTw = formatUrl(recruiter.companyTwitter);
  const companySoc = formatUrl(recruiter.companySocial);

  return (
    <div className="card-border rounded-xl bg-slate-900/90 p-5 flex flex-col justify-between relative group shadow-sm hover:shadow-indigo-500/10">
      {/* Top Section: Recruiter Identity */}
      <div>
        {/* Recruiter Name & Direct Social Icon */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white tracking-tight truncate group-hover:text-indigo-300 transition-colors">
              {recruiter.name}
            </h3>
            <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5" title={recruiter.jobTitle}>
              {recruiter.jobTitle || 'Recruiter / Talent Partner'}
            </p>
          </div>

          {/* Recruiter Social Media Account: ONLY ICON with Direct Clickable Link */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {recruiterLinkedin ? (
              <a
                href={recruiterLinkedin}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open ${recruiter.name}'s LinkedIn Profile`}
                className="w-8 h-8 rounded-lg bg-[#0077b5]/15 text-[#0a66c2] hover:bg-[#0077b5] hover:text-white flex items-center justify-center border border-[#0077b5]/30 transition-all shadow-sm active:scale-95"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
            ) : (
              <span
                title="No direct LinkedIn URL available"
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-600 flex items-center justify-center border border-slate-700/50 cursor-not-allowed"
              >
                <LinkedInIcon className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        {/* Company & Niche Badges */}
        <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80">
          {/* Company Name */}
          <div className="flex items-center text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 mr-1.5 flex-shrink-0" />
            <span className="font-semibold text-slate-200 truncate">
              {recruiter.companyName || 'Unknown Company'}
            </span>
          </div>

          {/* Location / City */}
          <div className="flex items-center text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-rose-400 mr-1.5 flex-shrink-0" />
            <span className="truncate">
              {recruiter.location || 'India'}
            </span>
          </div>

          {/* Company Niche */}
          {recruiter.companyNiche && (
            <div className="flex items-center text-xs text-slate-400">
              <Briefcase className="w-3.5 h-3.5 text-amber-400 mr-1.5 flex-shrink-0" />
              <span className="truncate" title={recruiter.companyNiche}>
                {recruiter.companyNiche}
              </span>
            </div>
          )}
        </div>

        {/* Company Social Media Icons Section (Direct Clickable Icons) */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Company Links
            </span>

            <div className="flex items-center space-x-1.5">
              {/* Company Website Icon */}
              {companyWeb ? (
                <a
                  href={companyWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Visit Company Website"
                  className="w-7 h-7 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {/* Company LinkedIn Icon */}
              {companyLi ? (
                <a
                  href={companyLi}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Visit Company LinkedIn Page"
                  className="w-7 h-7 rounded-md bg-slate-800 text-slate-300 hover:text-[#0a66c2] hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors"
                >
                  <LinkedInIcon className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {/* Company Twitter/X Icon */}
              {companyTw ? (
                <a
                  href={companyTw}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Visit Company Twitter / X Profile"
                  className="w-7 h-7 rounded-md bg-slate-800 text-slate-300 hover:text-sky-400 hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors"
                >
                  <TwitterXIcon className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {/* Company Social (Facebook/Other) Icon */}
              {companySoc ? (
                <a
                  href={companySoc}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Visit Company Social Page"
                  className="w-7 h-7 rounded-md bg-slate-800 text-slate-300 hover:text-blue-500 hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {!companyWeb && !companyLi && !companyTw && !companySoc && (
                <span className="text-[11px] text-slate-500 italic">No links</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Outreach Controls & Persistent Status */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-3">
        {/* Checkbox Controls: Requested & Messaged */}
        <div className="grid grid-cols-2 gap-2">
          {/* Requested Checkbox */}
          <label className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-all ${
            requested
              ? 'bg-sky-950/40 border-sky-800/80 text-sky-300'
              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}>
            <input
              type="checkbox"
              checked={requested}
              onChange={handleToggleRequested}
              className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-900 cursor-pointer"
            />
            <span className="text-xs font-semibold">Requested</span>
          </label>

          {/* Messaged Checkbox */}
          <label className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-all ${
            messaged
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}>
            <input
              type="checkbox"
              checked={messaged}
              onChange={handleToggleMessaged}
              className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
            />
            <span className="text-xs font-semibold">Messaged</span>
          </label>
        </div>

        {/* Status / Notes Section (Persisted to MongoDB) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400">
              Status & Notes
            </span>
            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
              {saveStatus === 'saving' && (
                <span className="text-amber-400 inline-flex items-center space-x-1 animate-pulse">
                  <Clock className="w-3 h-3" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-emerald-400 inline-flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Saved</span>
                </span>
              )}
            </div>
          </div>

          <textarea
            value={statusNotes}
            onChange={handleNotesChange}
            onBlur={handleBlurNotes}
            rows={2}
            placeholder="Write status, follow-up dates, custom notes..."
            className="w-full text-xs bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
