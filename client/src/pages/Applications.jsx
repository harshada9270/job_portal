import React, { useEffect, useState } from 'react'
import { API_BASE } from '../api'

export default function Applications({ token, user }){
  const [apps, setApps] = useState([]);
  const [fitFilter, setFitFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(()=>{ if (user.role === 'admin') { fetchJobs(); } fetchApps() },[]);

  const fetchJobs = async () => {
    const res = await fetch(`${API_BASE}/api/jobs`);
    const data = await res.json();
    setJobs(Array.isArray(data) ? data : []);
  }

  const fetchApps = async ()=>{
    if (user.role === 'admin'){
      const jobsRes = jobs.length ? { json: async ()=>jobs } : await fetch(`${API_BASE}/api/jobs`);
      const jobList = jobs.length ? jobs : await jobsRes.json();
      let all = [];
      for (const j of jobList){
        const res = await fetch(`${API_BASE}/api/applications/job/`+j._id, { headers: { Authorization: 'Bearer '+token } });
        const data = await res.json();
        all = all.concat(data.map(a=>({ ...a, jobTitle: j.title, jobIdRef: j._id })));
      }
      setApps(all);
    } else {
      const res = await fetch(`${API_BASE}/api/applications/me`, { headers: { Authorization: 'Bearer '+token } });
      setApps(await res.json());
    }
  }

  const updateStatus = async (id, status)=>{
    const res = await fetch(`${API_BASE}/api/applications/`+id+`/status`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ status }) });
    if (!res.ok) return;
    if (status === 'rejected') {
      setApps(prev => prev.filter(app => app._id !== id));
    } else {
      setApps(prev => prev.map(app => app._id === id ? { ...app, status } : app));
    }
    setMessage(status === 'accepted' ? 'Applicant approved' : status === 'next_round' ? 'Applicant moved to next round' : 'Applicant rejected');
  }

  const filteredApps = user.role === 'admin'
    ? apps.filter(app => (fitFilter === 'all' || (app.fitSuggestion || 'Low Fit') === fitFilter) && (selectedJob === 'all' || app.jobIdRef === selectedJob))
    : apps;

  const totalApplications = apps.length;
  const approvedApplications = apps.filter(app => app.status === 'accepted' || app.status === 'next_round').length;
  const pendingApplications = apps.filter(app => app.status === 'pending').length;

  return (
    <div className="applications admin-applications applications-page">
      <div className="card admin-hero">
        <div>
          <div className="eyebrow">Applications</div>
          <h3 style={{margin:'6px 0 8px'}}>Review applicants</h3>
          <p style={{margin:0, color:'var(--muted)'}}>Approve strong matches, move promising candidates to next round, or remove rejected applications from the list.</p>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="applications-stats">
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{totalApplications}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">Approved / Next Round</div>
            <div className="stat-value">{approvedApplications}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{pendingApplications}</div>
          </div>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="filter-bar card">
          <div className="filter-group">
            <label className="filter-label">Job</label>
            <select className="form-control" value={selectedJob} onChange={e=>setSelectedJob(e.target.value)}>
              <option value="all">All jobs</option>
              {jobs.map(job => <option key={job._id} value={job._id}>{job.title}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Fit score</label>
            <div className="fit-filters">
              <button type="button" className={fitFilter === 'all' ? 'active-filter pill-button' : 'pill-button'} onClick={()=>setFitFilter('all')}>All</button>
              <button type="button" className={fitFilter === 'Good Fit' ? 'active-filter pill-button' : 'pill-button'} onClick={()=>setFitFilter('Good Fit')}>Good Fit</button>
              <button type="button" className={fitFilter === 'Average' ? 'active-filter pill-button' : 'pill-button'} onClick={()=>setFitFilter('Average')}>Average</button>
              <button type="button" className={fitFilter === 'Low Fit' ? 'active-filter pill-button' : 'pill-button'} onClick={()=>setFitFilter('Low Fit')}>Low Fit</button>
            </div>
          </div>
        </div>
      )}
      {filteredApps.length === 0 && <div className="empty-state card">No applications match the current filter.</div>}
      {message && <div className="msg success">{message}</div>}
      <div className="applications-list">
        {filteredApps.map(a=> (
          <div key={a._id} className="applicant-card application-card">
            <div className="applicant-head">
              <div>
                <div className="application-title">{a.jobTitle || (a.jobId && a.jobId.title)}</div>
                <div className="muted-block">Applicant: {(a.userId && a.userId.name) || (a.userId && a.userId.email)}</div>
              </div>
              <div className={`app-status ${a.status === 'accepted' || a.status === 'next_round' ? 'status-approved' : ''}`}>
                {a.status === 'accepted' ? 'approved' : a.status === 'next_round' ? 'next round' : a.status}
              </div>
            </div>

            <div className="applicant-body application-body">
              <div className="application-topline">
                <div className="score-block">
                  <span className="stat-label">Match score</span>
                  <span className="badge">{a.matchScore ?? 0}%</span>
                </div>
                <span className="fit-tag">{a.fitSuggestion || 'Low Fit'}</span>
              </div>
              <div className="progress"><div className="progress-fill" style={{ width: (a.matchScore ?? 0) + '%' }} /></div>
              <div className="application-details-grid">
                <div><strong>Skills:</strong> {(a.userSkills || []).join(', ') || 'N/A'}</div>
                <div><strong>Resume:</strong> {a.userId && a.userId.resumeUrl ? <a href={a.userId.resumeUrl} target="_blank" rel="noreferrer">Open Resume</a> : 'N/A'}</div>
              </div>
              <div className="application-cover"><strong>Cover:</strong> {a.coverLetter || 'N/A'}</div>
            </div>

            {user.role === 'admin' && a.status !== 'accepted' && a.status !== 'next_round' && (
              <div className="row-actions application-actions">
                <button className="btn btn-secondary" onClick={()=>updateStatus(a._id, 'next_round')}>Next Round</button>
                <button className="btn btn-primary" onClick={()=>updateStatus(a._id, 'accepted')}>Approve</button>
                <button className="btn btn-ghost" onClick={()=>updateStatus(a._id, 'rejected')}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
