"use client";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ITableCellOptions,
} from "docx";

export interface PDFToWordOptions {
  isGsMode?: boolean;
  onProgress?: (message: string) => void;
}

export const convertPDFToWord = async (
  arrayBuffer: ArrayBuffer,
  options: PDFToWordOptions = {},
): Promise<Blob> => {
  const { isGsMode = false, onProgress } = options;

  onProgress?.("Initializing PDF parser...");

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  onProgress?.("Loading PDF document...");

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const allSections: {
    properties: Record<string, unknown>;
    children: (Paragraph | Table)[];
  }[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Analyzing page ${pageNum} / ${pdf.numPages}`);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items = textContent.items as any[];

    interface TextItemEx {
      str: string;
      x: number;
      y: number; // flipped: top=0
      width: number;
      height: number;
      fontName?: string;
    }

    const enriched: TextItemEx[] = items
      .map((it: any) => ({
        str: it.str,
        x: it.transform[4],
        y: viewport.height - it.transform[5],
        width: it.width,
        height: it.height || 12,
        fontName: it.fontName,
      }))
      .filter((it) => it.str.trim().length > 0);

    if (enriched.length === 0) continue;

    const pageChildren: (Paragraph | Table)[] = [];

    if (!isGsMode) {
      // Standard fast mode
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        onProgress?.(`Processing page ${pageNumber} / ${pdf.numPages}`);

        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        const items: any[] = textContent.items;

        const lines: Record<number, any[]> = {};

        for (const item of items) {
          const y = Math.round(item.transform[5]);

          if (!lines[y]) {
            lines[y] = [];
          }

          lines[y].push(item);
        }

        const sortedLines = Object.keys(lines)
          .map(Number)
          .sort((a, b) => b - a);

        const paragraphs: Paragraph[] = [];

        for (const y of sortedLines) {
          const lineItems = lines[y].sort(
            (a, b) => a.transform[4] - b.transform[4],
          );

          const words: string[] = [];

          for (const item of lineItems) {
            words.push(item.str);
          }

          const lineText = words.join(" ").trim();

          if (lineText.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: lineText,
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 120,
                },
              }),
            );
          }
        }

        allSections.push({
          properties: {},
          children: paragraphs,
        });
      }
    } else {
      // GsMode — advanced layout
      const lineTolerance = 5;
      const lineGroups: { y: number; items: TextItemEx[] }[] = [];

      enriched.sort((a, b) => a.y - b.y || a.x - b.x);

      let current: TextItemEx[] = [];
      let lastY = -9999;

      for (const item of enriched) {
        if (Math.abs(item.y - lastY) > lineTolerance && current.length) {
          lineGroups.push({ y: lastY, items: current });
          current = [];
        }
        current.push(item);
        lastY = item.y;
      }
      if (current.length) lineGroups.push({ y: lastY, items: current });

      let avgGap = 20;
      if (lineGroups.length > 2) {
        const gaps = lineGroups.slice(1).map((g, i) => g.y - lineGroups[i].y);
        avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      }

      for (let i = 0; i < lineGroups.length; i++) {
        const group = lineGroups[i];
        group.items.sort((a, b) => a.x - b.x);

        const fullText = group.items
          .map((it) => it.str)
          .join("")
          .trim();
        if (!fullText) continue;

        const prevGap = i > 0 ? group.y - lineGroups[i - 1].y : 0;
        const nextGap =
          i < lineGroups.length - 1 ? lineGroups[i + 1].y - group.y : 0;
        const bigVerticalGap = prevGap > avgGap * 2.3 || nextGap > avgGap * 2.3;

        // ─── Style / role detection ───
        const heights = group.items.map((it) => it.height);
        const avgHeight =
          heights.reduce((sum, h) => sum + h, 0) / heights.length;
        const maxHeight = Math.max(...heights);

        const isBoldLike =
          group.items.some((it) => /bold/i.test(it.fontName || "")) ||
          maxHeight > avgHeight * 1.18;

        let heading:
          | "Heading1"
          | "Heading2"
          | "Heading3"
          | "Heading4"
          | "Heading5"
          | "Heading6"
          | "Title"
          | undefined = undefined;

        let align:
          | "left"
          | "center"
          | "right"
          | "both"
          | "mediumKashida"
          | "distribute"
          | "thaiDistribute"
          | "highKashida"
          | "lowKashida"
          | "numTab"
          | "end" = AlignmentType.LEFT;

        if (
          maxHeight > avgHeight * 1.45 &&
          (isBoldLike || fullText === fullText.toUpperCase())
        ) {
          if (fullText.length < 55) align = AlignmentType.CENTER;
          if (maxHeight > avgHeight * 2) heading = HeadingLevel.HEADING_1;
          else if (maxHeight > avgHeight * 1.6)
            heading = HeadingLevel.HEADING_2;
          else heading = HeadingLevel.HEADING_3;
        }

        // List detection
        let indentLeft = 0;
        let prefix = "";
        const first = group.items[0]?.str.trim() || "";
        const bullets = ["•", "◦", "-", "–", "*", "→", "⇒", "♦"];
        if (bullets.includes(first[0])) {
          prefix = first[0] + "\t";
          indentLeft = 720;
        } else if (/^\d+[.)]\s/.test(first) || /^[a-z][.)]\s/i.test(first)) {
          prefix = (first.match(/^[\da-z]+[.)]/i) || [""])[0] + "\t";
          indentLeft = 720;
        }

        // ─── Simple table inference ───
        const xStarts = group.items.map((it) => it.x);
        const gapsBetween = xStarts
          .slice(1)
          .map((x, idx) => x - (xStarts[idx] + group.items[idx].width));

        const looksLikeTableRow =
          gapsBetween.length >= 2 &&
          gapsBetween.every((g) => g > 6 && g < 140) &&
          group.items.length >= 3;

        let handledAsTable = false;

        if (looksLikeTableRow && i + 1 < lineGroups.length) {
          const tableRows: TableRow[] = [];
          let rowIndex = i;

          while (rowIndex < lineGroups.length) {
            const candidate = lineGroups[rowIndex];
            const candidateGaps = candidate.items
              .slice(1)
              .map(
                (it, idx) =>
                  it.x - (candidate.items[idx].x + candidate.items[idx].width),
              );

            if (
              Math.abs(candidate.items.length - group.items.length) > 3 ||
              !candidateGaps.every(
                (g, idx) => Math.abs(g - gapsBetween[idx]) < 20,
              )
            ) {
              break;
            }

            const cells = candidate.items.map(
              (cellItem) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cellItem.str.trim(),
                          size: 22,
                          bold: /bold/i.test(cellItem.fontName || ""),
                        }),
                      ],
                    }),
                  ],
                  width: {
                    size: 100 / candidate.items.length,
                    type: WidthType.PERCENTAGE,
                  },
                } satisfies ITableCellOptions),
            );

            tableRows.push(new TableRow({ children: cells }));
            rowIndex++;
          }

          if (tableRows.length >= 2) {
            pageChildren.push(
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            );
            i = rowIndex - 1;
            handledAsTable = true;
          }
        }

        if (handledAsTable) continue;

        // ─── Normal paragraph / list / heading ───
        const runs: TextRun[] = [];

        if (prefix) {
          runs.push(new TextRun({ text: prefix, size: 24 }));
        }

        group.items.forEach((it) => {
          runs.push(
            new TextRun({
              text: it.str,
              size: Math.round(it.height * 1.8 + 8),
              bold: /bold/i.test(it.fontName || ""),
              italics: /italic/i.test(it.fontName || ""),
            }),
          );
        });

        pageChildren.push(
          new Paragraph({
            children: runs,
            heading,
            alignment: align,
            indent: indentLeft ? { left: indentLeft } : undefined,
            spacing: {
              after: bigVerticalGap ? 480 : heading ? 360 : prefix ? 80 : 180,
            },
            tabStops: prefix
              ? [{ type: TabStopType.LEFT, position: TabStopPosition.MAX }]
              : undefined,
          }),
        );
      }
    }

    if (pageChildren.length > 0) {
      allSections.push({
        properties: {},
        children: pageChildren,
      });
    }
  }

  onProgress?.("Creating .docx file...");

  const doc = new Document({
    sections: allSections,
  });

  const buffer = await Packer.toBuffer(doc);

  // Safest browser-compatible way
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};
