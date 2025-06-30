import { parse } from 'jsr:@std/csv';
import * as path from 'jsr:@std/path';

type Submission = {
  id: number;
  video_url?: string;
  pdf_url: string;
};

// Helper functions
export async function getData(filename: string): Promise<Submission[]> {
  const text = await Deno.readTextFile(filename);

  const data = parse(text, {
    skipFirstRow: true,
    strip: true,
  });
  return data.map((row) => ({
    id: parseInt(row['Paper ID'].replace('papers', ''), 10),
    video_url: row['video'] || undefined,
    pdf_url: row['PDF'],
  }));
}

// Helpers

export async function downloadFile(
  url: string,
  filePath: string
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  await Deno.writeFile(filePath, new Uint8Array(arrayBuffer));
}

export function videoName(sub: Submission) {
  return path.join('video', `${sub.id}.mp4`);
}

export function pdfName(sub: Submission) {
  return path.join('pdf', `${sub.id}.pdf`);
}
