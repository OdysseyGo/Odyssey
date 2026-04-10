import { useEffect, useState } from "react";
import { Users, Map, Star, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAnalyticsSummary, getUserGrowth, getTourGrowth, getTopTours } from "@/api/endpoints";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

interface Summary {
  total_users: number;
  total_tours: number;
  total_reviews: number;
  pending_reports: number;
  new_users_7d: number;
  new_users_30d: number;
  new_tours_7d: number;
  new_tours_30d: number;
  active_users_7d: number;
}

interface GrowthPoint {
  date: string;
  count: number;
}

interface TopTour {
  id: number;
  title: string;
  creator_username: string;
  value: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [userGrowth, setUserGrowth] = useState<GrowthPoint[]>([]);
  const [tourGrowth, setTourGrowth] = useState<GrowthPoint[]>([]);
  const [topTours, setTopTours] = useState<TopTour[]>([]);

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(),
      getUserGrowth({ period: "daily", days: 30 }),
      getTourGrowth({ period: "daily", days: 30 }),
      getTopTours({ order_by: "rating", limit: 5 }),
    ]).then(([summaryRes, userRes, tourRes, topRes]) => {
      setSummary(summaryRes.data);
      setUserGrowth(userRes.data);
      setTourGrowth(tourRes.data);
      setTopTours(topRes.data);
    });
  }, []);

  if (!summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={summary.total_users.toLocaleString()}
          subtitle={`+${summary.new_users_7d} this week`}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Total Tours"
          value={summary.total_tours.toLocaleString()}
          subtitle={`+${summary.new_tours_7d} this week`}
          icon={<Map className="h-6 w-6" />}
        />
        <StatCard
          title="Total Reviews"
          value={summary.total_reviews.toLocaleString()}
          icon={<Star className="h-6 w-6" />}
        />
        <StatCard
          title="Pending Reports"
          value={summary.pending_reports}
          icon={<AlertTriangle className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">User Growth</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: string) => v.slice(5, 10)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Tour Growth</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tourGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: string) => v.slice(5, 10)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Top Tours</h2>
        <DataTable
          columns={[
            { header: "Title", accessor: "title" },
            { header: "Creator", accessor: "creator_username" },
            {
              header: "Score",
              accessor: (row: TopTour) => (
                <Badge variant="success">{row.value?.toFixed(1) ?? "N/A"}</Badge>
              ),
            },
          ]}
          data={topTours}
          keyExtractor={(row: TopTour) => row.id}
        />
      </Card>
    </div>
  );
}
