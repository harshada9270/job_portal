import React, { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../api'

const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Italian', 'Dutch', 'Russian', 'Turkish', 'Polish', 'Vietnamese', 'Thai', 'Indonesian', 'Other'];

const PROFICIENCY_OPTIONS = [
  'Can speak, read and write',
  'Can speak and read',
  'Can read and write',
  'Can speak',
  'Can read',
  'Can write'
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const emptyProfile = {
  name: '',
  email: '',
  phone: '',
  qualification: '',
  collegeName: '',
  gender: '',
  location: '',
  careerPreferences: '',
  preferredJobsText: '',
  availabilityMonths: '',
  preferredLocationsText: '',
  graduationDegree: '',
  graduationCollege: '',
  lastGrades: '',
  profileSummary: '',
  skillsText: '',
  languagesKnown: [],
  education: [],
  experienceCompanyName: '',
  experienceStartDate: '',
  experienceEndDate: '',
  projectName: '',
  experienceDescription: '',
  experienceKeySkillsText: '',
  projectUrl: '',
  accomplishment: '',
  certifications: '',
  academicAchievements: '',
  resumeUrl: '',
  companyName: '',
  companyWebsite: '',
  role: 'user'
};

const splitList = (value) => String(value || '').split(',').map(item => item.trim()).filter(Boolean);

export default function UserProfile({ token, onProfileUpdate }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [skillInput, setSkillInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('');
  const [editingEducationIdx, setEditingEducationIdx] = useState(null);
  const [educationForm, setEducationForm] = useState({ degree: '', college: '', grades: '', startYear: '', endYear: '' });

  useEffect(() => {
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
        ...emptyProfile,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        qualification: data.qualification || '',
        collegeName: data.collegeName || '',
        gender: data.gender || '',
        location: data.location || '',
        careerPreferences: data.careerPreferences || '',
        preferredJobsText: Array.isArray(data.preferredJobs) ? data.preferredJobs.join(', ') : '',
        availabilityMonths: data.availabilityMonths || '',
        preferredLocationsText: Array.isArray(data.preferredLocations) ? data.preferredLocations.join(', ') : '',
        graduationDegree: data.graduationDegree || '',
        graduationCollege: data.graduationCollege || '',
        lastGrades: data.lastGrades || '',
        profileSummary: data.profileSummary || '',
        skillsText: Array.isArray(data.skills) ? data.skills.join(', ') : '',
        languagesKnown: typeof data.languagesKnown === 'string' ? JSON.parse(data.languagesKnown) : (Array.isArray(data.languagesKnown) ? data.languagesKnown : []),
        education: Array.isArray(data.education) ? data.education : [],
        experienceCompanyName: data.experienceCompanyName || '',
        experienceStartDate: data.experienceStartDate || '',
        experienceEndDate: data.experienceEndDate || '',
        projectName: data.projectName || '',
        experienceDescription: data.experienceDescription || '',
        experienceKeySkillsText: Array.isArray(data.experienceKeySkills) ? data.experienceKeySkills.join(', ') : '',
        projectUrl: data.projectUrl || '',
        accomplishment: data.accomplishment || '',
        certifications: data.certifications || '',
        academicAchievements: data.academicAchievements || '',
        resumeUrl: data.resumeUrl || '',
        companyName: data.companyName || '',
        companyWebsite: data.companyWebsite || '',
        role: data.role || 'user'
      });
    };

    fetchProfile();
  }, [token]);

  const profileCompleteness = useMemo(() => {
    const fields = [
      profile.name,
      profile.phone,
      profile.qualification,
      profile.collegeName,
      profile.location,
      profile.profileSummary,
      profile.skillsText,
      profile.resumeUrl
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const addSkillChip = (value) => {
    const values = splitList(value);
    if (!values.length) return;
    setProfile(prev => ({
      ...prev,
      skillsText: Array.from(new Set([...(splitList(prev.skillsText)), ...values])).join(', ')
    }));
    setSkillInput('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      name: profile.name,
      phone: profile.phone,
      qualification: profile.qualification,
      collegeName: profile.collegeName,
      gender: profile.gender,
      location: profile.location,
      careerPreferences: profile.careerPreferences,
      preferredJobs: splitList(profile.preferredJobsText),
      availabilityMonths: profile.availabilityMonths,
      preferredLocations: splitList(profile.preferredLocationsText),
      graduationDegree: profile.graduationDegree,
      graduationCollege: profile.graduationCollege,
      lastGrades: profile.lastGrades,
      education: JSON.stringify(profile.education || []),
      profileSummary: profile.profileSummary,
      skills: splitList(profile.skillsText),
      languagesKnown: JSON.stringify(profile.languagesKnown),
      experienceCompanyName: profile.experienceCompanyName,
      experienceStartDate: profile.experienceStartDate,
      experienceEndDate: profile.experienceEndDate,
      projectName: profile.projectName,
      experienceDescription: profile.experienceDescription,
      experienceKeySkills: splitList(profile.experienceKeySkillsText),
      projectUrl: profile.projectUrl,
      accomplishment: profile.accomplishment,
      certifications: profile.certifications,
      academicAchievements: profile.academicAchievements
    };

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
      qualification: data.qualification || prev.qualification,
      collegeName: data.collegeName || prev.collegeName,
      gender: data.gender || prev.gender,
      location: data.location || prev.location,
      careerPreferences: data.careerPreferences || prev.careerPreferences,
      preferredJobsText: Array.isArray(data.preferredJobs) ? data.preferredJobs.join(', ') : prev.preferredJobsText,
      availabilityMonths: data.availabilityMonths || prev.availabilityMonths,
      preferredLocationsText: Array.isArray(data.preferredLocations) ? data.preferredLocations.join(', ') : prev.preferredLocationsText,
      graduationDegree: data.graduationDegree || prev.graduationDegree,
      graduationCollege: data.graduationCollege || prev.graduationCollege,
      lastGrades: data.lastGrades || prev.lastGrades,
      education: typeof data.education === 'string' ? JSON.parse(data.education) : (Array.isArray(data.education) ? data.education : prev.education),
      profileSummary: data.profileSummary || prev.profileSummary,
      skillsText: Array.isArray(data.skills) ? data.skills.join(', ') : prev.skillsText,
      languagesKnown: typeof data.languagesKnown === 'string' ? JSON.parse(data.languagesKnown) : (Array.isArray(data.languagesKnown) ? data.languagesKnown : prev.languagesKnown),
      experienceCompanyName: data.experienceCompanyName || prev.experienceCompanyName,
      experienceStartDate: data.experienceStartDate || prev.experienceStartDate,
      experienceEndDate: data.experienceEndDate || prev.experienceEndDate,
      projectName: data.projectName || prev.projectName,
      experienceDescription: data.experienceDescription || prev.experienceDescription,
      experienceKeySkillsText: Array.isArray(data.experienceKeySkills) ? data.experienceKeySkills.join(', ') : prev.experienceKeySkillsText,
      projectUrl: data.projectUrl || prev.projectUrl,
      accomplishment: data.accomplishment || prev.accomplishment,
      certifications: data.certifications || prev.certifications,
      academicAchievements: data.academicAchievements || prev.academicAchievements,
      resumeUrl: data.resumeUrl || prev.resumeUrl,
      companyName: data.companyName || prev.companyName,
      companyWebsite: data.companyWebsite || prev.companyWebsite,
      role: data.role || prev.role
    }));
    if (onProfileUpdate) {
      onProfileUpdate(prev => ({
        ...prev,
        name: data.name || prev.name,
        phone: data.phone || prev.phone,
        skills: Array.isArray(data.skills) ? data.skills : prev.skills,
        experience: data.profileSummary || prev.experience,
        resumeUrl: data.resumeUrl || prev.resumeUrl
      }));
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

  return (
    <div className="profile-page">
      <div className="profile-card profile-shell">
        <div className="profile-header">
          <div>
            <div className="eyebrow">Profile</div>
            <h3 style={{ margin: '6px 0 4px' }}>{profile.role === 'admin' ? 'Admin company profile' : 'Candidate profile'}</h3>
            <div className="profile-completeness">Profile completeness: {profileCompleteness}%</div>
          </div>
          <div className="save-btn">
            <button className="btn btn-primary" onClick={saveProfile}>Save</button>
          </div>
        </div>

        <div className="profile-grid profile-form-grid">
          <section className="profile-section card inner-card">
            <h4>Basic Details</h4>
            <div className="field-row">
              <input className="form-control" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Name" />
              <input className="form-control" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="field-row">
              <input className="form-control" value={profile.email} readOnly placeholder="Email" />
              <select className="form-control" value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="field-row">
              <input className="form-control" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} placeholder="Location" />
              <input className="form-control" value={profile.qualification} onChange={e => setProfile({ ...profile, qualification: e.target.value })} placeholder="Qualification" />
            </div>
            <input className="form-control" value={profile.collegeName} onChange={e => setProfile({ ...profile, collegeName: e.target.value })} placeholder="College name" />
            <input className="form-control" value={profile.careerPreferences} onChange={e => setProfile({ ...profile, careerPreferences: e.target.value })} placeholder="Career preferences" />
            <input className="form-control" value={profile.preferredJobsText} onChange={e => setProfile({ ...profile, preferredJobsText: e.target.value })} placeholder="Preferred jobs, separated by comma" />
            <input className="form-control" value={profile.availabilityMonths} onChange={e => setProfile({ ...profile, availabilityMonths: e.target.value })} placeholder="Availability to work in months" />
            <input className="form-control" value={profile.preferredLocationsText} onChange={e => setProfile({ ...profile, preferredLocationsText: e.target.value })} placeholder="Preferred locations, separated by comma" />
          </section>

          <section className="profile-section card inner-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>Education</h4>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setEditingEducationIdx(null);
                  setEducationForm({ degree: '', college: '', grades: '', startYear: '', endYear: '' });
                }}
                style={{ padding: '6px 12px', fontSize: '14px' }}
              >
                Add Education
              </button>
            </div>
            {editingEducationIdx === null ? null : (
              <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700 }}>{editingEducationIdx === -1 ? 'Add Education' : 'Edit Education'}</div>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingEducationIdx(null)} style={{ padding: '2px 6px', fontSize: '12px' }}>✕</button>
                </div>
                <div className="field-row">
                  <input className="form-control" value={educationForm.degree} onChange={e => setEducationForm({ ...educationForm, degree: e.target.value })} placeholder="Degree" />
                  <input className="form-control" value={educationForm.college} onChange={e => setEducationForm({ ...educationForm, college: e.target.value })} placeholder="College" />
                </div>
                <div className="field-row">
                  <input className="form-control" value={educationForm.startYear} onChange={e => setEducationForm({ ...educationForm, startYear: e.target.value })} placeholder="Start Year" type="number" />
                  <input className="form-control" value={educationForm.endYear} onChange={e => setEducationForm({ ...educationForm, endYear: e.target.value })} placeholder="End Year" type="number" />
                  <input className="form-control" value={educationForm.grades} onChange={e => setEducationForm({ ...educationForm, grades: e.target.value })} placeholder="Grades/CGPA" />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditingEducationIdx(null);
                      setEducationForm({ degree: '', college: '', grades: '', startYear: '', endYear: '' });
                    }}
                    style={{ padding: '6px 12px', fontSize: '14px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (editingEducationIdx === -1) {
                        setProfile(prev => ({ ...prev, education: [...(prev.education || []), educationForm] }));
                      } else {
                        setProfile(prev => ({
                          ...prev,
                          education: (prev.education || []).map((edu, i) => i === editingEducationIdx ? educationForm : edu)
                        }));
                      }
                      setEditingEducationIdx(null);
                      setEducationForm({ degree: '', college: '', grades: '', startYear: '', endYear: '' });
                    }}
                    style={{ padding: '6px 12px', fontSize: '14px' }}
                  >
                    {editingEducationIdx === -1 ? 'Save' : 'Update'}
                  </button>
                </div>
              </div>
            )}
            <div>
              {(profile.education || []).map((edu, idx) => (
                <div key={idx} style={{ background: '#f0f4f8', border: '1px solid #dbe6f4', borderRadius: '12px', padding: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1E4E8C' }}>{edu.degree}</div>
                    <div style={{ fontSize: '13px', color: '#5f6b7a', marginTop: '2px' }}>{edu.college}</div>
                    <div style={{ fontSize: '12px', color: '#7a8596', marginTop: '4px' }}>{edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : ''} {edu.grades ? `| ${edu.grades}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingEducationIdx(idx);
                        setEducationForm(edu);
                      }}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          education: (prev.education || []).filter((_, i) => i !== idx)
                        }));
                      }}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-section card inner-card full-width">
            <h4>Profile Summary</h4>
            <textarea className="form-control" rows={4} value={profile.profileSummary} onChange={e => setProfile({ ...profile, profileSummary: e.target.value })} placeholder="Write a short paragraph about yourself" />
          </section>

          <section className="profile-section card inner-card">
            <h4>Key Skills</h4>
            <div className="skills-pill-wrap">
              {splitList(profile.skillsText).map(skill => (
                <span key={skill} className="skill-pill">{skill}</span>
              ))}
            </div>
            <input className="form-control" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addSkillChip(skillInput);
              }
            }} placeholder="Add skills separated by comma" />
            <textarea className="form-control" rows={3} value={profile.skillsText} onChange={e => setProfile({ ...profile, skillsText: e.target.value })} placeholder="Comma separated skills" />
          </section>

          <section className="profile-section card inner-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>Languages Known</h4>
              {selectedLanguage && selectedProficiency && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const newLang = { language: selectedLanguage, proficiency: selectedProficiency };
                    const exists = (profile.languagesKnown || []).some(item => item.language === selectedLanguage);
                    if (!exists) {
                      setProfile(prev => ({ ...prev, languagesKnown: [...(prev.languagesKnown || []), newLang] }));
                    }
                    setSelectedLanguage('');
                    setSelectedProficiency('');
                  }}
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  Add Language
                </button>
              )}
            </div>
            <div className="field-row">
              <select
                className="form-control"
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
              >
                <option value="">Select a language</option>
                {LANGUAGE_OPTIONS.filter(lang => !((profile.languagesKnown || []).some(item => item.language === lang))).map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
              <select
                className="form-control"
                value={selectedProficiency}
                onChange={e => setSelectedProficiency(e.target.value)}
              >
                <option value="">Select proficiency</option>
                {PROFICIENCY_OPTIONS.map(proficiency => (
                  <option key={proficiency} value={proficiency}>{proficiency}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 16 }}>
              {(profile.languagesKnown || []).map((item, idx) => (
                <div key={idx} style={{ background: '#f0f4f8', border: '1px solid #dbe6f4', borderRadius: '12px', padding: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1E4E8C' }}>{item.language}</div>
                    <div style={{ fontSize: '13px', color: '#5f6b7a', marginTop: '4px' }}>{item.proficiency}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setProfile(prev => ({
                        ...prev,
                        languagesKnown: (prev.languagesKnown || []).filter((_, i) => i !== idx)
                      }));
                    }}
                    style={{ padding: '4px 8px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-section card inner-card full-width">
            <h4>Experience</h4>
            <div className="field-row">
              <input className="form-control" value={profile.experienceCompanyName} onChange={e => setProfile({ ...profile, experienceCompanyName: e.target.value })} placeholder="Company name" />
              <input className="form-control" type="date" value={profile.experienceStartDate} onChange={e => setProfile({ ...profile, experienceStartDate: e.target.value })} />
              <input className="form-control" type="date" value={profile.experienceEndDate} onChange={e => setProfile({ ...profile, experienceEndDate: e.target.value })} />
            </div>
            <input className="form-control" value={profile.projectName} onChange={e => setProfile({ ...profile, projectName: e.target.value })} placeholder="Project name" />
            <textarea className="form-control" rows={4} value={profile.experienceDescription} onChange={e => setProfile({ ...profile, experienceDescription: e.target.value })} placeholder="Description of the job or project" />
            <input className="form-control" value={profile.experienceKeySkillsText} onChange={e => setProfile({ ...profile, experienceKeySkillsText: e.target.value })} placeholder="Key skills, separated by comma" />
            <input className="form-control" value={profile.projectUrl} onChange={e => setProfile({ ...profile, projectUrl: e.target.value })} placeholder="Project URL" />
          </section>

          <section className="profile-section card inner-card">
            <h4>Achievements</h4>
            <textarea className="form-control" rows={3} value={profile.accomplishment} onChange={e => setProfile({ ...profile, accomplishment: e.target.value })} placeholder="Certification adding option" />
            <textarea className="form-control" rows={3} value={profile.certifications} onChange={e => setProfile({ ...profile, certifications: e.target.value })} placeholder="Certifications" />
            <textarea className="form-control" rows={3} value={profile.academicAchievements} onChange={e => setProfile({ ...profile, academicAchievements: e.target.value })} placeholder="Academic achievements" />
          </section>

          {profile.role === 'admin' && (
            <section className="profile-section card inner-card">
              <h4>Company Profile</h4>
              <input className="form-control" value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} placeholder="Company name" />
              <input className="form-control" value={profile.companyWebsite} onChange={e => setProfile({ ...profile, companyWebsite: e.target.value })} placeholder="Company website" />
            </section>
          )}

          <section className="profile-section card inner-card full-width">
            <h4>Resume</h4>
            <div className="resume-actions">
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => uploadResume(e.target.files[0])} />
              {profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noreferrer">View uploaded resume</a>}
            </div>
          </section>
        </div>

        {message && <div className="msg success">{message}</div>}
        {error && <div className="msg error">{error}</div>}
      </div>
    </div>
  );
}
