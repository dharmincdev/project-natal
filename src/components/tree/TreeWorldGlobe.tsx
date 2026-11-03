'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TreeData, Person } from '@/types/tree';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  extractTreeGeoEvents,
  extractMigrationPaths,
  LocationCluster,
  GeoEventType,
  latLngToVector3,
  createGreatCircleArcPoints,
} from '@/lib/geo';
import { drawWorldPolygonsToCanvas } from '@/lib/world-land';
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  MapPin,
  Plane,
  X,
  ExternalLink,
  Compass,
  Globe2,
  ArrowRight,
} from 'lucide-react';

type TreeWorldGlobeProps = {
  treeData: TreeData;
  onPersonClick?: (person: Person) => void;
  onSelectPerson?: (person: Person) => void;
  selectedPersonId?: string | null;
  onSwitchToFlat?: () => void;
};

function formatCoord(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lng).toFixed(2)}° ${lngDir}`;
}

export default function TreeWorldGlobe({
  treeData,
  onPersonClick,
  onSelectPerson,
  onSwitchToFlat,
}: TreeWorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Visualization States (3D Globe only — 2D flat map toggle removed per PRO-15)
  const [selectedEventType, setSelectedEventType] = useState<GeoEventType | 'all'>('all');
  const [showMigrationArcs, setShowMigrationArcs] = useState(true);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const migrationCometsRef = useRef<{ points: THREE.Vector3[]; comet: THREE.Mesh }[]>([]);
  const reqIdRef = useRef<number | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Extract Geographic Data
  const { events, clusters } = useMemo(() => {
    return extractTreeGeoEvents(treeData);
  }, [treeData]);

  const migrationPaths = useMemo(() => {
    return extractMigrationPaths(treeData);
  }, [treeData]);

  // Filtered clusters based on selected event type
  const filteredClusters = useMemo(() => {
    if (selectedEventType === 'all') return clusters;
    return clusters
      .map((c) => ({
        ...c,
        events: c.events.filter((e) =>
          selectedEventType === 'education'
            ? e.type === 'education' || e.type === 'career'
            : e.type === selectedEventType
        ),
      }))
      .filter((c) => c.events.length > 0);
  }, [clusters, selectedEventType]);

  // Migrations connected to the currently selected cluster
  const selectedClusterMigrations = useMemo(() => {
    if (!selectedCluster) return [];
    const clusterNameLower = selectedCluster.name.toLowerCase();
    return migrationPaths.filter(
      (m) =>
        m.fromLocation.toLowerCase().includes(clusterNameLower) ||
        m.toLocation.toLowerCase().includes(clusterNameLower) ||
        (Math.abs(m.fromLat - selectedCluster.lat) < 0.5 &&
          Math.abs(m.fromLng - selectedCluster.lng) < 0.5) ||
        (Math.abs(m.toLat - selectedCluster.lat) < 0.5 &&
          Math.abs(m.toLng - selectedCluster.lng) < 0.5)
    );
  }, [selectedCluster, migrationPaths]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: clusters.length,
      birth: events.filter((e) => e.type === 'birth').length,
      marriage: events.filter((e) => e.type === 'marriage').length,
      education: events.filter((e) => e.type === 'education' || e.type === 'career').length,
      memorial: events.filter((e) => e.type === 'memorial').length,
      migrations: migrationPaths.length,
    };
  }, [clusters, events, migrationPaths]);

  // Auto-rotate state ref for animation loop
  const isAutoRotateRef = useRef(isAutoRotate);
  useEffect(() => {
    isAutoRotateRef.current = isAutoRotate;
  }, [isAutoRotate]);

  // Focus / rotate globe to a selected cluster
  const focusCluster = useCallback((cluster: LocationCluster) => {
    setSelectedCluster(cluster);
    setIsAutoRotate(false);
    if (globeGroupRef.current) {
      // Orient globe longitude toward camera
      const targetRotY = -((cluster.lng + 90) * Math.PI) / 180;
      globeGroupRef.current.rotation.y = targetRotY;
    }
  }, []);

  // Procedural High-Detail Earth Texture Generator (100% offline, zero external network assets)
  const createEarthTexture = useCallback((dark: boolean): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Deep Bathymetric Ocean Gradient Fill
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (dark) {
      oceanGrad.addColorStop(0, '#070b16');
      oceanGrad.addColorStop(0.5, '#0b1528');
      oceanGrad.addColorStop(1, '#070b16');
    } else {
      oceanGrad.addColorStop(0, '#bae6fd');
      oceanGrad.addColorStop(0.5, '#e0f2fe');
      oceanGrad.addColorStop(1, '#bae6fd');
    }
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Lat/Long Graticule Grid (every 15 degrees)
    ctx.strokeStyle = dark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(3, 105, 161, 0.16)';
    ctx.lineWidth = 1.2;

    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    for (let lng = -180; lng <= 180; lng += 15) {
      const x = ((lng + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Tropics (Cancer & Capricorn ±23.5°) Dashed Lines
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = dark ? 'rgba(251, 191, 36, 0.22)' : 'rgba(217, 119, 6, 0.25)';
    ctx.lineWidth = 1.4;
    [-23.5, 23.5].forEach((lat) => {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
    ctx.restore();

    // Equator & Prime Meridian Highlight
    ctx.strokeStyle = dark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(3, 105, 161, 0.32)';
    ctx.lineWidth = 2.0;
    const eqY = 0.5 * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(canvas.width, eqY);
    ctx.stroke();

    // 3. Polar Ice Cap Soft Frost Shading
    const arcticY = ((90 - 72) / 180) * canvas.height;
    const arcticGrad = ctx.createLinearGradient(0, 0, 0, arcticY);
    arcticGrad.addColorStop(0, dark ? 'rgba(241, 245, 249, 0.38)' : 'rgba(255, 255, 255, 0.65)');
    arcticGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = arcticGrad;
    ctx.fillRect(0, 0, canvas.width, arcticY);

    const antarcticY = ((90 - -66) / 180) * canvas.height;
    const antarcticGrad = ctx.createLinearGradient(0, antarcticY, 0, canvas.height);
    antarcticGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    antarcticGrad.addColorStop(1, dark ? 'rgba(241, 245, 249, 0.45)' : 'rgba(255, 255, 255, 0.72)');
    ctx.fillStyle = antarcticGrad;
    ctx.fillRect(0, antarcticY, canvas.width, canvas.height - antarcticY);

    // 4. Geographical Continents, Coastlines & Inland Cutouts
    drawWorldPolygonsToCanvas(ctx, canvas.width, canvas.height, {
      landFill: dark ? '#1e293b' : '#c7d2fe',
      landStroke: dark ? '#38bdf8' : '#2563eb',
      waterFill: dark ? '#0b1528' : '#e0f2fe',
      strokeWidth: 2.2,
      showBathymetry: true,
    });

    // Subtle Grid Dots Pattern overlay
    ctx.fillStyle = dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
    for (let x = 0; x < canvas.width; x += 32) {
      for (let y = 0; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Three.js Scene Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 40, 280);
    cameraRef.current = camera;

    // 3. Renderer (gracefully handle headless environments without WebGL context)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.minDistance = 140;
    controls.maxDistance = 600;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 1.2 : 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(200, 150, 150);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-200, -100, -150);
    scene.add(dirLight2);

    // 6. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Starfield Particle Cloud in Space (Dark Mode)
    let starGeo: THREE.BufferGeometry | null = null;
    let starMat: THREE.PointsMaterial | null = null;
    if (isDark) {
      starGeo = new THREE.BufferGeometry();
      const starCount = 450;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 500 + Math.random() * 550;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 1.6,
        transparent: true,
        opacity: 0.65,
      });
      const starMesh = new THREE.Points(starGeo, starMat);
      scene.add(starMesh);
    }

    // Earth Sphere (Radius = 100)
    const earthRadius = 100;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTexture = createEarthTexture(isDark);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.8,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Inner Atmospheric Glow Shell
    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.02, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x0284c7,
      transparent: true,
      opacity: isDark ? 0.14 : 0.09,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // Outer Atmospheric Haze Shell (Orbital Limb Glow)
    const outerAtmoGeo = new THREE.SphereGeometry(earthRadius * 1.06, 32, 32);
    const outerAtmoMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x0284c7 : 0x38bdf8,
      transparent: true,
      opacity: isDark ? 0.06 : 0.04,
      side: THREE.BackSide,
    });
    const outerAtmoMesh = new THREE.Mesh(outerAtmoGeo, outerAtmoMat);
    globeGroup.add(outerAtmoMesh);

    // Pin & Arcs Groups inside Globe Group so they rotate together
    const pinsGroup = new THREE.Group();
    globeGroup.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    // Initial Camera Orientation centered on Americas & Atlantic
    globeGroup.rotation.y = -Math.PI * 0.45;

    // 7. Animation Loop
    let animationFrameId = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isAutoRotateRef.current && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += 0.0012;
      }

      // Animate glowing comet beads along migration flight curves
      const t = Date.now() * 0.0006;
      migrationCometsRef.current.forEach((item, idx) => {
        const progress = (t + idx * 0.25) % 1.0;
        const pIndex = Math.floor(progress * (item.points.length - 1));
        const pt = item.points[pIndex];
        if (pt && item.comet) {
          item.comet.position.copy(pt);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    reqIdRef.current = animationFrameId;

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      outerAtmoGeo.dispose();
      outerAtmoMat.dispose();
      if (starGeo) starGeo.dispose();
      if (starMat) starMat.dispose();
      earthTexture.dispose();
    };
  }, [isDark, createEarthTexture]);

  // Update Markers and Arcs on 3D Globe
  useEffect(() => {
    if (!pinsGroupRef.current || !arcsGroupRef.current) return;

    const pinsGroup = pinsGroupRef.current;
    const arcsGroup = arcsGroupRef.current;

    while (pinsGroup.children.length > 0) {
      const obj = pinsGroup.children[0];
      pinsGroup.remove(obj);
    }
    while (arcsGroup.children.length > 0) {
      const obj = arcsGroup.children[0];
      arcsGroup.remove(obj);
    }
    migrationCometsRef.current = [];

    const radius = 100;

    // Create Pins for filtered clusters
    filteredClusters.forEach((cluster) => {
      const [x, y, z] = latLngToVector3(cluster.lat, cluster.lng, radius);
      const pos = new THREE.Vector3(x, y, z);
      const normal = pos.clone().normalize();

      const pinContainer = new THREE.Group();
      pinContainer.position.copy(pos);
      pinContainer.userData = { cluster };

      const hasBirth = cluster.events.some((e) => e.type === 'birth');
      const hasMarriage = cluster.events.some((e) => e.type === 'marriage');
      const hasEducation = cluster.events.some(
        (e) => e.type === 'education' || e.type === 'career'
      );
      const colorHex = hasBirth
        ? 0x10b981
        : hasMarriage
        ? 0xa855f7
        : hasEducation
        ? 0x3b82f6
        : 0x94a3b8;

      const stemHeight = 4.5;
      const stemGeo = new THREE.CylinderGeometry(0.5, 0.3, stemHeight, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      stem.position.copy(normal.clone().multiplyScalar(stemHeight / 2));
      pinContainer.add(stem);

      const headRadius = Math.min(3.2, Math.max(1.8, 1.2 + cluster.peopleCount * 0.4));
      const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.copy(normal.clone().multiplyScalar(stemHeight + headRadius));
      pinContainer.add(head);

      const ringGeo = new THREE.RingGeometry(2.0, 3.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      pinContainer.add(ring);

      pinsGroup.add(pinContainer);
    });

    // Create 3D Migration Arcs and Animated Flight Comets
    if (showMigrationArcs) {
      migrationPaths.forEach((path) => {
        const start = latLngToVector3(path.fromLat, path.fromLng, radius);
        const end = latLngToVector3(path.toLat, path.toLng, radius);
        const arcPoints = createGreatCircleArcPoints(start, end, radius, 40);

        const curvePoints = arcPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const curveMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.65,
        });

        const line = new THREE.Line(curveGeo, curveMat);
        arcsGroup.add(line);

        const cometGeo = new THREE.SphereGeometry(1.4, 12, 12);
        const cometMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.9,
          roughness: 0.1,
        });
        const comet = new THREE.Mesh(cometGeo, cometMat);
        arcsGroup.add(comet);
        migrationCometsRef.current.push({ points: curvePoints, comet });
      });
    }
  }, [filteredClusters, migrationPaths, showMigrationArcs]);

  // Click & Raycast Handler for 3D Pins
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !pinsGroupRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(pinsGroupRef.current.children, true);

    if (intersects.length > 0) {
      let target: THREE.Object3D | null = intersects[0].object;
      while (target && !target.userData?.cluster && target.parent) {
        target = target.parent;
      }
      if (target?.userData?.cluster) {
        setSelectedCluster(target.userData.cluster);
        setIsAutoRotate(false);
      }
    }
  };

  // Zoom Controls for 3D
  const handleZoom = (delta: number) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const currentDist = cameraRef.current.position.length();
    const newDist = Math.max(140, Math.min(600, currentDist + delta));
    cameraRef.current.position.setLength(newDist);
    controlsRef.current.update();
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-background overflow-hidden select-none">
      {/* Top Floating Filter & Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Event Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-md pointer-events-auto">
          <button
            type="button"
            onClick={() => setSelectedEventType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              selectedEventType === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>All Hubs</span>
            <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4">
              {counts.all}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setSelectedEventType('birth')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              selectedEventType === 'birth'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span>👶</span>
            <span className="hidden sm:inline">Births</span>
            <span className="text-[10px] opacity-80">({counts.birth})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedEventType('marriage')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              selectedEventType === 'marriage'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span>💍</span>
            <span className="hidden sm:inline">Marriages</span>
            <span className="text-[10px] opacity-80">({counts.marriage})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedEventType('education')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              selectedEventType === 'education'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span>🎓</span>
            <span className="hidden md:inline">Career / Education</span>
            <span className="text-[10px] opacity-80">({counts.education})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedEventType('memorial')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              selectedEventType === 'memorial'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span>🕊️</span>
            <span className="hidden lg:inline">Memorials</span>
            <span className="text-[10px] opacity-80">({counts.memorial})</span>
          </button>
        </div>

        {/* Right: 3D Migration Arcs & Rotation Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-md pointer-events-auto">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Globe2 className="w-3.5 h-3.5" />
            <span>3D World Globe</span>
          </div>

          <Button
            type="button"
            variant={showMigrationArcs ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMigrationArcs(!showMigrationArcs)}
            className={`h-8 px-2.5 text-xs gap-1 font-semibold ${
              showMigrationArcs
                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                : 'text-muted-foreground'
            }`}
            title="Toggle generational migration flight paths"
          >
            <Plane className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Migration Arcs</span>
            <span className="text-[10px] opacity-85">({counts.migrations})</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={isAutoRotate ? 'Pause Earth Rotation' : 'Resume Earth Rotation'}
          >
            {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main 3D Three.js Globe Viewport */}
      <div className="flex-1 w-full h-full relative">
        <div
          ref={containerRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* 3D Floating Camera Controls (Bottom Left) */}
        <div className="absolute bottom-16 sm:bottom-4 left-3 sm:left-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-md">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleZoom(-30)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleZoom(30)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-border hidden md:block" />
          <span className="text-[11px] text-muted-foreground px-1 font-medium hidden md:inline">
            🖱️ Drag to rotate • Scroll to zoom
          </span>
        </div>

        {/* Interactive Global Hubs Bar (Bottom Center) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 max-w-[92vw] sm:max-w-2xl">
          <div className="px-3 py-1.5 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-lg text-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="font-semibold text-foreground flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>{filteredClusters.length} Global Hubs:</span>
            </span>
            {filteredClusters.map((cluster) => {
              const isSelected = selectedCluster?.id === cluster.id;
              return (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => focusCluster(cluster)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                      : 'bg-background/80 hover:bg-muted text-foreground border-border'
                  }`}
                >
                  <span>{cluster.name}</span>
                  <span className="text-[10px] opacity-80">({cluster.peopleCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Location Details Slide-Over Drawer */}
      {selectedCluster && (
        <div
          data-testid="globe-location-drawer"
          className="absolute top-16 sm:top-18 right-3 sm:right-4 z-40 w-[calc(100vw-1.5rem)] max-w-sm sm:max-w-md max-h-[78vh] rounded-2xl bg-card/95 backdrop-blur-lg border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-right-4 duration-200"
        >
          {/* Header */}
          <div className="p-4 border-b flex items-start justify-between bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <h3 className="font-bold text-base text-foreground leading-tight">
                  {selectedCluster.name}
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                  {formatCoord(selectedCluster.lat, selectedCluster.lng)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCluster.country} • {selectedCluster.peopleCount} Family Members •{' '}
                {selectedCluster.events.length} Milestones
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCluster(null)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Events & Migration Paths List */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {selectedClusterMigrations.length > 0 && (
              <div className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 space-y-1.5">
                <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5" />
                  <span>Generational Migration Corridors ({selectedClusterMigrations.length})</span>
                </div>
                <div className="space-y-1">
                  {selectedClusterMigrations.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="text-[11px] text-foreground/90 flex items-center justify-between gap-2 bg-background/70 px-2 py-1 rounded-md border border-border/50"
                    >
                      <span className="truncate">
                        <strong>{m.parentName}</strong> ({m.fromLocation})
                      </span>
                      <ArrowRight className="w-3 h-3 text-sky-500 shrink-0" />
                      <span className="truncate">
                        <strong>{m.childName}</strong> ({m.toLocation})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCluster.events.map((ev) => {
              const person = treeData.people.find((p) => p.id === ev.personId);

              const badgeColor =
                ev.type === 'birth'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : ev.type === 'marriage'
                  ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300'
                  : ev.type === 'education' || ev.type === 'career'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

              return (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl border border-border/70 bg-background/80 hover:bg-muted/30 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground border overflow-hidden shrink-0">
                        {ev.photoUrl ? (
                          <img
                            src={ev.photoUrl}
                            alt={ev.personName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{ev.personName.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{ev.personName}</h4>
                        <p className="text-[11px] text-muted-foreground">{ev.description}</p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 capitalize shrink-0 ${badgeColor}`}
                    >
                      {ev.type}
                    </Badge>
                  </div>

                  {person && (
                    <div className="pt-1.5 border-t flex items-center justify-between text-xs">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {ev.date ? ev.date : ev.year ? `Year: ${ev.year}` : ''}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (onPersonClick) onPersonClick(person);
                          if (onSelectPerson) onSelectPerson(person);
                          if (onSwitchToFlat) onSwitchToFlat();
                        }}
                        className="h-6 px-2 text-[11px] font-semibold text-primary hover:text-primary/90 gap-1"
                      >
                        <span>View on Tree</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-muted/20 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedCluster(null)}
              className="text-xs h-7 px-3"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
