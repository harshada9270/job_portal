import React, { useState, useEffect } from 'react'
import Login from './pages/Login'
import AdminJobs from './pages/Jobs'
import UserJobs from './pages/UserJobs'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import UserApplications from './pages/UserApplications'
import UserProfile from './pages/UserProfile'

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [activeView, setActiveView] = useState('dashboard')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user')
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token')
  }, [user, token])

  useEffect(() => {
    setActiveView(user?.role === 'admin' ? 'dashboard' : 'jobs')
  }, [user])

  if (!user) return <Login onLogin={(u, t) => { setUser(u); setToken(t) }} />

  const isAdmin = user.role === 'admin'
  const showJobs = activeView === 'jobs'
  const showSavedJobs = activeView === 'saved-jobs'
  const showApplications = activeView === 'applications'
  const showDashboard = activeView === 'dashboard' && isAdmin
  const showProfile = activeView === 'profile'

  return (
    <div className="app app-horizontal">
      <header className="topbar topbar-horizontal">
        <div className="brand-block">
          <div className="brand-badge">JP</div>
          <div>
            <h2 style={{ margin: 0 }}>Job Portal</h2>
            <div className="brand-subtitle">{isAdmin ? 'Admin workspace' : 'Candidate workspace'}</div>
          </div>
        </div>

        <nav className="horizontal-nav" aria-label="Primary navigation">
          {isAdmin ? (
            <>
              <button className={activeView === 'dashboard' ? 'nav-pill active' : 'nav-pill'} onClick={() => setActiveView('dashboard')}>Dashboard</button>
              <button className={activeView === 'applications' ? 'nav-pill active' : 'nav-pill'} onClick={() => setActiveView('applications')}>Applications</button>
              <button className={activeView === 'jobs' ? 'nav-pill active' : 'nav-pill'} onClick={() => setActiveView('jobs')}>Jobs Posted</button>
              <button className={activeView === 'profile' ? 'nav-pill active' : 'nav-pill'} onClick={() => setActiveView('profile')}>Profile</button>
            </>
          ) : (
            <>
              <button className={activeView === 'jobs' ? 'nav-pill active' : 'nav-pill'} onClick={() => setActiveView('jobs')}>Jobs</button>
              <button className={activeView === 'saved-jobs' ? 'nav-pill active' : 'nav-pill'} onClick={() => setActiveView('saved-jobs')}>Saved Jobs</button>
              <button className={activeView === 'applications' ? 'nav-pill active' : 'nav-pill'} onClick={() => setActiveView('applications')}>Jobs Applied</button>
              <button className={activeView === 'profile' ? 'nav-pill active' : 'nav-pill'} onClick={() => setActiveView('profile')}>Profile</button>
            </>
          )}
        </nav>

        <div className="topbar-right">
          <div className="user-chip">
            <div className="user-name">{user.name || 'User'}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <button className="btn btn-danger logout-btn" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
        </div>
      </header>

      <div className="main-wrap main-wrap-horizontal">
        <div className="content-stack">
          {showDashboard && <Dashboard token={token} user={user} />}
          {showJobs && (user.role === 'admin' ? <AdminJobs token={token} user={user} /> : <UserJobs token={token} view="jobs" />)}
          {showSavedJobs && <UserJobs token={token} view="saved" />}
          {showApplications && (user.role === 'admin' ? <Applications token={token} user={user} /> : <UserApplications token={token} />)}
          {showProfile && <UserProfile token={token} onProfileUpdate={setUser} />}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4 style={{ marginTop: 0 }}>Log out?</h4>
            <p style={{ color: 'var(--muted)' }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setUser(null); setToken(null); setShowLogoutConfirm(false) }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
