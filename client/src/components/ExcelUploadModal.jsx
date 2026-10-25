import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Database,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

export default function ExcelUploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('append'); // 'append' | 'replace'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an Excel or CSV file first.');
      return;
    }

    setUploading(true);
    setError('');
    setResultMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    try {
      const response = await api.post('/recruiters/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setResultMessage(response.data.message || 'File processed successfully!');
        setFile(null);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload and parse Excel sheet.');
    } finally {
      setUploading(false);
    }
  };

  const handleDirectSeed = async () => {
    setUploading(true);
    setError('');
    setResultMessage('');

    try {
      const response = await api.post('/recruiters/seed-default', { mode });
      if (response.data.success) {
        setResultMessage(response.data.message || 'Seeded successfully from attached sheet!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to seed from default sheet.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Import Recruiter Spreadsheet</h2>
            <p className="text-xs text-slate-400">Owner privilege: Upload Excel (.xlsx, .xls) or CSV files</p>
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resultMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            file
              ? 'border-indigo-500/80 bg-indigo-950/20'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <UploadCloud className={`w-10 h-10 mx-auto mb-2 ${file ? 'text-indigo-400' : 'text-slate-500'}`} />

          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white truncate max-w-xs mx-auto">
                {file.name}
              </p>
              <p className="text-xs text-slate-400">
                {(file.size / 1024).toFixed(1)} KB &bull; Click to choose a different file
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-300">
                Drop your Excel or CSV file here, or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports .xlsx, .xls, and .csv formats
              </p>
            </div>
          )}
        </div>

        {/* Ingestion Mode Selector */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Import Mode
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode('append')}
              className={`p-2 rounded-lg border text-left transition-all ${
                mode === 'append'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="font-semibold">Append</div>
              <div className="text-[10px] text-slate-400">Add to existing list</div>
            </button>

            <button
              type="button"
              onClick={() => setMode('replace')}
              className={`p-2 rounded-lg border text-left transition-all ${
                mode === 'replace'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="font-semibold">Replace All</div>
              <div className="text-[10px] text-slate-400">Wipe and replace list</div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between space-x-3">
          {/* Quick Seed Button */}
          <button
            type="button"
            onClick={handleDirectSeed}
            disabled={uploading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
            title="Restore original dataset from attached Google Sheet"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Original Sheet</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{uploading ? 'Processing...' : 'Upload & Import'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
