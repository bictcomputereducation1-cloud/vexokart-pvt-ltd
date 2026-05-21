import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, PanInfo, useMotionValue, useTransform } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface SwipeToAcceptButtonProps {
  onAccept: () => void;
  onCancel?: () => void;
}

export function SwipeToAcceptButton({ onAccept, onCancel }: SwipeToAcceptButtonProps) {
  const [actionState, setActionState] = useState<'idle' | 'accepted' | 'cancelled'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragBounds, setDragBounds] = useState(0);
  const x = useMotionValue(0);
  const controls = useAnimation();

  const knobLeft = onCancel ? 'left-[calc(50%-26px)]' : 'left-[6px]';
  const calculateRightBounds = () => {
    if (!containerRef.current) return 0;
    return onCancel 
      ? containerRef.current.offsetWidth / 2 - 26 - 6
      : containerRef.current.offsetWidth - 52 - 12;
  };

  useEffect(() => {
    const updateBounds = () => {
      setDragBounds(calculateRightBounds());
    };
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [onCancel]);

  // Fades out text when dragging
  const opacityRightText = useTransform(x, [0, 40], [1, 0]);
  const opacityLeftText = useTransform(x, [0, -40], [1, 0]);

  // Transform background color based on sliding direction
  const backgroundColor = useTransform(
    x,
    [-dragBounds || -100, 0, dragBounds || 100],
    onCancel ? ['#ef4444', '#1e293b', '#22a140'] : ['#22a140', '#22a140', '#22a140']
  );

  const handleDragEnd = async (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!containerRef.current) return;
    
    const threshold = dragBounds * 0.55; // 55% threshold to trigger action

    if (x.get() >= threshold) {
      // Snap right
      setActionState('accepted');
      await controls.start({ x: dragBounds });
      onAccept();
    } else if (onCancel && x.get() <= -threshold) {
      // Snap left (only if onCancel is provided)
      setActionState('cancelled');
      await controls.start({ x: -dragBounds });
      onCancel();
    } else {
      // Snap back to center
      controls.start({ x: 0 });
    }
  };

  // Prevent parent scroll while dragging
  useEffect(() => {
    const el = containerRef.current;
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    if (el) el.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      if (el) el.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      style={{ backgroundColor }}
      className="relative w-full h-[64px] rounded-full overflow-hidden shadow-lg px-1.5 flex items-center justify-center cursor-grab active:cursor-grabbing"
    >
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        {onCancel ? (
          <>
            <motion.span 
              style={{ opacity: actionState === 'idle' ? opacityLeftText : 0 }}
              className="font-bold text-[12px] text-white/50 tracking-widest z-0"
            >
              {actionState === 'cancelled' ? '' : 'CANCEL'}
            </motion.span>
            <motion.span 
              style={{ opacity: actionState === 'idle' ? opacityRightText : 0 }}
              className="font-bold text-[12px] text-white/50 tracking-widest z-0"
            >
              {actionState === 'accepted' ? '' : 'ACCEPT'}
            </motion.span>
          </>
        ) : (
          <motion.span 
            style={{ opacity: actionState === 'idle' ? opacityRightText : 0 }}
            className="font-bold text-[15px] text-emerald-100 tracking-wider z-0 pl-[52px] w-full text-center"
          >
            {actionState === 'accepted' ? '' : 'SLIDE TO ACCEPT'}
          </motion.span>
        )}
      </div>

      {actionState === 'accepted' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center font-bold text-[18px] text-white tracking-wide"
        >
          ACCEPTED
        </motion.div>
      )}
      {actionState === 'cancelled' && (
        <motion.div 
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="absolute inset-0 flex items-center justify-center font-bold text-[18px] text-white tracking-wide"
        >
          CANCELLED
        </motion.div>
      )}

      <motion.div
        drag={actionState !== 'idle' ? false : "x"}
        dragConstraints={{ left: onCancel ? -dragBounds : 0, right: dragBounds }}
        dragElastic={0.1}
        dragMomentum={false}
        animate={controls}
        style={{ x }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.95 }}
        className={`absolute w-[52px] h-[52px] bg-white rounded-full shadow-sm flex items-center justify-center ${
           actionState === 'accepted' ? 'text-green-600' : actionState === 'cancelled' ? 'text-red-500' : 'text-slate-800'
        } z-10 top-[6px] ${knobLeft}`}
      >
        {actionState === 'accepted' || actionState === 'cancelled' ? (
           <div className={`w-5 h-5 rounded-full border-2 ${actionState === 'accepted' ? 'border-[#22a140]' : 'border-red-500'} border-t-transparent animate-spin`} />
        ) : onCancel ? (
          <div className="flex items-center space-x-1">
             <ChevronLeft className="w-4 h-4 stroke-[4] opacity-40 -mr-1" />
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1" />
             <ChevronRight className="w-4 h-4 stroke-[4] opacity-40 -ml-1" />
          </div>
        ) : (
          <>
            <ChevronRight className="w-5 h-5 stroke-[4] opacity-50" />
            <ChevronRight className="w-5 h-5 stroke-[4] -ml-2" />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
