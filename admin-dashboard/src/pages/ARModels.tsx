import { useEffect, useRef, useState } from "react";
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { Environment, Grid, Html, OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Cuboid,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import * as THREE from "three";
import {
  createARModel,
  deleteARModel,
  getARModel,
  listARModels,
  updateARModel,
  type AnchorDraft,
  type CatalogModel,
} from "@/api/arModels";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface EditorState {
  id: number | null;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  anchors: AnchorDraft[];
  sceneAssetUrl: string;
  previewImageUrl: string;
  sceneAssetFile: File | null;
  previewImageFile: File | null;
}

interface ViewerControls {
  capture: () => Promise<Blob>;
  resetCamera: () => void;
}

interface CaptureCandidate {
  blob: Blob;
  dataUrl: string;
}

const EMPTY_EDITOR: EditorState = {
  id: null,
  name: "",
  slug: "",
  isActive: true,
  sortOrder: 0,
  anchors: [],
  sceneAssetUrl: "",
  previewImageUrl: "",
  sceneAssetFile: null,
  previewImageFile: null,
};

function normalizeAnchors(anchors: AnchorDraft[]) {
  return anchors.map((anchor, index) => ({
    ...anchor,
    order: index,
  }));
}

function buildEditorState(model: CatalogModel): EditorState {
  return {
    id: model.id,
    name: model.name,
    slug: model.slug,
    isActive: model.is_active,
    sortOrder: model.sort_order,
    anchors: normalizeAnchors(model.anchors ?? []),
    sceneAssetUrl: model.scene_asset_url,
    previewImageUrl: model.preview_image_url,
    sceneAssetFile: null,
    previewImageFile: null,
  };
}

function createAnchorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `anchor-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `anchor-${Date.now()}`;
}

function createPreviewFile(blob: Blob) {
  return new File([blob], `ar-model-preview-${Date.now()}.png`, {
    type: blob.type || "image/png",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

async function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to capture preview image."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read preview image."));
    reader.readAsDataURL(blob);
  });
}

async function waitForNextFrame(frameCount = 1) {
  for (let index = 0; index < frameCount; index += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

function ViewerBridge({
  onReady,
  controlsRef,
  initialCameraRef,
}: {
  onReady: (controls: ViewerControls | null) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  initialCameraRef: React.RefObject<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>;
}) {
  const { camera, gl } = useThree();

  useEffect(() => {
    onReady({
      capture: async () => canvasToBlob(gl.domElement),
      resetCamera: () => {
        const initial = initialCameraRef.current;
        const controls = controlsRef.current;
        if (!initial || !controls) {
          return;
        }

        camera.position.copy(initial.position);
        controls.target.copy(initial.target);
        controls.update();
      },
    });

    return () => onReady(null);
  }, [camera, gl, initialCameraRef, onReady, controlsRef]);

  return null;
}

function SceneContent({
  sceneObject,
  anchors,
  showOverlays,
  selectedAnchorId,
  onSelectAnchor,
  onAddAnchor,
  onReady,
}: {
  sceneObject: THREE.Object3D | null;
  anchors: AnchorDraft[];
  showOverlays: boolean;
  selectedAnchorId: string | null;
  onSelectAnchor: (anchorId: string | null) => void;
  onAddAnchor: (position: AnchorDraft["position"], normal: AnchorDraft["normal"]) => void;
  onReady: (controls: ViewerControls | null) => void;
}) {
  const rootRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const initialCameraRef = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!sceneObject || !rootRef.current) {
      return;
    }

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
    if (!rootRef.current) {
      return;
    }

    event.stopPropagation();

    const localPoint = rootRef.current.worldToLocal(event.point.clone());
    const localNormal = event.face?.normal
      ? event.face.normal.clone().transformDirection(event.object.matrixWorld)
      : null;

    onAddAnchor(
      {
        x: localPoint.x,
        y: localPoint.y,
        z: localPoint.z,
      },
      localNormal
        ? {
            x: localNormal.x,
            y: localNormal.y,
            z: localNormal.z,
          }
        : null,
    );
  };

  return (
    <>
      <ViewerBridge
        onReady={onReady}
        controlsRef={controlsRef}
        initialCameraRef={initialCameraRef}
      />
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
        {sceneObject ? (
          <primitive object={sceneObject} onClick={handleSceneClick} />
        ) : null}
        {showOverlays
          ? anchors.map((anchor) => (
          <mesh
            key={anchor.id}
            position={[
              anchor.position.x,
              anchor.position.y,
              anchor.position.z,
            ]}
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
            ))
          : null}
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        makeDefault
      />
    </>
  );
}

function ModelViewer({
  modelUrl,
  anchors,
  showOverlays,
  selectedAnchorId,
  onSelectAnchor,
  onAddAnchor,
  onReady,
}: {
  modelUrl: string;
  anchors: AnchorDraft[];
  showOverlays: boolean;
  selectedAnchorId: string | null;
  onSelectAnchor: (anchorId: string | null) => void;
  onAddAnchor: (position: AnchorDraft["position"], normal: AnchorDraft["normal"]) => void;
  onReady: (controls: ViewerControls | null) => void;
}) {
  const [sceneObject, setSceneObject] = useState<THREE.Object3D | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!modelUrl) {
      return;
    }

    let isActive = true;
    const loader = new GLTFLoader();

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }
      setSceneObject(null);
      setLoadError("");
      setIsLoading(true);
    });

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isActive) {
          return;
        }

        const nextScene = (gltf.scene || gltf.scenes?.[0])?.clone(true) ?? null;
        if (!nextScene) {
          setLoadError("The uploaded model did not contain a renderable scene.");
          setSceneObject(null);
          setIsLoading(false);
          return;
        }

        setSceneObject(nextScene);
        setIsLoading(false);
      },
      undefined,
      () => {
        if (!isActive) {
          return;
        }
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
      <div className="relative h-[440px] overflow-hidden rounded-2xl border border-border bg-[#efe9dd]">
        <div className="absolute inset-0 flex items-center justify-center bg-[#efe9dd]/95 px-6 text-center text-sm text-slate-600">
          Upload a `.glb` to inspect it, place anchors, and capture a preview.
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[440px] overflow-hidden rounded-2xl border border-border bg-[#efe9dd]">
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onPointerMissed={() => onSelectAnchor(null)}
      >
        <color attach="background" args={["#efe9dd"]} />
        <SceneContent
          sceneObject={sceneObject}
          anchors={anchors}
          showOverlays={showOverlays}
          selectedAnchorId={selectedAnchorId}
          onSelectAnchor={onSelectAnchor}
          onAddAnchor={onAddAnchor}
          onReady={onReady}
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

      {showOverlays ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
          Click the mesh to add an anchor
        </div>
      ) : null}
    </div>
  );
}

export default function ARModels() {
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [viewerControls, setViewerControls] = useState<ViewerControls | null>(null);
  const [captureCandidate, setCaptureCandidate] = useState<CaptureCandidate | null>(
    null,
  );
  const [viewerOverlaysVisible, setViewerOverlaysVisible] = useState(true);
  const [sceneObjectUrl, setSceneObjectUrl] = useState("");
  const [previewObjectUrl, setPreviewObjectUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentModelUrl = sceneObjectUrl || editor.sceneAssetUrl;
  const currentPreviewUrl = previewObjectUrl || editor.previewImageUrl;
  const selectedListModel =
    editor.id !== null ? models.find((item) => item.id === editor.id) ?? null : null;

  useEffect(() => {
    let active = true;

    async function fetchInitialCatalog() {
      setLoading(true);
      setError("");

      try {
        const { data } = await listARModels();
        const results = data.results ?? data;
        if (!active) {
          return;
        }

        setModels(results);

        if (results.length > 0) {
          const firstModel = results[0];
          setEditor(buildEditorState(firstModel));
          setSelectedAnchorId(firstModel.anchors?.[0]?.id ?? null);
        }
      } catch {
        if (active) {
          setError("Unable to load the AR model catalog.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchInitialCatalog();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!editor.sceneAssetFile) {
      setSceneObjectUrl("");
      return;
    }

    const url = URL.createObjectURL(editor.sceneAssetFile);
    setSceneObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editor.sceneAssetFile]);

  useEffect(() => {
    if (!editor.previewImageFile) {
      setPreviewObjectUrl("");
      return;
    }

    const url = URL.createObjectURL(editor.previewImageFile);
    setPreviewObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editor.previewImageFile]);

  async function loadModel(id: number) {
    setLoading(true);
    setError("");

    try {
      const { data } = await getARModel(id);
      setEditor(buildEditorState(data));
      setSelectedAnchorId(data.anchors?.[0]?.id ?? null);
    } catch {
      setError("Unable to load the selected model.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshCatalog(preferredId?: number | null) {
    const { data } = await listARModels();
    const results = data.results ?? data;
    setModels(results);

    if (preferredId) {
      const next = results.find((item: CatalogModel) => item.id === preferredId);
      if (next) {
        await loadModel(next.id);
        return;
      }
    }

    if (results.length > 0) {
      await loadModel(results[0].id);
      return;
    }

    setEditor(EMPTY_EDITOR);
    setSelectedAnchorId(null);
  }

  const updateEditor = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setEditor((prev) => ({ ...prev, [key]: value }));
  };

  const handleNewModel = () => {
    setEditor(EMPTY_EDITOR);
    setSelectedAnchorId(null);
    setError("");
    setCaptureCandidate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = async () => {
    setError("");
    setCaptureCandidate(null);

    if (editor.id) {
      await loadModel(editor.id);
      return;
    }

    setEditor(EMPTY_EDITOR);
    setSelectedAnchorId(null);
  };

  const handleSceneFileChange = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".glb")) {
      setError("Only `.glb` files are supported for AR model authoring.");
      return;
    }

    setError("");
    setEditor((prev) => ({
      ...prev,
      sceneAssetFile: file,
      sceneAssetUrl: "",
    }));
  };

  const handleAnchorAdd = (
    position: AnchorDraft["position"],
    normal: AnchorDraft["normal"],
  ) => {
    const nextIndex = editor.anchors.length + 1;
    const nextAnchor: AnchorDraft = {
      id: createAnchorId(),
      label: `Anchor ${nextIndex}`,
      position,
      normal,
      order: editor.anchors.length,
    };

    setEditor((prev) => ({
      ...prev,
      anchors: normalizeAnchors([...prev.anchors, nextAnchor]),
    }));
    setSelectedAnchorId(nextAnchor.id);
  };

  const selectedAnchor =
    editor.anchors.find((anchor) => anchor.id === selectedAnchorId) ?? null;

  const updateAnchor = (anchorId: string, nextLabel: string) => {
    setEditor((prev) => ({
      ...prev,
      anchors: prev.anchors.map((anchor) =>
        anchor.id === anchorId ? { ...anchor, label: nextLabel } : anchor,
      ),
    }));
  };

  const moveAnchor = (anchorId: string, direction: -1 | 1) => {
    const index = editor.anchors.findIndex((anchor) => anchor.id === anchorId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= editor.anchors.length) {
      return;
    }

    const nextAnchors = [...editor.anchors];
    const [anchor] = nextAnchors.splice(index, 1);
    nextAnchors.splice(targetIndex, 0, anchor);

    setEditor((prev) => ({
      ...prev,
      anchors: normalizeAnchors(nextAnchors),
    }));
  };

  const deleteAnchor = (anchorId: string) => {
    const nextAnchors = editor.anchors.filter((anchor) => anchor.id !== anchorId);
    setEditor((prev) => ({
      ...prev,
      anchors: normalizeAnchors(nextAnchors),
    }));
    setSelectedAnchorId(nextAnchors[0]?.id ?? null);
  };

  const handleCapturePreview = async () => {
    if (!viewerControls) {
      setError("Load a model before capturing a preview.");
      return;
    }

    try {
      setViewerOverlaysVisible(false);
      await waitForNextFrame(2);
      const blob = await viewerControls.capture();
      const dataUrl = await blobToDataUrl(blob);
      setCaptureCandidate({ blob, dataUrl });
      setError("");
    } catch {
      setViewerOverlaysVisible(true);
      setError("Unable to capture the current viewer frame.");
    }
  };

  const confirmCapture = () => {
    if (!captureCandidate) {
      return;
    }

    setEditor((prev) => ({
      ...prev,
      previewImageFile: createPreviewFile(captureCandidate.blob),
      previewImageUrl: "",
    }));
    setCaptureCandidate(null);
    setViewerOverlaysVisible(true);
  };

  const dismissCapture = () => {
    setCaptureCandidate(null);
    setViewerOverlaysVisible(true);
  };

  const validateBeforeSave = () => {
    if (!editor.name.trim()) {
      return "Name is required.";
    }
    if (!editor.slug.trim()) {
      return "Slug is required.";
    }
    if (!currentModelUrl) {
      return "A `.glb` file is required.";
    }
    if (editor.anchors.length === 0) {
      return "At least one anchor is required.";
    }
    if (!currentPreviewUrl) {
      return "Capture a preview image before saving.";
    }
    return "";
  };

  const handleSave = async () => {
    const validationError = validateBeforeSave();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: editor.name.trim(),
        slug: editor.slug.trim(),
        is_active: editor.isActive,
        sort_order: editor.sortOrder,
        anchors: normalizeAnchors(editor.anchors).map((anchor) => ({
          ...anchor,
          normal: anchor.normal ?? null,
        })),
        sceneAssetFile: editor.sceneAssetFile,
        previewImageFile: editor.previewImageFile,
      };

      if (editor.id) {
        await updateARModel(editor.id, payload);
        await refreshCatalog(editor.id);
      } else {
        const { data } = await createARModel(payload);
        await refreshCatalog(data.id);
      }
    } catch (saveError: unknown) {
      const detail =
        typeof saveError === "object" &&
        saveError &&
        "response" in saveError &&
        typeof saveError.response === "object" &&
        saveError.response &&
        "data" in saveError.response
          ? JSON.stringify(saveError.response.data)
          : "Unable to save the AR model.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editor.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${editor.name}" from the AR model catalog?`,
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await deleteARModel(editor.id);
      await refreshCatalog(null);
    } catch {
      setError("Unable to delete the selected model.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AR Models</h1>
          <p className="text-muted-foreground">
            Author `.glb` catalog items with backend-managed assets, preview captures,
            and mesh anchors.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleNewModel}>
            <Plus className="h-4 w-4" />
            New model
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button variant="secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          {editor.id ? (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <Card className="p-0">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold">Catalog</h2>
            <p className="text-sm text-muted-foreground">
              {models.length} saved model{models.length === 1 ? "" : "s"}
            </p>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : models.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No AR models yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => loadModel(model.id)}
                  className={cn(
                    "w-full px-6 py-4 text-left transition-colors hover:bg-muted/40",
                    editor.id === model.id && "bg-muted/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{model.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {model.slug}
                      </div>
                    </div>
                    <Badge variant={model.is_active ? "success" : "secondary"}>
                      {model.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>{model.anchor_count} anchors</span>
                    <span className="text-right">
                      {new Date(model.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <Input
                  value={editor.name}
                  onChange={(event) => updateEditor("name", event.target.value)}
                  placeholder="Bronze Statue"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Slug</span>
                <Input
                  value={editor.slug}
                  onChange={(event) => updateEditor("slug", event.target.value)}
                  placeholder="bronze-statue"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Sort Order</span>
                <Input
                  type="number"
                  value={editor.sortOrder}
                  onChange={(event) =>
                    updateEditor("sortOrder", Number(event.target.value) || 0)
                  }
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                <input
                  type="checkbox"
                  checked={editor.isActive}
                  onChange={(event) => updateEditor("isActive", event.target.checked)}
                />
                <div>
                  <div className="text-sm font-medium text-slate-700">Active</div>
                  <div className="text-xs text-muted-foreground">
                    Visible to mobile clients through the public catalog.
                  </div>
                </div>
              </label>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Cuboid className="h-4 w-4" />
                    {currentModelUrl ? "Replace .glb" : "Upload .glb"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => viewerControls?.resetCamera()}
                    disabled={!currentModelUrl}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reset camera
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCapturePreview}
                    disabled={!currentModelUrl}
                  >
                    <Camera className="h-4 w-4" />
                    Capture preview
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,model/gltf-binary"
                  className="hidden"
                  onChange={(event) =>
                    handleSceneFileChange(event.target.files?.[0] ?? null)
                  }
                />

                <ModelViewer
                  modelUrl={currentModelUrl}
                  anchors={editor.anchors}
                  showOverlays={viewerOverlaysVisible}
                  selectedAnchorId={selectedAnchorId}
                  onSelectAnchor={setSelectedAnchorId}
                  onAddAnchor={handleAnchorAdd}
                  onReady={setViewerControls}
                />
              </div>

              <Card className="space-y-4 border-dashed bg-muted/20 p-5">
                <div>
                  <h3 className="font-semibold text-slate-900">Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Captured from the live WebGL camera position.
                  </p>
                </div>

                {currentPreviewUrl ? (
                  <img
                    src={currentPreviewUrl}
                    alt="AR model preview"
                    className="h-52 w-full rounded-xl border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border bg-white text-sm text-muted-foreground">
                    No preview captured yet
                  </div>
                )}

                <div className="space-y-2 rounded-xl bg-white p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Anchors</span>
                    <span className="font-semibold text-slate-900">
                      {editor.anchors.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Model source</span>
                    <span className="font-semibold text-slate-900">
                      {editor.sceneAssetFile ? "Local upload" : editor.sceneAssetUrl ? "Saved asset" : "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-semibold text-slate-900">
                      {editor.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {editor.id ? (
                    <div className="flex items-center justify-between">
                      <span>Updated</span>
                      <span className="font-semibold text-slate-900">
                        {selectedListModel?.updated_at
                          ? formatDate(selectedListModel.updated_at)
                          : "—"}
                      </span>
                    </div>
                  ) : null}
                </div>
              </Card>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Anchors</h2>
              <p className="text-sm text-muted-foreground">
                Click the model surface to add anchors. Repositioning is handled by
                deleting and re-adding the anchor.
              </p>
            </div>

            {editor.anchors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No anchors placed yet.
              </div>
            ) : (
              <div className="space-y-3">
                {editor.anchors.map((anchor, index) => (
                  <div
                    key={anchor.id}
                    className={cn(
                      "rounded-xl border border-border p-4 transition-colors",
                      anchor.id === selectedAnchorId && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedAnchorId(anchor.id)}
                            className="text-left"
                          >
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Anchor {index + 1}
                            </div>
                          </button>
                          <code className="rounded bg-muted px-2 py-1 text-xs">
                            {anchor.id}
                          </code>
                        </div>

                        <Input
                          value={anchor.label}
                          onChange={(event) =>
                            updateAnchor(anchor.id, event.target.value)
                          }
                          placeholder="Anchor label"
                        />

                        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                          <div className="rounded-lg bg-muted/40 px-3 py-2">
                            x {anchor.position.x.toFixed(3)}
                          </div>
                          <div className="rounded-lg bg-muted/40 px-3 py-2">
                            y {anchor.position.y.toFixed(3)}
                          </div>
                          <div className="rounded-lg bg-muted/40 px-3 py-2">
                            z {anchor.position.z.toFixed(3)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveAnchor(anchor.id, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveAnchor(anchor.id, 1)}
                          disabled={index === editor.anchors.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAnchor(anchor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedAnchor ? (
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-slate-600">
                Selected anchor <strong>{selectedAnchor.label}</strong>. Click another
                marker in the scene or select it here to rename or reorder it.
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <Modal
        open={Boolean(captureCandidate)}
        onClose={dismissCapture}
        title="Confirm Preview Capture"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {captureCandidate ? (
            <img
              src={captureCandidate.dataUrl}
              alt="Captured preview candidate"
              className="max-h-[60vh] w-full rounded-xl border border-border object-contain"
            />
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={dismissCapture}>
              Retake
            </Button>
            <Button onClick={confirmCapture}>Use this preview</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
