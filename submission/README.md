# Submission

| File | What it is |
|---|---|
| `Abhyuday_Saksena_MajorProject_FullStackDevelopment.zip` | The file to upload. It has the source code, SQL files, README, docs, the project report and the screenshots. |
| `LearnSphere_LMS_Documentation.pdf` | Project report (10 pages) |
| `Screenshots/` | 18 screenshots of the live site |
| `build-submission.mjs` | Script that rebuilds the zip |
| `source/` | HTML version of the report and the script that turns it into the PDF |

## Adding the demo video

Put the video (`.mp4`) in this folder and run `npm run submission` from the project root. It gets added to the zip as `Demo Video.mp4`. Video files are kept out of git.

## Rebuilding the report PDF

Edit `source/documentation.html`, then run:

```bash
npx playwright install chromium   # only the first time
node submission/source/render-pdf.mjs
```
