'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TreeData, Person } from '@/types/tree';
import { layoutFamilyTree3D, Node3D } from '@/lib/layout-3d';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, Pause, ZoomIn, ZoomOut, HelpCircle, Layers } from 'lucide-react';

type TreeOrbit3DProps = {
  treeData: TreeData;
  onPersonClick: (person: Person) => void;
  selectedPersonId?: string | null;
};

export default function TreeOrbit3D({
  treeData,
  onPersonClick,
  selectedPersonId,
}: TreeOrbit3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const [isAutoSpin, setIsAutoSpin] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [activeRelative, setActiveRelative] = useState<Person | null>(null);

  // References to three objects for runtime control
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const reqIdRef = useRef<number | null>(null);

  // Keep state ref for animation loop
  const isAutoSpinRef = useRef(isAutoSpin);
  useEffect(() => {
    isAutoSpinRef.current = isAutoSpin;
  }, [isAutoSpin]);

  // Layout calculations
  const layout = React.useMemo(() => {
    return layoutFamilyTree3D(treeData.people, treeData.relationships);
  }, [treeData.people, treeData.relationships]);

  // Texture generator for person node billboard
  const createPersonTexture = useCallback((node: Node3D, isDark: boolean): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const centerX = 128;
    const centerY = 110;
    const avatarRadius = 60;

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius + 6, 0, Math.PI * 2);
    ctx.fillStyle = node.isDeceased 
      ? (isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)')
      : (isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(14, 165, 233, 0.6)');
    ctx.fill();

    // Node circular border
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = node.isDeceased
      ? (isDark ? '#334155' : '#64748b')
      : (isDark ? '#0284c7' : '#0369a1');
    ctx.fill();

    // Inner avatar fill
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius - 4, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fill();

    // Initials text
    const initials = `${node.person.firstName?.[0] || ''}${node.person.lastName?.[0] || ''}`;
    ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, centerX, centerY);

    // Deceased mark
    if (node.isDeceased) {
      ctx.font = '22px system-ui';
      ctx.fillText('🪦', centerX + 40, centerY - 40);
    }

    // Name Label (Pill background)
    const displayName = `${node.person.firstName} ${node.person.lastName || ''}`.trim();
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(displayName).width;
    const pillWidth = Math.max(textWidth + 24, 110);
    const pillHeight = 36;
    const pillY = 195;

    // Draw pill background
    ctx.beginPath();
    ctx.roundRect(centerX - pillWidth / 2, pillY, pillWidth, pillHeight, 18);
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)';
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw name
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName, centerX, pillY + pillHeight / 2);

    // Birth Year badge if available
    if (node.person.birthDate) {
      const year = node.person.birthDate.split('-')[0];
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.fillText(`b. ${year}`, centerX, 246);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isDark = resolvedTheme === 'dark';
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isDark ? 0x090d16 : 0xf1f5f9);

    // Subtle starfield/cosmic particles for holographic atmosphere
    const starsCount = isDark ? 280 : 120;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 1600;
      starPos[i + 1] = (Math.random() - 0.5) * 1200;
      starPos[i + 2] = (Math.random() - 0.5) * 1600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: isDark ? 0x93c5fd : 0x94a3b8,
      size: isDark ? 2.5 : 2.0,
      transparent: true,
      opacity: isDark ? 0.45 : 0.25,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 10, 3000);
    cameraRef.current = camera;
    // Position camera at an elevated 3/4 orbital angle
    const camDist = Math.max(layout.bounds.maxRadius * 2.2, 550);
    camera.position.set(0, camDist * 0.45, camDist);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 1800;
    controls.minDistance = 90;
    controls.target.set(0, 0, 0);
    // Touch controls: 1-finger rotate, 2-finger pinch zoom & pan
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(200, 400, 300);
    scene.add(dirLight);

    // Center holographic beacon light
    const centerPointLight = new THREE.PointLight(isDark ? 0x38bdf8 : 0x0284c7, 1.2, 1200);
    centerPointLight.position.set(0, 0, 0);
    scene.add(centerPointLight);

    // 6. Generational Rings (Concentric holographic orbital guide rings)
    const Y_STEP = 110;
    const BASE_RADIUS = 190;
    const RADIUS_GROWTH = 32;
    const yOffset = (layout.maxGen * Y_STEP) / 2;

    for (let g = 0; g <= layout.maxGen; g++) {
      const ringR = BASE_RADIUS + g * RADIUS_GROWTH;
      const y = yOffset - g * Y_STEP;

      const ringGeo = new THREE.RingGeometry(ringR - 1.2, ringR + 1.2, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x38bdf8 : 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isDark ? 0.16 : 0.12,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = y;
      scene.add(ringMesh);
    }

    // 7. Render 3D Nodes (Relative Billboards)
    const nodesMap = new Map<string, THREE.Object3D>();
    nodesMapRef.current = nodesMap;

    layout.nodes.forEach(node => {
      const texture = createPersonTexture(node, isDark);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });

      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(...node.position);
      sprite.scale.set(48, 48, 1);
      sprite.userData = { personId: node.id, person: node.person };

      scene.add(sprite);
      nodesMap.set(node.id, sprite);

      // Subtle vertical beacon line anchoring node to its orbital ring
      const beaconGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(node.position[0], node.position[1], node.position[2]),
        new THREE.Vector3(node.position[0], node.position[1] - 12, node.position[2]),
      ]);
      const beaconMat = new THREE.LineBasicMaterial({
        color: node.isDeceased ? 0x94a3b8 : 0x38bdf8,
        transparent: true,
        opacity: 0.35,
      });
      const beacon = new THREE.Line(beaconGeo, beaconMat);
      scene.add(beacon);
    });

    // 8. Render 3D Curved Edges
    layout.edges.forEach(edge => {
      const pts = edge.points.map(p => new THREE.Vector3(...p));
      const curveGeo = new THREE.BufferGeometry().setFromPoints(pts);

      let lineMat: THREE.LineBasicMaterial;
      if (edge.isDashed) {
        lineMat = new THREE.LineDashedMaterial({
          color: new THREE.Color(edge.color),
          transparent: true,
          opacity: 0.8,
          dashSize: 6,
          gapSize: 3,
        });
        const line = new THREE.Line(curveGeo, lineMat);
        line.computeLineDistances();
        scene.add(line);
      } else {
        lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(edge.color),
          transparent: true,
          opacity: 0.75,
        });
        const line = new THREE.Line(curveGeo, lineMat);
        scene.add(line);
      }
    });

    // 9. Raycasting for Touch & Tap Selection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let touchStartX = 0;
    let touchStartY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      touchStartX = e.clientX;
      touchStartY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      // Ignore if user was dragging or orbiting the camera
      const dist = Math.hypot(e.clientX - touchStartX, e.clientY - touchStartY);
      if (dist > 7) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const sprites = Array.from(nodesMap.values());
      const intersects = raycaster.intersectObjects(sprites, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const person = hit.userData.person as Person;
        if (person) {
          setActiveRelative(person);
          onPersonClick(person);

          // Smoothly look slightly towards the clicked person
          controls.target.lerp(hit.position, 0.4);
          setIsAutoSpin(false);
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointerup', handlePointerUp);

    // 10. Animation Loop
    function animate() {
      reqIdRef.current = requestAnimationFrame(animate);

      if (isAutoSpinRef.current) {
        // Slow holographic rotation
        scene.rotation.y += 0.0025;
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointerup', handlePointerUp);

      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      if (container) container.innerHTML = '';
    };
  }, [layout, resolvedTheme, createPersonTexture, onPersonClick]);

  // Handle selectedPersonId focus
  useEffect(() => {
    if (!selectedPersonId || !controlsRef.current || !cameraRef.current) return;
    const targetObj = nodesMapRef.current.get(selectedPersonId);
    if (targetObj) {
      controlsRef.current.target.copy(targetObj.position);
      setIsAutoSpin(false);
    }
  }, [selectedPersonId]);

  // Controls Actions
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camDist = Math.max(layout.bounds.maxRadius * 2.2, 550);
    cameraRef.current.position.set(0, camDist * 0.45, camDist);
    controlsRef.current.target.set(0, 0, 0);
    if (sceneRef.current) sceneRef.current.rotation.y = 0;
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    cameraRef.current.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-background">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Floating 3D Navigation Controls (Left Bottom) */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 flex flex-col gap-1.5 shadow-lg rounded-xl overflow-hidden border bg-background/90 backdrop-blur-md p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleZoom('in')}
          className="h-8 w-8 p-0 text-foreground hover:bg-muted"
          title="Zoom in 3D"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="h-px w-full bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleZoom('out')}
          className="h-8 w-8 p-0 text-foreground hover:bg-muted"
          title="Zoom out 3D"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="h-px w-full bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetCamera}
          className="h-8 w-8 p-0 text-foreground hover:bg-muted"
          title="Reset 3D camera vantage point"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Floating Orbit Toolbar (Right Corner) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAutoSpin(!isAutoSpin)}
          className={`h-8 px-2.5 sm:px-3 text-xs gap-1.5 rounded-full font-medium shadow-md backdrop-blur-md transition-all ${
            isAutoSpin
              ? 'bg-primary/15 text-primary border-primary/40'
              : 'bg-background/90 text-foreground border-border'
          }`}
          title={isAutoSpin ? 'Pause auto-rotation' : 'Start auto-rotation'}
        >
          {isAutoSpin ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{isAutoSpin ? 'Orbiting' : 'Orbit'}</span>
        </Button>
      </div>

      {/* Touch Gestures Guide Pill (Mobile & Desktop) */}
      {showHint && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 text-muted-foreground border border-border shadow-lg backdrop-blur-md text-xs select-none animate-in fade-in-0 duration-300">
          <span className="text-[11px] sm:text-xs">
            🪐 1-finger swipe to orbit • Pinch to zoom • Tap node to view
          </span>
          <button
            onClick={() => setShowHint(false)}
            className="hover:text-foreground text-xs opacity-70 hover:opacity-100 transition-opacity ml-1"
            title="Dismiss hint"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
