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
import { useToast } from "../../../components/common/toast-provider";

import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "../hooks/use-notes";

import { useCompanies } from "../../companies/hooks/use-companies";
import { useContacts } from "../../contacts/hooks/use-contacts";
import { useDeals } from "../../deals/hooks/use-deals";

import type { Note, NotePayload } from "../types/note.types";
import type { Company } from "../../companies/types/company.types";
import type { Contact } from "../../contacts/types/contact.types";
import type { Deal } from "../../deals/types/deal.types";

interface NoteFormData {
  title: string;
  content: string;
  company_id: string;
  contact_id: string;
  deal_id: string;
}

const initialForm: NoteFormData = {
  title: "",
  content: "",
  company_id: "",
  contact_id: "",
  deal_id: "",
};

function normalizeId(id: string | null | undefined): string {
  if (!id) return "";

  return id.includes(":") ? id.split(":").slice(1).join(":") : id;
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

function NotesPage() {
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const notesQuery = useNotes(page, limit);

  // โหลดข้อมูลสำหรับ Dropdown
  const companiesQuery = useCompanies(1, 100);
  const contactsQuery = useContacts(1, 100);
  const dealsQuery = useDeals(1, 100);

  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  const notes = notesQuery.data?.items ?? [];
  const total = notesQuery.data?.total ?? 0;
  const totalPages = notesQuery.data?.total_pages ?? 0;

  // Companies และ Deals ใช้ items ส่วน Contacts ใช้ data
  const companies = companiesQuery.data?.items ?? [];
  const contacts = contactsQuery.data?.data ?? [];
  const deals = dealsQuery.data?.items ?? [];

  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [form, setForm] = useState<NoteFormData>(initialForm);
  const [formError, setFormError] = useState("");

  const companyMap = useMemo(
    () =>
      new Map(
        companies.map((company: Company) => [normalizeId(company.id), company]),
      ),
    [companies],
  );

  const contactMap = useMemo(
    () =>
      new Map(
        contacts.map((contact: Contact) => [normalizeId(contact.id), contact]),
      ),
    [contacts],
  );

  const dealMap = useMemo(
    () => new Map(deals.map((deal: Deal) => [normalizeId(deal.id), deal])),
    [deals],
  );

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notes.filter((note: Note) => {
      const company = companyMap.get(normalizeId(note.company_id));
      const contact = contactMap.get(normalizeId(note.contact_id));
      const deal = dealMap.get(normalizeId(note.deal_id));

      return (
        !keyword ||
        note.title.toLowerCase().includes(keyword) ||
        note.content.toLowerCase().includes(keyword) ||
        (company?.name ?? "").toLowerCase().includes(keyword) ||
        (contact?.name ?? "").toLowerCase().includes(keyword) ||
        (deal?.title ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [notes, search, companyMap, contactMap, dealMap]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }

    if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  function updateForm<K extends keyof NoteFormData>(
    field: K,
    value: NoteFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingNote(null);
    setForm(initialForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(note: Note) {
    setEditingNote(note);

    setForm({
      title: note.title,
      content: note.content,
      company_id: note.company_id ?? "",
      contact_id: note.contact_id ?? "",
      deal_id: note.deal_id ?? "",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingNote(null);
    setForm(initialForm);
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const title = form.title.trim();
    const content = form.content.trim();

    if (title.length < 2) {
      setFormError("หัวข้อต้องมีอย่างน้อย 2 ตัวอักษร");
      return;
    }

    if (!content) {
      setFormError("กรุณากรอกเนื้อหาบันทึก");
      return;
    }

    const payload: NotePayload = {
      title,
      content,
      company_id: form.company_id || null,
      contact_id: form.contact_id || null,
      deal_id: form.deal_id || null,
    };

    try {
      if (editingNote) {
        await updateMutation.mutateAsync({
          id: editingNote.id,
          payload,
        });

        showToast("แก้ไขบันทึกเรียบร้อยแล้ว", "success");
      } else {
        await createMutation.mutateAsync(payload);

        showToast("เพิ่มบันทึกเรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function handleDelete(note: Note) {
    const confirmed = window.confirm(
      `คุณต้องการลบบันทึก "${note.title}" หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(note.id);
      showToast("ลบบันทึกเรียบร้อยแล้ว", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const columns = [
    {
      key: "title",
      header: "หัวข้อบันทึก",
      render: (note: Note) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{note.title}</p>
          <p className="mt-1 max-w-sm truncate text-xs text-slate-500">
            {note.content}
          </p>
        </div>
      ),
    },
    {
      key: "company",
      header: "บริษัท",
      render: (note: Note) => (
        <span>{companyMap.get(normalizeId(note.company_id))?.name ?? "—"}</span>
      ),
    },
    {
      key: "contact",
      header: "ผู้ติดต่อ",
      render: (note: Note) => (
        <span>{contactMap.get(normalizeId(note.contact_id))?.name ?? "—"}</span>
      ),
    },
    {
      key: "deal",
      header: "ดีล",
      render: (note: Note) => (
        <span>{dealMap.get(normalizeId(note.deal_id))?.title ?? "—"}</span>
      ),
    },
    {
      key: "created_at",
      header: "วันที่สร้าง",
      render: (note: Note) => (
        <span className="whitespace-nowrap">{formatDate(note.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (note: Note) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(note)}
            aria-label="แก้ไขบันทึก"
          >
            <Pencil size={16} />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(note)}
            aria-label="ลบบันทึก"
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
    notesQuery.isLoading ||
    companiesQuery.isLoading ||
    contactsQuery.isLoading ||
    dealsQuery.isLoading;

  const isError =
    notesQuery.isError ||
    companiesQuery.isError ||
    contactsQuery.isError ||
    dealsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="บันทึก"
        description="จัดการบันทึกข้อมูลและรายละเอียดที่เกี่ยวข้องกับลูกค้า"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            <span className="ml-2">เพิ่มบันทึก</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="ค้นหาหัวข้อ เนื้อหา หรือข้อมูลที่เกี่ยวข้อง..."
          />
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          ไม่สามารถโหลดข้อมูลบันทึก บริษัท ผู้ติดต่อ หรือดีลได้
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <p className="text-sm text-slate-500">ทั้งหมด {total} บันทึก</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <DataTable
              columns={columns}
              data={filteredNotes}
              getRowKey={(note: Note) => note.id}
              loading={isLoading}
              emptyTitle="ไม่พบบันทึก"
              emptyDescription={
                search
                  ? "ลองเปลี่ยนคำค้นหาแล้วค้นหาอีกครั้ง"
                  : "เริ่มต้นด้วยการเพิ่มบันทึกแรกของคุณ"
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
        title={editingNote ? "แก้ไขบันทึก" : "เพิ่มบันทึก"}
        description={
          editingNote ? "แก้ไขรายละเอียดของบันทึก" : "สร้างบันทึกใหม่ในระบบ CRM"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <Input
            label="หัวข้อบันทึก"
            name="title"
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            placeholder="กรอกหัวข้อบันทึก"
            required
            minLength={2}
            maxLength={150}
          />

          <Textarea
            label="เนื้อหาบันทึก"
            name="content"
            value={form.content}
            onChange={(event) => updateForm("content", event.target.value)}
            placeholder="กรอกรายละเอียดที่ต้องการบันทึก..."
            rows={7}
            required
          />

          <div className="space-y-4 rounded-lg border border-slate-200 p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">
                ข้อมูลที่เกี่ยวข้อง
              </p>
              <p className="mt-1 text-xs text-slate-500">
                สามารถเลือกเชื่อมโยงข้อมูลได้มากกว่าหนึ่งรายการ
              </p>
            </div>

            <Select
              label="บริษัท"
              name="company_id"
              value={form.company_id}
              onChange={(event) => updateForm("company_id", event.target.value)}
              options={companies.map((company: Company) => ({
                label: company.name,
                value: company.id,
              }))}
              placeholder="ไม่เชื่อมโยงบริษัท"
            />

            <Select
              label="ผู้ติดต่อ"
              name="contact_id"
              value={form.contact_id}
              onChange={(event) => updateForm("contact_id", event.target.value)}
              options={contacts.map((contact: Contact) => ({
                label: contact.name,
                value: contact.id,
              }))}
              placeholder="ไม่เชื่อมโยงผู้ติดต่อ"
            />

            <Select
              label="ดีล"
              name="deal_id"
              value={form.deal_id}
              onChange={(event) => updateForm("deal_id", event.target.value)}
              options={deals.map((deal: Deal) => ({
                label: deal.title,
                value: deal.id,
              }))}
              placeholder="ไม่เชื่อมโยงดีล"
            />
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
              {editingNote ? "บันทึกการแก้ไข" : "เพิ่มบันทึก"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default NotesPage;
