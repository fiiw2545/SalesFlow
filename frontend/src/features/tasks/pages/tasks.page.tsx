import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import Pagination from "../../../components/ui/pagination";
import PageHeader from "../../../components/ui/page-header";
import DataTable from "../../../components/ui/data-table";
import SearchInput from "../../../components/ui/search-input";

import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Select from "../../../components/common/select";
import Textarea from "../../../components/common/textarea";
import Modal from "../../../components/common/modal";
import Badge from "../../../components/common/badge";
import { useToast } from "../../../components/common/toast-provider";

import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "../hooks/use-tasks";

import { useDeals } from "../../deals/hooks/use-deals";
import { useContacts } from "../../contacts/hooks/use-contacts";

import type {
  Task,
  TaskPayload,
  TaskStatus,
  TaskPriority,
} from "../types/task.types";

import type { Deal } from "../../deals/types/deal.types";
import type { Contact } from "../../contacts/types/contact.types";

interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  priority: TaskPriority;
  status: TaskStatus;
  deal_id: string;
  contact_id: string;
}

const initialForm: TaskFormData = {
  title: "",
  description: "",
  due_date: "",
  due_time: "",
  priority: "MEDIUM",
  status: "PENDING",
  deal_id: "",
  contact_id: "",
};

const statusOptions = [
  { label: "รอดำเนินการ", value: "PENDING" },
  { label: "กำลังดำเนินการ", value: "IN_PROGRESS" },
  { label: "เสร็จสิ้น", value: "COMPLETED" },
  { label: "ยกเลิก", value: "CANCELLED" },
];

const priorityOptions = [
  { label: "ต่ำ", value: "LOW" },
  { label: "ปานกลาง", value: "MEDIUM" },
  { label: "สูง", value: "HIGH" },
  { label: "เร่งด่วน", value: "URGENT" },
];

const APP_TIMEZONE = "Asia/Bangkok";

function normalizeId(id: string | null | undefined): string {
  if (!id) return "";

  return id.includes(":") ? id.split(":").slice(1).join(":") : id;
}

function getStatusLabel(status: TaskStatus): string {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function getPriorityLabel(priority: TaskPriority): string {
  return (
    priorityOptions.find((item) => item.value === priority)?.label ?? priority
  );
}

function getStatusVariant(status: TaskStatus) {
  switch (status) {
    case "PENDING":
      return "warning";
    case "IN_PROGRESS":
      return "info";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "default";
    default:
      return "default";
  }
}

function getPriorityVariant(priority: TaskPriority) {
  switch (priority) {
    case "LOW":
      return "default";
    case "MEDIUM":
      return "info";
    case "HIGH":
      return "warning";
    case "URGENT":
      return "danger";
    default:
      return "default";
  }
}

function formatDate(date: string | null): string {
  if (!date) return "ไม่กำหนด";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "ไม่ถูกต้อง";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIMEZONE,
  }).format(parsedDate);
}

function getBangkokDateString(offsetDays = 0): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const date = new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day) + offsetDays,
    ),
  );

  return date.toISOString().slice(0, 10);
}

function getBangkokDateTime(date: string | null): {
  due_date: string;
  due_time: string;
} {
  if (!date) {
    return { due_date: "", due_time: "" };
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return { due_date: "", due_time: "" };
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(parsedDate);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    due_date: `${values.year}-${values.month}-${values.day}`,
    due_time: `${values.hour}:${values.minute}`,
  };
}

