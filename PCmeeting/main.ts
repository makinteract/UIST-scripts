// deno-lint-ignore-file no-unused-vars
import { parse } from 'jsr:@std/csv';
import * as path from 'jsr:@std/path';
import { mean, median, max, min, std } from 'mathjs';
import * as R from 'https://deno.land/x/ramda@v0.27.2/mod.ts';
import { Comparator, Submission, scoreRanges } from './common.ts';
import { scoresToCSV } from './compareScores.ts';
import { getData } from './dataprocessing.ts';

const getScores = (submission: Submission) => {
  const { pMetaScore, s1Score, e1Score, e2Score } = submission;
  return [pMetaScore, s1Score, e1Score, e2Score];
};

const recommendDiscuss = ({ recommendation }: Submission) =>
  recommendation === 'Discuss' ||
  recommendation === 'A_D' ||
  recommendation === 'R_D';

const recommendAccept = ({ recommendation }: Submission) =>
  recommendation === 'Accept';

const recommendReject = ({ recommendation }: Submission) =>
  recommendation === 'Reject';

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

const qr = R.filter(isQuickReject, rawData);
const withdraw = R.filter(isWithdraw, rawData);
const valid = R.filter(isValidSubmission, rawData);
const conflict = R.filter(isConflict, rawData);

// Basics
console.log('=======Basics=======');
const totSubmissions = rawData.length;
console.log(totSubmissions, 'submissions total');
console.log(qr.length, 'quick reject');
console.log(withdraw.length, 'withdrawn');
console.log(valid.length, 'valid submissions');
console.log(conflict.length, 'conflict submissions');

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

const accpetThreshold = 3.5;
const rejectThreshold = 3;
const sdThreshold = 1;

const curriedHasHighSD = R.curry(hasHighStdDev);
const highSD = curriedHasHighSD(sdThreshold);
const lowSD = R.compose(R.not, highSD);

// Compare to threshold
// Auto-accept: above threshold AND marked as accept AND low std dev
// Auto-reject: below threshold AND marked as reject AND low std dev
// Papers to discuss: marked as discuss OR high std dev OR or not in auto accept/reject lists

const autoAccept = R.filter(
  R.allPass([
    compareToThreshold(accpetThreshold, R.gte as Comparator),
    recommendAccept,
    lowSD,
  ]),
  valid
);

const autoReject = R.filter(
  R.allPass([
    compareToThreshold(rejectThreshold, R.lt as Comparator),
    recommendReject,
    lowSD,
  ]),
  valid
);

const autoAcceptRelaxed = R.filter(R.allPass([recommendAccept]), valid);
const autoRejectRelaxed = R.filter(R.allPass([recommendReject]), valid);

const submissionNotInList = (list: Submission[]) => {
  return (submission: Submission) => {
    return !list.some((s) => s.id === submission.id);
  };
};

// chaing multiple filters
// const papersToDiscuss = R.filter(R.anyPass([isDiscuss, highSD]), valid).filter(
//   submissionNotInList([...autoAccept, ...autoReject])
// );

const excludedPapers = valid.filter(
  submissionNotInList([...autoAccept, ...autoReject])
);

const papersToDiscuss = R.filter(
  R.anyPass([recommendDiscuss, highSD]),
  excludedPapers
);

console.log('=======Results=======');
console.log('Auto accept:', autoAccept.length);
console.log('Auto accept relaxed:', autoAcceptRelaxed.length);
console.log('Auto reject:', autoReject.length);
console.log('Auto reject relaxed:', autoRejectRelaxed.length);
console.log('Papers to discuss:', papersToDiscuss.length);
console.log(`\tIn split A:`, papersToDiscuss.filter(isSplitA).length);
console.log(`\tIn split B:`, papersToDiscuss.filter(isSplitB).length);
const sum = autoAccept.length + autoReject.length + papersToDiscuss.length;
console.log(
  `Total: ${sum} sum of three groups vs. ${valid.length} valid submissions`
);

// scoresToCSV(valid);
