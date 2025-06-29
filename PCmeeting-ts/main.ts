// deno-lint-ignore-file no-unused-vars
import { parse } from 'jsr:@std/csv';
import * as path from 'jsr:@std/path';
import { mean, median, max, min, std, print, all } from 'mathjs';
import * as R from 'https://deno.land/x/ramda@v0.27.2/mod.ts';
import { Comparator, Submission, scoreRanges, printPerct } from './common.ts';
import { scoresToCSV } from './compareScores.ts';
import { getData } from './dataprocessing.ts';

const getScores = (submission: Submission) => {
  const { pMetaScore, s1Score, s2Score, s3Score, e1Score, e2Score } =
    submission;
  const scores = [pMetaScore, s1Score, s2Score, s3Score, e1Score, e2Score];
  return R.filter(R.compose(R.not, isNaN), scores);
};

const getCommitteeMembers = (submission: Submission) => {
  const { pName, s1Name, s2Name, s3Name } = submission;
  return [pName, s1Name, s2Name, s3Name]
    .filter((name) => name !== undefined)
    .join('; ');
};

const has3ACs = (submission: Submission) => getScores(submission).length > 4;
const numOfACs = (submission: Submission) => getScores(submission).length - 2; // two externals

const recommendAD = ({ recommendation }: Submission) =>
  recommendation === 'D_A';

const recommendRD = ({ recommendation }: Submission) =>
  recommendation === 'D_R';

const recommendDiscuss = ({ recommendation }: Submission) =>
  recommendation === 'Discuss';

const recommendAccept = ({ recommendation }: Submission) =>
  recommendation === 'Accept';

const recommendReject = ({ recommendation }: Submission) =>
  recommendation === 'Reject';

const noRecommendation = ({ recommendation }: Submission) =>
  recommendation === 'None';

const isSplitA = ({ subcommittee }: Submission) => subcommittee === 'A';

const isSplitB = ({ subcommittee }: Submission) => subcommittee === 'B';

const compareToThreshold = (threshold: number, operator: Comparator) => {
  return (submission: Submission) => {
    const scores = getScores(submission);
    const m = mean(scores);
    return !isNaN(m) && operator(m, threshold);
  };
};

const isQuickReject = (sub: Submission) => sub.decision === 'R-Quick';
const isWithdraw = (sub: Submission) => sub.decision === 'R_W';
const isAccepted = (sub: Submission) => sub.decision === 'A';
const isRejected = (sub: Submission) => sub.decision === 'R';
const isTabled = (sub: Submission) => sub.decision === 'T';
const isInvalidSubmission = R.anyPass([isQuickReject, isWithdraw]);
const isValidSubmission = R.compose(R.not, isInvalidSubmission);

const isConflict = (sub: Submission) =>
  sub.pName === '' && sub.reviewsTotal > 0;

const hasHighStdDev = (sdThreshold: number, sub: Submission) => {
  const scores = getScores(sub);
  const s = std(scores as number[]);
  return typeof s === 'number' && s > sdThreshold;
};

/*
 * This script processes a CSV file containing submission data,
 * filters submissions based on various criteria, and calculates
 * statistics such as mean scores, standard deviation, and counts
 * of different categories of submissions.
 */

// Main execution
const filename = path.join('data', 'Submissions.csv');
const rawData = await getData(filename);

const totSubmissions = rawData.length;
const qr = R.filter(isQuickReject, rawData);
const withdraw = R.filter(isWithdraw, rawData);
const valid = R.filter(isValidSubmission, rawData);
const conflict = R.filter(isConflict, rawData);

// Print all scores for valid submissions

