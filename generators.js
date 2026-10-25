// Генераторы тренировочных задач «в стиле олимпиады». Каждый генератор по зерну (seed) детерминированно
// строит условие, правильный ответ и решение — так задачу можно восстановить после перезагрузки страницы.
(function () {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    const f = mulberry32(seed);
    const r = {
      f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      shuffle: (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(f() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
    };
    r.sample = (arr, k) => r.shuffle(arr).slice(0, k);
    return r;
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pre = (code) => `<pre><code>${esc(code)}</code></pre>`;
  const ans = (type, accepted, choices) => ({ type, accepted: [].concat(accepted).map(String), choices: choices || [] });
  const toBase = (n, p, width = 0) => {
    const d = "0123456789abcdefghijklmnopqrstuvwxyz";
    let s = "";
    while (n > 0) { s = d[n % p] + s; n = Math.floor(n / p); }
    return (s || "0").padStart(width, "0");
  };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);

  const EN_WORDS = ["Korolyov", "Glushko", "Turing", "Shannon", "Enigma", "Cipher", "Kernel", "Packet", "Server",
    "Router", "Secret", "Botnet", "Trojan", "Proxy", "Token", "Access", "Socket", "Binary", "Gagarin", "Lomonosov",
    "Kolmogorov", "Lebedev", "Firewall", "Sandbox", "Backdoor", "Exploit", "Payload", "Phishing", "Keylogger",
    "Rootkit", "Bitcoin", "Kerberos", "Captcha", "Pixel", "Vector", "Daemon", "Script", "Malware", "Hacker"];
  const NAMES = ["Robin", "Alice", "Bob", "Eve", "Mallory", "Trent", "Victor", "Oscar", "Peggy", "Walter", "Carol",
    "Dave", "Frank", "Grace", "Heidi", "Judy", "Olivia", "Sybil", "Trudy", "Wendy", "Ivan", "Pavel", "Nina", "Vera"];
  const RU_WORDS = ["ПАРОЛЬ", "ШИФР", "КЛЮЧ", "СЕРВЕР", "ПРОТОКОЛ", "ДОСТУП", "ЗАЩИТА", "ХЕШИРОВАНИЕ", "СИСТЕМА",
    "ИДЕНТИФИКАЦИЯ", "АУТЕНТИФИКАЦИЯ", "ПОЛИМОРФИЗМ", "БЕЗОПАСНОСТЬ", "УПРАВЛЕНИЕ", "РЕПЛИКАЦИЯ", "АЛГОРИТМ",
    "КРИПТОГРАФИЯ", "ШЛЮЗ", "ПАКЕТ", "МАРШРУТ", "ВИРУС", "АНТИВИРУС", "КОНТРОЛЬ", "СЕКРЕТ", "ТАЙНА", "ПОДПИСЬ",
    "СЕРТИФИКАТ", "ТОКЕН", "ФАЙРВОЛ", "ЖУРНАЛ", "УЯЗВИМОСТЬ", "ЭКСПЛОЙТ", "ДЕШИФРОВАНИЕ", "СТЕГАНОГРАФИЯ",
    "КОМПЬЮТЕР", "ИНФОРМАТИКА", "ОЛИМПИАДА", "МАТРИЦА", "ПРОГРАММА", "ФУНКЦИЯ", "ШИФРОВАНИЕ", "ПЕРЕХВАТ"];
  const RU33 = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const RU32 = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const LAT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const alphabetTable = (A, from = 1) => {
    let h = '<table class="alph"><tr><th>Буква</th>';
    for (const c of A) h += `<td>${c}</td>`;
    h += "</tr><tr><th>Номер</th>";
    for (let i = 0; i < A.length; i++) h += `<td>${i + from}</td>`;
    return h + "</tr></table>";
  };

  const G = [];

  // ───────────────────────── ASCII ─────────────────────────
  G.push({
    id: "ascii_codes", topic: "ascii", title: "Коды символов",
    make(r) {
      const w = r.pick(EN_WORDS);
      const mode = r.pick(["dec", "hex", "bin"]);
      const codes = [...w].map((c) => c.charCodeAt(0));
      const shown = codes.map((c) => (mode === "dec" ? String(c) : mode === "hex" ? c.toString(16).padStart(2, "0") : c.toString(2).padStart(8, "0")));
      const name = { dec: "десятичной", hex: "шестнадцатеричной", bin: "двоичной" }[mode];
      const py = {
        dec: `codes = [${shown.join(", ")}]\nprint(''.join(chr(c) for c in codes))`,
        hex: `print(bytes.fromhex('${shown.join("")}').decode())`,
        bin: `bits = '${shown.join(" ")}'.split()\nprint(''.join(chr(int(b, 2)) for b in bits))`,
      }[mode];
      return {
        html: `<p>Сотрудник службы безопасности перехватил сообщение — последовательность кодов ASCII в ${name} системе счисления:</p>${pre(shown.join(" "))}<p>Восстановите сообщение. Регистр букв имеет значение.</p>`,
        answer: ans("text_cs", w),
        solution: `<p>Каждое число — код одного символа. Переводим в десятичную систему и смотрим в таблицу ASCII:</p>
<table class="mini"><tr><th>Код</th>${shown.map((s) => `<td>${s}</td>`).join("")}</tr><tr><th>Десятичный</th>${codes.map((c) => `<td>${c}</td>`).join("")}</tr><tr><th>Символ</th>${[...w].map((c) => `<td>${c}</td>`).join("")}</tr></table>${pre(py)}<p><b>Ответ:</b> ${w}</p>`,
      };
    },
  });

  G.push({
    id: "ascii_base", topic: "ascii", title: "Перевод между системами счисления",
    make(r) {
      const bases = [2, 3, 5, 7, 8, 10, 16];
      const p = r.pick(bases);
      let q = r.pick(bases);
      while (q === p) q = r.pick(bases);
      const n = r.int(60, 4000);
      const sp = toBase(n, p).toUpperCase(), sq = toBase(n, q).toUpperCase();
      return {
        html: `<p>Переведите число <b>${sp}</b><sub>${p}</sub> из системы счисления с основанием ${p} в систему с основанием ${q}.</p><p>Буквенные цифры (для оснований больше 10) вводите латинскими буквами.</p>`,
        answer: ans("text_ci", sq),
        solution: `<p>Удобнее всего через десятичную систему: ${sp}<sub>${p}</sub> = ${n}<sub>10</sub>. Затем делим на ${q} с остатком, пока не получим 0, и выписываем остатки в обратном порядке.</p>${pre(`n = int('${sp}', ${p})      # ${n}\ndigits = '0123456789ABCDEF'\ns = ''\nwhile n > 0:\n    s = digits[n % ${q}] + s\n    n //= ${q}\nprint(s)`)}<p><b>Ответ:</b> ${sq}</p>`,
      };
    },
  });

  G.push({
    id: "ascii_rgb", topic: "ascii", title: "Странное изображение (RGB)",
    make(r) {
      const w = r.pick(NAMES.filter((x) => x.length >= 3 && x.length <= 6));
      const colors = [["R", "красный", "#e53935"], ["G", "зелёный", "#43a047"], ["B", "синий", "#1e88e5"]];
      const perm = r.shuffle([0, 1, 2]); // perm[digit] = индекс цвета
      const rows = [...w].map((c) => toBase(c.charCodeAt(0), 3, 5));
      const known = r.int(0, 2);
      let grid = '<div class="rgbgrid">';
      for (const row of rows) {
        grid += '<div class="rgbrow">';
        for (const d of row) grid += `<span style="background:${colors[perm[+d]][2]}"></span>`;
        grid += "</div>";
      }
      grid += "</div>";
      const map = [0, 1, 2].map((d) => `${colors[perm[d]][1]} = ${d}`).join(", ");
      return {
        html: `<p>У системного администратора обнаружено странное изображение ${rows.length}×5 из квадратов трёх цветов. Известно, что в нём спрятано имя сообщника.</p>${grid}<p>Аналитик выяснил, что каждый цвет обозначает цифру, причём <b>${colors[perm[known]][1]} — это ${known}</b>.</p><p>Восстановите имя (регистр важен).</p>`,
        answer: ans("text_cs", w),
        solution: `<p>Три цвета → троичная система. 5 цифр на строку: 3<sup>5</sup> = 243 &gt; 127, то есть одна строка = один символ ASCII.</p><p>Один цвет известен, для остальных двух — 2 варианта; правильный тот, что даёт буквы. Соответствие: ${map}.</p><table class="mini"><tr><th>Строка (троичн.)</th><th>Десятичный</th><th>Символ</th></tr>${rows.map((s, i) => `<tr><td>${s}</td><td>${w.charCodeAt(i)}</td><td>${w[i]}</td></tr>`).join("")}</table>${pre(`rows = ${JSON.stringify(rows)}\nprint(''.join(chr(int(s, 3)) for s in rows))`)}<p><b>Ответ:</b> ${w}</p>`,
      };
    },
  });

  G.push({
    id: "ascii_xor", topic: "ascii", title: "XOR-шифрование",
    make(r) {
      const w = r.pick(r.f() < 0.5 ? NAMES : EN_WORDS);
      const key = r.int(17, 250);
      const enc = [...w].map((c) => (c.charCodeAt(0) ^ key).toString(16).padStart(2, "0"));
      const knownKey = r.f() < 0.5;
      const html = knownKey
        ? `<p>Сообщение зашифровано побитовым XOR каждого байта с ключом <b>${key}</b> (десятичное число). Шифртекст (байты в hex):</p>${pre(enc.join(" "))}<p>Найдите исходное сообщение (регистр важен).</p>`
        : `<p>Сообщение зашифровано побитовым XOR каждого байта с одним и тем же секретным байтом-ключом. Шифртекст (hex):</p>${pre(enc.join(" "))}<p>Известно, что сообщение — имя, которое начинается с буквы <b>${w[0]}</b>. Найдите сообщение (регистр важен).</p>`;
      return {
        html,
        answer: ans("text_cs", w),
        solution: `<p>XOR обратим сам собой: p = c ^ k.${knownKey ? "" : ` Ключ находим по известной первой букве: k = 0x${enc[0]} ^ ord('${w[0]}') = ${parseInt(enc[0], 16)} ^ ${w.charCodeAt(0)} = ${key}.`}</p>${pre(`c = bytes.fromhex('${enc.join("")}')\nkey = ${knownKey ? key : `c[0] ^ ord('${w[0]}')`}\nprint(''.join(chr(b ^ key) for b in c))`)}<p><b>Ответ:</b> ${w}</p>`,
      };
    },
  });

  // ───────────────────────── HASH ─────────────────────────
  G.push({
    id: "hash_pick", topic: "hash", title: "Забывчивый криптограф (хеш пароля)",
    make(r) {
      for (let tries = 0; tries < 200; tries++) {
        const a = r.pick([3, 5, 7, 11]), b = r.pick([3, 13, 17, 19]);
        const term = r.pick([
          { html: "2<sup>i</sup>", f: (i) => 2 ** i, py: "2 ** i" },
          { html: "i<sup>2</sup>", f: (i) => i * i, py: "i ** 2" },
          { html: "3·i", f: (i) => 3 * i, py: "3 * i" },
        ]);
        const H0 = r.int(1, 31), n = r.pick([128, 256, 100, 97]);
        const words = r.sample(RU_WORDS, 4);
        const h = (wd) => {
          let H = H0;
          [...wd].forEach((ch, k) => { const i = k + 1; H = (H * a + (RU33.indexOf(ch) + 1) * b + term.f(i)) % n; });
          return H;
        };
        const hs = words.map(h);
        if (new Set(hs).size !== 4) continue;
        const correct = r.int(0, 3);
        return {
          html: `<p>Криптограф забыл пароль от архива, но оставил его хеш-значение и список возможных паролей. Хеш вычисляется по буквам пароля:</p>
<p class="formula">H<sub>i</sub> = (H<sub>i−1</sub> · ${a} + M<sub>i</sub> · ${b} + ${term.html}) mod ${n},</p>
<p>где H<sub>0</sub> = ${H0}, M<sub>i</sub> — номер i-й буквы в алфавите (i = 1, 2, …), mod — остаток от деления. Хеш всего пароля — значение после последней буквы.</p>${alphabetTable(RU33)}
<p>Какой из паролей имеет хеш-значение <b>${hs[correct]}</b>?</p>`,
          answer: ans("choice", words[correct], words),
          solution: `<p>Обращать хеш не нужно — считаем хеш каждого кандидата и сравниваем. Важно: алфавит из 33 букв (с Ё), нумерация с 1, i тоже с 1.</p>${pre(`A = '${RU33}'\ndef h(word):\n    H = ${H0}\n    for i, ch in enumerate(word, start=1):\n        M = A.index(ch) + 1\n        H = (H * ${a} + M * ${b} + ${term.py}) % ${n}\n    return H\nfor w in ${JSON.stringify(words).replace(/"/g, "'")}:\n    print(w, h(w))`)}<table class="mini">${words.map((wd, i) => `<tr><td>${wd}</td><td>${hs[i]}</td></tr>`).join("")}</table><p><b>Ответ:</b> ${words[correct]}</p>`,
        };
      }
    },
  });

  G.push({
    id: "hash_check_digit", topic: "hash", title: "Контрольная цифра",
    make(r) {
      for (;;) {
        const len = r.pick([8, 9, 10]);
        const mod = r.pick([10, 11]);
        const d = Array.from({ length: len - 1 }, () => r.int(0, 9));
        const s = d.reduce((acc, x, i) => acc + x * (i + 1), 0);
        let last = -1;
        for (let x = 0; x <= 9; x++) if ((s + x * len) % mod === 0) last = x;
        if (last < 0) continue;
        d.push(last);
        const hide = r.int(0, len - 1);
        // единственность при mod=10 не гарантирована — проверяем
        const fits = [];
        for (let x = 0; x <= 9; x++) {
          const dd = d.slice(); dd[hide] = x;
          if (dd.reduce((acc, y, i) => acc + y * (i + 1), 0) % mod === 0) fits.push(x);
        }
        if (fits.length !== 1) continue;
        const shown = d.map((x, i) => (i === hide ? "?" : x)).join("");
        return {
          html: `<p>Идентификатор сотрудника состоит из ${len} цифр d<sub>1</sub>d<sub>2</sub>…d<sub>${len}</sub>. Он считается корректным, если</p><p class="formula">(1·d<sub>1</sub> + 2·d<sub>2</sub> + … + ${len}·d<sub>${len}</sub>) mod ${mod} = 0.</p><p>В пропуске одна цифра стёрлась: <b>${shown}</b>. Какая цифра стоит на месте «?»</p>`,
          answer: ans("number", d[hide]),
          solution: `<p>Перебираем 10 вариантов цифры и проверяем условие:</p>${pre(`s = '${shown}'\nfor x in range(10):\n    t = s.replace('?', str(x))\n    if sum(int(c) * (i + 1) for i, c in enumerate(t)) % ${mod} == 0:\n        print(x)`)}<p><b>Ответ:</b> ${d[hide]}</p>`,
        };
      }
    },
  });

  function customHash(s) {
    let h = [0xef, 0xac, 0xeb, 0xca, 0xad, 0xdf, 0xbe, 0xda];
    for (const c of s) h = h.map((x, i) => (x * 65537 * (i + 1) + c.charCodeAt(0)) % 65536);
    const hs = h.map((x) => x.toString(16).padStart(4, "0")).join("");
    const tail = [...s.slice(-4)].map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0")).join("");
    return hs.slice(0, -8) + tail;
  }
  G.push({
    id: "hash_salt", topic: "hash", title: "Соль в хеше",
    make(r) {
      const salt = r.pick(["VICE", "Bolt", "Mars", "Neon", "Hawk", "Zeta", "Lynx", "Puma", "Iris", "Nova", "Ruby", "Opal", "Jade", "Onyx", "Kiwi", "Fox", "Owl"]);
      const pw = r.pick(["ikbmtuci", "qwerty12", "olymp2026", "admin", "letmein", "dragon", "sunshine", "password1"]);
      const weave = (p, s) => { s = s.length < 4 ? Array.from({ length: 4 }, (_, i) => s[i % s.length]).join("") : s.slice(0, 4); const h = Math.floor(p.length / 2); return p.slice(0, h) + s + p.slice(h) + s; };
      const realSalt = salt.length < 4 ? Array.from({ length: 4 }, (_, i) => salt[i % salt.length]).join("") : salt;
      const testHash = customHash(weave("password", "TEST"));
      const target = customHash(weave(pw, salt));
      const code = `def normalize_salt(salt):
    if len(salt) == 0:
        return ''
    if len(salt) < 4:                      # короткую соль повторяем по кругу
        return ''.join(salt[i % len(salt)] for i in range(4))
    return salt[:4]

def weave_salt(password, salt):
    salt = normalize_salt(salt)
    half = len(password) // 2
    return password[:half] + salt + password[half:] + salt

def custom_hash(s):
    h = [0xEF, 0xAC, 0xEB, 0xCA, 0xAD, 0xDF, 0xBE, 0xDA]
    for c in s:
        h = [(h[i] * 65537 * (i + 1) + ord(c)) % (2 ** 16) for i in range(8)]
    hash_str = ''.join(f"{x:04x}" for x in h)
    tail = ''.join(f"{ord(ch):02x}" for ch in s[-4:])
    return hash_str[:-8] + tail`;
      return {
        html: `<p>В репозитории администратора найден код хеширования паролей с «солью» (строка из 4 латинских букв, добавляется к паролю):</p>${pre(code)}<p>И файл с тестом: пароль <code>password</code>, соль <code>TEST</code>, хеш <code>${testHash}</code>.</p><p>Известно, что пароль <code>${pw}</code> с неизвестной солью даёт хеш <code>${target}</code>. Найдите соль (регистр важен).</p>`,
        answer: ans("text_cs", realSalt),
        solution: `<p>Уязвимость: последние 8 hex-символов хеша — это просто коды последних 4 символов строки, а строка заканчивается солью. Проверяем на тесте: хвост <code>${testHash.slice(-8)}</code> → <code>TEST</code>. ✔</p>${pre(`print(bytes.fromhex('${target.slice(-8)}').decode())`)}<p><b>Ответ:</b> ${realSalt}</p>`,
      };
    },
  });

  // ───────────────────────── CODE ─────────────────────────
  const ENC_VARIANTS = [
    { py: "shifted = (ord(char) + key + i) % 128", cpp: "int shifted = (text[i] + key + i) % 128;", f: (c, k, i) => (c + k + i) % 128, inv: "chr((c - key - i) % 128)", invText: "вычитаем key и i по модулю 128" },
    { py: "shifted = (ord(char) ^ key) + i", cpp: "int shifted = (text[i] ^ key) + i;", f: (c, k, i) => (c ^ k) + i, inv: "chr((c - i) ^ key)", invText: "сначала вычитаем i, потом XOR с key (обратный порядок операций!)" },
    { py: "shifted = (ord(char) + key * (i + 1)) % 128", cpp: "int shifted = (text[i] + key * (i + 1)) % 128;", f: (c, k, i) => (c + k * (i + 1)) % 128, inv: "chr((c - key * (i + 1)) % 128)", invText: "вычитаем key·(i+1) по модулю 128" },
    { py: "shifted = ord(char) ^ ((key + i) % 256)", cpp: "int shifted = text[i] ^ ((key + i) % 256);", f: (c, k, i) => c ^ ((k + i) % 256), inv: "chr(c ^ ((key + i) % 256))", invText: "XOR обратим сам собой — повторяем ту же операцию" },
  ];
  G.push({
    id: "code_reverse", topic: "code", title: "Исходный код шифрования",
    make(r) {
      const v = r.pick(ENC_VARIANTS), w = r.pick(EN_WORDS), key = r.int(10, 120);
      const enc = [...w].map((ch, i) => v.f(ch.charCodeAt(0), key, i));
      const py = `def encrypt(text, key):\n    encrypted = []\n    for i, char in enumerate(text):\n        ${v.py}\n        encrypted.append(shifted)\n    return encrypted`;
      const cpp = `std::vector<int> encrypt(std::string text, int key) {\n    std::vector<int> encrypted;\n    for (int i = 0; i < text.length(); i++) {\n        ${v.cpp}\n        encrypted.push_back(shifted);\n    }\n    return encrypted;\n}`;
      return {
        html: `<p>Разработчики по ошибке опубликовали код функции шифрования и секретный ключ <b>${key}</b>. Перехвачено зашифрованное сообщение:</p>${pre(enc.join(" "))}<p>Функция шифрования (Python и C++):</p>${pre(py)}${pre(cpp)}<p>Восстановите исходное сообщение (регистр важен).</p>`,
        answer: ans("text_cs", w),
        solution: `<p>Обращаем операцию: ${v.invText}.</p>${pre(`enc = [${enc.join(", ")}]\nkey = ${key}\nprint(''.join(${v.inv} for i, c in enumerate(enc)))`)}<p><b>Ответ:</b> ${w}</p>`,
      };
    },
  });

  G.push({
    id: "code_obfuscation", topic: "code", title: "Обфускация",
    make(r) {
      const word = r.pick(EN_WORDS.filter((x) => !/[QZqz]/.test(x) && x.length <= 8));
      const num = String(r.int(1000, 9999));
      const secret = word + num;
      const k = r.int(2, Math.min(4, word.length - 1));
      const p1 = `"${word.slice(0, k)}"` + [...word.slice(k)].map((c) => ` + chr(${c.charCodeAt(0)})`).join("");
      const p2 = [...num].map((c) => `chr(${c.charCodeAt(0)})`).join(" + ");
      const plain = `def check_secret(secret):\n    part1 = ${p1}\n    part2 = ${p2}\n    return secret == part1 + part2\nprint(check_secret(secret))\n`;
      const toks = r.sample(["def", "check", "secret", "part", "chr", "return", "print"], r.int(4, 6));
      const L = "bdfhkmpstvwy";
      const junk = [];
      while (junk.length < toks.length) {
        const j = "Q" + L[r.int(0, 11)] + L[r.int(0, 11)] + L[r.int(0, 11)] + "Z";
        if (!junk.includes(j)) junk.push(j);
      }
      let obf = plain;
      toks.forEach((t, i) => { obf = obf.split(t).join(junk[i]); });
      // в литерале exec: переводы строк как \n
      const lit = obf.replace(/\n/g, "\\n");
      const reps = toks.map((t, i) => `.replace('${junk[i]}', '${t}')`).join("");
      const code = `exec('${lit}'${reps}, {'secret': input()})`;
      return {
        html: `<p>На компьютере хакера найден обфусцированный фрагмент функции аутентификации. Он печатает <code>True</code>, если введено верное секретное слово:</p>${pre(code)}<p>Какое секретное слово нужно ввести? Регистр важен.</p>`,
        answer: ans("text_cs", secret),
        solution: `<p>Не выполняем чужой код — заменяем <code>exec(</code> на <code>print(</code> (и убираем второй аргумент), чтобы увидеть настоящий текст программы:</p>${pre(plain)}<p>Считаем строки: ${[...word.slice(k)].map((c) => `chr(${c.charCodeAt(0)}) = '${c}'`).join(", ")}; ${[...num].map((c) => `chr(${c.charCodeAt(0)}) = '${c}'`).join(", ")}.</p><p>part1 = '${word}', part2 = '${num}'.</p><p><b>Ответ:</b> ${secret}</p>`,
      };
    },
  });

  G.push({
    id: "code_trace", topic: "code", title: "Что выведет программа",
    make(r) {
      const t = r.int(0, 2);
      if (t === 0) {
        const A = r.int(2, 50), B = r.int(3, 17), M = r.pick([97, 101, 128, 256, 1000]), N = r.int(5, 12);
        let x = A;
        for (let i = 0; i < N; i++) x = (x * B + i) % M;
        const code = `x = ${A}\nfor i in range(${N}):\n    x = (x * ${B} + i) % ${M}\nprint(x)`;
        return { html: `<p>Что выведет программа?</p>${pre(code)}`, answer: ans("number", x), solution: `<p>Проще всего — запустить программу. Вручную: вести таблицу значений x на каждой итерации (i от 0 до ${N - 1}).</p>${pre(code)}<p><b>Ответ:</b> ${x}</p>` };
      }
      if (t === 1) {
        const Lo = r.int(1, 50), Hi = Lo + r.int(100, 400), P = r.int(3, 9), Q = r.int(0, P - 1), S = r.int(4, 13);
        let cnt = 0;
        for (let x = Lo; x < Hi; x++) if (x % P === Q || x % S === 0) cnt++;
        const code = `count = 0\nfor x in range(${Lo}, ${Hi}):\n    if x % ${P} == ${Q} or x % ${S} == 0:\n        count += 1\nprint(count)`;
        return { html: `<p>Что выведет программа?</p>${pre(code)}`, answer: ans("number", cnt), solution: `<p>Обратите внимание: <code>range(${Lo}, ${Hi})</code> не включает ${Hi}. Запускаем или считаем по формуле включений-исключений.</p>${pre(code)}<p><b>Ответ:</b> ${cnt}</p>` };
      }
      const w = r.pick(EN_WORDS).toLowerCase(), K = r.int(2, 3);
      let res = "";
      [...w].forEach((c, i) => { if (i % K === 0) res += c.toUpperCase(); else res = c + res; });
      const code = `s = '${w}'\nr = ''\nfor i, c in enumerate(s):\n    if i % ${K} == 0:\n        r = r + c.upper()\n    else:\n        r = c + r\nprint(r)`;
      return { html: `<p>Что выведет программа? (Регистр важен.)</p>${pre(code)}`, answer: ans("text_cs", res), solution: `<p>Буквы на позициях, кратных ${K}, добавляются в конец заглавными, остальные — в начало строки.</p>${pre(code)}<p><b>Ответ:</b> ${res}</p>` };
    },
  });

  // ───────────────────────── CIPHERS ─────────────────────────
  const shiftStr = (s, k, A) => [...s].map((c) => (A.includes(c) ? A[(((A.indexOf(c) + k) % A.length) + A.length) % A.length] : c)).join("");
  G.push({
    id: "ciph_caesar", topic: "ciphers", title: "Шифр Цезаря",
    make(r) {
      const w = r.pick(RU_WORDS), k = r.int(1, 31);
      const c = shiftStr(w, k, RU32);
      return {
        html: `<p>Перехвачено слово, зашифрованное шифром сдвига (каждая буква сдвинута на одно и то же число позиций вперёд по кругу). Алфавит — 32 буквы без Ё:</p>${alphabetTable(RU32, 0)}${pre(c)}<p>Расшифруйте слово.</p>`,
        answer: ans("text_ci", w),
        solution: `<p>Ключей всего 32 — перебираем все сдвиги и ищем осмысленное слово. Ключ: ${k}.</p>${pre(`A = '${RU32}'\nc = '${c}'\nfor k in range(32):\n    print(k, ''.join(A[(A.index(x) - k) % 32] for x in c))`)}<p><b>Ответ:</b> ${w}</p>`,
      };
    },
  });

  G.push({
    id: "ciph_vigenere", topic: "ciphers", title: "Шифр Виженера",
    make(r) {
      const key = r.pick(["КОД", "ШИФР", "КЛЮЧ", "ЛУНА", "ЗИМА", "НОЧЬ", "ВЕТЕР", "ГОРА", "РЕКА", "ЛЕС"]);
      const w = r.pick(RU_WORDS.filter((x) => x.length >= key.length + 3));
      const c = [...w].map((ch, i) => RU32[(RU32.indexOf(ch) + RU32.indexOf(key[i % key.length])) % 32]).join("");
      const findKey = r.f() < 0.4;
      const html = findKey
        ? `<p>Шифр Виженера: i-я буква текста сдвигается вперёд на номер i-й буквы ключа (А = 0, Б = 1, …; ключ повторяется). Алфавит — 32 буквы без Ё:</p>${alphabetTable(RU32, 0)}<p>Известно, что слово <b>${w}</b> зашифровано в <b>${c}</b>. Найдите ключ — осмысленное слово.</p>`
        : `<p>Шифр Виженера: i-я буква текста сдвигается вперёд на номер i-й буквы ключа (А = 0, Б = 1, …; ключ повторяется). Алфавит — 32 буквы без Ё:</p>${alphabetTable(RU32, 0)}<p>Ключ: <b>${key}</b>. Шифртекст: <b>${c}</b>. Расшифруйте.</p>`;
      return {
        html,
        answer: ans("text_ci", findKey ? key : w),
        solution: findKey
          ? `<p>Для каждой позиции сдвиг = (номер буквы шифра − номер буквы текста) mod 32. Получаем последовательность букв, в которой повторяется ключ.</p>${pre(`A = '${RU32}'\np, c = '${w}', '${c}'\nprint(''.join(A[(A.index(y) - A.index(x)) % 32] for x, y in zip(p, c)))`)}<p>Получается ${[...w].map((ch, i) => RU32[(RU32.indexOf(c[i]) - RU32.indexOf(ch) + 32) % 32]).join("")} — повторяющийся ключ.</p><p><b>Ответ:</b> ${key}</p>`
          : `<p>Вычитаем из каждой буквы шифртекста соответствующую букву ключа по модулю 32.</p>${pre(`A = '${RU32}'\nc, key = '${c}', '${key}'\nprint(''.join(A[(A.index(x) - A.index(key[i % len(key)])) % 32] for i, x in enumerate(c)))`)}<p><b>Ответ:</b> ${w}</p>`,
      };
    },
  });

  const PHRASES16 = ["ВСТРЕТИМСЯВПАРКЕ", "ДОКУМЕНТЫВАРХИВЕ", "ЖДУСИГНАЛАУМОСТА", "ЛОГИНАДМИНПАРОЛЬ", "ОТЧЕТСДАТЬКСРЕДЕ",
    "ПОЕЗДОТХОДИТВДВА", "ПРОВЕРЬЛОГИСНОВА", "СВЯЗНОЙЖДЕТУКИНО", "СЕРВЕРПОДЗАЩИТОЙ", "ШИФРОВКАПОЛУЧЕНА", "ШИФРЫХРАНЯТТАЙНУ"];
  G.push({
    id: "ciph_cardano", topic: "ciphers", title: "Решётка Кардано",
    make(r) {
      const n = 4, msg = r.pick(PHRASES16);
      const rot = ([a, b]) => [b, n - 1 - a];
      let holes = [[0, 0], [0, 1], [1, 0], [1, 1]].map((p) => { let q = p; for (let t = r.int(0, 3); t > 0; t--) q = rot(q); return q; });
      const start = holes.map((h) => h.slice());
      const grid = Array.from({ length: n }, () => Array(n).fill(""));
      let idx = 0;
      for (let t = 0; t < 4; t++) {
        const sorted = holes.slice().sort((x, y) => x[0] - y[0] || x[1] - y[1]);
        for (const [a, b] of sorted) grid[a][b] = msg[idx++];
        holes = holes.map(rot);
      }
      const isHole = (a, b) => start.some(([x, y]) => x === a && y === b);
      let g1 = '<table class="grid">', g2 = '<table class="grid">';
      for (let a = 0; a < n; a++) {
        g1 += "<tr>" + grid[a].map((c) => `<td>${c}</td>`).join("") + "</tr>";
        g2 += "<tr>" + grid[a].map((_, b) => `<td class="${isHole(a, b) ? "hole" : "solid"}">${isHole(a, b) ? "" : ""}</td>`).join("") + "</tr>";
      }
      g1 += "</table>"; g2 += "</table>";
      return {
        html: `<p>Сообщение зашифровано с помощью решётки Кардано 4×4. Решётку кладут на таблицу, выписывают буквы в прорезях (слева направо, сверху вниз), затем поворачивают решётку на 90° <b>по часовой стрелке</b> и повторяют — всего 4 положения.</p><div class="row2"><div><p>Таблица:</p>${g1}</div><div><p>Решётка в начальном положении (белые клетки — прорези):</p>${g2}</div></div><p>Прочитайте сообщение (без пробелов).</p>`,
        answer: ans("text_ci", msg),
        solution: `<p>Прорези в начальном положении (строка, столбец; счёт с 0): ${start.map((p) => `(${p})`).join(", ")}. При повороте по часовой стрелке клетка (r, c) переходит в (c, 3 − r).</p>${pre(`grid = ${JSON.stringify(grid.map((row) => row.join("")))}\nholes = ${JSON.stringify(start).replace(/\[/g, "(").replace(/\]/g, ")").replace(/^\(/, "[").replace(/\)$/, "]")}\ntext = ''\nfor _ in range(4):\n    text += ''.join(grid[a][b] for a, b in sorted(holes))\n    holes = [(b, 3 - a) for a, b in holes]\nprint(text)`)}<p><b>Ответ:</b> ${msg}</p>`,
      };
    },
  });

  G.push({
    id: "ciph_table", topic: "ciphers", title: "Таблица символов",
    make(r) {
      const words = ["password", "firewall", "kerberos", "security", "protocol", "malware", "keylogger", "honeypot", "checksum", "exploit", "botnet", "sandbox", "backdoor", "phishing", "rootkit", "spyware"];
      for (;;) {
        const w = r.pick(words);
        const a = r.int(1, 15), b = r.int(1, 15);
        const dx = (((b * b - a) % 16) + 16) % 16, dy = (((a * a - b) % 16) + 16) % 16;
        const x0 = r.int(0, 15), y0 = r.int(0, 15);
        const path = [...w].map((_, i) => [(x0 + i * dx) % 16, (y0 + i * dy) % 16]);
        if (new Set(path.map((p) => p.join())).size !== w.length) continue;
        const grid = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => "abcdefghijklmnopqrstuvwxyz"[r.int(0, 25)]));
        path.forEach(([x, y], i) => { grid[y][x] = w[i]; });
        const read = (aa, bb) => { let x = x0, y = y0, s = ""; for (let i = 0; i < w.length; i++) { s += grid[y][x]; const nx = (((x - aa + bb * bb) % 16) + 16) % 16, ny = (((y - bb + aa * aa) % 16) + 16) % 16; x = nx; y = ny; } return s; };
        const cands = [[a, b]];
        while (cands.length < 4) { const c = [r.int(1, 15), r.int(1, 15)]; if (!cands.some((p) => p[0] === c[0] && p[1] === c[1]) && read(c[0], c[1]) !== w) cands.push(c); }
        const choices = r.shuffle(cands).map(([p, q]) => `a=${p}, b=${q}`);
        let tbl = '<div class="scroll"><table class="grid small"><tr><th></th>' + Array.from({ length: 16 }, (_, i) => `<th>${i}</th>`).join("") + "</tr>";
        grid.forEach((row, y) => { tbl += `<tr><th>${y}</th>` + row.map((c) => `<td>${c}</td>`).join("") + "</tr>"; });
        tbl += "</table></div>";
        return {
          html: `<p>В таблице символов спрятан пароль: первая буква стоит в клетке (x<sub>0</sub>, y<sub>0</sub>) = (${x0}, ${y0}), а координаты каждой следующей вычисляются по формулам</p><p class="formula">x<sub>i+1</sub> = (x<sub>i</sub> − a + b<sup>2</sup>) mod 16, &nbsp; y<sub>i+1</sub> = (y<sub>i</sub> − b + a<sup>2</sup>) mod 16</p><p>x — номер столбца, y — номер строки (с 0). Длина пароля — ${w.length} символов, пароль — осмысленное английское слово.</p>${tbl}<p>При каких a и b получается осмысленное слово?</p>`,
          answer: ans("choice", `a=${a}, b=${b}`, choices),
          solution: `<p>Проверяем все 4 варианта: идём по формуле ${w.length} шагов и читаем буквы. Только при a=${a}, b=${b} получается слово <b>${w}</b>.</p>${pre(`def read(grid, a, b, x, y, n):\n    s = ''\n    for _ in range(n):\n        s += grid[y][x]\n        x, y = (x - a + b*b) % 16, (y - b + a*a) % 16\n    return s`)}<p>${choices.map((c) => { const [p, q] = c.match(/\d+/g).map(Number); return `${c}: ${read(p, q)}`; }).join("<br>")}</p><p><b>Ответ:</b> a=${a}, b=${b}</p>`,
        };
      }
    },
  });

  const FREQ_TEXTS = [
    "ОТВЕТСТВЕННОСТЬ ЗА ЗАЩИТУ ИНФОРМАЦИИ ЛЕЖИТ НА КАЖДОМ СОТРУДНИКЕ ОРГАНИЗАЦИИ ПОЭТОМУ НИКОГДА НЕ СООБЩАЙТЕ СВОЙ ПАРОЛЬ ПОСТОРОННИМ И НЕ ОТКРЫВАЙТЕ ПОДОЗРИТЕЛЬНЫЕ ВЛОЖЕНИЯ ИЗ ПИСЕМ ОТ НЕЗНАКОМЫХ ОТПРАВИТЕЛЕЙ",
    "ПРОТОКОЛ ОБМЕНА ДАННЫМИ ДОЛЖЕН ОБЕСПЕЧИВАТЬ КОНФИДЕНЦИАЛЬНОСТЬ ЦЕЛОСТНОСТЬ И ДОСТУПНОСТЬ ИНФОРМАЦИИ ДЛЯ ЭТОГО ПРИМЕНЯЮТСЯ ШИФРОВАНИЕ КОНТРОЛЬНЫЕ СУММЫ И РЕЗЕРВНОЕ КОПИРОВАНИЕ",
    "ОПЕРАТОР ОБНАРУЖИЛ ПОДОЗРИТЕЛЬНУЮ АКТИВНОСТЬ НА СЕРВЕРЕ ОКОЛО ПОЛУНОЧИ КТО ТО ПЫТАЛСЯ ПОДОБРАТЬ ПАРОЛЬ АДМИНИСТРАТОРА ПОСЛЕ ЧЕГО СИСТЕМА ЗАЩИТЫ ЗАБЛОКИРОВАЛА ВХОД С ЭТОГО АДРЕСА",
    "СТАРЫЙ КРИПТОГРАФ ГОВОРИЛ ЧТО ХОРОШИЙ ШИФР ДОЛЖЕН ОСТАВАТЬСЯ СТОЙКИМ ДАЖЕ ТОГДА КОГДА ПРОТИВНИКУ ИЗВЕСТЕН АЛГОРИТМ ТАЙНОЙ ДОЛЖЕН ОСТАВАТЬСЯ ТОЛЬКО КЛЮЧ ЭТО ПРАВИЛО НАЗЫВАЮТ ПРИНЦИПОМ КЕРКГОФФСА",
  ];
  G.push({
    id: "ciph_freq", topic: "ciphers", title: "Частотный анализ",
    make(r) {
      const t = r.pick(FREQ_TEXTS), k = r.int(3, 29);
      const c = shiftStr(t, k, RU32);
      const cnt = {};
      for (const ch of c) if (RU32.includes(ch)) cnt[ch] = (cnt[ch] || 0) + 1;
      const top = Object.entries(cnt).sort((x, y) => y[1] - x[1]).slice(0, 5);
      return {
        html: `<p>Перехвачен длинный текст, зашифрованный шифром сдвига на неизвестный ключ k (каждая буква сдвинута на k позиций вперёд; алфавит — 32 буквы без Ё, А = 0):</p>${pre(c)}<p>Найдите ключ k (число от 1 до 31).</p>`,
        answer: ans("number", k),
        solution: `<p>Считаем частоты букв шифртекста. Самые частые: ${top.map(([ch, n]) => `${ch} (${n})`).join(", ")}. В русском тексте чаще всего встречается О. Предполагаем, что ${top[0][0]} — это О: k = (${RU32.indexOf(top[0][0])} − ${RU32.indexOf("О")}) mod 32 = ${(RU32.indexOf(top[0][0]) - RU32.indexOf("О") + 32) % 32}. Проверяем расшифровкой — если текст осмысленный, ключ найден (иначе пробуем Е, А, И).</p>${pre(`from collections import Counter\nA = '${RU32}'\nc = '''${c}'''\nprint(Counter(x for x in c if x in A).most_common(5))\nk = ${k}\nprint(''.join(A[(A.index(x) - k) % 32] if x in A else x for x in c))`)}<p><b>Ответ:</b> ${k}</p>`,
      };
    },
  });

  // ───────────────────────── BRUTE ─────────────────────────
  const ALPHS = [["только цифры", 10], ["строчные латинские буквы", 26], ["строчные и заглавные латинские буквы", 52], ["цифры и строчные латинские буквы", 36], ["цифры, строчные и заглавные латинские буквы", 62]];
  G.push({
    id: "brute_time", topic: "brute", title: "Время полного перебора",
    make(r) {
      for (;;) {
        const [name, N] = r.pick(ALPHS), L = r.int(4, 8);
        const speedMode = r.f() < 0.5;
        const speed = speedMode ? r.pick([1000, 5000, 20000, 100000, 1000000]) : null;
        const tms = speedMode ? null : r.pick([0.01, 0.02, 0.05, 0.1, 0.5, 1]);
        const total = Math.pow(N, L);
        const seconds = speedMode ? total / speed : (total * tms) / 1000;
        const hours = Math.ceil(seconds / 3600 - 1e-9);
        if (hours < 2 || hours > 200000 || !Number.isSafeInteger(total)) continue;
        return {
          html: `<p>Пароль состоит ровно из ${L} символов; используются ${name}. Злоумышленник перебирает все варианты, ${speedMode ? `проверяя ${speed.toLocaleString("ru")} паролей в секунду` : `тратя на проверку одного пароля ${String(tms).replace(".", ",")} мс`}.</p><p>За сколько часов гарантированно будет перебран весь набор паролей? Ответ округлите <b>вверх</b> до целого числа часов.</p>`,
          answer: ans("number", hours),
          solution: `<p>Всего паролей: ${N}<sup>${L}</sup> = ${total.toLocaleString("ru")}. Время: ${speedMode ? `${total.toLocaleString("ru")} / ${speed}` : `${total.toLocaleString("ru")} × ${tms} мс / 1000`} = ${seconds.toLocaleString("ru", { maximumFractionDigits: 2 })} с = ${(seconds / 3600).toLocaleString("ru", { maximumFractionDigits: 3 })} ч → вверх: ${hours}.</p>${pre(`import math\ntotal = ${N} ** ${L}\nseconds = ${speedMode ? `total / ${speed}` : `total * ${tms} / 1000`}\nprint(math.ceil(seconds / 3600))`)}<p><b>Ответ:</b> ${hours}</p>`,
        };
      }
    },
  });

  G.push({
    id: "brute_enum", topic: "brute", title: "Забывчивый сотрудник (номер в переборе)",
    make(r) {
      const A = "0123456789abcdefghijklmnopqrstuvwxyz";
      for (;;) {
        const L = r.pick([5, 6]);
        const startIdx = r.int(0, Math.pow(36, L) / 2);
        const t100 = r.pick([1, 2, 5, 10]); // сотые доли мс
        const D = r.int(20, 420); // минут
        const checks = Math.floor((D * 60000 * 100) / t100);
        const idx = startIdx + checks;
        if (idx >= Math.pow(36, L)) continue;
        const startP = toBase(startIdx, 36, L), res = toBase(idx, 36, L);
        const h0 = r.pick([9, 10, 11]);
        const end = new Date(2000, 0, 1, h0, D);
        const hhmm = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
        return {
          html: `<p>Сотрудник забыл пароль: ${L} символов из алфавита <code>${A}</code> (именно в таком порядке: 0 → 0, …, 9 → 9, a → 10, …, z → 35). Его программа перебирает пароли последовательно: после <code>${"0".repeat(L - 1)}9</code> идёт <code>${"0".repeat(L - 1)}a</code>, после <code>${"0".repeat(L - 2)}0z</code> — <code>${"0".repeat(L - 2)}10</code> и т. д.</p><p>Программа запущена ровно в ${h0}:00 и начала с пароля <code>${startP}</code>. Проверка одного пароля занимает ${String(t100 / 100).replace(".", ",")} мс; пароли проверяются без пауз.</p><p>Какой пароль проверяется в момент ${hhmm}:00?</p>`,
          answer: ans("text_ci", res),
          solution: `<p>Перебор — это счёт в 36-ричной системе. Номер стартового пароля: int('${startP}', 36) = ${startIdx}. За ${D} мин = ${D * 60000} мс проверено ${D * 60000} / ${t100 / 100} = ${checks} паролей полностью, и в этот момент проверяется пароль с номером ${startIdx} + ${checks} = ${idx}.</p>${pre(`A = '${A}'\nidx = int('${startP}', 36) + ${D} * 60000 * 100 // ${t100}\ns = ''\nfor _ in range(${L}):\n    s = A[idx % 36] + s\n    idx //= 36\nprint(s)`)}<p><b>Ответ:</b> ${res}</p>`,
        };
      }
    },
  });

  const PIN_RULES = [
    { t: "все цифры различны", f: (d) => new Set(d).size === d.length },
    { t: "первая цифра не 0", f: (d) => d[0] !== 0 },
    { t: "содержит хотя бы одну цифру 7", f: (d) => d.includes(7) },
    { t: "цифры идут строго по возрастанию", f: (d) => d.every((x, i) => i === 0 || x > d[i - 1]) },
    { t: "сумма цифр чётна", f: (d) => d.reduce((a, b) => a + b, 0) % 2 === 0 },
    { t: "никакие две соседние цифры не равны", f: (d) => d.every((x, i) => i === 0 || x !== d[i - 1]) },
    { t: "последняя цифра нечётная", f: (d) => d[d.length - 1] % 2 === 1 },
  ];
  G.push({
    id: "brute_pin", topic: "brute", title: "Сколько PIN-кодов",
    make(r) {
      const L = r.pick([4, 5]);
      const rules = r.sample(PIN_RULES, 2);
      let cnt = 0;
      for (let n = 0; n < Math.pow(10, L); n++) {
        const d = String(n).padStart(L, "0").split("").map(Number);
        if (rules.every((ru) => ru.f(d))) cnt++;
      }
      return {
        html: `<p>PIN-код состоит из ${L} цифр. Система принимает только коды, для которых одновременно: <b>${rules[0].t}</b> и <b>${rules[1].t}</b>.</p><p>Сколько существует допустимых PIN-кодов?</p>`,
        answer: ans("number", cnt),
        solution: `<p>Всего кодов 10<sup>${L}</sup> — перебор в Python занимает доли секунды (или считать по правилу произведения).</p>${pre(`from itertools import product\ncnt = 0\nfor d in product(range(10), repeat=${L}):\n    if (<условие 1>) and (<условие 2>):\n        cnt += 1\nprint(cnt)`)}<p><b>Ответ:</b> ${cnt}</p>`,
      };
    },
  });

  // ───────────────────────── SYSTEMS ─────────────────────────
  G.push({
    id: "sys_servers", topic: "systems", title: "Производительность системы",
    make(r) {
      for (;;) {
        const u = r.int(5, 30) * 10, t = r.int(5, 20) * 10, p = r.pick([2, 3, 4]), cp = r.pick([5, 10, 20]);
        const wdb = r.int(10, 40), wno = r.int(5, 30), cw = r.pick([20, 30, 40]), cdb = r.pick([50, 80, 100]);
        const sno = r.int(3, 15), sau = r.int(3, 15), ca = r.pick([100, 150, 200]), cs = r.pick([50, 100]);
        const Ldb = r.int(2, 10) * 10, Lau = r.int(1, 6) * 10, S = r.int(2, 4), P = r.pick([4000, 5000, 8000, 10000]);
        const total = (u + t * p) * cp + wdb * (cw + cdb) + wno * cw + sno * cs + sau * (ca + cs) + Ldb * (cw + cdb) + Lau * (ca + cs);
        const need = Math.ceil(total / P), add = need - S;
        if (add < 1 || add > 9) continue;
        return {
          html: `<p>Информационная система постоянно атакуется. Интенсивность атак:</p><ul><li>${u + t} сетевых атак в секунду: ${u} по UDP (1 пакет за атаку) и ${t} по TCP (${p} пакета за атаку);</li><li>${wdb + wno} ложных обращений к web-системе в секунду (${wdb} — с доступом к базе данных, ${wno} — без);</li><li>${sno + sau} системных атак в секунду (${sno} запросов без аутентификации, ${sau} — с аутентификацией).</li></ul><p>Затраты ресурсов:</p><ul><li>обработка сетевого пакета — ${cp} операций на пакет;</li><li>обращение к web-системе — ${cw} операций на запрос и дополнительно ${cdb} операций на взаимодействие с БД (при необходимости);</li><li>системный запрос — ${ca} операций на аутентификацию (если требуется) и ${cs} операций на обработку самого запроса.</li></ul><p>Система состоит из ${S} одинаковых серверов по ${P} операций в секунду каждый.</p><p>Какое минимальное количество серверов нужно <b>добавить</b>, чтобы система, находясь под атакой, обрабатывала ещё ${Ldb} легитимных запросов к web-системе с доступом к БД в секунду и ${Lau} системных запросов с аутентификацией в секунду?</p>`,
          answer: ans("number", add),
          solution: `<table class="mini"><tr><th>Что</th><th>Расчёт</th><th>Операций/с</th></tr>
<tr><td>Пакеты</td><td>(${u}·1 + ${t}·${p}) · ${cp}</td><td>${(u + t * p) * cp}</td></tr>
<tr><td>Web с БД (атака)</td><td>${wdb} · (${cw}+${cdb})</td><td>${wdb * (cw + cdb)}</td></tr>
<tr><td>Web без БД (атака)</td><td>${wno} · ${cw}</td><td>${wno * cw}</td></tr>
<tr><td>Системные без аут.</td><td>${sno} · ${cs}</td><td>${sno * cs}</td></tr>
<tr><td>Системные с аут.</td><td>${sau} · (${ca}+${cs})</td><td>${sau * (ca + cs)}</td></tr>
<tr><td>Легитимные web+БД</td><td>${Ldb} · (${cw}+${cdb})</td><td>${Ldb * (cw + cdb)}</td></tr>
<tr><td>Легитимные системные</td><td>${Lau} · (${ca}+${cs})</td><td>${Lau * (ca + cs)}</td></tr>
<tr><th colspan="2">Итого</th><th>${total}</th></tr></table>
<p>Нужно серверов: ⌈${total} / ${P}⌉ = ${need}. Уже есть ${S} → добавить ${add}.</p><p><b>Ответ:</b> ${add}</p>`,
        };
      }
    },
  });

  G.push({
    id: "sys_bandwidth", topic: "systems", title: "Канал под DDoS-атакой",
    make(r) {
      for (;;) {
        const C = r.pick([100, 200, 500, 1000]), A = r.int(5, 80) * 1000, B = r.pick([64, 128, 512, 1000, 1500]), U = r.pick([256, 512, 1000, 2000, 4000]);
        const free = C * 1e6 - A * B * 8;
        if (free <= 0) continue;
        const users = Math.floor(free / (U * 1000));
        if (users < 1) continue;
        return {
          html: `<p>Сервер подключён к сети каналом ${C} Мбит/с. Идёт DDoS-атака: ${A.toLocaleString("ru")} пакетов в секунду, каждый размером ${B} байт; весь трафик атаки проходит через канал.</p><p>Каждому легитимному пользователю нужна полоса ${U} кбит/с. Сколько пользователей <b>максимум</b> можно одновременно обслуживать во время атаки? (1 Мбит = 1000 кбит = 1 000 000 бит, 1 байт = 8 бит.)</p>`,
          answer: ans("number", users),
          solution: `<p>Трафик атаки: ${A} · ${B} · 8 = ${(A * B * 8).toLocaleString("ru")} бит/с. Свободно: ${(C * 1e6).toLocaleString("ru")} − ${(A * B * 8).toLocaleString("ru")} = ${free.toLocaleString("ru")} бит/с. Пользователей: ⌊${free} / ${U * 1000}⌋ = ${users} (округляем вниз — неполный пользователь не обслуживается).</p><p><b>Ответ:</b> ${users}</p>`,
        };
      }
    },
  });

  // ───────────────────────── STEGO ─────────────────────────
  const COVERS = [
    "the quick brown fox jumps over the lazy dog while the clever cat watches quietly from the old wooden fence and dreams about fresh fish for dinner tonight",
    "every morning the system administrator checks the server logs drinks a cup of strong coffee and reads the latest security news before starting the daily backup routine",
    "our team meets on friday afternoons to discuss new projects share interesting articles about cryptography and plan the next hackathon for students from local schools",
  ];
  G.push({
    id: "stego_case", topic: "stego", title: "Регистр букв",
    make(r) {
      const w = r.pick(NAMES.filter((x) => x.length <= 5));
      const bits = [...w].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join("");
      let cover = r.pick(COVERS), bi = 0, out = "";
      for (const ch of cover) {
        if (/[a-z]/.test(ch) && bi < bits.length) { out += bits[bi] === "1" ? ch.toUpperCase() : ch; bi++; }
        else out += ch;
      }
      return {
        html: `<p>Во внешне безобидном письме спрятано имя. Обратите внимание на странное написание:</p><blockquote>${out}</blockquote><p>Подсказка аналитика: «важны только первые ${bits.length} букв». Найдите спрятанное имя (регистр важен).</p>`,
        answer: ans("text_cs", w),
        solution: `<p>Регистр кодирует биты: заглавная = 1, строчная = 0. Берём первые ${bits.length} букв (пробелы пропускаем), режем по 8 бит → коды ASCII.</p>${pre(`text = '''${out}'''\nbits = ''.join('1' if c.isupper() else '0' for c in text if c.isalpha())[:${bits.length}]\nprint(''.join(chr(int(bits[i:i+8], 2)) for i in range(0, len(bits), 8)))`)}<p>Биты: ${bits.match(/.{8}/g).join(" ")}</p><p><b>Ответ:</b> ${w}</p>`,
      };
    },
  });

  G.push({
    id: "stego_lsb", topic: "stego", title: "Младшие биты пикселей",
    make(r) {
      const w = r.pick(NAMES.filter((x) => x.length <= 5));
      const bits = [...w].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join("");
      const vals = [...bits].map((b) => (r.int(40, 250) & ~1) | +b);
      return {
        html: `<p>Из изображения выписаны значения яркости первых ${vals.length} пикселей:</p>${pre(vals.join(" "))}<p>Есть подозрение, что в младших битах спрятано имя. Найдите его (регистр важен).</p>`,
        answer: ans("text_cs", w),
        solution: `<p>Младший бит: чётное значение → 0, нечётное → 1. Собираем по 8 бит, переводим в ASCII.</p>${pre(`vals = [${vals.join(", ")}]\nbits = ''.join(str(v & 1) for v in vals)\nprint(''.join(chr(int(bits[i:i+8], 2)) for i in range(0, len(bits), 8)))`)}<p><b>Ответ:</b> ${w}</p>`,
      };
    },
  });

  // ───────────────────────── NET ─────────────────────────
  G.push({
    id: "net_ip", topic: "net", title: "IP-адрес и маска",
    make(r) {
      const ip = [r.pick([10, 172, 192]), r.int(0, 255), r.int(0, 255), r.int(1, 254)];
      const pfx = r.int(20, 30);
      const num = ((ip[0] << 24) >>> 0) + (ip[1] << 16) + (ip[2] << 8) + ip[3];
      const mask = pfx === 0 ? 0 : (0xffffffff << (32 - pfx)) >>> 0;
      const net = (num & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
      const fmt = (x) => [x >>> 24, (x >>> 16) & 255, (x >>> 8) & 255, x & 255].join(".");
      const q = r.int(0, 2);
      const qs = ["адрес сети", "широковещательный адрес", "количество адресов, которые можно назначить узлам"];
      const hosts = Math.pow(2, 32 - pfx) - 2;
      const a = [fmt(net), fmt(bc), hosts][q];
      return {
        html: `<p>Узел имеет адрес <b>${ip.join(".")}/${pfx}</b> (маска ${fmt(mask)}).</p><p>Определите ${qs[q]}.</p>`,
        answer: q === 2 ? ans("number", hosts) : ans("text_ci", a),
        solution: `<p>Маска /${pfx}: первые ${pfx} бит — сеть, остальные ${32 - pfx} — узел. Адрес сети = IP AND маска = ${fmt(net)}; широковещательный (все биты узла = 1) = ${fmt(bc)}; узлов 2<sup>${32 - pfx}</sup> − 2 = ${hosts}.</p>${pre(`import ipaddress\nn = ipaddress.ip_network('${ip.join(".")}/${pfx}', strict=False)\nprint(n.network_address, n.broadcast_address, n.num_addresses - 2)`)}<p><b>Ответ:</b> ${a}</p>`,
      };
    },
  });

  G.push({
    id: "net_chmod", topic: "net", title: "Права доступа",
    make(r) {
      const d = [r.int(4, 7), r.int(0, 7), r.int(0, 7)];
      const sym = d.map((x) => (x & 4 ? "r" : "-") + (x & 2 ? "w" : "-") + (x & 1 ? "x" : "-")).join("");
      const toSym = r.f() < 0.5;
      return {
        html: toSym
          ? `<p>Права на файл заданы командой <code>chmod ${d.join("")} report.txt</code>. Запишите их в символьном виде из 9 знаков (как в выводе <code>ls -l</code>, например <code>rw-r-----</code>).</p>`
          : `<p>Команда <code>ls -l</code> показывает права файла: <code>${sym}</code>. Какое трёхзначное число нужно передать в <code>chmod</code>, чтобы установить такие права?</p>`,
        answer: toSym ? ans("text_cs", sym) : ans("text_ci", d.join("")),
        solution: `<p>Три группы: владелец, группа, остальные. В каждой r = 4, w = 2, x = 1. ${d.map((x, i) => `${["владелец", "группа", "остальные"][i]}: ${sym.slice(3 * i, 3 * i + 3)} = ${x}`).join("; ")}.</p><p><b>Ответ:</b> ${toSym ? sym : d.join("")}</p>`,
      };
    },
  });

  const LOGIC = [
    { t: "(a → b) ∧ (c ∨ d)", py: "((not a) or b) and (c or d)", f: (a, b, c, d) => (!a || b) && (c || d) },
    { t: "(a ∨ b) ≡ (c ∧ ¬d)", py: "(a or b) == (c and not d)", f: (a, b, c, d) => (a || b) === (c && !d) },
    { t: "¬(a ∧ b) ∨ (c ⊕ d)", py: "(not (a and b)) or (c != d)", f: (a, b, c, d) => !(a && b) || c !== d },
    { t: "(a ⊕ b) → (c ∧ d)", py: "(not (a != b)) or (c and d)", f: (a, b, c, d) => !(a !== b) || (c && d) },
    { t: "(a ∧ ¬b) ∨ (¬c ∧ d)", py: "(a and not b) or (not c and d)", f: (a, b, c, d) => (a && !b) || (!c && d) },
    { t: "(a → c) ∧ (b → d) ∧ ¬(a ∧ b)", py: "((not a) or c) and ((not b) or d) and not (a and b)", f: (a, b, c, d) => (!a || c) && (!b || d) && !(a && b) },
    { t: "(a ≡ b) ∨ (c → ¬d)", py: "(a == b) or ((not c) or (not d))", f: (a, b, c, d) => a === b || !c || !d },
    { t: "((a ∨ c) → b) ∧ (d ⊕ a)", py: "((not (a or c)) or b) and (d != a)", f: (a, b, c, d) => (!(a || c) || b) && d !== a },
  ];
  G.push({
    id: "net_logic", topic: "net", title: "Логическое выражение",
    make(r) {
      const e = r.pick(LOGIC);
      const wantTrue = r.f() < 0.6;
      let cnt = 0;
      for (let m = 0; m < 16; m++) { const v = [m & 8, m & 4, m & 2, m & 1].map(Boolean); if (!!e.f(...v) === wantTrue) cnt++; }
      return {
        html: `<p>Дано логическое выражение от четырёх переменных:</p><p class="formula">F = ${e.t}</p><p>Обозначения: ∧ — И, ∨ — ИЛИ, ¬ — НЕ, → — импликация, ≡ — эквивалентность, ⊕ — исключающее ИЛИ.</p><p>Для скольких наборов значений (a, b, c, d) выражение F ${wantTrue ? "истинно" : "ложно"}?</p>`,
        answer: ans("number", cnt),
        solution: `<p>Наборов всего 2<sup>4</sup> = 16 — перебираем все.</p>${pre(`from itertools import product\ncnt = 0\nfor a, b, c, d in product([False, True], repeat=4):\n    if ${wantTrue ? "" : "not ("}${e.py}${wantTrue ? "" : ")"}:\n        cnt += 1\nprint(cnt)`)}<p><b>Ответ:</b> ${cnt}</p>`,
      };
    },
  });

  window.GENERATORS = G;
  window.makeGen = function (genId, seed) {
    const g = G.find((x) => x.id === genId);
    const out = g.make(rng(seed));
    return Object.assign({ id: `gen:${genId}:${seed}`, title: g.title, topic: g.topic, generated: true }, out);
  };
})();
