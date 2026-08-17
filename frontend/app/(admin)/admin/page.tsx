'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Clock, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/adminService';
import Link from 'next/link';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    pending: 0,
    stalePending: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [pendingApps, usersList] = await Promise.all([
          adminService.getApplications(),
          adminService.getUsers(),
        ]);

        const now = new Date().getTime();
        const staleApps = pendingApps.filter((app: any) => {
          const updatedAt = new Date(app.updatedAt).getTime();
          return (now - updatedAt) > (3 * 24 * 60 * 60 * 1000); // 3 Days
        });

        setMetrics({
          pending: pendingApps.length,
          stalePending: staleApps.length,
          totalUsers: usersList.total || 0,
        });
      } catch (error) {
        console.error('Failed to load admin metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <LayoutDashboard className="text-amber-500 w-8 h-8" />
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-2">System overview and high-level metrics.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <Link href="/admin/approvals" className="block bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-1 group-hover:text-amber-400 transition">Pending Approvals</p>
                <h3 className="text-4xl font-bold text-slate-100">{metrics.pending}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </Link>

          {/* Stale Applications */}
          <Link href="/admin/approvals?filter=stale" className="block bg-red-950/20 border border-red-900/50 rounded-2xl p-6 hover:border-red-500/50 transition cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-red-400 mb-1 group-hover:text-red-300 transition">Stale Applications (&gt;3 Days)</p>
                <h3 className="text-4xl font-bold text-red-100">{metrics.stalePending}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <p className="text-xs text-red-400/80 mt-4">Requires immediate review</p>
          </Link>

          {/* Total Users */}
          <Link href="/admin/users" className="block bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-1 group-hover:text-blue-400 transition">Total Users</p>
                <h3 className="text-4xl font-bold text-slate-100">{metrics.totalUsers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
