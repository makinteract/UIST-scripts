import { parse } from 'jsr:@std/csv';
import { Recommendation, Submission, Split } from './common.ts';

// Helper functions
export async function getData(filename: string): Promise<Submission[]> {
  const text = await Deno.readTextFile(filename);

  const data = parse(text, {
    skipFirstRow: true,
    strip: true,
  });
  return data.map((row) => ({
    id: parseInt(row.ID),
    title: row['Title(947)'],
    subcommittee: getSplit(row.Subcommittee),
    decision: row.Decision || '',
    reviewsTotal: parseInt(row.ReviewsTotal),
    reviewsDone: parseInt(row.ReviewsDone),
    reviewsLeft: parseInt(row.ReviewsLeft),
    reviewsTentative: parseInt(row.ReviewsTentative),
    overallScore: parseFloat(row.OverallScore),
    overallStdDev: parseFloat(row.OverallStdDev),
    pMetaScore: parseFloat(row['PMeta Review Overall Rating']),
    recommendation: getRecommmendation(row['PPC Meeting Recommendation']),
    pScore: parseFloat(row.Pscore),
    pName: row.Pname,
    s1Score: parseFloat(row.S1score),
    s2Score: parseFloat(row.S2score),
    s3Score: parseFloat(row.S3score),
    e1Score: parseFloat(row.E1score),
    e2Score: parseFloat(row.E2score),
    e3Score: parseFloat(row.E3score),
  }));
}

function getSplit(str: string): Split {
  switch (str) {
    case 'Split A':
      return 'A';
    case 'Split B':
      return 'B';
    default:
      throw new Error(`Unknown subcommittee: ${str}`);
  }
}

function getRecommmendation(recommendation: string): Recommendation {
  switch (recommendation) {
    case 'A':
      return 'Accept';
    case 'R':
      return 'Reject';
    case 'A_D':
      return 'A_D';
    case 'R_D':
      return 'R_D';
    case 'Discuss':
      return 'Discuss';
    default:
      return 'None';
  }
}
