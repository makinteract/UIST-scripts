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
    s1Name: row.S1name || undefined,
    s2Name: row.S2name || undefined,
    s3Name: row.S3name || undefined,
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
    case 'D_A':
      return 'D_A';
    case 'D_R':
      return 'D_R';
    case 'D':
      return 'Discuss';
    default:
      return 'None';
  }
}
