// Тренажёр олимпиады ИКБ: маршрутизация, прогресс, автопилот «что делать дальше», задачи, туры, отчёт.
(function () {
  "use strict";

  // ───────────── данные ─────────────
  const BANK = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(window.BANK_B64), (c) => c.charCodeAt(0))));
  const TASKS = BANK.tasks;
  const TASK = Object.fromEntries(TASKS.map((t) => [t.id, t]));
  const MOCKS = BANK.mocks;
  const TOPICS = window.TOPICS;
  const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
  const GENS = window.GENERATORS;
  const GEN = Object.fromEntries(GENS.map((g) => [g.id, g]));

  const DAYS = [
    { n: 1, topics: ["ascii", "hash"], note: "Коды символов и хеши — основа почти всех задач" },
    { n: 2, topics: ["code"], note: "Чтение и обращение кода, обфускация" },
    { n: 3, topics: ["ciphers"], note: "Классические шифры" },
    { n: 4, topics: ["brute"], note: "Перебор и комбинаторика" },
    { n: 5, topics: ["systems"], note: "Нагрузка, атаки, логи" },
    { n: 6, topics: ["stego", "net"], mock: "mock1", note: "Стеганография, сети + первый пробный тур" },
    { n: 7, topics: [], mock: "mock2", review: true, note: "Второй пробный тур и работа над ошибками" },
  ];
  const QUAL_START = new Date(2026, 10, 9); // 9 ноября 2026

  // ───────────── состояние ─────────────
  const KEY = "ikb-trainer-v1";
  const blank = () => ({ v: 1, created: Date.now(), theory: {}, tasks: {}, gens: {}, genLog: [], mocks: {}, days: {} });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* приватный режим */ } };
  const ts = (id) => (S.tasks[id] = S.tasks[id] || { st: "new", tries: 0, wrong: [], hints: 0, sol: false, ms: 0 });
  const gs = (id) => (S.gens[id] = S.gens[id] || { seed: newSeed(), ok: 0, clean: 0, tries: 0, shown: 0, hints: 0, cur: { tries: 0, hints: 0, sol: false, done: false } });
  function newSeed() { return Math.floor(Math.random() * 2 ** 31); }
  const today = () => new Date().toISOString().slice(0, 10);

  // ───────────── учёт времени ─────────────
  let activeKey = null, lastInput = Date.now();
  ["keydown", "mousemove", "mousedown", "touchstart", "scroll"].forEach((e) => addEventListener(e, () => (lastInput = Date.now()), { passive: true }));
  setInterval(() => {
    if (document.visibilityState !== "visible" || Date.now() - lastInput > 5 * 60000) return;
    S.days[today()] = (S.days[today()] || 0) + 5000;
    if (activeKey && activeKey.startsWith("task:")) ts(activeKey.slice(5)).ms += 5000;
    if (activeKey && activeKey.startsWith("gen:")) { const g = gs(activeKey.slice(4)); g.ms = (g.ms || 0) + 5000; }
    if (activeKey && activeKey.startsWith("mock:")) { /* время тура считается по часам */ }
    save();
  }, 5000);

  // ───────────── утилиты ─────────────
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmtMin = (ms) => { const m = Math.round(ms / 60000); return m < 60 ? `${m} мин` : `${Math.floor(m / 60)} ч ${m % 60} мин`; };
  const plain = (html) => { const d = document.createElement("div"); d.innerHTML = html.replace(/<br\s*\/?>/g, "\n").replace(/<\/(p|tr|li|pre|h\d)>/g, "\n"); d.querySelectorAll("td,th").forEach((c) => c.append(" ")); return d.textContent.replace(/\n{3,}/g, "\n\n").trim(); };

  function canonNum(s) {
    s = String(s).trim().replace(/\s/g, "").replace(",", ".");
    const m = s.match(/^([+-]?)(\d*)(?:\.(\d*))?$/);
    if (!m || (m[2] === "" && !m[3])) return null;
    const int = m[2].replace(/^0+/, "") || "0", frac = (m[3] || "").replace(/0+$/, "");
    const sign = m[1] === "-" && (int !== "0" || frac) ? "-" : "";
    return sign + int + (frac ? "." + frac : "");
  }
  function norm(type, s) {
    s = String(s).trim().replace(/^["'«]+|["'»]+$/g, "").replace(/\s+/g, " ");
    if (type === "number") return canonNum(s) ?? s.toLowerCase();
    if (type === "text_ci") return s.toLowerCase().replace(/ё/g, "е");
    return s;
  }
  function check(answer, input) {
    const v = norm(answer.type, input);
    return answer.accepted.some((a) => norm(answer.type, a) === v);
  }

  const STATUS = {
    new: ["", "не начата"], tried: ["st-tried", "в процессе"], solved: ["st-solved", "решена сама"],
    helped: ["st-helped", "решена с подсказкой"], shown: ["st-shown", "смотрел решение"], skipped: ["st-skipped", "пропущена"],
  };
  const isDone = (id) => ["solved", "helped", "shown"].includes(ts(id).st);
  const chip = (st) => `<span class="chip ${STATUS[st][0]}">${STATUS[st][1]}</span>`;

  // ───────────── прогресс по темам ─────────────
  const topicGens = (tid) => GENS.filter((g) => g.topic === tid);
  const coreTasks = (tid) => TASKS.filter((t) => t.topic === tid && t.core);
  const extraTasks = (tid) => TASKS.filter((t) => t.topic === tid && !t.core && !t.reserved);
  function topicProgress(tid) {
    const g = topicGens(tid), c = coreTasks(tid);
    const gDone = g.filter((x) => gs(x.id).ok > 0).length;
    const cDone = c.filter((t) => isDone(t.id)).length;
    const total = 1 + g.length + c.length;
    const done = (S.theory[tid] ? 1 : 0) + gDone + cDone;
    return { gDone, gTotal: g.length, cDone, cTotal: c.length, pct: Math.round((100 * done) / total), complete: done === total };
  }
  // задачи «на повтор»: открыто решение — нужно решить парный вариант
  function redoQueue(tid) {
    const out = [];
    for (const t of TASKS) {
      if (tid && t.topic !== tid) continue;
      const s = S.tasks[t.id];
      if (!s || s.st !== "shown") continue;
      const tw = t.twin && TASK[t.twin];
      if (tw && !tw.reserved && !isDone(tw.id)) out.push(tw);
    }
    return out;
  }

  // ───────────── автопилот ─────────────
  function nextStep() {
    for (const day of DAYS) {
      for (const tid of day.topics) {
        if (!S.theory[tid]) return { day, href: `#/topic/${tid}`, label: `Прочитать теорию: «${TOPIC[tid].title}»` };
        const g = topicGens(tid).find((x) => gs(x.id).ok === 0);
        if (g) return { day, href: `#/gen/${g.id}`, label: `Тренировка: «${g.title}»` };
        const r = redoQueue(tid)[0];
        if (r) return { day, href: `#/task/${r.id}`, label: `Реши парный вариант: «${r.title}»` };
        const t = coreTasks(tid).filter((x) => !isDone(x.id)).sort((a, b) => (ts(a.id).st === "skipped") - (ts(b.id).st === "skipped") || a.prio - b.prio)[0];
        if (t) return { day, href: `#/task/${t.id}`, label: `Задача олимпиады: «${t.title}» (${t.source})` };
      }
      if (day.mock && MOCKS.find((m) => m.id === day.mock) && !(S.mocks[day.mock] || {}).done) {
        const m = MOCKS.find((x) => x.id === day.mock);
        return { day, href: `#/mock/${m.id}`, label: m.title };
      }
      if (day.review) {
        const r = redoQueue(null)[0];
        if (r) return { day, href: `#/task/${r.id}`, label: `Работа над ошибками: «${r.title}»` };
      }
    }
    return { day: null, href: "#/extra", label: "Основной курс пройден! Дополнительные задачи и туры" };
  }

  // ───────────── рендер ─────────────
  const app = () => $("#app");
  function render() {
    activeKey = null;
    const h = location.hash.replace(/^#\/?/, "").split("/");
    const [page, arg] = h;
    window.scrollTo(0, 0);
    try {
      if (page === "topic" && TOPIC[arg]) return viewTopic(arg);
      if (page === "task" && TASK[arg]) return viewTask(arg);
      if (page === "gen" && GEN[arg]) return viewGen(arg);
      if (page === "mock") return arg ? viewMock(arg) : viewMocks();
      if (page === "errors") return viewErrors();
      if (page === "report") return viewReport();
      if (page === "cheats") return viewCheats();
      if (page === "extra") return viewExtra();
      return viewHome();
    } finally {
      document.querySelectorAll("nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#/" + (page || "")));
    }
  }
  addEventListener("hashchange", render);

  function viewHome() {
    const nx = nextStep();
    const days = Math.ceil((QUAL_START - new Date()) / 86400000);
    const totalMs = Object.values(S.days).reduce((a, b) => a + b, 0);
    const solved = TASKS.filter((t) => isDone(t.id)).length;
    const genOk = Object.values(S.gens).reduce((a, g) => a + g.ok, 0);
    let html = `<section class="hero">
      <div><h1>Подготовка к олимпиаде им. Верченко</h1><p class="muted">Профиль «Информатика и компьютерная безопасность» · 8–10 классы</p>
      <p>${days > 0 ? `До начала отборочного этапа — <b>${days} дн.</b> (9 ноября 2026 – 8 февраля 2027)` : "Отборочный этап идёт: 9 ноября 2026 – 8 февраля 2027"}</p></div>
      <a class="btn big" href="${nx.href}">▶ Продолжить<small>${esc(nx.label)}</small></a>
    </section>
    <div class="stats"><div><b>${solved}</b><span>задач олимпиады</span></div><div><b>${genOk}</b><span>тренировочных</span></div><div><b>${fmtMin(totalMs)}</b><span>занимался всего</span></div><div><b>${fmtMin(S.days[today()] || 0)}</b><span>сегодня</span></div></div>
    <h2>План на неделю</h2><div class="days">`;
    for (const d of DAYS) {
      const items = d.topics.map((tid) => { const p = topicProgress(tid); return `<a class="trow" href="#/topic/${tid}"><span>${TOPIC[tid].title}</span><span class="bar"><i style="width:${p.pct}%"></i></span><span class="muted">${p.pct}%</span></a>`; });
      if (d.mock) { const m = MOCKS.find((x) => x.id === d.mock), st = S.mocks[d.mock]; if (m) items.push(`<a class="trow" href="#/mock/${m.id}"><span>⏱ ${m.title}</span><span></span><span class="muted">${st && st.done ? `${st.score}/${m.tasks.length}` : "—"}</span></a>`); }
      if (d.review) items.push(`<a class="trow" href="#/errors"><span>📒 Тетрадь ошибок</span><span></span><span class="muted">${redoQueue(null).length} на повтор</span></a>`);
      const cur = nx.day && nx.day.n === d.n;
      html += `<div class="day ${cur ? "current" : ""}"><div class="dhead"><b>День ${d.n}</b><span class="muted">${d.note}</span></div>${items.join("")}</div>`;
    }
    html += `</div><h2>Как заниматься</h2><div class="card">${window.STRATEGY}</div>`;
    app().innerHTML = html;
  }

  function taskRow(t) {
    const s = S.tasks[t.id];
    return `<a class="trow" href="#/task/${t.id}"><span>${esc(t.title)} <span class="muted">· ${esc(t.source)}</span></span><span>${t.difficulty >= 3 ? '<span class="chip">сложная</span>' : ""}</span><span>${chip(s ? s.st : "new")}</span></a>`;
  }

  function viewTopic(tid) {
    const T = TOPIC[tid], p = topicProgress(tid);
    const gens = topicGens(tid), core = coreTasks(tid).sort((a, b) => a.prio - b.prio), extra = extraTasks(tid).sort((a, b) => a.prio - b.prio);
    app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › ${T.title}</p><h1>${T.title}</h1><p class="muted">${T.short}</p>
      <div class="bar wide"><i style="width:${p.pct}%"></i></div>
      <details class="card theory" ${S.theory[tid] ? "" : "open"}><summary><h2>1. Теория ${S.theory[tid] ? "✓" : ""}</h2></summary>${T.theory}
      <details class="pyref-box"><summary><b>Функции Python для этой темы</b></summary>${pyRef(tid)}</details>
      ${S.theory[tid] ? "" : `<button class="btn" id="read">Прочитал(а), понятно → к тренировке</button>`}</details>
      <div class="card"><h2>2. Тренировка (задачи генерируются заново, их бесконечно много)</h2>${gens.map((g) => { const x = gs(g.id); return `<a class="trow" href="#/gen/${g.id}"><span>${g.title}</span><span class="muted">решено: ${x.ok}${x.shown ? ` · с решением: ${x.shown}` : ""}</span><span>${x.ok ? chip("solved") : chip("new")}</span></a>`; }).join("")}</div>
      <div class="card"><h2>3. Задачи олимпиады (${p.cDone}/${p.cTotal})</h2>${core.map(taskRow).join("") || '<p class="muted">Нет задач</p>'}</div>
      ${extra.length ? `<details class="card"><summary><h2>Дополнительно: вторые варианты, старые годы, 11 класс (${extra.length})</h2></summary>${extra.map(taskRow).join("")}</details>` : ""}`;
    const b = $("#read");
    if (b) b.onclick = () => { S.theory[tid] = Date.now(); save(); location.hash = nextStep().href; };
  }

  // общий блок «ответ + подсказки + решение»
  function solveBlock(o) {
    // o: {answer, hints, solution, state, onCorrect, onWrong, onHint, onSolution, after}
    const a = o.answer;
    let input;
    if (!a) input = `<p class="note">У этой задачи нет автопроверки (развёрнутый ответ). Реши, затем открой решение и честно оцени себя.</p>`;
    else if (a.type === "choice") input = `<div class="choices">${a.choices.map((c, i) => `<label><input type="radio" name="ch" value="${esc(c)}"> ${esc(c)}</label>`).join("")}</div>`;
    else input = `<input id="ans" autocomplete="off" spellcheck="false" placeholder="${a.type === "number" ? "Число" : "Ответ"}${a.type === "text_cs" ? " (регистр важен)" : ""}">`;
    return `<div class="card solve">
      <div class="answer">${input}${a ? `<button class="btn" id="chk">Проверить</button>` : ""}</div>
      <div id="fb"></div>
      <div class="help">
        ${o.hints.length ? `<button class="btn ghost" id="hint">💡 Подсказка (${Math.min(o.state.hints, o.hints.length)}/${o.hints.length})</button>` : ""}
        <button class="btn ghost" id="sol">📖 ${o.state.sol ? "Решение" : "Показать решение"}</button>
        ${o.ask ? `<button class="btn ghost" id="ask">🤖 Спросить Claude</button>` : ""}
      </div>
      <div id="hints">${o.hints.slice(0, o.state.hints).map((h, i) => `<div class="hintbox"><b>Подсказка ${i + 1}.</b> ${h}</div>`).join("")}</div>
      <div id="askbox"></div>
      <div id="solbox">${o.state.sol ? `<div class="solution">${o.solution}</div>` : ""}</div>
    </div>`;
  }

  function wireSolve(o) {
    const fb = $("#fb");
    const getInput = () => { if (o.answer.type === "choice") { const r = document.querySelector('input[name="ch"]:checked'); return r ? r.value : ""; } return $("#ans").value; };
    const chk = $("#chk");
    if (chk) {
      const go = () => {
        const v = getInput();
        if (!v.trim()) { fb.innerHTML = `<p class="bad">Введи ответ.</p>`; return; }
        if (check(o.answer, v)) { fb.innerHTML = `<p class="good">✅ Верно!</p>${o.after()}`; o.onCorrect(v); wireAfter(); }
        else { o.onWrong(v); fb.innerHTML = `<p class="bad">❌ Неверно. ${o.state.tries >= 3 && o.state.hints < o.hints.length ? "Попробуй взять подсказку." : "Проверь вычисления, алфавит, регистр и нумерацию (с 0 или с 1)."}</p>`; }
      };
      chk.onclick = go;
      const ans = $("#ans");
      if (ans) ans.onkeydown = (e) => { if (e.key === "Enter") go(); };
    }
    const hb = $("#hint");
    if (hb) hb.onclick = () => {
      if (o.state.hints >= o.hints.length) return;
      if (!hb.dataset.sure && o.spentMs() < 3 * 60000 && o.state.hints === 0) { hb.dataset.sure = 1; hb.textContent = "Ты думаешь меньше 3 минут. Точно нужна подсказка? Нажми ещё раз"; return; }
      o.onHint();
      $("#hints").insertAdjacentHTML("beforeend", `<div class="hintbox"><b>Подсказка ${o.state.hints}.</b> ${o.hints[o.state.hints - 1]}</div>`);
      hb.textContent = `💡 Подсказка (${o.state.hints}/${o.hints.length})`;
      delete hb.dataset.sure;
    };
    const sb = $("#sol");
    sb.onclick = () => {
      if (o.state.sol || o.state.done) { $("#solbox").innerHTML = `<div class="solution">${o.solution}</div>`; if (!o.state.sol) { o.state.sol = true; o.onSolutionAfter && o.onSolutionAfter(); } return; }
      if (!sb.dataset.sure) { sb.dataset.sure = 1; sb.textContent = "Задача не будет засчитана — потом нужно решить похожую. Открыть? Нажми ещё раз"; return; }
      o.onSolution();
      $("#solbox").innerHTML = `<div class="solution">${o.solution}</div>${o.afterSolution ? o.afterSolution() : ""}`;
      sb.textContent = "📖 Решение";
      if (!o.answer) wireSelfGrade();
      wireAfter();
    };
    const ab = $("#ask");
    if (ab) ab.onclick = () => {
      $("#askbox").innerHTML = `<div class="hintbox"><p>Claude станет наставником: он не скажет ответ, а задаст наводящий вопрос. Напиши, что ты уже попробовал и где застрял:</p>
        <textarea id="tried" rows="4" placeholder="Например: перевёл числа в символы, получилась бессмыслица..."></textarea>
        <button class="btn" id="copyask">Скопировать вопрос и открыть Claude</button> <span id="copied" class="muted"></span></div>`;
      $("#copyask").onclick = async () => {
        const tried = $("#tried").value.trim();
        if (tried.length < 15) { $("#copied").textContent = "Опиши подробнее, что ты пробовал (хотя бы одно предложение)."; return; }
        const text = o.askPrompt(tried);
        try { await navigator.clipboard.writeText(text); } catch (e) { const ta = document.createElement("textarea"); ta.value = text; document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
        $("#copied").textContent = "Скопировано! Вставь в чат Claude (Cmd+V)." + (o.hasMedia ? " В условии есть картинка/файл — приложи скриншот." : "");
        window.open("https://claude.ai/new", "_blank");
      };
    };
    function wireSelfGrade() {
      const box = document.createElement("div");
      box.className = "selfgrade";
      box.innerHTML = `<p>Сравни со своим решением:</p><button class="btn" id="sg-ok">Я решил верно сам</button> <button class="btn ghost" id="sg-no">Не получилось</button>`;
      $("#solbox").append(box);
      $("#sg-ok").onclick = () => { o.onSelfGrade(true); box.innerHTML = `<p class="good">Отмечено.</p>${o.after()}`; wireAfter(); };
      $("#sg-no").onclick = () => { o.onSelfGrade(false); box.innerHTML = `<p>Отмечено — задача попадёт в тетрадь ошибок.</p>${o.after()}`; wireAfter(); };
    }
    function wireAfter() { document.querySelectorAll("[data-next]").forEach((b) => (b.onclick = () => (location.hash = b.dataset.next === "auto" ? nextStep().href : b.dataset.next))); }
    if (o.state.sol && !o.answer) wireSelfGrade();
  }

  function askPrompt(title, source, html, tried, wrong) {
    return `Ты — терпеливый наставник по олимпиадной информатике и криптографии. Я ученик 9 класса, готовлюсь к олимпиаде им. И.Я. Верченко «Информатика и компьютерная безопасность», знаю Python.
Правила: НЕ называй ответ и не решай задачу целиком. Задай один-два наводящих вопроса или подскажи следующий шаг. Если я прошу проверить мой ход решения — укажи, где ошибка, но не исправляй её за меня. Если я совсем застрял после нескольких подсказок — можешь объяснить метод на похожем примере с другими числами.

Задача «${title}» (${source}):
${plain(html)}

Что я уже попробовал:
${tried}
${wrong && wrong.length ? `\nМои неверные ответы: ${wrong.slice(-5).join("; ")}` : ""}`;
  }

  function viewTask(id) {
    const t = TASK[id], s = ts(id);
    if (t.reserved && !(S.mocks[t.reserved] || {}).done) {
      app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a></p><div class="card"><p>Эта задача отложена для пробного тура — сначала пройди тур.</p><a class="btn" href="#/mock/${t.reserved}">К туру</a></div>`;
      return;
    }
    activeKey = "task:" + id;
    if (!s.first) { s.first = Date.now(); save(); }
    const startMs = s.ms;
    const tw = t.twin && TASK[t.twin];
    const files = (t.files || []).length ? `<div class="files"><b>Файлы к задаче:</b> ${t.files.map((f) => `<a href="${esc(f.path)}" download>${esc(f.name)}</a>`).join(" · ")}</div>` : "";
    const after = () => `<div class="after"><button class="btn" data-next="auto">Дальше по плану →</button>${s.sol || s.st === "shown" ? "" : ` <button class="btn ghost" id="cmp">Сравнить с официальным решением</button>`}</div>`;
    app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › <a href="#/topic/${t.topic}">${TOPIC[t.topic].title}</a></p>
      <h1>${esc(t.title)}</h1><p class="muted">${esc(t.source)} <span id="stchip">${chip(s.st)}</span> ${tw ? `· парный вариант: <a href="#/task/${tw.id}">${esc(tw.source.split("·").pop().trim())}</a>` : ""}</p>
      <div class="card statement">${t.statement_html}${files}</div>
      ${solveBlock({ answer: t.answer, hints: t.hints || [], solution: t.solution_html, state: s, ask: true })}`;
    const upd = () => { $("#stchip").innerHTML = chip(s.st); const sk = $("#skip"); if (sk && s.st !== "new") sk.remove(); };
    const _save = save;
    const save2 = () => { _save(); upd(); };
    wireSolve({
      answer: t.answer, hints: t.hints || [], solution: t.solution_html, state: s, after,
      spentMs: () => s.ms - startMs + 0,
      hasMedia: /<img|files/.test(t.statement_html) || (t.files || []).length > 0,
      askPrompt: (tried) => askPrompt(t.title, t.source, t.statement_html, tried, s.wrong),
      onCorrect: () => {
        if (!["solved", "helped", "shown"].includes(s.st)) { s.st = s.sol ? "shown" : s.hints ? "helped" : "solved"; s.done = Date.now(); }
        save2();
        const c = $("#cmp"); if (c) c.onclick = () => { $("#solbox").innerHTML = `<div class="solution">${t.solution_html}</div>`; };
      },
      onWrong: (v) => { s.tries++; s.wrong.push(v); if (s.st === "new" || s.st === "skipped") s.st = "tried"; save2(); },
      onHint: () => { s.hints++; if (s.st === "new") s.st = "tried"; save2(); },
      onSolution: () => { s.sol = true; s.st = "shown"; s.done = s.done || Date.now(); save2(); },
      afterSolution: () => `<div class="after">${tw && !tw.reserved && !isDone(tw.id) ? `<a class="btn" href="#/task/${tw.id}">Решить парный вариант сам →</a>` : `<a class="btn" href="#/gen/${GENS.find((g) => g.topic === t.topic).id}">Решить похожую тренировочную →</a>`} <button class="btn ghost" data-next="auto">Дальше по плану</button></div>`,
      onSelfGrade: (ok) => { s.st = ok && !s.sol ? "solved" : ok ? "helped" : "shown"; s.done = Date.now(); save2(); },
    });
    if (s.st === "new") {
      const skip = document.createElement("button");
      skip.className = "btn ghost small"; skip.id = "skip"; skip.textContent = "Пропустить пока";
      skip.onclick = () => { s.st = "skipped"; save(); location.hash = nextStep().href; };
      $(".help").append(skip);
    }
  }

  let genFresh = null;
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest('[data-act="again"]') && genFresh) genFresh(); });
  function viewGen(gid) {
    const g = GEN[gid], st = gs(gid);
    activeKey = "gen:" + gid;
    const inst = window.makeGen(gid, st.seed);
    const cur = st.cur;
    const startMs = st.ms || 0;
    const fresh = () => { st.seed = newSeed(); st.cur = { tries: 0, hints: 0, sol: false, done: false }; save(); render(); };
    const after = () => `<div class="after"><button class="btn" data-act="again">Ещё одну такую</button> <button class="btn ghost" data-next="auto">Дальше по плану →</button></div>`;
    genFresh = fresh;
    const hints = [
      "Прочитай условие ещё раз и выпиши, что дано и что нужно найти. Какая тема из теории здесь применяется?",
      "Посмотри примеры кода в теории этой темы — один из них почти готовое решение.",
    ];
    app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › <a href="#/topic/${g.topic}">${TOPIC[g.topic].title}</a> › тренировка</p>
      <h1>${g.title}</h1><p class="muted">Тренировочная задача · решено таких: ${st.ok}</p>
      <div class="card statement">${inst.html}</div>
      ${solveBlock({ answer: inst.answer, hints, solution: inst.solution, state: cur, ask: true })}`;
    wireSolve({
      answer: inst.answer, hints, solution: inst.solution, state: cur, after,
      spentMs: () => (st.ms || 0) - startMs,
      hasMedia: /rgbgrid|grid/.test(inst.html),
      askPrompt: (tried) => askPrompt(g.title, "тренировочная задача", inst.html, tried, []),
      onCorrect: () => {
        if (!cur.done) {
          cur.done = true;
          if (!cur.sol) { st.ok++; if (!cur.hints && !cur.tries) st.clean++; }
          S.genLog.push({ g: gid, ok: !cur.sol, h: cur.hints, t: cur.tries, at: Date.now() });
          save();
        }
      },
      onWrong: () => { cur.tries++; st.tries++; save(); },
      onHint: () => { cur.hints++; st.hints++; save(); },
      onSolution: () => { cur.sol = true; st.shown++; S.genLog.push({ g: gid, ok: false, sol: true, at: Date.now() }); save(); },
      afterSolution: () => `<div class="after"><button class="btn" data-act="again">Решить новую такую сам →</button></div>`,
    });
  }

  // ───────────── пробные туры ─────────────
  function viewMocks() {
    app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › Пробные туры</p><h1>Пробные туры</h1>
      <p>Как на настоящем отборочном этапе: 5 задач, 4 часа, без подсказок. Ответы проверяются только в конце.</p>
      ${MOCKS.map((m) => { const st = S.mocks[m.id]; return `<a class="trow card" href="#/mock/${m.id}"><span>${m.title}</span><span></span><span>${st && st.done ? `<b>${st.score}/${m.tasks.length}</b>` : st ? "идёт" : "не начат"}</span></a>`; }).join("")}`;
  }
  let mockTimer = null;
  function viewMock(mid) {
    clearInterval(mockTimer);
    const m = MOCKS.find((x) => x.id === mid);
    if (!m) { location.hash = "#/mock"; return; }
    const st = S.mocks[mid];
    if (!st) {
      app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › <a href="#/mock">Пробные туры</a></p><h1>${m.title}</h1>
        <div class="card"><ul><li>5 задач, <b>${m.minutes / 60} часа</b>. Таймер не останавливается, даже если закрыть страницу.</li><li>Подсказок и решений во время тура нет. Python и любые свои программы — можно.</li><li>Ответы можно менять до конца тура. Результат и решения — после завершения.</li><li>Начни, когда точно есть 4 свободных часа.</li></ul>
        <button class="btn big" id="start">Начать тур</button></div>`;
      $("#start").onclick = () => { S.mocks[mid] = { start: Date.now(), answers: {}, done: false }; save(); render(); };
      return;
    }
    const end = st.start + m.minutes * 60000;
    const finish = () => {
      st.done = true; st.end = Math.min(Date.now(), end);
      st.results = {};
      st.score = 0;
      for (const id of m.tasks) { const t = TASK[id]; const ok = !!(t.answer && st.answers[id] && check(t.answer, st.answers[id])); st.results[id] = ok; if (ok) st.score++; const s = ts(id); if (ok && s.st === "new") { s.st = "solved"; s.done = Date.now(); } else if (!ok) { s.st = "tried"; if (st.answers[id]) { s.wrong.push(st.answers[id]); s.tries++; } } }
      save(); render();
    };
    if (!st.done && Date.now() >= end) return finish();
    if (st.done) {
      app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › <a href="#/mock">Пробные туры</a></p><h1>${m.title}</h1>
        <div class="card"><h2>Результат: ${st.score} из ${m.tasks.length}</h2><p class="muted">Время: ${fmtMin(st.end - st.start)}</p>
        ${m.tasks.map((id, i) => { const t = TASK[id]; return `<div class="trow"><span>${i + 1}. ${esc(t.title)}</span><span class="muted">твой ответ: ${esc(st.answers[id] || "—")}</span><span>${st.results[id] ? '<span class="chip st-solved">верно</span>' : '<span class="chip st-shown">неверно</span>'}</span></div>`; }).join("")}
        <p>Разбери каждую нерешённую задачу: открой её, попробуй ещё раз уже с подсказками, потом посмотри решение.</p>
        ${m.tasks.map((id, i) => `<a class="btn ghost" href="#/task/${id}">Разбор задачи ${i + 1}</a>`).join(" ")}
        <p></p><button class="btn" data-next="auto" id="nx">Дальше по плану →</button></div>`;
      $("#nx").onclick = () => (location.hash = nextStep().href);
      return;
    }
    activeKey = "mock:" + mid;
    let cur = st.cur || 0;
    const draw = () => {
      const id = m.tasks[cur], t = TASK[id];
      const a = t.answer;
      const v = st.answers[id] || "";
      const files = (t.files || []).length ? `<div class="files"><b>Файлы:</b> ${t.files.map((f) => `<a href="${esc(f.path)}" download>${esc(f.name)}</a>`).join(" · ")}</div>` : "";
      app().innerHTML = `<div class="mockbar"><b>${m.title}</b><span id="clock"></span><button class="btn ghost small" id="fin">Завершить тур</button></div>
        <div class="tabs">${m.tasks.map((x, i) => `<button class="tab ${i === cur ? "on" : ""} ${st.answers[x] ? "has" : ""}" data-i="${i}">Задача ${i + 1}</button>`).join("")}</div>
        <h1>${esc(t.title)}</h1><div class="card statement">${t.statement_html}${files}</div>
        <div class="card"><div class="answer">${a && a.type === "choice" ? `<div class="choices">${a.choices.map((c) => `<label><input type="radio" name="ch" value="${esc(c)}" ${c === v ? "checked" : ""}> ${esc(c)}</label>`).join("")}</div>` : `<input id="ans" value="${esc(v)}" placeholder="Ответ">`}<button class="btn" id="sv">Сохранить ответ</button></div><p id="saved" class="muted">${v ? "Ответ сохранён" : ""}</p></div>`;
      document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => { cur = st.cur = +b.dataset.i; save(); draw(); }));
      $("#sv").onclick = () => { const val = a && a.type === "choice" ? (document.querySelector('input[name="ch"]:checked') || {}).value : $("#ans").value; if (val && val.trim()) { st.answers[id] = val.trim(); save(); $("#saved").textContent = "Ответ сохранён"; document.querySelector(`.tab[data-i="${cur}"]`).classList.add("has"); } };
      const fin = $("#fin");
      fin.onclick = () => { if (!fin.dataset.sure) { fin.dataset.sure = 1; fin.textContent = `Ответов: ${Object.keys(st.answers).length}/5. Точно завершить?`; return; } finish(); };
      tick();
    };
    const tick = () => { const left = end - Date.now(); if (left <= 0) { clearInterval(mockTimer); finish(); return; } const c = $("#clock"); if (c) c.textContent = `⏱ ${Math.floor(left / 3600000)}:${String(Math.floor((left % 3600000) / 60000)).padStart(2, "0")}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`; };
    draw();
    mockTimer = setInterval(() => { if (!location.hash.startsWith("#/mock/" + mid)) { clearInterval(mockTimer); return; } tick(); }, 1000);
  }

  // ───────────── тетрадь ошибок ─────────────
  function viewErrors() {
    const list = TASKS.filter((t) => { const s = S.tasks[t.id]; return s && (s.st === "shown" || s.st === "tried" || s.tries > 0 || s.st === "skipped"); });
    const genBad = GENS.filter((g) => { const x = S.gens[g.id]; return x && (x.shown > 0 || x.tries > x.ok * 2); });
    app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › Тетрадь ошибок</p><h1>Тетрадь ошибок</h1>
      <p class="muted">Сюда автоматически попадают задачи, где были неверные ответы, открытое решение или пропуск. Вернись к ним через день — это лучший способ запомнить метод.</p>
      <div class="card"><h2>На повтор: парные варианты (${redoQueue(null).length})</h2>${redoQueue(null).map(taskRow).join("") || '<p class="muted">Пусто — отлично!</p>'}</div>
      <div class="card"><h2>Задачи олимпиады с ошибками</h2>${list.map((t) => { const s = S.tasks[t.id]; return `<a class="trow" href="#/task/${t.id}"><span>${esc(t.title)} <span class="muted">· ${esc(t.source)}</span></span><span class="muted">${s.wrong.length ? "ошибки: " + esc(s.wrong.slice(-3).join("; ")) : ""}</span><span>${chip(s.st)}</span></a>`; }).join("") || '<p class="muted">Пусто</p>'}</div>
      <div class="card"><h2>Типы тренировочных задач, которые даются тяжело</h2>${genBad.map((g) => { const x = S.gens[g.id]; return `<a class="trow" href="#/gen/${g.id}"><span>${g.title}</span><span class="muted">верно ${x.ok}, ошибок ${x.tries}, смотрел решение ${x.shown}</span><span></span></a>`; }).join("") || '<p class="muted">Пусто</p>'}</div>`;
  }

  // ───────────── дополнительно ─────────────
  function viewExtra() {
    app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › Дополнительно</p><h1>Дополнительные задачи</h1>
      <p>Основной план пройден. Дальше — до самого отборочного этапа: оставшиеся пробные туры, вторые варианты, старые годы и задачи 11 класса.</p>
      <p><a class="btn" href="#/mock">Пробные туры</a> <a class="btn ghost" href="#/errors">Тетрадь ошибок</a></p>
      ${TOPICS.map((T) => { const ex = extraTasks(T.id).filter((t) => !isDone(t.id)); return `<details class="card"><summary><h2>${T.title} — осталось ${ex.length}</h2></summary>${ex.map(taskRow).join("")}</details>`; }).join("")}`;
  }

  // ───────────── шпаргалки ─────────────
  function viewCheats() {
    let ascii = '<div class="scroll"><table class="grid small ascii"><tr>';
    for (let c = 32; c < 127; c++) { ascii += `<td><b>${c === 32 ? "␠" : esc(String.fromCharCode(c))}</b><br>${c}<br><span class="muted">${c.toString(16)}</span></td>`; if ((c - 31) % 16 === 0) ascii += "</tr><tr>"; }
    ascii += "</tr></table></div>";
    const ru = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
    app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › Шпаргалки</p><h1>Шпаргалки</h1>
      <div class="card"><h2>Таблица ASCII (символ / десятичный / hex)</h2>${ascii}</div>
      <div class="card"><h2>Русский алфавит</h2><p>33 буквы с Ё (нумерация с 1):</p><div class="scroll"><table class="alph"><tr>${[...ru].map((c) => `<td>${c}</td>`).join("")}</tr><tr>${[...ru].map((_, i) => `<td>${i + 1}</td>`).join("")}</tr></table></div>
      <p>32 буквы без Ё (нумерация с 0):</p><div class="scroll"><table class="alph"><tr>${[...ru.replace("Ё", "")].map((c) => `<td>${c}</td>`).join("")}</tr><tr>${[...ru.replace("Ё", "")].map((_, i) => `<td>${i}</td>`).join("")}</tr></table></div></div>
      <div class="card"><h2>Python: самое нужное</h2><pre><code>ord('A'), chr(65)                       # код ↔ символ
int('ff', 16), int('101', 2), int('21', 3)  # из системы счисления
format(10, '08b'), hex(255)              # в систему счисления
bytes.fromhex('48656c6c6f').decode()     # hex → текст
'abc'[::-1], s.upper(), s.lower()        # строки
x ^ k                                    # XOR
pow(a, b, n)                             # a^b mod n
pow(k, -1, n)                            # обратный к k по модулю n
from itertools import product, permutations
from collections import Counter
open('f.txt', encoding='utf-8').read().splitlines()
import math; math.ceil(x), math.floor(x)</code></pre></div>
      <div class="card"><h2>Функции Python по темам</h2><p class="muted">Всё, что встречается в решениях задач тренажёра. Справа — пример и что он выведет.</p>${TOPICS.map((T) => `<details class="pyref-box"><summary><b>${T.title}</b></summary>${pyRef(T.id)}</details>`).join("")}</div>
      <div class="card">${window.STRATEGY}</div>`;
  }

  // ───────────── отчёт для родителя ─────────────
  function reportText() {
    const lines = [];
    const totalMs = Object.values(S.days).reduce((a, b) => a + b, 0);
    lines.push(`Отчёт тренажёра ИКБ на ${new Date().toLocaleDateString("ru")}`);
    lines.push(`Всего занятий: ${fmtMin(totalMs)}, дней с занятиями: ${Object.keys(S.days).length}`);
    lines.push("");
    for (const T of TOPICS) {
      const p = topicProgress(T.id);
      const c = coreTasks(T.id);
      const own = c.filter((t) => ts(t.id).st === "solved").length, help = c.filter((t) => ts(t.id).st === "helped").length, shown = c.filter((t) => ts(t.id).st === "shown").length;
      lines.push(`${T.title}: ${p.pct}% · задачи ${p.cDone}/${p.cTotal} (сам ${own}, с подсказкой ${help}, по решению ${shown}) · тренировка ${p.gDone}/${p.gTotal} типов`);
    }
    lines.push("");
    for (const m of MOCKS) { const st = S.mocks[m.id]; if (st) lines.push(`${m.title}: ${st.done ? `${st.score}/${m.tasks.length} за ${fmtMin(st.end - st.start)}` : "идёт"}`); }
    lines.push(`На повтор (смотрел решение): ${redoQueue(null).length}`);
    return lines.join("\n");
  }
  function viewReport() {
    const days = Object.entries(S.days).sort();
    const maxd = Math.max(1, ...days.map((d) => d[1]));
    app().innerHTML = `<p class="crumbs"><a href="#/">Главная</a> › Отчёт</p><h1>Отчёт для родителя</h1>
      <div class="card"><h2>Время занятий по дням</h2>${days.map(([d, ms]) => `<div class="trow"><span>${new Date(d).toLocaleDateString("ru", { weekday: "short", day: "numeric", month: "short" })}</span><span class="bar"><i style="width:${(100 * ms) / maxd}%"></i></span><span class="muted">${fmtMin(ms)}</span></div>`).join("") || '<p class="muted">Пока нет данных</p>'}</div>
      <div class="card"><h2>По темам</h2><table class="mini wide"><tr><th>Тема</th><th>Прогресс</th><th>Сам</th><th>С подсказкой</th><th>По решению</th><th>Ошибок</th></tr>
      ${TOPICS.map((T) => { const p = topicProgress(T.id), c = coreTasks(T.id); const cnt = (x) => c.filter((t) => ts(t.id).st === x).length; const err = c.reduce((a, t) => a + ts(t.id).tries, 0); return `<tr><td><a href="#/topic/${T.id}">${T.title}</a></td><td>${p.pct}%</td><td>${cnt("solved")}</td><td>${cnt("helped")}</td><td>${cnt("shown")}</td><td>${err}</td></tr>`; }).join("")}</table></div>
      <div class="card"><h2>Пробные туры</h2>${MOCKS.map((m) => { const st = S.mocks[m.id]; return `<div class="trow"><span>${m.title}</span><span></span><span>${st ? (st.done ? `<b>${st.score}/${m.tasks.length}</b>` : "идёт") : "—"}</span></div>`; }).join("")}</div>
      <div class="card"><h2>Поделиться</h2><p>Ребёнок может нажать кнопку и отправить отчёт вам в мессенджер.</p><pre id="rep">${esc(reportText())}</pre>
      <button class="btn" id="cp">Скопировать отчёт</button> <button class="btn ghost" id="exp">Скачать резервную копию прогресса</button> <label class="btn ghost">Загрузить копию<input type="file" id="imp" accept=".json" hidden></label> <span id="msg" class="muted"></span></div>`;
    $("#cp").onclick = async () => { try { await navigator.clipboard.writeText(reportText()); $("#msg").textContent = "Скопировано"; } catch (e) { $("#msg").textContent = "Выдели текст выше и скопируй вручную"; } };
    $("#exp").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: "application/json" })); a.download = `ikb-progress-${today()}.json`; a.click(); };
    $("#imp").onchange = async (e) => { try { const d = JSON.parse(await e.target.files[0].text()); if (d.v !== 1) throw 0; S = Object.assign(blank(), d); save(); $("#msg").textContent = "Прогресс загружен"; render(); } catch (err) { $("#msg").textContent = "Не удалось прочитать файл"; } };
  }

  render();
})();
