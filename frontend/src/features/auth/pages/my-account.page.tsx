import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import axios from "axios";
import { invalidateAvatarCache } from "../utils/avatar-cache";
import { useMutation } from "@tanstack/react-query";
import {
  UserRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Fingerprint,
  Camera,
  Trash2,
} from "lucide-react";

import UserAvatar from "../components/user-avatar";
import { uploadAvatar, removeAvatar } from "../../files/services/file.service";
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

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const avatarUploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      invalidateAvatarCache(user?.avatar_file_id);
      refreshUser();
      showToast("Avatar uploaded successfully", "success");
    },
    onError: (error: unknown) => {
      showToast(getErrorMessage(error), "error");
    },
  });

  const avatarRemoveMutation = useMutation({
    mutationFn: removeAvatar,
    onSuccess: () => {
      invalidateAvatarCache(user?.avatar_file_id);
      refreshUser();
      showToast("Avatar removed successfully", "success");
    },
    onError: (error: unknown) => {
      showToast(getErrorMessage(error), "error");
    },
  });

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      showToast("Please select JPG, PNG, GIF, or WEBP", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Maximum image size is 10 MB", "error");
      event.target.value = "";
      return;
    }

    avatarUploadMutation.mutate(file);
    event.target.value = "";
  };

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

      {/* Profile Avatar */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Camera size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">Profile Avatar</h2>
            <p className="text-sm text-slate-500">
              Manage your profile picture
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <UserAvatar
            fileId={user.avatar_file_id}
            name={user.name}
            className="size-24 text-2xl"
          />

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Your profile picture
              </p>
              <p className="text-xs text-slate-500">
                JPG, PNG, GIF or WEBP. Maximum 10 MB.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploadMutation.isPending}
              />

              <Button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                loading={avatarUploadMutation.isPending}
                disabled={avatarRemoveMutation.isPending}
              >
                <Camera size={16} />
                Upload Avatar
              </Button>

              {user.avatar_file_id && (
                <Button
                  type="button"
                  variant="ghost"
                  loading={avatarRemoveMutation.isPending}
                  disabled={avatarUploadMutation.isPending}
                  onClick={() => avatarRemoveMutation.mutate()}
                >
                  <Trash2 size={16} />
                  Remove Avatar
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

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
