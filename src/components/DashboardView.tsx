import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, ShieldAlert, Map, BadgeCheck, X, Search, Filter, 
  ChevronLeft, ChevronRight, Eye, RefreshCw, Calendar, ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Grievance, DashboardStats, GrievanceStatus, GrievanceCategory, UrgencyLevel } from '../types.js';

interface DashboardViewProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const STATES_LIST = [
  'Tamil Nadu', 'Maharashtra', 'Karnataka', 'Uttar Pradesh', 'Kerala', 
  'Delhi', 'West Bengal', 'Telangana', 'Andhra Pradesh', 'Bihar', 
  'Gujarat', 'Rajasthan', 'Punjab', 'Madhya Pradesh', 'Odisha'
];

const CATEGORIES_LIST = ['Water', 'Roads', 'Healthcare', 'Education', 'Environment', 'Infrastructure', 'Other'];
const URGENCY_LIST = ['High', 'Medium', 'Low'];
const STATUS_LIST = ['Pending', 'Acknowledged', 'Resolved'];

export default function DashboardView({ onAddToast }: DashboardViewProps) {
  // Stats and Grievance lists
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Loading and Filtering states
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);
  
  // Filter variables
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Selected Grievance for Side Drawer
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch Stats
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const res = await fetch('/api/grievances/stats');
      if (!res.ok) throw new Error('Failed to fetch stats.');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      onAddToast('Failed to load dashboard metrics.', 'error');
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Fetch Grievances list
  const fetchGrievances = async () => {
    setIsListLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        state: selectedState,
        category: selectedCategory,
        urgency: selectedUrgency,
        status: selectedStatus,
      });

      const res = await fetch(`/api/grievances?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch grievances.');
      const result = await res.json();
      setGrievances(result.data);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error(err);
      onAddToast('Failed to load grievances catalog.', 'error');
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchGrievances();
  }, [page, search, selectedState, selectedCategory, selectedUrgency, selectedStatus]);

  const handleUpdateStatus = async (id: string, newStatus: GrievanceStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/grievance/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Status update failed.');
      
      const updated = await res.json();
      
      // Update local lists
      setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
      if (selectedGrievance && selectedGrievance.id === id) {
        setSelectedGrievance(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      onAddToast(`Grievance ${id} status updated to ${newStatus}!`, 'success');
      
      // Refresh statistics
      fetchStats();
    } catch (err: any) {
      console.error(err);
      onAddToast('Failed to update status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedState('');
    setSelectedCategory('');
    setSelectedUrgency('');
    setSelectedStatus('');
    setPage(1);
    onAddToast('All catalog search filters cleared.', 'success');
  };

  // Re-designed highly professional color scheme
  const COLORS = ['#EF4444', '#F59E0B', '#10B981']; // High (rose-500), Medium (amber-500), Low (emerald-500)
  const BAR_COLORS = ['#4F46E5', '#2563EB', '#0D9488', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Parliamentary Command Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time constituency intelligence, automated classifications, and citizen grievance oversight.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            July 4, 2026 (Week 27)
          </span>
          <button
            onClick={() => {
              fetchStats();
              fetchGrievances();
              onAddToast('Syncing real-time intelligence data...', 'success');
            }}
            className="p-2 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all cursor-pointer shadow-sm"
            title="Refresh Sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric stats card grid */}
      {isStatsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {/* Metric 1 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Volume</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block font-sans">
                  {stats.totalGrievancesThisWeek}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1.5">
                  <ArrowUpRight className="w-3 h-3" /> +14.2% vs last week
                </span>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-xl border border-indigo-100">
                <FileText className="w-6 h-6" />
              </div>
            </motion.div>

            {/* Metric 2 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Cases</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1 block font-sans">
                  {stats.highPriorityCount}
                </span>
                <span className="text-[10px] text-rose-500 font-semibold mt-1.5 block">
                  🚨 Action required immediately
                </span>
              </div>
              <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl border border-rose-100">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </motion.div>

            {/* Metric 3 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Federal Zones</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block font-sans">
                  {stats.statesCovered}
                </span>
                <span className="text-[10px] text-slate-500 mt-1.5 block font-medium">
                  Covering 15 core active zones
                </span>
              </div>
              <div className="bg-teal-50 text-teal-600 p-3.5 rounded-xl border border-teal-100">
                <Map className="w-6 h-6" />
              </div>
            </motion.div>

            {/* Metric 4 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Complaints</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block font-sans">
                  {stats.resolvedThisWeek}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1.5 block">
                  ✓ {Math.round((stats.resolvedThisWeek / (stats.totalGrievancesThisWeek || 1)) * 100)}% clearance rate
                </span>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl border border-emerald-100">
                <BadgeCheck className="w-6 h-6" />
              </div>
            </motion.div>
          </div>
        )
      )}

      {/* Dynamic Trend Alert Banner */}
      {!alertDismissed && stats?.trendAlert?.triggered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-full bg-rose-500/5 rotate-12 blur-md pointer-events-none" />
          <div className="flex items-center gap-3 pr-8">
            <span className="text-xs sm:text-sm font-semibold">{stats.trendAlert.text}</span>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Analytics Charts section (Side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Bar Chart: Categories Volume */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-3 flex flex-col justify-between h-[340px]">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">Top Categories by Grievance Volume</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Total complaints classified during the current reporting week.</p>
          </div>

          <div className="w-full h-[220px] mt-4">
            {isStatsLoading ? (
              <div className="w-full h-full bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              stats && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryVolume} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} contentStyle={{ backgroundColor: '#FFF', borderColor: '#E2E8F0', color: '#1E293B', fontSize: '11px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.categoryVolume.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>

        {/* Donut Chart: Urgency breakdown */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-2 flex flex-col justify-between h-[340px]">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">Urgency Breakdown Percentage</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Risk classification percentages for effective scheduling.</p>
          </div>

          <div className="w-full h-[220px] mt-4 flex items-center justify-center">
            {isStatsLoading ? (
              <div className="w-40 h-40 bg-slate-50 rounded-full animate-pulse" />
            ) : (
              stats && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.urgencyBreakdown.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stats.urgencyBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: '#FFF', borderColor: '#E2E8F0', color: '#1E293B', fontSize: '11px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#64748B' }} />
                  </PieChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>
      </div>

      {/* Catalog & Filter controls */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              📋 All Active Grievances Catalog
              <span className="text-[10px] bg-white text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                {totalCount} total
              </span>
            </h2>
            
            {/* Keyword Search */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search district, summary, ID..."
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Filtering row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Filter 1: State */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">State</span>
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value="">All States</option>
                {STATES_LIST.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Category */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value="">All Categories</option>
                {CATEGORIES_LIST.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Filter 3: Urgency */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Urgency</span>
              <select
                value={selectedUrgency}
                onChange={(e) => { setSelectedUrgency(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value="">All Urgency</option>
                {URGENCY_LIST.map(urg => (
                  <option key={urg} value={urg}>{urg}</option>
                ))}
              </select>
            </div>

            {/* Filter 4: Status */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value="">All Statuses</option>
                {STATUS_LIST.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Clear filters button */}
            <div className="flex items-end col-span-2 sm:col-span-1">
              <button
                onClick={handleClearFilters}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-3 rounded-lg border border-slate-200 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table View with responsive column hiding */}
        <div className="overflow-x-auto">
          {isListLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="h-10 bg-slate-50 border border-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : grievances.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3 bg-white">
              <div className="bg-slate-50 p-4 rounded-full inline-flex text-slate-400 border border-slate-200">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-slate-800 text-xs">No matching grievances found</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Try widening your search terms or clearing state and category filters.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs bg-white min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider select-none">
                  <th className="p-4 w-20">ID</th>
                  <th className="p-4 w-32">District</th>
                  <th className="p-4 w-32 hidden sm:table-cell">State</th>
                  <th className="p-4 w-28">Category</th>
                  <th className="p-4 w-24">Urgency</th>
                  <th className="p-4 hidden md:table-cell">AI Summary</th>
                  <th className="p-4 w-28">Status</th>
                  <th className="p-4 w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {grievances.map((g) => (
                  <tr 
                    key={g.id}
                    onClick={() => setSelectedGrievance(g)}
                    className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                  >
                    <td className="p-4 font-bold text-indigo-600 font-mono group-hover:text-indigo-500">{g.id}</td>
                    <td className="p-4 text-slate-900 truncate max-w-[120px]" title={g.district}>{g.district}</td>
                    <td className="p-4 text-slate-500 hidden sm:table-cell truncate max-w-[120px]">{g.state}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-semibold text-[10px]">
                        {g.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                        g.urgency === 'High' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : g.urgency === 'Medium' 
                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {g.urgency}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell max-w-xs truncate text-slate-500 italic" title={g.summary}>
                      "{g.summary}"
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] inline-block ${
                        g.status === 'Resolved' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : g.status === 'Acknowledged' 
                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedGrievance(g)}
                        className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs select-none">
            <span className="font-semibold text-slate-500">
              Page <span className="text-slate-800 font-bold">{page}</span> of <span className="text-slate-800 font-bold">{totalPages}</span>
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grievance Detail Side Drawer Panel Overlay */}
      <AnimatePresence>
        {selectedGrievance && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGrievance(null)}
              className="fixed inset-0 bg-slate-900 z-50 cursor-pointer"
            />
            
            {/* Drawer (Optimized full-screen on mobile, elegant side drawer on desktop) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 h-screen w-full sm:max-w-lg bg-white border-l border-slate-200 shadow-2xl z-[60] flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                    {selectedGrievance.id}
                  </span>
                  <h3 className="font-bold text-slate-900 mt-2 font-sans text-sm sm:text-base">Grievance Investigation Desk</h3>
                </div>
                <button
                  onClick={() => setSelectedGrievance(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700">
                
                {/* Badges block */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-slate-50 text-slate-600 font-semibold px-2.5 py-1 rounded-md border border-slate-200 text-[10px] sm:text-[11px]">
                    Category: {selectedGrievance.category}
                  </span>
                  <span className={`font-bold px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] uppercase border ${
                    selectedGrievance.urgency === 'High' 
                      ? 'bg-rose-50 border-rose-200 text-rose-600' 
                      : selectedGrievance.urgency === 'Medium' 
                        ? 'bg-amber-50 border-amber-200 text-amber-600' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}>
                    Risk: {selectedGrievance.urgency}
                  </span>
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] uppercase">
                    Tone: {selectedGrievance.sentiment}
                  </span>
                </div>

                {/* Locations block */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 font-medium">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Jurisdiction</span>
                    <span className="text-slate-800 text-right">{selectedGrievance.district}, {selectedGrievance.state}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 gap-2">
                    <span className="text-slate-500">Filing Date</span>
                    <span className="text-slate-800 font-mono text-right">
                      {new Date(selectedGrievance.submitted_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Grievance text */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Original Citizen Letter</span>
                  <p className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-600 text-xs italic leading-relaxed whitespace-pre-wrap">
                    "{selectedGrievance.text}"
                  </p>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">AI-Generated Summary</span>
                  <p className="text-slate-800 font-semibold italic text-xs sm:text-sm">
                    "{selectedGrievance.summary}"
                  </p>
                </div>

                {/* Impact */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Impacted Group</span>
                  <p className="text-indigo-700 font-bold bg-indigo-50 px-3 py-2 border border-indigo-100 rounded-xl text-xs">
                    {selectedGrievance.affected_group}
                  </p>
                </div>

                {/* Recommended Action */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">AI Suggested Action</span>
                  <p className="text-teal-700 font-bold bg-teal-50 px-3 py-2 border border-teal-100 rounded-xl text-xs">
                    {selectedGrievance.suggested_action}
                  </p>
                </div>

              </div>

              {/* Status Update Actions */}
              <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Grievance Case Status Action</span>
                <div className="flex gap-2">
                  {(['Pending', 'Acknowledged', 'Resolved'] as GrievanceStatus[]).map((st) => {
                    const isCurrent = selectedGrievance.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedGrievance.id, st)}
                        disabled={isUpdatingStatus || isCurrent}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isCurrent
                            ? st === 'Resolved'
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                              : st === 'Acknowledged'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                                : 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
