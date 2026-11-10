import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "../../features/notifications/hooks/use-notifications";

import type { NotificationItem } from "../../features/notifications/types/notification.types";

function formatNotificationDate(date: string) {
  return new Date(date).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationPath(notification: NotificationItem): string | null {
  if (!notification.entity_type || !notification.entity_id) {
    return null;
  }

  const entityType = notification.entity_type.toLowerCase();

  const routes: Record<string, string> = {
    deal: "/deals",
    deals: "/deals",
    activity: "/activities",
    activities: "/activities",
  };

  const path = routes[entityType];

  if (!path) return null;

  return `${path}?open=${encodeURIComponent(notification.entity_id)}`;
}

function NotificationMenu() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  const {
    data: notificationData,
    isLoading,
    isError,
  } = useNotifications(isOpen);

  const { data: unreadData } = useUnreadNotificationCount();

  const markReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();

  const notifications = notificationData?.items ?? [];
  const unreadCount = unreadData?.unread_count ?? 0;

  function handleNotificationClick(notification: NotificationItem) {
    // อ่านแล้วไม่ต้องเรียก API ซ้ำ
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }

    setIsOpen(false);

    const path = getNotificationPath(notification);

    if (path) {
      navigate(path);
    }
  }

  function handleMarkAllAsRead() {
    markAllMutation.mutate();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="การแจ้งเตือน"
        aria-expanded={isOpen}
        className="relative flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="ปิดการแจ้งเตือน"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />

          <div className="absolute right-0 z-40 mt-3 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-800">การแจ้งเตือน</h3>

                <p className="mt-1 text-xs text-slate-400">
                  {unreadCount > 0
                    ? `คุณมี ${unreadCount} รายการที่ยังไม่ได้อ่าน`
                    : "ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน"}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllMutation.isPending}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 transition hover:text-blue-700 disabled:opacity-50"
                >
                  <CheckCheck size={15} />
                  อ่านทั้งหมด
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center px-5 py-10 text-slate-400">
                  <LoaderCircle className="animate-spin" size={26} />
                  <p className="mt-3 text-sm">กำลังโหลดการแจ้งเตือน...</p>
                </div>
              ) : isError ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-red-500">
                    ไม่สามารถโหลดการแจ้งเตือนได้
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Bell className="mx-auto text-slate-300" size={28} />

                  <p className="mt-3 text-sm font-medium text-slate-600">
                    ยังไม่มีการแจ้งเตือน
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    เราจะแจ้งให้คุณทราบเมื่อมีเหตุการณ์ใหม่เกิดขึ้น
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                      !notification.is_read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex w-full items-start gap-3">
                      <div
                        className={`mt-1 size-2 shrink-0 rounded-full ${
                          notification.is_read
                            ? "bg-transparent"
                            : "bg-blue-500"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-sm leading-5 text-slate-600">
                          {notification.message}
                        </p>

                        <span className="mt-2 block text-xs text-slate-400">
                          {formatNotificationDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationMenu;
