import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "axios";
import Pagination from "../../../components/ui/pagination";

import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  LoaderCircle,
  GitBranch,
} from "lucide-react";

import { useToast } from "../../../components/common/toast-provider";
import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Modal from "../../../components/common/modal";
import Badge from "../../../components/common/badge";

import PageHeader from "../../../components/ui/page-header";
import DataTable, {
  type DataTableColumn,
} from "../../../components/ui/data-table";

import { usePipeline } from "../hooks/use-pipelines";
import {
  useStages,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
} from "../hooks/use-stages";

import type { Stage, StagePayload } from "../types/stage.types";

const emptyForm: StagePayload = {
  name: "",
  position: 1,
  probability: 0,
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

function PipelineStagesPage() {
  const navigate = useNavigate();
  const { pipelineId = "" } = useParams<{ pipelineId: string }>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const {
    data: pipeline,
    isLoading: isPipelineLoading,
    isError: isPipelineError,
  } = usePipeline(pipelineId);

  const {
    data: stagesResponse,
    isLoading: isStagesLoading,
    isError: isStagesError,
    error: stagesError,
  } = useStages(pipelineId, page, limit);

  const stages = stagesResponse?.items ?? [];
  const total = stagesResponse?.total ?? 0;
  const totalPages = stagesResponse?.total_pages ?? 0;

  const createMutation = useCreateStage();
  const updateMutation = useUpdateStage();
  const deleteMutation = useDeleteStage();

  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [form, setForm] = useState<StagePayload>(emptyForm);
  const [formError, setFormError] = useState("");

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.position - b.position),
    [stages],
  );

  useEffect(() => {
    if (selectedStage) {
      setForm({
        name: selectedStage.name,
        position: selectedStage.position,
        probability: selectedStage.probability,
      });
    } else {
      setForm({
        ...emptyForm,
        position: stages.length + 1,
      });
    }

    setFormError("");
  }, [selectedStage, stages.length]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }

    if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  function openCreateModal() {
    setSelectedStage(null);
    setIsModalOpen(true);
  }

  function openEditModal(stage: Stage) {
    setSelectedStage(stage);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedStage(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const payload: StagePayload = {
      name: form.name.trim(),
      position: Number(form.position),
      probability: Number(form.probability),
    };

    if (payload.name.length < 2 || payload.name.length > 100) {
      setFormError("ชื่อขั้นตอนต้องมีความยาว 2–100 ตัวอักษร");
      return;
    }

    if (!Number.isInteger(payload.position) || payload.position < 1) {
      setFormError("ลำดับต้องเป็นจำนวนเต็มที่มากกว่า 0");
      return;
    }

    if (
      !Number.isInteger(payload.probability) ||
      payload.probability < 0 ||
      payload.probability > 100
    ) {
      setFormError("เปอร์เซ็นต์โอกาสปิดการขายต้องอยู่ระหว่าง 0–100");
      return;
    }

    try {
      if (selectedStage) {
        await updateMutation.mutateAsync({
          pipelineId,
          stageId: selectedStage.id,
          payload,
        });

        showToast("แก้ไขขั้นตอนการขายเรียบร้อยแล้ว", "success");
      } else {
        await createMutation.mutateAsync({
          pipelineId,
          payload,
        });

        showToast("เพิ่มขั้นตอนการขายเรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function handleDelete(stage: Stage) {
    const confirmed = window.confirm(
      `คุณต้องการลบขั้นตอน "${stage.name}" ใช่หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync({
        pipelineId,
        stageId: stage.id,
      });

      showToast("ลบขั้นตอนการขายเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const columns: DataTableColumn<Stage>[] = [
    {
      key: "position",
      header: "ลำดับ",
      render: (stage) => (
        <span className="font-medium text-slate-700">{stage.position}</span>
      ),
    },
    {
      key: "name",
      header: "ขั้นตอนการขาย",
      render: (stage) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <GitBranch size={17} />
          </div>
          <span className="font-medium text-slate-900">{stage.name}</span>
        </div>
      ),
    },
    {
      key: "probability",
      header: "โอกาสปิดการขาย",
      render: (stage) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${stage.probability}%` }}
            />
          </div>
          <span className="text-sm text-slate-600">{stage.probability}%</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (stage) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(stage)}
            title="แก้ไขขั้นตอน"
            aria-label={`แก้ไข ${stage.name}`}
          >
            <Pencil size={16} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(stage)}
            disabled={deleteMutation.isPending}
            title="ลบขั้นตอน"
            aria-label={`ลบ ${stage.name}`}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isPipelineLoading || isStagesLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (isPipelineError || !pipeline) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        ไม่พบกระบวนการขาย หรือไม่สามารถโหลดข้อมูลได้
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/pipelines")}>
            <ArrowLeft size={16} />
            กลับไปหน้ากระบวนการขาย
          </Button>
        </div>
      </div>
    );
  }

  if (isStagesError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        โหลดข้อมูลขั้นตอนการขายไม่สำเร็จ: {getErrorMessage(stagesError)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/pipelines")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        กลับไปหน้ากระบวนการขาย
      </button>

      <PageHeader
        title={pipeline.name}
        description={
          pipeline.description || "จัดการขั้นตอนต่าง ๆ ในกระบวนการขาย"
        }
        action={
          <Button onClick={openCreateModal}>
            <Plus size={18} />
            เพิ่มขั้นตอน
          </Button>
        }
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">ขั้นตอนการขาย</p>
          <p className="mt-1 text-sm text-slate-500">
            จัดการขั้นตอนและเปอร์เซ็นต์โอกาสในการปิดการขาย
          </p>
        </div>

        <Badge variant="info">{total} ขั้นตอน</Badge>
      </div>

      <DataTable
        columns={columns}
        data={sortedStages}
        getRowKey={(stage) => stage.id}
        emptyTitle="ยังไม่มีขั้นตอนการขาย"
        emptyDescription="เพิ่มขั้นตอนแรกเพื่อเริ่มต้นใช้งานกระบวนการขายนี้"
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedStage ? "แก้ไขขั้นตอนการขาย" : "เพิ่มขั้นตอนการขาย"}
        description="กรอกข้อมูลขั้นตอนการขายด้านล่าง"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <Input
            label="ชื่อขั้นตอน"
            name="name"
            type="text"
            required
            maxLength={100}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="เช่น ผ่านการคัดกรองแล้ว"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ลำดับ"
              name="position"
              type="number"
              required
              min={1}
              step={1}
              value={String(form.position)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  position: Number(event.target.value),
                }))
              }
            />

            <Input
              label="โอกาสปิดการขาย (%)"
              name="probability"
              type="number"
              required
              min={0}
              max={100}
              step={1}
              value={String(form.probability)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  probability: Number(event.target.value),
                }))
              }
            />
          </div>

          <p className="text-xs text-slate-500">
            เปอร์เซ็นต์โอกาสปิดการขาย
            คือการประมาณโอกาสที่จะปิดดีลได้สำเร็จในขั้นตอนนี้ (0–100%)
          </p>

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
              {selectedStage ? "บันทึกการแก้ไข" : "เพิ่มขั้นตอน"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PipelineStagesPage;
