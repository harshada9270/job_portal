import React, { useEffect, useState } from 'react'
import { API_BASE } from '../api'

function calculateMatchScore(jobSkills, userSkills) {
  const normalize = s => String(s || '').trim().toLowerCase();
  const job = (jobSkills || []).map(normalize).filter(Boolean);
  const user = (userSkills || []).map(normalize).filter(Boolean);
  if (job.length === 0) return 0;

  let total = 0;
  for (const j of job) {
    if (user.includes(j)) {
      total += 20;
    } else {
      const partial = user.some(u => u.includes(j) || j.includes(u));
      if (partial) total += 10;
    }
  }
  const maxTotal = job.length * 20;
  return Math.min(100, Math.round((total / maxTotal) * 100));
}

export default function Jobs({ token, user }){
  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cover, setCover] = useState('');
  const [profileSkills, setProfileSkills] = useState([]);
  const [msg, setMsg] = useState('');
  const [lastScore, setLastScore] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [recommendationSort, setRecommendationSort] = useState('desc');
  const [applyingId, setApplyingId] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', company: '', description: '', skills: '' });
  const [editVacancies, setEditVacancies] = useState('');

  useEffect(()=>{ fetchJobs(); fetchProfile(); fetchRecommendations(); },[]);

  const fetchJobs = async ()=>{
    setIsLoadingJobs(true);
    try{
      const res = await fetch(`${API_BASE}/api/jobs`);
      if (!res.ok) throw new Error('fetch-failed');
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('no-data');
      setJobs(data);
    }catch(e){
      setJobs([
        { _id:'d1', title:'Frontend Developer', company:'Acme Inc', description:'Build UI components and improve UX', skills:['React','CSS','HTML'] },
        { _id:'d2', title:'Backend Engineer', company:'Beta LLC', description:'Design APIs and microservices', skills:['Node','Express','MongoDB'] },
        { _id:'d3', title:'Data Analyst', company:'Gamma Co', description:'Analyze datasets and build dashboards', skills:['SQL','Python','Excel'] }
      ]);
    } finally { setIsLoadingJobs(false) }
  }

  const fetchProfile = async () => {
    try{
      const res = await fetch(`${API_BASE}/api/user/profile`, { headers: { Authorization: 'Bearer '+token } });
      if (!res.ok) return;
      const data = await res.json();
      setProfileSkills(Array.isArray(data.skills) ? data.skills : []);
    }catch(e){ /* ignore */ }
  }

  const fetchRecommendations = async () => {
    try{
      const res = await fetch(`${API_BASE}/api/jobs/recommendations`, { headers: { Authorization: 'Bearer '+token } });
      if (!res.ok) throw new Error('no-recs');
      const data = await res.json();
      setRecommended(data);
    }catch(e){
      setRecommended([]);
    }
  }

  const apply = async () =>{
    if (!selected) return;
    setApplyingId(selected._id);
    try{
      const res = await fetch(`${API_BASE}/api/applications/apply`, {
        method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify({ jobId: selected._id, coverLetter: cover })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.message || 'Error applying');
        setLastScore(null);
      } else {
        setMsg('Applied successfully');
        setLastScore(data.matchScore);
        fetchRecommendations();
      }
    }catch(e){ setMsg('Network error'); setLastScore(null) }
    finally{ setApplyingId(null) }
  }

  const applyToJob = async (job) => {
    setSelected(job);
    setApplyingId(job._id);
    try{
      const res = await fetch(`${API_BASE}/api/applications/apply`, {
        method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify({ jobId: job._id, coverLetter: '' })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.message || 'Error applying');
      } else {
        setMsg('Applied successfully');
        setLastScore(data.matchScore);
        fetchRecommendations();
      }
    }catch(e){ setMsg('Network error') }
    finally{ setApplyingId(null) }
  }

  const startEditJob = (job) => {
    setEditJob(job);
    setEditForm({
      title: job.title || '',
      company: job.company || '',
      description: job.description || '',
      skills: (job.skills || []).join(', ')
    });
    setEditVacancies(String(job.vacanciesAvailable ?? 1));
  }

  const saveJob = async () => {
    if (!editJob) return;
    const res = await fetch(`${API_BASE}/api/jobs/` + editJob._id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        title: editForm.title,
        company: editForm.company,
        description: editForm.description,
          skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
          vacanciesAvailable: editVacancies
      })
    });
    if (res.ok) {
      setEditJob(null);
      fetchJobs();
    }
  }

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    await fetch(`${API_BASE}/api/jobs/` + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    fetchJobs();
  }

  if (user.role === 'admin') {
    return (
      <div className="jobs admin-jobs">
        <div className="card admin-hero">
          <div>
            <div className="eyebrow">Jobs Posted</div>
            <h3 style={{ margin: '6px 0 8px' }}>Manage job listings</h3>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Edit or delete the roles you have posted.</p>
          </div>
        </div>

        <div className="jobs-posted-list">
          {jobs.length === 0 && <div className="card muted-block">No jobs posted yet.</div>}
          {jobs.map(job => (
            <div key={job._id} className="card posted-job-card">
              <div className="posted-job-main">
                <div className="company-logo job-logo-small">{(job.company || ' ').split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                <div className="posted-job-copy">
                  <h4>{job.title}</h4>
                  <div className="company-name">{job.company}</div>
                  <div className="job-meta-line">{job.postType || 'job'} • {job.employmentType || 'Full-time'} • {job.workMode || 'On-site'}</div>
                  <div className="job-meta-line">{job.location || 'Location not set'} • Vacancies: {job.vacanciesAvailable ?? 1}</div>
                  <div className="job-tags">
                    {(job.skills || []).slice(0, 4).map(skill => <span key={skill} className="tag">{skill}</span>)}
                  </div>
                </div>
              </div>
              <div className="posted-job-footer">
                <button className="btn btn-secondary" onClick={() => startEditJob(job)}>Edit</button>
                <button className="btn btn-ghost" onClick={() => deleteJob(job._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {editJob && (
          <div className="card" style={{marginTop:12}}>
            <div className="section-title">Edit Job</div>
            <input className="form-control" value={editForm.title} onChange={e=>setEditForm({...editForm, title: e.target.value})} placeholder="Job title" />
            <input className="form-control" value={editForm.company} onChange={e=>setEditForm({...editForm, company: e.target.value})} placeholder="Company" />
            <input className="form-control" value={editForm.skills} onChange={e=>setEditForm({...editForm, skills: e.target.value})} placeholder="Skills" />
            <input className="form-control" type="number" min="1" value={editVacancies} onChange={e=>setEditVacancies(e.target.value)} placeholder="Vacancies available" />
            <textarea className="form-control" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})} placeholder="Description" rows={5} />
            <div className="row-actions">
              <button className="btn btn-primary" onClick={saveJob}>Save Changes</button>
              <button className="btn btn-ghost" onClick={()=>setEditJob(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const currentUserSkills = profileSkills.slice();
  const previewScore = selected ? calculateMatchScore(selected.skills || [], currentUserSkills) : null;

  const sortedRecommendations = [...recommended].sort((a, b) => {
    return recommendationSort === 'desc'
      ? (b.recommendationScore || 0) - (a.recommendationScore || 0)
      : (a.recommendationScore || 0) - (b.recommendationScore || 0);
  });

  return (
    <div className="jobs">
      <h3>Jobs</h3>
      <div className="card">
        {isLoadingJobs ? (
          <div className="loading"><div className="spinner"/> Loading jobs...</div>
        ) : (
          <div className="list">
              {jobs.map(j=> (
                <div key={j._id} className="job-card">
                  <div className="card-top">
                    <div className="company-logo">{(j.company||' ').split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
                    <div className="job-meta">
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <h4 style={{margin:0}}>{j.title}</h4>
                      </div>
                      <div className="company-name">{j.company}</div>
                      <p style={{marginTop:8}}>{j.description}</p>
                      <div className="job-tags">{(j.skills||[]).map(s=> <div key={s} className="tag">{s}</div>)}</div>
                    </div>
                  </div>
                  <div className="job-footer">
                            <button className="btn-ghost" onClick={()=>{ setSelected(j); setMsg('') }}>Details</button>
                            <button className="btn btn-primary" onClick={()=>applyToJob(j)} disabled={applyingId === j._id}>{applyingId === j._id ? 'Applying...' : 'Apply Now'}</button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

        
      {selected && (
        <div className="detail card" style={{marginTop:12}}>
          <h4>{selected.title}</h4>
          <p>{selected.description}</p>
          <p><strong>Skills:</strong> {selected.skills && selected.skills.join(', ')}</p>
          {user.role === 'user' && (
            <div>
              <div className="profile-skill-note">Based on your profile skills: {profileSkills.join(', ') || 'No skills set'}</div>
              <textarea className="form-control" value={cover} onChange={e=>setCover(e.target.value)} placeholder="Cover letter (optional)" />
              {previewScore !== null && currentUserSkills.length > 0 && (
                <div className="score-wrap">
                  <div className="badge">Preview Match: {previewScore}%</div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: previewScore + '%' }} />
                  </div>
                </div>
              )}
              <div style={{marginTop:10}}>
                <button className="btn btn-primary" onClick={apply} disabled={applyingId === selected?._id}>{applyingId === selected?._id ? 'Applying...' : 'Apply'}</button>
                <button className="btn btn-ghost" style={{marginLeft:8}} onClick={()=>{ setSelected(null); setMsg('') }}>Close</button>
              </div>
              {msg && <div className={"msg "+(msg.toLowerCase().includes('success') ? 'success' : 'error')}>{msg}</div>}
              {lastScore !== null && (
                <div className="score-wrap">
                  <div className="badge">Applied Match Score: {lastScore}%</div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: lastScore + '%' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {user.role === 'user' && (
        <div className="recommended">
          <h4>Recommended Jobs</h4>
          <div className="recommendation-controls">
            <button
              className={recommendationSort === 'desc' ? 'active-filter' : ''}
              onClick={()=>setRecommendationSort('desc')}
            >
              Top match first
            </button>
            <button
              className={recommendationSort === 'asc' ? 'active-filter' : ''}
              onClick={()=>setRecommendationSort('asc')}
            >
              Lowest match first
            </button>
          </div>
          {recommended.length === 0 && <div>No recommendations yet. Update your profile skills to see suggestions.</div>}
          <div className="recommended-grid">
            {sortedRecommendations.map(job => {
              const score = job.recommendationScore ?? calculateMatchScore(job.skills||[], currentUserSkills);
              return (
                <div key={job._id} className="recommended-item">
                  <div>
                    <div style={{fontWeight:700}}>{job.title}</div>
                    <div style={{fontSize:13, color:'var(--muted)'}}>{job.company}</div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6}}>
                    <div className="match-badge">{score}%</div>
                    <div style={{width:80}}>
                      <div className="progress">
                        <div className="progress-fill" style={{ width: score + '%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
