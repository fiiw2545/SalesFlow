import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  UserPlus,
  LoaderCircle,
} from "lucide-react";

import AuthLayout from "../components/auth-layout";
import { register as registerUser } from "../services/auth.service";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/register.schema";

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: () => {
      navigate("/login", { replace: true });
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  const errorMessage =
    registerMutation.error instanceof AxiosError
      ? ((registerMutation.error.response?.data as { detail?: string })
          ?.detail ?? "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่")
      : registerMutation.error
        ? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
        : null;

  return (
    <AuthLayout
      mode="register"
      title="เริ่มต้นใช้งาน SalesFlow"
      description="สร้างบัญชีของคุณเพื่อเริ่มจัดการลูกค้าและขยายธุรกิจไปพร้อมกับเรา"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            ชื่อผู้ใช้งาน
          </label>

          <div
            className={`flex items-center gap-3 rounded-xl border bg-white px-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 ${
              errors.name
                ? "border-red-400"
                : "border-slate-200 focus-within:border-blue-500"
            }`}
          >
            <UserRound size={19} className="shrink-0 text-slate-400" />

            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="ชื่อและนามสกุล"
              {...register("name")}
              className="h-13 min-w-0 flex-1 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-sm placeholder:text-slate-400"
            />
          </div>

          {errors.name && (
            <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            อีเมล
          </label>

          <div
            className={`flex items-center gap-3 rounded-xl border bg-white px-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 ${
              errors.email
                ? "border-red-400"
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
                ? "border-red-400"
                : "border-slate-200 focus-within:border-blue-500"
            }`}
          >
            <LockKeyhole size={19} className="shrink-0 text-slate-400" />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="อย่างน้อย 8 ตัวอักษร"
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

          <p className="mt-2 text-xs text-slate-400">
            รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร
          </p>
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
          disabled={registerMutation.isPending}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {registerMutation.isPending ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              กำลังสร้างบัญชี...
            </>
          ) : (
            <>
              <UserPlus size={20} />
              สร้างบัญชีผู้ใช้งาน
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500">
        มีบัญชีอยู่แล้ว?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
