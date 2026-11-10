import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import PageHeader from "../../../components/ui/page-header";
import DataTable from "../../../components/ui/data-table";
import SearchInput from "../../../components/ui/search-input";
import Pagination from "../../../components/ui/pagination";

import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Select from "../../../components/common/select";
import Textarea from "../../../components/common/textarea";
import Modal from "../../../components/common/modal";
import Badge from "../../../components/common/badge";
import { useSearchParams } from "react-router";
import { useToast } from "../../../components/common/toast-provider";

import {
  useActivities,
  useActivity,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from "../hooks/use-activities";

import { useDeals } from "../../deals/hooks/use-deals";
import { useContacts } from "../../contacts/hooks/use-contacts";

import type { Activity, ActivityPayload } from "../types/activity.types";
import type { Deal } from "../../deals/types/deal.types";
import type { Contact } from "../../contacts/types/contact.types";

interface ActivityFormData {
  subject: string;
  type: string;
  description: string;
  deal_id: string;
  contact_id: string;
}

const initialForm: ActivityFormData = {
  subject: "",
  type: "CALL",
  description: "",
  deal_id: "",
  contact_id: "",
};

const activityTypes = [
  { label: "โทรศัพท์", value: "CALL" },
  { label: "ประชุม", value: "MEETING" },
  { label: "อีเมล", value: "EMAIL" },
  { label: "งาน", value: "TASK" },
  { label: "อื่น ๆ", value: "OTHER" },
];

function normalizeId(id: string | null | undefined): string {
  if (!id) return "";

  return id.includes(":") ? id.split(":").slice(1).join(":") : id;
}

function getTypeLabel(type: string): string {
  return activityTypes.find((item) => item.value === type)?.label ?? type;
}

function getTypeVariant(type: string) {
  switch (type) {
    case "CALL":
      return "info";
    case "MEETING":
      return "success";
    case "EMAIL":
      return "primary";
    case "TASK":
      return "warning";
    default:
      return "default";
  }
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getErrorMessage(error: unknown): string {
  const apiError = error as {
    response?: {
      data?: {
        detail?: string;
        message?: string;
      };
    };
    message?: string;
  };

  return (
    apiError.response?.data?.detail ||
    apiError.response?.data?.message ||
    apiError.message ||
    "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง"
  );
}

function ActivitiesPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const targetActivityId = searchParams.get("open") ?? "";
  const targetActivityQuery = useActivity(targetActivityId);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const activitiesQuery = useActivities(page, limit);
  const dealsQuery = useDeals(1, 100);
  const contactsQuery = useContacts(1, 100);

  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();
  const deleteMutation = useDeleteActivity();

  const activities = activitiesQuery.data?.items ?? [];
  const total = activitiesQuery.data?.total ?? 0;
  const totalPages = activitiesQuery.data?.total_pages ?? 0;

  const deals = dealsQuery.data?.items ?? [];
  const contacts = contactsQuery.data?.data ?? [];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const [form, setForm] = useState<ActivityFormData>(initialForm);
  const [formError, setFormError] = useState("");

  const dealMap = useMemo(
    () => new Map(deals.map((deal: Deal) => [normalizeId(deal.id), deal])),
    [deals],
  );

  const contactMap = useMemo(
    () =>
      new Map(
        contacts.map((contact: Contact) => [normalizeId(contact.id), contact]),
      ),
    [contacts],
  );

  const filteredActivities = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return activities.filter((activity: Activity) => {
      const deal = dealMap.get(normalizeId(activity.deal_id));
      const contact = contactMap.get(normalizeId(activity.contact_id));

      const matchesSearch =
        !keyword ||
        activity.subject.toLowerCase().includes(keyword) ||
        (activity.description ?? "").toLowerCase().includes(keyword) ||
        (deal?.title ?? "").toLowerCase().includes(keyword) ||
        (contact?.name ?? "").toLowerCase().includes(keyword);

      const matchesType = !typeFilter || activity.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [activities, search, typeFilter, dealMap, contactMap]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }

    if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  function updateForm<K extends keyof ActivityFormData>(
    field: K,
    value: ActivityFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingActivity(null);
    setForm(initialForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(activity: Activity) {
    setEditingActivity(activity);

    setForm({
      subject: activity.subject,
      type: activity.type,
      description: activity.description ?? "",
      deal_id: activity.deal_id ?? "",
      contact_id: activity.contact_id ?? "",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  useEffect(() => {
    if (!targetActivityId) return;

    if (targetActivityQuery.isError) {
      showToast("ไม่พบกิจกรรมที่ต้องการเปิด", "error");

      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("open");
          return next;
        },
        { replace: true },
      );

      return;
    }

    if (!targetActivityQuery.isSuccess) return;

    openEditModal(targetActivityQuery.data);

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("open");
        return next;
      },
      { replace: true },
    );
  }, [
    targetActivityId,
    targetActivityQuery.isSuccess,
    targetActivityQuery.isError,
    targetActivityQuery.data,
    setSearchParams,
    showToast,
  ]);

  function closeModal() {
    setIsModalOpen(false);
    setEditingActivity(null);
    setForm(initialForm);
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const payload: ActivityPayload = {
      subject: form.subject.trim(),
      type: form.type,
      description: form.description.trim() || null,
      deal_id: form.deal_id || null,
      contact_id: form.contact_id || null,
    };

    try {
      if (editingActivity) {
        await updateMutation.mutateAsync({
          id: editingActivity.id,
          payload,
        });

        showToast("แก้ไขกิจกรรมเรียบร้อยแล้ว", "success");
      } else {
        await createMutation.mutateAsync(payload);

        showToast("เพิ่มกิจกรรมเรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function handleDelete(activity: Activity) {
    const confirmed = window.confirm(
      `คุณต้องการลบกิจกรรม "${activity.subject}" หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(activity.id);
      showToast("ลบกิจกรรมเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const columns = [
    {
      key: "subject",
      header: "หัวข้อกิจกรรม",
      render: (activity: Activity) => (
        <div>
          <p className="font-medium text-slate-900">{activity.subject}</p>
          {activity.description && (
            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
              {activity.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "ประเภท",
      render: (activity: Activity) => (
        <Badge variant={getTypeVariant(activity.type)}>
          {getTypeLabel(activity.type)}
        </Badge>
      ),
    },
    {
      key: "deal",
      header: "ดีล",
      render: (activity: Activity) => (
        <span>{dealMap.get(normalizeId(activity.deal_id))?.title ?? "—"}</span>
      ),
    },
    {
      key: "contact",
      header: "ผู้ติดต่อ",
      render: (activity: Activity) => (
        <span>
          {contactMap.get(normalizeId(activity.contact_id))?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "วันที่สร้าง",
      render: (activity: Activity) => (
        <span className="whitespace-nowrap">
          {formatDate(activity.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (activity: Activity) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(activity)}
            aria-label="แก้ไขกิจกรรม"
          >
            <Pencil size={16} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(activity)}
            aria-label="ลบกิจกรรม"
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isLoading =
    activitiesQuery.isLoading ||
    dealsQuery.isLoading ||
    contactsQuery.isLoading;

  const isError =
    activitiesQuery.isError || dealsQuery.isError || contactsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="กิจกรรม"
        description="จัดการประวัติการติดต่อและกิจกรรมที่เกี่ยวข้องกับลูกค้า"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            <span className="ml-2">เพิ่มกิจกรรม</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="ค้นหากิจกรรม..."
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            aria-label="กรองตามประเภทกิจกรรม"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={[{ label: "ทุกประเภท", value: "" }, ...activityTypes]}
          />
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          ไม่สามารถโหลดข้อมูลกิจกรรม ดีล หรือผู้ติดต่อได้
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <p className="text-sm text-slate-500">ทั้งหมด {total} กิจกรรม</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <DataTable
              columns={columns}
              data={filteredActivities}
              getRowKey={(activity: Activity) => activity.id}
              loading={isLoading}
              emptyTitle="ไม่พบกิจกรรม"
              emptyDescription={
                search || typeFilter
                  ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                  : "เริ่มต้นด้วยการเพิ่มกิจกรรมแรกของคุณ"
              }
            />

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
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingActivity ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}
        description={
          editingActivity
            ? "แก้ไขรายละเอียดกิจกรรม"
            : "บันทึกกิจกรรมใหม่ในระบบ CRM"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <Input
            label="หัวข้อกิจกรรม"
            name="subject"
            value={form.subject}
            onChange={(event) => updateForm("subject", event.target.value)}
            placeholder="เช่น โทรติดต่อลูกค้าเพื่อแนะนำบริการ"
            required
            minLength={2}
            maxLength={150}
          />

          <Select
            label="ประเภทกิจกรรม"
            name="type"
            value={form.type}
            onChange={(event) => updateForm("type", event.target.value)}
            options={activityTypes}
            required
          />

          <Textarea
            label="รายละเอียด"
            name="description"
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
            rows={4}
          />

          <Select
            label="ดีลที่เกี่ยวข้อง"
            name="deal_id"
            value={form.deal_id}
            onChange={(event) => updateForm("deal_id", event.target.value)}
            options={deals.map((deal: Deal) => ({
              label: deal.title,
              value: deal.id,
            }))}
            placeholder="ไม่เชื่อมโยงดีล"
          />

          <Select
            label="ผู้ติดต่อที่เกี่ยวข้อง"
            name="contact_id"
            value={form.contact_id}
            onChange={(event) => updateForm("contact_id", event.target.value)}
            options={contacts.map((contact: Contact) => ({
              label: contact.name,
              value: contact.id,
            }))}
            placeholder="ไม่เชื่อมโยงผู้ติดต่อ"
          />

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </p>
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
              {editingActivity ? "บันทึกการแก้ไข" : "เพิ่มกิจกรรม"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ActivitiesPage;
