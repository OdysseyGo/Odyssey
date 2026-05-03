import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Archive,
  Trash2,
  Image as ImageIcon,
  Music,
  Puzzle as PuzzleIcon,
  HelpCircle,
  Target,
  Box,
  Camera,
  Compass,
  MapPin,
  Trophy,
  Cuboid,
} from "lucide-react";
import {
  getTour,
  approveTour,
  rejectTour,
  archiveTour,
  deleteTour,
  getBadgeVisualBundle,
} from "@/api/endpoints";
import { getARModel } from "@/api/arModels";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { TourStepRouteMap } from "@/components/maps/TourStepRouteMap";
import {
  BadgePreview,
  mergeBadgeConfig,
  type VisualConfig,
} from "@/components/badges/BadgePreview";
import {
  ReadonlyARPuzzleViewer,
  type ViewerAnchor,
} from "@/components/ar/ReadonlyARPuzzleViewer";

interface TriviaDetail {
  options: string[];
  correct_answer: string;
}

interface PictureCompareDetail {
  reference_image: string | null;
  similarity_threshold: number;
}

interface ArDetail {
  scene_asset_url: string;
  metadata: Record<string, unknown>;
}

interface GyroscopeDetail {
  target_pitch: number;
  target_roll: number;
  target_yaw: number;
  tolerance_degrees: number;
}

interface CompassDetail {
  target_heading_degrees: number;
}

interface PuzzleData {
  id: number;
  puzzle_type: "TRIVIA" | "OPEN_ENDED" | "AR" | "GYROSCOPE" | "COMPASS" | "PICTURE_COMPARE";
  question: string;
  hint: string;
  xp_reward: number;
  trivia_detail?: TriviaDetail | null;
  picture_compare_detail?: PictureCompareDetail | null;
  ar_detail?: ArDetail | null;
  gyroscope_detail?: GyroscopeDetail | null;
  compass_detail?: CompassDetail | null;
  options?: unknown;
  correct_answer?: string;
  reference_image?: string | null;
}

interface TourStep {
  id: number;
  title: string;
  order: number;
  description: string;
  latitude: string;
  longitude: string;
  image?: string | null;
  audio?: string | null;
  puzzle?: PuzzleData | null;
}

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface TourData {
  id: number;
  title: string;
  description: string;
  city: string;
  country?: string;
  country_code?: string;
  status: string;
  review_status?: "IN_REVIEW" | "REJECTED" | null;
  tour_type: string;
  difficulty: string;
  creator: number;
  creator_username: string;
  created_at: string;
  avg_rating: number | null;
  review_count: number;
  completion_count: number;
  step_count: number;
  cover_image?: string | null;
  cover_image_attribution?: string | null;
  steps: TourStep[];
  reviews: Review[];
}

interface BadgeRef {
  id: number;
  code: string;
  name: string;
}

interface VisualOverride {
  id: number;
  badge: number | null;
  country_code: string;
  config: Partial<VisualConfig>;
  updated_at: string;
}

interface BadgeBundle {
  template: VisualConfig;
  overrides: VisualOverride[];
  badges: BadgeRef[];
}

interface ArPreviewState {
  open: boolean;
  loading: boolean;
  modelUrl: string;
  anchors: ViewerAnchor[];
  selectedAnchorId: string | null;
  secretCode: string | null;
  error: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  PUBLISHED: "success",
  PENDING: "warning",
  ARCHIVED: "secondary",
};

const CITY_BADGE_CODES = ["CITY_GOLD", "CITY_SILVER", "CITY_BRONZE"] as const;

const CITY_BADGE_CONDITION: Record<(typeof CITY_BADGE_CODES)[number], string> = {
  CITY_GOLD: "0 mistakes",
  CITY_SILVER: "1 mistake",
  CITY_BRONZE: "2 mistakes",
};

