import { mean } from 'mathjs';
import { isNaN, Submission } from './common.ts';

export function scoresToCSV(data: Submission[]) {
  console.log(
    'Meta, 1AC Personal, 2AC, 3AC, 4AC, 1EC, 2EC, 3EC, has1ACPersonal, Avg with Meta, Avg with Pscore, PCS average, Avg with All'
  );
  data
    .sort((a, b) => a.pMetaScore - b.pMetaScore)
    .forEach((sub) => {
      const {
        pMetaScore,
        pScore,
        s1Score,
        s2Score,
        s3Score,
        e1Score,
        e2Score,
        e3Score,
      } = sub;

      const hasPersonal = !isNaN(pScore);
      const avgMeta = mean([pMetaScore, s1Score, e1Score, e2Score]);
      const avgPScore = mean([pScore, s1Score, e1Score, e2Score]);
      const avgAll = mean([pMetaScore, pScore, s1Score, e1Score, e2Score]);

      if (hasPersonal) {
        console.log(
          `${pMetaScore}, ${pScore}, ${s1Score}, ${s2Score}, ${s3Score}, ${e1Score}, ${e2Score}, ${e3Score}, ${hasPersonal}, ${avgMeta}, ${avgPScore}, ${avgAll}`
        );
      } else {
        console.log(
          `${pMetaScore}, , ${s1Score}, ${s2Score}, ${s3Score}, ${e1Score}, ${e2Score}, ${e3Score}, ${hasPersonal}, ${avgMeta}`
        );
      }
    });
}
