import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useDealsByStatus } from "../hooks/use-deals-by-status";
import type { DashboardDateRange } from "../types/dashboard.types";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3B82F6",
  WON: "#10B981",
  LOST: "#EF4444",
  CANCELLED: "#94A3B8",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "กำลังดำเนินการ",
  WON: "ปิดการขายสำเร็จ",
  LOST: "ไม่สำเร็จ",
  CANCELLED: "ยกเลิก",
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

type DealsByStatusChartProps = {
  dateRange: DashboardDateRange;
};

function DealsByStatusChart({ dateRange }: DealsByStatusChartProps) {
  const { data, isLoading, isError, refetch } = useDealsByStatus(dateRange);

  if (isLoading) {
    return (
      <div className="h-[360px] min-w-0 animate-pulse rounded-xl bg-slate-100" />
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[360px] min-w-0 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">
          ไม่สามารถโหลดข้อมูลดีลตามสถานะได้
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
  const totalDeals = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-slate-900">
          จำนวนดีลตามสถานะ
        </h3>

        <p className="mt-1 text-sm text-slate-500">สัดส่วนของดีลในแต่ละสถานะ</p>
      </div>

      {chartData.length === 0 || totalDeals === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-center text-sm text-slate-400">
          ยังไม่มีข้อมูลดีล
        </div>
      ) : (
        <>
          <div className="relative mt-4 h-[240px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius="55%"
                  outerRadius="78%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {chartData.map((item) => (
                    <Cell
                      key={item.status}
                      fill={STATUS_COLORS[item.status] ?? "#8B5CF6"}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [
                    formatNumber(Number(value)),
                    "จำนวนดีล",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="max-w-[70%] truncate text-2xl font-semibold text-slate-900 sm:text-3xl">
                {formatNumber(totalDeals)}
              </span>

              <span className="mt-1 text-xs text-slate-500">ดีลทั้งหมด</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-3">
            {chartData.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: STATUS_COLORS[item.status] ?? "#8B5CF6",
                  }}
                />

                <span className="text-xs text-slate-600">
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>

                <span className="text-xs font-semibold text-slate-900">
                  {formatNumber(item.count)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default DealsByStatusChart;
