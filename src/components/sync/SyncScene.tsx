"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Text, Icosahedron, Torus, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

interface SyncSceneProps {
  currentStep: string;
  subjects: string[];
  activeSubjectIndex: number;
  completedSubjects: string[];
  overallProgress: number;
  recordsFound: number;
  activeSubjectRecords: number;
}

const PRIMARY_COLOR = "#6C63FF";
const SECONDARY_COLOR = "#00D9FF";
const SUCCESS_COLOR = "#00F5A0";
const ERROR_COLOR = "#FF4D6D";
const MUTED_COLOR = "#2b2b36";

// Auto-rotating camera — no user controls needed
function AutoCamera({ currentStep }: { currentStep: string }) {
  const { camera } = useThree();
  const angleRef = useRef(0);
  const isComplete = currentStep === 'complete';
  const isError = currentStep === 'error';

  useFrame((_, delta) => {
    // Gentle auto-orbit around the scene
    const speed = isComplete ? 0.08 : isError ? 0.02 : 0.15;
    angleRef.current += delta * speed;
    
    const radius = 6;
    const bobY = Math.sin(angleRef.current * 0.5) * 0.3;
    
    camera.position.x = Math.sin(angleRef.current) * radius * 0.3;
    camera.position.y = bobY;
    camera.position.z = Math.cos(angleRef.current) * radius * 0.15 + radius * 0.85;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function Background() {
  return <Stars radius={50} depth={50} count={800} factor={3} saturation={0} fade speed={0.8} />;
}

function CentralNode({ currentStep }: { currentStep: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  
  const isError = currentStep === "error";
  const isComplete = currentStep === "complete";
  const color = isError ? ERROR_COLOR : isComplete ? SUCCESS_COLOR : PRIMARY_COLOR;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = t * 0.5;
      ref.current.rotation.x = t * 0.2;
      const pulse = 1 + Math.sin(t * 2) * 0.05;
      ref.current.scale.set(pulse, pulse, pulse);
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = -t * 0.4;
      wireRef.current.rotation.x = t * 0.3;
      wireRef.current.scale.copy(ref.current.scale).multiplyScalar(1.15);
    }
    if (glowRef.current) {
      const glowPulse = 1.6 + Math.sin(t * 1.5) * 0.15;
      glowRef.current.scale.set(glowPulse, glowPulse, glowPulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(t * 2) * 0.04;
    }
  });

  return (
    <group>
      <Icosahedron ref={ref} args={[0.8, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} emissive={color} emissiveIntensity={0.3} />
      </Icosahedron>
      <Icosahedron ref={wireRef} args={[0.8, 1]}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.25} />
      </Icosahedron>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
      <pointLight color={color} intensity={2.5} distance={12} />
    </group>
  );
}

function ProgressRing({ progress, currentStep }: { progress: number, currentStep: string }) {
  const isComplete = currentStep === "complete";
  const color = isComplete ? SUCCESS_COLOR : SECONDARY_COLOR;
  const groupRef = useRef<THREE.Group>(null!);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = clock.getElapsedTime() * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
      {/* Background track */}
      <Torus args={[1.5, 0.015, 16, 100]}>
        <meshBasicMaterial color={MUTED_COLOR} transparent opacity={0.4} />
      </Torus>
      {/* Active fill */}
      {progress > 0 && (
         <Torus args={[1.5, 0.035, 16, 100, (progress / 100) * Math.PI * 2]}>
           <meshBasicMaterial color={color} />
         </Torus>
      )}
    </group>
  );
}

function getSubjectPosition(index: number, total: number) {
  // Distribute nodes in a tighter, more visible orbit
  const angle = index * 2.39996; 
  // Keep radius manageable so nodes stay visible on mobile
  const radius = 2.2 + Math.min(index * 0.12, 1.0); 
  const z = Math.sin(index * 1.3) * 1.0; 
  
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  
  return new THREE.Vector3(x, y, z);
}

function SubjectNode({ 
  index, name, state, activeRecords, totalSubjects 
}: { 
  index: number; name: string; state: 'pending'|'active'|'complete'|'error'; activeRecords: number; totalSubjects: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  const planetRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const scaleRef = useRef(0);
  
  const pos = useMemo(() => getSubjectPosition(index, totalSubjects), [index, totalSubjects]);

  useFrame((_, delta) => {
    // Spawn animation & state scaling
    const targetScale = state === 'active' ? 1.3 : state === 'complete' ? 1.1 : 0.9;
    scaleRef.current += (targetScale - scaleRef.current) * delta * 5;
    if (ref.current) {
       ref.current.scale.setScalar(scaleRef.current);
    }
    
    if (planetRef.current) {
       planetRef.current.rotation.y += delta * 0.3;
       planetRef.current.rotation.x += delta * 0.1;
       if (state === 'active') {
         planetRef.current.rotation.y += delta * 0.6;
       }
    }
    
    if (ringRef.current) {
       ringRef.current.rotation.z -= delta * 0.3;
    }
  });

  const color = state === 'active' ? PRIMARY_COLOR : state === 'complete' ? SUCCESS_COLOR : state === 'error' ? ERROR_COLOR : MUTED_COLOR;

  // Truncate long subject names for 3D labels
  const displayName = name.length > 16 ? name.slice(0, 14) + '…' : name;

  return (
    <group ref={ref} position={[pos.x, pos.y, pos.z]}>
      {/* Connection Line */}
      <Line
        points={[[0, 0, 0], [-pos.x, -pos.y, -pos.z]]} 
        color={color}
        lineWidth={state === 'active' ? 1.5 : 0.8}
        opacity={state === 'active' ? 0.5 : 0.12}
        transparent
      />
      
      {/* Planet Structure */}
      <group ref={planetRef}>
         {/* Core */}
         <mesh>
           <sphereGeometry args={[0.18, 24, 24]} />
           <meshStandardMaterial 
             color={color} 
             metalness={0.5} 
             roughness={0.3} 
             emissive={color} 
             emissiveIntensity={state === 'active' ? 0.8 : state === 'complete' ? 0.5 : 0.05} 
           />
         </mesh>
         
         {/* Wireframe atmosphere */}
         <mesh scale={1.3}>
           <icosahedronGeometry args={[0.18, 1]} />
           <meshBasicMaterial color={color} wireframe transparent opacity={state === 'active' ? 0.4 : 0.2} />
         </mesh>
         
         {/* Glow for active */}
         {state === 'active' && (
           <mesh scale={2.5}>
             <sphereGeometry args={[0.18, 16, 16]} />
             <meshBasicMaterial color={PRIMARY_COLOR} transparent opacity={0.08} side={THREE.BackSide} />
           </mesh>
         )}
         
         {/* Orbital Ring */}
         <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]} scale={1.8}>
           <ringGeometry args={[0.18, 0.22, 32]} />
           <meshBasicMaterial color={SECONDARY_COLOR} side={THREE.DoubleSide} transparent opacity={state === 'active' ? 0.7 : 0.15} />
         </mesh>
      </group>

      {/* Label */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.13}
        color={state === 'pending' ? '#555566' : state === 'active' ? '#FFFFFF' : '#B0B0CC'}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.0}
        textAlign="center"
        font={undefined}
      >
        {displayName}
      </Text>
      
      {/* Records count badge */}
      {state === 'active' && activeRecords > 0 && (
        <Html position={[0.45, 0.45, 0]} center style={{ pointerEvents: 'none' }}>
           <div 
             style={{ 
               background: 'linear-gradient(135deg, #6C63FF, #00D9FF)', 
               color: 'white', 
               fontSize: '10px', 
               fontWeight: 'bold', 
               padding: '2px 8px', 
               borderRadius: '10px', 
               boxShadow: '0 2px 8px rgba(108,99,255,0.4)',
               whiteSpace: 'nowrap',
               userSelect: 'none',
               pointerEvents: 'none',
             }}
           >
             +{activeRecords}
           </div>
        </Html>
      )}
    </group>
  );
}

