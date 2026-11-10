import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import axios from "axios";

import {
  Users,
  UserPlus,
  ShieldCheck,
  Crown,
  BriefcaseBusiness,
  Trash2,
  LoaderCircle,
  CalendarDays,
  RefreshCw,
  Building2,
} from "lucide-react";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  useMemberships,
  useCreateMembership,
  useUpdateMembership,
  useDeleteMembership,
} from "../hooks/use-memberships";

import type {
  Membership,
  MembershipCreatePayload,
  MembershipRole,
} from "../types/membership.types";

import { useToast } from "../../../components/common/toast-provider";
import Button from "../../../components/common/button";
import Input from "../../../components/common/input";
import Modal from "../../../components/common/modal";

import PageHeader from "../../../components/ui/page-header";
import Pagination from "../../../components/ui/pagination";

const roleOptions: {
  value: MembershipRole;
  label: string;
}[] = [
  { value: "ADMIN", label: "ผู้ดูแลระบบ" },
  { value: "MANAGER", label: "ผู้จัดการ" },
  { value: "SALES", label: "พนักงานขาย" },
];

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

function getRoleLabel(role: string): string {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

function getRoleIcon(role: MembershipRole) {
  switch (role) {
    case "ADMIN":
      return <Crown size={16} />;

    case "MANAGER":
      return <ShieldCheck size={16} />;

    default:
      return <BriefcaseBusiness size={16} />;
  }
}

function getRoleStyle(role: MembershipRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-purple-50 text-purple-700";

    case "MANAGER":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(value: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function MembersPage() {
  const { showToast } = useToast();

  const { organizations, activeOrganization, setActiveOrganization } =
    useOrganization();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [newRole, setNewRole] = useState<MembershipRole>("SALES");
  const [formError, setFormError] = useState("");

  const [roleDrafts, setRoleDrafts] = useState<Record<string, MembershipRole>>(
    {},
  );

  const organizationId = activeOrganization?.id;

  const isAdmin = activeOrganization?.role === "ADMIN";

  const { data, isLoading, isError, refetch, isFetching } = useMemberships(
    organizationId,
    page,
    limit,
  );

  const members = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 0;

  const createMutation = useCreateMembership(organizationId);
  const updateMutation = useUpdateMembership(organizationId);
  const deleteMutation = useDeleteMembership(organizationId);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    } else if (totalPages === 0 && page > 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  function openModal() {
    setUserId("");
    setNewRole("SALES");
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setUserId("");
    setNewRole("SALES");
    setFormError("");
  }

  function handleOrganizationChange(organizationId: string) {
    const selectedOrganization = organizations.find(
      (organization) => organization.id === organizationId,
    );

    if (!selectedOrganization) {
      return;
    }

    setActiveOrganization(selectedOrganization.id);
    setRoleDrafts({});
    setPage(1);
    closeModal();
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!activeOrganization) {
      setFormError("กรุณาเลือกองค์กรก่อนเพิ่มสมาชิก");
      return;
    }

    if (!isAdmin) {
      setFormError("เฉพาะผู้ดูแลระบบเท่านั้นที่เพิ่มสมาชิกได้");
      return;
    }

    const payload: MembershipCreatePayload = {
      user_id: userId.trim(),
      role: newRole,
    };

    if (!payload.user_id) {
      setFormError("กรุณากรอก User ID");
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        showToast("เพิ่มสมาชิกเรียบร้อยแล้ว", "success");
        setPage(1);
        closeModal();
      },
      onError: (error) => {
        const message = getErrorMessage(error);
        setFormError(message);
        showToast(message, "error");
      },
    });
  }

  function handleRoleChange(membershipId: string, role: MembershipRole) {
    setRoleDrafts((current) => ({
      ...current,
      [membershipId]: role,
    }));
  }

  function handleUpdateRole(member: Membership) {
    if (!isAdmin) {
      showToast("เฉพาะผู้ดูแลระบบเท่านั้นที่เปลี่ยน Role ได้", "error");
      return;
    }

    const selectedRole = roleDrafts[member.id] ?? member.role;

    if (selectedRole === member.role) {
      return;
    }

    updateMutation.mutate(
      {
        id: member.id,
        role: selectedRole,
      },
      {
        onSuccess: () => {
          setRoleDrafts((current) => {
            const next = { ...current };
            delete next[member.id];
            return next;
          });

          showToast("เปลี่ยนบทบาทสมาชิกเรียบร้อยแล้ว", "success");
        },
        onError: (error) => {
          showToast(getErrorMessage(error), "error");
        },
      },
    );
  }

  function handleRemoveMember(member: Membership) {
    if (!isAdmin) {
      showToast("เฉพาะผู้ดูแลระบบเท่านั้นที่นำสมาชิกออกได้", "error");
      return;
    }

    const confirmed = window.confirm(
      `ต้องการนำสมาชิก ${member.user_id} ออกจากองค์กรใช่หรือไม่?`,
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(member.id, {
      onSuccess: () => {
        showToast("นำสมาชิกออกจากองค์กรเรียบร้อยแล้ว", "success");
      },
      onError: (error) => {
        showToast(getErrorMessage(error), "error");
      },
    });
  }

  if (!activeOrganization) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="สมาชิก"
          description="จัดการสมาชิกและบทบาทภายในองค์กร"
        />

        {organizations.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <label
              htmlFor="organization-select"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              เลือกองค์กร
            </label>

            <select
              id="organization-select"
              value=""
              onChange={(event) => handleOrganizationChange(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
            >
              <option value="" disabled>
                เลือกองค์กรที่ต้องการจัดการ
              </option>

              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name} ({getRoleLabel(organization.role)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Users className="mx-auto text-slate-300" size={40} />

          <p className="mt-3 font-medium text-slate-900">
            ยังไม่ได้เลือกองค์กร
          </p>

          <p className="mt-1 text-sm text-slate-500">
            กรุณาเลือกองค์กรก่อนจัดการสมาชิก
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Building2 size={20} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-900">
              องค์กรที่กำลังจัดการ
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {activeOrganization.name}
            </p>
          </div>
        </div>

        {organizations.length > 1 && (
          <select
            aria-label="เลือกองค์กร"
            value={activeOrganization.id}
            onChange={(event) => handleOrganizationChange(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name} ({getRoleLabel(organization.role)})
              </option>
            ))}
          </select>
        )}
      </div>

      <PageHeader
        title="สมาชิก"
        description={`จัดการสมาชิกขององค์กร ${activeOrganization.name}`}
        action={
          isAdmin ? (
            <Button onClick={openModal}>
              <UserPlus size={18} />
              เพิ่มสมาชิก
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users size={20} />}
          label="สมาชิกทั้งหมด"
          value={total}
        />

        <StatCard
          icon={<Crown size={20} />}
          label="ADMIN ในหน้านี้"
          value={members.filter((member) => member.role === "ADMIN").length}
        />

        <StatCard
          icon={<BriefcaseBusiness size={20} />}
          label="สมาชิกทั่วไปในหน้านี้"
          value={members.filter((member) => member.role !== "ADMIN").length}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">รายชื่อสมาชิก</h2>

            <p className="mt-1 text-sm text-slate-500">
              สมาชิกทั้งหมด {total} คน
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            รีเฟรช
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <LoaderCircle className="animate-spin text-blue-600" size={32} />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">โหลดรายชื่อสมาชิกไม่สำเร็จ</p>

            <Button
              variant="outline"
              className="mt-3"
              onClick={() => refetch()}
            >
              ลองอีกครั้ง
            </Button>
          </div>
        ) : members.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto text-slate-300" size={40} />

            <p className="mt-3 font-medium text-slate-900">ยังไม่มีสมาชิก</p>

            <p className="mt-1 text-sm text-slate-500">
              เพิ่มสมาชิกเพื่อเริ่มทำงานร่วมกันในองค์กร
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member) => {
              const selectedRole = roleDrafts[member.id] ?? member.role;

              const hasRoleChanged = selectedRole !== member.role;

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Users size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-all font-medium text-slate-900">
                        {member.user_id}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Membership ID: {member.id}
                      </p>

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays size={13} />
                        เข้าร่วมเมื่อ {formatDate(member.joined_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {isAdmin ? (
                      <>
                        <select
                          aria-label={`บทบาทของ ${member.user_id}`}
                          value={selectedRole}
                          onChange={(event) =>
                            handleRoleChange(
                              member.id,
                              event.target.value as MembershipRole,
                            )
                          }
                          className="h-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <Button
                          size="sm"
                          disabled={!hasRoleChanged || updateMutation.isPending}
                          loading={updateMutation.isPending}
                          onClick={() => handleUpdateRole(member)}
                        >
                          บันทึก Role
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveMember(member)}
                          disabled={deleteMutation.isPending}
                          loading={deleteMutation.isPending}
                        >
                          <Trash2 size={15} />
                          นำออก
                        </Button>
                      </>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getRoleStyle(
                          member.role,
                        )}`}
                      >
                        {getRoleIcon(member.role)}
                        {getRoleLabel(member.role)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && total > 0 && (
          <div className="border-t border-slate-100 p-4">
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
        )}
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <ShieldCheck className="mr-2 inline-block" size={17} />
          เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่ม เปลี่ยนบทบาท
          หรือนำสมาชิกออกจากองค์กรได้
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="เพิ่มสมาชิก"
        description="เพิ่มผู้ใช้ที่มีบัญชีอยู่ในระบบเข้ามาเป็นสมาชิกขององค์กร"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 p-6">
          <Input
            label="User ID"
            name="user_id"
            type="text"
            required
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="กรอก User ID"
            helperText="กรอก ID ของบัญชีผู้ใช้ที่ต้องการเพิ่มเข้ามาในองค์กร"
          />

          <div>
            <label
              htmlFor="new-member-role"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              บทบาทสมาชิก
            </label>

            <select
              id="new-member-role"
              value={newRole}
              onChange={(event) =>
                setNewRole(event.target.value as MembershipRole)
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              disabled={createMutation.isPending}
            >
              ยกเลิก
            </Button>

            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              <UserPlus size={16} />
              เพิ่มสมาชิก
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default MembersPage;
