import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AxiosError } from "axios";
import {
  Building2,
  Mail,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  User,
  LogIn,
} from "lucide-react";

import { useAuth } from "../../auth/context/auth.context";
import { useOrganization } from "../../organizations/context/organization.context";

import {
  useAcceptInvitation,
  useValidateInvitation,
} from "../hooks/use-invitations";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

function getInvitationErrorMessage(error: unknown): string {
  const message =
    error instanceof AxiosError
      ? String(error.response?.data?.detail ?? "")
      : "";

  const normalized = message.toLowerCase();

  if (
    normalized.includes("already accepted") ||
    normalized.includes("has been accepted")
  ) {
    return "คำเชิญนี้ได้รับการยอมรับไปแล้ว";
  }

  if (
    normalized.includes("revoked") ||
    normalized.includes("cancelled") ||
    normalized.includes("canceled")
  ) {
    return "คำเชิญนี้ถูกยกเลิกแล้ว";
  }

  if (normalized.includes("expired")) {
    return "คำเชิญนี้หมดอายุแล้ว กรุณาขอคำเชิญใหม่";
  }

  if (
    normalized.includes("no longer available") ||
    normalized.includes("already used")
  ) {
    return "คำเชิญนี้ถูกใช้งานไปแล้วหรือไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแล Organization";
  }

  if (normalized.includes("invalid") || normalized.includes("not found")) {
    return "ไม่พบคำเชิญนี้ ลิงก์อาจไม่ถูกต้อง";
  }

  return "ไม่สามารถตรวจสอบคำเชิญได้ กรุณาติดต่อผู้ดูแล Organization";
}

