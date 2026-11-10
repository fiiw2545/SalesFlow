import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useDealsByStage } from "../hooks/use-deals-by-stage";
import type { DashboardDateRange } from "../types/dashboard.types";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

type DealsByStageChartProps = {
  dateRange: DashboardDateRange;
};

function DealsByStageChart({ dateRange }: DealsByStageChartProps) {
  const { data, isLoading, isError, refetch } = useDealsByStage(dateRange);

  if (isLoading) {
    return (
      <div className="h-[360px] min-w-0 animate-pulse rounded-xl bg-slate-100" />
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[360px] min-w-0 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">
          ไม่สามารถโหลดข้อมูลดีลตามขั้นตอนการขายได้
        </p>

        <button
          onClick={() => refetch()}
          className="mt-3 text-sm font-medium text-red-700 underline"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  const chartData = data.items;
  const chartHeight = Math.max(280, chartData.length * 52);

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-slate-900">
          จำนวนดีลตามขั้นตอนการขาย
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          จำนวนดีลในแต่ละขั้นตอนของกระบวนการขาย
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-center text-sm text-slate-400">
          ไม่มีข้อมูลขั้นตอนการขาย
        </div>
      ) : (
        <div
          className="mt-5 min-w-0 overflow-x-auto"
          style={{ maxHeight: 420 }}
        >
          <div
            className="min-w-0"
            style={{ height: chartHeight, minWidth: 280 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 12, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E2E8F0"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="stage_name"
                  width={95}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: string) =>
                    value.length > 14 ? `${value.slice(0, 12)}…` : value
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    formatNumber(Number(value)),
                    "จำนวนดีล",
                  ]}
                />

                <Bar
                  dataKey="count"
                  name="จำนวนดีล"
                  fill="#3B82F6"
                  radius={[0, 6, 6, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealsByStageChart;
