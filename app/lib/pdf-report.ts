type PdfPage = string[];

// Small, dependency-free PDF writer for the text-only audit report.
export class PdfReport {
    private pages: PdfPage[] = [];
    private page: PdfPage = [];
    private y = 0;

    constructor() {
        this.newPage();
    }

    private newPage() {
        this.page = [];
        this.pages.push(this.page);
        this.y = 552;
    }

    private static safe(value: string) {
        return value.replace(/[^\x20-\x7e\xa0-\xff]/g, "?")
            .replace(/[\\()]/g, "\\$&");
    }

    line(value: string, size = 10, bold = false, gap = 16) {
        const width = Math.floor(1300 / size);
        for (let i = 0; i < Math.max(value.length, 1); i += width) {
            if (this.y < 38) this.newPage();
            this.page.push(`BT /${bold ? "F2" : "F1"} ${size} Tf 36 ${this.y} Td (${PdfReport.safe(value.slice(i, i + width))}) Tj ET`);
            this.y -= gap;
        }
    }

    row(columns: { value: string; x: number; max: number }[], bold = false) {
        if (this.y < 42) this.newPage();
        for (const { value, x, max } of columns) {
            const clipped = value.length > max ? `${value.slice(0, max - 3)}...` : value;
            this.page.push(`BT /${bold ? "F2" : "F1"} 8 Tf ${x} ${this.y} Td (${PdfReport.safe(clipped)}) Tj ET`);
        }
        this.y -= 15;
    }

    space(height = 10) {
        this.y -= height;
    }

    toBuffer() {
        const objects: string[] = [
            "<< /Type /Catalog /Pages 2 0 R >>",
            "", // page tree
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
        ];
        const pageRefs: number[] = [];
        for (const page of this.pages) {
            const pageNumber = objects.length + 1;
            const contentNumber = pageNumber + 1;
            pageRefs.push(pageNumber);
            objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R >>`);
            const stream = page.join("\n") + `\nBT /F1 8 Tf 750 22 Td (${pageRefs.length}) Tj ET\n`;
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
