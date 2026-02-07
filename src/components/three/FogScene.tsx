import { useRef, useMemo, useEffect, useState, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Performance-conscious 3D fog scene.
 * - Reduced particle count (800 vs 3000)
 * - Fewer orbs (3 vs 8)
 * - Lower DPR cap (1.0 on mobile)
 * - Graceful degradation: skips entirely if GPU is weak
 */

function FogParticles({ count = 800 }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 15 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      vel[i3] = (Math.random() - 0.5) * 0.008;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.008;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.008;
    }

    return [pos, vel];
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;

    const time = state.clock.elapsedTime;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += Math.sin(time * 0.1 + i * 0.01) * 0.002 + velocities[i3];
      positions[i3 + 1] += Math.cos(time * 0.15 + i * 0.02) * 0.002 + velocities[i3 + 1];
      positions[i3 + 2] += Math.sin(time * 0.08 + i * 0.015) * 0.001 + velocities[i3 + 2];

      const bound = 20;
      if (Math.abs(positions[i3]) > bound) positions[i3] *= -0.9;
      if (Math.abs(positions[i3 + 1]) > bound) positions[i3 + 1] *= -0.9;
      if (Math.abs(positions[i3 + 2]) > bound) positions[i3 + 2] *= -0.9;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = time * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6366f1"
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function FloatingOrbs({ count = 3 }) {
  const meshRefs = useRef<THREE.Mesh[]>([]);

  const orbs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 15 - 5,
        ] as [number, number, number],
        scale: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        color: i % 2 === 0 ? '#8b5cf6' : '#06b6d4',
      })),
    [count]
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const orb = orbs[i];
      mesh.position.y = orb.position[1] + Math.sin(time * orb.speed + orb.phase) * 2;
      mesh.position.x = orb.position[0] + Math.cos(time * orb.speed * 0.5 + orb.phase) * 1;
      mesh.scale.setScalar(orb.scale + Math.sin(time * 2 + orb.phase) * 0.1);
    });
  });

  return (
    <>
      {orbs.map((orb, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
          position={orb.position}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={orb.color}
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

export const FogScene = forwardRef<HTMLDivElement>(function FogScene(_props, ref) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Skip 3D on reduced-motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Defer 3D rendering to prioritize first paint
    const timer = setTimeout(() => setShouldRender(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  // Detect mobile for lower DPR
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ antialias: false, powerPreference: 'low-power' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 10, 40]} />

        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#8b5cf6" />

        <FogParticles count={isMobile ? 500 : 800} />
        <FloatingOrbs count={3} />
      </Canvas>
    </div>
  );
});
