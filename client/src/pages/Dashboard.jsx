import React, { useState, useEffect } from 'react'
import { API_BASE } from '../api'

export default function Dashboard({ token, user }) {
  const [postType, setPostType] = useState('job')
  const [title, setTitle] = useState('')
  const [employmentType, setEmploymentType] = useState('Full-time')
  const [company, setCompany] = useState('')
  const [aboutCompany, setAboutCompany] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [departmentRoleCategory, setDepartmentRoleCategory] = useState('')
  const [workMode, setWorkMode] = useState('On-site')
  const [location, setLocation] = useState('')
  const [experienceNeeded, setExperienceNeeded] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [educationalBackground, setEducationalBackground] = useState('')
  const [vacanciesAvailable, setVacanciesAvailable] = useState('')
  const [applicants, setApplicants] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [message, setMessage] = useState('')
  const [showCreatedPopup, setShowCreatedPopup] = useState(false)

  const create = async () => {
    setMessage('')
    const requiredFields = [postType, title, employmentType, company, aboutCompany, description, departmentRoleCategory, workMode, location, experienceNeeded, salaryRange, educationalBackground, vacanciesAvailable]
    if (requiredFields.some(value => String(value || '').trim() === '') || skills.split(',').map(s => s.trim()).filter(Boolean).length === 0) {
      setMessage('All fields are required')
      return
    }
    const res = await fetch(`${API_BASE}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        postType,
        title,
        employmentType,
        company,
        aboutCompany,
        description,
        departmentRoleCategory,
        workMode,
        location,
        experienceNeeded,
        salaryRange,
        educationalBackground,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        vacanciesAvailable
      })
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.message || 'Unable to create job')
      return
    }
    setTitle('')
    setPostType('job')
    setEmploymentType('Full-time')
    setCompany('')
    setAboutCompany('')
    setDescription('')
    setSkills('')
    setDepartmentRoleCategory('')
    setWorkMode('On-site')
    setLocation('')
    setExperienceNeeded('')
    setSalaryRange('')
    setEducationalBackground('')
    setVacanciesAvailable('')
    setShowCreatedPopup(true)
  }

  return (
    <div className="admin-shell">
      <div className="card admin-hero">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h3 style={{ margin: '6px 0 8px' }}>Create a posting</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{user?.name ? `${user.name} is signed in.` : 'Manage your company profile and open positions.'}</p>
        </div>
      </div>

      <div className="card job-post-card">
        <div className="section-title">Post Internship or Job</div>
        <div className="post-type-toggle">
          <button className={postType === 'job' ? 'pill-button active-filter' : 'pill-button'} onClick={() => setPostType('job')} type="button">Job</button>
          <button className={postType === 'internship' ? 'pill-button active-filter' : 'pill-button'} onClick={() => setPostType('internship')} type="button">Internship</button>
        </div>

        <div className="job-form-grid">
          <div className="form-field">
            <label>Job title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Job title" required />
          </div>
          <div className="form-field">
            <label>Employment type</label>
            <select className="form-control" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>
          <div className="form-field">
            <label>Key skills required</label>
            <input className="form-control" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node, SQL" required />
          </div>
          <div className="form-field">
            <label>Department and role category</label>
            <input className="form-control" value={departmentRoleCategory} onChange={e => setDepartmentRoleCategory(e.target.value)} placeholder="Engineering / Frontend" required />
          </div>
          <div className="form-field">
            <label>Work mode</label>
            <select className="form-control" value={workMode} onChange={e => setWorkMode(e.target.value)}>
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
          </div>
          <div className="form-field">
            <label>Location</label>
            <input className="form-control" value={location} onChange={e => setLocation(e.target.value)} placeholder="City / Location" required />
          </div>
          <div className="form-field">
            <label>Work experience needed</label>
            <input className="form-control" value={experienceNeeded} onChange={e => setExperienceNeeded(e.target.value)} placeholder="0-2 years, 3-5 years" required />
          </div>
          <div className="form-field">
            <label>Salary range</label>
            <input className="form-control" value={salaryRange} onChange={e => setSalaryRange(e.target.value)} placeholder="5-10 Lacs P.A." required />
          </div>
          <div className="form-field">
            <label>Educational background</label>
            <input className="form-control" value={educationalBackground} onChange={e => setEducationalBackground(e.target.value)} placeholder="B.Tech / MCA / Any degree" required />
          </div>
          <div className="form-field full-width">
            <label>Job description</label>
            <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the role, responsibilities, and expectations" rows={5} required />
          </div>
          <div className="form-field">
            <label>Company name</label>
            <input className="form-control" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" required />
          </div>
          <div className="form-field full-width">
            <label>About company</label>
            <textarea className="form-control" value={aboutCompany} onChange={e => setAboutCompany(e.target.value)} placeholder="Tell applicants about your company" rows={4} required />
          </div>
          <div className="form-field small-field">
            <label>Vacancies available</label>
            <input className="form-control" type="number" min="1" value={vacanciesAvailable} onChange={e => setVacanciesAvailable(e.target.value)} placeholder="1" required />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={create}>Create Job</button>
          {message && <div className="msg error">{message}</div>}
        </div>
      </div>

      {showCreatedPopup && (
        <div className="modal-backdrop" onClick={() => setShowCreatedPopup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4 style={{ marginTop: 0 }}>Job created successfully</h4>
            <p style={{ color: 'var(--muted)' }}>Your job has been saved and is now available in Jobs Posted.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowCreatedPopup(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
