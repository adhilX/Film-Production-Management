import React from 'react';
import { Film, Clock, AlertCircle, Check } from 'lucide-react';
import type { Production } from '@/app/types';

interface ProjectsStatsProps {
  productions: Production[];
  loading: boolean;
}

export const ProjectsStats: React.FC<ProjectsStatsProps> = ({ productions, loading }) => {
  const metricTotal = productions.length;
  const metricActive = productions.filter((p) => p.status === 'Active').length;
  const metricOnHold = productions.filter((p) => p.status === 'On Hold').length;
  const metricCompleted = productions.filter((p) => p.status === 'Completed').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Metric 1 */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Projects
            </span>
            <span className="text-3xl font-black text-slate-900 leading-none">
              {loading ? '...' : metricTotal}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Film className="w-5.5 h-5.5" />
          </div>
        </div>
        <div className="text-[10px] text-slate-450 font-semibold mt-4">
          Total configured workflows
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Active
            </span>
            <span className="text-3xl font-black text-slate-900 leading-none">
              {loading ? '...' : metricActive}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Clock className="w-5.5 h-5.5" />
          </div>
        </div>
        <div className="text-[10px] text-slate-450 font-semibold mt-4">
          Currently in production
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              On Hold
            </span>
            <span className="text-3xl font-black text-slate-900 leading-none">
              {loading ? '...' : metricOnHold}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-5.5 h-5.5" />
          </div>
        </div>
        <div className="text-[10px] text-slate-450 font-semibold mt-4">
          Awaiting review or funds
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-3xl font-black text-slate-900 leading-none">
              {loading ? '...' : metricCompleted}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Check className="w-5.5 h-5.5" />
          </div>
        </div>
        <div className="text-[10px] text-slate-450 font-semibold mt-4">
          Finished/archived projects
        </div>
      </div>
    </div>
  );
};

export default ProjectsStats;
