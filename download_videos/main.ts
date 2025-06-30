import * as path from 'jsr:@std/path';
import { getData, downloadFile, videoName, pdfName } from './helpers.ts';

const doDownload = [1, 2, 3]; // the list of IDs of your papers

// Main

const filename = path.join('data', 'uist25a_submission.csv');
const data = await getData(filename);

for (let i = 0; i < doDownload.length; i += 1) {
  console.log(`Submission ${i} of ${doDownload.length}`);
  const paperID = doDownload[i];
  const sub = data.find((s) => s.id === paperID);
  if (!sub) {
    console.log(`Submission with ID ${paperID} not found.`);
    continue;
  }
  console.log(`Processing submission:`, sub);
  if (sub.video_url) {
    const videoPath = videoName(sub);
    console.log(`Video: ${sub.id} to ${videoPath}`);
    await downloadFile(sub.video_url, videoPath);
  } else {
    console.log(`Video: ${sub.id} has no video URL.`);
  }

  const pdfPath = pdfName(sub);
  console.log(`PDF: ${sub.id} to ${pdfPath}`);
  await downloadFile(sub.pdf_url, pdfPath);
}
