type PdfPage = string[];
type PdfColor = [number, number, number];

const INK: PdfColor = [0.11, 0.18, 0.26];
const MUTED: PdfColor = [0.39, 0.45, 0.51];
const GREEN: PdfColor = [0.04, 0.48, 0.37];
const BORDER: PdfColor = [0.79, 0.83, 0.86];
const PALE: PdfColor = [0.94, 0.97, 0.96];
const WHITE: PdfColor = [1, 1, 1];

// A4 horizontal: keep every section and row within the printable area.
export class PdfReport {
    private pages: PdfPage[] = [];
    private page: PdfPage = [];
    private y = 0;
    private period = "";
    private detailColumns: { label: string; width: number }[] = [];
    private detailCount = 0;
    private tableColumns: { label: string; width: number }[] = [];
    private tableTitle = "";

    constructor() {
        this.newPage();
    }

    private static safe(value: string) {
        return value.replace(/[^\x20-\x7e\xa0-\xff]/g, "?")
            .replace(/[\\()]/g, "\\$&");
    }

    private static color(value: PdfColor) {
        return value.map(part => part.toFixed(3)).join(" ");
    }

    private text(value: string, x: number, y: number, size = 9, bold = false, color = INK, maxWidth?: number) {
        const maxChars = maxWidth ? Math.max(4, Math.floor(maxWidth / (size * 0.54))) : value.length;
        const visible = value.length > maxChars ? `${value.slice(0, maxChars - 3)}...` : value;
        this.page.push(`${PdfReport.color(color)} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${PdfReport.safe(visible)}) Tj ET`);
    }

    private rect(x: number, y: number, width: number, height: number, fill?: PdfColor, border = BORDER) {
        if (fill) this.page.push(`${PdfReport.color(fill)} rg ${x} ${y} ${width} ${height} re f`);
        this.page.push(`${PdfReport.color(border)} RG 0.6 w ${x} ${y} ${width} ${height} re S`);
    }

    private rule(x1: number, y1: number, x2: number, y2: number) {
        this.page.push(`${PdfReport.color(BORDER)} RG 0.6 w ${x1} ${y1} m ${x2} ${y2} l S`);
    }

    private newPage() {
        this.page = [];
        this.pages.push(this.page);
        this.y = 529;
        this.text("CANCHASDIOGUINHO  /  INFORME DE ALQUILERES", 36, 561, 9, true, GREEN);
        if (this.period) this.text(this.period, 540, 561, 8, false, MUTED, 265);
        this.rule(36, 548, 806, 548);
    }

    private ensure(height: number) {
        if (this.y - height < 48) this.newPage();
    }

    title(title: string, period: string, generated: string) {
        this.period = period;
        this.text(title, 36, this.y, 19, true, INK, 760);
        this.y -= 27;
        this.text(period, 36, this.y, 10, true, GREEN);
        this.text(`Generado: ${generated}`, 540, this.y, 8, false, MUTED, 265);
        this.y -= 28;
    }

    section(title: string) {
        this.ensure(40);
        this.text(title, 36, this.y, 12, true, INK);
        this.y -= 10;
        this.rule(36, this.y, 806, this.y);
        this.y -= 17;
    }

    metrics(items: { label: string; value: string }[]) {
        const width = (770 - 30) / items.length;
        this.ensure(80);
        items.forEach((item, index) => {
            const x = 36 + index * (width + 10);
            this.rect(x, this.y - 61, width, 61, PALE);
            this.text(item.label.toUpperCase(), x + 12, this.y - 18, 8, true, MUTED, width - 24);
            this.text(item.value, x + 12, this.y - 44, 17, true, GREEN, width - 24);
        });
        this.y -= 76;
    }

    note(value: string) {
        this.ensure(25);
        this.text(value, 36, this.y, 8, false, MUTED, 770);
        this.y -= 24;
    }

    tableHeader(columns: { label: string; width: number }[]) {
        this.ensure(27);
        this.rect(36, this.y - 25, 770, 25, GREEN, GREEN);
        let x = 36;
        for (const column of columns) {
            this.text(column.label, x + 8, this.y - 17, 8, true, WHITE, column.width - 16);
            x += column.width;
        }
        this.y -= 25;
    }

    startTable(title: string, columns: { label: string; width: number }[], newPage = false) {
        this.tableTitle = title;
        this.tableColumns = columns;
        if (newPage) this.newPage();
        this.section(title);
        this.tableHeader(columns);
    }

    tableRow(values: string[], widths: number[], alternate = false) {
        if (this.y - 25 < 48) {
            this.newPage();
            this.section(this.tableTitle);
            this.tableHeader(this.tableColumns);
        }
        this.rect(36, this.y - 24, 770, 24, alternate ? PALE : WHITE);
        let x = 36;
        values.forEach((value, index) => {
            if (index) this.rule(x, this.y, x, this.y - 24);
            this.text(value, x + 8, this.y - 16, 8.5, false, INK, widths[index] - 16);
            x += widths[index];
        });
        this.y -= 24;
    }

    startDetails(columns: { label: string; width: number }[]) {
        this.detailColumns = columns;
        this.newPage();
        this.detailHeader();
    }

    private detailHeader() {
        this.text("Detalle de reservas y pagos", 36, this.y, 13, true, INK);
        this.y -= 24;
        this.tableHeader(this.detailColumns);
    }

    detailRow(values: string[], email: string, proof: string) {
        const secondary = `Correo: ${email || "N/A"}    |    Comprobante: ${proof || "N/A"}`.replace(/\s+/g, " ");
        const chunks = secondary.match(/.{1,135}/g) || [""];
        const height = 25 + chunks.length * 14;
        if (this.y - height < 48) {
            this.newPage();
            this.detailHeader();
        }
        const top = this.y;
        this.rect(36, top - height, 770, height, this.detailCount % 2 ? PALE : WHITE);
        let x = 36;
        values.forEach((value, index) => {
            if (index) this.rule(x, top, x, top - 25);
            this.text(value, x + 7, top - 17, 8, false, INK, this.detailColumns[index].width - 14);
            x += this.detailColumns[index].width;
        });
        this.rule(36, top - 25, 806, top - 25);
        chunks.forEach((part, index) => this.text(part.trim(), 43, top - 37 - index * 14, 7.5, false, MUTED, 755));
        this.y -= height;
        this.detailCount++;
    }

    toBuffer() {
        const objects: string[] = [
            "<< /Type /Catalog /Pages 2 0 R >>",
            "",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
        ];
        const pageRefs: number[] = [];
        for (const [index, page] of this.pages.entries()) {
            const pageNumber = objects.length + 1;
            const contentNumber = pageNumber + 1;
            pageRefs.push(pageNumber);
            objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R >>`);
            const footer = `BT /F1 8 Tf 36 23 Td (CanchasDioguinho  |  ${PdfReport.safe(this.period)}) Tj ET\nBT /F1 8 Tf 762 23 Td (${index + 1} / ${this.pages.length}) Tj ET`;
            const stream = `${page.join("\n")}\n${PdfReport.color(MUTED)} rg ${footer}\n`;
            objects.push(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}endstream`);
        }
        objects[1] = `<< /Type /Pages /Kids [${pageRefs.map(n => `${n} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;

        let body = "%PDF-1.4\n";
        const offsets = [0];
        for (let i = 0; i < objects.length; i++) {
            offsets.push(Buffer.byteLength(body, "latin1"));
            body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
        }
        const xref = Buffer.byteLength(body, "latin1");
        body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        for (const offset of offsets.slice(1)) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
        body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
        return Buffer.from(body, "latin1");
    }
}