function toUtcISOString(date: string, time: string): string | null {
  if (!date || !time) return null;

  // ประเทศไทยใช้ UTC+7 และไม่มี Daylight Saving Time
  const result = new Date(`${date}T${time}:00+07:00`);

  if (Number.isNaN(result.getTime())) {
    return null;
  }

  return result.toISOString();
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

function TasksPage() {
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const tasksQuery = useTasks(page, limit);
  const dealsQuery = useDeals(1, 100);
  const contactsQuery = useContacts(1, 100);

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const tasks = tasksQuery.data?.items ?? [];
  const total = tasksQuery.data?.total ?? 0;
  const totalPages = tasksQuery.data?.total_pages ?? 0;

  const deals = dealsQuery.data?.items ?? [];
  const contacts = contactsQuery.data?.data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [form, setForm] = useState<TaskFormData>(initialForm);
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

  // ค้นหาและกรองเฉพาะ Tasks ในหน้าปัจจุบัน
  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tasks.filter((task: Task) => {
      const deal = dealMap.get(normalizeId(task.deal_id));
      const contact = contactMap.get(normalizeId(task.contact_id));

      const matchesSearch =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        (task.description ?? "").toLowerCase().includes(keyword) ||
        (deal?.title ?? "").toLowerCase().includes(keyword) ||
        (contact?.name ?? "").toLowerCase().includes(keyword);

      const matchesStatus = !statusFilter || task.status === statusFilter;

      const matchesPriority =
        !priorityFilter || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter, dealMap, contactMap]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }

    if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  function updateForm<K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingTask(null);
    setForm(initialForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);

    setForm({
      title: task.title,
      description: task.description ?? "",
      ...getBangkokDateTime(task.due_date),
      priority: task.priority,
      status: task.status,
      deal_id: task.deal_id ?? "",
      contact_id: task.contact_id ?? "",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
    setForm(initialForm);
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (form.due_date && !form.due_time) {
      setFormError("กรุณาเลือกเวลาครบกำหนดด้วย");
      return;
    }

    if (!form.due_date && form.due_time) {
      setFormError("กรุณาเลือกวันที่ครบกำหนดด้วย");
      return;
    }

    const payload: TaskPayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date
        ? toUtcISOString(form.due_date, form.due_time)
        : null,
      priority: form.priority,
      status: form.status,
      deal_id: form.deal_id || null,
      contact_id: form.contact_id || null,
    };

    try {
      if (editingTask) {
        await updateMutation.mutateAsync({
          id: editingTask.id,
          payload,
        });

        showToast("แก้ไขงานเรียบร้อยแล้ว", "success");
      } else {
        await createMutation.mutateAsync(payload);

        showToast("เพิ่มงานเรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function handleDelete(task: Task) {
    const confirmed = window.confirm(
      `คุณต้องการลบงาน "${task.title}" หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(task.id);
      showToast("ลบงานเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const columns = [
    {
      key: "title",
      header: "ชื่องาน",
      render: (task: Task) => (
        <div>
          <p className="font-medium text-slate-900">{task.title}</p>

          {task.description && (
            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
              {task.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (task: Task) => (
        <Badge variant={getStatusVariant(task.status)}>
          {getStatusLabel(task.status)}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "ความสำคัญ",
      render: (task: Task) => (
        <Badge variant={getPriorityVariant(task.priority)}>
          {getPriorityLabel(task.priority)}
        </Badge>
      ),
    },
    {
      key: "due_date",
      header: "วันครบกำหนด",
      render: (task: Task) => (
        <span className="whitespace-nowrap">{formatDate(task.due_date)}</span>
      ),
    },
    {
      key: "deal",
      header: "ดีล",
      render: (task: Task) => (
        <span>{dealMap.get(normalizeId(task.deal_id))?.title ?? "—"}</span>
      ),
    },
    {
      key: "contact",
      header: "ผู้ติดต่อ",
      render: (task: Task) => (
        <span>{contactMap.get(normalizeId(task.contact_id))?.name ?? "—"}</span>
      ),
    },
    {
      key: "created_at",
      header: "วันที่สร้าง",
      render: (task: Task) => (
        <span className="whitespace-nowrap">{formatDate(task.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (task: Task) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(task)}
            aria-label="แก้ไขงาน"
          >
            <Pencil size={16} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(task)}
            aria-label="ลบงาน"
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
    tasksQuery.isLoading || dealsQuery.isLoading || contactsQuery.isLoading;

  const isError =
    tasksQuery.isError || dealsQuery.isError || contactsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="งาน"
        description="จัดการงานที่ต้องดำเนินการ ติดตามกำหนดเวลา และความคืบหน้าของงาน"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            <span className="ml-2">เพิ่มงาน</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="ค้นหางาน..."
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            aria-label="กรองตามสถานะ"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[{ label: "ทุกสถานะ", value: "" }, ...statusOptions]}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            aria-label="กรองตามความสำคัญ"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            options={[
              { label: "ทุกระดับความสำคัญ", value: "" },
              ...priorityOptions,
            ]}
          />
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          ไม่สามารถโหลดข้อมูลงาน ดีล หรือผู้ติดต่อได้
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <p className="text-sm text-slate-500">ทั้งหมด {total} งาน</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <DataTable
              columns={columns}
              data={filteredTasks}
              getRowKey={(task: Task) => task.id}
              loading={isLoading}
              emptyTitle="ไม่พบงาน"
              emptyDescription={
                search || statusFilter || priorityFilter
                  ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                  : "เริ่มต้นด้วยการเพิ่มงานแรกของคุณ"
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
        title={editingTask ? "แก้ไขงาน" : "เพิ่มงาน"}
        description={
          editingTask
            ? "แก้ไขรายละเอียดและสถานะของงาน"
            : "สร้างงานใหม่ในระบบ CRM"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <Input
            label="ชื่องาน"
            name="title"
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            placeholder="เช่น ติดต่อลูกค้าเพื่อติดตามการเสนอราคา"
            required
            minLength={2}
            maxLength={150}
          />

          <Textarea
            label="รายละเอียด"
            name="description"
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
            rows={4}
          />

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                วันและเวลาครบกำหนด
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="วันที่"
                  name="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={(event) =>
                    updateForm("due_date", event.target.value)
                  }
                  required={!!form.due_time}
                />

                <Input
                  label="เวลา"
                  name="due_time"
                  type="time"
                  value={form.due_time}
                  onChange={(event) =>
                    updateForm("due_time", event.target.value)
                  }
                  required={!!form.due_date}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    due_date: getBangkokDateString(),
                    due_time: current.due_time || "17:00",
                  }))
                }
              >
                วันนี้
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    due_date: getBangkokDateString(1),
                    due_time: current.due_time || "17:00",
                  }))
                }
              >
                พรุ่งนี้
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    due_date: getBangkokDateString(7),
                    due_time: current.due_time || "17:00",
                  }))
                }
              >
                อีก 7 วัน
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    due_date: "",
                    due_time: "",
                  }))
                }
              >
                ไม่กำหนดวัน
              </Button>
            </div>

            {form.due_date && form.due_time && (
              <div className="rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-700">
                  ครบกำหนด{" "}
                  {formatDate(toUtcISOString(form.due_date, form.due_time))}
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  เวลาอ้างอิงประเทศไทย (UTC+7)
                </p>
              </div>
            )}

            {form.due_date &&
              form.due_time &&
              toUtcISOString(form.due_date, form.due_time) &&
              new Date(
                toUtcISOString(form.due_date, form.due_time)!,
              ).getTime() < Date.now() && (
                <p className="text-xs text-amber-600">
                  วันที่และเวลาที่เลือกผ่านมาแล้ว
                </p>
              )}
          </div>

          <Select
            label="ความสำคัญ"
            name="priority"
            value={form.priority}
            onChange={(event) =>
              updateForm("priority", event.target.value as TaskPriority)
            }
            options={priorityOptions}
            required
          />

          <Select
            label="สถานะ"
            name="status"
            value={form.status}
            onChange={(event) =>
              updateForm("status", event.target.value as TaskStatus)
            }
            options={statusOptions}
            required
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
              {editingTask ? "บันทึกการแก้ไข" : "เพิ่มงาน"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TasksPage;
