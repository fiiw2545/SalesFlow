import { useState } from "react";
import { Outlet } from "react-router";

import AppSidebar from "../components/sidebar/app-sidebar";
import AppHeader from "../components/header/app-header";
import { useOrganization } from "../features/organizations/context/organization.context";

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { isReady, isLoading, isError, organizations } = useOrganization();

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          กำลังเตรียมข้อมูลบัญชีของคุณ...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-red-600">
          ไม่สามารถโหลดข้อมูลองค์กรได้ กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">
          บัญชีนี้ยังไม่มีองค์กร กรุณาสร้างหรือเข้าร่วมองค์กรก่อนใช้งาน
        </p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">กำลังเตรียมองค์กร...</p>
      </div>
    );
  }

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
