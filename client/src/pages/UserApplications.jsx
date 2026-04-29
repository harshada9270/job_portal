import React, { useEffect, useState } from 'react'
import { API_BASE } from '../api'

export default function UserApplications({ token }) {
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      const res = await fetch(`${API_BASE}/api/applications/me`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    };

    fetchApplications();
  }, [token]);

  return (
    <div className="applications applications-page">
      <div className="card admin-hero">
        <div>
          <div className="eyebrow">Jobs Applied</div>
          <h3 style={{ margin: '6px 0 8px' }}>Your application history</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Track the jobs you have already applied to and check the current status of each application.</p>
        </div>
      </div>

      {message && <div className="msg success">{message}</div>}

      <div className="applications-list">
        {applications.length === 0 && <div className="empty-state card">No applications yet. Apply to a job to see it listed here.</div>}
        {applications.map(application => (
          <div key={application._id} className="applicant-card application-card">
            <div className="applicant-head">
              <div>
                <div className="application-title">{application.jobId && application.jobId.title ? application.jobId.title : 'Applied Job'}</div>
                <div className="muted-block">{application.jobId && application.jobId.company ? application.jobId.company : ''}</div>
              </div>
              <div className={`app-status ${application.status === 'accepted' || application.status === 'next_round' ? 'status-approved' : ''}`}>
                {application.status === 'accepted' ? 'approved' : application.status === 'next_round' ? 'next round' : application.status}
              </div>
            </div>

            <div className="applicant-body application-body">
              <div className="application-topline">
                <div className="score-block">
                  <span className="stat-label">Match score</span>
                  <span className="badge">{application.matchScore ?? 0}%</span>
                </div>
                <span className="fit-tag">{application.fitSuggestion || 'Low Fit'}</span>
              </div>
              <div className="progress"><div className="progress-fill" style={{ width: (application.matchScore ?? 0) + '%' }} /></div>
              <div className="application-details-grid">
                <div><strong>Skills:</strong> {(application.userSkills || []).join(', ') || 'N/A'}</div>
                <div><strong>Applied:</strong> {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div className="application-cover"><strong>Cover:</strong> {application.coverLetter || 'N/A'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
