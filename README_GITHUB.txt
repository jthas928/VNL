TEXT GROUP ONLINE EXPERIMENT — GITHUB PAGES PACKAGE

This package contains the updated Text Group experiment, using the reading text
from Text Group(2).docx.

FILES
- text_group_experiment.html: experiment page
- material_data.js: reading script, comprehension questions, and vocabulary items
- jspsych/: required local jsPsych 8.3.0 files and plugins
- README_GITHUB.txt: this guide

WHAT WAS UPDATED
- Replaced the older reading script with the text from Text Group(2).docx, including dialogue stored inside Word tables.
- Removed game-interface prompts such as "Present [item]" while retaining Phoenix's story actions as narrative stage directions (stopping Larry from answering, signaling him to answer honestly, and trying the clock).
- Removed "added to the Court Record" system notices.
- Rephrased dialogue that directly instructed the reader to open/check the Court Record.
- Replaced remaining "Court Record" wording in the related comprehension question with "case file".
- Preserved selectable story actions as ordinary narrative stage directions rather than interactive game choices.
- Preserved the existing vocabulary items, answer keys, comprehension items, participant flow,
  and DataPipe configuration, except for the one comprehension prompt wording noted above.

GITHUB PAGES DEPLOYMENT
1. Unzip this package.
2. Upload ALL files and the jspsych folder to the root of your GitHub repository.
3. In Settings > Pages, choose "Deploy from a branch", branch "main", folder "/ (root)".
4. Open:
   https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/text_group_experiment.html

PARTICIPANT IDs
A participant ID can be prefilled with a URL parameter:
?pid=T01

DATA
The page is configured with the DataPipe Experiment ID supplied by the researcher.
Before recruitment, run a complete test session and verify that the resulting CSV
appears in the intended DataPipe storage destination. Do not rely on the browser
download alone as proof of upload.

IMPORTANT
- This package has not been validated in a full end-to-end browser session.
- Confirm the DataPipe project accepts submissions and that its storage destination is connected.
- Confirm online hosting and cloud storage are covered by the approved ethics protocol.
- GitHub Pages websites are publicly accessible. Do not upload participant data or identifying information.
- The local jsPsych files must remain in the same directory structure.
