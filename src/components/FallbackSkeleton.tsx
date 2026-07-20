import React from 'react';

export default function FallbackSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-8" id="fallback_skeleton_root">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-sm animate-pulse">
        {/* Skeleton Header logo */}
        <div className="flex items-center space-y-2 flex-col">
          <div className="h-8 w-8 rounded-full bg-[#052b14]/20" />
          <div className="h-4 w-28 bg-[#052b14]/10 rounded-full" />
        </div>
        
        {/* Skeleton content lines */}
        <div className="space-y-3">
          <div className="h-2 w-full bg-slate-100 rounded-full" />
          <div className="h-2 w-5/6 bg-slate-100 rounded-full" />
          <div className="h-2 w-4/6 bg-slate-100 rounded-full" />
        </div>

        {/* Skeleton bento grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-10 bg-slate-50 border border-dashed border-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-50 border border-dashed border-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
