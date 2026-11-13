// common.js - shared by the VN group and the Text group.
// The question pages, the results workbook and the file names are defined here only,
// so both groups always produce identical Excel files.

const CONDITIONS = {
  vn:   { condition: 'visual_novel', label: 'VN' },
  text: { condition: 'text_only',    label: 'Text' }
};

// Item-level log: one record per question per participant (feeds TestResponses and Summary).
const LOG = [];

const SOURCE_JUDGMENT_OPTIONS = [
  'Only from the text/dialogue',
  'Only from the visuals (character expressions, animation)',
  'Only from the sound (voice tone, sound effects)',
  'From the text and the visuals',
  'From the text and the sound',
  'From the visuals and the sound',
  'From all three: text, visuals, and sound',
  "I'm not sure"
];

// Styles for plain pages + test pages (the Text page already has its own copy of these).
const COMMON_CSS = `
  body { margin: 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background: #fff; color: #111; }
  body .jspsych-content-wrapper { min-height: 100vh; }
  body .jspsych-content { max-width: 100%; }
  .info { max-width: 680px; margin: 0 auto; text-align: left; line-height: 1.6; font-size: 20px; }
  .info h2 { margin-top: 0; }
  .info .note { color: #666; font-size: 15px; }
  .info input[type=text] { font-size: 22px; padding: 8px 12px; width: 260px; border: 2px solid #555; border-radius: 6px; }
  .info .err { color: #b00020; }
  .hint { margin-top: 18px; font-size: 15px; color: #888; text-align: center; }
  .gate { max-width: 680px; margin: 0 auto; border: 1px solid #777; border-radius: 8px; padding: 24px 28px; background: #fff; line-height: 1.65; text-align: left; font-size: 20px; }
  .test-page { max-width: 760px; }
  .test-progress { color: #666; font-size: 15px; margin-bottom: 8px; }
  .test-page h2 { font-size: 22px; line-height: 1.45; }
  .test-option { display: block; margin: 12px 0; padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; cursor: pointer; }
  .test-option:hover { background: #f4f6f8; }
  .test-option input { margin-right: 8px; }
  .test-source-q { font-size: 20px; line-height: 1.5; margin: 32px 0 8px; padding-top: 18px; border-top: 1px solid #ddd; }
  .test-navigation { display: flex; justify-content: space-between; gap: 12px; margin-top: 24px; }
  .test-navigation button { font-size: 17px; padding: 9px 20px; border: 1px solid #555; border-radius: 6px; background: #f5f5f5; cursor: pointer; }
  .test-navigation button:disabled { opacity: .4; cursor: not-allowed; }
  .test-navigation button:last-child { background: #173f8a; color: #fff; border-color: #173f8a; }
  .test-error { color: #b00020; min-height: 1.4em; }
`;
function injectCommonStyles() {
  const st = document.createElement('style');
  st.textContent = COMMON_CSS;
  document.head.appendChild(st);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- file name: <Group>_<ParticipantID>.xlsx  e.g. VN_001.xlsx / Text_001.xlsx ----------
function safeId(pid) {
  return String(pid || '').trim().replace(/[^A-Za-z0-9_\-]/g, '_') || 'unknown';
}
function resultFileName(groupKey, pid, ext) {
  return CONDITIONS[groupKey].label + '_' + safeId(pid) + '.' + (ext || 'xlsx');
}

// ---------- test section: one question per page, Back / Next, "Question k of N" ----------
// items: entries of QUESTIONS (phase 'comprehension') or VOCAB_ITEMS (phase 'vocab_pre' / 'vocab_post').
// firstNumber: number of the first question of this section (comprehension numbering runs across parts).
// opts: { onStart: fn, needsSource: fn(key) -> bool, allowBack: bool }
function testBlock(jsPsych, items, phase, firstNumber, opts) {
  opts = opts || {};
  const allowBack = opts.allowBack !== false;
  const comp = phase === 'comprehension';
  const section = comp ? 'Reading comprehension' : (phase === 'vocab_pre' ? 'Vocabulary pre-test' : 'Vocabulary post-test');
  const total = comp ? QUESTIONS.length : VOCAB_ITEMS.length;
  const segment = comp ? (items[0].segment || '') : '';
  const prepared = items.map(function (item, i) {
    return {
      key: comp ? item.id : item.word,
      prompt: comp ? item.prompt : item.word,
      options: jsPsych.randomization.shuffle(item.options.slice()),
      correctText: item.options[item.answer],
      number: firstNumber + i
    };
  });
  const st = prepared.map(function () { return { choice: null, source: null, ms: 0, changes: 0 }; });
  let idx = 0, shownAt = 0, blockStart = 0;

  function leave() { st[idx].ms += performance.now() - shownAt; }

  function html() {
    const q = prepared[idx], s = st[idx];
    const needSrc = !!(opts.needsSource && opts.needsSource(q.key));
    let h = '<div class="info test-page"><p class="test-progress">' + section + ' &middot; Question ' + q.number + ' of ' + total +
      '</p><h2>' + q.number + '. ' + escapeHtml(q.prompt) + '</h2><form id="test-question-form">';
    q.options.forEach(function (o, i) {
      h += '<label class="test-option"><input type="radio" name="test-answer" value="' + i + '"' + (s.choice === i ? ' checked' : '') + '> ' + escapeHtml(o) + '</label>';
    });
    h += '</form>';
    if (needSrc) {
      h += '<p class="test-source-q">What did you mainly use to decide on your answer?</p>';
      SOURCE_JUDGMENT_OPTIONS.forEach(function (o, i) {
        h += '<label class="test-option"><input type="radio" name="test-source" value="' + i + '"' + (s.source === i ? ' checked' : '') + '> ' + escapeHtml(o) + '</label>';
      });
    }
    h += '<p class="test-navigation"><button type="button" id="test-back"' + ((idx === 0 || !allowBack) ? ' disabled' : '') + '>Back</button>' +
         '<button type="button" id="test-next">' + (idx === prepared.length - 1 ? 'Finish section' : 'Next') + '</button></p>' +
         '<p class="test-error" id="test-error" aria-live="polite"></p></div>';
    return { h: h, needSrc: needSrc };
  }

  function finish() {
    const items_out = prepared.map(function (q, i) {
      const s = st[i], text = q.options[s.choice];
      const rec = {
        phase: phase, segment: segment, question_number: q.number, item: q.key,
        response: JSON.stringify((function () { const o = {}; o[q.key] = text; return o; })()),
        correct: text === q.correctText ? 1 : 0,
        reaction_time_ms: Math.round(s.ms),
        option_order: q.options.join(' | '),
        answer_changes: s.changes,
        source_judgment: s.source === null ? '' : SOURCE_JUDGMENT_OPTIONS[s.source]
      };
      LOG.push(rec);
      return rec;
    });
    jsPsych.finishTrial({
      response_items: items_out, item_count: items_out.length,
      correct_count: items_out.filter(function (x) { return x.correct === 1; }).length,
      duration_ms: Math.round(performance.now() - blockStart)
    });
  }

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div id="test-block-root"></div>',
    choices: 'NO_KEYS',
    on_start: function () { if (opts.onStart) opts.onStart(); },
    on_load: function () {
      const root = document.getElementById('test-block-root');
      blockStart = performance.now();
      function draw() {
        const r = html(), s = st[idx];
        root.innerHTML = r.h;
        root.querySelectorAll('input[name="test-answer"]').forEach(function (el) {
          el.addEventListener('change', function () {
            const v = Number(el.value);
            if (s.choice !== null && s.choice !== v) s.changes++;
            s.choice = v;
          });
        });
        root.querySelectorAll('input[name="test-source"]').forEach(function (el) {
          el.addEventListener('change', function () { s.source = Number(el.value); });
        });
        document.getElementById('test-back').addEventListener('click', function () {
          if (idx > 0) { leave(); idx--; draw(); }
        });
        document.getElementById('test-next').addEventListener('click', function () {
          if (s.choice === null || (r.needSrc && s.source === null)) {
            document.getElementById('test-error').textContent = 'Please select an answer before continuing.';
            return;
          }
          leave();
          if (idx < prepared.length - 1) { idx++; draw(); } else { finish(); }
        });
        window.scrollTo(0, 0);
        shownAt = performance.now();
      }
      draw();
    },
    data: { phase: phase, segment: segment, trial_kind: 'question_block', question_count: prepared.length }
  };
}

