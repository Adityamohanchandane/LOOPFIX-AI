import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, RefreshCw, Search, Filter, ChevronDown,
  AlertTriangle, TrendingUp, Clock, CheckCircle, Loader2,
  Database, Zap, X, SlidersHorizontal, BarChart3, PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../lib/api.js';
import { useToast } from '../contexts/ToastContext.jsx';
import StatsCard from '../components/StatsCard.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';
import { CATEGORIES, STATUSES, URGENCIES } from '../lib/utils.js';

export default function Dashboard() {
  const { toast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [mode, setMode] = useState('live');
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Seeding
  const [seeding, setSeeding] = useState(false);

  const searchTimeoutRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const result = await complaintsApi.stats();
      setStats(result);
      setMode(result.mode);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await complaintsApi.list({
        status: filterStatus || undefined,
        category: filterCategory || undefined,
        urgency: filterUrgency || undefined,
        search: search || undefined,
        limit: 50,
      });
      setComplaints(result.data || []);
      setMode(result.mode);
    } catch (err) {
      console.error('Complaints error:', err);
      setError('Failed to load complaints. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterUrgency, search]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchComplaints();
  }, []);

  // Refetch on filter change
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchComplaints();
    }, search ? 400 : 0);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [filterStatus, filterCategory, filterUrgency, search]);

  // Status update
  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await complaintsApi.update(id, { status: newStatus });
      setComplaints(prev =>
        prev.map(c => c.id === id
          ? { ...c, status: newStatus, resolved_at: newStatus === 'Resolved' ? new Date().toISOString() : c.resolved_at }
          : c
        )
      );
      fetchStats();
      toast.success(`Status updated to "${newStatus}"`);
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  }, [fetchStats, toast]);

  // Seed demo data
  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const result = await complaintsApi.seedDemo();
      toast.success(result.message || 'Demo data seeded!');
      await Promise.all([fetchStats(), fetchComplaints()]);
    } catch (err) {
      toast.error('Seed failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const activeFilterCount = [filterStatus, filterCategory, filterUrgency].filter(Boolean).length;

  function clearFilters() {
    setFilterStatus('');
    setFilterCategory('');
    setFilterUrgency('');
    setSearch('');
  }

  const recurringComplaints = complaints.filter(c => c.recurring_match_ids?.length > 0);
  const highPriorityOpen = complaints.filter(c => ['High', 'Critical'].includes(c.urgency) && c.status !== 'Resolved');

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="ambient-orb w-96 h-96 bg-violet-600/8 top-0 right-0 translate-x-1/3" />
        <div className="ambient-orb w-72 h-72 bg-blue-600/8 bottom-1/3 left-0 -translate-x-1/3" />
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-5 h-5 text-blue-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
              {mode === 'demo' && (
                <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {mode === 'demo'
                ? 'Running in demo mode — data is not persisted to a database'
                : 'Live data from Supabase PostgreSQL'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {complaints.length === 0 && !loading && (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="btn-secondary text-sm py-2 px-4"
                title="Load demo complaints to demonstrate the system"
              >
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Load Demo Data
              </button>
            )}
            <button
              onClick={() => { fetchStats(); fetchComplaints(); }}
              className="btn-secondary text-sm py-2 px-4"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <Link to="/submit" className="btn-primary text-sm py-2 px-4">
              <PlusCircle className="w-4 h-4" />
              New Report
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
          <div className="lg:col-span-1">
            <StatsCard label="Total" value={stats?.total} icon={BarChart3} color="blue" loading={statsLoading} />
          </div>
          <div className="lg:col-span-1">
            <StatsCard label="Open" value={stats?.open} icon={Clock} color="cyan" loading={statsLoading} sublabel="Needs action" />
          </div>
          <div className="lg:col-span-1">
            <StatsCard label="In Progress" value={stats?.inProgress} icon={Loader2} color="yellow" loading={statsLoading} />
          </div>
          <div className="lg:col-span-1">
            <StatsCard label="Resolved" value={stats?.resolved} icon={CheckCircle} color="green" loading={statsLoading} />
          </div>
          <div className="lg:col-span-1">
            <StatsCard label="High Priority" value={stats?.highPriority} icon={AlertTriangle} color="orange" loading={statsLoading} sublabel="High + Critical" />
          </div>
          <div className="lg:col-span-1">
            <StatsCard label="Recurring" value={stats?.recurring} icon={TrendingUp} color="red" loading={statsLoading} sublabel="Matched to history" />
          </div>
        </div>

        {/* Recurring Issues Spotlight */}
        {recurringComplaints.length > 0 && (
          <section className="mb-8" aria-labelledby="recurring-heading">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <h2 id="recurring-heading" className="text-white font-semibold">
                Recurring Issues
                <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-xs font-medium">
                  {recurringComplaints.length}
                </span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recurringComplaints.map(c => (
                <ComplaintCard key={c.id} complaint={c} onStatusChange={handleStatusChange} compact />
              ))}
            </div>
          </section>
        )}

        {/* High Priority Open Spotlight */}
        {highPriorityOpen.length > 0 && (
          <section className="mb-8" aria-labelledby="highpri-heading">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 id="highpri-heading" className="text-white font-semibold">
                High Priority — Needs Immediate Attention
                <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-medium">
                  {highPriorityOpen.length}
                </span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {highPriorityOpen.map(c => (
                <ComplaintCard key={c.id} complaint={c} onStatusChange={handleStatusChange} compact />
              ))}
            </div>
          </section>
        )}

        {/* All Complaints */}
        <section aria-labelledby="all-heading">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search complaints..."
                className="form-input pl-9 pr-4 py-2.5 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search complaints"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`btn-secondary text-sm py-2 px-4 shrink-0 ${showFilters ? 'bg-white/10 border-white/30' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="btn-danger text-sm py-2 px-4 shrink-0">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="glass-card p-4 mb-4 grid sm:grid-cols-3 gap-3 animate-slide-up">
              <div>
                <label className="form-label text-xs">Status</label>
                <div className="relative">
                  <select className="form-select pr-8 py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label text-xs">Category</label>
                <div className="relative">
                  <select className="form-select pr-8 py-2 text-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="">All categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label text-xs">Urgency</label>
                <div className="relative">
                  <select className="form-select pr-8 py-2 text-sm" value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}>
                    <option value="">All urgencies</option>
                    {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Heading + count */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="all-heading" className="text-white font-semibold">
              All Complaints
              {!loading && (
                <span className="ml-2 text-gray-500 text-sm font-normal">
                  ({complaints.length} shown)
                </span>
              )}
            </h2>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass-card p-5 space-y-3">
                  <div className="shimmer h-4 w-3/4 rounded" />
                  <div className="shimmer h-3 w-1/2 rounded" />
                  <div className="shimmer h-3 w-2/3 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="glass-card p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-300 font-medium mb-1">{error}</p>
              <p className="text-gray-500 text-sm mb-4">
                Make sure the Express server is running on port 3001.
              </p>
              <button onClick={fetchComplaints} className="btn-secondary text-sm">
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && complaints.length === 0 && (
            <div className="glass-card p-10 text-center">
              <Zap className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">
                {activeFilterCount > 0 || search ? 'No complaints match your filters' : 'No complaints yet'}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {activeFilterCount > 0 || search
                  ? 'Try clearing your filters to see all complaints.'
                  : 'Get started by submitting the first complaint, or load demo data to explore the system.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(activeFilterCount > 0 || search) ? (
                  <button onClick={clearFilters} className="btn-secondary text-sm">
                    Clear Filters
                  </button>
                ) : (
                  <>
                    <button onClick={handleSeedDemo} disabled={seeding} className="btn-secondary text-sm">
                      {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      Load Demo Data
                    </button>
                    <Link to="/submit" className="btn-primary text-sm">
                      <PlusCircle className="w-4 h-4" />
                      Submit First Complaint
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Complaint grid */}
          {!loading && !error && complaints.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {complaints.map(c => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
