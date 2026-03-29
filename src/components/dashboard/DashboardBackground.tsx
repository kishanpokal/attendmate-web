"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

// 1. Floating Data Grid
function DataGrid({ isMobile, prefersReducedMotion }: { isMobile: boolean; prefersReducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const gridSize = isMobile ? 4 : 8;
  const spread = 8;

  const cubes = useMemo(() => {
    const temp = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        temp.push({
          position: [
            (x - gridSize / 2) * (spread / gridSize) * 1.5,
            (y - gridSize / 2) * (spread / gridSize) * 1.5,
            -4 + (Math.random() - 0.5) * 2,
          ] as [number, number, number],
          color: Math.random() > 0.5 ? "#5B5FEE" : "#00D4FF", // Primary or Cyan
          opacity: 0.15 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    return temp;
  }, [gridSize]);

  useFrame(({ clock }) => {
    if (prefersReducedMotion || !groupRef.current) return;
    const time = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const cubeData = cubes[i];
      if (cubeData) {
        child.rotation.x += 0.003 * Math.sin(time + cubeData.phase);
        child.rotation.y += 0.005 * Math.cos(time + cubeData.phase * 0.7);
        child.position.y = cubeData.position[1] + Math.sin(time * 0.4 + cubeData.phase) * 0.1;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {cubes.map((cube, i) => (
        <mesh key={i} position={cube.position}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color={cube.color} transparent opacity={cube.opacity} />
        </mesh>
      ))}
    </group>
  );
}

// 2. Particle Field
function ParticleField({ isMobile, prefersReducedMotion }: { isMobile: boolean; prefersReducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = isMobile ? 120 : 300;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const colorPrimary = new THREE.Color("#5B5FEE");
    const colorCyan = new THREE.Color("#00D4FF");
    const colorGreen = new THREE.Color("#00F0A0");

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;     // x[-8, 8]
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12; // y[-6, 6]
      pos[i * 3 + 2] = (Math.random() - 1) * 6;    // z[-6, 0]

      const rand = Math.random();
      let c = colorPrimary;
      if (rand > 0.6) c = colorCyan;
      if (rand > 0.9) c = colorGreen;

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [particleCount]);

  useFrame(() => {
    if (prefersReducedMotion || !pointsRef.current) return;
    const array = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      array[i * 3 + 1] += 0.002; // drift up
      if (array[i * 3 + 1] > 6) {
        array[i * 3 + 1] = -6;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} vertexColors transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

// 3. Large Glow Orbs
function GlowOrbs({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const orbARef = useRef<THREE.Mesh>(null);
  const orbBRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (prefersReducedMotion) return;
    const time = clock.getElapsedTime();
    if (orbARef.current) {
      const scaleA = 3 + Math.sin(time * 0.5) * 0.2;
      orbARef.current.scale.setScalar(scaleA);
    }
    if (orbBRef.current) {
      const scaleB = 2 + Math.sin(time * 0.5 + Math.PI) * 0.2;
      orbBRef.current.scale.setScalar(scaleB);
    }
  });

  return (
    <>
      {/* Glow Orbs */}
      <mesh ref={orbARef} position={[4, 3, -5]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#5B5FEE" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight position={[4, 3, -5]} color="#5B5FEE" intensity={0.3} />

      <mesh ref={orbBRef} position={[-5, -2, -4]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight position={[-5, -2, -4]} color="#00D4FF" intensity={0.2} />
    </>
  );
}

// 4. Connecting Lines
function ConnectingLines({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const lineCount = 8;
  const lines = useMemo(() => {
    return Array.from({ length: lineCount }).map(() => ({
      points: [
        new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, -4),
        new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, -4),
      ],
    }));
  }, []);

  const matRefs = useRef<Array<any>>([]);

  useFrame((state, delta) => {
    if (!prefersReducedMotion) {
      matRefs.current.forEach(mat => {
        if (mat) {
          mat.dashOffset -= 0.5 * delta;
        }
      });
    }
  });

  return (
    <group>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color="#5B5FEE"
          opacity={0.08}
          transparent
          lineWidth={1}
          dashed={true}
          dashScale={0.5}
          dashSize={0.3}
          gapSize={0.2}
        >
          <lineDashedMaterial ref={el => matRefs.current[i] = el} dashSize={0.3} gapSize={0.2} color="#5B5FEE" transparent opacity={0.08} />
        </Line>
      ))}
    </group>
  );
}

// Scene Root with Parallax
function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useFrame(() => {
    if (prefersReducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouse.x * 0.04, 0.02);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.y * 0.03, 0.02);
  });

  return (
    <group ref={groupRef}>
      <DataGrid isMobile={isMobile} prefersReducedMotion={!!prefersReducedMotion} />
      <ParticleField isMobile={isMobile} prefersReducedMotion={!!prefersReducedMotion} />
      <GlowOrbs prefersReducedMotion={!!prefersReducedMotion} />
      {!isMobile && <ConnectingLines prefersReducedMotion={!!prefersReducedMotion} />}

      <ambientLight intensity={0.4} color="white" />
      <pointLight position={[2, 4, 2]} color="#5B5FEE" intensity={1.5} />
      <pointLight position={[-3, -2, 1]} color="#00D4FF" intensity={1} />
    </group>
  );
}

export default function DashboardBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas dpr={[1, 1.5]} frameloop="always" camera={{ position: [0, 0, 5], fov: 75 }}>
        <Scene />
      </Canvas>
    </div>
  );
}
