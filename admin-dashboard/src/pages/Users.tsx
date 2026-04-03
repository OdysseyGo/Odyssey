import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { getUsers } from "@/api/endpoints";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: number;
  is_staff: boolean;
  is_banned: boolean;
  xp: number;
  level: number;
  country: string;
  date_joined: string;
}

interface Filters {
  search: string;
  user_type: string;
  is_banned: string;
  is_staff: string;
}

const USER_TYPE_LABELS: Record<number, string> = {
  1: "Explorer",
  2: "Creator",
  3: "Business",
};

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    user_type: "",
    is_banned: "",
    is_staff: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (filters.search) params.search = filters.search;
      if (filters.user_type) params.user_type = filters.user_type;
      if (filters.is_banned) params.is_banned = filters.is_banned;
      if (filters.is_staff) params.is_staff = filters.is_staff;

      const { data } = await getUsers(params);
      setUsers(data.results ?? data);
      setTotalPages(Math.ceil((data.count ?? data.length) / 20));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage platform users</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.user_type}
            onChange={(e) => updateFilter("user_type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="1">Explorer</option>
            <option value="2">Creator</option>
            <option value="3">Business</option>
          </Select>
          <Select
            value={filters.is_banned}
            onChange={(e) => updateFilter("is_banned", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Banned</option>
            <option value="false">Active</option>
          </Select>
          <Select
            value={filters.is_staff}
            onChange={(e) => updateFilter("is_staff", e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="true">Staff</option>
            <option value="false">Regular</option>
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
              { header: "Username", accessor: "username" },
              { header: "Email", accessor: "email" },
              {
                header: "Type",
                accessor: (row: User) => (
                  <Badge>{USER_TYPE_LABELS[row.user_type] ?? row.user_type}</Badge>
                ),
              },
              { header: "Country", accessor: "country" },
              {
                header: "Status",
                accessor: (row: User) =>
                  row.is_banned ? (
                    <Badge variant="destructive">Banned</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  ),
              },
              {
                header: "Staff",
                accessor: (row: User) =>
                  row.is_staff ? (
                    <Badge variant="warning">Staff</Badge>
                  ) : null,
              },
              { header: "Level", accessor: "level" },
              { header: "XP", accessor: "xp" },
              {
                header: "Joined",
                accessor: (row: User) =>
                  new Date(row.date_joined).toLocaleDateString(),
              },
            ]}
            data={users}
            onRowClick={(user) => navigate(`/users/${user.id}`)}
            keyExtractor={(row) => row.id}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
