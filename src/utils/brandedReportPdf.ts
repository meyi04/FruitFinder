import { jsPDF } from 'jspdf';

export interface BrandedReportSection {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface BrandedReportInput {
  title: string;
  dateRange: string;
  filename: string;
  metrics: { label: string; value: string }[];
  sections: BrandedReportSection[];
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = PAGE_HEIGHT - 19;

async function getLogoPng(): Promise<string> {
  const response = await fetch(`${import.meta.env.BASE_URL}fruitfinder-logo.svg`);
  if (!response.ok) throw new Error('Unable to load the FruitFinder logo for the report.');

  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to prepare the FruitFinder logo for the report.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function downloadBrandedReport(input: BrandedReportInput): Promise<void> {
  const logo = await getLogoPng();
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let cursorY = 70;

  function drawHeader(): void {
    pdf.addImage(logo, 'PNG', MARGIN, 10, 14, 14);
    pdf.setTextColor(41, 79, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('FruitFinder', 32, 19);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 100);
    pdf.text('LOCAL FRUIT. STRONGER COMMUNITIES.', 32, 24);
    pdf.setDrawColor(76, 175, 80);
    pdf.setLineWidth(0.7);
    pdf.line(MARGIN, 31, PAGE_WIDTH - MARGIN, 31);

    pdf.setTextColor(38, 51, 40);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.text(input.title, MARGIN, 42);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(80, 90, 80);
    pdf.text(`Report period: ${input.dateRange}`, MARGIN, 49);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, 55);
    pdf.setDrawColor(224, 233, 223);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, 61, PAGE_WIDTH - MARGIN, 61);
  }

  function nextPage(): void {
    pdf.addPage();
    drawHeader();
    cursorY = 70;
  }

  function ensureSpace(height: number): void {
    if (cursorY + height > CONTENT_BOTTOM) nextPage();
  }

  function drawTableHeader(columns: string[], widths: number[]): void {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    const lineSets = columns.map((column, index) => pdf.splitTextToSize(column, widths[index] - 4));
    const rowHeight = Math.max(8, ...lineSets.map((lines) => lines.length * 3.5 + 3));
    pdf.setFillColor(232, 245, 228);
    pdf.setDrawColor(219, 231, 216);
    pdf.rect(MARGIN, cursorY, CONTENT_WIDTH, rowHeight, 'FD');
    let x = MARGIN;
    columns.forEach((_, index) => {
      pdf.setTextColor(41, 79, 45);
      pdf.text(lineSets[index], x + 2, cursorY + 4.5);
      x += widths[index];
    });
    cursorY += rowHeight;
  }

  drawHeader();

  if (input.metrics.length) {
    ensureSpace(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(41, 79, 45);
    pdf.text('Summary', MARGIN, cursorY);
    cursorY += 5;

    const cellWidth = CONTENT_WIDTH / 2;
    for (let index = 0; index < input.metrics.length; index += 2) {
      ensureSpace(17);
      const pair = input.metrics.slice(index, index + 2);
      pair.forEach((metric, column) => {
        const x = MARGIN + column * cellWidth;
        pdf.setFillColor(247, 250, 246);
        pdf.roundedRect(x + 0.5, cursorY, cellWidth - 3, 14, 2, 2, 'F');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 100);
        pdf.text(pdf.splitTextToSize(metric.label, cellWidth - 8), x + 3, cursorY + 5);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(38, 51, 40);
        pdf.text(pdf.splitTextToSize(metric.value, cellWidth - 8), x + 3, cursorY + 10);
      });
      cursorY += 17;
    }
    cursorY += 3;
  }

  for (const section of input.sections) {
    ensureSpace(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(41, 79, 45);
    pdf.text(section.title, MARGIN, cursorY + 4);
    cursorY += 8;

    if (!section.rows.length) {
      ensureSpace(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 100);
      pdf.text('No data for this report period.', MARGIN, cursorY + 4);
      cursorY += 10;
      continue;
    }

    const widths = section.columns.map(() => CONTENT_WIDTH / section.columns.length);
    drawTableHeader(section.columns, widths);
    for (const row of section.rows) {
      const lineSets = section.columns.map((_, index) =>
        pdf.splitTextToSize(String(row[index] ?? ''), widths[index] - 4),
      );
      const rowHeight = Math.max(7, ...lineSets.map((lines) => lines.length * 3.5 + 3));
      if (cursorY + rowHeight > CONTENT_BOTTOM) {
        nextPage();
        drawTableHeader(section.columns, widths);
      }

      pdf.setDrawColor(229, 235, 227);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(MARGIN, cursorY, CONTENT_WIDTH, rowHeight, 'FD');
      let x = MARGIN;
      lineSets.forEach((lines, index) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(45, 54, 45);
        pdf.text(lines, x + 2, cursorY + 4);
        x += widths[index];
      });
      cursorY += rowHeight;
    }
    cursorY += 7;
  }

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(224, 233, 223);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(110, 120, 110);
    pdf.text('FruitFinder | Local fruit. Stronger communities.', MARGIN, PAGE_HEIGHT - 7);
    pdf.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 7, { align: 'right' });
  }

  pdf.save(input.filename);
}