// ---------- results workbook (identical for both groups) ----------
function buildWorkbook(jsPsych, groupKey, pid) {
  const idCols = { participant: pid, condition: CONDITIONS[groupKey].condition };
  const values = jsPsych.data.get().values();

  const raw = values.map(function (d) {
    const row = Object.assign({}, idCols);
    Object.keys(d).forEach(function (k) {
      if (k === 'stimulus') return;
      const v = d[k];
      row[k] = (v && typeof v === 'object') ? JSON.stringify(v) : v;
    });
    row.participant = pid;
    row.condition = idCols.condition;
    return row;
  });

  // Summary: exposure time per part, accuracy + time per test section (in the order they happened)
  const sumRows = [], seen = {};
  function grp(key) {
    if (!seen[key]) {
      seen[key] = Object.assign({}, idCols, { phase: key, total_items: '', correct: '', accuracy_percent: '', duration_ms: 0 });
      sumRows.push(seen[key]);
    }
    return seen[key];
  }
  function keyOf(r) { return r.phase === 'comprehension' ? 'comprehension_segment_' + r.segment : r.phase; }
  values.forEach(function (d) {
    if (d.phase === 'reading' || d.phase === 'exposure_gate') {
      grp('exposure_segment_' + d.segment).duration_ms += Number(d.rt || 0);
    } else if (d.trial_kind === 'question_block') {
      const key = d.phase === 'comprehension' ? 'comprehension_segment_' + d.segment : d.phase;
      const g = grp(key);
      const rows = LOG.filter(function (r) { return keyOf(r) === key; });
      g.duration_ms += Number(d.duration_ms || 0);
      g.total_items = rows.length;
      g.correct = rows.reduce(function (a, r) { return a + r.correct; }, 0);
      g.accuracy_percent = rows.length ? Math.round(g.correct / rows.length * 10000) / 100 : '';
    }
  });
  sumRows.forEach(function (g) { g.duration_ms = Math.round(g.duration_ms); });

  const items = LOG.map(function (r) { return Object.assign({}, idCols, r); });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(raw), 'RawData');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sumRows), 'Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(items), 'TestResponses');
  return wb;
}

function downloadWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename);
}
