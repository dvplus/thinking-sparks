/* Shapes in polar form, so any two can morph point by point */
const squircle = t => Math.pow(Math.pow(Math.abs(Math.cos(t)), 5) + Math.pow(Math.abs(Math.sin(t)), 5), -1 / 5) / Math.pow(2, 1 / 5);
const SHAPES = [
  t => 0.92 + 0.08 * Math.cos(9 * t),
  t => 0.76 + 0.24 * Math.cos(4 * t),
  squircle,
  t => 0.9 + 0.1 * Math.cos(12 * t),
  t => 1,
  t => 0.86 + 0.14 * Math.cos(6 * t),
  t => 0.84 + 0.16 * Math.cos(3 * t)
];
const N = 180;
const ANGLES = Array.from({ length: N }, (_, k) => (k / N) * Math.PI * 2);
const RADII = SHAPES.map(f => ANGLES.map(f));
// One shape per topic: scalloped ripples for listening, four lobes for debate,
// a steady soft square for feedback, a lopsided triangle for biases
const CAT_SHAPE = { listen: 0, disagree: 1, feedback: 2, bias: 6 };
const shapeFor = n => CAT_SHAPE[list[n].cat];

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const smooth = t => t * t * (3 - 2 * t);

const $ = id => document.getElementById(id);
const feed = $("feed"), canvas = $("art"), count = $("count");
const tabs = $("tabs"), indicator = $("indicator");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const dayIndex = Math.floor(Date.now() / 86400000);

/* Anonymous usage stats (Umami, no cookies). Never let tracking break the app. */
// Umami loads after this script, so early events wait in a queue for up to ~10s
const pending = [];
const send = (name, data) => { try { umami.track(name, data); } catch (e) {} };
const flush = (tries = 0) => setTimeout(() => {
  if (window.umami) pending.splice(0).forEach(([n, d]) => send(n, d));
  else if (tries < 20) flush(tries + 1);
}, 500);
const track = (name, data) => {
  if (window.umami) return send(name, data);
  if (pending.push([name, data]) === 1) flush();
};
const seenSparks = new Set();
const DEPTHS = [5, 10, 20];
if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) track("home-screen-launch");

let cat = "all", list = sparks, slides = [], idx = 0;

/* Slides */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/* Menu: Discover · Topics · Quiz. "Topics" turns the bar into a row of topic chips (like filters
   in a music app); ✕ clears the filter and brings the main menu back. The row scrolls as topics grow. */
const mainGroup = el("div", "mgroup");
const discoverTab = el("button", "tab", "Discover");
const topicsTab = el("button", "tab", "Topics");
const quizTab = el("button", "tab", "Quiz"); quizTab.id = "quizBtn";
mainGroup.append(discoverTab, topicsTab, quizTab);

const topicGroup = el("div", "tgroup"); topicGroup.setAttribute("role", "group"); topicGroup.setAttribute("aria-label", "Topics");
const clearBtn = el("button", "tclose", "✕"); clearBtn.setAttribute("aria-label", "Close topics, show all sparks");
const topicRow = el("div", "trow");
const topicInd = el("span", "tind");
topicRow.append(topicInd);
const chips = Object.entries(CATS).map(([key, c]) => {
  const b = el("button", "tchip"); b.dataset.cat = key;
  const d = el("span", "dot"); d.style.background = c.color;
  b.append(d, c.label);
  b.addEventListener("click", () => { if (key !== cat) switchCat(key); });
  topicRow.append(b);
  return b;
});
topicGroup.append(clearBtn, topicRow);
tabs.append(mainGroup, topicGroup);

let topicMode = false;
function setTopicMode(on) {
  topicMode = on;
  tabs.classList.toggle("topicmode", on);
  topicsTab.setAttribute("aria-expanded", on);
  if (on) { track("topics-open"); (chips.find(c => c.dataset.cat === cat) || chips[0]).focus({ preventScroll: true }); }
  else topicsTab.focus({ preventScroll: true });
  placeIndicator();
}
[discoverTab, topicsTab].forEach(b => b.addEventListener("pointerdown", () => tabs.classList.add("pressing")));
["pointerup", "pointercancel", "pointerleave"].forEach(ev => tabs.addEventListener(ev, () => tabs.classList.remove("pressing")));
discoverTab.addEventListener("click", () => cat !== "all" && switchCat("all"));
topicsTab.addEventListener("click", () => setTopicMode(true));
clearBtn.addEventListener("click", () => { if (cat !== "all") switchCat("all"); setTopicMode(false); });

