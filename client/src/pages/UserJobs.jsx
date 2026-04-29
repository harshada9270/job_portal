import React, { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../api'

function calculateMatchScore(jobSkills, userSkills) {
  const normalize = value => String(value || '').trim().toLowerCase();
  const job = (jobSkills || []).map(normalize).filter(Boolean);
  const user = (userSkills || []).map(normalize).filter(Boolean);
  if (job.length === 0) return 0;

  let total = 0;
  for (const jobSkill of job) {
    if (user.includes(jobSkill)) {
      total += 20;
    } else if (user.some(userSkill => userSkill.includes(jobSkill) || jobSkill.includes(userSkill))) {
      total += 10;
    }
  }

  return Math.min(100, Math.round((total / (job.length * 20)) * 100));
}

export default function UserJobs({ token, view = 'jobs' }) {
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profileSkills, setProfileSkills] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recommendationSort, setRecommendationSort] = useState('desc');
  const [coverLetter, setCoverLetter] = useState('');
  const [message, setMessage] = useState('');
  const [lastScore, setLastScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setMessage('');
      setCoverLetter('');
      setLastScore(null);
      try {
        const profileRes = await fetch(`${API_BASE}/api/user/profile`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (!isMounted) return;
          setProfileSkills(Array.isArray(profile.skills) ? profile.skills : []);
          setSavedJobIds((Array.isArray(profile.savedJobs) ? profile.savedJobs : []).map(job => String(job._id || job)));
        }

        if (view === 'saved') {
          const savedRes = await fetch(`${API_BASE}/api/user/saved-jobs`, {
            headers: { Authorization: 'Bearer ' + token }
          });
          const savedData = savedRes.ok ? await savedRes.json() : [];
          if (!isMounted) return;
          const savedList = Array.isArray(savedData) ? savedData : [];
          setJobs(savedList);
          setSelected(savedList[0] || null);
        } else {
          const jobsRes = await fetch(`${API_BASE}/api/jobs`);
          const jobsData = jobsRes.ok ? await jobsRes.json() : [];
          const list = Array.isArray(jobsData) && jobsData.length > 0 ? jobsData : [
            { _id: 'd1', title: 'Frontend Developer', company: 'Acme Inc', description: 'Build UI components and improve UX', skills: ['React', 'CSS', 'HTML'] },
            { _id: 'd2', title: 'Backend Engineer', company: 'Beta LLC', description: 'Design APIs and microservices', skills: ['Node', 'Express', 'MongoDB'] },
            { _id: 'd3', title: 'Data Analyst', company: 'Gamma Co', description: 'Analyze datasets and build dashboards', skills: ['SQL', 'Python', 'Excel'] }
          ];
          if (!isMounted) return;
          setJobs(list);
          setSelected(list[0] || null);
          const recRes = await fetch(`${API_BASE}/api/jobs/recommendations`, {
            headers: { Authorization: 'Bearer ' + token }
          });
          const recData = recRes.ok ? await recRes.json() : [];
          if (!isMounted) return;
          setRecommended(Array.isArray(recData) ? recData : []);
        }
      } catch (error) {
        if (!isMounted) return;
        setJobs([]);
        setRecommended([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [token, view]);

  const currentSkills = useMemo(() => profileSkills.slice(), [profileSkills]);
  const previewScore = selected ? calculateMatchScore(selected.skills || [], currentSkills) : null;

  const sortedRecommendations = useMemo(() => {
    return [...recommended].sort((a, b) => {
      const left = a.recommendationScore || 0;
      const right = b.recommendationScore || 0;
      return recommendationSort === 'desc' ? right - left : left - right;
    });
  }, [recommended, recommendationSort]);

  const isSaved = (jobId) => savedJobIds.includes(String(jobId));

  const syncSavedJobs = async () => {
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) return;
    const data = await res.json();
    setSavedJobIds((Array.isArray(data.savedJobs) ? data.savedJobs : []).map(job => String(job._id || job)));
  };

  const toggleSavedJob = async (job) => {
    const jobId = String(job._id);
    const method = isSaved(jobId) ? 'DELETE' : 'POST';
    const res = await fetch(`${API_BASE}/api/user/saved-jobs/` + jobId, {
      method,
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || 'Unable to update saved jobs');
      return;
    }
    const savedList = Array.isArray(data.savedJobs) ? data.savedJobs : [];
    const nextIds = savedList.map(item => String(item._id || item));
    setSavedJobIds(nextIds);
    setMessage(data.message || (method === 'POST' ? 'Job saved' : 'Job removed from saved jobs'));
    if (view === 'saved') {
      setJobs(savedList);
      setSelected(prev => {
        if (prev && String(prev._id) === jobId) return savedList[0] || null;
        return prev;
      });
    }
    await syncSavedJobs();
  };

  const applyToSelected = async () => {
    if (!selected) return;
    setApplyingId(selected._id);
    try {
      const res = await fetch(`${API_BASE}/api/applications/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ jobId: selected._id, coverLetter })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Error applying');
        setLastScore(null);
      } else {
        setMessage('Applied successfully');
        setLastScore(data.matchScore);
      }
    } catch (error) {
      setMessage('Network error');
      setLastScore(null);
    } finally {
      setApplyingId(null);
    }
  };

  const displayedJobs = view === 'saved' ? jobs : jobs;

  return (
    <div className="job-browser">
      <div className="card admin-hero job-browser-hero">
        <div>
          <div className="eyebrow">Jobs Dashboard</div>
          <h3 style={{ margin: '6px 0 8px' }}>{view === 'saved' ? 'Saved jobs' : 'Browse and apply'}</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Open a job on the right, review the full description, then save or apply from the detail panel.</p>
        </div>
      </div>

      <div className="job-browser-layout">
        <div className="job-browser-list card">
          <div className="section-title">{view === 'saved' ? 'Saved Jobs' : 'Job Listings'}</div>
          {isLoading ? (
            <div className="loading"><div className="spinner" /> Loading jobs...</div>
          ) : (
            <div className="list">
              {displayedJobs.length === 0 && <div className="empty-state">No jobs found.</div>}
              {displayedJobs.map(job => {
                const saved = isSaved(job._id);
                return (
                  <div key={job._id} className={selected && String(selected._id) === String(job._id) ? 'job-card job-card-selected' : 'job-card'} onClick={() => setSelected(job)}>
                    <div className="card-top">
                      <div className="company-logo">{(job.company || ' ').split(' ').map(word => word[0]).slice(0, 2).join('')}</div>
                      <div className="job-meta">
                        <h4 style={{ margin: 0 }}>{job.title}</h4>
                        <div className="company-name">{job.company}</div>
                        <p style={{ marginTop: 8 }}>{job.description}</p>
                        <div className="job-tags">{(job.skills || []).slice(0, 4).map(skill => <span key={skill} className="tag">{skill}</span>)}</div>
                      </div>
                    </div>
                    <div className="job-footer">
                      <button className="btn btn-ghost" type="button" onClick={(e) => { e.stopPropagation(); setSelected(job); }}>View Details</button>
                      <button className={saved ? 'btn btn-secondary' : 'btn btn-primary'} type="button" onClick={(e) => { e.stopPropagation(); toggleSavedJob(job); }}>{saved ? 'Saved' : 'Save Job'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="job-browser-detail card">
          <div className="section-title">Job Description</div>
          {selected ? (
            <div className="detail detail-panel">
              <div className="detail-head">
                <div>
                  <h4 style={{ margin: '0 0 4px' }}>{selected.title}</h4>
                  <div className="company-name">{selected.company}</div>
                </div>
                <div className="detail-chip-row">
                  <span className="tag">{selected.postType || 'job'}</span>
                  <span className="tag">{selected.workMode || 'On-site'}</span>
                  <span className="tag">{selected.salaryRange || 'Salary not set'}</span>
                </div>
              </div>

              <p className="detail-description">{selected.description}</p>

              <div className="detail-grid">
                <div><strong>Employment:</strong> {selected.employmentType || 'N/A'}</div>
                <div><strong>Department:</strong> {selected.departmentRoleCategory || 'N/A'}</div>
                <div><strong>Location:</strong> {selected.location || 'N/A'}</div>
                <div><strong>Experience:</strong> {selected.experienceNeeded || 'N/A'}</div>
                <div><strong>Education:</strong> {selected.educationalBackground || 'N/A'}</div>
                <div><strong>Vacancies:</strong> {selected.vacanciesAvailable ?? 1}</div>
              </div>

              <div className="job-tags" style={{ marginTop: 12 }}>
                {(selected.skills || []).map(skill => <span key={skill} className="tag">{skill}</span>)}
              </div>

              {selected.aboutCompany && <div className="detail-company"><strong>About company:</strong> {selected.aboutCompany}</div>}
              <div className="profile-skill-note">Based on your profile skills: {profileSkills.join(', ') || 'No skills set'}</div>

              <textarea className="form-control" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Cover letter (optional)" />

              {previewScore !== null && currentSkills.length > 0 && (
                <div className="score-wrap">
                  <div className="badge">Preview Match: {previewScore}%</div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: previewScore + '%' }} />
                  </div>
                </div>
              )}

              <div className="detail-actions">
                <button className="btn btn-secondary" type="button" onClick={() => toggleSavedJob(selected)}>{savedJobIds.includes(String(selected._id)) ? 'Remove Saved Job' : 'Save Job'}</button>
                <button className="btn btn-primary" type="button" onClick={applyToSelected} disabled={applyingId === selected._id}>{applyingId === selected._id ? 'Applying...' : 'Apply for Job'}</button>
              </div>

              {message && <div className={"msg " + (message.toLowerCase().includes('saved') || message.toLowerCase().includes('success') ? 'success' : 'error')}>{message}</div>}
              {lastScore !== null && (
                <div className="score-wrap">
                  <div className="badge">Applied Match Score: {lastScore}%</div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: lastScore + '%' }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">Select a job from the list to see the full description and apply controls here.</div>
          )}
        </div>
      </div>

      {view === 'jobs' && (
        <div className="recommended">
          <div className="recommended-head">
            <h4>Recommended Jobs</h4>
            <div className="recommendation-controls recommendation-chip-controls">
              <button type="button" className={recommendationSort === 'desc' ? 'active-filter pill-button recommendation-pill' : 'pill-button recommendation-pill'} onClick={() => setRecommendationSort('desc')}>Top match</button>
              <button type="button" className={recommendationSort === 'asc' ? 'active-filter pill-button recommendation-pill' : 'pill-button recommendation-pill'} onClick={() => setRecommendationSort('asc')}>Lower match</button>
            </div>
          </div>
          {recommended.length === 0 && <div className="empty-state">No recommendations yet. Update your profile skills to see suggestions.</div>}
          <div className="recommended-grid">
            {sortedRecommendations.map(job => {
              const score = job.recommendationScore ?? calculateMatchScore(job.skills || [], currentSkills);
              const saved = savedJobIds.includes(String(job._id));
              return (
                <div key={job._id} className="recommended-item recommended-card">
                  <div>
                    <div style={{ fontWeight: 700 }}>{job.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{job.company}</div>
                    <div className="job-tags" style={{ marginTop: 8 }}>
                      {(job.skills || []).slice(0, 3).map(skill => <span key={skill} className="tag">{skill}</span>)}
                    </div>
                  </div>
                  <div className="recommended-actions">
                    <div className="match-badge">{score}%</div>
                    <div className="recommended-buttons">
                      <button className="btn btn-ghost" type="button" onClick={() => setSelected(job)}>View</button>
                      <button className={saved ? 'btn btn-secondary' : 'btn btn-primary'} type="button" onClick={() => toggleSavedJob(job)}>{saved ? 'Saved' : 'Save'}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
