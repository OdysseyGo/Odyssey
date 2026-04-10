import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Archive, Trash2 } from "lucide-react";
import { getTour, approveTour, rejectTour, archiveTour, deleteTour } from "@/api/endpoints";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface TourStep {
  id: number;
  title: string;
  order: number;
  description: string;
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
    const { data } = await getTour(Number(id));
    setTour(data);
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

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Steps ({tour.steps?.length ?? 0})</h2>
        {tour.steps?.length ? (
          <div className="space-y-3">
            {tour.steps.map((step) => (
              <div
                key={step.id}
                className="rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {step.order}
                  </span>
                  <span className="font-medium">{step.title}</span>
                </div>
                {step.description && (
                  <p className="mt-1 pl-8 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No steps defined</p>
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
