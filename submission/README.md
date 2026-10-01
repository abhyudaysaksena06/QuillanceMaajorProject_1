# Final submission

| File | What it is |
|---|---|
| `Abhyuday_Saksena_MajorProject_FullStackDevelopment.zip` | The file to upload: source code, database scripts, README, docs, documentation PDF, screenshots and demo video |
| `LearnSphere_LMS_Documentation.pdf` | Project documentation (8 pages) |
| `Screenshots/` | Output screenshots go here |
| `build-submission.mjs` | Rebuilds the zip |
| `source/` | HTML source of the documentation PDF and the script that renders it |

## Before uploading

1. Save 10–15 screenshots of the live app in `Screenshots/`: home, login/register, student dashboard, catalog, course page, module page, assignment submission, instructor dashboard, course editor, submissions review, admin users page, mobile view.
2. Save the 1-minute demo video in this folder as an `.mp4`. It is added to the zip as `Demo Video.mp4` (video files are not committed to git).
3. From the project root run:
   ```bash
   npm run submission
   ```
4. Upload the zip to the Drive submission folder, inside a folder named **Abhyuday Saksena**. You can also upload the PDF, screenshots and video separately next to it.

## Rebuilding the documentation PDF

Edit `source/documentation.html`, then from the project root:
```bash
npx playwright install chromium   # first time only
node submission/source/render-pdf.mjs
```
