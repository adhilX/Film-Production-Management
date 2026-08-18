import React from 'react';
import { Clapperboard, UserCheck, Users, Briefcase } from 'lucide-react';

interface CastCrewStatsProps {
  totalCharacters: number;
  assignedCharacters: number;
  castCount: number;
  crewCount: number;
}

export const CastCrewStats: React.FC<CastCrewStatsProps> = ({
  totalCharacters,
  assignedCharacters,
  castCount,
  crewCount,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5 hover:border-slate-300 transition duration-150">
        <div className="flex items-center justify-between text-slate-450">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Characters</span>
          <Clapperboard size={18} className="text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-800">{totalCharacters}</span>
          <span className="text-[10px] text-slate-400 font-semibold font-mono">total</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5 hover:border-slate-300 transition duration-150">
        <div className="flex items-center justify-between text-slate-450">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Mapped Roles</span>
          <UserCheck size={18} className="text-indigo-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-800">{assignedCharacters}</span>
          <span className="text-[10px] text-slate-400 font-semibold font-mono">of {totalCharacters} casted</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5 hover:border-slate-300 transition duration-150">
        <div className="flex items-center justify-between text-slate-455">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Cast Members</span>
          <Users size={18} className="text-indigo-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-800">{castCount}</span>
          <span className="text-[10px] text-slate-400 font-semibold font-mono">actors</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5 hover:border-slate-300 transition duration-150">
        <div className="flex items-center justify-between text-slate-455">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Crew Members</span>
          <Briefcase size={18} className="text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-800">{crewCount}</span>
          <span className="text-[10px] text-slate-400 font-semibold font-mono">on project</span>
        </div>
      </div>
    </div>
  );
};

export default CastCrewStats;
