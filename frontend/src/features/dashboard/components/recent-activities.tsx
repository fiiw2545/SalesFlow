import {
  Phone,
  Mail,
  CalendarDays,
  FileText,
  Activity as ActivityIcon,
  Clock,
} from "lucide-react";

import { useRecentActivities } from "../hooks/use-recent-activities";

function getActivityIcon(type: string) {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("call")) return Phone;
  if (normalizedType.includes("email")) return Mail;
  if (normalizedType.includes("meeting")) return CalendarDays;
  if (normalizedType.includes("note")) return FileText;

  return ActivityIcon;
}

function getActivityLabel(type: string) {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("call")) return "โทรศัพท์";
  if (normalizedType.includes("email")) return "อีเมล";
  if (normalizedType.includes("meeting")) return "การประชุม";
  if (normalizedType.includes("note")) return "บันทึก";

  return type;
}

function formatActivityDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function RecentActivities() {
  const { data, isLoading, isError, refetch } = useRecentActivities();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            กิจกรรมล่าสุด
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            รายการปฏิสัมพันธ์ล่าสุดภายในองค์กร
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Clock size={18} />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex animate-pulse gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="h-3 w-1/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="py-8 text-center">
          <p className="text-sm text-red-600">ไม่สามารถโหลดกิจกรรมล่าสุดได้</p>

          <button
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <div className="py-10 text-center">
          <ActivityIcon className="mx-auto mb-3 text-slate-300" size={30} />

          <p className="text-sm font-medium text-slate-700">ยังไม่มีกิจกรรม</p>

          <p className="mt-1 text-xs text-slate-400">
            กิจกรรมล่าสุดของคุณจะแสดงที่นี่
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="divide-y divide-slate-100">
          {data.map((activity) => {
            const Icon = getActivityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="flex gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {activity.subject}
                    </p>

                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-blue-700">
                      {getActivityLabel(activity.type)}
                    </span>
                  </div>

                  {activity.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {activity.description}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    {formatActivityDate(activity.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecentActivities;
