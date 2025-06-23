export type Submission = {
  id: number;
  title: string;
  subcommittee: string;
  decision: string;
  reviewsTotal: number;
  reviewsDone: number;
  reviewsLeft: number;
  reviewsTentative: number;
  overallScore: number;
  overallStdDev: number;
  pMetaScore: number;
  pScore: number;
  pName: string;
  recommendation: Recommendation;
  s1Score: number;
  s2Score: number;
  s3Score: number;
  e1Score: number;
  e2Score: number;
  e3Score: number;
};

export type Recommendation =
  | 'Accept'
  | 'Reject'
  | 'D_A'
  | 'D_R'
  | 'Discuss'
  | 'None';
export type Split = 'A' | 'B';

export type Comparator = (a: number, b: number) => boolean;

// Globals

export const scoreRanges = [
  0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5,
  1.625, 1.75, 1.875, 2, 2.125, 2.25, 2.375, 2.5, 2.625, 2.75, 2.875, 3, 3.125,
  3.25, 3.375, 3.5, 3.625, 3.75, 3.875, 4, 4.125, 4.25, 4.375, 4.5, 4.625, 4.75,
  4.875, 5,
];

export const isNaN = (value: any) => {
  return value !== value;
};