function placeIndicator() {
  discoverTab.setAttribute("aria-pressed", cat === "all");
  const chip = chips.find(c => c.dataset.cat === cat);
  chips.forEach(c => c.setAttribute("aria-pressed", c === chip));
  // main menu indicator always rests on Discover; the topic row has its own that slides between chips
  indicator.style.width = discoverTab.offsetWidth + "px";
  indicator.style.transform = `translateX(${discoverTab.offsetLeft}px)`;
  topicInd.classList.toggle("on", !!chip);
  if (chip) {
    topicInd.style.width = chip.offsetWidth + "px";
    topicInd.style.transform = `translateX(${chip.offsetLeft}px)`;
    if (topicMode) chip.scrollIntoView({ inline: "nearest", block: "nearest", behavior: reduce.matches ? "instant" : "smooth" });
  }
}

function build() {
  feed.innerHTML = "";
  slides = list.map((s, n) => {
    const color = CATS[s.cat].color;
    const slide = el("section", "slide");
    const h = el("div", "hscroll");
    h.setAttribute("aria-label", s.title + ", idea and examples");

    const main = el("div", "page");
    const mark = el("p", "mark"); const d = el("span", "dot"); d.style.background = color; mark.append(d, CATS[s.cat].label);
    main.append(mark, el("h2", "title", s.title), el("p", "desc", s.desc), el("p", "source", "Based on " + s.source));
    h.append(main);

    // no buttons: the next card peeks in and can be tapped, the dots below jump to any page
    const pages = [main];
    s.ex.forEach(([before, after], k) => {
      const page = el("div", "page");
      page.addEventListener("click", () => { if (page.classList.contains("ahead")) pageTo(h, k + 1); });
      pages.push(page);
      const card = el("div", "ex");
      const tryLbl = el("p", "lbl"); const d2 = el("span", "dot"); d2.style.background = color; tryLbl.append(d2, "Try");
      card.append(el("p", "lbl", "Instead of"), el("p", "q dim", before), el("hr", "rule"), tryLbl, el("p", "q", after));
      page.append(card);
      h.append(page);
    });

    const pager = el("div", "pager");
    const dots = pages.map((_, k) => {
      const b = el("button", "pdot" + (k ? "" : " on"));
      b.setAttribute("aria-label", k ? `Example ${k}` : "The idea");
      b.addEventListener("click", () => pageTo(h, k));
      pager.append(b); return b;
    });
    const markAhead = p => pages.forEach((pg, k) => pg.classList.toggle("ahead", k > p));
    markAhead(0);
    let sawExamples = false;
    h.addEventListener("scroll", () => {
      const p = Math.round(h.scrollLeft / pageWidth(h));
      dots.forEach((dt, k) => { dt.classList.toggle("on", k === p); dt.setAttribute("aria-current", k === p); });
      markAhead(p);
      if (p && !sawExamples) { sawExamples = true; track("examples-open", { spark: s.title, topic: s.cat }); }
    }, { passive: true });

    slide.append(h, pager);
    feed.appendChild(slide);
    return { h, parts: [...main.children, pager] };
  });

  // a proper ending instead of a "back to top" arrow
  const end = el("section", "slide end");
  const box = el("div", "endcard");
  const dots = el("p", "adots"); dots.setAttribute("aria-hidden", "true");
  Object.values(CATS).forEach(c => { const d = el("span"); d.style.background = c.color; dots.append(d); });
  const n = list.length;
  const actions = el("div", "qactions");
  const quizGo = el("button", "btn solid", "Take the quiz");
  quizGo.addEventListener("click", () => { track("end-card", { action: "quiz" }); openQuiz(); });
  const again = el("button", "btn", "Start over");
  again.addEventListener("click", () => { track("end-card", { action: "start-over" }); goTo(0); });
  actions.append(quizGo, again);
  box.append(dots, el("h2", "title", cat === "all" ? `You’ve seen all ${n}.` : `That’s all ${n} ${CATS[cat].tab} sparks.`),
    el("p", "desc", "Test what stuck, or go round again."), actions);
  end.append(box);
  feed.appendChild(end);
  slides.push({ h: null, parts: [...box.children] });
  placeIndicator();
}

