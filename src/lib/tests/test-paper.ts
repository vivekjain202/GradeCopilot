export type TestPaperQuestion = {
  questionNumber: string;
  label: string;
  prompt: string;
  maxMarks: number;
};

export function parseTestPaperText(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const title = lines[0] ?? "";
  const questionPattern =
    /^(?:question\s*)?(\d+(?:\s*\([a-z]\))?)\s*[.:)-]\s*(.+?)(?:\s*\[(\d+)\s*(?:marks?|m)\])?$/i;
  const questions = lines.flatMap((line) => {
    const match = line.match(questionPattern);
    if (!match) return [];
    const questionNumber = match[1]?.replace(/\s+/g, "") ?? "";
    const prompt = match[2]?.trim() ?? "";
    if (!questionNumber || !prompt) return [];
    return [
      {
        questionNumber,
        label: `Q${questionNumber}`,
        prompt,
        maxMarks: Number(match[3] ?? 1),
      },
    ];
  });

  return { title, questions };
}

export async function extractTextFromPdf(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const content = await (await pdf.getPage(pageNumber)).getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n");
}
