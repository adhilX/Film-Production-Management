'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Clock, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/adminService';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import OverviewModule from '@/components/modules/OverviewModule';
import LogoutButton from '@/app/components/LogoutButton';

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
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

    const hasAdminPerm = user?.permissions?.includes('users.approve') || user?.permissions?.includes('roles.manage');
    if (hasAdminPerm) {
      fetchMetrics();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return null;

  const hasAdminPerm = user?.permissions?.includes('users.approve') || user?.permissions?.includes('roles.manage');
  if (!hasAdminPerm) {
    return <OverviewModule />;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 animate-in fade-in duration-300">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <Link href="/approvals" className="block bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-amber-500/50 hover:shadow-md transition cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-1 group-hover:text-amber-600 transition">Pending Approvals</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{metrics.pending}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Link>

          {/* Stale Applications */}
          <Link href="/approvals?filter=stale" className="block bg-red-50/30 border border-red-200/80 rounded-2xl p-6 hover:border-red-500/50 hover:shadow-md transition cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-650 mb-1 group-hover:text-red-700 transition font-sans">Stale Applications (&gt;3 Days)</p>
                <h3 className="text-3xl font-extrabold text-red-900">{metrics.stalePending}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-[10px] text-red-600 font-bold mt-4 uppercase tracking-wider">Requires immediate review</p>
          </Link>

          {/* Total Users */}
          <Link href="/users" className="block bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-indigo-500/50 hover:shadow-md transition cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-1 group-hover:text-indigo-650 transition">Total Users</p>
                <h3 className="text-3xl font-extrabold text-slate-900">{metrics.totalUsers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#4f46e5]" />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
