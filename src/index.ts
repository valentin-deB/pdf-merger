import { getSelectedFinderItems, showToast, Toast } from "@raycast/api";
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import { homedir } from 'os';
import path from 'path';
/**
 * Gets the selected Finder window.
 * @throws — An error when Finder is not the frontmost application.
 * @returns A Promise that resolves with the selected Finder window's path.
 */


export default async () => {
  try {
    const selectedFinderItems = await getSelectedFinderItems();
    const pdfFiles = selectedFinderItems.filter(item => path.extname(item.path).toLowerCase() === '.pdf');

    if (pdfFiles.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No PDF files selected",
      });
      return;
    }

    console.log("Selected PDF files", pdfFiles.map(item => item.path));

    const mergedPdfBytes = await mergePdfs(pdfFiles.map(item => item.path));
    const outputPath = getOutputPath(pdfFiles.map(item => item.path));
    fs.writeFileSync(outputPath, mergedPdfBytes);
    
    await showToast({ title: "PDFs merged successfully!", message: `Saved to ${outputPath}` });

  } catch (error: unknown) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: String(error),
    });
  }
};

async function mergePdfs(filePaths: string[]): Promise<Uint8Array> {
  // Create a new PDFDocument
  const mergedPdf = await PDFDocument.create();

  // Loop through all file paths and merge them into the new document
  for (const filePath of filePaths) {
      const pdfBytes = fs.readFileSync(filePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  // Serialize the PDFDocument to bytes
  return mergedPdf.save();
}

function getOutputPath(filePaths: string[]): string {
  if (filePaths.length === 0) {
      return path.join(homedir(), 'Downloads', 'merged.pdf');
  }

  const firstFilePath = filePaths[0];
  const firstDirPath = path.dirname(firstFilePath);

  // Check if all files are in the same directory
  const sameDirectory = filePaths.every((filePath) => path.dirname(filePath) === firstDirPath);

  if (sameDirectory) {
      return path.join(firstDirPath, 'merged.pdf');
  } else {
      return path.join(homedir(), 'Downloads', 'merged.pdf');
  }
}