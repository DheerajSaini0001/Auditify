import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, 
  SearchCheck, 
  AlertTriangle, 
  Filter, 
  RefreshCcw, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:2000";

const AdminDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalAudits: 0, uniqueIPs: 0, suspiciousIPs: [] });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ ip: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/stats`);
      if (data.success) {
        setStats({
          totalAudits: data.totalAudits,
          uniqueIPs: data.uniqueIPs,
          suspiciousIPs: data.suspiciousIPs
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { ip, startDate, endDate } = filters;
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(ip && { ip }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const { data } = await axios.get(`${API_BASE}/api/admin/logs?${params.toString()}`);
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const handleReset = () => {
    setFilters({ ip: "", startDate: "", endDate: "" });
    setPage(1);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: "bg-emerald-100/80 text-emerald-800 border-emerald-200 shadow-sm",
      failed: "bg-rose-100/80 text-rose-800 border-rose-200 shadow-sm",
      pending: "bg-amber-100/80 text-amber-800 border-amber-200 shadow-sm",
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${variants[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  const formatDuration = (ms) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Monitor audit activity and track user sessions.</p>
          </div>
          <button 
            onClick={() => { fetchStats(); fetchLogs(); }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm font-medium"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <SearchCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Audits</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalAudits}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Unique IPs</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.uniqueIPs}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Suspicious IPs</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.suspiciousIPs.length}</h3>
            </div>
          </div>
        </div>

        {/* Suspicious Alert */}
        {stats.suspiciousIPs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-start space-x-4 relative z-10">
              <div className="mt-1">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-red-900">Suspicious Activity Detected</h4>
                <p className="text-red-700 mt-1">Multiple IPs have exceeded the audit threshold in the last hour:</p>
                <div className="mt-4 flex flex-wrap gap-4">
                  {stats.suspiciousIPs.map((item, idx) => (
                    <div key={idx} className="bg-white bg-opacity-60 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium text-red-800">
                      {item.ip} — <span className="font-bold">{item.count} audits</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-5">
              <AlertTriangle className="w-32 h-32 text-red-900" />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row items-end gap-4">
            <div className="w-full lg:w-1/3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">IP Address</label>
              <input 
                type="text" 
                name="ip"
                placeholder="Search by IP..."
                value={filters.ip}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-900"
              />
            </div>
            <div className="w-full lg:w-1/4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
              <input 
                type="date" 
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-900"
              />
            </div>
            <div className="w-full lg:w-1/4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Date</label>
              <input 
                type="date" 
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-900"
              />
            </div>
            <button 
              onClick={handleReset}
              className="w-full lg:w-auto px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg transition-all font-medium flex items-center justify-center"
            >
              <Filter className="w-4 h-4 mr-2" /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">URL</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Browser</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">OS</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Device</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Resolution</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Bot Check</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Duration</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
                      No logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group text-xs sm:text-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs max-w-[150px] truncate" title={log.url}>{log.url}</span>
                          <a href={log.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-600" />
                          </a>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]" title={`Referrer: ${log.referrer}`}>
                          Ref: {log.referrer}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{log.ip}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                          {log.country !== "unknown" && <span>{log.country}</span>}
                          {log.city !== "unknown" && <span>• {log.city}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">{log.browser}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{log.os}</td>
                      <td className="px-6 py-4 text-center text-gray-700 capitalize">{log.device}</td>
                      <td className="px-6 py-4 text-center font-mono text-[10px] text-gray-600">
                        {log.screenResolution}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.captchaPassed ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            VERIFIED HUMAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            UNVERIFIED / BOT
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.score !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-sm font-bold text-gray-900">{log.score}</span>
                            <span className="text-[10px] font-bold text-indigo-500 leading-none">{log.grade}</span>
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 font-mono text-[10px]">
                        {formatDuration(log.auditDuration)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-[10px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <p className="text-xs text-gray-500 font-medium font-mono">
              Items: {logs.length} | Page {page}/{totalPages}
            </p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
