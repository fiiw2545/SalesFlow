import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import {
  UserRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Fingerprint,
} from "lucide-react";

import PageHeader from "../../../components/ui/page-header";
import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import { useToast } from "../../../components/common/toast-provider";

import { useAuth } from "../context/auth.context";
import { updateProfile, changePassword } from "../services/auth.service";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.detail ??
      error.response?.data?.message ??
      "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
    );
  }

  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

function MyAccountPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      refreshUser();
      showToast("แก้ไขข้อมูลผู้ใช้สำเร็จ", "success");
    },
    onError: (error: unknown) => {
      showToast(getErrorMessage(error), "error");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("เปลี่ยนรหัสผ่านสำเร็จ", "success");
    },
    onError: (error: unknown) => {
      showToast(getErrorMessage(error), "error");
    },
  });

  const handleUpdateProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      showToast("ชื่อต้องมีอย่างน้อย 2 ตัวอักษร", "error");
      return;
    }

    if (trimmedName.length > 100) {
      showToast("ชื่อต้องไม่เกิน 100 ตัวอักษร", "error");
      return;
    }

    if (trimmedName === user?.name) {
      showToast("ไม่มีข้อมูลที่ต้องแก้ไข", "error");
      return;
    }

    profileMutation.mutate({
      name: trimmedName,
    });
  };

  const handleChangePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8 || newPassword.length > 128) {
      showToast("รหัสผ่านใหม่ต้องมีความยาว 8–128 ตัวอักษร", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน", "error");
      return;
    }

    if (currentPassword === newPassword) {
      showToast("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน", "error");
      return;
    }

    passwordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        ไม่สามารถโหลดข้อมูลบัญชีผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Account"
        description="จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชีผู้ใช้"
      />

      {/* Account Information */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">ข้อมูลบัญชี</h2>
            <p className="text-sm text-slate-500">ข้อมูลส่วนตัวของคุณ</p>
          </div>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Fingerprint size={16} />
              User ID
            </div>

            <div className="break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
              {user.id}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Mail size={16} />
              Email
            </div>

            <div className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="break-all text-sm text-slate-700">
                {user.email}
              </span>

              <ShieldCheck size={17} className="shrink-0 text-green-600" />
            </div>

            <p className="text-xs text-slate-500">Email ไม่สามารถแก้ไขได้</p>
          </div>
        </div>
      </section>

      {/* Update Profile */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">แก้ไขข้อมูลส่วนตัว</h2>
            <p className="text-sm text-slate-500">
              เปลี่ยนชื่อที่ใช้แสดงในระบบ
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5 p-6">
          <div className="max-w-xl">
            <Input
              label="ชื่อผู้ใช้"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="กรอกชื่อผู้ใช้"
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <Button
              type="submit"
              loading={profileMutation.isPending}
              disabled={name.trim() === user.name}
            >
              บันทึกข้อมูล
            </Button>
          </div>
        </form>
      </section>

      {/* Change Password */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <LockKeyhole size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">เปลี่ยนรหัสผ่าน</h2>
            <p className="text-sm text-slate-500">
              ตั้งรหัสผ่านใหม่เพื่อรักษาความปลอดภัยของบัญชี
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="max-w-xl">
                <Input
                  label="รหัสผ่านปัจจุบัน"
                  name="current_password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  required
                />
              </div>
            </div>

            <Input
              label="รหัสผ่านใหม่"
              name="new_password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="กรอกรหัสผ่านใหม่"
              minLength={8}
              maxLength={128}
              required
            />

            <Input
              label="ยืนยันรหัสผ่านใหม่"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <p className="text-xs text-slate-500">
            รหัสผ่านใหม่ต้องมีความยาว 8–128 ตัวอักษร
          </p>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <Button
              type="submit"
              loading={passwordMutation.isPending}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              เปลี่ยนรหัสผ่าน
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default MyAccountPage;
