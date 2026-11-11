import { useMemo, useState } from "react";

import { CalendarDays, Download } from "lucide-react";

import DealsByStatusChart from "./features/dashboard/components/deals-by-status-chart";
import DealsByStageChart from "./features/dashboard/components/deals-by-stage-chart";
import RecentActivities from "./features/dashboard/components/recent-activities";
import PendingTasks from "./features/dashboard/components/pending-tasks";
import { useOrganization } from "./features/organizations/context/organization.context";

import { useDashboardSummary } from "./features/dashboard/hooks/use-dashboard-summary";
import { getDealsReport } from "./features/dashboard/services/dashboard.service";

import {
  downloadCsv,
  getCsvDateSuffix,
} from "./features/dashboard/utils/csv-export";

import type {
  DashboardDateFilter,
  DashboardDateRange,
} from "./features/dashboard/types/dashboard.types";

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function getDashboardDateRange(
  filter: DashboardDateFilter,
): DashboardDateRange {
  if (filter === "all" || filter === "custom") {
    return {};
  }

  const today = new Date();

  const start = new Date(today);
  const end = new Date(today);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 0);

  switch (filter) {
    case "last7Days":
      start.setDate(start.getDate() - 6);
      break;

    case "last30Days":
      start.setDate(start.getDate() - 29);
      break;

    case "thisMonth":
      start.setDate(1);
      break;

    case "lastMonth":
      start.setDate(1);
      start.setMonth(start.getMonth() - 1);

      end.setDate(0);
      break;

    case "thisYear":
      start.setMonth(0, 1);
      break;
  }

  return {
    startDate: formatLocalDateTime(start),
    endDate: formatLocalDateTime(end),
  };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="h-[360px] animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  const {
    isReady,
    isLoading: isOrganizationLoading,
    isError: isOrganizationError,
  } = useOrganization();
  const [dateFilter, setDateFilter] =
    useState<DashboardDateFilter>("last30Days");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isExportingDeals, setIsExportingDeals] = useState(false);
  const [exportError, setExportError] = useState("");

  const [appliedCustomRange, setAppliedCustomRange] =
    useState<DashboardDateRange>({});

  const dateRange = useMemo(
    () =>
      dateFilter === "custom"
        ? appliedCustomRange
        : getDashboardDateRange(dateFilter),
    [dateFilter, appliedCustomRange],
  );

  const isCustomRangeInvalid =
    !customStartDate || !customEndDate || customStartDate > customEndDate;

  const handleApplyCustomRange = () => {
    if (isCustomRangeInvalid) return;

    const start = new Date(`${customStartDate}T00:00:00`);
    const end = new Date(`${customEndDate}T23:59:59`);

    setAppliedCustomRange({
      startDate: formatLocalDateTime(start),
      endDate: formatLocalDateTime(end),
    });

    setDateFilter("custom");
  };

  const handleClearCustomRange = () => {
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedCustomRange({});
    setDateFilter("last30Days");
  };

  const { data, isLoading, isError, refetch } = useDashboardSummary(dateRange);
  if (isOrganizationLoading || (!isReady && !isOrganizationError)) {
    return <DashboardSkeleton />;
  }

  const dateRangeLabel = getDashboardDateRangeLabel(dateFilter, dateRange);
  const isCustomRangePending =
    dateFilter === "custom" &&
    (!appliedCustomRange.startDate || !appliedCustomRange.endDate);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">
          ไม่สามารถโหลดข้อมูลแดชบอร์ดได้
        </p>

        <p className="mt-1 text-sm text-red-600">
          กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง
        </p>

        <button
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  const winRate =
    data.total_deals > 0 ? (data.won_deals / data.total_deals) * 100 : 0;

  function formatDashboardDate(dateTime?: string): string {
    if (!dateTime) return "";

    return new Intl.DateTimeFormat("th-TH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(dateTime));
  }

  const handleExportSummary = () => {
    if (isCustomRangePending) return;

    const suffix = getCsvDateSuffix(dateRange.startDate, dateRange.endDate);

    const headers = ["Metric", "Value"];

    const rows = [
      ["Total Deals", data.total_deals],
      ["Total Deal Value", data.total_deal_value],
      ["Won Deals", data.won_deals],
      ["Won Deal Value", data.won_deal_value],
      ["Open Deals", data.open_deals],
      ["Win Rate (%)", Number(winRate.toFixed(2))],
      ["Pending Tasks", data.pending_tasks],
      ["Overdue Tasks", data.overdue_tasks],
      ["Total Activities", data.total_activities],
    ];

    downloadCsv(`dashboard-summary_${suffix}.csv`, headers, rows);
  };

  const handleExportDeals = async () => {
    if (isCustomRangePending || isExportingDeals) return;

    try {
      setIsExportingDeals(true);
      setExportError("");

      const report = await getDealsReport(dateRange);

      const headers = [
        "Deal ID",
        "Title",
        "Value",
        "Currency",
        "Status",
        "Created At",
        "Expected Close Date",
        "Stage ID",
        "Company ID",
        "Contact ID",
      ];

      const rows = report.items.map((deal) => [
        deal.id,
        deal.title,
        deal.value,
        deal.currency,
        deal.status,
        deal.created_at,
        deal.expected_close_date ?? "",
        deal.stage_id ?? "",
        deal.company_id ?? "",
        deal.contact_id ?? "",
      ]);

      const suffix = getCsvDateSuffix(dateRange.startDate, dateRange.endDate);

      downloadCsv(`deals-report_${suffix}.csv`, headers, rows);
    } catch (error) {
      console.error("Failed to export deals:", error);
      setExportError("ไม่สามารถส่งออกข้อมูลดีลได้ กรุณาลองอีกครั้ง");
    } finally {
      setIsExportingDeals(false);
    }
  };

  function getDashboardDateRangeLabel(
    filter: DashboardDateFilter,
    dateRange: DashboardDateRange,
  ): string {
    if (filter === "all") {
      return "กำลังแสดงข้อมูลทั้งหมด";
    }

    if (filter === "custom" && (!dateRange.startDate || !dateRange.endDate)) {
      return "เลือกวันที่เริ่มต้นและวันที่สิ้นสุด แล้วกดใช้ตัวกรอง";
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      return "กำลังแสดงข้อมูลทั้งหมด";
    }

    return `ข้อมูลระหว่างวันที่ ${formatDashboardDate(dateRange.startDate)} – ${formatDashboardDate(dateRange.endDate)}`;
  }

  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-8">
      {/* ส่วนหัวแดชบอร์ดและตัวกรองวันที่ */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            ภาพรวมแดชบอร์ด
          </h2>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            ติดตามผลการขายและกิจกรรมต่าง ๆ ภายในธุรกิจของคุณ
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarDays size={14} className="shrink-0" />
            <span>{dateRangeLabel}</span>
          </div>
        </div>

        {/* ตัวกรองวันที่ */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:w-40">
            <label
              htmlFor="dashboard-date-filter"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              ช่วงวันที่
            </label>

            <select
              id="dashboard-date-filter"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value as DashboardDateFilter)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ทั้งหมด</option>
              <option value="last7Days">7 วันที่ผ่านมา</option>
              <option value="last30Days">30 วันที่ผ่านมา</option>
              <option value="thisMonth">เดือนนี้</option>
              <option value="lastMonth">เดือนที่แล้ว</option>
              <option value="thisYear">ปีนี้</option>
              <option value="custom">กำหนดช่วงเวลาเอง</option>
            </select>
          </div>

          {dateFilter === "custom" && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
                <div className="min-w-0 sm:w-36">
                  <label
                    htmlFor="custom-start-date"
                    className="mb-1 block text-xs font-medium text-slate-500"
                  >
                    วันที่เริ่มต้น
                  </label>

                  <input
                    id="custom-start-date"
                    type="date"
                    value={customStartDate}
                    max={customEndDate || undefined}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="min-w-0 sm:w-36">
                  <label
                    htmlFor="custom-end-date"
                    className="mb-1 block text-xs font-medium text-slate-500"
                  >
                    วันที่สิ้นสุด
                  </label>

                  <input
                    id="custom-end-date"
                    type="date"
                    value={customEndDate}
                    min={customStartDate || undefined}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 sm:pb-0">
                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  disabled={isCustomRangeInvalid}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                  ใช้ตัวกรอง
                </button>

                <button
                  type="button"
                  onClick={handleClearCustomRange}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  รีเซ็ต
                </button>
              </div>

              {customStartDate &&
                customEndDate &&
                customStartDate > customEndDate && (
                  <p className="text-xs text-red-600 sm:w-full">
                    วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด
                  </p>
                )}
            </>
          )}
        </div>
      </div>

      {/* ส่วนส่งออกข้อมูล */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleExportSummary}
          disabled={isCustomRangePending}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={14} />
          ส่งออกสรุปข้อมูล
        </button>

        <button
          type="button"
          onClick={handleExportDeals}
          disabled={isCustomRangePending || isExportingDeals}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={14} />
          {isExportingDeals ? "กำลังส่งออก..." : "ส่งออกข้อมูลดีล"}
        </button>
      </div>

      {exportError && <p className="text-sm text-red-600">{exportError}</p>}

      {/* กราฟแดชบอร์ด */}
      <div className="grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2">
        <DealsByStatusChart dateRange={dateRange} />
        <DealsByStageChart dateRange={dateRange} />
      </div>

      {/* กิจกรรมและงานที่ต้องดำเนินการ */}
      <div className="grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2">
        <RecentActivities />
        <PendingTasks />
      </div>
    </section>
  );
}

export default App;