function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    isLoading: isOrganizationLoading,
    isReady,
    isError: isOrganizationError,
  } = useOrganization();

  const {
    data: invitation,
    isLoading: isValidationLoading,
    isError: isValidationError,
    error: validationError,
  } = useValidateInvitation(token);

  const acceptMutation = useAcceptInvitation();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  const acceptedOrganizationId = acceptMutation.data?.organization_id ?? null;

  // Select the organization returned by the backend after acceptance.
  useEffect(() => {
    if (!acceptedOrganizationId || !isAuthenticated || isOrganizationLoading) {
      return;
    }

    const organizationExists = organizations.some(
      (organization) => organization.id === acceptedOrganizationId,
    );

    if (organizationExists) {
      setActiveOrganization(acceptedOrganizationId);
    }
  }, [
    acceptedOrganizationId,
    isAuthenticated,
    isOrganizationLoading,
    organizations,
    setActiveOrganization,
  ]);

  // Navigate only after the invited organization is active and synchronized.
  useEffect(() => {
    if (
      acceptedOrganizationId &&
      isAuthenticated &&
      !isOrganizationLoading &&
      isReady &&
      activeOrganization?.id === acceptedOrganizationId
    ) {
      navigate("/", { replace: true });
    }
  }, [
    acceptedOrganizationId,
    isAuthenticated,
    isOrganizationLoading,
    isReady,
    activeOrganization?.id,
    navigate,
  ]);

  const handleAccept = () => {
    setFormError("");

    if (!token || !invitation) {
      return;
    }

    if (!isAuthenticated) {
      if (!name.trim()) {
        setFormError("กรุณากรอกชื่อ");
        return;
      }

      if (!password) {
        setFormError("กรุณากรอกรหัสผ่าน");
        return;
      }

      if (password !== confirmPassword) {
        setFormError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }

      acceptMutation.mutate({
        token,
        name: name.trim(),
        password,
      });

      return;
    }

    acceptMutation.mutate({ token });
  };

  const handleLogin = () => {
    const returnTo = `/accept-invitation?token=${encodeURIComponent(token)}`;

    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const errorMessage = acceptMutation.error
    ? getErrorMessage(
        acceptMutation.error,
        "ไม่สามารถยอมรับคำเชิญได้ กรุณาลองใหม่อีกครั้ง",
      )
    : formError;

  if (!token) {
    return (
      <InvitationLayout>
        <ErrorMessage message="ไม่พบ Invitation Token ในลิงก์นี้" />
      </InvitationLayout>
    );
  }

  if (isValidationLoading || isAuthLoading) {
    return (
      <InvitationLayout>
        <LoadingMessage message="กำลังตรวจสอบคำเชิญ..." />
      </InvitationLayout>
    );
  }

  if (isValidationError || !invitation) {
    return (
      <InvitationLayout>
        <div className="py-6 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-amber-500" />

          <h1 className="text-xl font-bold text-slate-800">
            ไม่สามารถรับคำเชิญได้
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {getInvitationErrorMessage(validationError)}
          </p>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ไปหน้า Login
          </button>

          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="ml-2 mt-6 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </InvitationLayout>
    );
  }

  if (acceptMutation.isSuccess) {
    return (
      <InvitationLayout>
        <div className="text-center">
          <CheckCircle2 size={52} className="mx-auto mb-4 text-green-500" />

          <h1 className="text-2xl font-bold text-slate-800">
            ยอมรับคำเชิญสำเร็จ
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            กำลังเข้าสู่ระบบและเตรียม Organization ของคุณ...
          </p>

          {isOrganizationError && (
            <p className="mt-4 text-sm text-red-600">
              ไม่สามารถโหลด Organization ได้ กรุณาลองเข้าสู่ระบบใหม่
            </p>
          )}

          <LoaderCircle
            size={22}
            className="mx-auto mt-5 animate-spin text-blue-600"
          />
        </div>
      </InvitationLayout>
    );
  }

  return (
    <InvitationLayout>
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Mail size={27} className="text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800">Accept Invitation</h1>

        <p className="mt-2 text-sm text-slate-500">
          คุณได้รับคำเชิญให้เข้าร่วม Organization ใน SalesFlow
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Building2 size={21} className="mt-0.5 shrink-0 text-blue-600" />

          <div className="min-w-0">
            <p className="text-xs text-slate-500">Organization</p>

            <p className="mt-1 font-semibold text-slate-800">
              {invitation.organization_name}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Mail size={19} className="shrink-0 text-slate-500" />

          <div className="min-w-0">
            <p className="text-xs text-slate-500">Invited email</p>
            <p className="break-all text-sm font-medium text-slate-700">
              {invitation.email}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ShieldCheck size={19} className="shrink-0 text-slate-500" />

          <div>
            <p className="text-xs text-slate-500">Organization role</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {invitation.role}
            </p>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          หากคุณมีบัญชี SalesFlow อยู่แล้ว กรุณา Login ด้วยอีเมลที่ได้รับคำเชิญ
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleAccept();
        }}
        className="space-y-4"
      >
        {!isAuthenticated && (
          <>
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                ชื่อของคุณ
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
                <User size={19} className="shrink-0 text-slate-400" />

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="กรอกชื่อของคุณ"
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                ตั้งรหัสผ่าน
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
                <LockKeyhole size={19} className="shrink-0 text-slate-400" />

                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                ยืนยันรหัสผ่าน
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
                <LockKeyhole size={19} className="shrink-0 text-slate-400" />

                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={acceptMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {acceptMutation.isPending ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              กำลังยอมรับคำเชิญ...
            </>
          ) : (
            <>
              <CheckCircle2 size={19} />
              Accept Invitation
            </>
          )}
        </button>
      </form>

      {!isAuthenticated && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">มีบัญชี SalesFlow อยู่แล้ว?</p>

          <button
            type="button"
            onClick={handleLogin}
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <LogIn size={17} />
            Login เพื่อยอมรับคำเชิญ
          </button>
        </div>
      )}
    </InvitationLayout>
  );
}

function InvitationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
        {children}
      </div>
    </div>
  );
}

function LoadingMessage({ message }: { message: string }) {
  return (
    <div className="py-10 text-center">
      <LoaderCircle
        size={32}
        className="mx-auto mb-4 animate-spin text-blue-600"
      />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="py-6 text-center">
      <AlertCircle size={42} className="mx-auto mb-4 text-red-500" />

      <h1 className="text-xl font-bold text-slate-800">
        ไม่สามารถรับคำเชิญได้
      </h1>

      <p className="mt-3 text-sm text-slate-500">{message}</p>

      <button
        type="button"
        onClick={() => navigateToLogin()}
        className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        ไปหน้า Login
      </button>
    </div>
  );
}

function navigateToLogin() {
  window.location.assign("/login");
}

export default AcceptInvitationPage;
