import { useEffect, useRef, useState } from "react";
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { Environment, Grid, Html, OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface ViewerAnchor {
  id: string;
  label: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface ViewerBridgeProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  initialCameraRef: React.RefObject<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>;
}

function ViewerBridge({ controlsRef, initialCameraRef }: ViewerBridgeProps) {
  const { camera } = useThree();

  useEffect(() => {
    const initial = initialCameraRef.current;
    const controls = controlsRef.current;
    if (!initial || !controls) return;
    camera.position.copy(initial.position);
    controls.target.copy(initial.target);
    controls.update();
  }, [camera, controlsRef, initialCameraRef]);

  return null;
}

function SceneContent({
  sceneObject,
  anchors,
  selectedAnchorId,
  onSelectAnchor,
}: {
  sceneObject: THREE.Object3D | null;
  anchors: ViewerAnchor[];
  selectedAnchorId: string | null;
  onSelectAnchor: (anchorId: string | null) => void;
}) {
  const rootRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const initialCameraRef = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!sceneObject || !rootRef.current) return;

    const bounds = new THREE.Box3().setFromObject(sceneObject);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z, 1);
    const distance = maxSize * 1.9;
    const nextPosition = center
      .clone()
      .add(new THREE.Vector3(distance, distance * 0.8, distance));

    camera.position.copy(nextPosition);
    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }

    initialCameraRef.current = {
      position: nextPosition.clone(),
      target: center.clone(),
    };
  }, [camera, sceneObject]);

  const handleSceneClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelectAnchor(null);
  };

  return (
    <>
      <ViewerBridge controlsRef={controlsRef} initialCameraRef={initialCameraRef} />
      <Environment preset="city" />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 8, 6]} intensity={1.3} castShadow />
      <Grid
        args={[12, 12]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#d6d3d1"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#a8a29e"
        fadeDistance={18}
        fadeStrength={1}
        infiniteGrid
      />
      <group ref={rootRef}>
        {sceneObject ? <primitive object={sceneObject} onClick={handleSceneClick} /> : null}
        {anchors.map((anchor) => (
          <mesh
            key={anchor.id}
            position={[anchor.position.x, anchor.position.y, anchor.position.z]}
            onClick={(event) => {
              event.stopPropagation();
              onSelectAnchor(anchor.id);
            }}
          >
            <sphereGeometry args={[0.06, 20, 20]} />
            <meshStandardMaterial
              color={anchor.id === selectedAnchorId ? "#ef4444" : "#2563eb"}
              emissive={anchor.id === selectedAnchorId ? "#7f1d1d" : "#1d4ed8"}
              emissiveIntensity={0.4}
            />
            <Html distanceFactor={10}>
              <div
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-semibold text-white shadow-sm",
                  anchor.id === selectedAnchorId ? "bg-red-500" : "bg-slate-900/80",
                )}
              >
                {anchor.label}
              </div>
            </Html>
          </mesh>
        ))}
      </group>
      <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate makeDefault />
    </>
  );
}

export function ReadonlyARPuzzleViewer({
  modelUrl,
  anchors,
  selectedAnchorId,
  onSelectAnchor,
}: {
  modelUrl: string;
  anchors: ViewerAnchor[];
  selectedAnchorId: string | null;
  onSelectAnchor: (anchorId: string | null) => void;
}) {
  const [sceneObject, setSceneObject] = useState<THREE.Object3D | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!modelUrl) return;

    let isActive = true;
    const loader = new GLTFLoader();
    queueMicrotask(() => {
      if (!isActive) return;
      setSceneObject(null);
      setLoadError("");
      setIsLoading(true);
    });

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isActive) return;
        const nextScene = (gltf.scene || gltf.scenes?.[0])?.clone(true) ?? null;
        if (!nextScene) {
          setLoadError("The model did not contain a renderable scene.");
          setSceneObject(null);
          setIsLoading(false);
          return;
        }
        setSceneObject(nextScene);
        setIsLoading(false);
      },
      undefined,
      () => {
        if (!isActive) return;
        setLoadError("The model could not be loaded. Confirm the file is a valid .glb.");
        setSceneObject(null);
        setIsLoading(false);
      },
    );

    return () => {
      isActive = false;
    };
  }, [modelUrl]);

  if (!modelUrl) {
    return (
      <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border bg-[#efe9dd]">
        <div className="absolute inset-0 flex items-center justify-center bg-[#efe9dd]/95 px-6 text-center text-sm text-slate-600">
          No AR model URL available for this puzzle.
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border bg-[#efe9dd]">
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => onSelectAnchor(null)}
      >
        <color attach="background" args={["#efe9dd"]} />
        <SceneContent
          sceneObject={sceneObject}
          anchors={anchors}
          selectedAnchorId={selectedAnchorId}
          onSelectAnchor={onSelectAnchor}
        />
      </Canvas>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#efe9dd]/80 text-sm font-medium text-slate-700">
          Loading model…
        </div>
      ) : null}
      {loadError ? (
        <div className="absolute inset-x-4 bottom-4 rounded-xl border border-red-200 bg-white/95 px-4 py-3 text-sm text-red-600 shadow-sm">
          {loadError}
        </div>
      ) : null}
    </div>
  );
}

