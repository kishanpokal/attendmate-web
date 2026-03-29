"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, RoundedBox, Icosahedron, Torus, Line, Ring, Html } from '@react-three/drei';
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

function Background() {
  const { camera } = useThree();
  
  // Subtle parallax effect for stars
  useFrame(({ mouse }) => {
    const targetX = mouse.x * 0.1;
    const targetY = mouse.y * 0.1;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
  });

  return <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />;
}

function CentralNode({ currentStep }: { currentStep: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);
  
  const isError = currentStep === "error";
  const isComplete = currentStep === "complete";
  const color = isError ? ERROR_COLOR : isComplete ? SUCCESS_COLOR : PRIMARY_COLOR;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = t * 0.5;
      ref.current.rotation.x = t * 0.2;
      
      // Pulse scale
      const pulse = 1 + Math.sin(t * 2) * 0.05;
      ref.current.scale.set(pulse, pulse, pulse);
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = -t * 0.4;
      wireRef.current.rotation.x = t * 0.3;
      wireRef.current.scale.copy(ref.current.scale).multiplyScalar(1.1);
    }
  });

  return (
    <group>
      <Icosahedron ref={ref} args={[0.8, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} emissive={color} emissiveIntensity={0.2} />
      </Icosahedron>
      <Icosahedron ref={wireRef} args={[0.8, 1]}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </Icosahedron>
      <pointLight color={color} intensity={2} distance={10} />
    </group>
  );
}

function ProgressRing({ progress, currentStep }: { progress: number, currentStep: string }) {
  const isComplete = currentStep === "complete";
  const color = isComplete ? SUCCESS_COLOR : SECONDARY_COLOR;
  
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Background track */}
      <Torus args={[1.5, 0.02, 16, 100]}>
        <meshBasicMaterial color={MUTED_COLOR} transparent opacity={0.5} />
      </Torus>
      {/* Active fill */}
      {progress > 0 && (
         <Torus args={[1.5, 0.03, 16, 100, (progress / 100) * Math.PI * 2]}>
           <meshBasicMaterial color={color} />
         </Torus>
      )}
    </group>
  );
}

function getSubjectPosition(index: number) {
  // Golden angle distribution for fixed, organic placement
  const angle = index * 2.39996; 
  // Radius expands slowly as index increases to prevent overlap
  const radius = 2.5 + (index * 0.15); 
  // Varied Z plane for depth 
  const z = Math.sin(index * 1.3) * 1.5; 
  
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  
  return new THREE.Vector3(x, y, z);
}

function SubjectNode({ 
  index, name, state, activeRecords 
}: { 
  index: number; name: string; state: 'pending'|'active'|'complete'|'error'; activeRecords: number 
}) {
  const ref = useRef<THREE.Group>(null!);
  const planetRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const scaleRef = useRef(0); // Setup spawn pop
  
  const pos = useMemo(() => getSubjectPosition(index), [index]);

  useFrame((_, delta) => {
    // Spawn animation & state scaling
    const targetScale = state === 'active' ? 1.3 : state === 'complete' ? 1.1 : 1.0;
    scaleRef.current += (targetScale - scaleRef.current) * delta * 6;
    if (ref.current) {
       ref.current.scale.setScalar(scaleRef.current);
    }
    
    // Rotation of planetary structure
    if (planetRef.current) {
       planetRef.current.rotation.y += delta * 0.2;
       planetRef.current.rotation.x += delta * 0.1;
       if (state === 'active') {
         planetRef.current.rotation.y += delta * 0.8;
       }
    }
    
    // Independent Ring rotation
    if (ringRef.current) {
       ringRef.current.rotation.z -= delta * 0.3;
    }
  });

  const color = state === 'active' ? PRIMARY_COLOR : state === 'complete' ? SUCCESS_COLOR : state === 'error' ? ERROR_COLOR : MUTED_COLOR;

  return (
    <group ref={ref} position={[pos.x, pos.y, pos.z]}>
      {/* Connection Line */}
      <Line
        points={[[0, 0, 0], [-pos.x, -pos.y, -pos.z]]} 
        color={color}
        lineWidth={1}
        opacity={state === 'active' ? 0.6 : 0.15}
        transparent
      />
      
      {/* Advanced Planet Structure */}
      <group ref={planetRef}>
         {/* Core */}
         <mesh>
           <sphereGeometry args={[0.15, 24, 24]} />
           <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} emissive={color} emissiveIntensity={state === 'active' || state === 'complete' ? 0.6 : 0} />
         </mesh>
         
         {/* Holographic Wireframe Atmosphere */}
         <mesh scale={1.2}>
           <icosahedronGeometry args={[0.15, 1]} />
           <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
         </mesh>
         
         {/* Orbital Ring (like Saturn) */}
         <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]} scale={1.8}>
           <ringGeometry args={[0.15, 0.2, 32]} />
           <meshBasicMaterial color={SECONDARY_COLOR} side={THREE.DoubleSide} transparent opacity={state === 'active' ? 0.8 : 0.2} />
         </mesh>
      </group>

      {/* Label */}
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.15}
        color={state === 'pending' ? '#8B8FA8' : '#F0F0FF'}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.0}
        textAlign="center"
      >
        {name}
      </Text>
      
      {/* Records count pop */}
      {state === 'active' && activeRecords > 0 && (
        <Html position={[0.5, 0.5, 0]} center>
           <div className="bg-[#6C63FF] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg animate-bounce border border-white/20">
             +{activeRecords}
           </div>
        </Html>
      )}
    </group>
  );
}

