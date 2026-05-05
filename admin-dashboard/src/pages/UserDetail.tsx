import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Ban, MapPin, Shield, UserCheck } from "lucide-react";
import { getUser, banUser, unbanUser, updateUser } from "@/api/endpoints";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface UserData {
  id: number;
  username: string;
  email: string;
  user_type: number;
  country: string;
  is_staff: boolean;
  is_banned: boolean;
  xp: number;
  level: number;
  date_joined: string;
  following_count: number;
  follower_count: number;
  tours_created_count: number;
  tours_completed_count: number;
  reviews_count: number;
  badges_earned_count: number;
  badges: UserBadge[];
  badge_history: UserBadgeHistory[];
  terms_accepted_at: string | null;
  terms_version: string;
}

interface BadgeData {
  id: number;
  code: string | null;
  name: string;
  description: string;
}

interface SourceTour {
  id: number;
  title: string;
  city?: string;
  country?: string;
  country_code?: string;
}

interface UserBadge {
  id: number;
  badge: BadgeData;
  city: string;
  country_code: string;
  mistake_count: number | null;
  source_tour: number | null;
  source_tour_detail: SourceTour | null;
  earned_at: string;
}

interface UserBadgeHistory extends UserBadge {
  user_badge: number | null;
  event_type: "EARNED" | "UPGRADED";
}

const USER_TYPE_LABELS: Record<number, string> = {
  1: "Explorer",
  2: "Creator",
  3: "Business",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  EARNED: "Earned",
  UPGRADED: "Upgraded",
};

function formatBadgeLocation(badge: Pick<UserBadge, "city" | "country_code">) {
  if (!badge.city) return "—";
  return `${badge.city}${badge.country_code ? `, ${badge.country_code}` : ""}`;
}

function formatBadgeDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banExpiry, setBanExpiry] = useState("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = async () => {
    const { data } = await getUser(Number(id));
    setUser(data);
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleBan = async () => {
    setActionLoading(true);
    try {
      await banUser(Number(id), banReason, banExpiry || null);
      setBanModalOpen(false);
      setBanReason("");
      setBanExpiry("");
      fetchUser();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async () => {
    setActionLoading(true);
    try {
      await unbanUser(Number(id));
      fetchUser();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    setActionLoading(true);
    try {
      await updateUser(Number(id), { user_type: Number(newRole) });
      setRoleModalOpen(false);
      fetchUser();
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStaff = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await updateUser(Number(id), { is_staff: !user.is_staff });
      fetchUser();
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/users")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.is_banned ? (
            <Button
              variant="outline"
              onClick={handleUnban}
              disabled={actionLoading}
            >
              <UserCheck className="h-4 w-4" /> Unban
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setBanModalOpen(true)}>
              <Ban className="h-4 w-4" /> Ban
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setNewRole(String(user.user_type));
              setRoleModalOpen(true);
            }}
          >
            Change Role
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStaff}
            disabled={actionLoading}
          >
            <Shield className="h-4 w-4" />
            {user.is_staff ? "Remove Staff" : "Make Staff"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd>
                <Badge>
                  {USER_TYPE_LABELS[user.user_type] ?? user.user_type}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Country</dt>
              <dd>{user.country || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                {user.is_banned ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Staff</dt>
              <dd>
                {user.is_staff ? <Badge variant="warning">Yes</Badge> : "No"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Joined</dt>
              <dd>{new Date(user.date_joined).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Terms Accepted</dt>
              <dd>
                {user.terms_accepted_at ? (
                  <span title={new Date(user.terms_accepted_at).toLocaleString()}>
                    {new Date(user.terms_accepted_at).toLocaleDateString()}
                  </span>
                ) : (
                  <Badge variant="destructive">Not accepted</Badge>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Terms Version</dt>
              <dd>
                {user.terms_version ? (
                  <Badge variant="secondary">{user.terms_version}</Badge>
                ) : (
                  <Badge variant="destructive">None</Badge>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Activity</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Level</dt>
              <dd className="font-semibold">{user.level}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">XP</dt>
              <dd className="font-semibold">{user.xp}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tours Created</dt>
              <dd className="font-semibold">{user.tours_created_count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tours Completed</dt>
              <dd className="font-semibold">{user.tours_completed_count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Reviews</dt>
              <dd className="font-semibold">{user.reviews_count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Badges</dt>
              <dd className="font-semibold">{user.badges_earned_count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Followers</dt>
              <dd className="font-semibold">{user.follower_count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Following</dt>
              <dd className="font-semibold">{user.following_count}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Earned Badges</h2>
            <p className="text-sm text-muted-foreground">
              Current badges and the tours that awarded them.
            </p>
          </div>
          <Badge>{user.badges.length}</Badge>
        </div>

        {user.badges.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            This user has not earned any badges yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {user.badges.map((earnedBadge) => (
              <div
                key={earnedBadge.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">
                        {earnedBadge.badge.name}
                      </h3>
                      {earnedBadge.badge.code ? (
                        <Badge variant="secondary">
                          {earnedBadge.badge.code}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatBadgeLocation(earnedBadge)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Earned</span>
                    <span className="font-medium">
                      {formatBadgeDate(earnedBadge.earned_at)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Mistakes</span>
                    <span className="font-medium">
                      {earnedBadge.mistake_count ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Tour</span>
                    {earnedBadge.source_tour_detail ? (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/tours/${earnedBadge.source_tour_detail?.id}`,
                          )
                        }
                        className="flex max-w-[70%] items-center justify-end gap-1 text-right font-medium text-primary hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {earnedBadge.source_tour_detail.title}
                        </span>
                      </button>
                    ) : (
                      <span className="font-medium">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Badge History</h2>
            <p className="text-sm text-muted-foreground">
              Latest badge earns and upgrades for this user.
            </p>
          </div>
          <Badge variant="secondary">{user.badge_history.length}</Badge>
        </div>

        {user.badge_history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No badge history has been recorded for this user.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Badge</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Tour</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {user.badge_history.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-3 font-medium">
                      {event.badge.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          event.event_type === "UPGRADED"
                            ? "warning"
                            : "success"
                        }
                      >
                        {EVENT_TYPE_LABELS[event.event_type] ??
                          event.event_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatBadgeLocation(event)}
                    </td>
                    <td className="px-4 py-3">
                      {event.source_tour_detail ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/tours/${event.source_tour_detail?.id}`)
                          }
                          className="max-w-52 truncate text-primary hover:underline"
                        >
                          {event.source_tour_detail.title}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatBadgeDate(event.earned_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        title="Ban User"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Reason</label>
            <Input
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban..."
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Expires At (optional, leave empty for permanent)
            </label>
            <Input
              type="datetime-local"
              value={banExpiry}
              onChange={(e) => setBanExpiry(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={!banReason || actionLoading}
            >
              {actionLoading ? "Banning..." : "Confirm Ban"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change Role"
      >
        <div className="space-y-4">
          <Select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full"
          >
            <option value="1">Explorer</option>
            <option value="2">Creator</option>
            <option value="3">Business</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
