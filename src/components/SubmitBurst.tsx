 import { useEffect, useState } from 'react';
 
 interface Particle {
   id: number;
   x: number;
   y: number;
   angle: number;
   velocity: number;
   size: number;
   life: number;
 }
 
 interface SubmitBurstProps {
   x: number;
   y: number;
   onComplete: () => void;
 }
 
 export function SubmitBurst({ x, y, onComplete }: SubmitBurstProps) {
   const [particles, setParticles] = useState<Particle[]>([]);
 
   useEffect(() => {
     // Generate burst particles
     const newParticles: Particle[] = Array.from({ length: 16 }, (_, i) => ({
       id: i,
       x: 0,
       y: 0,
       angle: (i / 16) * Math.PI * 2 + Math.random() * 0.5,
       velocity: 3 + Math.random() * 4,
       size: 2 + Math.random() * 4,
       life: 1,
     }));
     setParticles(newParticles);
 
     // Animate particles
     let frame = 0;
     const maxFrames = 30;
     const animate = () => {
       frame++;
       setParticles(prev => 
         prev.map(p => ({
           ...p,
           x: p.x + Math.cos(p.angle) * p.velocity,
           y: p.y + Math.sin(p.angle) * p.velocity,
           velocity: p.velocity * 0.92,
           life: 1 - (frame / maxFrames),
         }))
       );
 
       if (frame < maxFrames) {
         requestAnimationFrame(animate);
       } else {
         onComplete();
       }
     };
 
     requestAnimationFrame(animate);
   }, [onComplete]);
 
   return (
     <div 
       className="fixed pointer-events-none z-50"
       style={{ left: x, top: y }}
     >
       {particles.map(p => (
         <div
           key={p.id}
           className="absolute rounded-full bg-primary"
           style={{
             left: p.x,
             top: p.y,
             width: p.size * p.life,
             height: p.size * p.life,
             opacity: p.life * 0.8,
             transform: 'translate(-50%, -50%)',
             boxShadow: `0 0 ${p.size * 2}px hsl(var(--primary) / ${p.life * 0.5})`,
           }}
         />
       ))}
       {/* Central flash */}
       <div 
         className="absolute rounded-full bg-primary/50 animate-ping"
         style={{
           width: 20,
           height: 20,
           left: 0,
           top: 0,
           transform: 'translate(-50%, -50%)',
           animationDuration: '0.5s',
         }}
       />
     </div>
   );
 }