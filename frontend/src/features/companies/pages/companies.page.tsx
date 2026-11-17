import { useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import Pagination from "../../../components/ui/pagination";
import FilePicker from "../../files/components/file-picker";
import FilePreview from "../../files/components/file-preview";
import {
  Plus,
  Building2,
  Pencil,
  Trash2,
  Globe,
  Phone,
  MapPin,
  LoaderCircle,
  Tags,
  X,
} from "lucide-react";

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
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "../hooks/use-companies";

import type { Company, CompanyPayload } from "../types/company.types";

import {
  useCompanyTags,
  useAssignCompanyTag,
  useUnassignCompanyTag,
} from "../hooks/use-company-tags";

import { useTags } from "../../tags/hooks/use-tags";

import type { Tag } from "../../tags/types/tag.types";

const emptyForm: CompanyPayload = {
  name: "",
  address: "",
  industry: "",
  phone: "",
  website: "",
  logo_file_id: null,
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

function CompanyTagsCell({
  companyId,
  tags,
  onManage,
}: {
  companyId: string;
  tags: Tag[];
  onManage: () => void;
}) {
  const { data: assignments, isLoading } = useCompanyTags(companyId);

  const assignedTags = (assignments ?? [])
    .map((assignment) => tags.find((tag) => tag.id === assignment.tag_id))
    .filter((tag): tag is Tag => !!tag);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isLoading ? (
        <LoaderCircle size={15} className="animate-spin text-slate-400" />
      ) : assignedTags.length > 0 ? (
        assignedTags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: tag.color ?? "#e2e8f0",
              color: "#ffffff",
            }}
          >
            {tag.name}
          </span>
        ))
      ) : (
        <span className="text-xs text-slate-400">ไม่มี Tags</span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onManage}
        title="จัดการ Tags"
        aria-label="จัดการ Tags"
      >
        <Tags size={15} />
      </Button>
    </div>
  );
}

