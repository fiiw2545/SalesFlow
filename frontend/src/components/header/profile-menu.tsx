import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, UserRound, X } from "lucide-react";

import { useAuth } from "../../features/auth/context/auth.context";
import LogoutButton from "../../features/auth/components/logout-button";

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="เปิดเมนูโปรไฟล์"
        className="flex shrink-0 items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
          {initials}
        </div>

        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-32 truncate text-sm font-semibold text-slate-700">
            {user?.name ?? "ผู้ใช้งาน"}
          </p>
          <p className="text-xs text-slate-400">บัญชีผู้ใช้</p>
        </div>

        <ChevronDown
          size={16}
          className={`hidden shrink-0 text-slate-400 transition-transform sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="ปิดเมนูโปรไฟล์"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />

          <div className="absolute right-0 z-40 mt-3 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="flex min-w-0 items-start gap-3 border-b border-slate-100 px-2 pb-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                {initials}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.name ?? "ผู้ใช้งาน"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email ?? ""}
                </p>
              </div>

              <button
                type="button"
                aria-label="ปิดเมนูโปรไฟล์"
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-2">
              <Link
                to="/my-account"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
              >
                <UserRound size={18} />
                <span>บัญชีของฉัน</span>
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <LogoutButton />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileMenu;
