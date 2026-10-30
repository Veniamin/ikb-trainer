// Видеоурок «Шифры с нуля»: от номера буквы и остатка от деления до Виженера, решётки Кардано и XOR.
// Все шифртексты на сцене считаются кодом ниже; числа, которые произносит диктор, проверены (tools/voice_lesson.py --check).
(function () {
  "use strict";
  const A = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ", N = 33;
  const ix = (c) => A.indexOf(c);
  const mod = (a, n = N) => ((a % n) + n) % n;
  const shift = (s, k) => [...s].map((c) => (ix(c) < 0 ? c : A[mod(ix(c) + k)])).join("");
  const vig = (s, key, sign = 1) => [...s].map((c, i) => A[mod(ix(c) + sign * ix(key[i % key.length]))]).join("");
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  function shuffle(a, r = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function lcg(seed) { return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648; }
  const count = (s) => { const m = {}; for (const c of s) if (ix(c) >= 0) m[c] = (m[c] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1] || ix(a[0]) - ix(b[0])); };
  const place = (e, x, y, w) => { e.style.left = x + "px"; e.style.top = y + "px"; if (w) e.style.width = w + "px"; return e; };
  const code = (s) => `<code>${s}</code>`;

  const WORDS = ["ПАРОЛЬ", "СЕРВЕР", "ЛОГИН", "ВИРУС", "ХАКЕР", "КЛЮЧ", "ШИФР", "СЕКРЕТ", "СИГНАЛ", "ПРОГРАММА", "КОМПЬЮТЕР",
    "ОЛИМПИАДА", "МОДУЛЬ", "АЛФАВИТ", "ЗАЩИТА", "ДОСТУП", "ФАЙЛ", "ПРИВЕТ", "ИНФОРМАТИКА", "ЗАДАЧА", "СООБЩЕНИЕ", "ЯЩИК", "ЮПИТЕР", "ЭКРАН"];
  const LONG = ["ИНФОРМАТИКА", "ОЛИМПИАДА", "БЕЗОПАСНОСТЬ", "ПРОГРАММА", "КОМПЬЮТЕР", "ШИФРОВАНИЕ", "СООБЩЕНИЕ", "КРИПТОГРАФИЯ", "МАТЕМАТИКА", "ПОБЕДИТЕЛЬ"];
  const KEYS = ["КОД", "ЛИС", "МИР", "ЗИМА", "ЛУНА", "САД", "КОТ", "ШАР", "ЛЕС", "ДОМ", "ГРОМ"];
  const PHRASES = ["ЖДИМЕНЯВПОЛНОЧЬ", "ВСТРЕЧАЕМСЯВПЯТЬ", "ПАРОЛЬСПРЯТАНТУТ", "КЛЮЧИЛЕЖАТВСЕЙФЕ", "ЖДУТЕБЯВОВТОРНИК",
    "ЗАВТРАКОНТРОЛЬНАЯ", "СЕРВЕРУПАЛНОЧЬЮ", "ИДИКСТАРОМУДУБУ", "ШИФРНЕСЛОЖНЫЙ", "ВСЁПОЛУЧИЛОСЬ"];
  const PH16 = PHRASES.filter((p) => p.length === 16);
  // частоты русских букв, % (ё отдельно почти не встречается)
  const FREQ = { О: 10.97, Е: 8.45, А: 8.01, И: 7.35, Н: 6.7, Т: 6.26, С: 5.47, Р: 4.73, В: 4.54, Л: 4.4, К: 3.49, М: 3.21, Д: 2.98,
    П: 2.81, У: 2.62, Я: 2.01, Ы: 1.9, Ь: 1.74, Г: 1.7, З: 1.65, Б: 1.59, Ч: 1.44, Й: 1.21, Х: 0.97, Ж: 0.94, Ш: 0.73, Ю: 0.64,
    Ц: 0.48, Щ: 0.36, Э: 0.32, Ф: 0.26, Ъ: 0.04, Ё: 0.04 };
  const STORY = "ЖИЛ НА СВЕТЕ ОДИН ОЧЕНЬ ОСТОРОЖНЫЙ ПРОГРАММИСТ ОН НИКОМУ НЕ ДОВЕРЯЛ СВОИ ПАРОЛИ И ПОЭТОМУ ЗАПИСЫВАЛ ИХ ТОЛЬКО " +
    "В ЗАШИФРОВАННОМ ВИДЕ ОДНАЖДЫ ОН ЗАБЫЛ КЛЮЧ И ДОЛГО НЕ МОГ ПРОЧИТАТЬ СОБСТВЕННЫЕ ЗАПИСИ ПОМОГ ЕМУ ЧАСТОТНЫЙ АНАЛИЗ " +
    "ВЕДЬ ОН ПОМНИЛ ЧТО САМАЯ ЧАСТАЯ БУКВА РУССКОГО ЯЗЫКА ЭТО БУКВА О";
  const LETTERS = [
    ["ПРИВЕТ ДРУГ НАКОНЕЦ Я ПРИДУМАЛ НОВЫЙ ПАРОЛЬ ДЛЯ НАШЕГО СЕРВЕРА ОН ОЧЕНЬ ПРОСТОЙ НО НИКТО НЕ ДОГАДАЕТСЯ ПАРОЛЬ ЭТО СЛОВО " +
      "ПОДСОЛНУХ ЗАПОМНИ ЕГО И НИКОМУ НЕ ГОВОРИ А ЭТО ПИСЬМО СРАЗУ УДАЛИ ПОТОМУ ЧТО ДАЖЕ ЗАШИФРОВАННЫЕ ПИСЬМА МОЖНО ПРОЧИТАТЬ " +
      "ЕСЛИ ЗНАТЬ ЧАСТОТНЫЙ АНАЛИЗ", "ПОДСОЛНУХ"],
    ["ВНИМАНИЕ ВСЕМ СОТРУДНИКАМ ОТДЕЛА С ЗАВТРАШНЕГО ДНЯ МЕНЯЕТСЯ ПАРОЛЬ ОТ ДВЕРИ В СЕРВЕРНУЮ НОВЫЙ ПАРОЛЬ ЭТО СЛОВО " +
      "КОЛОКОЛЬЧИК ЗАПОМНИТЕ ЕГО И НЕ ЗАПИСЫВАЙТЕ НА БУМАЖКАХ НЕ ГОВОРИТЕ ЕГО ПО ТЕЛЕФОНУ ДАЖЕ ЕСЛИ ЗВОНЯТ И ПРЕДСТАВЛЯЮТСЯ " +
      "НАЧАЛЬНИКОМ ОТДЕЛА", "КОЛОКОЛЬЧИК"],
  ];
  // таблица простой замены для сцены: А→Щ, Б→Е, В→К, остальное перемешано
  const SUB = (() => { const rest = shuffle([...A].filter((c) => !"ЩЕК".includes(c)), lcg(7)); return "ЩЕК" + rest.join(""); })();
  const subst = (s, key) => [...s].map((c) => (ix(c) < 0 ? c : key[ix(c)])).join("");

  // решётка Кардано: окошки (строка, столбец) → таблица и порядок клеток для каждого из 4 положений
  const rot = (h, n) => h.map(([r, c]) => [c, n - 1 - r]);
  const sortRC = (h) => h.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  function grille(n, holes, msg) {
    const g = Array.from({ length: n }, () => Array(n).fill("·")), order = [];
    let h = holes, k = 0;
    for (let t = 0; t < 4; t++) {
      const pos = sortRC(h);
      for (const [r, c] of pos) g[r][c] = msg[k++] || "-";
      order.push(pos);
      h = rot(h, n);
    }
    return { g, order };
  }
  function randomHoles(n) { // по одной клетке из каждой «орбиты» поворота
    const holes = [];
    for (let r = 0; r < n / 2; r++) for (let c = 0; c < n / 2; c++) {
      let p = [r, c];
      for (let t = rnd(4); t > 0; t--) p = rot([p], n)[0];
      holes.push(p);
    }
    return holes;
  }
  const columnsRead = (t, cols) => { let o = ""; for (let c = 0; c < cols; c++) for (let r = 0; r * cols + c < t.length; r++) o += t[r * cols + c]; return o; };

  // ───────────── общие куски сцены ─────────────
  function codeBox(L, box, src, x, y) {
    const e = L.el("pre", "l-code abs hid", L.esc(src), box);
    const w = Math.min(930, Math.max(...src.split("\n").map((l) => l.length)) * 11.45 + 44);
    if (w >= 930) e.style.fontSize = "17px";
    return place(e, Math.round((960 - w) / 2), y, w);
  }
  function caption(L, box, html, x, y, w, cls) { return place(L.el("div", "l-note abs" + (cls ? " " + cls : ""), html, box), x, y, w); }
  function bars(L, parent, data, max, h) {
    const wrap = L.el("div", "l-bars", null, parent);
    const out = {};
    for (const [ch, v] of data) {
      const b = L.el("div", "l-bar", `<i style="height:${Math.max(2, (h * v) / max).toFixed(1)}px"></i><b>${ch}</b>`, wrap);
      out[ch] = b;
    }
    return { el: wrap, bar: out };
  }
  const aStrip = (L, box, x, y, k) => { // окно с алфавитом, сдвинутым на k (полоса из трёх алфавитов)
    const win = place(L.el("div", "l-win abs", null, box), x, y);
    const inner = L.el("div", "l-strip", null, win);
    const ts = [...(A + A + A)].map((c) => L.tile(c, null, "mini", inner));
    const set = (kk) => { inner.style.transform = `translateX(${-(N + kk) * 27}px)`; };
    set(k);
    return { win, inner, ts, set, at: (i, kk) => ts[N + i + kk] };
  };

  // ───────────── главы ─────────────
  const PLAIN = "ВСТРЕЧА В ПЯТЬ", CIPH = shift(PLAIN, 3);
  const ch1 = {
    id: "intro", title: "Что такое шифр",
    stage(box, L) {
      const { el } = L, s = {};
      s.title = place(el("div", "l-title abs", "Шифры с нуля<small>классические шифры для олимпиады ИКБ</small>", box), 0, 170, 960);
      s.alice = place(el("div", "l-person abs hid", "<span>👧</span>Алиса", box), 60, 40);
      s.bob = place(el("div", "l-person abs hid", "<span>👦</span>Боб", box), 790, 40);
      s.eve = place(el("div", "l-person abs hid", "<span>🕵️</span>Ева", box), 420, 170);
      s.kA = place(el("div", "l-badge abs hid", "🔑", box), 150, 40);
      s.kB = place(el("div", "l-badge abs hid", "🔑", box), 880, 40);
      s.q = place(el("div", "l-badge abs hid", "❓", box), 510, 170);
      s.msg = place(el("div", "l-msg abs hid", [...PLAIN].map((c) => `<span>${c}</span>`).join(""), box), 190, 70);
      s.ch = [...s.msg.children];
      s.pair = place(el("div", "l-pair abs hid", `<div><span>открытый текст</span><b>${PLAIN}</b></div><div><span>шифртекст</span><b>${CIPH}</b></div>`, box), 180, 340, 600);
      s.rule = place(el("div", "l-cards abs hid", `<div><b>Шифр</b>правило: как превращать текст<small>его может знать кто угодно</small></div><div><b>Ключ</b>секретная настройка правила<small>знают только Алиса и Боб</small></div>`, box), 80, 330, 800);
      s.kinds = place(el("div", "l-cards abs hid", `<div><b>Замена</b><span class="l-ex">КОТ → ЛПУ</span><small>каждая буква меняется на другую</small></div><div><b>Перестановка</b><span class="l-ex">КОТ → ТОК</span><small>буквы те же, порядок другой</small></div>`, box), 80, 330, 800);
      s.msgAt = (x) => { s.msg.style.left = x + "px"; };
      return s;
    },
    lines: [
      ["Привет! Это урок про классические шифры. Разберёмся с нуля: от самой простой идеи до задач, которые дают на олимпиаде."],
      ["Представь: Алиса хочет передать Бобу записку. Но по дороге записку может прочитать кто-то третий — назовём её Ева.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.title); L.show(s.alice, s.bob, s.msg);
        T.frac(0.55, () => { L.show(s.eve); s.msgAt(335); });
      }],
      ["Поэтому Алиса не отправляет записку как есть, а сначала превращает её в бессмыслицу. Это называется зашифровать.", (s, T, L = LessonPlayer.L) => {
        s.msgAt(190); L.mark("enc", true, s.msg);
        T.spread(PLAIN.length, (i) => { s.ch[i].textContent = CIPH[i]; s.ch[i].classList.add("flip"); }, 0.45, 0.85);
      }],
      ["Исходную записку называют открытым текстом, а то, что получилось, — шифртекстом.", (s, T, L = LessonPlayer.L) => { L.show(s.pair); }],
      ["Чтобы прочитать записку, Боб должен знать секрет — ключ. У Алисы и Боба ключ есть, а у Евы нет.", (s, T, L = LessonPlayer.L) => {
        L.show(s.kA, s.kB); T.frac(0.45, () => L.show(s.q));
        T.frac(0.6, () => s.msgAt(480));
        T.spread(PLAIN.length, (i) => { s.ch[i].textContent = PLAIN[i]; s.ch[i].classList.remove("flip"); }, 0.72, 0.98);
        T.frac(0.98, () => L.mark("enc", false, s.msg));
      }],
      ["Шифр — это правило, как превращать текст. А ключ — секретная настройка этого правила. Правило может знать кто угодно, а ключ — только Алиса и Боб.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.pair); L.show(s.rule);
        T.frac(0.45, () => s.rule.children[1].classList.add("on"));
      }],
      ["Классические шифры бывают двух видов. Шифры замены меняют каждую букву на другую. А шифры перестановки оставляют те же буквы, но перемешивают их порядок.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.rule); L.show(s.kinds);
        T.frac(0.3, () => s.kinds.children[0].classList.add("on"));
        T.frac(0.62, () => { s.kinds.children[0].classList.remove("on"); s.kinds.children[1].classList.add("on"); });
      }],
      ["На олимпиаде ты почти всегда в роли Евы: шифртекст есть, а ключа нет. Нужно понять, как устроен шифр, и взломать его. Поехали!", (s, T, L = LessonPlayer.L) => {
        s.kinds.children[1].classList.remove("on"); L.mark("star", true, s.eve);
      }],
    ],
    practice(el, P) {
      const kind = () => {
        const w = pick(WORDS.filter((x) => x.length <= 7)), sub = Math.random() < 0.5;
        let c;
        if (sub) c = shift(w, 1 + rnd(10));
        else do c = shuffle([...w]).join(""); while (c === w);
        return {
          q: `Открытый текст ${code(w)}, шифртекст ${code(c)}. Какой это вид шифра?`, choices: ["замена", "перестановка"], a: sub ? "замена" : "перестановка",
          sol: sub ? "Буквы шифртекста другие — это замена." : "В шифртексте те же самые буквы, только в другом порядке — это перестановка.",
        };
      };
      P.task(el, { title: "1", make: kind });
      P.task(el, { title: "2", make: kind });
      P.task(el, { title: "3", make: () => ({ q: "Что Алиса и Боб должны держать в секрете от Евы?", choices: ["правило шифра", "ключ"], a: "ключ", sol: "Ключ. Правило шифра (например, «сдвиг по алфавиту») может знать кто угодно — без ключа оно не поможет." }) });
    },
  };

  const ch2 = {
    id: "alpha", title: "Буквы — это числа",
    stage(box, L) {
      const { el } = L, s = {};
      s.intro = place(el("div", "l-title abs", "Буква → число<small>А = 0, Б = 1, В = 2, …</small>", box), 0, 190, 960);
      const g = place(el("div", "l-alpha abs", null, box), 48, 20, 864);
      s.t = [...A].map((c, i) => L.tile(c, i, "hid", g));
      s.word = place(el("div", "l-word abs hid", null, box), 220, 300, 520);
      s.wt = L.tiles(s.word, "КОТ", (c) => ix(c), "big").t;
      el("div", "l-note", "К = 11, О = 15, Т = 19", s.word);
      s.traps = place(el("div", "l-cards abs hid", `<div><b>Ё есть или нет?</b>33 буквы (с Ё) или 32 (без Ё)</div><div><b>С 0 или с 1?</b>А = 0 или А = 1</div>`, box), 120, 300, 720);
      s.code = codeBox(L, box, "A = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'\nA.index('К')    # 11 — номер буквы\nA[11]           # 'К' — буква по номеру\nlen(A)          # 33", 170, 300, 620);
      return s;
    },
    lines: [
      ["Компьютер не умеет работать с буквами напрямую — только с числами. И шифры тоже удобнее всего объяснять через числа."],
      ["Выпишем русский алфавит и пронумеруем буквы по порядку, начиная с нуля: А — ноль, Б — один, В — два, и так далее.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.intro);
        T.spread(3, (i) => { L.show(s.t[i]); L.mark("on", true, s.t[i]); }, 0.3, 0.6);
        T.spread(30, (i) => L.show(s.t[i + 3]), 0.7, 0.95);
        T.frac(0.97, () => L.mark("on", false, s.t));
      }],
      ["Буква Ё стоит сразу после Е и получает номер шесть. Всего букв тридцать три, поэтому последняя буква, Я, получает номер тридцать два.", (s, T, L = LessonPlayer.L) => {
        T.frac(0.1, () => L.mark("on", true, s.t[6]));
        T.frac(0.62, () => { L.mark("on", false, s.t[6]); L.mark("on", true, s.t[32]); });
      }],
      { say: "Теперь любое слово можно записать числами. Слово КОТ: К — одиннадцать, О — пятнадцать, Т — девятнадцать.", cap: "Слово КОТ: К — 11, О — 15, Т — 19.", do: (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, s.t); L.show(s.word);
        T.spread(3, (i) => { L.mark("on", false, s.t); L.mark("on", true, s.t[ix("КОТ"[i])], s.wt[i]); }, 0.35, 0.8);
      } },
      ["Осторожно, ловушка! Условия задач бывают разными: иногда букву Ё выбрасывают, и тогда букв тридцать две. А иногда буквы нумеруют не с нуля, а с единицы.", (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, s.t, s.wt); L.hide(s.word); L.show(s.traps);
        T.frac(0.2, () => { L.mark("bad", true, s.t[6]); s.traps.children[0].classList.add("on"); });
        T.frac(0.7, () => { s.traps.children[0].classList.remove("on"); s.traps.children[1].classList.add("on"); });
      }],
      ["Поэтому первым делом смотри в условие: какой алфавит и с какого числа начинается нумерация. Обычно там есть пример — сверься с ним.", (s, T, L = LessonPlayer.L) => {
        L.mark("bad", false, s.t); L.mark("on", true, ...s.traps.children);
      }],
      { say: "В Питоне номер буквы даёт метод index, а букву по номеру — квадратные скобки.", cap: "В Python номер буквы даёт метод index, а букву по номеру — квадратные скобки.", do: (s, T, L = LessonPlayer.L) => {
        L.hide(s.traps); L.show(s.code);
      } },
    ],
    practice(el, P, L) {
      const w = L.el("div", "lwidget", `<p class="muted">Справочник: алфавит из 33 букв (с Ё). Переключатель показывает ловушку с нумерацией.</p>
        <label class="lsw"><input type="checkbox"> считать с 1</label><div class="lalpha"></div>`, el);
      const draw = (from) => { w.querySelector(".lalpha").innerHTML = [...A].map((c, i) => `<span><b>${c}</b><i>${i + from}</i></span>`).join(""); };
      w.querySelector("input").onchange = (e) => draw(e.target.checked ? 1 : 0);
      draw(0);
      P.task(el, { title: "1", make: () => { const c = pick([...A]); return { q: `Какой номер у буквы ${code(c)} (А = 0, алфавит с Ё)?`, a: String(ix(c)), sol: `Считаем от А = 0: ${code(c)} = ${ix(c)}. В Python: ${code(`A.index('${c}')`)}.` }; } });
      P.task(el, { title: "2", make: () => { const n = rnd(N); return { q: `Какая буква имеет номер ${n}?`, a: A[n], sol: `${code(`A[${n}]`)} = ${A[n]}.` }; } });
      P.task(el, { title: "3", ph: "числа через пробел", make: () => { const wd = pick(WORDS.filter((x) => x.length <= 5)); const nums = [...wd].map(ix).join(" "); return { q: `Запиши слово ${code(wd)} числами через пробел (А = 0).`, a: nums, sol: `${[...wd].map((c) => `${c} = ${ix(c)}`).join(", ")} → ${code(nums)}` }; } });
    },
  };

  const CLK = { cx: 250, cy: 270 };
  const ch3 = {
    id: "mod", title: "Счёт по кругу: остаток от деления",
    stage(box, L) {
      const { el } = L, s = {};
      s.clock = place(el("div", "l-clock abs", null, box), CLK.cx - 180, CLK.cy - 180);
      for (let h = 1; h <= 12; h++) {
        const a = (h * Math.PI) / 6;
        place(el("span", "", String(h), s.clock), 180 + 140 * Math.sin(a) - 20, 180 - 140 * Math.cos(a) - 20);
      }
      s.hand = el("div", "l-hand", null, s.clock);
      s.ang = 300;
      s.setAng = (a) => { s.ang = a; s.hand.style.transform = `rotate(${a}deg)`; };
      s.setAng(300);
      s.f = place(el("div", "l-flist abs", null, box), 500, 70, 440);
      s.fl = [
        "10 + 5 = 15 → на часах <b>3</b>",
        "15 mod 12 = <b>3</b> <small>(15 = 1·12 + 3)</small>",
        "Python: <code>15 % 12</code> → <b>3</b>",
        "2 − 5 = −3 → на часах <b>9</b>",
        "Python: <code>-3 % 12</code> → <b>9</b> <small>(остаток от 0 до 11)</small>",
        "C++: <code>-3 % 12</code> → <b>−3</b>!<small>поэтому пишут (x % 12 + 12) % 12</small>",
      ].map((h) => el("div", "hid", h, s.f));
      s.ring = el("div", "abs hid", null, box);
      place(s.ring, 0, 0);
      s.rt = [...A].map((c, i) => {
        const a = (2 * Math.PI * i) / N;
        return place(L.tile(c, null, "r", s.ring), CLK.cx + 215 * Math.sin(a) - 18, CLK.cy - 215 * Math.cos(a) - 20);
      });
      s.f2 = place(el("div", "l-flist abs hid", null, box), 520, 90, 430);
      s.f2l = ["Ю → Я → А → Б", "Ю = 31;  31 + 3 = 34", "34 mod 33 = 1 → <b>Б</b>", '<div class="l-big">новая = (старая + шаг) mod 33</div>'].map((h) => el("div", "hid", h, s.f2));
      return s;
    },
    lines: [
      ["Прежде чем шифровать, разберёмся с одной важной идеей — счётом по кругу. Посмотри на часы."],
      ["Сейчас десять часов. Который час будет через пять часов? Не пятнадцать, а три: стрелка прошла двенадцать и пошла по новому кругу.", (s, T, L = LessonPlayer.L) => {
        T.spread(5, () => s.setAng(s.ang + 30), 0.35, 0.65);
        T.frac(0.7, () => L.show(s.fl[0]));
      }],
      { say: "Это и есть остаток от деления: пятнадцать делим на двенадцать — получается один, и три в остатке. Записывают так: пятнадцать по модулю двенадцать равно трём.", cap: "Это и есть остаток от деления: 15 делим на 12 — получается 1, и 3 в остатке. Записывают так: 15 mod 12 = 3 («15 по модулю 12»).", do: (s, T, L = LessonPlayer.L) => { T.frac(0.55, () => L.show(s.fl[1])); } },
      { say: "В Питоне остаток считает знак процента: пятнадцать процент двенадцать даёт три.", cap: "В Python остаток считает знак процента: 15 % 12 даёт 3.", do: (s, T, L = LessonPlayer.L) => L.show(s.fl[2]) },
      { say: "А если идти назад? Сейчас два часа, а нужно узнать, сколько было пять часов назад. Два минус пять — минус три, но на часах будет девять.", cap: "А если идти назад? Сейчас 2 часа, а нужно узнать, сколько было 5 часов назад. 2 − 5 = −3, но на часах будет 9.", do: (s, T, L = LessonPlayer.L) => {
        s.setAng(s.ang - 30);
        T.spread(5, () => s.setAng(s.ang - 30), 0.4, 0.75);
        T.frac(0.8, () => L.show(s.fl[3]));
      } },
      { say: "Питон и тут считает правильно: минус три процент двенадцать даёт девять. Остаток в Питоне всегда от нуля до одиннадцати.", cap: "Python и тут считает правильно: -3 % 12 даёт 9. Остаток в Python всегда от 0 до 11.", do: (s, T, L = LessonPlayer.L) => L.show(s.fl[4]) },
      { say: "Осторожно: в Си плюс плюс остаток от отрицательного числа получается отрицательным — там будет минус три. Помни об этом, если в задаче код на Си плюс плюс.", cap: "Осторожно: в C++ остаток от отрицательного числа получается отрицательным — там будет −3. Помни об этом, если в задаче код на C++.", do: (s, T, L = LessonPlayer.L) => L.show(s.fl[5]) },
      ["Теперь главное: алфавит — это тоже циферблат. Только делений на нём не двенадцать, а тридцать три.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.clock, s.f); L.show(s.ring, s.f2);
      }],
      ["За Я снова идёт А. Сделаем от буквы Ю три шага вперёд: Я, А, Б.", (s, T, L = LessonPlayer.L) => {
        T.frac(0.1, () => L.mark("on", true, s.rt[31]));
        T.spread(3, (i) => { L.mark("on", false, s.rt); L.mark("on", true, s.rt[(32 + i) % N]); }, 0.6, 0.92);
        T.frac(0.6, () => L.show(s.f2l[0]));
      }],
      { say: "Числами то же самое: Ю — тридцать один, плюс три — тридцать четыре. А тридцать четыре по модулю тридцать три — это один, буква Б.", cap: "Числами то же самое: Ю — 31, плюс 3 — 34. А 34 mod 33 = 1, это буква Б.", do: (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, s.rt); L.mark("on", true, s.rt[1]); L.show(s.f2l[1]); T.frac(0.55, () => L.show(s.f2l[2]));
      } },
      ["Запомни формулу: новая позиция равна старой плюс шаг, и всё это по модулю размера алфавита. На ней держатся почти все шифры замены.", (s, T, L = LessonPlayer.L) => L.show(s.f2l[3])],
    ],
    practice(el, P, L) {
      const w = L.el("div", "lwidget", `<p class="muted">Калькулятор шагов по кругу:</p>
        <div class="lrowf">от буквы <select>${[...A].map((c) => `<option>${c}</option>`).join("")}</select> сделать <input type="number" value="3" style="width:70px"> шагов → <b class="lres"></b></div>`, el);
      const sel = w.querySelector("select"), num = w.querySelector("input"), res = w.querySelector(".lres");
      sel.value = "Ю";
      const upd = () => { const k = parseInt(num.value, 10) || 0, i = ix(sel.value); res.innerHTML = `(${i} + ${k}) mod 33 = ${mod(i + k)} → <span class="good">${A[mod(i + k)]}</span>`; };
      sel.onchange = num.oninput = upd;
      upd();
      P.task(el, { title: "1", make: () => { const h = 1 + rnd(12), d = 3 + rnd(18), r = ((h + d - 1) % 12) + 1; return { q: `На часах ${h}:00. Который час будет через ${d} ч? (ответ — число от 1 до 12)`, a: String(r), hint: "Прибавь и вычти 12, сколько нужно раз.", sol: `${h} + ${d} = ${h + d} → ${r}.` }; } });
      P.task(el, { title: "2", make: () => { const a = 20 + rnd(13), b = 5 + rnd(26); return { q: `Посчитай (${a} + ${b}) mod 33.`, a: String((a + b) % 33), hint: "Если сумма не меньше 33, вычти 33.", sol: `${a} + ${b} = ${a + b}; ${a + b} mod 33 = ${(a + b) % 33}.` }; } });
      P.task(el, { title: "3", make: () => { const k = 2 + rnd(10); return { q: `Что выведет Python: ${code(`print(-${k} % 33)`)}?`, a: String(33 - k), hint: "Остаток в Python всегда от 0 до 32. Сколько нужно прибавить к −" + k + ", чтобы попасть в этот диапазон?", sol: `−${k} + 33 = ${33 - k}.` }; } });
      P.task(el, { title: "4", make: () => { const c = pick([..."ШЩЪЫЬЭЮЯ"]), k = 3 + rnd(8); return { q: `Какая буква стоит на ${k} шагов после ${code(c)} (по кругу, алфавит из 33 букв)?`, a: A[mod(ix(c) + k)], hint: "Воспользуйся калькулятором выше или формулой (номер + шаг) mod 33.", sol: `(${ix(c)} + ${k}) mod 33 = ${mod(ix(c) + k)} → ${A[mod(ix(c) + k)]}.` }; } });
    },
  };

  const BRUTE_P = "ОЛИМПИАДА", BRUTE_K = 12, BRUTE_C = shift(BRUTE_P, BRUTE_K);
  const ch4 = {
    id: "caesar", title: "Шифр Цезаря",
    stage(box, L) {
      const { el } = L, s = {};
      caption(L, box, "обычный алфавит", 34, 2, 300, "sm");
      s.top = place(el("div", "l-win abs", null, box), 34, 26);
      const ti = el("div", "l-strip", null, s.top);
      s.tt = [...A].map((c) => L.tile(c, null, "mini", ti));
      s.bot = aStrip(L, box, 34, 66, 0);
      s.botLbl = caption(L, box, "сдвинутый на ключ: <b>0</b>", 34, 106, 400, "sm");
      s.col = (i, on) => { L.mark("on", on, s.tt[i], s.bot.at(i, s.k)); };
      s.k = 0;
      s.setK = (k) => { s.k = k; s.bot.set(k); s.botLbl.innerHTML = `сдвинутый на ключ: <b>${k}</b>`; };
      s.word = place(el("div", "l-vgrid abs hid", null, box), 200, 170, 560);
      s.wp = L.tiles(s.word, "ШИФР", (c) => ix(c), "big").t;
      s.arrow = el("div", "l-arrow", "+3 ↓", s.word);
      s.wc = L.tiles(s.word, "????", () => "", "big").t;
      s.brute = place(el("div", "l-brute abs hid", null, box), 40, 150, 880);
      s.bh = el("div", "l-bhead", `шифртекст: <b>${BRUTE_C}</b> — пробуем все ключи`, s.brute);
      const bl = el("div", "l-blist", null, s.brute);
      s.bl = [];
      for (let k = 1; k < N; k++) s.bl.push(el("div", "hid", `<i>${k}</i> ${shift(BRUTE_C, -k)}`, bl));
      s.code = codeBox(L, box, "A = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'\n\ndef caesar(text, k):\n    return ''.join(A[(A.index(c) + k) % 33] if c in A else c\n                   for c in text)\n\nc = '" + BRUTE_C + "'\nfor k in range(33):\n    print(k, caesar(c, -k))   # ищем осмысленный текст", 150, 150, 660);
      return s;
    },
    lines: [
      ["Самый старый и простой шифр — шифр Цезаря. Говорят, им пользовался сам Юлий Цезарь, когда писал своим генералам."],
      ["Правило такое: каждую букву сдвигаем вперёд по алфавиту на одно и то же число шагов. Это число и есть ключ. У Цезаря ключ был равен трём.", (s, T) => {
        T.frac(0.75, () => s.setK(3));
      }],
      ["Под обычным алфавитом подпишем такой же, но сдвинутый на три. Теперь под А стоит Г, под Б — Д, под В — Е.", (s, T) => {
        T.spread(3, (i) => { for (let j = 0; j < 3; j++) s.col(j, j === i); }, 0.45, 0.85);
        T.frac(0.98, () => s.col(2, false));
      }],
      { say: "Зашифруем слово ШИФР. Ш — номер двадцать пять. Двадцать пять плюс три — двадцать восемь, это Ы.", cap: "Зашифруем слово ШИФР. Ш — номер 25. 25 + 3 = 28, это Ы.", do: (s, T, L = LessonPlayer.L) => {
        L.show(s.word);
        T.frac(0.35, () => { L.mark("on", true, s.wp[0]); s.col(ix("Ш"), true); });
        T.frac(0.8, () => { L.setTile(s.wc[0], "Ы", 28); L.mark("good", true, s.wc[0]); });
      } },
      { say: "И — девять, плюс три — двенадцать, это Л. Ф — двадцать один, плюс три — двадцать четыре, это Ч. Р — семнадцать, плюс три — двадцать, это У.", cap: "И: 9 + 3 = 12 → Л.   Ф: 21 + 3 = 24 → Ч.   Р: 17 + 3 = 20 → У.", do: (s, T, L = LessonPlayer.L) => {
        T.spread(3, (i) => {
          const p = "ИФР"[i];
          L.mark("on", false, s.wp, s.tt, s.bot.ts); L.mark("on", true, s.wp[i + 1]); s.col(ix(p), true);
          L.setTile(s.wc[i + 1], shift(p, 3), ix(p) + 3); L.mark("good", true, s.wc[i + 1]);
        }, 0.05, 0.75);
      } },
      { say: "Получился шифртекст: Ы, Л, Ч, У. А буквы в конце алфавита переходят через край: Я со сдвигом три становится В.", cap: "Получился шифртекст ЫЛЧУ. А буквы в конце алфавита переходят через край: Я (32) + 3 = 35, 35 mod 33 = 2 → В.", do: (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, s.wp, s.tt, s.bot.ts);
        T.frac(0.5, () => s.col(32, true));
      } },
      { say: "Расшифровка — то же самое, только в обратную сторону: каждую букву сдвигаем на три шага назад. Из Ы, Л, Ч, У снова получается ШИФР.", cap: "Расшифровка — то же самое, только в обратную сторону: каждую букву сдвигаем на 3 шага назад. Из ЫЛЧУ снова получается ШИФР.", do: (s, T, L = LessonPlayer.L) => {
        s.col(32, false);
        T.frac(0.3, () => { s.arrow.textContent = "−3 ↑"; L.mark("back", true, s.arrow); });
        T.spread(4, (i) => { L.mark("good", false, s.wc); L.mark("on", true, s.wp[i]); }, 0.6, 0.95);
      } },
      { say: "А теперь ты — Ева, и ключа не знаешь. Сколько вообще есть разных ключей? Всего тридцать три, причём ключ ноль ничего не меняет.", cap: "А теперь ты — Ева, и ключа не знаешь. Сколько всего разных ключей? 0, 1, 2, …, 32 — всего 33, причём ключ 0 ничего не меняет.", do: (s, T, L = LessonPlayer.L) => {
        L.hide(s.word); s.setK(0); L.show(s.brute);
      } },
      ["Значит, можно просто перепробовать все ключи по очереди. Это называется перебор, или брутфорс. Осмысленный текст получится только с одним ключом.", (s, T, L = LessonPlayer.L) => {
        T.spread(32, (i) => { L.show(s.bl[i]); s.setK(i + 1); }, 0.15, 0.9);
      }],
      { say: "Вот он: при ключе двенадцать получилось слово ОЛИМПИАДА.", cap: `Вот он: при ключе 12 получилось слово ${BRUTE_P}.`, do: (s, T, L = LessonPlayer.L) => {
        s.setK(BRUTE_K); L.mark("good", true, s.bl[BRUTE_K - 1]);
      } },
      { say: "В Питоне такой перебор — короткий цикл. Компьютер выведет все варианты за долю секунды, а ты глазами найдёшь нормальный текст.", cap: "В Python такой перебор — короткий цикл. Компьютер выведет все варианты за долю секунды, а ты глазами найдёшь нормальный текст.", do: (s, T, L = LessonPlayer.L) => {
        L.hide(s.brute); L.show(s.code);
      } },
      ["И последняя ловушка: в условии может быть написано, что сдвиг идёт влево или назад. Тогда при шифровании ключ вычитают. Если сомневаешься — перебор найдёт ответ в любом случае."],
    ],
    practice(el, P, L) {
      const w = L.el("div", "lwidget", `<p class="muted">Машинка Цезаря: двигай ключ и смотри, что получается.</p>
        <div class="lrowf"><input class="lin" value="ПРИВЕТ ОЛИМПИАДА"> ключ <input type="range" min="0" max="32" value="3"> <b class="lk">3</b>
        <label class="lsw"><input type="checkbox"> расшифровать (сдвиг назад)</label></div><div class="lout"></div>`, el);
      const [txt, rng, back] = w.querySelectorAll("input");
      const upd = () => { const k = +rng.value; w.querySelector(".lk").textContent = k; w.querySelector(".lout").textContent = shift(txt.value.toUpperCase(), back.checked ? -k : k); };
      txt.oninput = rng.oninput = back.onchange = upd;
      upd();
      P.task(el, { title: "1. Зашифруй", make: () => { const wd = pick(WORDS), k = 2 + rnd(25); return { q: `Зашифруй слово ${code(wd)} шифром Цезаря с ключом ${k} (сдвиг вперёд).`, a: shift(wd, k), hint: "Номер каждой буквы + ключ, по модулю 33. Можно проверить себя машинкой выше.", sol: [...wd].map((c) => `${c}: (${ix(c)} + ${k}) mod 33 = ${mod(ix(c) + k)} → ${A[mod(ix(c) + k)]}`).join("<br>") }; } });
      P.task(el, { title: "2. Расшифруй", make: () => { const wd = pick(WORDS), k = 2 + rnd(25), c = shift(wd, k); return { q: `Расшифруй ${code(c)}, если ключ ${k} (при шифровании сдвигали вперёд).`, a: wd, hint: "Расшифровка — сдвиг назад: (номер − ключ) mod 33.", sol: `Сдвигаем каждую букву на ${k} назад: ${code(wd)}.` }; } });
      P.task(el, { title: "3. Взломай", make: () => { const wd = pick(LONG), k = 3 + rnd(28), c = shift(wd, k); return { q: `Ева перехватила ${code(c)}. Ключ неизвестен. Что было написано?`, a: wd, hint: "Вставь шифртекст в машинку, включи «расшифровать» и двигай ключ, пока не появится слово.", sol: `Перебором: при ключе ${k} получается ${code(wd)}.` }; } });
      P.code(el, "A = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'\n\ndef caesar(text, k):          # k < 0 — сдвиг назад\n    return ''.join(A[(A.index(c) + k) % 33] if c in A else c\n                   for c in text.upper())\n\nprint(caesar('ШИФР', 3))     # ЫЛЧУ\nfor k in range(33):          # взлом перебором\n    print(k, caesar('" + BRUTE_C + "', -k))");
    },
  };

  const STORY_C = subst(STORY, SUB);
  const ch5 = {
    id: "freq", title: "Простая замена и частотный анализ",
    stage(box, L) {
      const { el } = L, s = {};
      s.intro = place(el("div", "l-title abs", "Простая замена<small>ключей слишком много, чтобы перебирать</small>", box), 0, 190, 960);
      s.sub = place(el("div", "abs hid", null, box), 34, 30, 900);
      el("div", "l-note sm", "открытый:", s.sub);
      s.subA = L.tiles(s.sub, A, null, "mini").t;
      el("div", "l-note sm", "заменяем на:", s.sub);
      s.subB = L.tiles(s.sub, SUB, null, "mini").t;
      s.fact = place(el("div", "l-note abs hid", "33! = 8 683 317 618 811 886 495 518 194 401 280 000 000<br><small>≈ 8,7 · 10<sup>36</sup> вариантов таблицы</small>", box), 60, 230, 840);
      const ref = Object.entries(FREQ).sort((a, b) => b[1] - a[1]);
      s.c1 = place(el("div", "abs hid", null, box), 34, 10, 900);
      el("div", "l-note sm", "частоты букв в русских текстах", s.c1);
      s.b1 = bars(L, s.c1, ref, 11, 120);
      const cnt = count(STORY_C);
      s.c2 = place(el("div", "abs hid", null, box), 34, 275, 900);
      el("div", "l-note sm", "частоты букв в шифртексте (сколько раз)", s.c2);
      s.b2 = bars(L, s.c2, cnt, cnt[0][1], 120);
      s.top1 = ref.slice(0, 3).map((x) => x[0]);
      s.top2 = cnt.slice(0, 3).map((x) => x[0]);
      s.cross = place(el("div", "abs hid", null, box), 120, 60, 720);
      el("div", "l-note", "Однобуквенные слова: <b>И, В, С, А, К, Я</b>", s.cross);
      s.cw = L.tiles(s.cross, "ПР?ВЕТ", null, "big").t;
      s.cz = place(el("div", "l-flist abs hid", "<div>самая частая буква шифра: <b>Щ</b> (26)</div><div>О = 15 → ключ = 26 − 15 = <b>11</b></div><div class=\"l-big\">ключ = (частая − О) mod 33</div>", box), 120, 330, 720);
      s.code = codeBox(L, box, "from collections import Counter\nc = open('cipher.txt', encoding='utf-8').read().upper()\nprint(Counter(ch for ch in c if ch in A).most_common(8))\n\n# догадки о замене: шифр → открытый\nguess = str.maketrans('ЩЕК', 'АБВ')\nprint(c.translate(guess))", 130, 120, 700);
      return s;
    },
    lines: [
      ["Перебор хорош, когда ключей мало. Но есть шифр, где ключей столько, что перебрать их невозможно, — простая замена."],
      ["В простой замене каждая буква заменяется на какую-то другую, но уже не сдвигом, а по произвольной таблице. Например, А становится Щ, Б — Е, В — К, и так далее.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.intro); L.show(s.sub);
        T.spread(3, (i) => { L.mark("on", false, s.subA, s.subB); L.mark("on", true, s.subA[i], s.subB[i]); }, 0.5, 0.8);
      }],
      ["Сколько таких таблиц? Тридцать три факториал — это число из тридцати семи цифр. Чтобы перебрать их все, не хватит и миллиарда лет.", (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, s.subA, s.subB); T.frac(0.3, () => L.show(s.fact));
      }],
      ["Но у языка есть слабое место: буквы встречаются с разной частотой. В русском тексте чаще всего попадается О — почти каждая десятая буква. Дальше идут Е, А, И, Н, Т.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.sub, s.fact); L.show(s.c1);
        T.frac(0.55, () => L.mark("on", true, s.b1.bar["О"]));
        T.spread(5, (i) => L.mark("on", true, s.b1.bar["ЕАИНТ"[i]]), 0.75, 0.95);
      }],
      ["Шифр замены меняет вид букв, но не их количество. Если в тексте больше всего букв О, то в шифртексте больше всего будет той буквы, в которую превратилась О.", (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, Object.values(s.b1.bar)); L.show(s.c2);
        T.frac(0.7, () => { L.mark("on", true, s.b1.bar["О"], s.b2.bar[s.top2[0]]); });
      }],
      ["План такой: считаем, сколько раз встречается каждая буква шифртекста, и сравниваем с таблицей частот. Самая частая — скорее всего О, следующие — Е, А или И.", (s, T, L = LessonPlayer.L) => {
        T.frac(0.6, () => L.mark("on", true, s.b1.bar[s.top1[1]], s.b2.bar[s.top2[1]], s.b1.bar[s.top1[2]], s.b2.bar[s.top2[2]]));
      }],
      ["Частоты дают только догадку, особенно если текст короткий. Дальше включаем голову и ищем короткие слова. Слова из одной буквы — это обычно И, В, С, А, К или Я.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.c1, s.c2); L.show(s.cross);
      }],
      { say: "Подставляем догадки — и в тексте проступают куски слов. Как в кроссворде: П, Р, пропуск, В, Е, Т — легко дочитать до слова ПРИВЕТ. Каждая угаданная буква помогает угадать следующие.", cap: "Подставляем догадки — и в тексте проступают куски слов. Как в кроссворде: ПР_ВЕТ легко дочитать до слова ПРИВЕТ. Каждая угаданная буква помогает угадать следующие.", do: (s, T, L = LessonPlayer.L) => {
        L.mark("bad", true, s.cw[2]);
        T.frac(0.6, () => { L.setTile(s.cw[2], "И"); L.mark("bad", false, s.cw[2]); L.mark("good", true, s.cw[2]); });
      } },
      { say: "А для шифра Цезаря частотный анализ работает ещё проще: найди самую частую букву шифртекста — разница между ней и буквой О и есть ключ.", cap: "А для шифра Цезаря частотный анализ работает ещё проще: найди самую частую букву шифртекста — разница между ней и буквой О и есть ключ.", do: (s, T, L = LessonPlayer.L) => { L.show(s.cz); } },
      { say: "В Питоне частоты считает Counter из модуля collections, а метод most_common показывает самые частые буквы.", cap: "В Python частоты считает Counter из модуля collections, а метод most_common показывает самые частые буквы.", do: (s, T, L = LessonPlayer.L) => { L.hide(s.cross, s.cz); L.show(s.code); } },
    ],
    practice(el, P, L) {
      P.task(el, { title: "1. Цезарь по частотам", make: () => {
        const k = 3 + rnd(28), c = shift(STORY, k);
        return {
          q: `Текст зашифрован шифром Цезаря с неизвестным ключом. Найди ключ (число от 1 до 32).<div class="ltext">${c}</div><button class="btn ghost small" data-cnt>Посчитать частоты</button><div class="lfq"></div>`,
          a: String(k), hint: "Самая частая буква шифра — это, скорее всего, О (номер 15). Ключ = (номер частой буквы − 15) mod 33.",
          sol: `Самая частая буква — ${count(c)[0][0]} (${ix(count(c)[0][0])}). (${ix(count(c)[0][0])} − 15) mod 33 = ${k}.`,
          mount: (q) => { q.querySelector("[data-cnt]").onclick = () => { q.querySelector(".lfq").innerHTML = count(c).slice(0, 6).map(([ch, n]) => `<b>${ch}</b> — ${n} раз`).join(", "); }; },
        };
      } });
      P.task(el, { title: "2. Взломай замену", ph: "пароль", make: () => {
        const [plain, pass] = pick(LETTERS), key = shuffle([...A]).join(""), c = subst(plain, key), cnt = count(c), map = {};
        return {
          q: `Перехвачено письмо, зашифрованное простой заменой. Подставляй догадки в клетки под буквами шифра — текст будет проявляться. Какой пароль в письме?
            <p class="muted">Частоты русских букв: О, Е, А, И, Н, Т, С, Р, В, Л… Ищи однобуквенные слова и слово «ПАРОЛЬ».</p>
            <div class="lsub"></div><div class="lkeys"></div><button class="btn ghost small" data-hint1>Открыть одну букву</button>`,
          a: pass, hint: "Самая частая буква шифра — О. Однобуквенные слова — И, В, С, А, Я. В тексте есть слово ПАРОЛЬ, и после него — пароль.",
          sol: `Открытый текст: <div class="ltext">${plain}</div>Пароль: <b>${pass}</b>.`,
          mount: (q) => {
            const sub = q.querySelector(".lsub"), keys = q.querySelector(".lkeys");
            const draw = () => { sub.innerHTML = [...c].map((ch) => (ix(ch) < 0 ? ch : map[ch] ? `<b>${map[ch]}</b>` : `<i>${ch.toLowerCase()}</i>`)).join(""); };
            keys.innerHTML = cnt.map(([ch, n]) => `<label><b>${ch}</b><small>${n}</small><input maxlength="1" data-k="${ch}"></label>`).join("");
            keys.querySelectorAll("input").forEach((inp) => (inp.oninput = () => { const v = inp.value.toUpperCase(); if (ix(v) >= 0) map[inp.dataset.k] = v; else delete map[inp.dataset.k]; inp.value = map[inp.dataset.k] || ""; draw(); }));
            q.querySelector("[data-hint1]").onclick = () => {
              const left = cnt.find(([ch]) => map[ch] !== A[key.indexOf(ch)]);
              if (!left) return;
              map[left[0]] = A[key.indexOf(left[0])];
              keys.querySelector(`[data-k="${left[0]}"]`).value = map[left[0]];
              draw();
            };
            draw();
          },
        };
      } });
      P.code(el, "from collections import Counter\nA = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'\nc = open('letter.txt', encoding='utf-8').read().upper()\nprint(Counter(ch for ch in c if ch in A).most_common(10))\n\n# подставляем догадки (шифр → открытый), неизвестные буквы — строчными\nguess = {'Ж': 'О', 'Э': 'Е'}\nprint(''.join(guess.get(ch, ch.lower()) for ch in c))");
    },
  };

  const VP = "ВСТРЕЧА", VK = "КОД", VC = vig(VP, VK);
  const ch6 = {
    id: "vigenere", title: "Шифр Виженера",
    stage(box, L) {
      const { el } = L, s = {};
      s.title = place(el("div", "l-title abs", "Шифр Виженера<small>много Цезарей подряд</small>", box), 0, 60, 960);
      s.key = place(el("div", "abs hid", null, box), 330, 250, 300);
      s.kt = L.tiles(s.key, VK, (c) => ix(c), "big").t;
      s.g = place(el("div", "l-vt abs hid", null, box), 70, 20, 820);
      const row = (lbl) => { el("div", "l-vl", lbl, s.g); return [...Array(7)].map(() => L.tile("", "", "big hid", s.g)); };
      s.r1 = row("текст");
      s.r2 = row("ключ");
      s.r3 = []; el("div", "l-vl", "сумма", s.g); for (let i = 0; i < 7; i++) s.r3.push(el("div", "l-sum hid", "", s.g));
      s.r4 = row("шифр");
      s.labels = [...s.g.querySelectorAll(".l-vl")];
      s.fill = (r, str) => [...str].forEach((c, i) => L.setTile(r[i], c, ix(c)));
      s.fill(s.r1, VP); s.fill(s.r2, VK.repeat(3).slice(0, 7)); s.fill(s.r4, VC);
      s.r3.forEach((e, i) => { const a = ix(VP[i]), b = ix(VK[i % 3]); e.innerHTML = `${a}+${b}<br>= ${a + b}${a + b >= N ? ` → ${a + b - N}` : ""}`; });
      s.form = place(el("div", "l-flist abs hid", '<div class="l-big">c<sub>i</sub> = (p<sub>i</sub> + k<sub>i</sub>) mod 33</div><div>k<sub>i</sub> = key[i % len(key)] — ключ по кругу</div><div class="hid l-big">p<sub>i</sub> = (c<sub>i</sub> − k<sub>i</sub>) mod 33</div>', box), 120, 120, 720);
      s.poets = place(el("div", "l-keys abs hid", ["МАРШАК", "ТЮТЧЕВ", "ЕСЕНИН", "ПУШКИН", "ОГАРЁВ"].map((k) => `<span>${k}</span>`).join(""), box), 100, 170, 760);
      s.code = codeBox(L, box, "def vigenere(text, key, sign=1):    # sign=-1 — расшифровать\n    return ''.join(A[(A.index(c) + sign * A.index(key[i % len(key)])) % 33]\n                   for i, c in enumerate(text))\n\nprint(vigenere('" + VP + "', '" + VK + "'))       # " + VC + "\nprint(vigenere('" + VC + "', '" + VK + "', -1))   # " + VP, 60, 140, 840);
      return s;
    },
    lines: [
      ["Слабость Цезаря в том, что все буквы сдвигаются одинаково. Шифр Виженера хитрее: каждая буква сдвигается на своё число. Его придумали в шестнадцатом веке, и почти триста лет он считался невзламываемым."],
      { say: "Ключ здесь — не число, а слово. Возьмём ключ КОД. Каждая его буква задаёт свой сдвиг: К — одиннадцать, О — пятнадцать, Д — четыре.", cap: "Ключ здесь — не число, а слово. Возьмём ключ КОД. Каждая его буква задаёт свой сдвиг: К — 11, О — 15, Д — 4.", do: (s, T, L = LessonPlayer.L) => {
        L.show(s.key); T.spread(3, (i) => { L.mark("on", false, s.kt); L.mark("on", true, s.kt[i]); }, 0.55, 0.9);
      } },
      { say: "Зашифруем слово ВСТРЕЧА. Подпишем ключ под текстом и будем повторять его, пока не кончится текст: КОД, КОД, и ещё одна К.", cap: "Зашифруем слово ВСТРЕЧА. Подпишем ключ под текстом и будем повторять его, пока не кончится текст: КОД КОД К.", do: (s, T, L = LessonPlayer.L) => {
        L.hide(s.title, s.key); L.show(s.g, s.r1);
        T.spread(7, (i) => L.show(s.r2[i]), 0.45, 0.95);
      } },
      { say: "Каждую букву складываем с буквой ключа под ней — как в Цезаре, только ключ у каждой позиции свой. В — два, К — одиннадцать, вместе тринадцать, это М.", cap: "Каждую букву складываем с буквой ключа под ней — как в Цезаре, только ключ у каждой позиции свой. В (2) + К (11) = 13 → М.", do: (s, T, L = LessonPlayer.L) => {
        T.frac(0.55, () => { L.mark("on", true, s.r1[0], s.r2[0]); L.show(s.r3[0]); });
        T.frac(0.85, () => { L.show(s.r4[0]); L.mark("good", true, s.r4[0]); });
      } },
      { say: "С — восемнадцать, О — пятнадцать, вместе тридцать три. Тридцать три по модулю тридцать три — ноль, это А. Снова переход через край!", cap: "С (18) + О (15) = 33. 33 mod 33 = 0 → А. Снова переход через край!", do: (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, s.r1, s.r2);
        T.frac(0.1, () => { L.mark("on", true, s.r1[1], s.r2[1]); L.show(s.r3[1]); });
        T.frac(0.7, () => { L.show(s.r4[1]); L.mark("good", true, s.r4[1]); });
      } },
      { say: "Дальше так же: Т плюс Д даёт Ц, Р плюс К — Ы, Е плюс О — У, Ч плюс Д — снова Ы, А плюс К — К.", cap: "Дальше так же: Т + Д → Ц,  Р + К → Ы,  Е + О → У,  Ч + Д → Ы,  А + К → К.", do: (s, T, L = LessonPlayer.L) => {
        T.spread(5, (j) => { const i = j + 2; L.mark("on", false, s.r1, s.r2); L.mark("on", true, s.r1[i], s.r2[i]); L.show(s.r3[i], s.r4[i]); L.mark("good", true, s.r4[i]); }, 0.12, 0.88);
      } },
      { say: "Получился шифртекст: М, А, Ц, Ы, У, Ы, К. Заметь: разные буквы Р и Ч обе превратились в Ы. Поэтому простой частотный анализ против Виженера не работает.", cap: `Получился шифртекст ${VC}. Заметь: разные буквы Р и Ч обе превратились в Ы. Поэтому простой частотный анализ против Виженера не работает.`, do: (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, s.r1, s.r2);
        T.frac(0.4, () => { L.mark("bad", true, s.r1[3], s.r1[5], s.r4[3], s.r4[5]); });
      } },
      { say: "Формула такая: номер буквы шифра равен номеру буквы текста плюс номер буквы ключа, по модулю тридцать три. Ключ берётся по кругу: для буквы номер и — буква ключа номер и по модулю длины ключа.", cap: "Формула: номер буквы шифра = номер буквы текста + номер буквы ключа, по модулю 33. Ключ берётся по кругу: для i-й буквы — key[i % len(key)].", do: (s, T, L = LessonPlayer.L) => {
        L.mark("bad", false, s.r1, s.r4); L.hide(s.g); L.show(s.form);
      } },
      ["Расшифровка — вычитание: из буквы шифра вычитаем букву ключа, и тоже по модулю.", (s, T, L = LessonPlayer.L) => L.show(s.form.lastChild)],
      ["Как Виженера ломают на олимпиаде? Чаще всего в условии дают несколько возможных ключей. Расшифруй каждым и посмотри, где получился нормальный текст. Так было в задаче про поэтов: подошёл ключ ПУШКИН.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.form); L.show(s.poets);
        T.spread(5, (i) => { L.mark("on", false, ...s.poets.children); L.mark("on", true, s.poets.children[i]); }, 0.45, 0.8);
        T.frac(0.9, () => { L.mark("on", false, ...s.poets.children); L.mark("good", true, s.poets.children[3]); });
      }],
      ["Другой случай: известен кусочек открытого текста и шифр к нему. Тогда ключ находится вычитанием: буква шифра минус буква текста.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.poets); L.show(s.g); L.mark("good", false, s.r4);
        s.labels[0].textContent = "шифр"; s.labels[1].textContent = "текст"; s.labels[2].textContent = "разность"; s.labels[3].textContent = "ключ";
        s.fill(s.r1, VC); s.fill(s.r2, VP); s.fill(s.r4, VK.repeat(3).slice(0, 7));
        s.r3.forEach((e, i) => { const d = ix(VC[i]) - ix(VP[i]); e.innerHTML = `${ix(VC[i])}−${ix(VP[i])}${d < 0 ? "+33" : ""}<br>= ${mod(d)}`; });
        L.hide(s.r3, s.r4);
        T.spread(7, (i) => { L.show(s.r3[i], s.r4[i]); L.mark("good", true, s.r4[i]); }, 0.6, 0.97);
      }],
      { say: "Получился ключ, повторённый много раз: КОД, КОД, К. Найди, где он начинает повторяться, — это и есть ключ. Здесь это КОД.", cap: "Получился ключ, повторённый много раз: КОДКОДК. Найди, где он начинает повторяться, — это и есть ключ. Здесь это КОД.", do: (s, T, L = LessonPlayer.L) => {
        T.frac(0.55, () => { L.mark("good", false, s.r4); L.mark("on", true, s.r4.slice(0, 3)); });
      } },
      { say: "В Питоне шифр Виженера умещается в одну функцию: со знаком плюс она шифрует, а со знаком минус — расшифровывает.", cap: "В Python шифр Виженера умещается в одну функцию: со знаком + она шифрует, а со знаком − расшифровывает.", do: (s, T, L = LessonPlayer.L) => { L.hide(s.g); L.show(s.code); } },
    ],
    practice(el, P, L) {
      const w = L.el("div", "lwidget", `<p class="muted">Таблица Виженера: впиши текст и ключ.</p>
        <div class="lrowf">текст <input class="lin" value="ВСТРЕЧА"> ключ <input class="lin" value="КОД" style="width:110px">
        <label class="lsw"><input type="checkbox"> расшифровать</label></div><div class="scroll"><table class="lvtab"></table></div>`, el);
      const [t, k, back] = w.querySelectorAll("input");
      const upd = () => {
        const tx = [...t.value.toUpperCase()].filter((c) => ix(c) >= 0), ky = [...k.value.toUpperCase()].filter((c) => ix(c) >= 0);
        if (!ky.length) return;
        const sg = back.checked ? -1 : 1, rk = tx.map((_, i) => ky[i % ky.length]), out = tx.map((c, i) => A[mod(ix(c) + sg * ix(rk[i]))]);
        const tr = (lbl, a) => `<tr><th>${lbl}</th>${a.map((x) => `<td>${x}</td>`).join("")}</tr>`;
        w.querySelector(".lvtab").innerHTML = tr(back.checked ? "шифр" : "текст", tx.map((c) => `${c}<i>${ix(c)}</i>`)) + tr("ключ", rk.map((c) => `${c}<i>${ix(c)}</i>`)) + tr(back.checked ? "текст" : "шифр", out.map((c) => `<b>${c}</b><i>${ix(c)}</i>`));
      };
      t.oninput = k.oninput = back.onchange = upd;
      upd();
      P.task(el, { title: "1. Зашифруй", make: () => { const wd = pick(WORDS.filter((x) => x.length >= 5)), key = pick(KEYS); return { q: `Зашифруй ${code(wd)} шифром Виженера с ключом ${code(key)} (А = 0, 33 буквы).`, a: vig(wd, key), hint: "Подпиши ключ под словом, повторяя его, и сложи номера по модулю 33.", sol: [...wd].map((c, i) => `${c} + ${key[i % key.length]} = (${ix(c)} + ${ix(key[i % key.length])}) mod 33 = ${mod(ix(c) + ix(key[i % key.length]))} → ${vig(wd, key)[i]}`).join("<br>") }; } });
      P.task(el, { title: "2. Расшифруй", make: () => { const wd = pick(WORDS.filter((x) => x.length >= 5)), key = pick(KEYS), c = vig(wd, key); return { q: `Расшифруй ${code(c)}, ключ ${code(key)}.`, a: wd, hint: "Из номера буквы шифра вычти номер буквы ключа, по модулю 33.", sol: `Ответ: ${code(wd)}.` }; } });
      P.task(el, { title: "3. Найди ключ", make: () => { const wd = pick(LONG), key = pick(KEYS.filter((x) => x.length * 2 <= wd.length)), c = vig(wd, key); const diff = [...c].map((x, i) => A[mod(ix(x) - ix(wd[i]))]).join(""); return { q: `Известно, что слово ${code(wd)} после шифрования Виженером стало ${code(c)}. Какой ключ?`, a: key, hint: "Вычти из каждой буквы шифра букву текста. Получится ключ, повторённый несколько раз.", sol: `Разность: ${code(diff)} — повторяется ${code(key)}.` }; } });
      P.code(el, "A = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'\n\ndef vigenere(text, key, sign=1):\n    return ''.join(A[(A.index(c) + sign * A.index(key[i % len(key)])) % 33]\n                   for i, c in enumerate(text))\n\n# несколько ключей на выбор — пробуем все\nfor key in ['МАРШАК', 'ПУШКИН']:\n    print(key, vigenere(c, key, -1)[:40])\n# известен текст p и шифр c — ключ вычитанием\nprint(''.join(A[(A.index(x) - A.index(y)) % 33] for x, y in zip(c, p)))");
    },
  };

  const TP = "ЖДИМЕНЯВПОЛНОЧЬ", TC = columnsRead(TP, 5);
  const ch7 = {
    id: "transp", title: "Шифры перестановки",
    stage(box, L) {
      const { el } = L, s = {};
      s.src = place(el("div", "abs", null, box), 60, 20, 840);
      s.st = L.tiles(s.src, TP, null, "").t;
      s.grid = place(el("div", "l-tgrid abs hid", null, box), 300, 120, 360);
      s.gc = [...Array(15)].map(() => L.tile("", null, "", s.grid));
      s.lbl = place(el("div", "l-note abs hid", "пишем по строкам →", box), 690, 150, 240);
      s.lbl2 = place(el("div", "l-note abs hid", "читаем по столбцам ↓", box), 690, 210, 240);
      s.out = place(el("div", "abs hid", null, box), 60, 400, 840);
      s.ot = L.tiles(s.out, TC, null, "").t;
      L.hide(s.ot);
      s.blk = place(el("div", "l-blocks abs hid", `<div class="l-note">ключ: <b>3 1 4 2</b></div>`, box), 120, 140, 720);
      const b1 = el("div", "lrow", null, s.blk);
      s.bp = [..."ШИФРОВКА"].map((c, i) => L.tile(c, (i % 4) + 1, i === 4 ? "gapl" : "", b1));
      el("div", "l-arrow", "↓", s.blk);
      const b2 = el("div", "lrow", null, s.blk);
      s.bc = [..."ФШРИКОАВ"].map((c, i) => L.tile(c, null, "hid" + (i === 4 ? " gapl" : ""), b2));
      s.code = codeBox(L, box, "def columns(text, cols):    # пишем по строкам, читаем по столбцам\n    rows = [text[i:i + cols] for i in range(0, len(text), cols)]\n    return ''.join(r[c] for c in range(cols) for r in rows if c < len(r))\n\nc = columns('" + TP + "', 5)   # " + TC + "\nprint(columns(c, 3))            # расшифровка: столбцов = строк", 90, 120, 780);
      return s;
    },
    lines: [
      ["Теперь второй вид шифров — перестановка. Буквы остаются теми же, меняется только их порядок. Поэтому частоты букв в шифре такие же, как в обычном тексте, — это верный признак перестановки."],
      ["Простой пример — маршрутная перестановка. Берём таблицу из трёх строк и пяти столбцов и пишем текст по строкам: слева направо, сверху вниз.", (s, T, L = LessonPlayer.L) => {
        L.show(s.grid);
        T.frac(0.45, () => L.show(s.lbl));
        T.spread(15, (i) => { L.mark("on", false, s.st); L.mark("on", true, s.st[i]); L.setTile(s.gc[i], TP[i]); }, 0.5, 0.97);
      }],
      ["А читаем по-другому — по столбцам: сверху вниз, слева направо. Получается каша из тех же самых букв.", (s, T, L = LessonPlayer.L) => {
        L.mark("on", false, s.st); L.show(s.lbl2, s.out);
        T.spread(15, (j) => { const c = Math.floor(j / 3), r = j % 3; L.mark("on", false, s.gc); L.mark("on", true, s.gc[r * 5 + c]); L.show(s.ot[j]); }, 0.1, 0.8);
        T.frac(0.85, () => L.mark("on", false, s.gc));
      }],
      ["Ключ такого шифра — размер таблицы и маршрут: как писали и как читали. Чтобы расшифровать, делаем наоборот: пишем шифр по столбцам, а читаем по строкам."],
      { say: "Если размер таблицы неизвестен — перебирай. Число столбцов должно делить длину текста, так что вариантов совсем немного.", cap: "Если размер таблицы неизвестен — перебирай. Число столбцов должно делить длину текста (15 букв → 3 или 5 столбцов), так что вариантов совсем немного." },
      { say: "Бывает и перестановка по ключу. Текст режут на блоки, и в каждом блоке буквы переставляют по одной схеме. Ключ три, один, четыре, два значит: сначала берём третью букву блока, потом первую, потом четвёртую, потом вторую.", cap: "Бывает и перестановка по ключу. Текст режут на блоки, и в каждом блоке буквы переставляют по одной схеме. Ключ 3 1 4 2 значит: сначала берём третью букву блока, потом первую, потом четвёртую, потом вторую.", do: (s, T, L = LessonPlayer.L) => {
        L.hide(s.src, s.grid, s.lbl, s.lbl2, s.out); L.show(s.blk);
        const ord = [2, 0, 3, 1];
        T.spread(8, (j) => { const b = j < 4 ? 0 : 4; L.mark("on", false, s.bp); L.mark("on", true, s.bp[b + ord[j % 4]]); L.show(s.bc[j]); }, 0.45, 0.97);
      } },
      ["Расшифровка — обратная перестановка: первую букву блока шифра ставим на третье место, вторую — на первое, третью — на четвёртое, четвёртую — на второе.", (s, T, L = LessonPlayer.L) => { L.mark("on", false, s.bp); }],
      { say: "В Питоне перестановку по таблице удобно делать срезами строк. А расшифровка — это тот же шифр, где число столбцов равно числу строк исходной таблицы.", cap: "В Python перестановку по таблице удобно делать срезами строк. А расшифровка — это тот же шифр, где число столбцов равно числу строк исходной таблицы.", do: (s, T, L = LessonPlayer.L) => { L.hide(s.blk); L.show(s.code); } },
    ],
    practice(el, P, L) {
      const w = L.el("div", "lwidget", `<p class="muted">Таблица: впиши текст и число столбцов. Таблица заполняется по столбцам (так расшифровывают), читай её по строкам.</p>
        <div class="lrowf">текст <input class="lin" value="${TC}"> столбцов <input type="number" value="3" min="1" max="20" style="width:70px"></div><div class="ltab"></div>`, el);
      const [t, n] = w.querySelectorAll("input");
      const upd = () => {
        const tx = t.value.toUpperCase().replace(/\s/g, ""), cols = Math.max(1, +n.value || 1), rows = Math.ceil(tx.length / cols);
        const g = Array.from({ length: rows }, () => Array(cols).fill(""));
        let k = 0;
        for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) g[r][c] = tx[k++] || "";
        w.querySelector(".ltab").innerHTML = `<table class="grid">${g.map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</table><p>по строкам: <b>${g.map((r) => r.join("")).join("")}</b>${tx.length % cols ? ' <span class="bad">длина не делится на число столбцов</span>' : ""}</p>`;
      };
      t.oninput = n.oninput = upd;
      upd();
      const pickP = () => { for (;;) { const p = pick(PHRASES), ds = []; for (let c = 3; c <= p.length / 2; c++) if (p.length % c === 0) ds.push(c); if (ds.length) return [p, ds]; } };
      P.task(el, { title: "1. Расшифруй", make: () => { const [p, ds] = pickP(), cols = pick(ds), c = columnsRead(p, cols); return { q: `Текст записали в таблицу по строкам (${cols} столбцов, ${p.length / cols} строк) и прочитали по столбцам: ${code(c)}. Что было написано? (без пробелов)`, a: p, hint: `Впиши шифр в таблицу выше по столбцам: в столбце ${p.length / cols} букв, значит число «столбцов» для неё — ${p.length / cols}.`, sol: `Ответ: ${code(p)}.` }; } });
      P.task(el, { title: "2. Взломай", make: () => { const [p, ds] = pickP(), cols = pick(ds), c = columnsRead(p, cols); return { q: `Шифр маршрутной перестановки (пишем по строкам, читаем по столбцам), размер таблицы неизвестен: ${code(c)}. Что было написано?`, a: p, hint: `Длина ${c.length}. Перебери делители длины в таблице выше.`, sol: `В исходной таблице было ${cols} столбцов: ${code(p)}.` }; } });
    },
  };

  const CN = 4, CH = [[0, 0], [1, 2], [2, 0], [3, 1]], CM = "ВСТРЕЧАЕМСЯВПЯТЬ", CG = grille(CN, CH, CM), CELL = 86;
  function stencil(L, parent, n, holes, cell) {
    const st = L.el("div", "l-stencil", null, parent);
    st.style.width = st.style.height = n * cell + "px";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) L.el("div", holes.some(([a, b]) => a === r && b === c) ? "hole" : "", null, st);
    st.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    return st;
  }
  const ch8 = {
    id: "cardano", title: "Решётка Кардано",
    stage(box, L) {
      const { el } = L, s = {};
      s.wrap = place(el("div", "abs", null, box), 70, 70);
      s.grid = el("div", "l-cgrid", null, s.wrap);
      s.cells = [...Array(16)].map(() => el("div", "", "", s.grid));
      s.cell = (r, c) => s.cells[r * CN + c];
      s.st = stencil(L, s.wrap, CN, CH, CELL);
      L.hide(s.st);
      s.rot = 0;
      s.turn = () => { s.rot++; s.st.style.transform = `rotate(${s.rot * 90}deg)`; };
      s.msg = place(el("div", "abs hid", '<div class="l-note sm">сообщение</div>', box), 490, 70, 440);
      s.mt = L.tiles(s.msg, CM, null, "mini").t;
      s.write = (t, a, b, T) => T.spread(4, (i) => { const [r, c] = CG.order[t][i]; s.cell(r, c).textContent = CM[t * 4 + i]; L.mark("new", true, s.cell(r, c)); L.mark("on", true, s.mt[t * 4 + i]); }, a, b);
      s.out = place(el("div", "abs hid", '<div class="l-note sm">читаем в окошках</div>', box), 490, 220, 440);
      s.ot = L.tiles(s.out, CM, null, "mini hid").t;
      s.flat = place(el("div", "abs hid", `<div class="l-note sm">шифр (таблица по строкам)</div>`, box), 490, 220, 440);
      L.tiles(s.flat, CG.g.map((r) => r.join("")).join(""), null, "mini");
      s.form = place(el("div", "l-flist abs hid", '<div class="l-big">(r, c) → (c, n − 1 − r)</div><div>n = 4:  (2, 0) → (0, 4 − 1 − 2) = <b>(0, 1)</b></div><div class="muted">строки и столбцы считаем с 0</div>', box), 490, 330, 450);
      s.quad = place(el("div", "l-quad abs hid", '<div>1</div><div>2</div><div>3</div><div>4</div><p>таблица 16×16 = четыре квадрата 8×8;<br>одну решётку кладут на каждый по очереди</p>', box), 500, 90, 420);
      s.code = codeBox(L, box, "grid = " + JSON.stringify(CG.g.map((r) => r.join(""))).replace(/"/g, "'").replace(/,/g, ", ") + "\nholes = [(0, 0), (1, 2), (2, 0), (3, 1)]   # окошки (строка, столбец)\nn, text = 4, ''\nfor _ in range(4):\n    text += ''.join(grid[r][c] for r, c in sorted(holes))\n    holes = [(c, n - 1 - r) for r, c in holes]   # поворот по часовой\nprint(text)", 60, 90, 840);
      return s;
    },
    lines: [
      ["Самый красивый шифр перестановки — решётка Кардано. Её придумал итальянский математик Джероламо Кардано в шестнадцатом веке."],
      ["Возьмём квадрат из картона четыре на четыре клетки и вырежем в нём четыре окошка. Это и есть решётка — трафарет.", (s, T, L = LessonPlayer.L) => { T.frac(0.45, () => L.show(s.st)); }],
      ["Кладём решётку на чистый лист и пишем в окошки первые четыре буквы сообщения — по порядку: слева направо, сверху вниз.", (s, T, L = LessonPlayer.L) => { L.show(s.msg); s.write(0, 0.45, 0.95, T); }],
      ["Поворачиваем решётку на девяносто градусов по часовой стрелке. Окошки оказались над новыми, пустыми клетками. Пишем следующие четыре буквы.", (s, T, L = LessonPlayer.L) => {
        L.mark("new", false, s.cells); T.frac(0.12, () => s.turn()); s.write(1, 0.6, 0.97, T);
      }],
      ["Ещё поворот — ещё четыре буквы. И последний, четвёртый поворот — последние четыре.", (s, T, L = LessonPlayer.L) => {
        L.mark("new", false, s.cells); T.frac(0.05, () => s.turn()); s.write(2, 0.2, 0.45, T);
        T.frac(0.55, () => { L.mark("new", false, s.cells); s.turn(); }); s.write(3, 0.68, 0.95, T);
      }],
      ["Окошки вырезаны хитро: за четыре положения каждая клетка открывается ровно один раз. Снимаем решётку — на листе таблица из бессмысленных букв. Это и есть шифр.", (s, T, L = LessonPlayer.L) => {
        L.mark("new", false, s.cells); L.mark("on", false, s.mt);
        T.frac(0.45, () => { L.hide(s.st); L.show(s.flat); });
      }],
      ["Получатель кладёт такую же решётку на таблицу и читает буквы в окошках: четыре буквы, поворот, ещё четыре — и так четыре раза.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.flat, s.msg); L.show(s.out); s.rot = 3; s.turn(); L.show(s.st);
        const rd = (t) => (i) => { const [r, c] = CG.order[t][i]; L.mark("rd", true, s.cell(r, c)); L.show(s.ot[t * 4 + i]); };
        T.spread(4, rd(0), 0.15, 0.25);
        T.frac(0.32, () => { L.mark("rd", false, s.cells); s.turn(); }); T.spread(4, rd(1), 0.42, 0.52);
        T.frac(0.58, () => { L.mark("rd", false, s.cells); s.turn(); }); T.spread(4, rd(2), 0.66, 0.74);
        T.frac(0.8, () => { L.mark("rd", false, s.cells); s.turn(); }); T.spread(4, rd(3), 0.86, 0.95);
      }],
      ["Важно читать окошки строго по порядку: сначала верхняя строка слева направо, потом следующая. И поворачивать в ту же сторону, что при шифровании. Если в условии направление не сказано — попробуй оба.", (s, T, L = LessonPlayer.L) => { L.mark("rd", false, s.cells); }],
      { say: "Как узнать, куда переедет окошко после поворота? Клетка в строке эр и столбце цэ при повороте по часовой стрелке переходит в строку цэ и столбец эн минус один минус эр, где эн — размер квадрата.", cap: "Как узнать, куда переедет окошко после поворота? Клетка в строке r и столбце c при повороте по часовой стрелке переходит в строку c и столбец n − 1 − r, где n — размер квадрата.", do: (s, T, L = LessonPlayer.L) => {
        L.hide(s.st); L.show(s.form); L.hide(s.form.children[1]);
      } },
      { say: "Например, в квадрате четыре на четыре клетка из строки два и столбца ноль переедет в строку ноль и столбец один. Строки и столбцы считаем с нуля.", cap: "Например, в квадрате 4×4 клетка из строки 2 и столбца 0 переедет в строку 0 и столбец 1. Строки и столбцы считаем с нуля.", do: (s, T, L = LessonPlayer.L) => {
        L.show(s.form.children[1]); L.mark("rd", true, s.cell(2, 0));
        T.frac(0.55, () => { L.mark("rd", false, s.cells); L.mark("new", true, s.cell(0, 1)); });
      } },
      ["На отборе встречался и вариант без поворотов: таблица шестнадцать на шестнадцать делится на четыре квадрата, и одну и ту же решётку кладут на каждый квадрат по очереди. Принцип тот же — выписываешь буквы в окошках.", (s, T, L = LessonPlayer.L) => {
        L.mark("new", false, s.cells); L.hide(s.form, s.out); L.show(s.quad);
        T.spread(4, (i) => { L.mark("on", false, ...s.quad.children); L.mark("on", true, s.quad.children[i]); }, 0.5, 0.9);
      }],
      { say: "Совет: если таблица дана картинкой, перепиши её в Питон списком строк, и пусть программа сама выписывает буквы. Так не ошибёшься в клетках.", cap: "Совет: если таблица дана картинкой, перепиши её в Python списком строк, и пусть программа сама выписывает буквы. Так не ошибёшься в клетках.", do: (s, T, L = LessonPlayer.L) => { L.hide(s.quad, s.wrap); L.show(s.code); } },
    ],
    practice(el, P, L) {
      P.task(el, { title: "1. Прочитай сообщение", make: () => {
        const holes = randomHoles(4), msg = pick(PH16), G = grille(4, holes, msg);
        return {
          q: `Перехвачена таблица и решётка 4×4. Наложи решётку, выпиши 4 буквы в окошках (по строкам, слева направо), поверни по часовой стрелке и повтори — всего 4 положения. Что за сообщение? (без пробелов)
            <div class="lcard-wrap"><div class="lcw"><div class="l-cgrid small">${G.g.flat().map((x) => `<div>${x}</div>`).join("")}</div></div>
            <div><button class="btn ghost small" data-rot>Повернуть ↻</button> <button class="btn ghost small" data-tog>Снять решётку</button><p class="muted lpos2">положение 1 из 4</p></div></div>`,
          a: msg, hint: "Если сбился — сними решётку, чтобы видеть все буквы, и наложи снова. Окошки в каждом положении читаются по строкам сверху вниз.",
          sol: G.order.map((o, t) => `положение ${t + 1}: ${o.map(([r, c]) => G.g[r][c]).join("")}`).join("<br>") + `<br>Ответ: <b>${msg}</b>`,
          mount: (q) => {
            const st = stencil(L, q.querySelector(".lcw"), 4, holes, 46);
            let r = 0;
            q.querySelector("[data-rot]").onclick = () => { r++; st.style.transform = `rotate(${r * 90}deg)`; q.querySelector(".lpos2").textContent = `положение ${(r % 4) + 1} из 4`; };
            q.querySelector("[data-tog]").onclick = (e) => { st.classList.toggle("hid"); e.target.textContent = st.classList.contains("hid") ? "Наложить решётку" : "Снять решётку"; };
          },
        };
      } });
      P.task(el, { title: "2. Куда переедет окошко", ph: "строка столбец", make: () => {
        const n = pick([4, 6, 8]), r = rnd(n), c = rnd(n);
        return { q: `Решётка ${n}×${n}, окошко в строке ${r}, столбце ${c} (счёт с 0). Где оно окажется после поворота на 90° по часовой стрелке? Ответ — два числа через пробел: строка и столбец.`, a: [`${c} ${n - 1 - r}`], hint: "(r, c) → (c, n − 1 − r)", sol: `(${r}, ${c}) → (${c}, ${n} − 1 − ${r}) = (${c}, ${n - 1 - r}).` };
      } });
      P.code(el, "grid = ['....', '....', '....', '....']   # перепиши таблицу по строкам\nholes = [(0, 0), (1, 2), (2, 0), (3, 1)]    # окошки (строка, столбец), счёт с 0\nn, text = len(grid), ''\nfor _ in range(4):\n    text += ''.join(grid[r][c] for r, c in sorted(holes))\n    holes = [(c, n - 1 - r) for r, c in holes]   # по часовой\n    # против часовой: holes = [(n - 1 - c, r) for r, c in holes]\nprint(text)");
    },
  };

  const XP = 72, XK = 107, XC = XP ^ XK;
  const bits = (v) => v.toString(2).padStart(8, "0");
  const ch9 = {
    id: "xor", title: "Гамма и XOR",
    stage(box, L) {
      const { el } = L, s = {};
      s.title = place(el("div", "l-title abs", "Гамма<small>одноразовый блокнот и операция XOR</small>", box), 0, 150, 960);
      s.g = place(el("div", "l-xg abs hid", null, box), 110, 40, 740);
      const row = (lbl, v, cls) => { el("div", "l-vl", lbl, s.g); const t = [...bits(v)].map((b) => L.tile(b, null, "big " + (cls || ""), s.g)); el("div", "l-xd", `= ${v}`, s.g); return t; };
      s.p = row("текст", XP); s.k = row("ключ", XK); s.c = row("XOR", XC, "hid");
      s.xd = s.g.querySelectorAll(".l-xd")[2]; L.hide(s.xd);
      s.rule = place(el("div", "l-note abs hid", "0⊕0 = 0 &nbsp; 1⊕1 = 0 &nbsp; 0⊕1 = 1 &nbsp; 1⊕0 = 1 <small>одинаковые → 0, разные → 1</small>", box), 110, 330, 740);
      s.back = place(el("div", "l-flist abs hid", `<div>${XC} ⊕ ${XK} = <b>${XP}</b> — снова исходный байт</div><div class="l-big">(p ⊕ k) ⊕ k = p</div>`, box), 110, 330, 740);
      s.png = place(el("div", "l-flist abs hid", '<div>начало любого PNG: <code>89 50 4E 47</code></div><div>начало Secret.enc: <code>F3 64 5C D7</code></div><div class="l-big">ключ = 89⊕F3, 50⊕64, … = <b>7A 34 12 90</b></div>', box), 110, 120, 740);
      s.twice = place(el("div", "l-flist abs hid", '<div class="l-big">c₁ ⊕ c₂ = (p₁ ⊕ k) ⊕ (p₂ ⊕ k) = p₁ ⊕ p₂</div><div>ключ исчез — гамму нельзя использовать дважды</div>', box), 110, 340, 740);
      s.code = codeBox(L, box, "print(72 ^ 107)      # 35  — зашифровали байт\nprint(35 ^ 107)      # 72  — тем же ключом расшифровали\n\nenc = open('Secret.enc', 'rb').read()\nkey = bytes(a ^ b for a, b in zip(b'\\x89PNG', enc[:4]))   # известный текст\ndec = bytes(b ^ key[i % 4] for i, b in enumerate(enc))\nopen('Secret.png', 'wb').write(dec)", 90, 110, 780);
      return s;
    },
    lines: [
      ["Последняя глава — шаг к современным шифрам. Представь шифр Виженера, у которого ключ такой же длины, как сообщение, и совершенно случайный. Такой ключ называют гаммой, или одноразовым блокнотом."],
      ["Доказано, что такой шифр взломать нельзя: при случайной гамме шифр может оказаться любым сообщением той же длины. Но только если гамма не повторяется."],
      { say: "В компьютере вместо букв — байты, по восемь битов. И вместо сложения по модулю используют операцию ксор — исключающее или.", cap: "В компьютере вместо букв — байты, по восемь битов. И вместо сложения по модулю используют операцию XOR — «исключающее или» (в Python — знак ^).", do: (s, T, L = LessonPlayer.L) => { L.hide(s.title); L.show(s.g); } },
      ["Она сравнивает биты попарно: одинаковые дают ноль, разные — единицу.", (s, T, L = LessonPlayer.L) => {
        L.show(s.rule);
        T.spread(8, (i) => { L.mark("on", false, s.p, s.k); L.mark("on", true, s.p[i], s.k[i]); L.show(s.c[i]); L.mark("good", true, s.c[i]); }, 0.25, 0.85);
        T.frac(0.92, () => { L.mark("on", false, s.p, s.k); L.show(s.xd); });
      }],
      ["Главное свойство: если сделать ксор с тем же ключом ещё раз, вернётся исходный байт. Поэтому шифрование и расшифровка — одно и то же действие.", (s, T, L = LessonPlayer.L) => {
        L.hide(s.rule); T.frac(0.3, () => L.show(s.back));
      }],
      { say: "Отсюда атака на гамму: если известен кусок открытого текста, то ключ — это открытый текст ксор шифр. Например, каждый файл PNG начинается с одних и тех же восьми байтов. Именно так решалась олимпиадная задача «Гамма».", cap: "Отсюда атака на гамму: если известен кусок открытого текста, то ключ = открытый текст XOR шифр. Например, каждый файл PNG начинается с одних и тех же 8 байтов. Именно так решалась олимпиадная задача «Гамма».", do: (s, T, L = LessonPlayer.L) => {
        L.hide(s.g, s.back); L.show(s.png);
      } },
      { say: "И вторая ошибка — шифровать одной гаммой два сообщения. Ксор двух шифров уничтожает ключ, и остаются только два открытых текста.", cap: "И вторая ошибка — шифровать одной гаммой два сообщения. XOR двух шифров уничтожает ключ, и остаются только два открытых текста.", do: (s, T, L = LessonPlayer.L) => { L.show(s.twice); } },
      { say: "В Питоне ксор записывается значком «крышечка». Расшифровать целый файл можно одной строчкой.", cap: "В Python XOR записывается значком ^ («крышечка»). Расшифровать целый файл можно одной строчкой.", do: (s, T, L = LessonPlayer.L) => { L.hide(s.png, s.twice); L.show(s.code); } },
    ],
    practice(el, P, L) {
      const w = L.el("div", "lwidget", `<p class="muted">Нажимай на биты — XOR считается сам.</p><div class="lxw"></div>`, el);
      const v = [XP, XK];
      const draw = () => {
        const r = (lbl, x, k) => `<div class="lxr"><span>${lbl}</span>${[...bits(x)].map((b, i) => `<button ${k != null ? `data-r="${k}" data-i="${i}"` : "disabled"} class="${b === "1" ? "one" : ""}">${b}</button>`).join("")}<span>= ${x} (0x${x.toString(16).toUpperCase().padStart(2, "0")})</span></div>`;
        w.querySelector(".lxw").innerHTML = r("a", v[0], 0) + r("b", v[1], 1) + r("a ^ b", v[0] ^ v[1]);
        w.querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => { v[+b.dataset.r] ^= 1 << (7 - +b.dataset.i); draw(); }));
      };
      draw();
      P.task(el, { title: "1", make: () => { const a = rnd(16), b = rnd(16); return { q: `Чему равно ${a} XOR ${b} (в Python ${code(`${a} ^ ${b}`)})?`, a: String(a ^ b), hint: "Запиши оба числа в двоичном виде (4 бита) и сравни биты попарно. Можно проверить на битах выше.", sol: `${a.toString(2).padStart(4, "0")} ⊕ ${b.toString(2).padStart(4, "0")} = ${(a ^ b).toString(2).padStart(4, "0")} = ${a ^ b}.` }; } });
      P.task(el, { title: "2", make: () => { const p = 32 + rnd(90), k = rnd(256), c = p ^ k; return { q: `Известно, что открытый байт ${p}, а после гаммирования получился ${c}. Каким был байт ключа?`, a: String(k), hint: "Ключ = открытый XOR шифр.", sol: `${p} ^ ${c} = ${k}.` }; } });
    },
  };

  const ch10 = {
    id: "summary", title: "Итог: как действовать на олимпиаде",
    stage(box, L) {
      const { el } = L, s = {};
      s.title = place(el("div", "l-title abs sm", "Видишь шифр — действуй по плану", box), 0, 16, 960);
      const col = place(el("div", "l-steps abs", null, box), 70, 74, 820);
      const st = [
        ["1. Условие", "алфавит: с Ё или без, нумерация с 0 или с 1, направление сдвига; проверь себя на примере"],
        ["2. Вид шифра", "буквы те же, порядок другой → перестановка; буквы другие → замена"],
        ["3. Замена", "сдвиг → перебери 33 ключа · ключ-слово → Виженер: перебери ключи или вычти известный текст · произвольная таблица → частоты"],
        ["4. Перестановка", "таблица и маршрут (перебери число столбцов) или решётка Кардано"],
        ["5. Python", "не считай руками: маленькая программа не ошибается на одну позицию"],
      ];
      s.cards = st.map(([a, b]) => el("div", "l-step hid", `<b>${a}</b>${b}`, col));
      return s;
    },
    lines: [
      ["Подведём итог: что делать, когда на олимпиаде видишь шифр."],
      ["Первое — внимательно прочитай условие: какой алфавит, есть ли буква Ё, с нуля или с единицы нумерация. Если есть пример — проверь на нём своё понимание.", (s, T, L = LessonPlayer.L) => L.show(s.cards[0])],
      ["Второе — определи вид шифра. Буквы те же, только перемешаны — это перестановка. Буквы другие — замена.", (s, T, L = LessonPlayer.L) => L.show(s.cards[1])],
      ["Если это сдвиг — перебери все ключи. Если ключ — слово, это Виженер: перебери предложенные ключи или вычти известный текст. Если таблица замены произвольная — поможет частотный анализ.", (s, T, L = LessonPlayer.L) => L.show(s.cards[2])],
      ["Если это перестановка — ищи таблицу и маршрут или решётку.", (s, T, L = LessonPlayer.L) => L.show(s.cards[3])],
      ["И главное: пиши маленькую программу на Питоне вместо ручного счёта. Руками легко ошибиться на одну позицию, а программа не ошибается.", (s, T, L = LessonPlayer.L) => L.show(s.cards[4])],
      ["Реши упражнения под видео, а потом переходи к настоящим задачам олимпиады в тренажёре. Удачи!"],
    ],
    practice(el, P) {
      const Q = [
        ["В шифртексте те же буквы, что и в обычном тексте, и частоты как у обычного русского текста. Что это скорее всего?", ["перестановка", "шифр Цезаря", "шифр Виженера"], "перестановка"],
        ["Шифр сдвига, ключ неизвестен, текст короткий. Самый надёжный способ?", ["перебрать все 33 ключа", "частотный анализ", "решётка Кардано"], "перебрать все 33 ключа"],
        ["Дан шифртекст и пять возможных ключей-слов. Что делать?", ["расшифровать каждым и найти осмысленный текст", "посчитать частоты букв", "перебрать все таблицы замены"], "расшифровать каждым и найти осмысленный текст"],
        ["Длинное письмо, каждая буква заменена по произвольной таблице. Что делать?", ["частотный анализ и догадки по коротким словам", "перебрать 33 ключа", "читать по столбцам"], "частотный анализ и догадки по коротким словам"],
      ];
      Q.forEach(([q, ch, a], i) => P.task(el, { title: String(i + 1), make: () => ({ q, choices: shuffle(ch), a, sol: `Правильно: ${a}.` }) }));
    },
  };

  window.LESSONS = window.LESSONS || {};
  window.LESSONS.ciphers = {
    id: "ciphers", topic: "ciphers", title: "Шифры с нуля",
    short: "Видеоурок с голосом: номера букв и mod, Цезарь, частотный анализ, Виженер, перестановки, решётка Кардано, XOR",
    chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10],
    // для проверки текста диктора (tools/voice_lesson.py --check)
    _test: { A, shift, vig, columnsRead, grille, count, STORY, SUB, LETTERS, CG, VC, TC, BRUTE_C },
  };
})();
