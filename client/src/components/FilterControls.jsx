import React from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Filter, 
  MapPin, 
  Briefcase, 
  RotateCcw,
  SlidersHorizontal 
} from 'lucide-react';

export default function FilterControls({
  filters,
  onChangeFilter,
  onResetFilters,
  locations = [],
  niches = [],
  totalFound = 0,
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="relative md:col-span-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChangeFilter('search', e.target.value)}
            placeholder="Search by name, company, title, city..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onChangeFilter('search', '')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort By Field */}
        <div className="md:col-span-3 flex items-center space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            {/* <select
              value={filters.sortBy}
              onChange={(e) => onChangeFilter('sortBy', e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs sm:text-sm bg-slate-950/60 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="location">Sort by Location</option>
              <option value="companyName">Sort by Company Name</option>
              <option value="name">Sort by Recruiter Name</option>
              <option value="requested">Sort by Requested</option>
              <option value="messaged">Sort by Messaged</option>
              <option value="updatedAt">Sort by Recently Updated</option>
            </select> */}
          </div>

          {/* Sort Order Toggle (Asc / Desc) */}
          <button
            onClick={() =>
              onChangeFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
            }
            className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={filters.sortOrder === 'asc' ? 'Ascending (A-Z / Low-High)' : 'Descending (Z-A / High-Low)'}
          >
            {filters.sortOrder.toUpperCase()}
          </button>
        </div>

        {/* Outreach Status Filter (Requested / Messaged) */}
        <div className="md:col-span-2">
          <select
            value={filters.statusFilter || 'all'}
            onChange={(e) => {
              const val = e.target.value;
              onChangeFilter('statusFilter', val);
              if (val === 'all') {
                onChangeFilter('requested', '');
                onChangeFilter('messaged', '');
              } else if (val === 'requested_yes') {
                onChangeFilter('requested', 'true');
                onChangeFilter('messaged', '');
              } else if (val === 'requested_no') {
                onChangeFilter('requested', 'false');
                onChangeFilter('messaged', '');
              } else if (val === 'messaged_yes') {
                onChangeFilter('requested', '');
                onChangeFilter('messaged', 'true');
              } else if (val === 'messaged_no') {
                onChangeFilter('requested', '');
                onChangeFilter('messaged', 'false');
              } else if (val === 'both_yes') {
                onChangeFilter('requested', 'true');
                onChangeFilter('messaged', 'true');
              }
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950/60 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Status: All Statuses</option>
            <option value="requested_yes">Requested (Yes)</option>
            <option value="requested_no">Requested (Pending)</option>
            <option value="messaged_yes">Messaged (Yes)</option>
            <option value="messaged_no">Messaged (Pending)</option>
            <option value="both_yes">Both Completed</option>
          </select>
        </div>

        {/* Location Dropdown */}
        <div className="md:col-span-3 flex items-center space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <select
              value={filters.location}
              onChange={(e) => onChangeFilter('location', e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs sm:text-sm bg-slate-950/60 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 truncate cursor-pointer"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={onResetFilters}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Second row: Niche filter & results counter */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Niche:</span>
          <select
            value={filters.niche}
            onChange={(e) => onChangeFilter('niche', e.target.value)}
            className="max-w-xs px-2.5 py-1 text-xs bg-slate-950/60 border border-slate-700/80 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
          >
            <option value="all">All Niches & Industries</option>
            {niches.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-400">
            Showing <strong className="text-slate-200">{totalFound.toLocaleString()}</strong> recruiters
          </span>
          {(filters.search || filters.location !== 'all' || filters.niche !== 'all' || filters.requested || filters.messaged) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-indigo-950 text-indigo-300 border border-indigo-800">
              Filtered
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
