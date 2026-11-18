import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MASCOT_AGENTS, MascotAgent } from "../data/mascotsData";
import { Icon } from "./Icons";
import { DedaLogo } from "./DedaLogo";

interface ThreeMascotStudioProps {
  initialMascotId?: string;
  onOpenQuickInfo: (mascot: MascotAgent) => void;
  onTestPrompt: (skillId: string, promptText: string) => void;
}

export const ThreeMascotStudio: React.FC<ThreeMascotStudioProps> = ({
  initialMascotId = "carcara",
  onOpenQuickInfo,
  onTestPrompt,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeMascotId, setActiveMascotId] = useState<string>(initialMascotId);
  const [lightingPreset, setLightingPreset] = useState<"cyber" | "studio" | "neon" | "golden">("cyber");
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  // References to keep Three.js state across renders without re-initializing
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.HemisphereLight | null>(null);
  const accentLightRef = useRef<THREE.PointLight | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const mascotCardMeshRef = useRef<THREE.Mesh | null>(null);
  const companionGroupRef = useRef<THREE.Group | null>(null);
  const haloRingRef = useRef<THREE.Mesh | null>(null);

  const activeMascot = MASCOT_AGENTS.find((m) => m.id === activeMascotId) || MASCOT_AGENTS[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL safely
    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);
    scene.fog = new THREE.FogExp2(0x121212, 0.05);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 5.0);
    cameraRef.current = camera;

    // 3. Renderer with Physical Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. PMREM Room Environment for PBR Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.2;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Do not go below floor
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // 6. Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.HemisphereLight(0xd9e2ec, 0x1a1a1a, 1.0);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const accentLight = new THREE.PointLight(activeMascot.mediaKit.dimension3D.accentLight, 3.5, 6);
    accentLight.position.set(-2, 1.8, -1);
    scene.add(accentLight);
    accentLightRef.current = accentLight;

    // 7. Procedural Ground & Pedestal Stage
    const stageGroup = new THREE.Group();

    // Floor Disk
    const floorGeo = new THREE.CircleGeometry(6, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x161616,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = !isSoftwareGl;
    stageGroup.add(floor);

    // Ground Grid Rings
    const ringGeo = new THREE.RingGeometry(1.6, 1.63, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.005;
    stageGroup.add(ringMesh);

    // Raised Circular Pedestal Podium
    const podiumGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.25, 48);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.35,
      metalness: 0.8,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = 0.125;
    podium.receiveShadow = !isSoftwareGl;
    podium.castShadow = !isSoftwareGl;
    stageGroup.add(podium);

    // Glowing Holographic Stage Rim
    const haloGeo = new THREE.TorusGeometry(1.42, 0.03, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: activeMascot.mediaKit.dimension3D.haloColor,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    haloMesh.position.y = 0.255;
    stageGroup.add(haloMesh);
    haloRingRef.current = haloMesh;

    scene.add(stageGroup);

    // 8. 3D Floating Dimensional Card for Mascot
    const textureLoader = new THREE.TextureLoader();
    const mascotTexture = textureLoader.load(activeMascot.avatar);
    mascotTexture.colorSpace = THREE.SRGBColorSpace;
    mascotTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Box Frame Geometry
    const cardGeo = new THREE.BoxGeometry(1.5, 1.8, 0.06);

    // Materials: side/back metallic dark, front with high-res mascot texture
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.25,
      metalness: 0.9,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: mascotTexture,
      roughness: 0.3,
      metalness: 0.1,
    });
    const cardMats = [
      edgeMat, // Right
      edgeMat, // Left
      edgeMat, // Top
      edgeMat, // Bottom
      faceMat, // Front
      edgeMat, // Back
    ];

    const mascotCard = new THREE.Mesh(cardGeo, cardMats);
    mascotCard.position.set(0, 1.35, 0);
    mascotCard.castShadow = !isSoftwareGl;
    scene.add(mascotCard);
    mascotCardMeshRef.current = mascotCard;

    // Contact Shadow Plane beneath card
    const shadowGeo = new THREE.PlaneGeometry(1.6, 0.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.26;
    scene.add(shadowPlane);

    // 9. Floating 3D Companion Shape for Mascot (Composite 3D Model Elements)
    const companionGroup = new THREE.Group();
    companionGroup.position.set(0.95, 1.7, 0.2);

    // Decorative 3D polyhedral core
    const coreGeo = new THREE.IcosahedronGeometry(0.22, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: activeMascot.mediaKit.dimension3D.haloColor,
      roughness: 0.2,
      metalness: 0.85,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    companionGroup.add(coreMesh);

    // Orbiting mini ring
    const miniRingGeo = new THREE.TorusGeometry(0.36, 0.015, 16, 32);
    const miniRingMat = new THREE.MeshBasicMaterial({
      color: activeMascot.mediaKit.dimension3D.haloColor,
    });
    const miniRing = new THREE.Mesh(miniRingGeo, miniRingMat);
    companionGroup.add(miniRing);

    scene.add(companionGroup);
    companionGroupRef.current = companionGroup;

    // 10. Floating Particle Constellation
    const particleCount = 140;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 5;
      particlePositions[i + 1] = Math.random() * 3.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 5;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: activeMascot.mediaKit.dimension3D.particleColor,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 11. Animation Loop with Pacing for Software WebGL
    let frameId = 0;
    let clock = new THREE.Clock();

    function renderFrame() {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Gentle floating animation of mascot card
      if (mascotCardMeshRef.current) {
        mascotCardMeshRef.current.position.y = 1.35 + Math.sin(time * 1.6) * 0.06;
        mascotCardMeshRef.current.rotation.y = Math.sin(time * 0.8) * 0.08;
      }

      // Companion 3D element rotation
      if (companionGroupRef.current) {
        companionGroupRef.current.rotation.y += delta * 0.8;
        companionGroupRef.current.rotation.x += delta * 0.4;
        companionGroupRef.current.position.y = 1.7 + Math.sin(time * 2.0) * 0.08;
      }

      // Particle subtle drifting
      if (particlesRef.current) {
        particlesRef.current.rotation.y = time * 0.04;
      }

      // Auto rotation
      if (isAutoRotating && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.2;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      controls.update();
      renderer.render(scene, camera);
    }

    function tick() {
      renderFrame();
      frameId = requestAnimationFrame(tick);
    }

    tick();

    // 12. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      stageGroup.clear();
      scene.clear();
    };
  }, []);

  // Update Three.js scene when active mascot changes
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    // Load new texture
    const textureLoader = new THREE.TextureLoader();
    const newTex = textureLoader.load(activeMascot.avatar);
    newTex.colorSpace = THREE.SRGBColorSpace;
    newTex.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();

    if (mascotCardMeshRef.current) {
      const mats = mascotCardMeshRef.current.material as THREE.Material[];
      if (Array.isArray(mats) && mats[4]) {
        (mats[4] as THREE.MeshStandardMaterial).map = newTex;
        (mats[4] as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    }

    // Update accent light and halo color
    if (accentLightRef.current) {
      accentLightRef.current.color.setHex(activeMascot.mediaKit.dimension3D.accentLight);
    }
    if (haloRingRef.current) {
      (haloRingRef.current.material as THREE.MeshBasicMaterial).color.setHex(
        activeMascot.mediaKit.dimension3D.haloColor
      );
    }
    if (particlesRef.current) {
      (particlesRef.current.material as THREE.PointsMaterial).color.setHex(
        activeMascot.mediaKit.dimension3D.particleColor
      );
    }
    if (companionGroupRef.current) {
      companionGroupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.Material & { color: THREE.Color }).color.setHex(
            activeMascot.mediaKit.dimension3D.haloColor
          );
        }
      });
    }
  }, [activeMascotId, activeMascot]);

  // Update lighting preset
  useEffect(() => {
    if (!keyLightRef.current || !fillLightRef.current || !rendererRef.current) return;

    switch (lightingPreset) {
      case "cyber":
        keyLightRef.current.color.setHex(0xd0e8ff);
        keyLightRef.current.intensity = 2.4;
        fillLightRef.current.color.setHex(0x223344);
        rendererRef.current.toneMappingExposure = 1.2;
        break;
      case "studio":
        keyLightRef.current.color.setHex(0xffffff);
        keyLightRef.current.intensity = 2.0;
        fillLightRef.current.color.setHex(0xffffff);
        rendererRef.current.toneMappingExposure = 1.05;
        break;
      case "neon":
        keyLightRef.current.color.setHex(0xff007f);
        keyLightRef.current.intensity = 3.0;
        fillLightRef.current.color.setHex(0x00ffff);
        rendererRef.current.toneMappingExposure = 1.35;
        break;
      case "golden":
        keyLightRef.current.color.setHex(0xffaa44);
        keyLightRef.current.intensity = 2.8;
        fillLightRef.current.color.setHex(0x663311);
        rendererRef.current.toneMappingExposure = 1.15;
        break;
    }
  }, [lightingPreset]);

  // Update wireframe mode
  useEffect(() => {
    if (mascotCardMeshRef.current) {
      const mats = mascotCardMeshRef.current.material as THREE.Material[];
      if (Array.isArray(mats)) {
        mats.forEach((m) => {
          (m as THREE.MeshStandardMaterial).wireframe = isWireframe;
        });
      }
    }
  }, [isWireframe]);

  // Camera preset transitions
  const setCameraView = (view: "front" | "iso" | "closeup" | "top") => {
    if (!cameraRef.current || !controlsRef.current) return;

    switch (view) {
      case "front":
        cameraRef.current.position.set(0, 1.4, 4.2);
        controlsRef.current.target.set(0, 1.35, 0);
        break;
      case "iso":
        cameraRef.current.position.set(2.8, 2.4, 3.2);
        controlsRef.current.target.set(0, 1.2, 0);
        break;
      case "closeup":
        cameraRef.current.position.set(0, 1.45, 2.4);
        controlsRef.current.target.set(0, 1.4, 0);
        break;
      case "top":
        cameraRef.current.position.set(0, 4.8, 1.5);
        controlsRef.current.target.set(0, 0.5, 0);
        break;
    }
    controlsRef.current.update();
  };

  // High-Resolution 3D Snapshot Downloader
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Render cleanly for buffer capture
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `deda-skills-3d-${activeMascot.id}-snapshot.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 2400);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#383129] bg-[#191613] shadow-2xl select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-[540px] sm:h-[600px] cursor-grab active:cursor-grabbing"
      />

      {/* Top Header Badge Overlay */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2.5 bg-[#24201D]/90 border border-[#483E34] px-3 py-2 rounded-xl backdrop-blur-md pointer-events-auto shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center">
            <DedaLogo size={18} color="#D97757" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F5F2EB]">{activeMascot.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#32231C] border border-[#D97757]/40 text-[#E28768]">
                {activeMascot.nickname}
              </span>
            </div>
            <div className="text-[10px] text-[#A39889]">{activeMascot.title} • WebGL PBR</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <a
            href={activeMascot.mediaKit.objPath}
            download={`deda-mascote-${activeMascot.id}.obj`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#E28768] text-xs font-bold border border-[#483E34] transition-all shadow-md cursor-pointer active:scale-95"
            title="Baixar arquivo 3D Wavefront .OBJ"
          >
            <Icon n="cube" size={13} />
            <span className="hidden sm:inline">Baixar .OBJ</span>
          </a>

          <button
            type="button"
            onClick={handleCaptureSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] text-xs font-bold border border-[#483E34] transition-all shadow-md cursor-pointer active:scale-95"
            title="Capturar foto PNG da cena 3D atual"
          >
            <Icon n="download" size={13} />
            <span className="hidden sm:inline">
              {snapshotTaken ? "Foto Salva!" : "Capturar Foto 3D"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickInfo(activeMascot)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Icon n="zap" size={13} />
            <span>Ver Estilo</span>
          </button>
        </div>
      </div>

      {/* Mascot Switcher Pills */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#24201D]/90 border border-[#483E34] p-1.5 rounded-2xl shadow-xl pointer-events-auto max-w-[92%] overflow-x-auto">
        {MASCOT_AGENTS.map((m) => {
          const isSelected = m.id === activeMascotId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMascotId(m.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-[#D97757] text-white shadow-md"
                  : "bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] hover:bg-[#332C26]"
              }`}
            >
              <img
                src={m.avatar}
                alt={m.name}
                className="w-5 h-5 rounded-full object-cover border border-[#483E34]"
              />
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Unified Bottom Control Dock */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl pointer-events-auto transition-transform duration-300">
        {/* Collapse / Expand Toggle Button */}
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="px-3 py-1 rounded-full bg-[#24201D] border border-[#483E34] hover:border-[#D97757]/60 text-[11px] font-semibold text-[#D4CDC3] hover:text-[#F5F2EB] transition-colors cursor-pointer shadow-md flex items-center gap-1"
          >
            <Icon n="chevron" size={12} className={isHudCollapsed ? "rotate-180" : ""} />
            <span>{isHudCollapsed ? "Mostrar Controles 3D" : "Ocultar Controles"}</span>
          </button>
        </div>

        {/* The Dock Card */}
        {!isHudCollapsed && (
          <div className="bg-[#24201D]/95 border border-[#383129] rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs">
              {/* Lighting Presets */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A39889] block mb-1.5">
                  Iluminação do Estúdio
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {(["cyber", "studio", "neon", "golden"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLightingPreset(preset)}
                      className={`py-1 px-1.5 rounded-lg text-[10.5px] font-semibold capitalize transition-all cursor-pointer truncate ${
                        lightingPreset === preset
                          ? "bg-[#32231C] text-[#F5F2EB] border border-[#D97757]/60"
                          : "bg-[#1E1A17] text-[#A39889] hover:text-[#F5F2EB]"
                      }`}
                    >
                      {preset === "cyber" ? "Cyber" : preset === "studio" ? "Studio" : preset === "neon" ? "Neon" : "Sertão"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Angle Presets */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A39889] block mb-1.5">
                  Ângulo da Câmera
                </span>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setCameraView("front")}
                    className="py-1 px-1 rounded-lg text-[10.5px] font-semibold bg-[#1E1A17] hover:bg-[#2A241F] text-[#D4CDC3] text-center cursor-pointer truncate"
                  >
                    Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraView("iso")}
                    className="py-1 px-1 rounded-lg text-[10.5px] font-semibold bg-[#1E1A17] hover:bg-[#2A241F] text-[#D4CDC3] text-center cursor-pointer truncate"
                  >
                    3/4 Iso
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraView("closeup")}
                    className="py-1 px-1 rounded-lg text-[10.5px] font-semibold bg-[#1E1A17] hover:bg-[#2A241F] text-[#D4CDC3] text-center cursor-pointer truncate"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraView("top")}
                    className="py-1 px-1 rounded-lg text-[10.5px] font-semibold bg-[#1E1A17] hover:bg-[#2A241F] text-[#D4CDC3] text-center cursor-pointer truncate"
                  >
                    Topo
                  </button>
                </div>
              </div>

              {/* Viewport Toggles & Quick Actions */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A39889] block mb-1.5">
                  Interatividade & Modo
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAutoRotating(!isAutoRotating)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                      isAutoRotating
                        ? "bg-[#32231C] text-[#E28768] border border-[#D97757]/50"
                        : "bg-[#1E1A17] text-[#A39889]"
                    }`}
                  >
                    {isAutoRotating ? "Auto-Giro: Ligado" : "Auto-Giro: Pausado"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWireframe(!isWireframe)}
                    className={`py-1 px-2.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                      isWireframe
                        ? "bg-[#32231C] text-[#FFD700] border border-[#FFD700]/40"
                        : "bg-[#1E1A17] text-[#A39889]"
                    }`}
                    title="Alternar modo Wireframe / PBR"
                  >
                    Wireframe
                  </button>

                  <button
                    type="button"
                    onClick={() => onTestPrompt(activeMascot.suggestedSkillId, activeMascot.samplePrompts[0])}
                    className="py-1 px-3 rounded-lg bg-[#D97757] hover:bg-[#E28768] text-white text-[10.5px] font-bold transition-all shadow-sm cursor-pointer shrink-0"
                    title="Testar prompt do mascote"
                  >
                    Testar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
