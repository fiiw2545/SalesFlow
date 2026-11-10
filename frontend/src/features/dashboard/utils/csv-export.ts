export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: unknown[][],
) => {
  const escapeCsvValue = (value: unknown): string => {
    const text = value == null ? "" : String(value);

    return `"${text.replace(/"/g, '""')}"`;
  };

  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");

  // UTF-8 BOM ช่วยให้ Excel อ่านภาษาไทยได้ถูกต้อง
  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const getCsvDateSuffix = (
  startDate?: string,
  endDate?: string,
): string => {
  const start = startDate?.slice(0, 10);
  const end = endDate?.slice(0, 10);

  if (start && end) {
    return `${start}_to_${end}`;
  }

  if (start) {
    return `from_${start}`;
  }

  if (end) {
    return `until_${end}`;
  }

  return "all-data";
};
