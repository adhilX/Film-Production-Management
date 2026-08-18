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
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { adminService } from '@/services/adminService';
import { productionsService } from '@/services/productionsService';
import OverviewModule from '@/components/modules/OverviewModule';

// Time formatting helper
function formatTimeAgo(dateString?: string | Date) {
  if (!dateString) return 'recently';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'just now';

  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths}mo ago`;
}

// Sparkline Chart Component
function Sparkline({ points, color, id }: { points: number[]; color: string; id: string }) {
  const width = 100;
  const height = 30;
  const max = Math.max(...points, 10);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    x: points.length > 1 ? (i / (points.length - 1)) * width : width / 2,
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
        <span className="block text-2xl font-black text-slate-900 leading-none">{segments.every(s => s.count === 0) ? 0 : total}</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Total</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const { hasPermission } = usePermissions();

  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    urgentApprovals: 0,
    trends: {
      projectsChange: '0%',
      activeProjectsChange: '0%',
      newUsersThisMonth: '+0',
    }
  });

  const [sparklines, setSparklines] = useState({
    projects: [0, 0, 0, 0, 0, 0],
    active: [0, 0, 0, 0, 0, 0],
    users: [0, 0, 0, 0, 0, 0],
    approvals: [0, 0, 0, 0, 0, 0],
  });

  const [statusDistribution, setStatusDistribution] = useState({
    active: 0,
    draft: 0,
    onHold: 0,
    completed: 0,
  });

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [approvalsList, setApprovalsList] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, pendingApps, usersList, allProductions, auditLogs] = await Promise.all([
          adminService.getDashboardStats().catch(() => null),
          adminService.getApplications().catch(() => ({ applications: [] })),
          adminService.getUsers(1, 10).catch(() => ({ users: [], total: 0 })),
          productionsService.getProductions().catch(() => []),
          adminService.getAuditLogs({ limit: 10 }).catch(() => ({ logs: [], total: 0, page: 1, pages: 1, limit: 10 }))
        ]);

        if (statsData) {
          setMetrics(statsData.metrics);
          setSparklines(statsData.sparklines);
          setStatusDistribution(statsData.statusDistribution);
        } else {
          // Fallback to client-side derived counts if stats endpoint fails
          const totalProjects = Array.isArray(allProductions) ? allProductions.length : 0;
          const activeProjects = Array.isArray(allProductions) ? allProductions.filter((p: any) => p.status?.toLowerCase() === 'active').length : 0;
          const totalUsers = usersList?.total || 0;
          const pendingAppsList = pendingApps?.applications || [];
          const pendingApprovals = pendingAppsList.length;

          const now = new Date().getTime();
          const urgentApprovals = pendingAppsList.filter((app: any) => {
            const updatedAt = new Date(app.updatedAt).getTime();
            return (now - updatedAt) > (3 * 24 * 60 * 60 * 1000);
          }).length;

          setMetrics({
            totalProjects,
            activeProjects,
            totalUsers,
            pendingApprovals,
            urgentApprovals,
            trends: {
              projectsChange: '0%',
              activeProjectsChange: '0%',
              newUsersThisMonth: '+0',
            }
          });
          
          setStatusDistribution({
            active: activeProjects,
            draft: Array.isArray(allProductions) ? allProductions.filter((p: any) => p.status?.toLowerCase() === 'draft').length : 0,
            onHold: Array.isArray(allProductions) ? allProductions.filter((p: any) => p.status?.toLowerCase() === 'on hold' || p.status?.toLowerCase() === 'onhold').length : 0,
            completed: Array.isArray(allProductions) ? allProductions.filter((p: any) => p.status?.toLowerCase() === 'completed').length : 0,
          });
        }

        const resolvedProductions = Array.isArray(allProductions) 
          ? allProductions 
          : (allProductions?.productions || []);

        setProjectsList(resolvedProductions);
        setApprovalsList(pendingApps?.applications || []);
        setActivitiesList(auditLogs?.logs || []);
      } catch (error) {
        console.error('Failed to load admin metrics', error);
      } finally {
        setLoading(false);
      }
    };

    const hasAdminPerm = hasPermission(PERMISSIONS.USERS_APPROVE) || hasPermission(PERMISSIONS.ROLES_MANAGE);
    if (hasAdminPerm) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return null;

  const hasAdminPerm = hasPermission(PERMISSIONS.USERS_APPROVE) || hasPermission(PERMISSIONS.ROLES_MANAGE);
  if (!hasAdminPerm) {
    return <OverviewModule />;
  }

  const displayProjects = projectsList.slice(0, 4);
  const displayApprovals = approvalsList.slice(0, 3);
  const displayActivities = activitiesList.slice(0, 5);

  const totalCount = statusDistribution.active + statusDistribution.draft + statusDistribution.onHold + statusDistribution.completed || 0;

  const donutSegments = [
    { label: 'Active', count: statusDistribution.active, color: '#8b5cf6' },
    { label: 'Draft', count: statusDistribution.draft, color: '#3b82f6' },
    { label: 'On Hold', count: statusDistribution.onHold, color: '#f97316' },
    { label: 'Completed', count: statusDistribution.completed, color: '#10b981' }
  ];

  const getStatusColorClass = (status: string) => {
    if (!status) return 'bg-slate-50 text-slate-700 border-slate-100';
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

  const getActivityType = (action: string) => {
    if (!action) return 'activity';
    if (action.startsWith('USER_') || action.startsWith('PERMISSION_')) return 'user';
    if (action.startsWith('PROJECT_')) return 'project';
    if (action.startsWith('ROLE_')) return 'role';
    if (action.startsWith('FUND_')) return 'fund';
    return 'activity';
  };

  const getActivityText = (act: any) => {
    const userName = act.userId?.name || 'System';
    if (!act.action) return `System activity by ${userName}`;
    switch (act.action) {
      case 'USER_CREATED':
        return `New user account was created by ${userName}`;
      case 'USER_UPDATED':
        return `User settings were updated by ${userName}`;
      case 'USER_ROLE_CHANGED':
        return `User role was changed by ${userName}`;
      case 'USER_ACTIVATED':
        return `User was activated by ${userName}`;
      case 'USER_DEACTIVATED':
        return `User was deactivated by ${userName}`;
      case 'USER_ONBOARDING_APPROVED':
        return `Onboarding application was approved by ${userName}`;
      case 'USER_ONBOARDING_CHANGES_REQUESTED':
        return `Changes were requested on onboarding by ${userName}`;
      case 'USER_DOCUMENT_UPLOADED':
        return `New document uploaded by ${userName}`;
      case 'PROJECT_CREATED':
        return `New project was created by ${userName}`;
      case 'PROJECT_UPDATED':
        return `Project details were updated by ${userName}`;
      case 'LOCATION_BOOKING_CREATED':
        return `New location booking request by ${userName}`;
      case 'LOCATION_BOOKING_APPROVED':
        return `Location booking was approved by ${userName}`;
      case 'LOCATION_BOOKING_REJECTED':
        return `Location booking was rejected by ${userName}`;
      default:
        const actionWord = act.action.replace(/_/g, ' ').toLowerCase();
        return `${actionWord.charAt(0).toUpperCase() + actionWord.slice(1)} by ${userName}`;
    }
  };

  const getManagerName = (proj: any) => {
    if (proj.productionManager && typeof proj.productionManager === 'object') {
      return proj.productionManager.name;
    }
    return 'None';
  };

  const getManagerInitial = (proj: any) => {
    if (proj.productionManager && typeof proj.productionManager === 'object') {
      return proj.productionManager.name.charAt(0).toUpperCase();
    }
    return '—';
  };

  const isProjectsTrendPositive = !metrics.trends.projectsChange.startsWith('-');
  const isActiveTrendPositive = !metrics.trends.activeProjectsChange.startsWith('-');

  return (
    <div className="flex-1 bg-[#f8fafc] px-6 md:px-8 py-8 space-y-6 overflow-y-auto">
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-2xs">
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
                  <span className="text-3xl font-black text-slate-900 leading-none">{metrics.totalProjects}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <FolderOpen className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-450">
                  <span className={`font-extrabold flex items-center gap-0.5 ${isProjectsTrendPositive ? 'text-emerald-600' : 'text-rose-650'}`}>
                    {isProjectsTrendPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {metrics.trends.projectsChange}
                  </span>
                  <span>from last month</span>
                </div>
                <div className="translate-y-1">
                  <Sparkline points={sparklines.projects} color="#8b5cf6" id="projects" />
                </div>
              </div>
            </div>

            {/* Active Projects Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Projects</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{metrics.activeProjects}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Film className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-450">
                  <span className={`font-extrabold flex items-center gap-0.5 ${isActiveTrendPositive ? 'text-emerald-600' : 'text-rose-650'}`}>
                    {isActiveTrendPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {metrics.trends.activeProjectsChange}
                  </span>
                  <span>from last month</span>
                </div>
                <div className="translate-y-1">
                  <Sparkline points={sparklines.active} color="#3b82f6" id="active" />
                </div>
              </div>
            </div>

            {/* Total Users Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Users</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{metrics.totalUsers}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-450">
                  <span className="font-extrabold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> {metrics.trends.newUsersThisMonth}
                  </span>
                  <span>this month</span>
                </div>
                <div className="translate-y-1">
                  <Sparkline points={sparklines.users} color="#10b981" id="users" />
                </div>
              </div>
            </div>

            {/* Pending Approvals Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{metrics.pendingApprovals}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <UserPlus className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-rose-650 block">
                    {metrics.urgentApprovals} urgent
                  </span>
                </div>
                <div className="translate-y-1">
                  <Sparkline points={sparklines.approvals} color="#f97316" id="approvals" />
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
                        <span className="text-slate-400 font-semibold w-10">
                          {totalCount > 0 ? `${Math.round((seg.count / totalCount) * 100)}%` : '0%'}
                        </span>
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
                {displayApprovals.length > 0 ? (
                  displayApprovals.map((app) => (
                    <div key={app.id || app._id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition duration-150">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                          {app.initial || (app.name ? app.name.charAt(0).toUpperCase() : 'C')}
                        </div>
                        <div className="leading-none">
                          <span className="block text-xs font-bold text-slate-900 leading-none">
                            {app.name || 'Unknown User'}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-semibold leading-none mt-1.5">
                            {app.contractorType ? `${app.contractorType} Onboarding` : 'New Application'}
                          </span>
                        </div>
                      </div>
                      <Link href={`/approvals`} className="py-1 px-3 bg-white border border-slate-200 hover:border-purple-200 text-purple-700 rounded-lg text-[10px] font-bold shadow-3xs hover:bg-purple-50/20 transition cursor-pointer">
                        Review
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-10 font-semibold">
                    No pending approvals.
                  </div>
                )}
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
                    {displayProjects.length > 0 ? (
                      displayProjects.map((proj) => (
                        <tr key={proj.id || proj._id} className="hover:bg-slate-50/30 transition duration-150">
                          <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                            {proj.imageUrl ? (
                              <img
                                src={proj.imageUrl}
                                alt={proj.title}
                                className="w-10 h-[52px] object-cover rounded-lg shrink-0 border border-slate-200/60"
                              />
                            ) : (
                              <div className="w-10 h-[52px] bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center shrink-0 text-slate-400 text-xs">
                                <span>🎬</span>
                                <span className="text-[7px] text-slate-350 tracking-tighter mt-0.5">—</span>
                              </div>
                            )}
                            <span>{proj.title}</span>
                          </td>
                          <td className="py-3 text-slate-650 font-semibold">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                {getManagerInitial(proj)}
                              </div>
                              <span>{getManagerName(proj)}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`inline-block py-0.5 px-2 border rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getStatusColorClass(proj.status)}`}>
                              {proj.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-450 font-semibold">{formatTimeAgo(proj.updatedAt)}</td>
                          <td className="py-3 text-right">
                            <button className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400 font-semibold">
                          No recent projects found.
                        </td>
                      </tr>
                    )}
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
                {displayActivities.length > 0 ? (
                  displayActivities.map((act) => (
                    <div key={act.id || act._id} className="flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        {getActivityIcon(getActivityType(act.action))}
                        <div className="leading-none mt-0.5">
                          <p className="font-bold text-slate-800 leading-normal">{getActivityText(act)}</p>
                        </div>
                      </div>
                      <span className="text-slate-450 font-semibold text-[10px] shrink-0">{formatTimeAgo(act.timestamp)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-10 font-semibold">
                    No recent activities.
                  </div>
                )}
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
