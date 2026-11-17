import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AxiosError } from "axios";

import Pagination from "../../../components/ui/pagination";
import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Select from "../../../components/common/select";
import Modal from "../../../components/common/modal";
import { useToast } from "../../../components/common/toast-provider";

import PageHeader from "../../../components/ui/page-header";
import SearchInput from "../../../components/ui/search-input";
import DataTable from "../../../components/ui/data-table";

import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "../hooks/use-contacts";

import { useCompanies } from "../../companies/hooks/use-companies";

import type { Contact, ContactPayload } from "../types/contact.types";
import type { DataTableColumn } from "../../../components/ui/data-table";

import { Tags, X } from "lucide-react";

import { useTags } from "../../tags/hooks/use-tags";
import type { Tag } from "../../tags/types/tag.types";

import {
  useContactTags,
  useAssignContactTag,
  useUnassignContactTag,
} from "../hooks/use-contact-tags";

const initialForm: ContactPayload = {
  name: "",
  email: "",
  phone: "",
  age: 0,
  company_id: null,
  position: "",
};

function normalizeCompanyId(id: string | null | undefined) {
  return id?.replace(/^companies:/, "") ?? "";
}

interface ContactTagsModalProps {
  contact: Contact | null;
  tags: Tag[];
  onClose: () => void;
}