console.log('=======Accepted with mean scores=======');
scoreRanges.forEach((threshold) => {
  const res = valid.filter(compareToThreshold(threshold, R.gte as Comparator));
  const resA = res.filter(isSplitA);
  const resB = res.filter(isSplitB);
  const perc = (res.length / totSubmissions) * 100;
  const percA = (resA.length / totSubmissions) * 100;
  const percB = (resB.length / totSubmissions) * 100;

  const output = `Score >= ${threshold}: ${res.length} (${perc.toFixed(
    2
  )}%) ==> A: ${resA.length} (${percA.toFixed(2)}%), B: ${
    resB.length
  } (${percB.toFixed(2)}%)`;

  console.log(output);
});

// Simulate numbers

const curriedHasHighSD = R.curry(hasHighStdDev);
const sdThreshold = 1;
const highSD = curriedHasHighSD(sdThreshold);
const lowSD = R.compose(R.not, highSD);

// Compare to threshold

// const autoAccept = R.filter(
//   R.allPass([
//     // compareToThreshold(accpetThreshold, R.gt as Comparator),
//     recommendAccept,
//     // lowSD,
//   ]),
//   valid
// );

const submissionNotInList = (list: Submission[]) => {
  return (submission: Submission) => {
    return !list.some((s) => s.id === submission.id);
  };
};

// scoresToCSV(valid);

console.log('=======Check recomendations=======');
const recA = valid.filter(recommendAccept);
const recR = valid.filter(recommendReject);
const recD = valid.filter(recommendDiscuss);
const recAD = valid.filter(recommendAD);
const recRD = valid.filter(recommendRD);
const norec = valid.filter(noRecommendation);

console.log(totSubmissions, 'submissions total');
console.log(qr.length, 'quick reject');
console.log(withdraw.length, 'withdrawn');
console.log(valid.length, 'valid submissions');
console.log(conflict.length, 'conflict submissions');
console.log('');

printPerct(`A (${recA.length}): `, recA.length / totSubmissions);
printPerct(`R (${recR.length}): `, recR.length / totSubmissions);
printPerct(`D (${recD.length}): `, recD.length / totSubmissions);
printPerct(`D_A (${recAD.length}): `, recAD.length / totSubmissions);
printPerct(`D_R (${recRD.length}): `, recRD.length / totSubmissions);
printPerct(`None (${norec.length}): `, norec.length / totSubmissions);
printPerct(
  `Excluded (${qr.length + withdraw.length}): `,
  (qr.length + withdraw.length) / totSubmissions
);

const sumRec =
  recA.length +
  recR.length +
  recD.length +
  recAD.length +
  recRD.length +
  norec.length +
  qr.length +
  withdraw.length;

console.log('All done?', sumRec === totSubmissions, sumRec, totSubmissions);

// Print final data to study

console.log('=======Final data=======');

function summarizeSubmission(sub: Submission) {
  const { id, recommendation } = sub;

  const scores = getScores(sub);
  const meanScore = mean(scores);
  const stdev = std(scores);
  const scoresCSV = '[' + scores.join('; ') + ']';
  const has3AC = has3ACs(sub);
  const hasHighSD = highSD(sub);
  const split = isSplitA(sub) ? 'Split A' : isSplitB(sub) ? 'Split B' : 'N/A';
  const names = '[' + getCommitteeMembers(sub) + ']';
  const decision = isQuickReject(sub) ? 'QR' : '';

  return `${id}, ${split}, ${names}, ${has3AC}, ${scoresCSV}, ${meanScore}, ${stdev}, ${hasHighSD}, ${recommendation}, ${decision}`;
}

console.log(
  'ID, Split, ACs, Has 3ACs, Scores, Overall Score, StDev, High SD, Recommendation, Decision'
);

const reportAll = valid.map(summarizeSubmission);
const reportA = valid.filter(isSplitA).map(summarizeSubmission);
const reportB = valid.filter(isSplitB).map(summarizeSubmission);
await Deno.writeTextFile('all.csv', reportAll.join('\n'));
await Deno.writeTextFile('A.csv', reportA.join('\n'));
await Deno.writeTextFile('B.csv', reportB.join('\n'));
