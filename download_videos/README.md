# PCS Video and PDF downloader

1. Install [deno](https://deno.com)
2. Download the list of all submissions as CSV from PCS. Use [this link](https://new.precisionconference.com/uist25a/chair/csv/submission) for UIST.
3. MOve the `uist25a_submission.csv` file in the `data` folder
4. Add your papers in main.ts at the line

```js
const doDownload = [1, 2, 3]; // the list of IDs of your papers
```

6. Run the program

```sh
deno run dev
```
