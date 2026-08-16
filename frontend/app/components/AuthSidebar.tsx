'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clapperboard } from 'lucide-react';
import React from 'react';

export interface AuthFeature {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface AuthSidebarProps {
  features: AuthFeature[];
  className?: string;
}

export default function AuthSidebar({ features, className = 'lg:col-span-6' }: AuthSidebarProps) {
  return (
    <div className={`${className} relative flex flex-col justify-between p-8 lg:p-14 overflow-hidden min-h-[450px] lg:min-h-full`}>
      {/* Background Image with Dark Vignette Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/film_set_bg.png" 
          alt="Film Production Set" 
          fill 
          priority 
          className="object-cover object-center transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
      </div>

      {/* Content Container */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 space-y-10 max-w-xl"
      >
        {/* Header Branding Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Clapperboard className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-wider text-white leading-none">TENDAGON</h2>
            <p className="text-[10px] font-bold tracking-widest text-amber-400 uppercase mt-0.5">FILM PRODUCTION MANAGEMENT</p>
          </div>
        </div>

        {/* Main Headline */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white animate-in">
            Streamline.
          </h1>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
            Collaborate.
          </h1>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-amber-400">
            Create Magic.
          </h1>
          <p className="text-slate-300 text-sm pt-3 leading-relaxed font-normal max-w-md">
            Tendagon helps you manage productions, people, locations, funds, costumes and more — all in one powerful platform built for the film industry.
          </p>
        </div>

        {/* Feature Container Box (Glassmorphic design) */}
        <div className="bg-slate-900/80 border border-slate-800/90 backdrop-blur-md rounded-2xl p-6 space-y-4">
          {features.map((feature, idx) => {
            const FeatureIcon = feature.icon;
            return (
              <div key={idx} className={`flex items-start gap-4 ${idx > 0 ? 'border-t border-slate-800/60 pt-3' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0">
                  <FeatureIcon className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-100">{feature.title}</h3>
                  <p className="text-[11px] text-slate-400">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="relative z-10 pt-4 hidden lg:block" />
    </div>
  );
}
