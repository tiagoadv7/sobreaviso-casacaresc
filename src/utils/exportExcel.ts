import ExcelJS from 'exceljs';

const BRAND = {
  dark: 'FF084F42',
  primary: 'FF319685',
  light: 'FFDEEDE0',
  white: 'FFFFFFFF',
  text: 'FF1A1A18',
  border: 'FFE5E5E0',
};

interface ExportXlsxOptions {
  sheetName?: string;
  title?: string;
}

export async function exportXlsxFile(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  options: ExportXlsxOptions = {}
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sobreaviso Casacaresc';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet((options.sheetName || 'Dados').slice(0, 31));

  if (options.title) {
    const titleRow = sheet.addRow([options.title]);
    sheet.mergeCells(1, 1, 1, headers.length);
    titleRow.height = 28;
    titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: BRAND.white } };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.dark } };
  }

  const headerRow = sheet.addRow(headers);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: BRAND.white }, size: 10.5 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.primary } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: BRAND.white } },
      bottom: { style: 'thin', color: { argb: BRAND.white } },
      left: { style: 'thin', color: { argb: BRAND.white } },
      right: { style: 'thin', color: { argb: BRAND.white } },
    };
  });

  rows.forEach((r, i) => {
    const row = sheet.addRow(r);
    const isEven = i % 2 === 0;
    row.eachCell((cell) => {
      cell.font = { size: 10.5, color: { argb: BRAND.text } };
      cell.alignment = { vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? BRAND.white : BRAND.light },
      };
      cell.border = {
        bottom: { style: 'hair', color: { argb: BRAND.border } },
      };
    });
  });

  sheet.views = [{ state: 'frozen', ySplit: options.title ? 2 : 1 }];

  headers.forEach((h, idx) => {
    const contentLengths = rows.map((r) => String(r[idx] ?? '').length);
    const maxLen = Math.max(h.length, ...contentLengths, 0);
    sheet.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 3, 10), 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
