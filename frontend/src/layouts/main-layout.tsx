import { useState } from "react";
import { Outlet } from "react-router";

import AppSidebar from "../components/sidebar/app-sidebar";
import AppHeader from "../components/header/app-header";

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50">
      <AppSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      <div className="min-h-screen min-w-0 md:pl-64">
        <AppHeader onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
