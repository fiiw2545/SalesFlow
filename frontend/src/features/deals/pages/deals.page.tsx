import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Pagination from "../../../components/ui/pagination";
import PageHeader from "../../../components/ui/page-header";
import DataTable from "../../../components/ui/data-table";
import SearchInput from "../../../components/ui/search-input";
import { useSearchParams } from "react-router";
import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Select from "../../../components/common/select";
import Modal from "../../../components/common/modal";
import Badge from "../../../components/common/badge";
import { useToast } from "../../../components/common/toast-provider";

import {
  useDeals,
  useDeal,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
} from "../hooks/use-deals";
import { useCompanies } from "../../companies/hooks/use-companies";
import { useContacts } from "../../contacts/hooks/use-contacts";
import { usePipelines } from "../../pipelines/hooks/use-pipelines";

import { getStages } from "../../pipelines/services/stage.service";

import type {
  Deal,
  DealCreatePayload,
  DealUpdatePayload,
  DealStatus,
} from "../types/deal.types";
import type { Company } from "../../companies/types/company.types";
import type { Contact } from "../../contacts/types/contact.types";
import type { Pipeline } from "../../pipelines/types/pipeline.types";

interface DealFormData {
  title: string;
  value: string;
  currency: string;
  status: DealStatus;
  pipeline_id: string;
  stage_id: string;
  company_id: string;
  contact_id: string;
  expected_close_date: string;
}

const initialForm: DealFormData = {
  title: "",
  value: "0",
  currency: "THB",
  status: "OPEN",
  pipeline_id: "",
  stage_id: "",
  company_id: "",
  contact_id: "",
  expected_close_date: "",
};

function normalizeId(id: string | null | undefined): string {
  if (!id) return "";
  return id.includes(":") ? id.split(":").slice(1).join(":") : id;
}

function getStatusVariant(status: DealStatus) {
  switch (status) {
    case "WON":
      return "success";
    case "LOST":
      return "danger";
    default:
      return "info";
  }
}