const pageWidth = h => (h.querySelector(".page").offsetWidth + 12) || 1;
const pageTo = (h, p) => h.scrollTo({ left: p * pageWidth(h), behavior: reduce.matches ? "instant" : "smooth" });

function goTo(n, instant) {
  feed.scrollTo({ top: n * feed.clientHeight, behavior: instant || reduce.matches ? "instant" : "smooth" });
}

function switchCat(key) {
  cat = key;
  track("topic-filter", { topic: key });
  placeIndicator();
  feed.classList.add("fading");
  setTimeout(() => {
    list = key === "all" ? sparks : sparks.filter(s => s.cat === key);
    build();
    goTo(0, true);
    update();
    snapPens();
    feed.classList.remove("fading");
  }, reduce.matches ? 0 : 250);
}

/* Drawing: several pens held together, tracing the same shape in parallel.
   Each pen trails a little behind the one before it, so a swipe fans them apart
   before they settle back into step. Lines boil at 12 fps, like animation on twos. */
const ctx = canvas.getContext("2d");
const PENS = 7, WHITE_PEN = 3, BOIL_FPS = 12, VARIANTS = 3;
const pens = Array.from({ length: PENS }, () => ({ pos: 0 }));
let curPos = 0, boil = 0, lastBoil = 0, lastFrame = 0, dirty = true;

const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const grain = document.createElement("canvas");
grain.width = grain.height = 256;
(() => {
  const g = grain.getContext("2d"), img = g.createImageData(256, 256);
  for (let k = 0; k < img.data.length; k += 4) img.data[k + 3] = Math.random() < 0.3 ? 110 + Math.random() * 145 : 0;
  g.putImageData(img, 0, 0);
})();
let grainPattern = null;

function sizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = canvas.height = Math.max(1, Math.round(canvas.clientWidth * dpr));
  grainPattern = ctx.createPattern(grain, "repeat");
  dirty = true;
}
function snapPens() { pens.forEach(p => p.pos = curPos); dirty = true; }

const wobble = (t, v, amp) =>
  amp * (0.5 * Math.sin(3 * t + rnd(v, 1) * 6.28) + 0.3 * Math.sin(7 * t + rnd(v, 2) * 6.28) + 0.2 * Math.sin(13 * t + rnd(v, 3) * 6.28));