function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    data: companiesResponse,
    isLoading,
    isError,
    error,
  } = useCompanies(page, limit);

  const companies = companiesResponse?.items ?? [];
  const total = companiesResponse?.total ?? 0;
  const totalPages = companiesResponse?.total_pages ?? 0;

  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyPayload>(emptyForm);
  const [formError, setFormError] = useState("");

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ค้นหาข้อมูลบริษัทในหน้าปัจจุบัน
  const filteredCompanies = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return companies;

    return companies.filter((company: Company) =>
      [
        company.name,
        company.address ?? "",
        company.industry ?? "",
        company.phone ?? "",
        company.website ?? "",
      ].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [companies, search]);

  const [tagCompany, setTagCompany] = useState<Company | null>(null);

  const { data: tagsResponse } = useTags(1, 100);
  const availableTags = tagsResponse?.items ?? [];

  const { data: companyTagAssignments, isLoading: isCompanyTagsLoading } =
    useCompanyTags(tagCompany?.id ?? "");

  const assignTagMutation = useAssignCompanyTag();
  const unassignTagMutation = useUnassignCompanyTag();

  const assignedTagIds = new Set(
    (companyTagAssignments ?? []).map((assignment) => assignment.tag_id),
  );

  const unassignedTags = availableTags.filter(
    (tag) => !assignedTagIds.has(tag.id),
  );

  useEffect(() => {
    if (selectedCompany) {
      setForm({
        name: selectedCompany.name,
        address: selectedCompany.address ?? "",
        industry: selectedCompany.industry ?? "",
        phone: selectedCompany.phone ?? "",
        website: selectedCompany.website ?? "",
        logo_file_id: selectedCompany.logo_file_id,
      });
    } else {
      setForm(emptyForm);
    }

    setFormError("");
  }, [selectedCompany]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }

    if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  function openCreateModal() {
    setSelectedCompany(null);
    setIsModalOpen(true);
  }

  function openEditModal(company: Company) {
    setSelectedCompany(company);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedCompany(null);
    setForm(emptyForm);
    setFormError("");
  }

  function handleChange(field: keyof CompanyPayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openTagModal(company: Company) {
    setTagCompany(company);
  }

  function closeTagModal() {
    setTagCompany(null);
  }

  async function handleAssignTag(tagId: string) {
    if (!tagCompany) return;

    try {
      await assignTagMutation.mutateAsync({
        companyId: tagCompany.id,
        payload: { tag_id: tagId },
      });

      showToast("เพิ่ม Tag ให้บริษัทเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  async function handleUnassignTag(tagId: string) {
    if (!tagCompany) return;

    try {
      await unassignTagMutation.mutateAsync({
        companyId: tagCompany.id,
        tagId,
      });

      showToast("ถอด Tag ออกจากบริษัทเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const payload: CompanyPayload = {
      name: form.name.trim(),
      address: form.address?.trim() || null,
      industry: form.industry?.trim() || null,
      phone: form.phone?.trim() || null,
      website: form.website?.trim() || null,
      logo_file_id: form.logo_file_id ?? null,
    };

    if (!payload.name) {
      setFormError("กรุณาระบุชื่อบริษัท");
      return;
    }

    try {
      if (selectedCompany) {
        await updateMutation.mutateAsync({
          id: selectedCompany.id,
          payload,
        });

        showToast("แก้ไขข้อมูลบริษัทเรียบร้อยแล้ว", "success");
      } else {
        await createMutation.mutateAsync(payload);

        showToast("เพิ่มบริษัทเรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  async function handleDelete(company: Company) {
    const confirmed = window.confirm(
      `คุณต้องการลบบริษัท "${company.name}" ใช่หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(company.id);

      showToast("ลบบริษัทเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const columns: DataTableColumn<Company>[] = [
    {
      key: "company",
      header: "บริษัท",
      render: (company) => (
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-50 text-blue-600">
            <FilePreview
              fileId={company.logo_file_id}
              alt={`${company.name} logo`}
              className="size-full object-cover"
              fallback={<Building2 size={19} />}
            />
          </div>

          <div className="min-w-0">
            <p className="font-medium text-slate-900">{company.name}</p>

            <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
              <MapPin size={12} />
              {company.address || "ไม่มีที่อยู่"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "industry",
      header: "ประเภทธุรกิจ",
      render: (company) => <span>{company.industry || "—"}</span>,
    },
    {
      key: "tags",
      header: "Tags",
      render: (company) => (
        <CompanyTagsCell
          companyId={company.id}
          tags={availableTags}
          onManage={() => openTagModal(company)}
        />
      ),
    },
    {
      key: "phone",
      header: "เบอร์โทรศัพท์",
      render: (company) => (
        <span className="flex items-center gap-2">
          {company.phone ? <Phone size={14} /> : null}
          {company.phone || "—"}
        </span>
      ),
    },
    {
      key: "website",
      header: "เว็บไซต์",
      render: (company) =>
        company.website ? (
          <a
            href={
              /^https?:\/\//i.test(company.website)
                ? company.website
                : `https://${company.website}`
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Globe size={14} />
            เยี่ยมชมเว็บไซต์
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (company) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(company)}
            title="แก้ไขข้อมูลบริษัท"
            aria-label={`แก้ไข ${company.name}`}
          >
            <Pencil size={16} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(company)}
            disabled={deleteMutation.isPending}
            title="ลบบริษัท"
            aria-label={`ลบ ${company.name}`}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} className="text-red-500" />
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
        โหลดข้อมูลบริษัทไม่สำเร็จ: {getErrorMessage(error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="บริษัท"
        description="จัดการข้อมูลบริษัทขององค์กร"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={18} />
            เพิ่มบริษัท
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="ค้นหาบริษัท..."
          />
        </div>

        <p className="text-sm text-slate-500">ทั้งหมด {total} บริษัท</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredCompanies}
        getRowKey={(company) => company.id}
        emptyTitle={search ? "ไม่พบข้อมูลบริษัท" : "ยังไม่มีข้อมูลบริษัท"}
        emptyDescription={
          search
            ? "ลองค้นหาด้วยคำค้นอื่น"
            : "เพิ่มบริษัทแรกของคุณเพื่อเริ่มต้นใช้งาน"
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedCompany ? "แก้ไขข้อมูลบริษัท" : "เพิ่มบริษัท"}
        description="กรอกข้อมูลบริษัทด้านล่าง"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <Input
            label="ชื่อบริษัท"
            name="name"
            type="text"
            required
            maxLength={255}
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="กรอกชื่อบริษัท"
          />

          <FilePicker
            value={form.logo_file_id ?? null}
            onChange={(fileId) =>
              setForm((current) => ({
                ...current,
                logo_file_id: fileId,
              }))
            }
            category="IMAGE"
            label="Company Logo"
            disabled={isSaving}
          />

          <Input
            label="ประเภทธุรกิจ"
            name="industry"
            type="text"
            value={form.industry ?? ""}
            onChange={(event) => handleChange("industry", event.target.value)}
            placeholder="เช่น เทคโนโลยี"
          />

          <Textarea
            label="ที่อยู่"
            name="address"
            rows={3}
            value={form.address ?? ""}
            onChange={(event) => handleChange("address", event.target.value)}
            placeholder="กรอกที่อยู่บริษัท"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="เบอร์โทรศัพท์"
              name="phone"
              type="tel"
              value={form.phone ?? ""}
              onChange={(event) => handleChange("phone", event.target.value)}
              placeholder="กรอกเบอร์โทรศัพท์"
            />

            <Input
              label="เว็บไซต์"
              name="website"
              type="text"
              value={form.website ?? ""}
              onChange={(event) => handleChange("website", event.target.value)}
              placeholder="example.com"
            />
          </div>

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
              {selectedCompany ? "บันทึกการแก้ไข" : "เพิ่มบริษัท"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={!!tagCompany}
        onClose={closeTagModal}
        title="จัดการ Tags"
        description={`จัดการ Tags ของ ${tagCompany?.name ?? ""}`}
        size="md"
      >
        <div className="space-y-5 p-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Tags ที่กำลังใช้งาน
            </h3>

            {isCompanyTagsLoading ? (
              <LoaderCircle className="animate-spin text-blue-600" size={22} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(companyTagAssignments ?? []).map((assignment) => {
                  const tag = availableTags.find(
                    (item) => item.id === assignment.tag_id,
                  );

                  if (!tag) return null;

                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                      style={{
                        backgroundColor: tag.color ?? "#e2e8f0",
                        color: "#ffffff",
                      }}
                    >
                      {tag.name}

                      <button
                        type="button"
                        onClick={() => handleUnassignTag(tag.id)}
                        disabled={unassignTagMutation.isPending}
                        className="rounded-full hover:opacity-70"
                        aria-label={`ถอด ${tag.name}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}

                {companyTagAssignments?.length === 0 && (
                  <p className="text-sm text-slate-400">ยังไม่มี Tags</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              เพิ่ม Tag
            </h3>

            <div className="space-y-2">
              {unassignedTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: tag.color ?? "#e2e8f0",
                      color: "#ffffff",
                    }}
                  >
                    {tag.name}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignTag(tag.id)}
                    disabled={assignTagMutation.isPending}
                  >
                    <Plus size={14} />
                    เพิ่ม
                  </Button>
                </div>
              ))}

              {unassignedTags.length === 0 && (
                <p className="text-sm text-slate-400">
                  เพิ่ม Tags ครบทั้งหมดแล้ว
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={closeTagModal}>
              ปิด
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CompaniesPage;