function getStringMetadataValue(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function getCountryCodeForBadge(tour: TourData | null) {
  const code = (tour?.country_code || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "US";
}

export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState<TourData | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ src: string; alt: string } | null>(null);

  const [badgeBundle, setBadgeBundle] = useState<BadgeBundle | null>(null);
  const [badgeBundleError, setBadgeBundleError] = useState("");

  const [arPreview, setArPreview] = useState<ArPreviewState>({
    open: false,
    loading: false,
    modelUrl: "",
    anchors: [],
    selectedAnchorId: null,
    secretCode: null,
    error: "",
  });

  const fetchTour = async () => {
    try {
      const { data } = await getTour(Number(id));
      setTour(data);
    } catch (error) {
      console.error("Failed to fetch tour details:", error);
    }
  };

  const fetchBadgeBundle = async () => {
    try {
      const { data } = await getBadgeVisualBundle();
      setBadgeBundle(data as BadgeBundle);
      setBadgeBundleError("");
    } catch (error) {
      console.error("Failed to fetch badge visuals:", error);
      setBadgeBundleError("Unable to load badge visuals right now.");
    }
  };

  useEffect(() => {
    fetchTour();
    fetchBadgeBundle();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveTour(Number(id));
      fetchTour();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await rejectTour(Number(id), rejectReason);
      setRejectModalOpen(false);
      setRejectReason("");
      fetchTour();
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      await archiveTour(Number(id));
      fetchTour();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteTour(Number(id));
      navigate("/tours");
    } finally {
      setActionLoading(false);
    }
  };

  const openArPreview = async (puzzle: PuzzleData) => {
    if (!puzzle.ar_detail) {
      setArPreview((prev) => ({
        ...prev,
        open: true,
        loading: false,
        modelUrl: "",
        anchors: [],
        selectedAnchorId: null,
        secretCode: null,
        error: "AR details are missing for this puzzle.",
      }));
      return;
    }

    const metadata = puzzle.ar_detail.metadata || {};
    const modelIdRaw = metadata.model_id;
    const modelId =
      typeof modelIdRaw === "number"
        ? modelIdRaw
        : typeof modelIdRaw === "string" && modelIdRaw.trim()
          ? Number(modelIdRaw)
          : null;

    const anchorId = getStringMetadataValue(metadata, "anchor_id");
    const secretCode = getStringMetadataValue(metadata, "secret_code");

    setArPreview({
      open: true,
      loading: true,
      modelUrl: puzzle.ar_detail.scene_asset_url || "",
      anchors: [],
      selectedAnchorId: anchorId,
      secretCode,
      error: "",
    });

    if (modelId && Number.isFinite(modelId)) {
      try {
        const { data } = await getARModel(modelId);
        const nextAnchors: ViewerAnchor[] = (data?.anchors || []).map((anchor: any) => ({
          id: String(anchor.id),
          label: anchor.label || String(anchor.id),
          position: {
            x: Number(anchor.position?.x || 0),
            y: Number(anchor.position?.y || 0),
            z: Number(anchor.position?.z || 0),
          },
        }));

        setArPreview((prev) => ({
          ...prev,
          loading: false,
          modelUrl: data?.scene_asset_url || prev.modelUrl,
          anchors: nextAnchors,
          selectedAnchorId:
            prev.selectedAnchorId && nextAnchors.some((item) => item.id === prev.selectedAnchorId)
              ? prev.selectedAnchorId
              : nextAnchors[0]?.id || null,
        }));
        return;
      } catch (error) {
        console.error("Failed to fetch AR model by id:", error);
      }
    }

    setArPreview((prev) => ({
      ...prev,
      loading: false,
      error: prev.modelUrl
        ? "AR model details could not be loaded from catalog. Showing scene asset fallback."
        : "No AR model preview could be loaded.",
    }));
  };

  const possibleBadges = useMemo(() => {
    if (!tour || !badgeBundle?.template || !badgeBundle.badges?.length) return [];

    const countryCode = getCountryCodeForBadge(tour);
    const badgeOverrides = new Map<number, Partial<VisualConfig>>();
    const badgeCountryOverrides = new Map<string, Partial<VisualConfig>>();

    for (const override of badgeBundle.overrides || []) {
      if (override.badge && !override.country_code) {
        badgeOverrides.set(override.badge, override.config);
      }
      if (override.badge && override.country_code) {
        badgeCountryOverrides.set(
          `${override.badge}:${override.country_code.toUpperCase()}`,
          override.config,
        );
      }
    }

    return CITY_BADGE_CODES.map((code) => {
      const badge = badgeBundle.badges.find((item) => item.code === code);
      if (!badge) return null;

      const withBadge = mergeBadgeConfig(badgeBundle.template, badgeOverrides.get(badge.id));
      const withCountry = mergeBadgeConfig(
        withBadge,
        badgeCountryOverrides.get(`${badge.id}:${countryCode}`),
      );

      return {
        code,
        badge,
        config: withCountry,
        countryCode,
      };
    }).filter(Boolean) as Array<{
      code: (typeof CITY_BADGE_CODES)[number];
      badge: BadgeRef;
      config: VisualConfig;
      countryCode: string;
    }>;
  }, [tour, badgeBundle]);

  const renderPuzzleDetails = (puzzle: PuzzleData) => {
    switch (puzzle.puzzle_type) {
      case "TRIVIA": {
        const options = puzzle.trivia_detail?.options || (puzzle.options as string[]) || [];
        const correct = puzzle.trivia_detail?.correct_answer || puzzle.correct_answer;
        return (
          <div className="mt-2 space-y-1 text-sm">
            <div className="mb-2 flex items-center gap-1 font-medium text-muted-foreground">
              <HelpCircle className="h-4 w-4" /> Trivia Options:
            </div>
            {Array.isArray(options) &&
              options.map((opt: string, i: number) => (
                <div
                  key={i}
                  className={`rounded border p-2 ${
                    opt === correct
                      ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                      : "border-border bg-muted/50"
                  }`}
                >
                  {opt} {opt === correct && "(Correct)"}
                </div>
              ))}
          </div>
        );
      }

      case "OPEN_ENDED": {
        return (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <HelpCircle className="h-4 w-4" /> Open Ended Answer:
            </div>
            <div className="rounded border border-border bg-muted/50 p-2">
              <span className="font-medium">Expected answer:</span>{" "}
              {puzzle.correct_answer || "Not provided"}
            </div>
          </div>
        );
      }

      case "PICTURE_COMPARE": {
        const picRef = puzzle.picture_compare_detail?.reference_image || puzzle.reference_image;
        const threshold = puzzle.picture_compare_detail?.similarity_threshold;
        return (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Camera className="h-4 w-4" /> Reference Image & Threshold:
            </div>
            {picRef && (
              <button
                type="button"
                onClick={() => setImagePreview({ src: picRef, alt: "Reference image" })}
                className="cursor-zoom-in"
              >
                <img
                  src={picRef}
                  alt="Reference"
                  className="h-32 w-32 rounded border border-border object-cover"
                />
              </button>
            )}
            {threshold !== undefined && (
              <p>
                Required Similarity: <span className="font-semibold">{threshold * 100}%</span>
              </p>
            )}
          </div>
        );
      }

      case "AR": {
        const arAsset = puzzle.ar_detail?.scene_asset_url;
        const metadata = puzzle.ar_detail?.metadata || {};
        const anchorId = getStringMetadataValue(metadata, "anchor_id");
        const secretCode = getStringMetadataValue(metadata, "secret_code");

        return (
          <div className="mt-2 space-y-3 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Box className="h-4 w-4" /> AR Scene Asset:
            </div>
            {arAsset ? (
              <a
                href={arAsset}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary hover:underline"
              >
                {arAsset}
              </a>
            ) : (
              <p className="italic text-muted-foreground">No asset URL provided.</p>
            )}

            <div className="rounded-md border border-border bg-background p-3 text-xs">
              <p>
                <span className="font-medium">Anchor ID:</span> {anchorId || "Not provided"}
              </p>
              <p className="mt-1">
                <span className="font-medium">Secret code:</span> {secretCode || "Not provided"}
              </p>
            </div>

            <Button size="sm" variant="outline" onClick={() => openArPreview(puzzle)}>
              <Cuboid className="h-4 w-4" /> Preview Puzzle
            </Button>
          </div>
        );
      }

      case "GYROSCOPE": {
        const gyro = puzzle.gyroscope_detail;
        return (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Target className="h-4 w-4" /> Target Angles:
            </div>
            {gyro ? (
              <div className="grid max-w-xs grid-cols-2 gap-2">
                <div className="rounded border border-border bg-muted/50 p-2 text-center">
                  Pitch: <b>{gyro.target_pitch}°</b>
                </div>
                <div className="rounded border border-border bg-muted/50 p-2 text-center">
                  Roll: <b>{gyro.target_roll}°</b>
                </div>
                <div className="rounded border border-border bg-muted/50 p-2 text-center">
                  Yaw: <b>{gyro.target_yaw}°</b>
                </div>
                <div className="rounded border border-border bg-muted/50 p-2 text-center">
                  Tolerance: <b>±{gyro.tolerance_degrees}°</b>
                </div>
              </div>
            ) : (
              <p className="italic text-muted-foreground">Gyroscope details missing.</p>
            )}
          </div>
        );
      }

      case "COMPASS": {
        const compass = puzzle.compass_detail;
        return (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Compass className="h-4 w-4" /> Compass Details:
            </div>
            {compass ? (
              <div className="flex flex-wrap gap-2">
                <div className="rounded border border-border bg-muted/50 p-2">
                  Required heading: <b>{compass.target_heading_degrees}°</b>
                </div>
              </div>
            ) : (
              <p className="italic text-muted-foreground">Compass details missing.</p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (!tour) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isPendingRejected =
    tour.status === "PENDING" && tour.review_status === "REJECTED";
  const pendingSubLabel =
    tour.status === "PENDING" && tour.review_status
      ? tour.review_status === "REJECTED"
        ? "rejected"
        : "review"
      : null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/tours")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tours
      </button>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{tour.title}</h1>
              <Badge variant={STATUS_VARIANT[tour.status] ?? "secondary"}>{tour.status}</Badge>
              {pendingSubLabel ? <Badge variant="secondary">({pendingSubLabel})</Badge> : null}
            </div>
            <p className="text-muted-foreground">
              {tour.city}
              {tour.country ? `, ${tour.country}` : ""} &middot; {tour.tour_type} &middot; {tour.difficulty}
              &middot; by {tour.creator_username}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleApprove}
              disabled={actionLoading || tour.status === "PUBLISHED"}
              title={tour.status === "PUBLISHED" ? "Already published" : "Approve and publish"}
              className={tour.status === "PUBLISHED" ? "opacity-40 cursor-not-allowed" : ""}
            >
              <CheckCircle className="h-4 w-4" /> Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(true)}
              disabled={actionLoading || isPendingRejected || tour.status === "ARCHIVED"}
              title={
                isPendingRejected
                  ? "Already pending (rejected)"
                  : tour.status === "ARCHIVED"
                    ? "Tour is archived"
                    : "Reject and keep pending"
              }
              className={isPendingRejected || tour.status === "ARCHIVED" ? "opacity-40 cursor-not-allowed" : ""}
            >
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={actionLoading || tour.status === "ARCHIVED"}
              title={tour.status === "ARCHIVED" ? "Already archived" : "Archive this tour"}
              className={tour.status === "ARCHIVED" ? "opacity-40 cursor-not-allowed" : ""}
            >
              <Archive className="h-4 w-4" /> Archive
            </Button>
            <Button variant="destructive" onClick={() => setDeleteModalOpen(true)} disabled={actionLoading}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {tour.status === "PENDING" && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {tour.review_status === "REJECTED" ? (
              <span>This tour is <strong>pending (rejected)</strong>. The creator needs to update it before it goes back to review.</span>
            ) : (
              <span>This tour is <strong>pending review</strong>. Approve to publish or reject to mark it as pending (rejected).</span>
            )}
          </div>
        )}
        {tour.status === "PUBLISHED" && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>This tour is <strong>live</strong> and visible to explorers. You can reject it to mark it as pending (rejected).</span>
          </div>
        )}
        {tour.status === "ARCHIVED" && (
          <div className="flex items-center gap-2 rounded-lg border border-muted-foreground/30 bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Archive className="h-4 w-4 shrink-0" />
            <span>This tour is <strong>archived</strong> and hidden from explorers. You can approve it to make it live again.</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-muted-foreground">Rating</p>
            <p className="text-2xl font-bold">{tour.avg_rating?.toFixed(1) ?? "N/A"}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Completions</p>
            <p className="text-2xl font-bold">{tour.completion_count}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground">Reviews</p>
            <p className="text-2xl font-bold">{tour.review_count}</p>
          </Card>
        </div>
      </Card>

      {tour.cover_image ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Cover Image</h2>
          <button
            type="button"
            className="relative block h-64 w-full cursor-zoom-in overflow-hidden rounded-xl border border-border bg-muted"
            onClick={() => setImagePreview({ src: tour.cover_image!, alt: `${tour.title} cover` })}
          >
            <img src={tour.cover_image} alt={`${tour.title} cover`} className="h-full w-full object-cover" />
            {tour.cover_image_attribution ? (
              <div className="absolute bottom-3 right-3 rounded-md bg-background/80 px-3 py-1.5 text-xs text-foreground backdrop-blur-md">
                © {tour.cover_image_attribution}
              </div>
            ) : null}
          </button>
        </Card>
      ) : null}

      {tour.description ? (
        <Card>
          <h2 className="mb-2 text-lg font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground">{tour.description}</p>
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Route Map</h2>
        <TourStepRouteMap steps={tour.steps || []} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Tour Steps ({tour.steps?.length ?? 0})</h2>
        {tour.steps?.length ? (
          <div className="space-y-4">
            {tour.steps.map((step) => (
              <div key={step.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3 border-b border-border pb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {step.order}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-3 md:col-span-2">
                    {step.description ? (
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No description provided.</p>
                    )}

                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${step.latitude},${step.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer transition-colors hover:text-primary hover:underline"
                      >
                        Lat: {step.latitude} &middot; Lng: {step.longitude}
                      </a>
                    </div>

                    {step.audio ? (
                      <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
                        <Music className="h-4 w-4 text-primary" />
                        <audio controls src={step.audio} className="h-8 w-full max-w-xs" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex justify-start md:justify-end">
                    {step.image ? (
                      <button
                        type="button"
                        onClick={() => setImagePreview({ src: step.image!, alt: step.title })}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={step.image}
                          alt={step.title}
                          className="h-32 w-full max-w-[200px] rounded-md border border-border object-cover shadow-sm"
                        />
                      </button>
                    ) : (
                      <div className="flex h-32 w-full max-w-[200px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 text-muted-foreground">
                        <ImageIcon className="mb-1 h-8 w-8 opacity-50" />
                        <span className="text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {step.puzzle ? (
                  <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <PuzzleIcon className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-primary">Attached Puzzle</h4>
                      <Badge className="ml-auto bg-background">{step.puzzle.puzzle_type}</Badge>
                      <Badge variant="secondary">{step.puzzle.xp_reward} XP</Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Question / Prompt:</p>
                        <p className="text-sm text-muted-foreground">{step.puzzle.question}</p>
                      </div>

                      {step.puzzle.hint ? (
                        <div>
                          <p className="text-sm font-medium">Hint:</p>
                          <p className="text-sm italic text-muted-foreground">{step.puzzle.hint}</p>
                        </div>
                      ) : null}

                      <div className="border-t border-border/50 pt-2">{renderPuzzleDetails(step.puzzle)}</div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
            No steps defined for this tour yet.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Reviews ({tour.reviews?.length ?? 0})</h2>
        {tour.reviews?.length ? (
          <div className="space-y-3">
            {tour.reviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.user}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{review.rating}/5</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {review.comment ? <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Trophy className="h-5 w-5 text-warning" /> Possible Badges to Earn
        </h2>
        {badgeBundleError ? <p className="text-sm text-destructive">{badgeBundleError}</p> : null}
        {possibleBadges.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {possibleBadges.map((item) => (
              <div key={item.badge.id} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mx-auto h-32 w-32">
                  <BadgePreview
                    config={item.config}
                    badgeCode={item.badge.code}
                    countryCode={item.countryCode}
                    label={tour.city || "City"}
                  />
                </div>
                <p className="mt-2 text-center text-sm font-semibold">{item.badge.name}</p>
                <p className="text-center text-xs text-muted-foreground">{item.badge.code}</p>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  Condition: {CITY_BADGE_CONDITION[item.code]}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Badge previews are not available for this tour yet.</p>
        )}
      </Card>

      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Tour">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Reason</label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || actionLoading}>
              {actionLoading ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Tour">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{tour.title}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(imagePreview)}
        onClose={() => setImagePreview(null)}
        title={imagePreview?.alt || "Image preview"}
        className="max-w-4xl"
      >
        {imagePreview ? (
          <img
            src={imagePreview.src}
            alt={imagePreview.alt}
            className="max-h-[75vh] w-full rounded-lg object-contain"
          />
        ) : null}
      </Modal>

      <Modal
        open={arPreview.open}
        onClose={() => setArPreview((prev) => ({ ...prev, open: false }))}
        title="AR Puzzle Preview"
        className="max-w-6xl"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {arPreview.loading ? (
              <div className="flex h-[420px] items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground">
                Loading AR preview...
              </div>
            ) : (
              <ReadonlyARPuzzleViewer
                modelUrl={arPreview.modelUrl}
                anchors={arPreview.anchors}
                selectedAnchorId={arPreview.selectedAnchorId}
                onSelectAnchor={(anchorId) =>
                  setArPreview((prev) => ({ ...prev, selectedAnchorId: anchorId }))
                }
              />
            )}
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <h3 className="text-sm font-semibold">AR Metadata</h3>
            {arPreview.error ? (
              <p className="rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-warning">
                {arPreview.error}
              </p>
            ) : null}
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Selected Anchor:</span>{" "}
                {arPreview.selectedAnchorId || "None"}
              </p>
              <p>
                <span className="font-medium text-foreground">Secret Code:</span>{" "}
                {arPreview.secretCode || "Not provided"}
              </p>
              <p>
                <span className="font-medium text-foreground">Anchors Available:</span> {arPreview.anchors.length}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
