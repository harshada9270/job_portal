function normalizeSkill(skill) {
  return String(skill || '').trim().toLowerCase();
}

function uniqueNormalized(skills) {
  return [...new Set((skills || []).map(normalizeSkill).filter(Boolean))];
}

function calculateMatchScore(jobSkills, userSkills) {
  // Scoring per requirement: exact match = +20, partial match = +10
  const job = uniqueNormalized(jobSkills);
  const user = uniqueNormalized(userSkills);
  if (job.length === 0) return 0;

  let total = 0;
  for (const j of job) {
    let added = 0;
    if (user.includes(j)) {
      added = 20;
    } else {
      // partial match: any user skill contains job skill or vice versa
      const partial = user.some(u => u.includes(j) || j.includes(u));
      if (partial) added = 10;
    }
    total += added;
  }

  const maxTotal = job.length * 20;
  const score = Math.round((total / maxTotal) * 100);
  return Math.min(100, Math.max(0, score));
}

function fitSuggestionFromScore(score) {
  if (score >= 70) return 'Good Fit';
  if (score >= 40) return 'Average';
  return 'Low Fit';
}

module.exports = {
  calculateMatchScore,
  fitSuggestionFromScore
};
