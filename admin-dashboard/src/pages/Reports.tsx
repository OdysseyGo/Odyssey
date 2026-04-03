import { useEffect, useState, useCallback } from "react";
import { getReports, takeReportAction } from "@/api/endpoints";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";

interface Report {
  id: number;
  content_type: string;
  content_id: number;
  reason: string;
  status: string;
  reporter: string;
  created_at: string;
}

const TABS = ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"] as const;

const STATUS_VARIANT: Record<string, "warning" | "default" | "success" | "secondary"> = {
  PENDING: "warning",
  REVIEWED: "default",
  RESOLVED: "success",
  DISMISSED: "secondary",
};

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [actionModal, setActionModal] = useState<Report | null>(null);
  const [action, setAction] = useState("dismiss");
  const [notes, setNotes] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banExpiry, setBanExpiry] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getReports({ status: activeTab, page });
      setReports(data.results ?? data);
      setTotalPages(Math.ceil((data.count ?? data.length) / 20));
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await takeReportAction(actionModal.id, {
        action,
        notes: notes || undefined,
        ban_reason: action === "ban_user" ? banReason : undefined,
        ban_expires_at: action === "ban_user" && banExpiry ? banExpiry : undefined,
      });
      setActionModal(null);
      setAction("dismiss");
      setNotes("");
      setBanReason("");
      setBanExpiry("");
      fetchReports();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Content moderation queue</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <DataTable
            columns={[
              { header: "ID", accessor: "id" },
              {
                header: "Type",
                accessor: (row: Report) => (
                  <Badge>{row.content_type}</Badge>
                ),
              },
              { header: "Content ID", accessor: "content_id" },
              {
                header: "Reason",
                accessor: (row: Report) => (
                  <span className="line-clamp-2 max-w-xs">{row.reason}</span>
                ),
              },
              { header: "Reporter", accessor: "reporter" },
              {
                header: "Status",
                accessor: (row: Report) => (
                  <Badge variant={STATUS_VARIANT[row.status]}>
                    {row.status}
                  </Badge>
                ),
              },
              {
                header: "Date",
                accessor: (row: Report) =>
                  new Date(row.created_at).toLocaleDateString(),
              },
              {
                header: "Action",
                accessor: (row: Report) =>
                  row.status === "PENDING" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionModal(row);
                      }}
                    >
                      Take Action
                    </Button>
                  ) : null,
              },
            ]}
            data={reports}
            keyExtractor={(row) => row.id}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={`Take Action — Report #${actionModal?.id}`}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Action</label>
            <Select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full"
            >
              <option value="dismiss">Dismiss</option>
              <option value="warn">Warn</option>
              <option value="remove_content">Remove Content</option>
              <option value="ban_user">Ban User</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Admin notes..."
            />
          </div>

          {action === "ban_user" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Ban Reason</label>
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for ban..."
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Ban Expires At (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={banExpiry}
                  onChange={(e) => setBanExpiry(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant={action === "ban_user" ? "destructive" : "primary"}
              onClick={handleAction}
              disabled={actionLoading || (action === "ban_user" && !banReason)}
            >
              {actionLoading ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
