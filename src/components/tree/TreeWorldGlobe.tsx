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
  MigrationPath,
  GeoEventType,
  latLngToVector3,
  createGreatCircleArcPoints,
} from '@/lib/geo';
import { drawWorldPolygonsToCanvas, getWorldSvgPath } from '@/lib/world-land';
import {
  RotateCcw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Layers,
  MapPin,
  Plane,
  X,
  ExternalLink,
  Users,
  Calendar,
  Sparkles,
  Compass,
  Map as MapIcon,
  Globe2,
} from 'lucide-react';

type TreeWorldGlobeProps = {
  treeData: TreeData;
  onPersonClick?: (person: Person) => void;
  onSelectPerson?: (person: Person) => void;
  selectedPersonId?: string | null;
  onSwitchToFlat?: () => void;
};

export default function TreeWorldGlobe({
  treeData,
  onPersonClick,
  onSelectPerson,
  selectedPersonId,
  onSwitchToFlat,
}: TreeWorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Visualization States
  const [mapMode, setMapMode] = useState<'3d' | '2d'>('3d');
  const [selectedEventType, setSelectedEventType] = useState<GeoEventType | 'all'>('all');
  const [showMigrationArcs, setShowMigrationArcs] = useState(true);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<LocationCluster | null>(null);

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

  // Memoized 2D SVG Map Paths
  const { landPath, lakesPath } = useMemo(() => getWorldSvgPath(1000, 500), []);

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
        events: c.events.filter((e) => e.type === selectedEventType),
      }))
      .filter((c) => c.events.length > 0);
  }, [clusters, selectedEventType]);

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

  // Procedural Earth Texture Generator (Works 100% offline, zero network assets)
  const createEarthTexture = useCallback((dark: boolean): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Ocean Base Fill
    ctx.fillStyle = dark ? '#0a0f1d' : '#e0f2fe';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Lat/Long Graticule Grid
    ctx.strokeStyle = dark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(3, 105, 161, 0.15)';
    ctx.lineWidth = 1.5;

    // Latitude lines (Parallels)
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Longitude lines (Meridians)
    for (let lng = -180; lng <= 180; lng += 20) {
      const x = ((lng + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Equator & Prime Meridian Highlight
    ctx.strokeStyle = dark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(3, 105, 161, 0.3)';
    ctx.lineWidth = 2.0;
    const eqY = 0.5 * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(canvas.width, eqY);
    ctx.stroke();

    // 3. Polar Ice Cap Soft Frost Shading
    // North Pole Arctic Ice Cap (lat > 72)
    const arcticY = ((90 - 72) / 180) * canvas.height;
    const arcticGrad = ctx.createLinearGradient(0, 0, 0, arcticY);
    arcticGrad.addColorStop(0, dark ? 'rgba(241, 245, 249, 0.35)' : 'rgba(255, 255, 255, 0.6)');
    arcticGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = arcticGrad;
    ctx.fillRect(0, 0, canvas.width, arcticY);

    // South Pole Antarctic Ice Cap (lat < -66)
    const antarcticY = ((90 - (-66)) / 180) * canvas.height;
    const antarcticGrad = ctx.createLinearGradient(0, antarcticY, 0, canvas.height);
    antarcticGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    antarcticGrad.addColorStop(1, dark ? 'rgba(241, 245, 249, 0.45)' : 'rgba(255, 255, 255, 0.7)');
    ctx.fillStyle = antarcticGrad;
    ctx.fillRect(0, antarcticY, canvas.width, canvas.height - antarcticY);

    // 4. Ultra-Accurate Geographical Continents, Coastlines & Inland Cutouts
    drawWorldPolygonsToCanvas(ctx, canvas.width, canvas.height, {
      landFill: dark ? '#1e293b' : '#c7d2fe',
      landStroke: dark ? '#38bdf8' : '#2563eb',
      waterFill: dark ? '#0a0f1d' : '#e0f2fe',
      strokeWidth: 2.0,
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
    if (!containerRef.current || mapMode !== '3d') return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 40, 280);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

    // Initial Camera Orientation centered on Americas & Pacific
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
  }, [mapMode, isDark, createEarthTexture]);

  // Update Markers and Arcs on 3D Globe
  useEffect(() => {
    if (mapMode !== '3d' || !pinsGroupRef.current || !arcsGroupRef.current) return;

    const pinsGroup = pinsGroupRef.current;
    const arcsGroup = arcsGroupRef.current;

    // Clear previous objects
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

      // Pin Container Group
      const pinContainer = new THREE.Group();
      pinContainer.position.copy(pos);
      pinContainer.userData = { cluster };

      // Pin Color based on events
      const hasBirth = cluster.events.some((e) => e.type === 'birth');
      const hasMarriage = cluster.events.some((e) => e.type === 'marriage');
      const hasEducation = cluster.events.some((e) => e.type === 'education' || e.type === 'career');
      const colorHex = hasBirth ? 0x10b981 : hasMarriage ? 0xa855f7 : hasEducation ? 0x3b82f6 : 0x94a3b8;

      // Stem (Cylinder pointing outward)
      const stemHeight = 4.5;
      const stemGeo = new THREE.CylinderGeometry(0.5, 0.3, stemHeight, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      stem.position.copy(normal.clone().multiplyScalar(stemHeight / 2));
      pinContainer.add(stem);

      // Sphere Head (Location beacon)
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

      // Base Halo Ring on the ground
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

        // Animated flight comet bead
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
  }, [filteredClusters, migrationPaths, showMigrationArcs, mapMode]);

  // Click & Raycast Handler for 3D Pins
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (mapMode !== '3d' || !containerRef.current || !cameraRef.current || !pinsGroupRef.current) return;

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
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card/85 backdrop-blur-md border border-border shadow-md pointer-events-auto">
          <button
            onClick={() => setSelectedEventType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedEventType === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>All</span>
            <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4">
              {counts.all}
            </Badge>
          </button>

          <button
            onClick={() => setSelectedEventType('birth')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
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
            onClick={() => setSelectedEventType('marriage')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
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
            onClick={() => setSelectedEventType('education')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
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
            onClick={() => setSelectedEventType('memorial')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
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

        {/* Right: View Toggles & Migration Arcs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card/85 backdrop-blur-md border border-border shadow-md pointer-events-auto">
          {/* 3D Globe vs 2D Map Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <button
              onClick={() => setMapMode('3d')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                mapMode === '3d'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="3D Rotating Earth Globe"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Globe</span>
            </button>
            <button
              onClick={() => setMapMode('2d')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                mapMode === '2d'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="2D Panoramic World Map"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2D Map</span>
            </button>
          </div>

          {/* Migration Paths Toggle */}
          <Button
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
            <span className="hidden sm:inline">Migration</span>
            <span className="text-[10px] opacity-85">({counts.migrations})</span>
          </Button>

          {/* Auto-Rotate Toggle (3D only) */}
          {mapMode === '3d' && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={isAutoRotate ? 'Pause Earth Rotation' : 'Resume Earth Rotation'}
            >
              {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Main View Area: 3D Globe or 2D Map */}
      <div className="flex-1 w-full h-full relative">
        {mapMode === '3d' ? (
          /* 3D Three.js Container */
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />
        ) : (
          /* 2D Flat Panoramic World Map View */
          <div className="w-full h-full overflow-auto flex items-center justify-center p-4 bg-muted/20">
            <div className="relative w-full max-w-5xl aspect-[2/1] rounded-2xl border bg-card shadow-lg overflow-hidden border-border/80">
              {/* Graticule Grid SVG */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 500">
                <defs>
                  <pattern id="grid-pattern-2d" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke={isDark ? '#1e293b' : '#e2e8f0'}
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>
                <rect width="1000" height="500" fill="url(#grid-pattern-2d)" />

                {/* Accurate Global Landmass Vector Outlines */}
                <path
                  d={landPath}
                  fill={isDark ? '#1e293b' : '#c7d2fe'}
                  stroke={isDark ? '#38bdf8' : '#2563eb'}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Inland Lakes Cutouts (Great Lakes, Caspian Sea, Black Sea, Lake Victoria) */}
                <path
                  d={lakesPath}
                  fill={isDark ? '#0a0f1d' : '#e0f2fe'}
                  stroke={isDark ? '#38bdf8' : '#2563eb'}
                  strokeWidth="1.0"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Equator & Meridians */}
                <line x1="0" y1="250" x2="1000" y2="250" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="500" y1="0" x2="500" y2="500" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="4 4" />

                {/* 2D Migration Arcs */}
                {showMigrationArcs &&
                  migrationPaths.map((path) => {
                    const x1 = ((path.fromLng + 180) / 360) * 1000;
                    const y1 = ((90 - path.fromLat) / 180) * 500;
                    const x2 = ((path.toLng + 180) / 360) * 1000;
                    const y2 = ((90 - path.toLat) / 180) * 500;

                    const midX = (x1 + x2) / 2;
                    const midY = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.18;

                    return (
                      <g key={path.id}>
                        <path
                          d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeDasharray="5 5"
                          opacity="0.8"
                        />
                      </g>
                    );
                  })}
              </svg>

              {/* 2D Location Pin Overlay */}
              {filteredClusters.map((cluster) => {
                const xPercent = ((cluster.lng + 180) / 360) * 100;
                const yPercent = ((90 - cluster.lat) / 180) * 100;
                const isSelected = selectedCluster?.id === cluster.id;

                const hasBirth = cluster.events.some((e) => e.type === 'birth');
                const hasMarriage = cluster.events.some((e) => e.type === 'marriage');
                const hasEdu = cluster.events.some((e) => e.type === 'education' || e.type === 'career');
                const bgBadge = hasBirth
                  ? 'bg-emerald-500'
                  : hasMarriage
                  ? 'bg-violet-500'
                  : hasEdu
                  ? 'bg-blue-500'
                  : 'bg-slate-500';

                return (
                  <button
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster)}
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer focus:outline-none"
                  >
                    <div className="relative flex items-center justify-center">
                      <span className={`w-4 h-4 rounded-full ${bgBadge} animate-ping opacity-75 absolute`} />
                      <div
                        className={`w-5 h-5 rounded-full ${bgBadge} text-white font-bold text-[10px] flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900 transition-transform ${
                          isSelected ? 'scale-125 ring-2 ring-amber-400' : 'group-hover:scale-110'
                        }`}
                      >
                        {cluster.peopleCount}
                      </div>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-popover text-popover-foreground border shadow-lg text-[11px] font-semibold whitespace-nowrap z-20">
                      {cluster.name} ({cluster.events.length} events)
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3D Floating Camera Controls (Bottom Left) */}
        {mapMode === '3d' && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-card/85 backdrop-blur-md border border-border shadow-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(-30)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(30)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-border" />
            <span className="text-[11px] text-muted-foreground px-1 font-medium hidden sm:inline">
              🖱️ Drag to rotate • Scroll to zoom
            </span>
          </div>
        )}

        {/* Summary Pill (Bottom Center) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-md text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-foreground">{treeData.tree.name}</span>
            <span>•</span>
            <span>{filteredClusters.length} Global Hubs</span>
            <span>•</span>
            <span>{events.length} Milestones</span>
          </div>
        </div>
      </div>

      {/* Selected Location Details Slide-Over Drawer */}
      {selectedCluster && (
        <div className="absolute top-16 sm:top-18 right-3 sm:right-4 z-40 w-full max-w-sm sm:max-w-md max-h-[78vh] rounded-2xl bg-card/95 backdrop-blur-lg border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-right-4 duration-200">
          {/* Header */}
          <div className="p-4 border-b flex items-start justify-between bg-muted/30">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <h3 className="font-bold text-base text-foreground leading-tight">
                  {selectedCluster.name}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCluster.country} • {selectedCluster.peopleCount} Family Members • {selectedCluster.events.length} Milestones
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCluster(null)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Events List */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
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
                          <img src={ev.photoUrl} alt={ev.personName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{ev.personName.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{ev.personName}</h4>
                        <p className="text-[11px] text-muted-foreground">{ev.description}</p>
                      </div>
                    </div>

                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize shrink-0 ${badgeColor}`}>
                      {ev.type}
                    </Badge>
                  </div>

                  {person && (
                    <div className="pt-1.5 border-t flex items-center justify-between text-xs">
                      <span className="text-[10px] text-muted-foreground">
                        {ev.year ? `Year: ${ev.year}` : ''}
                      </span>
                      <Button
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
