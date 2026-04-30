import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, CheckCircle, XCircle, Archive, Trash2, 
  Image as ImageIcon, Music, Puzzle as PuzzleIcon, 
  HelpCircle, Target, Box, Camera, Compass, MapPin
} from "lucide-react";
import { getTour, approveTour, rejectTour, archiveTour, deleteTour } from "@/api/endpoints";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

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
  metadata: Record<string, any>;
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
  puzzle_type: "TRIVIA" | "AR" | "GYROSCOPE" | "COMPASS" |  "PICTURE_COMPARE";
  question: string;
  hint: string;
  xp_reward: number;
  trivia_detail?: TriviaDetail | null;
  picture_compare_detail?: PictureCompareDetail | null;
  ar_detail?: ArDetail | null;
  gyroscope_detail?: GyroscopeDetail | null;
  compass_detail?: CompassDetail | null;
  options?: any;
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
  status: string;
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

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "secondary",
};

export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState<TourData | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTour = async () => {
    try {
      const { data } = await getTour(Number(id));
      setTour(data);
    } catch (error) {
      console.error("Failed to fetch tour details:", error);
    }
  };

  useEffect(() => {
    fetchTour();
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


  const renderPuzzleDetails = (puzzle: PuzzleData) => {
    switch (puzzle.puzzle_type) {
      case "TRIVIA":
        const options = puzzle.trivia_detail?.options || puzzle.options || [];
        const correct = puzzle.trivia_detail?.correct_answer || puzzle.correct_answer;
        return (
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground mb-2">
              <HelpCircle className="w-4 h-4" /> Trivia Options:
            </div>
            {Array.isArray(options) && options.map((opt: string, i: number) => (
              <div 
                key={i} 
                className={`p-2 rounded border ${opt === correct ? 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-400' : 'bg-muted/50 border-border'}`}
              >
                {opt} {opt === correct && "(Correct)"}
              </div>
            ))}
          </div>
        );
      
      case "PICTURE_COMPARE":
        const picRef = puzzle.picture_compare_detail?.reference_image || puzzle.reference_image;
        const threshold = puzzle.picture_compare_detail?.similarity_threshold;
        return (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Camera className="w-4 h-4" /> Reference Image & Threshold:
            </div>
            {picRef && (
              <img src={picRef} alt="Reference" className="w-32 h-32 object-cover rounded border border-border" />
            )}
            {threshold !== undefined && (
              <p>Required Similarity: <span className="font-semibold">{threshold * 100}%</span></p>
            )}
          </div>
        );

      case "AR":
        const arAsset = puzzle.ar_detail?.scene_asset_url;
        return (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Box className="w-4 h-4" /> AR Scene Asset:
            </div>
            {arAsset ? (
              <a href={arAsset} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                {arAsset}
              </a>
            ) : (
              <p className="italic text-muted-foreground">No asset URL provided.</p>
            )}
          </div>
        );

      case "GYROSCOPE":
        const gyro = puzzle.gyroscope_detail;
        return (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Target className="w-4 h-4" /> Target Angles:
            </div>
            {gyro ? (
              <div className="grid grid-cols-2 gap-2 max-w-xs">
                <div className="p-2 rounded bg-muted/50 border border-border text-center">Pitch: <b>{gyro.target_pitch}°</b></div>
                <div className="p-2 rounded bg-muted/50 border border-border text-center">Roll: <b>{gyro.target_roll}°</b></div>
                <div className="p-2 rounded bg-muted/50 border border-border text-center">Yaw: <b>{gyro.target_yaw}°</b></div>
                <div className="p-2 rounded bg-muted/50 border border-border text-center">Tolerance: <b>±{gyro.tolerance_degrees}°</b></div>
              </div>
            ) : (
              <p className="italic text-muted-foreground">Gyroscope details missing.</p>
            )}
          </div>
        );
      case "COMPASS":
        const compass = puzzle.compass_detail;
        return (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Compass className="w-4 h-4" /> Compass Details:
            </div>
            {compass ? (
              <div className="flex flex-wrap gap-2">
                <div className="p-2 rounded bg-muted/50 border border-border">
                  Required heading: <b>{compass.target_heading_degrees}°</b>
                </div>
              </div>
            ) : (
              <p className="italic text-muted-foreground">Compass details missing.</p>
            )}
          </div>
        );

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

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/tours")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tours
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{tour.title}</h1>
            <Badge variant={STATUS_VARIANT[tour.status] ?? "secondary"}>
              {tour.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {tour.city} &middot; {tour.tour_type} &middot; {tour.difficulty} &middot; by {tour.creator_username}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleApprove} disabled={actionLoading}>
            <CheckCircle className="h-4 w-4" /> Approve
          </Button>
          <Button variant="outline" onClick={() => setRejectModalOpen(true)}>
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button variant="outline" onClick={handleArchive} disabled={actionLoading}>
            <Archive className="h-4 w-4" /> Archive
          </Button>
          <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Tour Cover Image Section */}
      {tour.cover_image && (
        <div className="relative h-64 w-full overflow-hidden rounded-xl border border-border bg-muted">
          <img
            src={tour.cover_image}
            alt={`${tour.title} cover`}
            className="h-full w-full object-cover"
          />
          {tour.cover_image_attribution && (
            <div className="absolute bottom-3 right-3 rounded-md bg-background/80 px-3 py-1.5 text-xs text-foreground backdrop-blur-md">
              © {tour.cover_image_attribution}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

      {tour.description && (
        <Card>
          <h2 className="mb-2 text-lg font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground">{tour.description}</p>
        </Card>
      )}

      {/* Steps & Puzzles Section */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Tour Steps ({tour.steps?.length ?? 0})</h2>
        {tour.steps?.length ? (
          <div className="space-y-4">
            {tour.steps.map((step) => (
              <div
                key={step.id}
                className="rounded-lg border border-border p-4 bg-card shadow-sm"
              >
                {/* Step Header */}
                <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {step.order}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                  </div>
                </div>

                {/* Step Body (Description & Media) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2 space-y-3">
                    {step.description ? (
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No description provided.</p>
                    )}

                    {/* Location Coordinates */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${step.latitude},${step.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline transition-colors cursor-pointer"
                      >  Lat: {step.latitude} &middot; Lng: {step.longitude}</a> 
                    </div>
                    
                    {/* Audio Player */}
                    {step.audio && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-muted/30 rounded-md border border-border">
                        <Music className="h-4 w-4 text-primary" />
                        <audio controls src={step.audio} className="h-8 w-full max-w-xs" />
                      </div>
                    )}
                  </div>

                  {/* Image Preview */}
                  <div className="flex justify-start md:justify-end">
                    {step.image ? (
                      <img 
                        src={step.image} 
                        alt={step.title} 
                        className="w-full max-w-[200px] h-32 object-cover rounded-md border border-border shadow-sm" 
                      />
                    ) : (
                      <div className="w-full max-w-[200px] h-32 bg-muted/50 rounded-md border border-dashed flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                        <span className="text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Puzzle Section */}
                {step.puzzle && (
                  <div className="mt-4 p-4 rounded-md border border-primary/20 bg-primary/5">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <PuzzleIcon className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-primary">Attached Puzzle</h4>
                      <Badge className="ml-auto bg-background">
                        {step.puzzle.puzzle_type}
                      </Badge>
                      <Badge variant="secondary">
                        {step.puzzle.xp_reward} XP
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Question / Prompt:</p>
                        <p className="text-sm text-muted-foreground">{step.puzzle.question}</p>
                      </div>
                      
                      {step.puzzle.hint && (
                        <div>
                          <p className="text-sm font-medium">Hint:</p>
                          <p className="text-sm text-muted-foreground italic">{step.puzzle.hint}</p>
                        </div>
                      )}

                      {/* Render Type-Specific Details */}
                      <div className="pt-2 border-t border-border/50">
                        {renderPuzzleDetails(step.puzzle)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-md border-dashed">
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
                {review.comment && (
                  <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet</p>
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
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
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
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}