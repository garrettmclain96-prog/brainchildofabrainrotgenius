import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Volumetric fog particles
function FogParticles({ count = 3000 }) {
  const ref = useRef<THREE.Points>(null);
  const { mouse } = useThree();
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread particles in a large sphere
      const radius = Math.random() * 15 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);
      
      vel[i3] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    return [pos, vel];
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    
    const time = state.clock.elapsedTime;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Gentle drifting motion
      positions[i3] += Math.sin(time * 0.1 + i * 0.01) * 0.002 + velocities[i3];
      positions[i3 + 1] += Math.cos(time * 0.15 + i * 0.02) * 0.002 + velocities[i3 + 1];
      positions[i3 + 2] += Math.sin(time * 0.08 + i * 0.015) * 0.001 + velocities[i3 + 2];
      
      // Mouse influence (subtle)
      const dx = mouse.x * 5 - positions[i3];
      const dy = mouse.y * 5 - positions[i3 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 3) {
        positions[i3] -= dx * 0.001;
        positions[i3 + 1] -= dy * 0.001;
      }
      
      // Boundary wrapping
      const bound = 20;
      if (Math.abs(positions[i3]) > bound) positions[i3] *= -0.9;
      if (Math.abs(positions[i3 + 1]) > bound) positions[i3 + 1] *= -0.9;
      if (Math.abs(positions[i3 + 2]) > bound) positions[i3 + 2] *= -0.9;
    }
    
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = time * 0.02;
    ref.current.rotation.x = Math.sin(time * 0.01) * 0.1;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6366f1"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Ethereal orbs
function FloatingOrbs({ count = 8 }) {
  const meshRefs = useRef<THREE.Mesh[]>([]);
  
  const orbs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 15 - 5,
      ] as [number, number, number],
      scale: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      color: i % 2 === 0 ? '#8b5cf6' : '#06b6d4',
    }));
  }, [count]);

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
          ref={(el) => { if (el) meshRefs.current[i] = el; }}
          position={orb.position}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial args={[{ color: orb.color, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending }]} />
        </mesh>
      ))}
    </>
  );
}

// Volumetric light rays
function LightRays() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.z = time * 0.05;
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.03 + Math.sin(time * 0.5) * 0.02;
  });

  return (
    <mesh ref={meshRef} position={[0, 5, -10]} rotation={[0, 0, 0]}>
      <coneGeometry args={[15, 30, 32, 1, true]} />
      <meshBasicMaterial args={[{ color: '#c4b5fd', transparent: true, opacity: 0.04, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }]} />
    </mesh>
  );
}

// Nebula clouds
function NebulaCloud({ position = [0, 0, -10] as [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.z = time * 0.02;
    meshRef.current.scale.x = 1 + Math.sin(time * 0.3) * 0.1;
    meshRef.current.scale.y = 1 + Math.cos(time * 0.4) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial args={[{ color: '#1e1b4b', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending }]} />
    </mesh>
  );
}

export function FogScene() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 10, 40]} />
        
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#8b5cf6" />
        <pointLight position={[-10, -10, 5]} intensity={0.2} color="#06b6d4" />
        
        <FogParticles count={2500} />
        <FloatingOrbs count={6} />
        <LightRays />
        <NebulaCloud position={[0, 0, -15]} />
        <NebulaCloud position={[-10, 5, -20]} />
        <NebulaCloud position={[10, -5, -18]} />
      </Canvas>
    </div>
  );
}
