import { Menu } from "lucide-react";

import Breadcrumb from "./breadcrumb";
import NotificationMenu from "./notification-menu";
import ProfileMenu from "./profile-menu";

import GlobalSearch from "../../features/search/components/global-search";

interface AppHeaderProps {
  onMenuClick: () => void;
}

function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full min-w-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
      {/* Left */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="เปิดเมนู"
          aria-haspopup="true"
          className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="min-w-0 overflow-hidden">
          <Breadcrumb />
        </div>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <GlobalSearch />

        <NotificationMenu />

        <div className="mx-1 h-8 w-px bg-slate-200 sm:mx-0" />

        <ProfileMenu />
      </div>
    </header>
  );
}

export default AppHeader;
