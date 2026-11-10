import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import PageHeader from "../../../components/ui/page-header";
import DataTable from "../../../components/ui/data-table";
import type { DataTableColumn } from "../../../components/ui/data-table";
import SearchInput from "../../../components/ui/search-input";
import Pagination from "../../../components/ui/pagination";

import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Modal from "../../../components/common/modal";
import Badge from "../../../components/common/badge";
import { useToast } from "../../../components/common/toast-provider";

import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from "../hooks/use-tags";

import type { Tag, TagPayload } from "../types/tag.types";

interface TagFormData {
  name: string;
  color: string;
}

const initialForm: TagFormData = {
  name: "",
  color: "#3B82F6",
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getErrorMessage(error: unknown): string {
  const apiError = error as {
    response?: {
      status?: number;
      data?: {
        detail?: string;
        message?: string;
      };
    };
    message?: string;
  };

  if (apiError.response?.status === 409) {
    return (
      apiError.response.data?.detail ||
      "ไม่สามารถลบ Tag ได้ เนื่องจาก Tag นี้ถูกใช้งานอยู่"
    );
  }

  return (
    apiError.response?.data?.detail ||
    apiError.response?.data?.message ||
    apiError.message ||
    "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง"
  );
}

function TagsPage() {
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const tagsQuery = useTags(page, limit);

  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const tags = tagsQuery.data?.items ?? [];
  const total = tagsQuery.data?.total ?? 0;
  const totalPages = tagsQuery.data?.total_pages ?? 0;

  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const [form, setForm] = useState<TagFormData>(initialForm);
  const [formError, setFormError] = useState("");

  const filteredTags = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return tags;

    return tags.filter((tag) => tag.name.toLowerCase().includes(keyword));
  }, [tags, search]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    } else if (totalPages === 0 && page > 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  function updateForm<K extends keyof TagFormData>(
    field: K,
    value: TagFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingTag(null);
    setForm(initialForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(tag: Tag) {
    setEditingTag(tag);

    setForm({
      name: tag.name,
      color: tag.color ?? "",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTag(null);
    setForm(initialForm);
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();

    if (name.length < 2) {
      setFormError("ชื่อ Tag ต้องมีอย่างน้อย 2 ตัวอักษร");
      return;
    }

    if (name.length > 100) {
      setFormError("ชื่อ Tag ต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    const payload: TagPayload = {
      name,
      color: form.color || null,
    };

    try {
      if (editingTag) {
        await updateMutation.mutateAsync({
          id: editingTag.id,
          payload,
        });

        showToast("แก้ไข Tag เรียบร้อยแล้ว", "success");
      } else {
        await createMutation.mutateAsync(payload);

        showToast("เพิ่ม Tag เรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function handleDelete(tag: Tag) {
    const confirmed = window.confirm(`คุณต้องการลบ Tag "${tag.name}" หรือไม่?`);

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(tag.id);

      showToast("ลบ Tag เรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const columns: DataTableColumn<Tag>[] = [
    {
      key: "name",
      header: "ชื่อ Tag",
      render: (tag) => (
        <div className="flex items-center gap-3">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-200"
            style={{
              backgroundColor: tag.color || "#CBD5E1",
            }}
          />

          <span className="font-medium text-slate-900">{tag.name}</span>
        </div>
      ),
    },
    {
      key: "color",
      header: "สี",
      render: (tag) =>
        tag.color ? (
          <div className="flex items-center gap-2">
            <span
              className="h-6 w-6 rounded-md border border-slate-200"
              style={{ backgroundColor: tag.color }}
            />
            <span className="text-xs text-slate-500">{tag.color}</span>
          </div>
        ) : (
          <Badge variant="default">ไม่กำหนดสี</Badge>
        ),
    },
    {
      key: "created_at",
      header: "วันที่สร้าง",
      render: (tag) => (
        <span className="whitespace-nowrap">{formatDate(tag.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (tag) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(tag)}
            aria-label="แก้ไข Tag"
          >
            <Pencil size={16} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(tag)}
            aria-label="ลบ Tag"
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description="จัดการป้ายกำกับและสีสำหรับจัดหมวดหมู่ข้อมูลใน CRM"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            <span>เพิ่ม Tag</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="ค้นหาชื่อ Tag..."
          />
        </div>
      </div>

      {tagsQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          ไม่สามารถโหลดข้อมูล Tag ได้ กรุณาลองอีกครั้ง
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-500">ทั้งหมด {total} Tags</div>

          <DataTable
            columns={columns}
            data={filteredTags}
            getRowKey={(tag) => tag.id}
            loading={tagsQuery.isLoading}
            emptyTitle="ไม่พบ Tag"
            emptyDescription={
              search
                ? "ลองเปลี่ยนคำค้นหาแล้วค้นหาอีกครั้ง"
                : "เริ่มต้นด้วยการเพิ่ม Tag แรกของคุณ"
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
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTag ? "แก้ไข Tag" : "เพิ่ม Tag"}
        description={
          editingTag
            ? "แก้ไขชื่อและสีของ Tag"
            : "สร้าง Tag ใหม่สำหรับใช้จัดหมวดหมู่ข้อมูล"
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <Input
            label="ชื่อ Tag"
            name="name"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="เช่น VIP, Important, Follow Up"
            required
            minLength={2}
            maxLength={100}
          />

          <div className="space-y-2">
            <label
              htmlFor="tag-color"
              className="block text-sm font-medium text-slate-700"
            >
              สี Tag
            </label>

            <div className="flex items-center gap-3">
              <input
                id="tag-color"
                type="color"
                value={form.color || "#CBD5E1"}
                onChange={(event) => updateForm("color", event.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
              />

              <span className="text-sm text-slate-600">
                {form.color || "ไม่กำหนดสี"}
              </span>

              {form.color && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => updateForm("color", "")}
                >
                  <X size={14} />
                  ล้างสี
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              เลือกสีเพื่อช่วยแยกประเภทของ Tag หรือกดล้างสีเพื่อไม่กำหนดสี
            </p>
          </div>

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
              {editingTag ? "บันทึกการแก้ไข" : "เพิ่ม Tag"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TagsPage;
