"use client";

import React from "react";
import GlassCard from "./GlassCard";

export default function DashboardSkeleton() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="h-4 w-32 bg-white/10 rounded-full mb-3" />
          <div className="h-10 w-64 bg-white/10 rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-white/10 rounded-lg" />
      </div>

      {/* Quick Stats Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-6">
            <div className="h-10 w-10 rounded-full bg-white/10 mb-4" />
            <div className="h-12 w-24 bg-white/10 rounded-lg mb-2" />
            <div className="h-4 w-32 bg-white/10 rounded-full" />
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Attendance Card */}
          <GlassCard className="p-8 h-[300px]">
             <div className="flex gap-8">
                <div className="w-40 h-40 rounded-full bg-white/10 opacity-50 flex-shrink-0" />
                <div className="flex-1 space-y-6">
                  <div className="h-8 w-48 bg-white/10 rounded-lg" />
                  <div className="h-20 w-full bg-white/10 rounded-xl" />
                  <div className="flex gap-4">
                     <div className="h-12 flex-1 bg-white/10 rounded-lg" />
                     <div className="h-12 flex-1 bg-white/10 rounded-lg" />
                     <div className="h-12 flex-1 bg-white/10 rounded-lg" />
                  </div>
                </div>
             </div>
          </GlassCard>

          {/* AI Copilot Card */}
          <GlassCard className="p-6 h-[120px] flex gap-5 items-center">
             <div className="w-14 h-14 rounded-2xl bg-white/10 flex-shrink-0" />
             <div className="space-y-3 flex-1">
                <div className="h-6 w-40 bg-white/10 rounded-lg" />
                <div className="h-4 w-full max-w-lg bg-white/10 rounded-full" />
             </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Timeline */}
          <GlassCard className="p-6 h-[400px]">
             <div className="h-6 w-32 bg-white/10 rounded-lg mb-8" />
             <div className="space-y-6">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex gap-4">
                   <div className="w-3 h-3 rounded-full bg-white/10 mt-1" />
                   <div className="h-16 flex-1 bg-white/10 rounded-xl" />
                 </div>
               ))}
             </div>
          </GlassCard>

          {/* Overall Performance */}
          <GlassCard className="p-6 h-[400px]">
            <div className="flex justify-between mb-8">
              <div className="h-6 w-40 bg-white/10 rounded-lg" />
              <div className="h-6 w-20 bg-white/10 rounded-full" />
            </div>
            
            <div className="flex justify-center mb-8">
              <div className="w-48 h-48 rounded-full bg-white/10 opacity-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-white/10 rounded-xl" />
              <div className="h-20 bg-white/10 rounded-xl" />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
