import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  getUserGrowth,
  getTourGrowth,
  getDistributions,
  getActiveUsers,
} from "@/api/endpoints";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { Users, Activity } from "lucide-react";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface GrowthPoint {
  date: string;
  count: number;
}

interface Distribution {
  label: string;
  count: number;
}

export default function Analytics() {
  const [period, setPeriod] = useState("daily");
  const [days, setDays] = useState(30);
  const [userGrowth, setUserGrowth] = useState<GrowthPoint[]>([]);
  const [tourGrowth, setTourGrowth] = useState<GrowthPoint[]>([]);
  const [userTypes, setUserTypes] = useState<Distribution[]>([]);
  const [tourTypes, setTourTypes] = useState<Distribution[]>([]);
  const [difficulties, setDifficulties] = useState<Distribution[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [activeDays, setActiveDays] = useState(7);

  useEffect(() => {
    getUserGrowth({ period, days }).then((res) => setUserGrowth(res.data));
    getTourGrowth({ period, days }).then((res) => setTourGrowth(res.data));
  }, [period, days]);

  useEffect(() => {
    getDistributions().then((res) => {
      setUserTypes(res.data.user_types ?? []);
      setTourTypes(res.data.tour_types ?? []);
      setDifficulties(res.data.difficulties ?? []);
    });
  }, []);

  useEffect(() => {
    getActiveUsers({ days: activeDays }).then((res) =>
      setActiveUsersCount(res.data.active_users ?? res.data.count ?? 0),
    );
  }, [activeDays]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Platform metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title={`Active Users (last ${activeDays} days)`}
          value={activeUsersCount}
          icon={<Activity className="h-6 w-6" />}
        />
        <Card className="flex items-center gap-4">
          <Users className="h-6 w-6 text-primary" />
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Active window:</label>
            <Select
              value={String(activeDays)}
              onChange={(e) => {
                const v = e.target.value;
                if (v !== "custom") setActiveDays(Number(v));
              }}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </Select>
            <Input
              type="number"
              min={1}
              max={730}
              value={activeDays}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > 0) setActiveDays(v);
              }}
              className="w-20"
            />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Growth Over Time</h2>
          <div className="flex items-center gap-3">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
            <Select
              value={String(days)}
              onChange={(e) => {
                const v = e.target.value;
                if (v !== "custom") setDays(Number(v));
              }}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="730">2 years</option>
            </Select>
            <Input
              type="number"
              min={1}
              max={730}
              value={days}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > 0) setDays(v);
              }}
              className="w-20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">User Signups</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Tour Creations</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={tourGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">User Type Distribution</h2>
          {userTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => {
                    const payload = props.payload as Distribution | undefined;
                    const percent = typeof props.percent === "number" ? props.percent : 0;
                    return `${payload?.label ?? ""} (${(percent * 100).toFixed(0)}%)`;
                  }}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="label"
                >
                  {userTypes.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Tour Type Distribution</h2>
          {tourTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tourTypes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Difficulty Distribution</h2>
        {difficulties.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={difficulties}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </Card>
    </div>
  );
}
