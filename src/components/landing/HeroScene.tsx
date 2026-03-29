'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Text, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';
import { useScroll } from 'framer-motion';

// --- Components ---

function CentralSphere({ isMobile }: { isMobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const position: [number, number, number] = isMobile ? [0, 1, 0] : [2.5, 0, 0];

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.003;
      group.current.rotation.x += 0.001;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Glow PointLight inside */}
      <pointLight color="#5B5FEE" intensity={3} distance={10} />

      {/* Solid Sphere */}
      <mesh>
        <icosahedronGeometry args={[1.2, 2]} />
        <meshStandardMaterial color="#5B5FEE" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <icosahedronGeometry args={[1.25, 2]} />
        <meshBasicMaterial color="#5B5FEE" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function OrbitingRing({ rad, angleX, speed, color, isMobile }: { rad: number; angleX: number; speed: number; color: string; isMobile: boolean }) {
  const pivot = useRef<THREE.Group>(null);
  const position: [number, number, number] = isMobile ? [0, 1, 0] : [2.5, 0, 0];

  useFrame(() => {
    if (pivot.current) {
      pivot.current.rotation.y += speed;
    }
  });

  return (
    <group position={position} rotation={[angleX, 0, 0]}>
      <group ref={pivot}>
        {/* The Torus Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[rad, 0.008, 16, 100]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
        {/* Small Orb */}
        <mesh position={[rad, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={color} />
          <pointLight color={color} intensity={0.5} distance={2} />
        </mesh>
      </group>
    </group>
  );
}

function FloatingParticles({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 80 : 200;
  const pointsRef = useRef<THREE.Points>(null);

  // Generate random points in a sphere shell
  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 4;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      phs[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: phs };
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      const positionsAttr = pointsRef.current.geometry.attributes.position;
      const posArray = positionsAttr.array as Float32Array;
      const time = state.clock.getElapsedTime();

      for (let i = 0; i < count; i++) {
        // slight gentle oscillation on Y axis
        posArray[i * 3 + 1] += Math.sin(time + phases[i]) * 0.0015;
      }
      positionsAttr.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial transparent vertexColors={false} color="#00D4FF" size={0.03} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
    </Points>
  );
}

function ConnectingLines({ isMobile }: { isMobile: boolean }) {
  // Return early if mobile to save performance
  if (isMobile) return null;

  const count = 15;
  const lines = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const start = new THREE.Vector3(2.5, 0, 0); // center of sphere
      // Random end point within radius 5
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      arr.push({ start, end });
    }
    return arr;
  }, []);

  return (
    <group>
      {lines.map((line, i) => (
        <LineRenderer key={i} start={line.start} end={line.end} delay={i * 0.2} />
      ))}
    </group>
  );
}

function LineRenderer({ start, end, delay }: { start: THREE.Vector3; end: THREE.Vector3; delay: number }) {
  const lineRef = useRef<any>(null);
  
  useFrame((state) => {
    if (lineRef.current?.material) {
      const time = state.clock.getElapsedTime();
      if (time > delay) {
        lineRef.current.material.dashOffset -= 0.005;
      }
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[start, end]}
      color="#00D4FF"
      transparent
      opacity={0.15}
      lineWidth={1}
      dashed
      dashSize={0.5}
      gapSize={0.5}
    />
  );
}

function FloatingTexts() {
  const texts = [
    { text: '82%', pos: [-2, 2, -1], speed: 0.001 },
    { text: '76%', pos: [3, 3, -2], speed: 0.0012 },
    { text: '91%', pos: [4, -1, 1], speed: 0.0008 },
  ];

  return (
    <group>
      {texts.map((val, i) => (
        <FloatingText key={i} {...val} />
      ))}
    </group>
  );
}

function FloatingText({ text, pos, speed }: { text: string; pos: number[]; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y += speed;
      // Reset position if too high
      if (ref.current.position.y > 6) {
        ref.current.position.y = -4;
      }
      
      const time = state.clock.getElapsedTime();
      // Sine wave opacity fade built into position
      const opacity = Math.sin(time + pos[0]) * 0.3 + 0.3;
      if (ref.current.children[0]) {
        (ref.current.children[0] as any).fillOpacity = Math.max(0, opacity);
      }
    }
  });

  return (
    <group ref={ref} position={pos as [number, number, number]}>
      <Text
        font="https://fonts.gstatic.com/s/jetbrainsmono/v13/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOV.woff"
        color="#00F0A0"
        fontSize={0.4}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
}

function SceneContainer({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  useFrame(() => {
    if (groupRef.current && !isMobile) {
      // Smooth lerp scene rotation based on mouse
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (mouse.x * 0.08), 0.03);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, (mouse.y * 0.04), 0.03);
    }
  });

  return (
    <group ref={groupRef}>
      <CentralSphere isMobile={isMobile} />
      
      {/* 5 Subjects Rings */}
      <OrbitingRing isMobile={isMobile} rad={1.8} angleX={0.3} speed={0.002} color="#00F0A0" />
      <OrbitingRing isMobile={isMobile} rad={2.3} angleX={0.8} speed={0.0015} color="#00F0A0" />
      <OrbitingRing isMobile={isMobile} rad={2.8} angleX={1.2} speed={0.001} color="#FF4D6D" />
      <OrbitingRing isMobile={isMobile} rad={3.2} angleX={0.5} speed={0.0018} color="#00F0A0" />
      <OrbitingRing isMobile={isMobile} rad={3.7} angleX={1.0} speed={0.0012} color="#FFB520" />

      <FloatingParticles isMobile={isMobile} />
      <ConnectingLines isMobile={isMobile} />
      <FloatingTexts />

      <gridHelper args={[20, 20, '#5B5FEE', '#5B5FEE']} position={[0, -3, 0]} material-transparent material-opacity={0.08} />
    </group>
  );
}

export default function HeroScene() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 7], fov: 60 }} dpr={[1, 1.5]} frameloop="always">
        <ambientLight intensity={0.3} color="#ffffff" />
        <pointLight position={[3, 3, 3]} color="#5B5FEE" intensity={2} />
        <pointLight position={[-3, -2, -1]} color="#00D4FF" intensity={1.5} />
        <SceneContainer isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
