import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Banner } from '../types';
import { Volume2, VolumeX, ArrowRight, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumVideoBannerProps {
  banner: Banner;
}

export const PremiumVideoBanner: React.FC<PremiumVideoBannerProps> = ({ banner }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              // Ignore play-interrupt errors
            });
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        });
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full cursor-pointer overflow-hidden group select-none"
      onClick={() => {
        if (banner.link_url) {
          navigate(banner.link_url);
        } else {
          navigate('/categories');
        }
      }}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        src={banner.video_url || undefined}
        poster={banner.image_url}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        className={`w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-90'
        }`}
        onLoadedData={() => setIsLoaded(true)}
      />

      {/* Luxury overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

      {/* Video controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={handleTogglePlay}
          className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-90"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white" />}
        </button>
        <button 
          onClick={handleToggleMute}
          className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-90"
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Rich overlay content */}
      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end z-10 text-left">
        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#C49B3B] bg-amber-500/10 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-2 border border-amber-500/10 shadow-sm animate-pulse">
          Vexo Live Experience
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight mb-2 drop-shadow-md">
          {banner.title || 'Fresh Groceries Daily'}
        </h2>
        <p className="text-[10px] text-white/70 font-medium tracking-wide mb-3 max-w-[85%] leading-relaxed">
          Premium organic picks sourced directly from fresh orchards and delivered straight to your door.
        </p>
        <button 
          className="w-fit bg-emerald-600 hover:bg-[#C49B3B] text-white px-5 py-2.5 rounded-xl font-extrabold uppercase tracking-widest text-[9px] flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-950/20"
        >
          Explore Now <ArrowRight className="h-3.5 w-3.5 stroke-[2.5px]" />
        </button>
      </div>
    </div>
  );
};
