import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Premium 3D Interactive Environmental Earth / Atmospheric Globe
 * Features:
 * - Glowing wireframe coordinate sphere & atmospheric corona
 * - Orbiting clean air & particulate particle rings
 * - Geolocation sensor markers (New Delhi, New York, London, Tokyo)
 * - Mouse parallax interaction
 * - Auto-rotation with delta time
 * - Automatic cleanup of WebGL context & buffers
 */
export default function HeroGlobe3D({ className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = isMobile ? 3.4 : 2.9;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Inner Core Atmosphere Sphere
    const globeRadius = 0.95;
    const coreGeo = new THREE.SphereGeometry(globeRadius, isMobile ? 24 : 36, isMobile ? 24 : 36);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x061522,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 2. Latitude / Longitude Grid Sphere
    const gridGeo = new THREE.SphereGeometry(globeRadius + 0.005, isMobile ? 18 : 28, isMobile ? 18 : 28);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // 3. Dot Landmass/Atmospheric Node System
    const dotCount = isMobile ? 380 : 850;
    const dotGeo = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(dotCount * 3);
    const dotColors = new Float32Array(dotCount * 3);

    const cClean = new THREE.Color(0x10b981); // Emerald
    const cCyan = new THREE.Color(0x06b6d4);  // Cyan
    const cPolluted = new THREE.Color(0xf59e0b); // Amber

    for (let i = 0; i < dotCount; i++) {
      // Fibonacci sphere distribution for uniform points
      const phi = Math.acos(-1 + (2 * i) / dotCount);
      const theta = Math.sqrt(dotCount * Math.PI) * phi;

      const r = globeRadius + 0.02 + Math.random() * 0.04;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      dotPositions[i * 3] = x;
      dotPositions[i * 3 + 1] = y;
      dotPositions[i * 3 + 2] = z;

      // Color distribution (70% clean air, 30% highlighted telemetry zones)
      const colorChoice = Math.random() > 0.3 ? (Math.random() > 0.5 ? cClean : cCyan) : cPolluted;
      dotColors[i * 3] = colorChoice.r;
      dotColors[i * 3 + 1] = colorChoice.g;
      dotColors[i * 3 + 2] = colorChoice.b;
    }

    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(dotColors, 3));

    const dotMat = new THREE.PointsMaterial({
      size: isMobile ? 0.025 : 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const dotPoints = new THREE.Points(dotGeo, dotMat);
    globeGroup.add(dotPoints);

    // 4. Atmospheric Outer Glow Shell
    const glowGeo = new THREE.SphereGeometry(globeRadius + 0.12, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: false,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    globeGroup.add(glowMesh);

    // 5. Orbiting Clean Air Ring Particles
    const orbitCount = isMobile ? 90 : 180;
    const orbitGeo = new THREE.BufferGeometry();
    const orbitPositions = new Float32Array(orbitCount * 3);

    for (let i = 0; i < orbitCount; i++) {
      const angle = (i / orbitCount) * Math.PI * 2;
      const radius = globeRadius + 0.28 + (Math.random() - 0.5) * 0.12;
      orbitPositions[i * 3] = Math.cos(angle) * radius;
      orbitPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.18;
      orbitPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));

    const orbitMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.022,
      transparent: true,
      opacity: 0.75,
    });
    const orbitRing = new THREE.Points(orbitGeo, orbitMat);
    orbitRing.rotation.x = Math.PI / 4;
    orbitRing.rotation.y = Math.PI / 6;
    scene.add(orbitRing);

    // 6. Benchmark City Visual Beacons
    // Coordinates conversion helper (lat/lng to 3D sphere)
    const latLngToVector3 = (lat, lng, radius) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const cities = [
      { name: 'Delhi', lat: 28.61, lng: 77.20, color: 0xef4444 },
      { name: 'New York', lat: 40.71, lng: -74.00, color: 0x10b981 },
      { name: 'London', lat: 51.50, lng: -0.12, color: 0x10b981 },
      { name: 'Tokyo', lat: 35.67, lng: 139.65, color: 0xf59e0b }
    ];

    const beaconGroup = new THREE.Group();
    cities.forEach((city) => {
      const pos = latLngToVector3(city.lat, city.lng, globeRadius + 0.03);
      const markerGeo = new THREE.SphereGeometry(0.025, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({ color: city.color });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(pos);
      beaconGroup.add(marker);

      // Pulse ring for beacon
      const ringGeo = new THREE.RingGeometry(0.03, 0.045, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: city.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      beaconGroup.add(ring);
    });
    globeGroup.add(beaconGroup);

    // Mouse Interaction for Parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouse.targetX = (clientX / rect.width - 0.5) * 0.45;
      mouse.targetY = (clientY / rect.height - 0.5) * 0.45;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      if (!prefersReducedMotion) {
        // Continuous slow rotation
        globeGroup.rotation.y += delta * 0.12;
        orbitRing.rotation.z -= delta * 0.08;

        // Smooth parallax lerp
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        globeGroup.rotation.x = mouse.y * 0.4;
        globeGroup.position.x = mouse.x * 0.35;
        globeGroup.position.y = -mouse.y * 0.35;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup WebGL on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Geometries & Materials
      [coreGeo, gridGeo, dotGeo, glowGeo, orbitGeo].forEach((g) => g.dispose());
      [coreMat, gridMat, dotMat, glowMat, orbitMat].forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-label="Interactive 3D Atmospheric Earth"
    />
  );
}
