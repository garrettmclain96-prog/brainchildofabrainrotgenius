 import { useEffect, useState, useRef } from 'react';
 
 export function CursorGlow() {
   const [position, setPosition] = useState({ x: 0, y: 0 });
   const [isVisible, setIsVisible] = useState(false);
   const [isPointer, setIsPointer] = useState(false);
   const trailRef = useRef<Array<{ x: number; y: number; id: number }>>([]);
   const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
   const idCounter = useRef(0);
 
   useEffect(() => {
     let lastTrailTime = 0;
     const handleMouseMove = (e: MouseEvent) => {
       setPosition({ x: e.clientX, y: e.clientY });
       setIsVisible(true);
       
        const target = e.target as HTMLElement;
        setIsPointer(
          !!target.closest('button, a, [role="button"], input, select, textarea, label, [tabindex]')
        );
 
       // Add trail particles (throttled)
       const now = Date.now();
       if (now - lastTrailTime > 50) {
         lastTrailTime = now;
         const newTrail = { x: e.clientX, y: e.clientY, id: idCounter.current++ };
         trailRef.current = [...trailRef.current.slice(-8), newTrail];
         setTrail([...trailRef.current]);
       }
     };
 
     const handleMouseLeave = () => setIsVisible(false);
     const handleMouseEnter = () => setIsVisible(true);
 
     window.addEventListener('mousemove', handleMouseMove);
     document.addEventListener('mouseleave', handleMouseLeave);
     document.addEventListener('mouseenter', handleMouseEnter);
 
     return () => {
       window.removeEventListener('mousemove', handleMouseMove);
       document.removeEventListener('mouseleave', handleMouseLeave);
       document.removeEventListener('mouseenter', handleMouseEnter);
     };
   }, []);
 
   // Clean up old trail particles
   useEffect(() => {
     const cleanup = setInterval(() => {
       const now = Date.now();
       trailRef.current = trailRef.current.filter((_, i) => i > trailRef.current.length - 6);
       setTrail([...trailRef.current]);
     }, 100);
     return () => clearInterval(cleanup);
   }, []);
 
   // Don't render on touch devices
   if (typeof window !== 'undefined' && 'ontouchstart' in window) {
     return null;
   }
 
   return (
     <>
       {/* Trail particles */}
       {trail.map((point, index) => (
         <div
           key={point.id}
           className="fixed pointer-events-none z-[9998]"
           style={{
             left: point.x,
             top: point.y,
             opacity: (index + 1) / trail.length * 0.3,
             transform: 'translate(-50%, -50%)',
           }}
         >
           <div 
             className="w-1 h-1 rounded-full bg-primary"
             style={{
               transform: `scale(${(index + 1) / trail.length})`,
             }}
           />
         </div>
       ))}
 
       {/* Main glow */}
       <div
         className="fixed pointer-events-none z-[9999] transition-opacity duration-300"
         style={{
           left: position.x,
           top: position.y,
           opacity: isVisible ? 1 : 0,
           transform: 'translate(-50%, -50%)',
         }}
       >
         {/* Outer glow */}
         <div 
           className="absolute rounded-full transition-all duration-300"
           style={{
             width: isPointer ? 60 : 40,
             height: isPointer ? 60 : 40,
             left: '50%',
             top: '50%',
             transform: 'translate(-50%, -50%)',
             background: `radial-gradient(circle, hsl(var(--primary) / ${isPointer ? 0.15 : 0.08}) 0%, transparent 70%)`,
             filter: 'blur(8px)',
           }}
         />
         {/* Inner dot */}
         <div 
           className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
           style={{
             left: '50%',
             top: '50%',
             transform: 'translate(-50%, -50%)',
             boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
           }}
         />
       </div>
     </>
   );
 }