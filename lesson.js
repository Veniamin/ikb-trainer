// Видеоурок: диктор читает фразы по очереди, на каждую фразу — действие на «сцене» 960×540; после главы — упражнения.
// Урок: { id, title, chapters: [{ id, title, stage(box, L) → s, lines: [[текст, (s, T) => …] | {say, cap, do}], practice(el, P, L) }] }.
// Звук фразы — window.LESSON_VOICE[урок][текст] = [файл, секунды] (tools/voice_lesson.py); без звука — время по длине текста.
(function () {
  "use strict";
  const W = 960, H = 540, GAP = 0.35, RATES = [1, 1.25, 1.5, 0.8];

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function el(tag, cls, html, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.append(e);
    return e;
  }
  const flat = (a) => a.flat(Infinity).filter(Boolean);
  const show = (...a) => flat(a).forEach((e) => e.classList.remove("hid"));
  const hide = (...a) => flat(a).forEach((e) => e.classList.add("hid"));
  const mark = (cls, on, ...a) => flat(a).forEach((e) => e.classList.toggle(cls, on));
  // клетка с буквой и (необязательно) номером под ней
  function tile(ch, num, cls, parent) {
    const t = el("div", "tile" + (cls ? " " + cls : ""), `<b>${esc(ch)}</b>${num != null ? `<i>${esc(num)}</i>` : ""}`, parent);
    return t;
  }
  function setTile(t, ch, num) {
    t.querySelector("b").textContent = ch;
    const i = t.querySelector("i");
    if (i && num !== undefined) i.textContent = num;
  }
  function tiles(parent, str, num, cls) {
    const r = el("div", "lrow" + (/mini/.test(cls || "") ? " tight" : ""), null, parent);
    return { el: r, t: [...str].map((c, i) => tile(c, num ? num(c, i) : null, cls, r)) };
  }
  const L = { el, esc, show, hide, mark, tile, setTile, tiles };

  // ───────────── упражнения ─────────────
  const normText = (s) => String(s).toUpperCase().replace(/Ё/g, "Е").replace(/[\s.,;:!?«»"'()[\]-]+/g, "");
  function mkP(onSolved, done) {
    const tasks = [];
    const P = {
      // spec.make() → { q, a: строка | [строки], sol, hint, choices? }; ответ сравнивается без пробелов, регистра и Ё/Е
      task(parent, spec) {
        const box = el("div", "ltask", null, parent);
        const st = { solved: false };
        tasks.push(st);
        let cur, wrong;
        const fresh = () => {
          cur = spec.make();
          wrong = 0;
          const acc = [].concat(cur.a).map(normText);
          box.innerHTML = `<div class="ltq">${spec.title ? `<b>${spec.title}.</b> ` : ""}${cur.q}</div>
            ${cur.choices ? `<div class="ltc">${cur.choices.map((c) => `<button class="btn ghost small" data-c="${esc(c)}">${esc(c)}</button>`).join(" ")}</div>`
              : `<div class="lta"><input type="text" autocomplete="off" spellcheck="false" placeholder="${esc(spec.ph || "ответ")}"><button class="btn small" data-a="check">Проверить</button></div>`}
            <div class="ltmsg"></div>
            <div class="lthelp">${cur.hint ? '<button class="btn ghost small" data-a="hint">Подсказка</button>' : ""}
              <button class="btn ghost small" data-a="sol">Показать решение</button>
              <button class="btn ghost small" data-a="new">Другое задание</button></div>`;
          if (cur.mount) cur.mount(box.querySelector(".ltq"));
          const msg = box.querySelector(".ltmsg"), inp = box.querySelector(".lta input");
          const verdict = (v) => {
            if (acc.includes(normText(v))) {
              msg.innerHTML = '<span class="good">Верно! ✓</span>';
              if (box.dataset.shown) msg.innerHTML += ' <span class="muted">— решение было открыто, чтобы засчиталось, реши «Другое задание».</span>';
              else {
                box.classList.add("ok");
                if (!st.solved) { st.solved = true; onSolved(); if (tasks.every((t) => t.solved)) done(); }
              }
            } else {
              wrong++;
              msg.innerHTML = `<span class="bad">Пока неверно.</span> ${wrong >= 2 && cur.hint ? "Возьми подсказку." : "Проверь ещё раз."}`;
              box.classList.remove("ok");
            }
          };
          if (inp) {
            inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") verdict(inp.value); };
            box.querySelector('[data-a="check"]').onclick = () => verdict(inp.value);
          }
          box.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { box.querySelectorAll("[data-c]").forEach((x) => x.classList.remove("pick")); b.classList.add("pick"); verdict(b.dataset.c); }));
          const hb = box.querySelector('[data-a="hint"]');
          if (hb) hb.onclick = () => { msg.innerHTML = `<div class="hintbox">${cur.hint}</div>`; };
          box.querySelector('[data-a="sol"]').onclick = () => { box.dataset.shown = 1; msg.innerHTML = `<div class="hintbox">${cur.sol}</div>`; };
          box.querySelector('[data-a="new"]').onclick = () => { delete box.dataset.shown; box.classList.remove("ok"); fresh(); };
          if (st.solved) box.classList.add("ok");
        };
        fresh();
        return box;
      },
      code(parent, src, title) {
        el("details", "lcode", `<summary><b>${title || "Как это сделать на Python"}</b></summary><pre><code>${esc(src)}</code></pre>`, parent);
      },
      count: () => tasks.length,
    };
    return P;
  }

  // ───────────── плеер ─────────────
  function mount(root, lesson, opt) {
    const prog = opt.progress; // { done: {главa: время}, ch: индекс главы }
    prog.done = prog.done || {};
    const voice = (window.LESSON_VOICE || {})[lesson.id] || {};
    const CH = lesson.chapters;
    const norm = (ln) => (Array.isArray(ln) ? { say: ln[0], do: ln[1] } : ln);
    CH.forEach((c) => (c.lines = c.lines.map(norm)));

    root.innerHTML = `<div class="lesson">
      <div class="lchaps"></div>
      <div class="lplayer">
        <div class="lscreen"><div class="lstage"></div><div class="lcover"></div></div>
        <div class="lcap"></div>
        <div class="lbar"></div>
        <div class="lctl">
          <button data-a="prev" title="Предыдущая фраза (←)">⏮</button>
          <button data-a="play" class="lpp" title="Пауза / продолжить (пробел)">▶</button>
          <button data-a="next" title="Следующая фраза (→)">⏭</button>
          <span class="lpos muted"></span><span class="lsp"></span>
          <button data-a="rate" title="Скорость речи">1×</button>
          <button data-a="cc" class="on" title="Субтитры">Субтитры</button>
        </div>
      </div>
      <div class="lpractice card"></div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const stageEl = $(".lstage"), screen = $(".lscreen"), cover = $(".lcover"), cap = $(".lcap"), bar = $(".lbar"), pr = $(".lpractice");
    const audio = new Audio();
    audio.preload = "auto";
    const warm = new Audio();
    warm.preload = "auto";

    let ci = Math.min(prog.ch || 0, CH.length - 1), li = 0, s = {}, events = [], dur = 1, hasAudio = false;
    let playing = false, started = false, lineEnded = false, gapTimer = 0, raf = 0, rate = 1, fakeAcc = 0, fakeStart = 0, alive = true;

    const lines = () => CH[ci].lines;
    const lineDur = (ln) => (voice[ln.say] ? voice[ln.say][1] : Math.max(1.5, ln.say.length / 13));
    function now() {
      if (hasAudio) return audio.currentTime;
      return fakeAcc + (playing && !lineEnded ? ((performance.now() - fakeStart) / 1000) * rate : 0);
    }
    function mkT(instant) {
      const T = {
        instant, dur,
        at(sec, fn) { if (instant) fn(); else events.push({ t: sec, fn }); },
        frac(f, fn) { T.at(f * T.dur, fn); },
        spread(n, fn, a = 0.08, b = 0.75) {
          for (let i = 0; i < n; i++) T.at(T.dur * (a + (n > 1 ? ((b - a) * i) / (n - 1) : 0)), () => fn(i));
        },
      };
      return T;
    }
    function fire(upto) {
      events.sort((a, b) => a.t - b.t);
      while (events.length && events[0].t <= upto) events.shift().fn();
    }

    // масштаб сцены под ширину экрана
    const fit = () => { stageEl.style.transform = `scale(${screen.clientWidth / W})`; };
    const ro = new ResizeObserver(fit);
    ro.observe(screen);

    function buildStage() {
      stageEl.innerHTML = "";
      s = CH[ci].stage(stageEl, L) || {};
    }
    function stopLine() {
      clearTimeout(gapTimer);
      audio.pause();
      events = [];
    }
    function playLine(i) {
      stopLine();
      li = i;
      lineEnded = false;
      const ln = lines()[i], v = voice[ln.say];
      hasAudio = !!v;
      dur = lineDur(ln);
      const T = mkT(false);
      if (ln.do) ln.do(s, T);
      cap.innerHTML = esc(ln.cap || ln.say);
      if (hasAudio) {
        audio.src = (opt.base || "") + v[0];
        audio.playbackRate = rate;
        if (playing) audio.play().catch(() => setPlaying(false));
        const nx = lines()[i + 1] || (CH[ci + 1] && CH[ci + 1].lines[0]);
        if (nx && voice[nx.say]) warm.src = (opt.base || "") + voice[nx.say][0];
      } else { fakeAcc = 0; fakeStart = performance.now(); }
      ui();
    }
    // перейти к фразе: сцена строится заново, предыдущие фразы проигрываются мгновенно
    function go(c, l) {
      stopLine();
      cover.innerHTML = "";
      cover.classList.remove("on");
      if (c !== ci) { ci = c; prog.ch = c; opt.save(); practice(); }
      buildStage();
      stageEl.classList.add("instant");
      for (let k = 0; k < l; k++) { const ln = lines()[k]; if (ln.do) ln.do(s, mkT(true)); }
      void stageEl.offsetWidth;
      stageEl.classList.remove("instant");
      started = true;
      playLine(l);
    }
    function lineEnd() {
      if (lineEnded) return;
      lineEnded = true;
      fire(Infinity);
      if (!playing) return;
      next();
    }
    function next() {
      clearTimeout(gapTimer);
      gapTimer = setTimeout(() => {
        if (!playing || !alive) return;
        if (li + 1 < lines().length) playLine(li + 1);
        else chapterEnd();
      }, (GAP * 1000) / rate);
    }
    function chapterEnd() {
      setPlaying(false);
      const last = ci + 1 >= CH.length;
      cover.innerHTML = `<div class="lend"><b>${last ? "Урок окончен!" : `Глава ${ci + 1} закончилась`}</b>
        <p>${prog.done[CH[ci].id] ? "Упражнения этой главы ты уже решил(а)." : "Теперь попробуй сам — упражнения под видео."}</p>
        <div>${prog.done[CH[ci].id] ? "" : '<button class="btn" data-e="pr">↓ К упражнениям</button> '}
        ${last ? "" : `<button class="btn ${prog.done[CH[ci].id] ? "" : "ghost"}" data-e="next">▶ Глава ${ci + 2}: ${esc(CH[ci + 1].title)}</button> `}
        <button class="btn ghost" data-e="again">↺ Ещё раз</button></div></div>`;
      cover.classList.add("on");
      cover.querySelector('[data-e="again"]').onclick = () => { go(ci, 0); setPlaying(true); };
      const n = cover.querySelector('[data-e="next"]');
      if (n) n.onclick = () => { go(ci + 1, 0); setPlaying(true); };
      const p = cover.querySelector('[data-e="pr"]');
      if (p) p.onclick = () => pr.scrollIntoView({ behavior: "smooth" });
    }
    function setPlaying(p) {
      if (p === playing) return;
      if (!p) {
        if (!hasAudio) fakeAcc = now();
        playing = false;
        audio.pause();
        clearTimeout(gapTimer);
      } else {
        playing = true;
        cover.classList.remove("on");
        if (lineEnded) next();
        else if (hasAudio) audio.play().catch(() => setPlaying(false));
        else fakeStart = performance.now();
      }
      ui();
    }
    function startCover() {
      cover.innerHTML = `<button class="lbig" title="Смотреть">▶</button><div class="lcov-t">Глава ${ci + 1} из ${CH.length}<b>${esc(CH[ci].title)}</b></div>`;
      cover.classList.add("on");
      cover.querySelector(".lbig").onclick = () => { if (!started) go(ci, 0); setPlaying(true); };
    }
    audio.onended = lineEnd;

    function loop() {
      if (!alive) return;
      if (started && !lineEnded) {
        fire(now());
        if (!hasAudio && playing && now() >= dur) lineEnd();
      }
      const segs = bar.children, cur = segs[li];
      if (cur) cur.firstChild.style.width = lineEnded ? "100%" : Math.min(100, (100 * now()) / dur) + "%";
      raf = requestAnimationFrame(loop);
    }

    function ui() {
      $(".lpp").textContent = playing ? "⏸" : "▶";
      $(".lpos").textContent = `Глава ${ci + 1}/${CH.length} · фраза ${li + 1}/${lines().length}`;
      if (bar.dataset.ch !== String(ci)) {
        bar.dataset.ch = ci;
        bar.innerHTML = lines().map((ln, k) => `<span style="flex:${lineDur(ln).toFixed(2)}" data-k="${k}" title="${esc(ln.cap || ln.say)}"><i></i></span>`).join("");
        bar.querySelectorAll("span").forEach((sp) => (sp.onclick = () => { go(ci, +sp.dataset.k); setPlaying(true); }));
      }
      [...bar.children].forEach((sp, k) => { sp.className = k < li ? "past" : k === li ? "cur" : ""; if (k !== li) sp.firstChild.style.width = k < li ? "100%" : "0"; });
      chaps();
    }
    function chaps() {
      $(".lchaps").innerHTML = CH.map((c, k) => `<button class="lch ${k === ci ? "on" : ""} ${prog.done[c.id] ? "done" : ""}" data-k="${k}">${k + 1}. ${esc(c.title)}</button>`).join("");
      root.querySelectorAll(".lch").forEach((b) => (b.onclick = () => { b.blur(); go(+b.dataset.k, 0); setPlaying(true); }));
    }
    function practice() {
      const c = CH[ci];
      pr.innerHTML = `<h2>Попробуй сам · ${esc(c.title)} ${prog.done[c.id] ? '<span class="chip st-solved">пройдено</span>' : ""}</h2><div class="lpbody"></div><div class="lpfoot"></div>`;
      const body = pr.querySelector(".lpbody"), foot = pr.querySelector(".lpfoot");
      let solved = 0;
      const P = mkP(() => { solved++; status(); }, () => {
        if (!prog.done[c.id]) { prog.done[c.id] = Date.now(); opt.save(); }
        status();
        chaps();
      });
      const status = () => {
        const n = P.count(), fin = prog.done[c.id] || (n && solved >= n);
        foot.innerHTML = (n ? `<p class="muted">Решено: ${solved} из ${n}. ${fin ? "" : "Глава засчитается, когда решишь все задания (решение можно подсмотреть, но тогда реши «Другое задание»)."}</p>` : "")
          + (fin ? (ci + 1 < CH.length ? `<button class="btn" data-f="next">Глава ${ci + 2}: ${esc(CH[ci + 1].title)} ▶</button>` : (opt.finish ? opt.finish() : "")) : "");
        const b = foot.querySelector('[data-f="next"]');
        if (b) b.onclick = () => { root.scrollIntoView({ behavior: "smooth" }); go(ci + 1, 0); setPlaying(true); };
      };
      c.practice(body, P, L);
      status();
    }

    root.querySelector(".lctl").onclick = (e) => {
      const a = e.target.closest("button");
      if (!a) return;
      a.blur(); // иначе пробел нажмёт эту кнопку ещё раз вдобавок к «пауза/продолжить»
      const act = a.dataset.a;
      if (act === "play") { if (!started) go(ci, 0); setPlaying(!playing); }
      if (act === "prev") { go(ci, Math.max(0, li - (lineEnded || now() > 1.5 ? 0 : 1))); }
      if (act === "next") { if (li + 1 < lines().length) go(ci, li + 1); else if (ci + 1 < CH.length) go(ci + 1, 0); }
      if (act === "rate") {
        if (!hasAudio) { fakeAcc = now(); fakeStart = performance.now(); }
        rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
        audio.playbackRate = rate;
        a.textContent = String(rate).replace(".", ",") + "×";
      }
      if (act === "cc") { a.classList.toggle("on"); cap.classList.toggle("off"); }
    };
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === " ") { e.preventDefault(); if (!started) go(ci, 0); setPlaying(!playing); }
      if (e.key === "ArrowRight") root.querySelector('[data-a="next"]').click();
      if (e.key === "ArrowLeft") root.querySelector('[data-a="prev"]').click();
    };
    addEventListener("keydown", onKey);

    buildStage();
    fit();
    cap.textContent = "";
    practice();
    ui();
    startCover();
    loop();

    // для проверки: сцена в состоянии «после фразы l» главы c, без звука
    root.lessonPeek = (c, l) => {
      go(c, l);
      setPlaying(false);
      stageEl.classList.add("instant");
      lineEnded = true;
      fire(Infinity);
      stopLine();
      void stageEl.offsetWidth;
      stageEl.classList.remove("instant");
      return lines()[l].cap || lines()[l].say;
    };
    return {
      destroy() {
        alive = false;
        stopLine();
        cancelAnimationFrame(raf);
        ro.disconnect();
        removeEventListener("keydown", onKey);
        audio.removeAttribute("src");
      },
    };
  }

  window.LessonPlayer = { mount, L };
  window.LESSONS = window.LESSONS || {};
})();