function ParticleStream({ activeNodeIndex, isComplete }: { activeNodeIndex: number, isComplete: boolean }) {
  const particlesCount = 20;
  
  // Use useMemo to avoid recreating objects constantly
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  
  const particles = useMemo(() => {
    return Array.from({ length: particlesCount }, () => ({
      t: Math.random(), // 0 to 1 position along curve
      speed: 0.01 + Math.random() * 0.02,
      offset: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4)
    }));
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    // If complete, burst outward from center
    if (isComplete) {
      if (!particles) return;
      particles.forEach((p, i) => {
        p.t += p.speed * 2;
        if (p.t > 1) p.t = 0;
        
        // Explode outward radially
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const radius = p.t * 10; 
        
        dummy.position.set(
           Math.cos(angle1) * radius,
           Math.sin(angle1) * Math.cos(angle2) * radius,
           Math.sin(angle2) * radius
        );
        dummy.scale.setScalar(1 - p.t); // Shrink as they fly
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      return;
    }

    // Normal flow: from active node to center, then toward camera
    if (activeNodeIndex === -1) return; // No active node

    // Origin position (active node)
    const startPos = getSubjectPosition(activeNodeIndex);
    
    // Path: Active Node -> Center (0,0,0) -> Camera (0,0,3)
    // We approximate this using a bezier curve or simple interpolation
    
    particles.forEach((p, i) => {
       p.t += p.speed;
       if (p.t > 1) p.t = 0; 

       // First half: node to center. Second half: center to +Z
       if (p.t < 0.5) {
         const progress = p.t * 2; // 0 to 1
         dummy.position.set(
           startPos.x * (1 - progress) + p.offset.x * (1-progress),
           startPos.y * (1 - progress) + p.offset.y * (1-progress),
           startPos.z * (1 - progress) + p.offset.z
         );
       } else {
         const progress = (p.t - 0.5) * 2; // 0 to 1
         dummy.position.set(
           p.offset.x * (1 - progress), // keep some offset near center
           p.offset.y * (1 - progress),
           progress * 4 // fly toward camera (Z axis)
         );
       }
       
       dummy.scale.setScalar(p.t > 0.8 ? (1-p.t)*5 : 1);
       dummy.updateMatrix();
       meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, particlesCount]}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color={isComplete ? SUCCESS_COLOR : SECONDARY_COLOR} />
    </instancedMesh>
  );
}

export default function SyncSceneScene(props: SyncSceneProps) {
  const totalNodes = Math.max(1, props.subjects.length);

  return (
    <div className="w-full h-full min-h-[40vh] md:min-h-full">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        <Background />
        
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
            />
          );
        })}

        {/* Particles */}
        <ParticleStream 
          activeNodeIndex={props.activeSubjectIndex} 
          isComplete={props.currentStep === 'complete'}
        />

        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 2.5}
          autoRotate={props.currentStep === 'idle' || props.currentStep === 'login'}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
