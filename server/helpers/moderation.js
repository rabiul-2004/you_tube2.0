const BAD_WORDS = [
  "anal",
  "anilingus",
  "anus",
  "arse",
  "asshole",
  "bastard",
  "bitch",
  "bollock",
  "boob",
  "bullshit",
  "clit",
  "cock",
  "crap",
  "cunt",
  "dick",
  "dildo",
  "douche",
  "dumbass",
  "erotic",
  "escort",
  "fag",
  "faggot",
  "fuck",
  "fucker",
  "fucking",
  "goddamn",
  "handjob",
  "hoe",
  "hooker",
  "horney",
  "horny",
  "incest",
  "jerk off",
  "jerkoff",
  "jizz",
  "kike",
  "kill yourself",
  "kys",
  "milf",
  "motherfucker",
  "naked",
  "nazi",
  "negro",
  "nigga",
  "nigger",
  "nudes",
  "orgasm",
  "orgy",
  "penis",
  "porn",
  "porno",
  "prick",
  "pube",
  "pussy",
  "queer",
  "rape",
  "rapist",
  "retard",
  "retarded",
  "scrotum",
  "semen",
  "sex",
  "sexchat",
  "shag",
  "shit",
  "shitty",
  "slut",
  "smut",
  "spic",
  "tit",
  "titties",
  "tranny",
  "twat",
  "vagina",
  "wank",
  "whore",
  "wtf",
];

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const squish = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

const vowelless = (text) => text.replace(/[aeiou]/g, "");

const exactSet = new Set(BAD_WORDS);
const squishSet = new Set(BAD_WORDS.map(squish));
const vowelSet = new Set(
  BAD_WORDS.map(vowelless).filter((w) => w.length >= 2)
);

const isMaskedBadWord = (token) => {
  const s = squish(token);
  if (!s) return false;
  if (exactSet.has(s) || squishSet.has(s)) return true;
  const v = vowelless(s);
  return v.length >= 2 && vowelSet.has(v);
};

// tokens like "f*ck", "b!tch", "d.i.c.k" — alphanumerics glued by symbols
// (apostrophes ignored so contractions like "can't" stay normal words)
const MASKED_TOKEN_RE = /[a-z0-9]+(?:[^a-z0-9'\s]+[a-z0-9]+)*/g;

const runHasBadWord = (joined) => {
  const j = squish(joined);
  if (!j || j.length < 3) return false;
  for (let i = 0; i < j.length; i++) {
    for (let len = Math.min(j.length - i, 12); len >= 3; len--) {
      const sub = j.slice(i, i + len);
      if (exactSet.has(sub) || vowelSet.has(sub)) return true;
    }
  }
  return false;
};

export function checkComment(text) {
  const raw = (text || "").trim();
  if (!raw) {
    return { ok: false, reason: "Comment cannot be empty" };
  }
  if (raw.length > 1000) {
    return { ok: false, reason: "Comment is too long (max 1000 characters)" };
  }

  const flat = normalize(raw);
  const words = flat.split(" ").filter(Boolean);

  // plain whole words only — exact match (no fuzzy, avoids false positives
  // like "can't"/"count"/"dock"/"rap" colliding with stripped bad words)
  if (words.some((w) => exactSet.has(w))) {
    return { ok: false, reason: "Your comment contains inappropriate language" };
  }
  // masked words ("f*ck" -> "fuck", "sh!t" -> "sht") — fuzzy forms allowed
  // here because the separators prove it is not a normal word
  const maskedTokens = raw.toLowerCase().replace(/'/g, "").match(MASKED_TOKEN_RE) || [];
  if (maskedTokens.some((t) => /[^a-z0-9]/.test(t) && isMaskedBadWord(t))) {
    return { ok: false, reason: "Your comment contains inappropriate language" };
  }
  // letter-separated words ("f u c k", "fu ck", "a f u c k ing") — scan
  // substrings of joined short-token runs
  let run = [];
  for (const w of [...words, ""]) {
    if (w.length > 0 && w.length <= 2) {
      run.push(w);
      continue;
    }
    if (run.length >= 2 && runHasBadWord(run.join(""))) {
      return { ok: false, reason: "Your comment contains inappropriate language" };
    }
    run = [];
  }
  // multi-word phrases ("jerk off")
  for (let i = 0; i < words.length; i++) {
    for (let j = 2; j <= 3 && i + j <= words.length; j++) {
      if (exactSet.has(words.slice(i, i + j).join(" "))) {
        return { ok: false, reason: "Your comment contains inappropriate language" };
      }
    }
  }

  if (/(.)\1{4,}/.test(raw)) {
    return { ok: false, reason: "Please avoid repeating the same character over and over" };
  }
  if (/([!?@#$%^&*_.\-~=+])\1{2,}/.test(raw)) {
    return { ok: false, reason: "Please avoid repeating special characters" };
  }

  const letters = raw.replace(/[^a-zA-Z]/g, "");
  if (
    letters.length > 10 &&
    letters.replace(/[^A-Z]/g, "").length / letters.length > 0.7
  ) {
    return { ok: false, reason: "Please turn off caps lock before commenting" };
  }

  if (/(https?:\/\/|www\.)\S+/i.test(raw)) {
    return { ok: false, reason: "Links are not allowed in comments" };
  }

  if (/\b(\w+)(\s+\1){3,}\b/i.test(raw)) {
    return { ok: false, reason: "Please avoid repeating the same word too many times" };
  }

  if (/\b\w+\b/.test(flat)) {
    const uniq = new Set(words);
    if (words.length >= 8 && uniq.size <= 2) {
      return { ok: false, reason: "This looks like spam" };
    }
  }

  return { ok: true, reason: null };
}

export default checkComment;
