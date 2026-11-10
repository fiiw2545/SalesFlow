import { NavLink } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  BriefcaseBusiness,
  CheckSquare,
  CalendarDays,
  StickyNote,
  GitBranch,
  Tags,
  Building,
  UserCog,
  X,
} from "lucide-react";

type AppSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type MenuItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "ภาพรวม",
    items: [{ label: "แดชบอร์ด", path: "/", icon: LayoutDashboard }],
  },
  {
    label: "การจัดการลูกค้า",
    items: [
      { label: "บริษัท", path: "/companies", icon: Building2 },
      { label: "ผู้ติดต่อ", path: "/contacts", icon: Users },
      { label: "ดีลการขาย", path: "/deals", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "พื้นที่ทำงาน",
    items: [
      { label: "งานที่ต้องทำ", path: "/tasks", icon: CheckSquare },
      { label: "กิจกรรม", path: "/activities", icon: CalendarDays },
      { label: "บันทึก", path: "/notes", icon: StickyNote },
    ],
  },
  {
    label: "การตั้งค่าและจัดการ",
    items: [
      { label: "กระบวนการขาย", path: "/pipelines", icon: GitBranch },
      { label: "แท็ก", path: "/tags", icon: Tags },
      { label: "องค์กร", path: "/organization", icon: Building },
      { label: "สมาชิก", path: "/members", icon: UserCog },
    ],
  },
];

function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="เมนูหลัก"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out md:translate-x-0 md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="relative flex h-16 shrink-0 items-center border-b border-slate-100 px-6">
          <span className="text-2xl font-bold tracking-tight text-blue-600">
            SalesFlow
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดเมนู"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 space-y-7 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-6">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-400">
                {group.label}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`
                      }
                    >
                      <Icon size={19} strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-slate-100 p-4">
          <p className="text-xs text-slate-400">SalesFlow CRM</p>
          <p className="mt-1 text-xs text-slate-400">เวอร์ชัน 1.0.0</p>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
