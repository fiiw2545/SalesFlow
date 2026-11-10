import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Check,
  CircleDollarSign,
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  TrendingUp,
} from "lucide-react";

interface AuthLayoutProps {
  mode: "login" | "register";
  title: string;
  description: string;
  children: ReactNode;
}

const features = [
  "จัดการข้อมูลลูกค้าได้อย่างเป็นระบบ",
  "ติดตามดีลและโอกาสทางการขาย",
  "วิเคราะห์ข้อมูลเพื่อการเติบโต",
];

function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-12 w-full max-w-[540px]">
      <div className="absolute -inset-5 rounded-[32px] bg-blue-400/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-t-2xl border border-white/80 bg-white shadow-2xl shadow-blue-900/15">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>

          <div className="mx-auto rounded-md bg-slate-100 px-12 py-1 text-[9px] text-slate-400">
            app.salesflow.com
          </div>
        </div>

        <div className="flex min-h-[280px]">
          <aside className="hidden w-32 shrink-0 bg-slate-900 p-3 text-white sm:block">
            <div className="mb-6 flex items-center gap-1.5 text-xs font-bold">
              <ChartNoAxesCombined size={15} className="text-blue-400" />
              SalesFlow
            </div>

            {[
              { icon: LayoutDashboard, label: "Dashboard", active: true },
              { icon: BriefcaseBusiness, label: "Deals" },
              { icon: Users, label: "Contacts" },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-[9px] ${
                  active ? "bg-blue-600 text-white" : "text-slate-400"
                }`}
              >
                <Icon size={12} />
                {label}
              </div>
            ))}
          </aside>

          <div className="min-w-0 flex-1 bg-slate-50 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400">Overview</p>
                <h3 className="text-sm font-bold text-slate-800">Dashboard</h3>
              </div>
              <span className="rounded-md bg-white px-2 py-1 text-[9px] text-slate-500 shadow-sm">
                This month
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Total Deals",
                  value: "฿650K",
                  icon: CircleDollarSign,
                },
                { label: "Won Deals", value: "฿320K", icon: TrendingUp },
                { label: "Customers", value: "128", icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-white p-2.5"
                >
                  <Icon size={14} className="mb-2 text-blue-500" />
                  <p className="text-[8px] text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-5 gap-3">
              <div className="col-span-3 rounded-xl border border-slate-100 bg-white p-3">
                <p className="mb-3 text-[9px] font-semibold text-slate-700">
                  Sales Performance
                </p>

                <div className="flex h-20 items-end gap-2">
                  {[35, 55, 42, 72, 58, 85, 68, 95].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-600 to-sky-400"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className="mt-2 flex justify-between text-[7px] text-slate-400">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                </div>
              </div>

              <div className="col-span-2 rounded-xl border border-slate-100 bg-white p-3">
                <p className="mb-3 text-[9px] font-semibold text-slate-700">
                  Deal Status
                </p>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[9px] border-blue-500 border-r-emerald-400 border-b-amber-400">
                  <span className="text-[9px] font-bold text-slate-700">
                    68%
                  </span>
                </div>

                <p className="mt-2 text-center text-[8px] text-slate-400">
                  Conversion
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -right-3 flex items-center gap-3 rounded-xl border border-white bg-white px-4 py-3 shadow-xl sm:-right-6">
        <div className="rounded-lg bg-emerald-50 p-2">
          <TrendingUp size={18} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[9px] text-slate-400">Business Growth</p>
          <p className="text-sm font-bold text-slate-800">+24.8%</p>
        </div>
        <ArrowUpRight size={15} className="text-emerald-500" />
      </div>
    </div>
  );
}

function AuthLayout({ mode, title, description, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:min-h-screen lg:grid-cols-2 lg:items-stretch">
      {/* Brand Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 px-6 py-8 sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
        <div className="pointer-events-none absolute -left-32 top-40 -z-10 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

        <Link to="/login" className="inline-flex w-fit items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <ChartNoAxesCombined size={27} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Sales<span className="text-blue-600">Flow</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Grow Your Business, Together
            </p>
          </div>
        </Link>

        <div className="mx-auto mt-12 max-w-xl lg:mt-0">
          <p className="mb-4 text-sm font-semibold tracking-wide text-blue-700">
            YOUR BUSINESS. ONE PLATFORM.
          </p>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl xl:text-5xl">
            จัดการลูกค้า
            <br />
            <span className="text-blue-600">ปิดการขายได้มากขึ้น</span>
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
            ระบบ CRM ที่ช่วยให้คุณติดตามดีล จัดการลูกค้า และวางแผนการขาย
            ได้อย่างมีประสิทธิภาพในที่เดียว
          </p>

          <div className="mt-7 space-y-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <DashboardPreview />
        </div>

        <p className="mt-16 text-xs text-slate-500 lg:mt-10">
          © 2026 SalesFlow. All rights reserved.
        </p>
      </section>

      {/* Authentication Section */}
      <section className="flex min-h-[650px] items-center justify-center bg-white px-5 py-12 sm:px-10 lg:min-h-screen lg:px-12 lg:py-16">
        <div className="w-full max-w-md">
          <div className="mb-9 grid grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1.5">
            <Link
              to="/login"
              aria-current={mode === "login" ? "page" : undefined}
              className={`rounded-full py-3 text-center text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-500 hover:text-blue-600"
              }`}
            >
              เข้าสู่ระบบ
            </Link>

            <Link
              to="/register"
              aria-current={mode === "register" ? "page" : undefined}
              className={`rounded-full py-3 text-center text-sm font-semibold transition-all ${
                mode === "register"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-500 hover:text-blue-600"
              }`}
            >
              สมัครสมาชิก
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              {description}
            </p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