function render() {
  const W = canvas.width;
  if (!W || !grainPattern) return;
  const motion = !reduce.matches;
  const v = motion ? boil : 0;
  const max = list.length - 1;
  const unit = W / 2.75;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, W);
  ctx.lineCap = ctx.lineJoin = "round";

  const Q = quizAmt;
  const neutral = [216, 214, 207];
  for (let k = 0; k < PENS; k++) {
    // sparks: shape and color follow the topic
    const pp = Math.min(Math.max(motion ? pens[k].pos : curPos, 0), max);
    const a = Math.floor(pp), b = Math.min(a + 1, max), f = pp - a;
    const t = motion ? smooth(f) : Math.round(f);
    const ra = RADII[shapeFor(a)], rb = RADII[shapeFor(b)];
    // quiz: a quiet neutral drawing that keeps cycling through every shape, pausing on each, each pen a beat behind
    const L = SHAPES.length, qp = quizClock - k * 0.12, qbase = Math.floor(qp), qf = qp - qbase;
    const qt = motion ? smooth(Math.min(Math.max((qf - 0.35) / 0.65, 0), 1)) : 0;
    const qa = RADII[((qbase % L) + L) % L], qb = RADII[(((qbase + 1) % L) + L) % L];
    const scale = 0.74 + k * 0.058;
    const squashN = motion ? 1 - 0.08 * Math.sin(Math.PI * f) : 1;
    const squashQ = motion ? 1 - 0.06 * Math.sin(Math.PI * qt) : 1;
    const squash = squashN + (squashQ - squashN) * Q;
    const seed = v * 7 + k * 17;

    ctx.setTransform(unit, 0, 0, unit, W / 2, W / 2);
    ctx.rotate((motion ? pp * 0.6 : 0) + Q * quizClock * 0.35 + k * 0.02 + spin * (1 - k * 0.05));
    ctx.scale(squash * scale, squash * scale);

    const topic = k === WHITE_PEN ? [244, 244, 242] : mix(hex(CATS[list[a].cat].color), hex(CATS[list[b].cat].color), t);
    ctx.strokeStyle = `rgb(${mix(topic, neutral, Q)})`;
    const alphaN = k === WHITE_PEN ? 0.7 : 0.95 - Math.abs(k - WHITE_PEN) * 0.06;
    const alphaQ = Math.min(1, (k === WHITE_PEN ? 0.45 : 0.3 - Math.abs(k - WHITE_PEN) * 0.02) + glow * 0.4);
    ctx.globalAlpha = alphaN + (alphaQ - alphaN) * Q;
    ctx.lineWidth = (0.018 + rnd(k, 3) * 0.012) / scale;

    // each pen lifts off the paper briefly, so no line quite closes
    const start = rnd(seed, 5) * 6.28, span = Math.PI * 2 - (0.18 + rnd(seed, 9) * 0.4);
    ctx.beginPath();
    for (let s = 0; s <= 140; s++) {
      const th = start + (s / 140) * span;
      const i = ((Math.round((th / (Math.PI * 2)) * N) % N) + N) % N;
      const rn = ra[i] + (rb[i] - ra[i]) * t, rq = qa[i] + (qb[i] - qa[i]) * qt;
      const r = rn + (rq - rn) * Q + wobble(th, seed, 0.028);
      s ? ctx.lineTo(r * Math.cos(th), r * Math.sin(th)) : ctx.moveTo(r * Math.cos(th), r * Math.sin(th));
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // rub grain out of the lines for a pastel texture
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "destination-out";
  ctx.save();
  ctx.translate(-((v * 37) % 256), -((v * 59) % 256));
  ctx.globalAlpha = 0.5; ctx.fillStyle = grainPattern; ctx.fillRect(0, 0, W + 256, W + 256);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function loop(now) {
  const dt = Math.min(now - (lastFrame || now), 64) / 16.67;
  lastFrame = now;
  if (!reduce.matches) {
    if (now - lastBoil > 1000 / BOIL_FPS) { boil = (boil + 1) % VARIANTS; lastBoil = now; dirty = true; }
    pens.forEach((p, k) => {
      const diff = curPos - p.pos;
      if (Math.abs(diff) < 0.0005) { p.pos = curPos; return; }
      const speed = 1 - Math.pow(1 - (0.3 - k * 0.032), dt);
      p.pos += diff * speed;
      dirty = true;
    });
    if (quiz && quiz.mix < 1) { quiz.mix = Math.min(1, quiz.mix + 0.035 * dt); dirty = true; }
    if (Math.abs(quizTarget - quizAmt) > 0.001) { quizAmt += (quizTarget - quizAmt) * (1 - Math.pow(0.9, dt)); dirty = true; }
    else quizAmt = quizTarget;
    if (quizAmt > 0.001) { quizClock += 0.0045 * dt; dirty = true; }
    if (glow > 0.001) { glow *= Math.pow(0.94, dt); dirty = true; } else glow = 0;
    if (Math.abs(spinTarget - spin) > 0.001) { spin += (spinTarget - spin) * (1 - Math.pow(0.9, dt)); dirty = true; }
    else spin = spinTarget;
  }
  if (reduce.matches && quizAmt !== quizTarget) { quizAmt = quizTarget; dirty = true; }
  if (dirty) { dirty = false; render(); }
  requestAnimationFrame(loop);
}

/* Quiz mode: name the idea behind a reply, or the idea that would fix a bad one */
let quiz = null, spin = 0, spinTarget = 0, quizAmt = 0, quizTarget = 0, quizClock = 0, glow = 0;
const quizEl = $("quiz"), qbody = $("qbody"), qprog = $("qprog");
const shuffled = arr => { const a = arr.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
const pick = (arr, n) => shuffled(arr).slice(0, n);

function makeQuestions() {
  const pool = cat === "all" ? sparks : sparks.filter(s => s.cat === cat);
  const all = [];
  pool.forEach(s => s.ex.forEach(([before, after]) => {
    all.push({ s, type: "try", text: after });
    all.push({ s, type: "instead", text: before, fix: after });
  }));
  const qs = [], recent = [];
  for (const q of shuffled(all)) {
    if (qs.length === 10) break;
    if (recent.includes(q.s)) continue;
    qs.push(q); recent.push(q.s); if (recent.length > 2) recent.shift();
  }
  for (const q of shuffled(all)) { if (qs.length === 10) break; if (!qs.includes(q)) qs.push(q); }
  // distractors come from the same topic, so the color and shape set the scene without giving it away
  return qs.map(q => ({ ...q, options: shuffled([q.s, ...pick(sparks.filter(x => x.cat === q.s.cat && x !== q.s), 2)]) }));
}

function morphTo(c) {
  if (!quiz || c === quiz.to) return;
  quiz.from = quiz.to; quiz.to = c; quiz.mix = reduce.matches ? 1 : 0;
}

function openQuiz() {
  const here = list[idx] ? list[idx].cat : "listen";
  quiz = { qs: makeQuestions(), i: 0, score: 0, answered: 0, missed: [], from: here, to: here, mix: 1 };
  track("quiz-start", { topic: cat });
  quizTarget = 1;
  document.body.classList.add("quizzing");
  quizEl.hidden = false;
  showQuestion();
}

function closeQuiz() {
  if (!quiz) return;
  morphTo(list[idx].cat);
  quizTarget = 0;
  document.body.classList.remove("quizzing");
  quizEl.hidden = true;
  const closing = quiz;
  setTimeout(() => { if (quiz === closing) { quiz = null; snapPens(); } }, reduce.matches ? 0 : 700);
  $("quizBtn").focus({ preventScroll: true });
}

function showQuestion() {
  const q = quiz.qs[quiz.i];
  morphTo(q.s.cat);
  qprog.innerHTML = `<b>${quiz.i + 1}</b> / ${quiz.qs.length}`;
  qbody.innerHTML = "";
  // topic named in words, not just by colour
  const topic = el("p", "mark"); const d = el("span", "dot"); d.style.background = CATS[q.s.cat].color;
  topic.append(d, CATS[q.s.cat].label);
  const ask = el("p", "qask", q.type === "try" ? "Which idea is behind this reply?" : "Which idea would improve this?");
  const opts = el("div", "opts");
  q.options.forEach(o => {
    const b = el("button", "btn opt", o.title);
    b.addEventListener("click", () => answer(q, o, b, opts));
    opts.append(b);
  });
  qbody.append(topic, ask, el("p", "qtext" + (q.type === "instead" ? " dim" : ""), q.text), opts);
  quizEl.scrollTop = 0;
}

function answer(q, choice, btn, opts) {
  const right = choice === q.s;
  quiz.answered++;
  if (right) { quiz.score++; spinTarget += Math.PI / 2; glow = 1; }
  else if (!quiz.missed.includes(q.s)) quiz.missed.push(q.s);
  [...opts.children].forEach((b, k) => {
    b.disabled = true;
    if (q.options[k] === q.s) { b.classList.add("right"); b.append(el("span", null, "✓")); }
    else if (b === btn) b.classList.add("wrong");
  });
  const rev = el("div", "reveal");
  rev.append(el("h3", null, right ? "Right." : `Not quite. It’s ${q.s.title}.`), el("p", null, q.s.desc));
  if (q.type === "instead") rev.append(el("p", null, "Try: " + q.fix));
  const last = quiz.i === quiz.qs.length - 1;
  const actions = el("div", "qactions");
  const next = el("button", "btn solid", last ? "See your score" : "Next question");
  next.addEventListener("click", () => { quiz.i++; last ? showScore() : showQuestion(); });
  actions.append(next);
  if (!last) {
    const end = el("button", "linkbtn", "End quiz and see results");
    end.addEventListener("click", () => showScore(true));
    actions.append(end);
  }
  qbody.append(rev, actions);
  quizEl.scrollTo({ top: quizEl.scrollHeight, behavior: reduce.matches ? "instant" : "smooth" });
  next.focus({ preventScroll: true });
}

function showScore(early) {
  const n = quiz.score, total = quiz.answered;
  track("quiz-finish", { topic: cat, score: n, total, early: !!early });
  spinTarget += Math.PI * (n / total) * 2;
  qprog.textContent = "";
  qbody.innerHTML = "";
  const msg = n >= total * 0.8 ? "Sharp. You’d hold your own in any meeting."
    : n >= total * 0.5 ? "Solid. A few more rounds and it sticks."
    : "Good start. Swipe through the sparks, then try again.";
  const actions = el("div", "qactions");
  const again = el("button", "btn solid", "Play again");
  again.addEventListener("click", () => { Object.assign(quiz, { qs: makeQuestions(), i: 0, score: 0, answered: 0, missed: [] }); showQuestion(); });
  const back = el("button", "btn", "Back to sparks");
  back.addEventListener("click", closeQuiz);
  actions.append(again, back);
  qbody.append(el("p", "mark", "Your score"), el("p", "score", `${n} of ${total}`), el("p", "desc", msg), actions);
  actions.style.setProperty("margin-top", "16px");
  // sparks to revisit: tap one to jump straight to it
  if (quiz.missed.length) {
    const box = el("div", "missed");
    box.append(el("p", "mark", "Worth another look"));
    const ul = el("ul");
    quiz.missed.forEach(sp => {
      const b = el("button", "missedbtn");
      const dot = el("span", "dot"); dot.style.background = CATS[sp.cat].color;
      b.append(dot, el("span", null, sp.title), el("span", "arrow", "→"));
      b.addEventListener("click", () => openMissed(sp));
      const li = el("li"); li.append(b); ul.append(li);
    });
    box.append(ul);
    qbody.append(box);
  }
  again.focus({ preventScroll: true });
}

function openMissed(sp) {
  track("missed-spark-open", { spark: sp.title, topic: sp.cat });
  closeQuiz();
  const n = list.indexOf(sp);
  if (n >= 0) goTo(n);
}

$("quizBtn").addEventListener("click", openQuiz);
$("quizClose").addEventListener("click", closeQuiz);

/* About and credits: its own top-aligned page; the drawing steps aside */
const aboutEl = $("about");
function openAbout() {
  track("about-open");
  document.body.classList.add("quizzing", "abouting");
  aboutEl.hidden = false;
  aboutEl.scrollTop = 0;
  $("aboutClose").focus({ preventScroll: true });
}
function closeAbout() {
  document.body.classList.remove("quizzing", "abouting");
  aboutEl.hidden = true;
  $("aboutBtn").focus({ preventScroll: true });
}
// guarded so a stale cached index.html without the About markup can't stop the sparks from loading
if (aboutEl) {
  $("aboutBtn").addEventListener("click", openAbout);
  $("aboutClose").addEventListener("click", closeAbout);
}

/* Scroll-linked text motion */
let ticking = false;
function update() {
  ticking = false;
  const h = feed.clientHeight || 1;
  const pos = feed.scrollTop / h;
  const motion = !reduce.matches;
  slides.forEach((s, n) => {
    const p = n - pos;
    if (Math.abs(p) > 1.2) return;
    s.parts.forEach((e, k) => {
      if (!motion) { e.style.transform = ""; e.style.opacity = ""; return; }
      const lift = p > 0 ? p * (40 + k * 24) : p * 20;
      e.style.transform = `translate3d(0, ${lift}px, 0)`;
      e.style.opacity = Math.max(0, 1 - Math.abs(p) * (1.6 + k * 0.18));
    });
  });
  curPos = pos; dirty = true;
  const now = Math.min(Math.max(Math.round(pos), 0), list.length - 1);
  count.innerHTML = `<b>${now + 1}</b> / ${list.length}`;
  if (now !== idx) {
    idx = now;
    try { localStorage.setItem("spark5", JSON.stringify({ day: dayIndex, cat, i: idx })); } catch (e) {}
  }
  // count a spark once it has settled on screen, once per visit
  const s = list[now];
  if (s && Math.abs(pos - now) < 0.05 && !seenSparks.has(s.title)) {
    seenSparks.add(s.title);
    track("spark-view", { spark: s.title, topic: s.cat });
    const n = seenSparks.size;
    if (DEPTHS.includes(n) || n === sparks.length) track("sparks-seen", { count: n === sparks.length ? "all" : n });
  }
}
feed.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
addEventListener("resize", () => { placeIndicator(); sizeCanvas(); goTo(idx, true); update(); });

document.addEventListener("keydown", e => {
  if (!introDone) { if ([" ", "Enter", "ArrowDown", "PageDown", "Escape"].includes(e.key)) { e.preventDefault(); dismissIntro(); } return; }
  if (topicMode && e.key === "Escape") { clearBtn.click(); return; }
  if (aboutEl && !aboutEl.hidden) { if (e.key === "Escape") closeAbout(); return; }
  if (quiz) { if (e.key === "Escape") closeQuiz(); return; }
  const at = Math.round(feed.scrollTop / (feed.clientHeight || 1));  // includes the end card
  const s = slides[at] && slides[at].h ? slides[at] : null;
  if (["ArrowDown", "PageDown", " "].includes(e.key) && e.target === document.body) { e.preventDefault(); goTo(Math.min(at + 1, slides.length - 1)); }
  if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); goTo(Math.max(at - 1, 0)); }
  if (s && e.key === "ArrowRight") { e.preventDefault(); pageTo(s.h, Math.min(Math.round(s.h.scrollLeft / pageWidth(s.h)) + 1, s.h.children.length - 1)); }
  if (s && e.key === "ArrowLeft") { e.preventDefault(); pageTo(s.h, Math.max(Math.round(s.h.scrollLeft / pageWidth(s.h)) - 1, 0)); }
});

/* Shuffle on every open, so each visit starts somewhere new */
for (let k = sparks.length - 1; k > 0; k--) {
  const j = Math.floor(Math.random() * (k + 1));
  [sparks[k], sparks[j]] = [sparks[j], sparks[k]];
}
const start = 0;
/* Intro: the full welcome on a first visit, just the title after that. The drawing cycles behind it. */
const introEl = $("intro");
let introDone = false;
function dismissIntro() {
  if (introDone) return;
  introDone = true;
  try { localStorage.setItem("ts-intro", "1"); } catch (e) {}
  quizTarget = 0;
  document.body.classList.remove("introing");
  introEl.classList.add("gone");
  setTimeout(() => { if (introDone) { introEl.hidden = true; introEl.classList.remove("gone", "brief"); } }, reduce.matches ? 0 : 600);
}
function showIntro(brief) {
  introDone = false;
  introEl.hidden = false;
  introEl.classList.remove("gone");
  introEl.classList.toggle("brief", !!brief);
  document.body.classList.add("introing");
  quizTarget = 1;
  if (brief) setTimeout(dismissIntro, reduce.matches ? 400 : 1300);
  else $("introGo").focus({ preventScroll: true });
}
introEl.addEventListener("click", dismissIntro);
let touchY = null;
introEl.addEventListener("touchstart", e => { touchY = e.touches[0].clientY; }, { passive: true });
introEl.addEventListener("touchend", e => { if (touchY != null && touchY - e.changedTouches[0].clientY > 30) dismissIntro(); touchY = null; });
introEl.addEventListener("wheel", e => { if (e.deltaY > 8) dismissIntro(); }, { passive: true });
if (aboutEl) $("replayIntro").addEventListener("click", () => { closeAbout(); showIntro(false); });

build();
let seenIntro = false;
try { seenIntro = localStorage.getItem("ts-intro") === "1"; } catch (e) {}
quizAmt = 1;  // start on the quiet, cycling drawing
showIntro(seenIntro);
idx = start;
sizeCanvas();
requestAnimationFrame(() => { goTo(start, true); update(); snapPens(); requestAnimationFrame(loop); });
document.fonts && document.fonts.ready.then(placeIndicator);
