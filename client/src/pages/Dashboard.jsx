import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import FilterControls from '../components/FilterControls';
import RecruiterCard from '../components/RecruiterCard';
import ExcelUploadModal from '../components/ExcelUploadModal';
import api from '../services/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { isOwner } = useAuth();

  // Data states
  const [recruiters, setRecruiters] = useState([]);
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [niches, setNiches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1,
  });

  // Filter & sort states
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'location', // default sort
    sortOrder: 'asc',
    requested: '',
    messaged: '',
    statusFilter: 'all',
    location: 'all',
    niche: 'all',
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch Stats & Filter Options
  const fetchMetadata = async () => {
    try {
      const [statsRes, filtersRes] = await Promise.all([
        api.get('/recruiters/stats'),
        api.get('/recruiters/filters'),
      ]);
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (filtersRes.data.success) {
        setLocations(filtersRes.data.locations || []);
        setNiches(filtersRes.data.niches || []);
      }
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  // Fetch Recruiters with current filters and pagination
  const fetchRecruiters = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page,
          limit: pagination.limit,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        };

        if (filters.search) params.search = filters.search;
        if (filters.requested) params.requested = filters.requested;
        if (filters.messaged) params.messaged = filters.messaged;
        if (filters.location && filters.location !== 'all') params.location = filters.location;
        if (filters.niche && filters.niche !== 'all') params.niche = filters.niche;

        const { data } = await api.get('/recruiters', { params });

        if (data.success) {
          setRecruiters(data.recruiters || []);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch recruiters:', err);
        setError('Failed to load recruiters. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  // Initial load
  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch when filters or page changes
  useEffect(() => {
    fetchRecruiters(1);
  }, [filters, fetchRecruiters]);

  // Handle single recruiter card update (requested, messaged, statusNotes)
  const handleUpdateRecruiter = async (id, updateData) => {
    // Optimistic local state update
    setRecruiters((prev) =>
      prev.map((r) => (r._id === id ? { ...r, ...updateData } : r))
    );

    // Update in backend
    try {
      await api.patch(`/recruiters/${id}`, updateData);
      // Refresh stats in background quietly
      const statsRes = await api.get('/recruiters/stats');
      if (statsRes.data.success) setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Failed to update recruiter on server:', err);
      // Revert if error
      fetchRecruiters(pagination.page);
      throw err;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      sortBy: 'location',
      sortOrder: 'asc',
      requested: '',
      messaged: '',
      statusFilter: 'all',
      location: 'all',
      niche: 'all',
    });
  };

  const handleDirectSeed = async () => {
    if (!window.confirm('Restore/seed recruiters from the original attached Google Sheet?')) return;
    setIsSeeding(true);
    try {
      await api.post('/recruiters/seed-default', { mode: 'replace' });
      await fetchMetadata();
      await fetchRecruiters(1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to seed dataset.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchRecruiters(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pb-16">
      {/* Top Navigation */}
      <Navbar
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onSeedData={handleDirectSeed}
        isSeeding={isSeeding}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Metric / KPIs Bar */}
        {/* <StatsBar stats={stats} /> */}

        {/* Search, Filter, Sort Controls */}
        <FilterControls
          filters={filters}
          onChangeFilter={handleFilterChange}
          onResetFilters={handleResetFilters}
          locations={locations}
          niches={niches}
          totalFound={pagination.total}
        />

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchRecruiters(pagination.page)}
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Recruiter Card Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading recruiter intelligence...</p>
          </div>
        ) : recruiters.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 max-w-lg mx-auto">
            <FolderPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Recruiters Found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Try adjusting your search query, clearing filters, or importing an Excel sheet.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Reset Filters
              </button>
              {isOwner && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Import Excel Sheet
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recruiters.map((recruiter) => (
              <RecruiterCard
                key={recruiter._id}
                recruiter={recruiter}
                onUpdate={handleUpdateRecruiter}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Showing page <strong className="text-slate-200">{pagination.page}</strong> of{' '}
              <strong className="text-slate-200">{pagination.totalPages}</strong> (
              {pagination.total.toLocaleString()} total recruiters)
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 flex items-center space-x-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-3 py-1.5 text-xs font-semibold text-indigo-400 bg-indigo-950/60 rounded-lg border border-indigo-900">
                {pagination.page}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 flex items-center space-x-1 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Excel Upload Modal (Owner only) */}
      {isOwner && (
        <ExcelUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            fetchMetadata();
            fetchRecruiters(1);
          }}
        />
      )}
    </div>
  );
}
