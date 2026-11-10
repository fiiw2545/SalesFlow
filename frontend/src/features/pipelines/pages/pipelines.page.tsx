import { useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  Plus,
  GitBranch,
  Pencil,
  Trash2,
  LoaderCircle,
  Star,
} from "lucide-react";
import Pagination from "../../../components/ui/pagination";
import { useToast } from "../../../components/common/toast-provider";
import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Textarea from "../../../components/common/textarea";
import Modal from "../../../components/common/modal";

import PageHeader from "../../../components/ui/page-header";
import SearchInput from "../../../components/ui/search-input";
import DataTable, {
  type DataTableColumn,
} from "../../../components/ui/data-table";

import {
  usePipelines,
  useCreatePipeline,
  useUpdatePipeline,
  useDeletePipeline,
} from "../hooks/use-pipelines";

import type { Pipeline, PipelinePayload } from "../types/pipeline.types";

const emptyForm: PipelinePayload = {
  name: "",
  description: "",
  is_default: false,
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

function PipelinesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(
    null,
  );
  const [form, setForm] = useState<PipelinePayload>(emptyForm);
  const [formError, setFormError] = useState("");

  const {
    data: pipelinesResponse,
    isLoading,
    isError,
    error,
  } = usePipelines(page, limit);

  const pipelines = pipelinesResponse?.items ?? [];

  const createMutation = useCreatePipeline();
  const updateMutation = useUpdatePipeline();
  const deleteMutation = useDeletePipeline();

  const navigate = useNavigate();
  const { showToast } = useToast();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (selectedPipeline) {
      setForm({
        name: selectedPipeline.name,
        description: selectedPipeline.description ?? "",
        is_default: selectedPipeline.is_default,
      });
    } else {
      setForm(emptyForm);
    }

    setFormError("");
  }, [selectedPipeline]);

  const filteredPipelines = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return pipelines;
    }

    return pipelines.filter((pipeline) =>
      [pipeline.name, pipeline.description ?? ""].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [pipelines, search]);

  function openCreateModal() {
    setSelectedPipeline(null);
    setIsModalOpen(true);
  }

  function openEditModal(pipeline: Pipeline) {
    setSelectedPipeline(pipeline);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedPipeline(null);
    setForm(emptyForm);
    setFormError("");
  }

  function handleChange(field: keyof PipelinePayload, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const payload: PipelinePayload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      is_default: form.is_default,
    };

    if (payload.name.length < 2) {
      setFormError("ชื่อกระบวนการขายต้องมีอย่างน้อย 2 ตัวอักษร");
      return;
    }

    if (payload.name.length > 100) {
      setFormError("ชื่อกระบวนการขายต้องมีความยาวไม่เกิน 100 ตัวอักษร");
      return;
    }

    try {
      if (selectedPipeline) {
        await updateMutation.mutateAsync({
          id: selectedPipeline.id,
          payload,
        });

        showToast("แก้ไขกระบวนการขายเรียบร้อยแล้ว", "success");
      } else {
        await createMutation.mutateAsync(payload);

        showToast("เพิ่มกระบวนการขายเรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function handleDelete(pipeline: Pipeline) {
    const confirmed = window.confirm(
      `คุณต้องการลบกระบวนการขาย "${pipeline.name}" ใช่หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(pipeline.id);

      showToast("ลบกระบวนการขายเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const columns: DataTableColumn<Pipeline>[] = [
    {
      key: "pipeline",
      header: "กระบวนการขาย",
      render: (pipeline) => (
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <GitBranch size={19} />
          </div>

          <div className="min-w-0">
            <p className="font-medium text-slate-900">{pipeline.name}</p>

            <p className="mt-1 text-xs text-slate-500">
              สร้างเมื่อ{" "}
              {new Date(pipeline.created_at).toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "รายละเอียด",
      render: (pipeline) => (
        <span className="text-slate-600">{pipeline.description || "—"}</span>
      ),
    },
    {
      key: "default",
      header: "ค่าเริ่มต้น",
      render: (pipeline) =>
        pipeline.is_default ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            <Star size={12} />
            ค่าเริ่มต้น
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },

    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (pipeline) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/pipelines/${pipeline.id}/stages`)}
          >
            จัดการขั้นตอน
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(pipeline)}
            title="แก้ไขกระบวนการขาย"
            aria-label={`แก้ไข ${pipeline.name}`}
          >
            <Pencil size={16} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(pipeline)}
            disabled={deleteMutation.isPending}
            title="ลบกระบวนการขาย"
            aria-label={`ลบ ${pipeline.name}`}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

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
        โหลดข้อมูลกระบวนการขายไม่สำเร็จ: {getErrorMessage(error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="กระบวนการขาย"
        description="จัดการกระบวนการขายขององค์กร"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={18} />
            เพิ่มกระบวนการขาย
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="ค้นหากระบวนการขาย..."
          />
        </div>

        <p className="text-sm text-slate-500">
          ทั้งหมด {pipelinesResponse?.total ?? 0} กระบวนการขาย
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredPipelines}
        getRowKey={(pipeline) => pipeline.id}
        emptyTitle={search ? "ไม่พบกระบวนการขาย" : "ยังไม่มีกระบวนการขาย"}
        emptyDescription={
          search
            ? "ลองค้นหาด้วยคำค้นอื่น"
            : "เพิ่มกระบวนการขายแรกของคุณเพื่อเริ่มต้นใช้งาน"
        }
      />
      <Pagination
        page={page}
        totalPages={pipelinesResponse?.total_pages ?? 0}
        total={pipelinesResponse?.total ?? 0}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedPipeline ? "แก้ไขกระบวนการขาย" : "เพิ่มกระบวนการขาย"}
        description="กรอกข้อมูลกระบวนการขายด้านล่าง"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <Input
            label="ชื่อกระบวนการขาย"
            name="name"
            type="text"
            required
            maxLength={100}
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="เช่น กระบวนการขายหลัก"
          />

          <Textarea
            label="รายละเอียด"
            name="description"
            rows={3}
            value={form.description ?? ""}
            onChange={(event) =>
              handleChange("description", event.target.value)
            }
            placeholder="อธิบายรายละเอียดของกระบวนการขาย..."
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(event) =>
                handleChange("is_default", event.target.checked)
              }
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <div>
              <p className="text-sm font-medium text-slate-700">
                กำหนดเป็นกระบวนการขายเริ่มต้น
              </p>
              <p className="mt-1 text-xs text-slate-500">
                ใช้กระบวนการขายนี้เป็นค่าเริ่มต้นสำหรับองค์กรของคุณ
              </p>
            </div>
          </label>

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
              {selectedPipeline ? "บันทึกการแก้ไข" : "เพิ่มกระบวนการขาย"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PipelinesPage;