function getStatusLabel(status: DealStatus): string {
  switch (status) {
    case "WON":
      return "ปิดการขายสำเร็จ";
    case "LOST":
      return "ไม่สำเร็จ";
    default:
      return "กำลังดำเนินการ";
  }
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
    "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
  );
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function DealsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState<DealFormData>(initialForm);
  const [formError, setFormError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const targetDealId = searchParams.get("open") ?? "";
  const targetDealQuery = useDeal(targetDealId);

  // Queries
  const dealsQuery = useDeals(page, limit);
  const { showToast } = useToast();
  // โหลดข้อมูลที่เกี่ยวข้องสำหรับแสดงชื่อในตารางและ Modal
  const companiesQuery = useCompanies(1, 100, "");
  const contactsQuery = useContacts(1, 100, "");
  const pipelinesQuery = usePipelines();

  // Mutations
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();
  const deleteMutation = useDeleteDeal();

  // Data
  const deals = dealsQuery.data?.items ?? [];
  const total = dealsQuery.data?.total ?? 0;
  const totalPages = dealsQuery.data?.total_pages ?? 0;

  const companies = companiesQuery.data?.items ?? [];
  const contacts = contactsQuery.data?.data ?? [];
  const pipelines = pipelinesQuery.data?.items ?? [];

  // ป้องกัน page เกินจำนวนหน้าที่มีอยู่
  useEffect(() => {
    const maxPage = Math.max(totalPages, 1);

    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, totalPages]);

  // โหลด Stage ของทุก Pipeline เพื่อใช้แสดงชื่อ Stage ในตาราง
  const stageQueries = useQueries({
    queries: pipelines.map((pipeline: Pipeline) => ({
      queryKey: ["stages", pipeline.id],
      queryFn: () => getStages(pipeline.id),
      enabled: !!pipeline.id,
    })),
  });

  const stages = useMemo(() => {
    return stageQueries.flatMap((query) => query.data?.items ?? []);
  }, [stageQueries]);

  // Maps
  const stageMap = useMemo(() => {
    return new Map(stages.map((stage) => [normalizeId(stage.id), stage]));
  }, [stages]);

  const areStagesReady =
    pipelinesQuery.isSuccess && stageQueries.every((query) => query.isSuccess);

  const companyMap = useMemo(() => {
    return new Map(
      companies.map((company: Company) => [normalizeId(company.id), company]),
    );
  }, [companies]);

  const contactMap = useMemo(() => {
    return new Map(
      contacts.map((contact: Contact) => [normalizeId(contact.id), contact]),
    );
  }, [contacts]);

  const pipelineMap = useMemo(() => {
    return new Map(
      pipelines.map((pipeline: Pipeline) => [
        normalizeId(pipeline.id),
        pipeline,
      ]),
    );
  }, [pipelines]);

  // กรองเฉพาะสถานะ เพราะ Search ทำงานที่ Backend แล้ว
  const filteredDeals = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return deals.filter((deal: Deal) => {
      const company = companyMap.get(normalizeId(deal.company_id));
      const contact = contactMap.get(normalizeId(deal.contact_id));
      const stage = stageMap.get(normalizeId(deal.stage_id));

      const matchesSearch =
        !keyword ||
        [
          deal.title,
          company?.name ?? "",
          contact?.name ?? "",
          stage?.name ?? "",
        ].some((value) => value.toLowerCase().includes(keyword));

      const matchesStatus = !statusFilter || deal.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deals, search, statusFilter, companyMap, contactMap, stageMap]);

  // Stage ที่อยู่ใน Pipeline ที่เลือก
  const availableStages = stages
    .filter(
      (stage) =>
        normalizeId(stage.pipeline_id) === normalizeId(form.pipeline_id),
    )
    .sort((a, b) => a.position - b.position);

  // Contact ที่อยู่ใน Company ที่เลือก
  const availableContacts = contacts.filter((contact: Contact) => {
    if (!form.company_id) return true;

    return normalizeId(contact.company_id) === normalizeId(form.company_id);
  });

  function updateForm<K extends keyof DealFormData>(
    field: K,
    value: DealFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingDeal(null);

    setForm({
      ...initialForm,
      pipeline_id:
        pipelines.find((pipeline) => pipeline.is_default)?.id ??
        pipelines[0]?.id ??
        "",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(deal: Deal) {
    const currentStage = stageMap.get(normalizeId(deal.stage_id));

    setEditingDeal(deal);

    setForm({
      title: deal.title,
      value: String(deal.value),
      currency: deal.currency,
      status: deal.status,
      pipeline_id: currentStage?.pipeline_id ?? "",
      stage_id: deal.stage_id,
      company_id: deal.company_id ?? "",
      contact_id: deal.contact_id ?? "",
      expected_close_date: deal.expected_close_date?.slice(0, 10) ?? "",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  useEffect(() => {
    if (!targetDealId) return;

    if (targetDealQuery.isError) {
      showToast("ไม่พบดีลที่ต้องการเปิด", "error");

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

    if (!targetDealQuery.isSuccess || !areStagesReady) return;

    openEditModal(targetDealQuery.data);

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("open");
        return next;
      },
      { replace: true },
    );
  }, [
    targetDealId,
    targetDealQuery.isSuccess,
    targetDealQuery.isError,
    targetDealQuery.data,
    areStagesReady,
    setSearchParams,
    showToast,
  ]);

  function closeModal() {
    setIsModalOpen(false);
    setEditingDeal(null);
    setForm(initialForm);
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!form.pipeline_id) {
      setFormError("กรุณาเลือกกระบวนการขาย");
      return;
    }

    if (!form.stage_id) {
      setFormError("กรุณาเลือกขั้นตอนการขาย");
      return;
    }

    if (form.company_id && form.contact_id) {
      const selectedContact = contactMap.get(normalizeId(form.contact_id));

      if (
        !selectedContact ||
        normalizeId(selectedContact.company_id) !== normalizeId(form.company_id)
      ) {
        setFormError(
          "ผู้ติดต่อที่เลือกไม่ได้อยู่ในบริษัทที่เลือก กรุณาตรวจสอบข้อมูลอีกครั้ง",
        );
        return;
      }
    }

    const commonPayload = {
      title: form.title.trim(),
      value: Number(form.value),
      currency: form.currency.trim().toUpperCase(),
      stage_id: form.stage_id,
      company_id: form.company_id || null,
      contact_id: form.contact_id || null,
      expected_close_date: form.expected_close_date || null,
    };

    try {
      if (editingDeal) {
        const payload: DealUpdatePayload = {
          ...commonPayload,
          status: form.status,
        };

        await updateMutation.mutateAsync({
          id: editingDeal.id,
          payload,
        });

        showToast("แก้ไขดีลเรียบร้อยแล้ว", "success");
      } else {
        const payload: DealCreatePayload = commonPayload;

        await createMutation.mutateAsync(payload);

        showToast("สร้างดีลเรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function handleDelete(deal: Deal) {
    const confirmed = window.confirm(
      `คุณต้องการลบดีล "${deal.title}" ใช่หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(deal.id);

      showToast("ลบดีลเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  // Table columns
  const columns = [
    {
      key: "title",
      header: "ดีลการขาย",
      render: (deal: Deal) => (
        <div>
          <p className="font-medium text-slate-900">{deal.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatCurrency(deal.value, deal.currency)}
          </p>
        </div>
      ),
    },
    {
      key: "company",
      header: "บริษัท",
      render: (deal: Deal) => (
        <span>{companyMap.get(normalizeId(deal.company_id))?.name ?? "—"}</span>
      ),
    },
    {
      key: "contact",
      header: "ผู้ติดต่อ",
      render: (deal: Deal) => (
        <span>{contactMap.get(normalizeId(deal.contact_id))?.name ?? "—"}</span>
      ),
    },
    {
      key: "stage",
      header: "ขั้นตอนการขาย",
      render: (deal: Deal) => {
        const stage = stageMap.get(normalizeId(deal.stage_id));

        const pipeline = stage
          ? pipelineMap.get(normalizeId(stage.pipeline_id))
          : undefined;

        return (
          <div>
            <p className="font-medium text-slate-700">
              {stage?.name ?? "ไม่พบขั้นตอนการขาย"}
            </p>

            {pipeline && (
              <p className="mt-1 text-xs text-slate-500">{pipeline.name}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "สถานะ",
      render: (deal: Deal) => (
        <Badge variant={getStatusVariant(deal.status)}>
          {getStatusLabel(deal.status)}
        </Badge>
      ),
    },
    {
      key: "expected_close_date",
      header: "วันที่คาดว่าจะปิดการขาย",
      render: (deal: Deal) => (
        <span>
          {deal.expected_close_date
            ? new Date(deal.expected_close_date).toLocaleDateString("th-TH")
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (deal: Deal) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(deal)}
            aria-label="แก้ไขดีล"
            title="แก้ไขดีล"
          >
            <Pencil size={16} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(deal)}
            aria-label="ลบดีล"
            title="ลบดีล"
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
        title="ดีลการขาย"
        description="จัดการโอกาสทางการขายและติดตามความคืบหน้าของดีล"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            <span className="ml-2">เพิ่มดีล</span>
          </Button>
        }
      />

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="ค้นหาดีล..."
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            aria-label="กรองตามสถานะ"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { label: "ทุกสถานะ", value: "" },
              { label: "กำลังดำเนินการ", value: "OPEN" },
              { label: "ปิดการขายสำเร็จ", value: "WON" },
              { label: "ไม่สำเร็จ", value: "LOST" },
            ]}
          />
        </div>
      </div>

      {/* Deals Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <DataTable
          columns={columns}
          data={filteredDeals}
          getRowKey={(deal: Deal) => deal.id}
          loading={
            dealsQuery.isLoading ||
            companiesQuery.isLoading ||
            contactsQuery.isLoading ||
            pipelinesQuery.isLoading
          }
          emptyTitle="ไม่พบข้อมูลดีล"
          emptyDescription={
            search || statusFilter
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
              : "สร้างดีลแรกของคุณเพื่อเริ่มต้นใช้งาน"
          }
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
          }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDeal ? "แก้ไขดีล" : "สร้างดีลใหม่"}
        description={
          editingDeal
            ? "แก้ไขรายละเอียดของโอกาสทางการขายนี้"
            : "เพิ่มโอกาสทางการขายใหม่เข้าสู่กระบวนการขาย"
        }
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <Input
            label="ชื่อดีล"
            name="title"
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            placeholder="กรอกชื่อดีล"
            required
            maxLength={150}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="มูลค่าดีล"
              name="value"
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={(event) => updateForm("value", event.target.value)}
              required
            />

            <Input
              label="สกุลเงิน"
              name="currency"
              value={form.currency}
              onChange={(event) => updateForm("currency", event.target.value)}
              placeholder="THB"
              maxLength={3}
              required
            />
          </div>

          <Select
            label="กระบวนการขาย"
            name="pipeline_id"
            value={form.pipeline_id}
            onChange={(event) => {
              updateForm("pipeline_id", event.target.value);
              updateForm("stage_id", "");
            }}
            options={pipelines.map((pipeline: Pipeline) => ({
              label: pipeline.name,
              value: pipeline.id,
            }))}
            placeholder="เลือกกระบวนการขาย"
            required
          />

          <Select
            label="ขั้นตอนการขาย"
            name="stage_id"
            value={form.stage_id}
            onChange={(event) => updateForm("stage_id", event.target.value)}
            options={availableStages.map((stage) => ({
              label: `${stage.position}. ${stage.name} (${stage.probability}%)`,
              value: stage.id,
            }))}
            placeholder="เลือกขั้นตอนการขาย"
            disabled={!form.pipeline_id || availableStages.length === 0}
            required
          />

          <Select
            label="บริษัท"
            name="company_id"
            value={form.company_id}
            onChange={(event) => {
              updateForm("company_id", event.target.value);
              updateForm("contact_id", "");
            }}
            options={companies.map((company: Company) => ({
              label: company.name,
              value: company.id,
            }))}
            placeholder="ไม่เลือกบริษัท"
          />

          <Select
            label="ผู้ติดต่อ"
            name="contact_id"
            value={form.contact_id}
            onChange={(event) => updateForm("contact_id", event.target.value)}
            options={availableContacts.map((contact: Contact) => ({
              label: contact.name,
              value: contact.id,
            }))}
            placeholder="ไม่เลือกผู้ติดต่อ"
            disabled={!!form.company_id && availableContacts.length === 0}
            helperText={
              form.company_id
                ? "แสดงเฉพาะผู้ติดต่อที่อยู่ในบริษัทที่เลือก"
                : "เลือกบริษัทก่อน หากต้องการกรองรายชื่อผู้ติดต่อ"
            }
          />

          {editingDeal && (
            <Select
              label="สถานะ"
              name="status"
              value={form.status}
              onChange={(event) =>
                updateForm("status", event.target.value as DealStatus)
              }
              options={[
                { label: "กำลังดำเนินการ", value: "OPEN" },
                { label: "ปิดการขายสำเร็จ", value: "WON" },
                { label: "ไม่สำเร็จ", value: "LOST" },
              ]}
              required
            />
          )}

          <Input
            label="วันที่คาดว่าจะปิดการขาย"
            name="expected_close_date"
            type="date"
            value={form.expected_close_date}
            onChange={(event) =>
              updateForm("expected_close_date", event.target.value)
            }
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
              {editingDeal ? "บันทึกการแก้ไข" : "สร้างดีล"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DealsPage;