function ContactTagsModal({ contact, tags, onClose }: ContactTagsModalProps) {
  const { showToast } = useToast();

  const {
    data: assignments,
    isLoading,
    isError,
  } = useContactTags(contact?.id ?? "");

  const assignMutation = useAssignContactTag();
  const unassignMutation = useUnassignContactTag();

  const assignedTagIds = new Set(
    (assignments ?? []).map((item) => item.tag_id),
  );

  const assignedTags = (assignments ?? [])
    .map((item) => tags.find((tag) => tag.id === item.tag_id))
    .filter((tag): tag is Tag => !!tag);

  const availableTags = tags.filter((tag) => !assignedTagIds.has(tag.id));

  async function handleAssign(tagId: string) {
    if (!contact) return;

    try {
      await assignMutation.mutateAsync({
        contactId: contact.id,
        payload: { tag_id: tagId },
      });

      showToast("เพิ่ม Tag เรียบร้อยแล้ว", "success");
    } catch {
      showToast("ไม่สามารถเพิ่ม Tag ได้", "error");
    }
  }

  async function handleUnassign(tagId: string) {
    if (!contact) return;

    try {
      await unassignMutation.mutateAsync({
        contactId: contact.id,
        tagId,
      });

      showToast("ถอด Tag เรียบร้อยแล้ว", "success");
    } catch {
      showToast("ไม่สามารถถอด Tag ได้", "error");
    }
  }

  return (
    <Modal
      isOpen={!!contact}
      onClose={onClose}
      title="จัดการ Tags"
      description={`จัดการ Tags ของ ${contact?.name ?? ""}`}
      size="md"
    >
      <div className="space-y-5 p-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Tags ปัจจุบัน
          </h3>

          {isLoading ? (
            <p className="text-sm text-slate-500">กำลังโหลด Tags...</p>
          ) : isError ? (
            <p className="text-sm text-red-500">ไม่สามารถโหลด Tags ได้</p>
          ) : assignedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: tag.color ?? "#e2e8f0",
                    color: tag.color ? "#ffffff" : "#334155",
                  }}
                >
                  {tag.name}

                  <button
                    type="button"
                    onClick={() => handleUnassign(tag.id)}
                    disabled={unassignMutation.isPending}
                    aria-label={`ถอด ${tag.name}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">ยังไม่มี Tags</p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            เพิ่ม Tag
          </h3>

          {availableTags.length > 0 ? (
            <div className="space-y-2">
              {availableTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: tag.color ?? "#e2e8f0",
                      color: tag.color ? "#ffffff" : "#334155",
                    }}
                  >
                    {tag.name}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssign(tag.id)}
                    disabled={assignMutation.isPending || isLoading || isError}
                  >
                    เพิ่ม
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              {isLoading ? "กำลังโหลด..." : "ไม่มี Tags ที่สามารถเพิ่มได้"}
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface ContactTagsCellInlineProps {
  contact: Contact;
  tags: Tag[];
  onManage: () => void;
}

function ContactTagsCellInline({
  contact,
  tags,
  onManage,
}: ContactTagsCellInlineProps) {
  const { data: assignments, isLoading, isError } = useContactTags(contact.id);

  const assignedTags = (assignments ?? [])
    .map((item) => tags.find((tag) => tag.id === item.tag_id))
    .filter((tag): tag is Tag => !!tag);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isLoading ? (
        <span className="text-xs text-slate-400">กำลังโหลด...</span>
      ) : isError ? (
        <span className="text-xs text-red-500">โหลดไม่สำเร็จ</span>
      ) : assignedTags.length > 0 ? (
        assignedTags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: tag.color ?? "#e2e8f0",
              color: tag.color ? "#ffffff" : "#334155",
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
        aria-label={`จัดการ Tags ของ ${contact.name}`}
      >
        <Tags size={15} />
      </Button>
    </div>
  );
}

export default function ContactsPage() {
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactPayload>(initialForm);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const contactsQuery = useContacts(page, limit);
  const companiesQuery = useCompanies();

  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const contacts = contactsQuery.data?.data ?? [];
  const total = contactsQuery.data?.total ?? 0;
  const totalPages = contactsQuery.data?.total_pages ?? 0;

  const companies = companiesQuery.data?.items ?? [];
  const [tagContact, setTagContact] = useState<Contact | null>(null);

  const { data: tagsResponse } = useTags(1, 100);
  const availableTags = tagsResponse?.items ?? [];

  // ค้นหาข้อมูลในหน้าปัจจุบัน
  const filteredContacts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return contacts;

    return contacts.filter((contact: Contact) => {
      const company = companies.find(
        (item) =>
          normalizeCompanyId(item.id) ===
          normalizeCompanyId(contact.company_id),
      );

      return [
        contact.name,
        contact.email,
        contact.phone,
        contact.position ?? "",
        company?.name ?? "",
      ].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [contacts, companies, search]);

  function openCreateModal() {
    setEditingContact(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(contact: Contact) {
    setEditingContact(contact);

    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      age: contact.age,
      company_id: contact.company_id,
      position: contact.position ?? "",
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingContact(null);
    setForm(initialForm);
  }

  function handleChange(
    field: keyof ContactPayload,
    value: string | number | null,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: ContactPayload = {
      ...form,
      age: Number(form.age),
      company_id: form.company_id || null,
      position: form.position?.trim() || null,
    };

    try {
      if (editingContact) {
        await updateMutation.mutateAsync({
          id: editingContact.id,
          payload,
        });

        showToast("แก้ไขข้อมูลผู้ติดต่อเรียบร้อยแล้ว", "success");
      } else {
        await createMutation.mutateAsync(payload);

        showToast("เพิ่มผู้ติดต่อเรียบร้อยแล้ว", "success");
      }

      closeModal();
    } catch (error) {
      const axiosError = error as AxiosError<{
        detail?: string;
      }>;

      showToast(
        axiosError.response?.data?.detail ??
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        "error",
      );
    }
  }

  async function handleDelete(contact: Contact) {
    const confirmed = window.confirm(
      `คุณต้องการลบผู้ติดต่อ "${contact.name}" ใช่หรือไม่?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(contact.id);

      showToast("ลบผู้ติดต่อเรียบร้อยแล้ว", "success");
    } catch (error) {
      const axiosError = error as AxiosError<{
        detail?: string;
      }>;

      showToast(
        axiosError.response?.data?.detail ?? "ไม่สามารถลบผู้ติดต่อได้",
        "error",
      );
    }
  }

  const columns: DataTableColumn<Contact>[] = [
    {
      key: "name",
      header: "ชื่อผู้ติดต่อ",
      render: (contact) => (
        <div>
          <p className="font-medium text-slate-900">{contact.name}</p>
          <p className="text-xs text-slate-500">อายุ: {contact.age} ปี</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "อีเมล",
      render: (contact) => (
        <span className="text-slate-600">{contact.email}</span>
      ),
    },
    {
      key: "phone",
      header: "เบอร์โทรศัพท์",
      render: (contact) => (
        <span className="text-slate-600">{contact.phone}</span>
      ),
    },
    {
      key: "company",
      header: "บริษัท",
      render: (contact) => {
        const company = companies.find(
          (item) =>
            normalizeCompanyId(item.id) ===
            normalizeCompanyId(contact.company_id),
        );

        return <span className="text-slate-600">{company?.name ?? "—"}</span>;
      },
    },
    {
      key: "position",
      header: "ตำแหน่ง",
      render: (contact) => (
        <span className="text-slate-600">{contact.position || "—"}</span>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      render: (contact) => {
        return (
          <ContactTagsCellInline
            contact={contact}
            tags={availableTags}
            onManage={() => setTagContact(contact)}
          />
        );
      },
    },
    {
      key: "actions",
      header: "จัดการ",
      className: "text-right",
      render: (contact) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(contact)}
            title="แก้ไขข้อมูลผู้ติดต่อ"
            aria-label={`แก้ไข ${contact.name}`}
          >
            <Pencil size={16} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(contact)}
            disabled={deleteMutation.isPending}
            title="ลบผู้ติดต่อ"
            aria-label={`ลบ ${contact.name}`}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ผู้ติดต่อ"
        description="จัดการข้อมูลผู้ติดต่อขององค์กร"
        action={
          <Button onClick={openCreateModal}>
            <Plus size={18} />
            เพิ่มผู้ติดต่อ
          </Button>
        }
      />

      {contactsQuery.isLoading ? (
        <div className="py-10 text-center text-sm text-slate-500">
          กำลังโหลดข้อมูลผู้ติดต่อ...
        </div>
      ) : contactsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          ไม่สามารถโหลดข้อมูลผู้ติดต่อได้
        </div>
      ) : (
        <>
          {/* ช่องค้นหาและจำนวนรายการ */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                placeholder="ค้นหาผู้ติดต่อ..."
              />
            </div>

            <p className="text-sm text-slate-500">ทั้งหมด {total} รายการ</p>
          </div>

          {/* ตารางผู้ติดต่อ */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <DataTable
              columns={columns}
              data={filteredContacts}
              getRowKey={(contact) => contact.id}
              emptyTitle="ไม่พบข้อมูลผู้ติดต่อ"
              emptyDescription={
                search
                  ? "ไม่พบผู้ติดต่อที่ตรงกับคำค้นหา"
                  : "ยังไม่มีข้อมูลผู้ติดต่อ ลองเพิ่มผู้ติดต่อใหม่"
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
        </>
      )}

      {/* Modal เพิ่ม / แก้ไขผู้ติดต่อ */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingContact ? "แก้ไขข้อมูลผู้ติดต่อ" : "เพิ่มผู้ติดต่อ"}
        description={
          editingContact
            ? "แก้ไขข้อมูลผู้ติดต่อตามต้องการ"
            : "กรอกข้อมูลเพื่อเพิ่มผู้ติดต่อใหม่"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="ชื่อ-นามสกุล"
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="กรอกชื่อผู้ติดต่อ"
            />

            <Input
              label="อีเมล"
              required
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="กรอกอีเมล"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="เบอร์โทรศัพท์"
              required
              type="tel"
              pattern="^\+?[0-9]{10,15}$"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              placeholder="0898765432"
              title="กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 10-15 หลัก และสามารถมีเครื่องหมาย + นำหน้าได้"
            />

            <Input
              label="อายุ"
              required
              type="number"
              min={0}
              max={120}
              value={form.age}
              onChange={(event) =>
                handleChange("age", Number(event.target.value))
              }
            />
          </div>

          <Select
            label="บริษัท"
            value={normalizeCompanyId(form.company_id)}
            onChange={(event) =>
              handleChange("company_id", event.target.value || null)
            }
            options={[
              { label: "ไม่ระบุบริษัท", value: "" },
              ...companies.map((company) => ({
                label: company.name,
                value: normalizeCompanyId(company.id),
              })),
            ]}
          />

          <Input
            label="ตำแหน่ง"
            maxLength={100}
            value={form.position ?? ""}
            onChange={(event) => handleChange("position", event.target.value)}
            placeholder="เช่น ผู้จัดการฝ่ายการตลาด"
          />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              ยกเลิก
            </Button>

            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingContact ? "บันทึกการแก้ไข" : "เพิ่มผู้ติดต่อ"}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Modal จัดการ Contact Tags */}
      <ContactTagsModal
        contact={tagContact}
        tags={availableTags}
        onClose={() => setTagContact(null)}
      />
    </div>
  );
}
