import { format } from "date-fns";

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: (keyof T)[]
) {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const cols = columns || Object.keys(data[0]) as (keyof T)[];
  const headers = cols.join(",");
  const rows = data
    .map((item) =>
      cols
        .map((col) => {
          const value = item[col];
          // Handle strings with commas or quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");

  const csv = `${headers}\n${rows}`;
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

/**
 * Export data to Excel (using XLSX format)
 */
export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: (keyof T)[],
  sheetName?: string
) {
  // Dynamically import xlsx to reduce bundle size
  const XLSX = await import("xlsx");

  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const cols = columns || Object.keys(data[0]) as (keyof T)[];
  const headers = cols as string[];
  const rows = data.map((item) =>
    cols.map((col) => {
      const value = item[col];
      return value !== null && value !== undefined ? value : "";
    })
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Sheet1");

  // Set column widths
  const colWidths = headers.map(() => 15);
  worksheet["!cols"] = colWidths.map((width) => ({ wch: width }));

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export to PDF
 */
export async function exportToPDF<T extends Record<string, any>>(
  data: T[],
  filename: string,
  title: string,
  columns?: (keyof T)[]
) {
  // Dynamically import jsPDF and autoTable
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Add title
  pdf.setFontSize(16);
  pdf.text(title, pageWidth / 2, 15, { align: "center" });

  // Add date
  pdf.setFontSize(10);
  pdf.text(`Generated on: ${format(new Date(), "PPP p")}`, 14, 25);

  if (data.length === 0) {
    pdf.text("No data available", 14, 40);
  } else {
    const cols = columns || (Object.keys(data[0]) as (keyof T)[]);
    const headers = cols.map((col) =>
      col
        .toString()
        .replace(/([A-Z])/g, " $1")
        .trim()
    );

    const rows = data.map((item) =>
      cols.map((col) => {
        const value = item[col];
        return value !== null && value !== undefined ? String(value) : "";
      })
    );

    autoTable(pdf, {
      head: [headers],
      body: rows,
      startY: 35,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 252],
      },
    });
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * Print report
 */
export function printReport(title: string, html: string) {
  const printWindow = window.open("", "", "width=800,height=600");
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .no-print { display: none; }
            @media print {
              button, input { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on: ${format(new Date(), "PPP p")}</p>
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Helper to download file
 */
function downloadFile(content: string, filename: string, contentType: string) {
  const element = document.createElement("a");
  element.setAttribute("href", `data:${contentType};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
