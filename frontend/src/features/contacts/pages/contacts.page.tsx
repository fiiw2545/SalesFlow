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
              pattern="^\\+?[0-9]{10,15}$"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              placeholder="0898765432"
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
    </div>
  );
}
