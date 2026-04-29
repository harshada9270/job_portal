import React, { useEffect, useState } from 'react'
import { API_BASE } from '../api'

function toSkillString(skills) {
  return Array.isArray(skills) ? skills.join(', ') : '';
}

function calculateCompleteness(profile) {
  const fields = [profile.name, profile.phone, profile.experience, profile.resumeUrl, ...(profile.skills || [])];
  const filled = fields.filter(Boolean).length;
  const total = 5;
  return Math.round((filled / total) * 100);
}

export default function Profile({ token, onProfileUpdate }) {
  const [profile, setProfile] = useState({ name: '', phone: '', skills: [], experience: '', resumeUrl: '', companyName: '', companyWebsite: '', role: 'user' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [skillInput, setSkillInput] = useState('');

  const fetchProfile = async () => {
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'Unable to load profile');
      return;
    }
    setProfile({
      name: data.name || '',
      phone: data.phone || '',
      skills: Array.isArray(data.skills) ? data.skills : [],
      experience: data.experience || '',
      resumeUrl: data.resumeUrl || '',
      companyName: data.companyName || '',
      companyWebsite: data.companyWebsite || '',
      role: data.role || 'user'
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const payload = { name: profile.name, phone: profile.phone, skills: profile.skills, experience: profile.experience };
    if (profile.role === 'admin') {
      payload.companyName = profile.companyName;
      payload.companyWebsite = profile.companyWebsite;
    }
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'Update failed');
      return;
    }
    setProfile(prev => ({
      ...prev,
      name: data.name || prev.name,
      phone: data.phone || prev.phone,
      skills: Array.isArray(data.skills) ? data.skills : prev.skills,
      experience: data.experience || prev.experience,
      resumeUrl: data.resumeUrl || prev.resumeUrl,
      companyName: data.companyName || prev.companyName,
      companyWebsite: data.companyWebsite || prev.companyWebsite,
      role: data.role || prev.role
    }));
    if (onProfileUpdate) {
      onProfileUpdate(prev => ({ ...prev, ...{
        name: data.name || prev.name,
        phone: data.phone || prev.phone,
        skills: data.skills || prev.skills,
        experience: data.experience || prev.experience,
        resumeUrl: data.resumeUrl || prev.resumeUrl
      }}));
    }
    setMessage('Profile saved');
  };

  const uploadResume = async (file) => {
    if (!file) return;
    if (!window.confirm('Upload this resume?')) return;
    setMessage('');
    setError('');
    const fd = new FormData();
    fd.append('resume', file);
    const res = await fetch(`${API_BASE}/api/user/profile/resume`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: fd
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'Upload failed');
      return;
    }
    setProfile(prev => ({ ...prev, resumeUrl: data.resumeUrl }));
    if (onProfileUpdate) onProfileUpdate(prev => ({ ...prev, resumeUrl: data.resumeUrl }));
    setMessage('Resume uploaded');
  };

  const addSkill = (value) => {
    const v = String(value || '').trim();
    if (!v) return;
    const parts = v.split(',').map(s=>s.trim()).filter(Boolean);
    setProfile(prev => ({ ...prev, skills: Array.from(new Set([...(prev.skills||[]), ...parts])) }));
    setSkillInput('');
  }

  const removeSkill = (skill) => {
    setProfile(prev => ({ ...prev, skills: (prev.skills||[]).filter(s => s !== skill) }));
  }

  const completeness = calculateCompleteness(profile);

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div>
            <div className="eyebrow">Profile</div>
            <h3 style={{margin:'6px 0 4px'}}>Admin company profile</h3>
            <div className="profile-completeness">Profile completeness: {completeness}%</div>
          </div>
          <div className="save-btn">
            <button className="btn btn-primary" onClick={saveProfile}>Save</button>
          </div>
        </div>

        <div className="profile-grid">
          <div>
            <section className="profile-section">
              <h4 style={{marginTop:0}}>Basic Info</h4>
              <div className="field-row">
                <input className="form-control" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Name" />
                <input className="form-control" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone" />
              </div>
            </section>

            {profile.role === 'admin' && (
              <section className="profile-section">
                <h4>Company Profile</h4>
                <div className="field-row">
                  <input className="form-control" value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} placeholder="Company Name" />
                  <input className="form-control" value={profile.companyWebsite} onChange={e => setProfile({ ...profile, companyWebsite: e.target.value })} placeholder="Company Website (https://)" />
                </div>
              </section>
            )}

            {profile.role !== 'admin' && (
              <section className="profile-section">
                <h4>Resume</h4>
                <div className="resume-actions">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={e => uploadResume(e.target.files[0])} />
                  {profile.resumeUrl && (
                    <div>
                      <a href={profile.resumeUrl} target="_blank" rel="noreferrer">View uploaded resume</a>
                      <button type="button" className="btn btn-ghost" onClick={async () => {
                        if (!window.confirm('Delete uploaded resume?')) return;
                        setMessage(''); setError('');
                        const res = await fetch(`${API_BASE}/api/user/profile/resume`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
                        const data = await res.json();
                        if (!res.ok) { setError(data.message || 'Delete failed'); return; }
                        setProfile(prev => ({ ...prev, resumeUrl: '' }));
                        if (onProfileUpdate) onProfileUpdate(prev => ({ ...prev, resumeUrl: '' }));
                        setMessage('Resume deleted');
                      }}>Delete</button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <div>
            <section className="profile-section">
              <h4>Skills</h4>
              <div>
                <div className="skills-pill-wrap">
                  {(profile.skills || []).map(s => (
                    <div key={s} className="skill-pill">{s}<span className="remove" onClick={() => removeSkill(s)}>×</span></div>
                  ))}
                  <input className="skill-input" value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>{
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
                  }} placeholder="Type skill and press Enter" />
                </div>
              </div>
            </section>

            <section className="profile-section">
              <h4>Experience</h4>
              <textarea className="form-control" value={profile.experience} onChange={e => setProfile({ ...profile, experience: e.target.value })} placeholder="Describe your experience" />
            </section>
          </div>
        </div>

        {message && <div className="msg success">{message}</div>}
        {error && <div className="msg error">{error}</div>}
      </div>
    </div>
  );
}
