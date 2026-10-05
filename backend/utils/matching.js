// Match score (0-100): skills 40 + level 15 + rating 15 + language 15 + learning mode 15
const RANK = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
const norm = s => String(s).trim().toLowerCase();

function overlap(teachers, wanters) {
  const out = [];
  for (const w of wanters) {
    const t = teachers.find(t => norm(t.name) === norm(w.name));
    if (t) out.push({ skill: t.name, teachLevel: t.level, wantLevel: w.level });
  }
  return out;
}

function score(me, other) {
  const iTeach = overlap(me.skillsTeach, other.skillsWant);
  const theyTeach = overlap(other.skillsTeach, me.skillsWant);
  if (!iTeach.length && !theyTeach.length) return null;
  const mutual = iTeach.length > 0 && theyTeach.length > 0;
  const all = [...iTeach, ...theyTeach];

  const skills = mutual ? 40 : 20;
  const ok = all.filter(m => RANK[m.teachLevel] >= RANK[m.wantLevel]).length;
  const level = Math.round(15 * ok / all.length);
  const rating = other.ratingCount ? Math.round(15 * other.ratingAvg / 5) : 8;
  const mine = me.languages.map(norm);
  const sharedLanguages = other.languages.filter(l => mine.includes(norm(l)));
  const language = sharedLanguages.length ? 15 : 0;
  let mode = 0;
  const a = me.learningMode, b = other.learningMode;
  if (a === 'both' || b === 'both' || a === b) {
    const inPerson = a === 'offline' || b === 'offline';
    const sameCity = me.city && other.city && norm(me.city) === norm(other.city);
    mode = inPerson && !sameCity ? 5 : 15;
  }
  const total = Math.min(100, skills + level + rating + language + mode);
  return {
    score: total,
    type: mutual && total >= 70 ? 'strong' : 'partial',
    mutual,
    iTeach: iTeach.map(m => m.skill),
    theyTeach: theyTeach.map(m => m.skill),
    sharedLanguages,
    breakdown: { skills, level, rating, language, mode }
  };
}
module.exports = { score, norm };
