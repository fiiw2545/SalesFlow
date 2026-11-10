import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import Pagination from "../../../components/ui/pagination";
import { getOrganizations } from "../services/organization.service";

import {
  Building2,
  Plus,
  Pencil,
  Power,
  CalendarDays,
  ShieldCheck,
  LoaderCircle,
  Crown,
  Globe,
  Check,
} from "lucide-react";

import { useOrganization } from "../context/organization.context";

import {
  createOrganization,
  updateOrganization,
  deactivateOrganization,
} from "../services/organization.service";

import type {
  Organization,
  OrganizationCreatePayload,
  OrganizationUpdatePayload,
} from "../types/organization.types";

import { useToast } from "../../../components/common/toast-provider";
import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Modal from "../../../components/common/modal";

import PageHeader from "../../../components/ui/page-header";

type ModalMode = "create" | "edit";

const emptyForm: OrganizationCreatePayload = {
  name: "",
  slug: "",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getRoleLabel(role: string): string {
  const roles: Record<string, string> = {
    ADMIN: "ผู้ดูแลระบบ",
    MANAGER: "ผู้จัดการ",
    SALES: "พนักงานขาย",
  };

  return roles[role] ?? role;
}

function OrganizationPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    isLoading,
    isError,
  } = useOrganization();

  const organizationsPageQuery = useQuery({
    queryKey: ["organizations", "page", page, limit],
    queryFn: () => getOrganizations(page, limit),
  });

  const paginatedOrganizations = organizationsPageQuery.data?.items ?? [];
  const total = organizationsPageQuery.data?.total ?? 0;
  const totalPages = organizationsPageQuery.data?.total_pages ?? 0;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    } else if (totalPages === 0 && page > 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");

  const [form, setForm] = useState<OrganizationCreatePayload>(emptyForm);
  const [formError, setFormError] = useState("");

  const isAdmin = activeOrganization?.role === "ADMIN";

  const createMutation = useMutation({
    mutationFn: createOrganization,

    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["organizations"],
      });

      setActiveOrganization(result.organization.id);
      setPage(1);

      showToast("สร้างองค์กรเรียบร้อยแล้ว", "success");
      closeModal();
    },

    onError: (error) => {
      showToast(getErrorMessage(error), "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: OrganizationUpdatePayload;
    }) => updateOrganization(id, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["organizations"],
      });

      showToast("แก้ไขข้อมูลองค์กรเรียบร้อยแล้ว", "success");
      closeModal();
    },

    onError: (error) => {
      showToast(getErrorMessage(error), "error");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateOrganization,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["organizations"],
      });

      showToast("ปิดใช้งานองค์กรเรียบร้อยแล้ว", "success");
    },

    onError: (error) => {
      showToast(getErrorMessage(error), "error");
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    setForm(emptyForm);
    setFormError("");
  }, [activeOrganization?.id]);

  function openCreateModal() {
    setModalMode("create");
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal() {
    if (!activeOrganization || activeOrganization.role !== "ADMIN") {
      return;
    }

    setModalMode("edit");

    setForm({
      name: activeOrganization.name,
      slug: activeOrganization.slug,
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setForm(emptyForm);
    setFormError("");
  }

  function handleChange(field: keyof OrganizationCreatePayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const payload: OrganizationCreatePayload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
    };

    if (payload.name.length < 2 || payload.name.length > 100) {
      setFormError("ชื่อองค์กรต้องมีความยาว 2–100 ตัวอักษร");
      return;
    }

    if (
      payload.slug.length < 2 ||
      payload.slug.length > 100 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)
    ) {
      setFormError(
        "Slug ต้องเป็นภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และใช้เครื่องหมาย - คั่นคำเท่านั้น",
      );
      return;
    }

    if (modalMode === "edit") {
      if (!activeOrganization || activeOrganization.role !== "ADMIN") {
        setFormError("คุณไม่มีสิทธิ์แก้ไขข้อมูลองค์กร");
        return;
      }

      const updatePayload: OrganizationUpdatePayload = {};

      if (payload.name !== activeOrganization.name) {
        updatePayload.name = payload.name;
      }

      if (payload.slug !== activeOrganization.slug) {
        updatePayload.slug = payload.slug;
      }

      if (Object.keys(updatePayload).length === 0) {
        setFormError("กรุณาแก้ไขข้อมูลอย่างน้อยหนึ่งรายการ");
        return;
      }

      updateMutation.mutate({
        id: activeOrganization.id,
        payload: updatePayload,
      });

      return;
    }

    createMutation.mutate(payload);
  }

  async function handleDeactivate(organization: Organization) {
    if (organization.role !== "ADMIN") {
      showToast("เฉพาะผู้ดูแลระบบเท่านั้นที่ปิดใช้งานองค์กรได้", "error");
      return;
    }

    const confirmed = window.confirm(
      `คุณต้องการปิดใช้งานองค์กร "${organization.name}" ใช่หรือไม่?\n\nการดำเนินการนี้เป็นการปิดใช้งาน ไม่ใช่การลบข้อมูลถาวร`,
    );

    if (!confirmed) {
      return;
    }

    deactivateMutation.mutateAsync(organization.id);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        โหลดข้อมูลองค์กรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="องค์กร"
        description="ดูและจัดการข้อมูลองค์กรที่คุณเป็นสมาชิก"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={18} />
            สร้างองค์กร
          </Button>
        }
      />

      {!activeOrganization ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <Building2 className="mx-auto text-slate-300" size={40} />

          <h2 className="mt-4 text-base font-semibold text-slate-900">
            ยังไม่มีองค์กร
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            สร้างองค์กรเพื่อเริ่มต้นใช้งาน SalesFlow
          </p>

          <Button className="mt-4" onClick={openCreateModal}>
            <Plus size={16} />
            สร้างองค์กร
          </Button>
        </div>
      ) : (
        <>
          {organizations.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <label
                htmlFor="organization-selector"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                เลือกองค์กร
              </label>

              <select
                id="organization-selector"
                value={activeOrganization.id}
                onChange={(event) => setActiveOrganization(event.target.value)}
                className="h-10 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={28} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-slate-900">
                    {activeOrganization.name}
                  </h2>

                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    <Check size={13} />
                    องค์กรปัจจุบัน
                  </span>
                </div>

                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Globe size={14} />
                  {activeOrganization.slug}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                    activeOrganization.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      activeOrganization.is_active
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  {activeOrganization.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                  <Crown size={13} />
                  {activeOrganization.plan}
                </span>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <InfoItem
                icon={<Building2 size={18} />}
                label="ชื่อองค์กร"
                value={activeOrganization.name}
              />

              <InfoItem
                icon={<Globe size={18} />}
                label="Organization Slug"
                value={activeOrganization.slug}
              />

              <InfoItem
                icon={<Crown size={18} />}
                label="แพ็กเกจ"
                value={activeOrganization.plan}
              />

              <InfoItem
                icon={<ShieldCheck size={18} />}
                label="บทบาทของคุณ"
                value={getRoleLabel(activeOrganization.role)}
              />

              <InfoItem
                icon={<CalendarDays size={18} />}
                label="วันที่สร้างองค์กร"
                value={formatDate(activeOrganization.created_at)}
              />

              <InfoItem
                icon={<CalendarDays size={18} />}
                label="แก้ไขล่าสุด"
                value={formatDate(activeOrganization.updated_at)}
              />
            </div>
          </div>

          {isAdmin ? (
            <div className="rounded-xl border border-red-200 bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    การจัดการองค์กร
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    คุณสามารถแก้ไขข้อมูลพื้นฐานหรือปิดใช้งานองค์กรนี้ได้
                    การปิดใช้งานไม่ใช่การลบข้อมูลถาวร
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="outline" onClick={openEditModal}>
                    <Pencil size={16} />
                    แก้ไขข้อมูล
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => handleDeactivate(activeOrganization)}
                    loading={deactivateMutation.isPending}
                    disabled={deactivateMutation.isPending}
                  >
                    <Power size={16} />
                    ปิดใช้งาน
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <ShieldCheck className="mr-2 inline-block" size={17} />
              คุณสามารถดูข้อมูลองค์กรได้ แต่ไม่มีสิทธิ์แก้ไขหรือปิดใช้งานองค์กร
            </div>
          )}
        </>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            องค์กรของฉัน
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            คุณเป็นสมาชิกของ {total} องค์กร
          </p>
        </div>

        {organizationsPageQuery.isLoading ? (
          <div className="flex min-h-[150px] items-center justify-center rounded-xl border border-slate-200 bg-white">
            <LoaderCircle className="animate-spin text-blue-600" size={28} />
          </div>
        ) : organizationsPageQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm text-red-600">โหลดรายการองค์กรไม่สำเร็จ</p>

            <Button
              variant="outline"
              className="mt-3"
              onClick={() => organizationsPageQuery.refetch()}
            >
              ลองอีกครั้ง
            </Button>
          </div>
        ) : paginatedOrganizations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            ยังไม่มีองค์กรในรายการ
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {paginatedOrganizations.map((organization) => {
                const isActive = organization.id === activeOrganization?.id;

                return (
                  <button
                    key={organization.id}
                    type="button"
                    onClick={() => setActiveOrganization(organization.id)}
                    className={`flex items-start gap-3 rounded-xl border bg-white p-5 text-left transition ${
                      isActive
                        ? "border-blue-300 ring-1 ring-blue-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Building2 size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {organization.name}
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {organization.slug}
                          </p>
                        </div>

                        {isActive && (
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600">
                            <Check size={14} />
                            เลือกแล้ว
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {getRoleLabel(organization.role)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {organization.plan}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === "edit" ? "แก้ไขข้อมูลองค์กร" : "สร้างองค์กรใหม่"}
        description={
          modalMode === "edit"
            ? "แก้ไขชื่อและ Slug ขององค์กร"
            : "กรอกข้อมูลเพื่อสร้างองค์กรใหม่"
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <Input
            label="ชื่อองค์กร"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="กรอกชื่อองค์กร"
          />

          <Input
            label="Organization Slug"
            name="slug"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={form.slug}
            onChange={(event) =>
              handleChange("slug", event.target.value.toLowerCase())
            }
            placeholder="sales-flow"
            helperText="ใช้ภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และเครื่องหมาย - เท่านั้น"
          />

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isSaving}
            >
              ยกเลิก
            </Button>

            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {modalMode === "edit" ? "บันทึกการเปลี่ยนแปลง" : "สร้างองค์กร"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export default OrganizationPage;
