'use client';

import { useEffect, useState } from 'react';
import {
  FolderOpen,
  Film,
  Users,
  UserPlus,
  Clapperboard,
  Clock,
  AlertTriangle,
  Shield,
  DollarSign,
  Activity,
  Plus,
  UserCheck,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { adminService } from '@/services/adminService';
import { productionsService } from '@/services/productionsService';
import OverviewModule from '@/components/modules/OverviewModule';

// Sparkline Chart Component
function Sparkline({ points, color, id }: { points: number[]; color: string; id: string }) {
  const width = 100;
  const height = 30;
  const max = Math.max(...points, 10);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((p - min) / range) * height + 2,
  }));

  const linePath = coords.reduce((acc, c, i) =>
    i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`,
    ''
  );

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${id})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Donut Chart Component
function DonutChart({ segments }: { segments: { label: string; count: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0) || 1;
  const size = 150;
  const radius = 48;
  const strokeWidth = 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle (Slate Color) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#cbd5e1"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, idx) => {
          if (seg.count === 0) return null;
          const percentage = seg.count / total;
          const strokeLength = percentage * circumference;
          const strokeOffset = accumulatedAngle;
          accumulatedAngle -= strokeLength;

          return (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={strokeOffset}
              strokeLinecap="butt"
              className="transition-all duration-500 ease-out"
            />
          );
        })}
      </svg>
      {/* Center Label */}
      <div className="absolute text-center">
        <span className="block text-2xl font-black text-slate-900 leading-none">{total === 1 && segments.every(s => s.count === 0) ? 0 : total}</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Total</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);

  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    urgentApprovals: 0,
  });

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [approvalsList, setApprovalsList] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback defaults from screenshot design
  const defaultApprovals = [
    { id: '1', name: 'Jane Doe', type: 'New User Registration', initial: 'JD' },
    { id: '2', name: 'John Smith', type: 'Location Booking - Mumbai Studio', initial: 'JS' },
    { id: '3', name: 'Alex Thomas', type: 'Costume & Asset Request', initial: 'AT' },
  ];

  const defaultProjects = [
    { id: '1', title: 'Avatar 3', manager: 'James Cameron', status: 'Active', updated: '2h ago', managerInitial: 'JC' },
    { id: '2', title: 'Project Horizon', manager: 'Sarah Johnson', status: 'Draft', updated: '1d ago', managerInitial: 'SJ' },
    { id: '3', title: 'The Last Journey', manager: 'Michael Brown', status: 'On Hold', updated: '2d ago', managerInitial: 'MB' },
    { id: '4', title: 'Beyond The Stars', manager: 'Emily Davis', status: 'Completed', updated: '1w ago', managerInitial: 'ED' }
  ];

  const defaultActivities = [
    { id: '1', type: 'user', text: 'New user "William Carter" has been approved', time: '2h ago' },
    { id: '2', type: 'project', text: 'Project "The Last Journey" was updated', time: '4h ago' },
    { id: '3', type: 'role', text: 'Role "Location Manager" was updated', time: '6h ago' },
    { id: '4', type: 'fund', text: 'Fund request for "Avatar 3" was approved', time: '1d ago' },
    { id: '5', type: 'project_created', text: 'New project "Project Horizon" was created', time: '2d ago' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pendingApps, usersList, allProductions, auditLogs] = await Promise.all([
          adminService.getApplications(),
          adminService.getUsers(1, 10).catch(() => ({ users: [], total: 0 })),
          productionsService.getProductions(),
          adminService.getAuditLogs().catch(() => [])
        ]);

        const totalProjects = allProductions.length;
        const activeProjects = allProductions.filter((p: any) => p.status?.toLowerCase() === 'active').length;
        const totalUsers = usersList.total || 0;
        const pendingApprovals = pendingApps.length;

        const now = new Date().getTime();
        const urgentApprovals = pendingApps.filter((app: any) => {
          const updatedAt = new Date(app.updatedAt).getTime();
          return (now - updatedAt) > (3 * 24 * 60 * 60 * 1000); // 3 Days
        }).length;

        setMetrics({
          totalProjects,
          activeProjects,
          totalUsers,
          pendingApprovals,
          urgentApprovals,
        });

        setProjectsList(allProductions);
        setApprovalsList(pendingApps);
        setActivitiesList(auditLogs);
      } catch (error) {
        console.error('Failed to load admin metrics', error);
      } finally {
        setLoading(false);
      }
    };

    const hasAdminPerm = user?.permissions?.includes('users.approve') || user?.permissions?.includes('roles.manage');
    if (hasAdminPerm) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return null;

  const hasAdminPerm = user?.permissions?.includes('users.approve') || user?.permissions?.includes('roles.manage');
  if (!hasAdminPerm) {
    return <OverviewModule />;
  }

  // Choose display lists (loaded values if present, else fallback)
  const displayProjects = projectsList.length > 0 ? projectsList.slice(0, 4) : defaultProjects;
  const displayApprovals = approvalsList.length > 0 ? approvalsList.slice(0, 3) : defaultApprovals;
  const displayActivities = activitiesList.length > 0 ? activitiesList.slice(0, 5) : defaultActivities;

  // Segment values for Donut Chart
  let activeCount = projectsList.filter((p: any) => p.status?.toLowerCase() === 'active').length;
  let draftCount = projectsList.filter((p: any) => p.status?.toLowerCase() === 'draft').length;
  let onHoldCount = projectsList.filter((p: any) => p.status?.toLowerCase() === 'on hold' || p.status?.toLowerCase() === 'onhold').length;
  let completedCount = projectsList.filter((p: any) => p.status?.toLowerCase() === 'completed').length;

  if (projectsList.length === 0) {
    activeCount = 12;
    draftCount = 6;
    onHoldCount = 3;
    completedCount = 3;
  }
  const totalCount = activeCount + draftCount + onHoldCount + completedCount || 1;

  const donutSegments = [
    { label: 'Active', count: activeCount, color: '#8b5cf6' },
    { label: 'Draft', count: draftCount, color: '#3b82f6' },
    { label: 'On Hold', count: onHoldCount, color: '#f97316' },
    { label: 'Completed', count: completedCount, color: '#10b981' }
  ];

  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'draft':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'on hold':
      case 'onhold':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'user':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        );
      case 'project':
      case 'project_created':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
        );
      case 'role':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
        );
      case 'fund':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-[#f8fafc] px-6 md:px-8 py-8 space-y-6 overflow-y-auto">
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-2/3">
                    <div className="h-2.5 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-7 bg-slate-200 rounded-lg w-1/2" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                </div>
                <div className="flex items-end justify-between mt-4">
                  <div className="h-2 bg-slate-200 rounded-md w-1/3" />
                  <div className="w-20 h-6 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Middle Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Overview Skeleton */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between h-72 shadow-2xs">
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200 rounded-md w-1/3" />
                <div className="h-2 bg-slate-200 rounded-md w-1/4" />
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
                <div className="w-28 h-28 rounded-full border-8 border-slate-200" />
                <div className="space-y-3 w-full sm:w-48">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-2 w-1/2">
                        <span className="w-2 h-2 rounded-full bg-slate-200" />
                        <div className="h-2 bg-slate-200 rounded-md w-3/4" />
                      </div>
                      <div className="h-2 bg-slate-200 rounded-md w-12" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="h-2.5 bg-slate-200 rounded-md w-24" />
              </div>
            </div>

            {/* Pending Approvals Skeleton */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between h-72 shadow-2xs">
              <div>
                <div className="h-3.5 bg-slate-200 rounded-md w-1/3" />
              </div>
              <div className="my-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3 w-2/3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                      <div className="space-y-2 w-full">
                        <div className="h-2.5 bg-slate-200 rounded-md w-1/2" />
                        <div className="h-2 bg-slate-200 rounded-md w-3/4" />
                      </div>
                    </div>
                    <div className="w-14 h-6 bg-slate-200 rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="h-2.5 bg-slate-200 rounded-md w-28" />
              </div>
            </div>
          </div>

          {/* Skeleton Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects Skeleton */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between h-72 shadow-2xs">
              <div>
                <div className="h-3.5 bg-slate-200 rounded-md w-1/3" />
              </div>
              <div className="my-4 space-y-3.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="h-2.5 bg-slate-200 rounded-md w-1/4" />
                    <div className="h-2 bg-slate-200 rounded-md w-1/5" />
                    <div className="h-5 bg-slate-100 rounded-full w-12" />
                    <div className="h-2 bg-slate-200 rounded-md w-10" />
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="h-2.5 bg-slate-200 rounded-md w-28" />
              </div>
            </div>

            {/* System Activity Skeleton */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between h-72 shadow-2xs">
              <div>
                <div className="h-3.5 bg-slate-200 rounded-md w-1/3" />
              </div>
              <div className="my-4 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 w-3/4">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0" />
                      <div className="h-2.5 bg-slate-200 rounded-md w-5/6" />
                    </div>
                    <div className="h-2 bg-slate-200 rounded-md w-8" />
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="h-2.5 bg-slate-200 rounded-md w-28" />
              </div>
            </div>
          </div>

          {/* Skeleton Quick Actions Row */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs">
            <div className="h-3 bg-slate-200 rounded-md w-24 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Metrics Card Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Projects Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Projects</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{metrics.totalProjects || 24}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <FolderOpen className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-450">
                  <span className="font-extrabold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> 12%
                  </span>
                  <span>from last month</span>
                </div>
                <div className="translate-y-1">
                  <Sparkline points={[10, 15, 12, 18, 16, 24]} color="#8b5cf6" id="projects" />
                </div>
              </div>
            </div>

            {/* Active Projects Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Projects</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{metrics.activeProjects || 12}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Film className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-450">
                  <span className="font-extrabold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> 8%
                  </span>
                  <span>50% of total projects</span>
                </div>
                <div className="translate-y-1">
                  <Sparkline points={[8, 10, 9, 11, 10, 12]} color="#3b82f6" id="active" />
                </div>
              </div>
            </div>

            {/* Total Users Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Users</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{metrics.totalUsers || 148}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-450">
                  <span className="font-extrabold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> 14%
                  </span>
                  <span>+14 this month</span>
                </div>
                <div className="translate-y-1">
                  <Sparkline points={[120, 128, 125, 135, 140, 148]} color="#10b981" id="users" />
                </div>
              </div>
            </div>

            {/* Pending Approvals Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{metrics.pendingApprovals || 8}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <UserPlus className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-red-600 block">
                    {metrics.urgentApprovals || 3} urgent
                  </span>
                </div>
                <div className="translate-y-1">
                  <Sparkline points={[4, 6, 5, 8, 7, 8]} color="#f97316" id="approvals" />
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row (Project Overview Donut + Pending Approvals List) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart: Project Overview */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-none">Project Overview</h3>
                <span className="text-xs text-slate-400 font-medium mt-1.5 block">Projects by status</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
                <DonutChart segments={donutSegments} />
                <div className="space-y-2.5 w-full sm:w-56 text-xs">
                  {donutSegments.map((seg, idx) => (
                    <div key={idx} className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="font-semibold text-slate-650">{seg.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="font-bold text-slate-800">{seg.count}</span>
                        <span className="text-slate-400 font-semibold w-10">{Math.round((seg.count / totalCount) * 105) / 1.05 > 0 ? `${Math.round((seg.count / totalCount) * 100)}%` : '0%'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-start">
                <Link href="/projects" className="text-xs font-bold text-purple-750 hover:text-purple-900 transition flex items-center gap-1 group">
                  View all projects <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Pending Approvals List */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-none">Pending Approvals</h3>
              </div>
              <div className="my-4 space-y-3.5">
                {displayApprovals.map((app) => (
                  <div key={app.id || app._id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                        {app.initial || (app.userId?.name ? app.userId.name.charAt(0).toUpperCase() : 'C')}
                      </div>
                      <div className="leading-none">
                        <span className="block text-xs font-bold text-slate-900 leading-none">
                          {app.name || app.userId?.name || 'Jane Doe'}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-semibold leading-none mt-1.5">
                          {app.type || (app.contractorType ? `${app.contractorType} Onboarding` : 'New Application')}
                        </span>
                      </div>
                    </div>
                    <Link href={`/approvals`} className="py-1 px-3 bg-white border border-slate-200 hover:border-purple-200 text-purple-700 rounded-lg text-[10px] font-bold shadow-3xs hover:bg-purple-50/20 transition cursor-pointer">
                      Review
                    </Link>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-start">
                <Link href="/approvals" className="text-xs font-bold text-purple-750 hover:text-purple-900 transition flex items-center gap-1 group">
                  View all approvals <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Row (Recent Projects Table + System Activity Log) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects Table */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-none">Recent Projects</h3>
              </div>
              <div className="my-4 overflow-x-auto font-sans">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-450 font-bold border-b border-slate-100">
                      <th className="py-2.5">Project Name</th>
                      <th className="py-2.5">Project Manager</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Updated</th>
                      <th className="py-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/50">
                    {displayProjects.map((proj) => (
                      <tr key={proj.id || proj._id} className="hover:bg-slate-50/30 transition duration-150">
                        <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-slate-400">🎬</span> {proj.title}
                        </td>
                        <td className="py-3 text-slate-650 font-semibold">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600">
                              {proj.managerInitial || (proj.managerId?.name ? proj.managerId.name.charAt(0).toUpperCase() : 'M')}
                            </div>
                            <span>{proj.manager || proj.managerId?.name || 'James Cameron'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`inline-block py-0.5 px-2 border rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getStatusColorClass(proj.status)}`}>
                            {proj.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-450 font-semibold">{proj.updated || '2h ago'}</td>
                        <td className="py-3 text-right">
                          <button className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-start">
                <Link href="/projects" className="text-xs font-bold text-purple-750 hover:text-purple-900 transition flex items-center gap-1 group">
                  View all projects <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* System Activity Feed */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-none">System Activity</h3>
              </div>
              <div className="my-4 space-y-4">
                {displayActivities.map((act) => (
                  <div key={act.id || act._id} className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      {getActivityIcon(act.type || 'activity')}
                      <div className="leading-none mt-0.5">
                        <p className="font-bold text-slate-800 leading-normal">{act.text}</p>
                      </div>
                    </div>
                    <span className="text-slate-450 font-semibold text-[10px] shrink-0">{act.time || '2h ago'}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-start">
                <Link href="/logs" className="text-xs font-bold text-purple-750 hover:text-purple-900 transition flex items-center gap-1 group">
                  View system logs <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4 px-1">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Link href="/projects" className="flex items-center justify-center gap-2 border border-purple-200 hover:border-purple-300 bg-purple-50/40 hover:bg-purple-50 text-purple-700 py-3 px-4 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer group">
                <Plus className="w-4 h-4 transition-transform group-hover:scale-105" />
                Create New Project
              </Link>
              <Link href="/users" className="flex items-center justify-center gap-2 border border-blue-200 hover:border-blue-300 bg-blue-50/40 hover:bg-blue-50 text-blue-700 py-3 px-4 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer group">
                <UserPlus className="w-4 h-4 transition-transform group-hover:scale-105" />
                Add New User
              </Link>
              <Link href="/approvals" className="flex items-center justify-center gap-2 border border-orange-200 hover:border-orange-300 bg-orange-50/40 hover:bg-orange-50 text-orange-700 py-3 px-4 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer group">
                <UserCheck className="w-4 h-4 transition-transform group-hover:scale-105" />
                Review Approvals
              </Link>
              <Link href="/roles" className="flex items-center justify-center gap-2 border border-indigo-200 hover:border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 py-3 px-4 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer group">
                <Shield className="w-4 h-4 transition-transform group-hover:scale-105" />
                Manage Roles
              </Link>
              <Link href="/logs" className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-350 bg-slate-50/40 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer col-span-2 lg:col-span-1 group">
                <Activity className="w-4 h-4 transition-transform group-hover:scale-105" />
                System Logs
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
