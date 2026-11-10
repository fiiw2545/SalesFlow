import {
  ListTodo,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { usePendingTasks } from "../hooks/use-pending-tasks";

function formatDueDate(date: string | null) {
  if (!date) return "ไม่กำหนดวันครบกำหนด";

  return new Intl.DateTimeFormat("th-TH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function isOverdue(date: string | null) {
  if (!date) return false;

  return new Date(date).getTime() < Date.now();
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-red-50 text-red-700";
    case "HIGH":
      return "bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case "URGENT":
      return "เร่งด่วนมาก";
    case "HIGH":
      return "สูง";
    case "MEDIUM":
      return "ปานกลาง";
    case "LOW":
      return "ต่ำ";
    default:
      return priority;
  }
}

function PendingTasks() {
  const { data, isLoading, isError, refetch } = usePendingTasks();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            งานที่รอดำเนินการ
          </h3>

          <p className="mt-1 text-sm text-slate-500">งานที่ต้องให้ความสนใจ</p>
        </div>

        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
          <ListTodo size={18} />
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
          <p className="text-sm text-red-600">
            ไม่สามารถโหลดรายการงานที่รอดำเนินการได้
          </p>

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
          <CheckCircle2 className="mx-auto mb-3 text-emerald-400" size={30} />

          <p className="text-sm font-medium text-slate-700">
            ไม่มีงานค้างแล้ว!
          </p>

          <p className="mt-1 text-xs text-slate-400">
            ขณะนี้ไม่มีงานที่รอดำเนินการ
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="divide-y divide-slate-100">
          {data.map((task) => {
            const overdue = isOverdue(task.due_date);

            return (
              <div
                key={task.id}
                className="flex gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    overdue
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {overdue ? (
                    <AlertCircle size={18} />
                  ) : (
                    <CalendarDays size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {task.title}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        task.status === "IN_PROGRESS"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {task.status === "IN_PROGRESS"
                        ? "กำลังดำเนินการ"
                        : "รอดำเนินการ"}
                    </span>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${getPriorityStyle(
                        task.priority,
                      )}`}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>

                  <p
                    className={`mt-2 flex items-center gap-1 text-xs ${
                      overdue ? "font-medium text-red-600" : "text-slate-400"
                    }`}
                  >
                    <Clock size={12} />

                    {overdue ? "เกินกำหนด · " : "ครบกำหนด · "}
                    {formatDueDate(task.due_date)}
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

export default PendingTasks;
