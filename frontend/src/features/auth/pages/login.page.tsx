import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  LogIn,
  LoaderCircle,
} from "lucide-react";

import AuthLayout from "../components/auth-layout";
import { login } from "../services/auth.service";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";
import { setActiveOrganizationId } from "../../organizations/stores/organization.store";

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: login,

    onMutate: async () => {
      await queryClient.cancelQueries();

      // Clear the previous organization.
      setActiveOrganizationId(null);

      // Keep the application unauthenticated during login.
      queryClient.setQueryData(["auth", "me"], null);

      // Remove cached data from the previous account.
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
    },

    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], {
        id: user.id,
        name: user.name,
        email: user.email,
      });

      navigate("/", { replace: true });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const errorMessage =
    loginMutation.error instanceof AxiosError
      ? ((loginMutation.error.response?.data as { detail?: string })?.detail ??
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      : loginMutation.error
        ? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
        : null;

  return (
    <AuthLayout
      mode="login"
      title="ยินดีต้อนรับกลับสู่ SalesFlow"
      description="เข้าสู่ระบบเพื่อจัดการธุรกิจและติดตามโอกาสทางการขายของคุณ"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            อีเมลของคุณ
          </label>

          <div
            className={`flex items-center gap-3 rounded-xl border bg-white px-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 ${
              errors.email
                ? "border-red-400 focus-within:border-red-400"
                : "border-slate-200 focus-within:border-blue-500"
            }`}
          >
            <Mail size={19} className="shrink-0 text-slate-400" />

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className="h-13 min-w-0 flex-1 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-sm placeholder:text-slate-400"
            />
          </div>

          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            รหัสผ่าน
          </label>

          <div
            className={`flex items-center gap-3 rounded-xl border bg-white px-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 ${
              errors.password
                ? "border-red-400 focus-within:border-red-400"
                : "border-slate-200 focus-within:border-blue-500"
            }`}
          >
            <LockKeyhole size={19} className="shrink-0 text-slate-400" />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="กรอกรหัสผ่านของคุณ"
              {...register("password")}
              className="h-13 min-w-0 flex-1 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-sm placeholder:text-slate-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="shrink-0 text-slate-400 transition hover:text-blue-600"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* API Error */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {errorMessage}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loginMutation.isPending ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              กำลังเข้าสู่ระบบ...
            </>
          ) : (
            <>
              <LogIn size={20} />
              เข้าสู่ระบบ
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500">
        ยังไม่มีบัญชีใช่ไหม?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          สมัครสมาชิก
        </button>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
