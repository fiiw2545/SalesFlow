import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
  FolderOpen,
  LoaderCircle,
  Trash2,
  UploadCloud,
  Eye,
} from "lucide-react";

import PageHeader from "../../../components/ui/page-header";
import EmptyState from "../../../components/ui/empty-state";
import Pagination from "../../../components/ui/pagination";
import Button from "../../../components/common/button";
import Modal from "../../../components/common/modal";
import { useToast } from "../../../components/common/toast-provider";

import { useFiles, useUploadFile, useDeleteFile } from "../hooks/use-files";

import { downloadFile } from "../services/file.service";
import type { StoredFile } from "../types/file.types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".txt",
  ".csv",
  ".docx",
  ".xlsx",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getApiErrorMessage(error: unknown): string {
  const apiError = error as {
    response?: {
      data?: {
        detail?: string;
      };
    };
  };

  return (
    apiError.response?.data?.detail || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
  );
}

function FileThumbnail({ file }: { file: StoredFile }) {
  const [src, setSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (file.category !== "IMAGE") return;

    let cancelled = false;
    let objectUrl: string | null = null;

    downloadFile(file.id)
      .then((blob) => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file.id, file.category]);

  if (file.category === "IMAGE") {
    if (hasError) {
      return (
        <div className="flex h-40 items-center justify-center bg-slate-100">
          <FileImage size={36} className="text-slate-400" />
        </div>
      );
    }

    if (!src) {
      return (
        <div className="flex h-40 items-center justify-center bg-slate-100">
          <LoaderCircle size={28} className="animate-spin text-slate-400" />
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={file.original_name}
        className="h-40 w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-40 items-center justify-center bg-slate-50">
      {file.extension === ".xlsx" || file.extension === ".csv" ? (
        <FileSpreadsheet size={48} className="text-green-600" />
      ) : (
        <FileText size={48} className="text-slate-400" />
      )}
    </div>
  );
}

function FilesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

  const offset = (page - 1) * limit;

  const { data, isLoading, isError, refetch } = useFiles(limit, offset);

  const uploadMutation = useUploadFile();
  const deleteMutation = useDeleteFile();

  const files = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      showToast("ไม่รองรับประเภทไฟล์นี้", "error");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast("ไฟล์ต้องมีขนาดไม่เกิน 10 MB", "error");
      event.target.value = "";
      return;
    }

    uploadMutation.mutate(file, {
      onSuccess: () => {
        showToast("อัปโหลดไฟล์สำเร็จ", "success");
        setPage(1);
      },
      onError: (error) => {
        showToast(getApiErrorMessage(error), "error");
      },
    });

    event.target.value = "";
  };

  const handleDownload = async (file: StoredFile) => {
    try {
      const blob = await downloadFile(file.id);
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.original_name;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  };

  const handleDelete = () => {
    if (!fileToDelete) return;

    deleteMutation.mutate(fileToDelete.id, {
      onSuccess: () => {
        showToast("ลบไฟล์สำเร็จ", "success");
        setFileToDelete(null);
        setSelectedFile(null);

        if (files.length === 1 && page > 1) {
          setPage((current) => current - 1);
        }
      },
      onError: (error) => {
        showToast(getApiErrorMessage(error), "error");
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        description="จัดการรูปภาพและเอกสารของ Organization"
        action={
          <Button
            onClick={() => fileInputRef.current?.click()}
            loading={uploadMutation.isPending}
          >
            <UploadCloud size={17} />
            Upload File
          </Button>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleUpload}
        disabled={uploadMutation.isPending}
      />

      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
        <UploadCloud size={36} className="mx-auto mb-3 text-blue-500" />

        <p className="text-sm font-medium text-slate-700">
          Upload รูปภาพหรือเอกสาร
        </p>

        <p className="mt-1 text-xs text-slate-500">
          JPG, PNG, GIF, WebP, PDF, TXT, CSV, DOCX, XLSX
        </p>

        <p className="mt-1 text-xs text-slate-400">ขนาดไฟล์สูงสุด 10 MB</p>

        <Button
          className="mt-4"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          loading={uploadMutation.isPending}
        >
          <UploadCloud size={15} />
          เลือกไฟล์
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">All Files</h2>

          <p className="mt-1 text-sm text-slate-500">{total} ไฟล์</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center rounded-xl border border-slate-200 bg-white py-16">
          <LoaderCircle size={32} className="animate-spin text-blue-600" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">ไม่สามารถโหลดรายการไฟล์ได้</p>

          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            ลองอีกครั้ง
          </Button>
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          title="ยังไม่มีไฟล์"
          description="อัปโหลดรูปภาพหรือเอกสารเพื่อเริ่มใช้งาน File Storage"
          icon={<FolderOpen size={28} />}
          action={
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={15} />
              Upload File
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className="block w-full text-left"
                  title="ดูรายละเอียดไฟล์"
                >
                  <FileThumbnail file={file} />

                  <div className="p-4">
                    <p
                      className="truncate text-sm font-semibold text-slate-800"
                      title={file.original_name}
                    >
                      {file.original_name}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.category}</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(file.created_at)}
                    </p>
                  </div>
                </button>

                <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(file)}
                  >
                    <Eye size={15} />
                    Preview
                  </Button>

                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      title="Download"
                    >
                      <Download size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setFileToDelete(file)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        title="File Preview"
        description={selectedFile?.original_name}
        size="xl"
      >
        {selectedFile && (
          <div className="p-6">
            {selectedFile.category === "IMAGE" ? (
              <FileThumbnail file={selectedFile} />
            ) : (
              <div className="flex flex-col items-center rounded-xl bg-slate-50 px-6 py-12">
                <FileText size={56} className="text-slate-400" />
                <p className="mt-4 text-sm font-medium text-slate-700">
                  {selectedFile.original_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedFile.content_type}
                </p>
              </div>
            )}

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p>ขนาด: {formatFileSize(selectedFile.size)}</p>
              <p>ประเภท: {selectedFile.category}</p>
              <p>วันที่อัปโหลด: {formatDate(selectedFile.created_at)}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => handleDownload(selectedFile)}>
                <Download size={16} />
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        title="ยืนยันการลบไฟล์"
        description="ไฟล์ที่ลบแล้วจะไม่สามารถดาวน์โหลดได้อีก"
        size="sm"
      >
        <div className="p-6">
          <p className="break-all text-sm text-slate-600">
            ต้องการลบไฟล์ "{fileToDelete?.original_name}" ใช่หรือไม่?
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setFileToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              ยกเลิก
            </Button>

            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              ลบไฟล์
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default FilesPage;
