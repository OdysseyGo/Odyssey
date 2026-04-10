import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Ban, UserCheck } from "lucide-react";
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
  first_name: string;
  last_name: string;
  user_type: number;
  country: string;
  is_staff: boolean;
  is_banned: boolean;
  xp: number;
  level: number;
  date_joined: string;
  follow_count: number;
  follower_count: number;
  tours_created_count: number;
  tours_completed_count: number;
  reviews_count: number;
  badges_earned_count: number;
}

const USER_TYPE_LABELS: Record<number, string> = {
  1: "Explorer",
  2: "Creator",
  3: "Business",
};

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
            <Button variant="outline" onClick={handleUnban} disabled={actionLoading}>
              <UserCheck className="h-4 w-4" /> Unban
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setBanModalOpen(true)}>
              <Ban className="h-4 w-4" /> Ban
            </Button>
          )}
          <Button variant="outline" onClick={() => {
            setNewRole(String(user.user_type));
            setRoleModalOpen(true);
          }}>
            Change Role
          </Button>
          <Button variant="outline" onClick={handleToggleStaff} disabled={actionLoading}>
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
              <dt className="text-muted-foreground">Name</dt>
              <dd>{user.first_name} {user.last_name || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd><Badge>{USER_TYPE_LABELS[user.user_type] ?? user.user_type}</Badge></dd>
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
              <dd>{user.is_staff ? <Badge variant="warning">Yes</Badge> : "No"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Joined</dt>
              <dd>{new Date(user.date_joined).toLocaleDateString()}</dd>
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
              <dd className="font-semibold">{user.follow_count}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Modal open={banModalOpen} onClose={() => setBanModalOpen(false)} title="Ban User">
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

      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Change Role">
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
