 import { useState, useEffect } from 'react';
 import { cn } from '@/lib/utils';
 
 interface LoadingScreenProps {
   onComplete: () => void;
   minDuration?: number;
 }
 
 export function LoadingScreen({ onComplete, minDuration = 2000 }: LoadingScreenProps) {
   const [progress, setProgress] = useState(0);
   const [isExiting, setIsExiting] = useState(false);
 
   useEffect(() => {
     const startTime = Date.now();
     const interval = setInterval(() => {
       const elapsed = Date.now() - startTime;
       const newProgress = Math.min((elapsed / minDuration) * 100, 100);
       setProgress(newProgress);
       
       if (newProgress >= 100) {
         clearInterval(interval);
         setIsExiting(true);
         setTimeout(onComplete, 800);
       }
     }, 30);
 
     return () => clearInterval(interval);
   }, [minDuration, onComplete]);
 
   return (
     <div
       className={cn(
         "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background",
         "transition-all duration-700",
         isExiting && "opacity-0 scale-105"
       )}
     >
       {/* Animated background orbs */}
       <div className="absolute inset-0 overflow-hidden">
         <div 
           className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-pulse-slow"
           style={{
             background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
             filter: 'blur(60px)',
           }}
         />
         <div 
           className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full animate-pulse-slow"
           style={{
             background: 'radial-gradient(circle, hsl(var(--echo) / 0.08) 0%, transparent 70%)',
             filter: 'blur(40px)',
             animationDelay: '-3s',
           }}
         />
       </div>
 
       {/* Central logo animation */}
       <div className="relative z-10 flex flex-col items-center">
         {/* Animated rings */}
         <div className="relative w-32 h-32 mb-8">
           <div 
             className="absolute inset-0 rounded-full border border-primary/20 animate-ping-slow"
             style={{ animationDuration: '2s' }}
           />
           <div 
             className="absolute inset-2 rounded-full border border-primary/30 animate-ping-slow"
             style={{ animationDuration: '2.5s', animationDelay: '-0.5s' }}
           />
           <div 
             className="absolute inset-4 rounded-full border border-primary/40 animate-ping-slow"
             style={{ animationDuration: '3s', animationDelay: '-1s' }}
           />
           {/* Center dot */}
           <div className="absolute inset-0 flex items-center justify-center">
             <div 
               className="w-4 h-4 rounded-full bg-primary animate-pulse"
               style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.5)' }}
             />
           </div>
         </div>
 
         {/* Brand name with gradient */}
         <h1 className="font-thought text-2xl tracking-[0.3em] text-gradient mb-2">
           BRAINCHILD
         </h1>
         <p className="text-muted-foreground/50 text-xs tracking-widest uppercase mb-8">
           thoughts that fade
         </p>
 
         {/* Progress bar */}
         <div className="w-48 h-0.5 bg-secondary/50 rounded-full overflow-hidden">
           <div 
             className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 transition-all duration-100 ease-out"
             style={{ 
               width: `${progress}%`,
               boxShadow: '0 0 10px hsl(var(--primary) / 0.5)'
             }}
           />
         </div>
 
         {/* Loading text */}
         <p className="mt-4 text-muted-foreground/30 text-xs font-thought animate-pulse">
           {progress < 100 ? 'materializing...' : 'entering fog...'}
         </p>
       </div>
 
       {/* Floating particles */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         {[...Array(12)].map((_, i) => (
           <div
             key={i}
             className="absolute text-primary/10 animate-float-up"
             style={{
               left: `${10 + (i * 7)}%`,
               bottom: '-20px',
               fontSize: `${8 + Math.random() * 8}px`,
               animationDuration: `${10 + Math.random() * 10}s`,
               animationDelay: `${-Math.random() * 10}s`,
             }}
           >
             ◦
           </div>
         ))}
       </div>
     </div>
   );
 }