import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { getTours } from "@/api/endpoints";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";

interface Tour {
  id: number;
  title: string;
  city: string;
  status: string;
  tour_type: string;
  difficulty: string;
  creator: number;
  creator_username: string;
  created_at: string;
  avg_rating: number;
  review_count: number;
  completion_count: number;
  step_count: number;
}

interface Filters {
  search: string;
  status: string;
  tour_type: string;
  difficulty: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "secondary",
};

export default function Tours() {
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    tour_type: "",
    difficulty: "",
  });

  const fetchTours = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (filters.search) params.city = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.tour_type) params.tour_type = filters.tour_type;
      if (filters.difficulty) params.difficulty = filters.difficulty;

      const { data } = await getTours(params);
      setTours(data.results ?? data);
      setTotalPages(Math.ceil((data.count ?? data.length) / 20));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tours</h1>
        <p className="text-muted-foreground">Manage and moderate tours</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by city..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Select
            value={filters.tour_type}
            onChange={(e) => updateFilter("tour_type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="STORY">Story</option>
            <option value="PUZZLE">Puzzle</option>
            <option value="HYBRID">Hybrid</option>
          </Select>
          <Select
            value={filters.difficulty}
            onChange={(e) => updateFilter("difficulty", e.target.value)}
          >
            <option value="">All Difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <DataTable
            columns={[
              { header: "Title", accessor: "title" },
              { header: "City", accessor: "city" },
              {
                header: "Status",
                accessor: (row: Tour) => (
                  <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>
                    {row.status}
                  </Badge>
                ),
              },
              { header: "Type", accessor: "tour_type" },
              { header: "Difficulty", accessor: "difficulty" },
              { header: "Creator", accessor: "creator_username" },
              {
                header: "Rating",
                accessor: (row: Tour) =>
                  row.avg_rating ? row.avg_rating.toFixed(1) : "—",
              },
              { header: "Steps", accessor: "step_count" },
              {
                header: "Created",
                accessor: (row: Tour) =>
                  new Date(row.created_at).toLocaleDateString(),
              },
            ]}
            data={tours}
            onRowClick={(tour) => navigate(`/tours/${tour.id}`)}
            keyExtractor={(row) => row.id}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