function ParticleStream({ activeNodeIndex, isComplete, totalSubjects }: { activeNodeIndex: number, isComplete: boolean, totalSubjects: number }) {
  const particlesCount = 25;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  
  const particles = useMemo(() => {
    return Array.from({ length: particlesCount }, () => ({
      t: Math.random(),
      speed: 0.008 + Math.random() * 0.015,
      offset: new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3),
      burstAngle1: Math.random() * Math.PI * 2,
      burstAngle2: Math.random() * Math.PI - Math.PI / 2,
    }));
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    if (isComplete) {
      particles.forEach((p, i) => {
        p.t += p.speed * 1.5;
        if (p.t > 1) p.t = 0;
        
        const radius = p.t * 8; 
        dummy.position.set(
           Math.cos(p.burstAngle1) * Math.cos(p.burstAngle2) * radius,
           Math.sin(p.burstAngle2) * radius,
           Math.sin(p.burstAngle1) * Math.cos(p.burstAngle2) * radius
        );
        dummy.scale.setScalar(Math.max(0.01, (1 - p.t) * 1.5));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      return;
    }

    if (activeNodeIndex === -1) {
      // Hide particles when idle
      particles.forEach((_, i) => {
        dummy.position.set(0, 0, -100);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      return;
    }

    const startPos = getSubjectPosition(activeNodeIndex, totalSubjects);
    
    particles.forEach((p, i) => {
       p.t += p.speed;
       if (p.t > 1) p.t = 0; 

       if (p.t < 0.5) {
         const progress = p.t * 2;
         const eased = progress * progress; // ease-in
         dummy.position.set(
           startPos.x * (1 - eased) + p.offset.x * (1 - eased),
           startPos.y * (1 - eased) + p.offset.y * (1 - eased),
           startPos.z * (1 - eased) + p.offset.z
         );
       } else {
         const progress = (p.t - 0.5) * 2;
         const eased = 1 - (1 - progress) * (1 - progress); // ease-out
         dummy.position.set(
           p.offset.x * (1 - eased) * 0.5,
           p.offset.y * (1 - eased) * 0.5,
           eased * 3
         );
       }
       
       const fadeOut = p.t > 0.85 ? (1 - p.t) / 0.15 : 1;
       dummy.scale.setScalar(Math.max(0.01, fadeOut * 0.8));
       dummy.updateMatrix();
       meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, particlesCount]}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color={isComplete ? SUCCESS_COLOR : SECONDARY_COLOR} transparent opacity={0.9} />
    </instancedMesh>
  );
}

// Floating ambient particles for depth
function AmbientParticles() {
  const count = 40;
  const ref = useRef<THREE.Points>(null!);
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.02;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.05) * 0.1;
    }
  });
  
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={SECONDARY_COLOR} size={0.03} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

export default function SyncSceneScene(props: SyncSceneProps) {
  return (
    <div 
      className="w-full h-full min-h-[35vh] md:min-h-full"
      style={{ 
        touchAction: 'none',          // Prevent all touch gestures (zoom, pan, scroll)
        WebkitTouchCallout: 'none',   // Prevent iOS callout
        WebkitUserSelect: 'none',     // Prevent text selection
        userSelect: 'none',           // Prevent text selection
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{ touchAction: 'none' }}
        onCreated={({ gl }) => {
          // Ensure canvas doesn't capture touch events for zoom
          gl.domElement.style.touchAction = 'none';
        }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -2, 4]} intensity={0.3} color="#00D9FF" />
        
        <Background />
        <AmbientParticles />
        <AutoCamera currentStep={props.currentStep} />
        
        <CentralNode currentStep={props.currentStep} />
        <ProgressRing progress={props.overallProgress} currentStep={props.currentStep} />

        {props.subjects.map((sub, idx) => {
          let state: 'pending'|'active'|'complete'|'error' = 'pending';
          if (props.currentStep === 'error') {
            state = 'error';
          } else if (props.completedSubjects.includes(sub) || props.currentStep === 'complete') {
            state = 'complete';
          } else if (idx === props.activeSubjectIndex) {
            state = 'active';
          }

          return (
            <SubjectNode 
              key={sub}
              index={idx}
              name={sub}
              state={state}
              activeRecords={idx === props.activeSubjectIndex ? props.activeSubjectRecords : 0}
              totalSubjects={props.subjects.length}
            />
          );
        })}

        {/* Particles */}
        <ParticleStream 
          activeNodeIndex={props.activeSubjectIndex} 
          isComplete={props.currentStep === 'complete'}
          totalSubjects={props.subjects.length}
        />
      </Canvas>
    </div>
  );
}
