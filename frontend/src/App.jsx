
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Network,
  FileText,
  LogOut,
  Database,
  CheckSquare,
  GitBranch,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  CircleCheck,
  Lightbulb,
  ClipboardList,
  Activity,
  Plus,
  Trash2,
  Printer,
  Search,
  ScanSearch,
  ShieldCheck,
  RefreshCw,
  Target,
  Clock3,
  Layers3,
  XCircle
} from 'lucide-react';

import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const emptyForm = {
  title: '',
  type: 'TASK',
  status: 'OPEN',
  importance: 'MEDIUM',
  ownerName: '',
  details: '',
  decisionReason: ''
};

const statusClass = status =>
  (status || 'open').toLowerCase().replaceAll('_', '-');

const insightIcons = {
  blocked: AlertTriangle,
  issue: XCircle,
  unassigned: Database,
  decision: Lightbulb,
  healthy: ShieldCheck
};

const navItems = [
  {
    id: 'overview',
    label: 'Overview',
    Icon: LayoutDashboard
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge base',
    Icon: BookOpen
  },
  {
    id: 'knowledge-gaps',
    label: 'Knowledge gaps',
    Icon: Network
  }
];

export default function App() {
  // Authentication
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('projectrelay_auth')) || null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard
  const [items, setItems] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [recordSearch, setRecordSearch] = useState('');

  const isAdmin = auth?.role === 'ADMIN';

  // Common API request function
  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (auth?.token && options.auth !== false) {
      headers.Authorization = `Bearer ${auth.token}`;
    }

    const { auth: ignoredAuth, ...fetchOptions } = options;

    const response = await fetch(`${API}${path}`, {
      ...fetchOptions,
      headers
    });

    if (response.status === 401) {
      logout();
      throw new Error('Your session has expired. Please log in again.');
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `HTTP Error ${response.status}`);
    }

    if (response.status === 204) return null;

    return response.json();
  }

  // Login and registration
  async function handleAuthSubmit(e) {
    e.preventDefault();

    setAuthLoading(true);
    setAuthError('');

    try {
      const endpoint =
        authMode === 'login' ? '/auth/login' : '/auth/register';

      const body =
        authMode === 'login'
          ? {
              email: authForm.email.trim(),
              password: authForm.password
            }
          : {
              fullName: authForm.fullName.trim(),
              email: authForm.email.trim(),
              password: authForm.password
            };

      const response = await request(endpoint, {
        method: 'POST',
        auth: false,
        body: JSON.stringify(body)
      });

      const userData = {
        token: response.token,
        id: response.id,
        fullName: response.fullName,
        email: response.email,
        role: response.role
      };

      if (!userData.token || !userData.role) {
        throw new Error('Unexpected login response from server.');
      }

      localStorage.setItem(
        'projectrelay_auth',
        JSON.stringify(userData)
      );

      setAuth(userData);
      setAuthForm({
        fullName: '',
        email: '',
        password: ''
      });
      setAuthError('');
    } catch (err) {
      setAuthError(
        err.message || 'Unable to continue. Please check your details.'
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('projectrelay_auth');

    setAuth(null);
    setItems([]);
    setGaps([]);
    setReport(null);
    setError('');
    setSuccess('');
    setAuthError('');
    setAuthMode('login');
    setActiveNav('overview');
  }

  // Load knowledge records after login

async function loadItems(search = '') {
  try {
    const query = search.trim();

    const path = query
      ? `/items?search=${encodeURIComponent(query)}`
      : '/items';

    const data = await request(path);

    setItems(Array.isArray(data) ? data : []);
    setError('');
  } catch (e) {
    setError('Unable to load records: ' + e.message);
  }
}


  useEffect(() => {
    if (auth?.token) {
      loadItems();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  // Record counts
  const counts = useMemo(
    () => ({
      tasks: items.filter(i => i.type === 'TASK').length,
      decisions: items.filter(i => i.type === 'DECISION').length,
      issues: items.filter(i => i.type === 'ISSUE').length,
      updates: items.filter(i => i.type === 'UPDATE').length
    }),
    [items]
  );

  // Task statistics
  const taskStats = useMemo(() => {
    const tasks = items.filter(i => i.type === 'TASK');

    const completed = tasks.filter(
      i => i.status === 'COMPLETED'
    ).length;

    const blocked = tasks.filter(
      i => i.status === 'BLOCKED'
    ).length;

    const inProgress = tasks.filter(
      i => i.status === 'IN_PROGRESS'
    ).length;

    const pending = tasks.filter(
      i => i.status === 'OPEN'
    ).length;

    const total = tasks.length;

    return {
      total,
      completed,
      blocked,
      inProgress,
      pending,
      percentage: total
        ? Math.round((completed / total) * 100)
        : 0
    };
  }, [items]);

  // Analytics chart
  const chartStyle = useMemo(() => {
    const total = taskStats.total;

    if (!total) {
      return { background: '#202943' };
    }

    const a = (taskStats.completed / total) * 100;
    const b = a + (taskStats.inProgress / total) * 100;
    const c = b + (taskStats.blocked / total) * 100;

    return {
      background: `conic-gradient(
        #8b7cff 0% ${a}%,
        #37d6bd ${a}% ${b}%,
        #ffb86b ${b}% ${c}%,
        #34415d ${c}% 100%
      )`
    };
  }, [taskStats]);

  // Workspace insights
  const insights = useMemo(() => {
    const blocked = items.filter(i => i.status === 'BLOCKED');

    const unassigned = items.filter(
      i => !i.ownerName?.trim()
    );

    const decisions = items.filter(
      i => i.type === 'DECISION'
    );

    const issues = items.filter(
      i => i.type === 'ISSUE' && i.status !== 'RESOLVED'
    );

    const result = [];

    if (blocked.length) {
      result.push({
        icon: 'blocked',
        tone: 'orange',
        title: `${blocked.length} blocked task${blocked.length > 1 ? 's' : ''}`,
        detail: 'Review blockers and assign the next action.'
      });
    }

    if (issues.length) {
      result.push({
        icon: 'issue',
        tone: 'red',
        title: `${issues.length} unresolved issue${issues.length > 1 ? 's' : ''}`,
        detail: 'These issues may affect the next handover.'
      });
    }

    if (unassigned.length) {
      result.push({
        icon: 'unassigned',
        tone: 'purple',
        title: `${unassigned.length} item${unassigned.length > 1 ? 's' : ''} without an owner`,
        detail: 'Assign a responsible team member.'
      });
    }

    if (!decisions.length) {
      result.push({
        icon: 'decision',
        tone: 'blue',
        title: 'No decisions documented yet',
        detail: 'Record important decisions and their reasons.'
      });
    }

    if (!result.length) {
      result.push({
        icon: 'healthy',
        tone: 'green',
        title: 'Workspace looks healthy',
        detail: 'No obvious handover risks found in the saved records.'
      });
    }

    return result.slice(0, 4);
  }, [items]);

  const latestItems = useMemo(
    () => [...items].reverse().slice(0, 5),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = recordSearch.trim().toLowerCase();

    if (!query) return items;

    return items.filter(item =>
      [
        item.title,
        item.type,
        item.status,
        item.ownerName,
        item.details
      ]
        .filter(Boolean)
        .some(value =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [items, recordSearch]);

  // Navigation
  function navigateTo(id) {
    setActiveNav(id);

    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  // Form updates
  function updateForm(key, value) {
    setForm(old => ({
      ...old,
      [key]: value
    }));

    setError('');
    setSuccess('');
  }

  // Add knowledge item
  async function addItem(e) {
    e.preventDefault();

    const required = [
      ['title', 'Title'],
      ['type', 'Type'],
      ['status', 'Status'],
      ['ownerName', 'Owner'],
      ['details', 'Details']
    ];

    for (const [key, label] of required) {
      if (!String(form[key] || '').trim()) {
        setError(`${label} is required.`);
        return;
      }
    }

    if (
      form.type === 'DECISION' &&
      !form.decisionReason.trim()
    ) {
      setError('Decision reason is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanForm = {
        ...form,
        title: form.title.trim(),
        ownerName: form.ownerName.trim(),
        details: form.details.trim(),
        decisionReason: form.decisionReason.trim()
      };

      await request('/items', {
        method: 'POST',
        body: JSON.stringify(cleanForm)
      });

      setForm(emptyForm);
      setGaps([]);
      setReport(null);
      setSuccess('Knowledge item saved successfully!');

      await loadItems();
    } catch (e) {
      setError('Unable to save item: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Knowledge gap scanner
  async function scanGaps() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await request('/gaps');

      setGaps(Array.isArray(data) ? data : []);
      setSuccess('Knowledge gap scan completed!');
    } catch (e) {
      setError('Knowledge scan failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Generate handover report
  async function generateReport() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await request('/report');

      setReport(data);
      setSuccess('Handover report generated successfully!');
      setActiveNav('handover-report');

      setTimeout(() => {
        document.getElementById('handover-report')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 200);
    } catch (e) {
      setError('Unable to generate report: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete knowledge item
  async function removeItem(id) {
    if (!isAdmin) {
      setError('Only Admin users can delete records.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to delete this record?'
      )
    ) {
      return;
    }

    try {
      await request(`/items/${id}`, {
        method: 'DELETE'
      });

      await loadItems();

      setGaps([]);
      setReport(null);
      setSuccess('Record deleted successfully!');
    } catch (e) {
      setError('Unable to delete record: ' + e.message);
    }
  }

  function printReport() {
    window.print();
  }

  // Login / registration screen
  if (!auth?.token) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="auth-brand">
            <div className="brand-mark">R</div>

            <div>
              <b>ProjectRelay</b>
              <span>INTELLIGENCE WORKSPACE</span>
            </div>
          </div>

          <div className="auth-heading">
            <p className="overline">
              WELCOME TO PROJECTRELAY
            </p>

            <h1>
              {authMode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
              <span>.</span>
            </h1>

            <p>
              {authMode === 'login'
                ? 'Log in to access your team knowledge workspace.'
                : 'Register as a team member to get started.'}
            </p>
          </div>

          {authError && (
            <div className="message error-message">
              <AlertTriangle size={17} />
              {authError}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleAuthSubmit}
          >
            {authMode === 'register' && (
              <label>
                Full name

                <input
                  type="text"
                  required
                  value={authForm.fullName}
                  onChange={e =>
                    setAuthForm({
                      ...authForm,
                      fullName: e.target.value
                    })
                  }
                  placeholder="Enter your full name"
                />
              </label>
            )}

            <label>
              Email address

              <input
                type="email"
                required
                value={authForm.email}
                onChange={e =>
                  setAuthForm({
                    ...authForm,
                    email: e.target.value
                  })
                }
                placeholder="Enter your email"
              />
            </label>

            <label>
              Password

              <input
                type="password"
                required
                value={authForm.password}
                onChange={e =>
                  setAuthForm({
                    ...authForm,
                    password: e.target.value
                  })
                }
                placeholder="Enter your password"
              />
            </label>

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? 'Please wait...'
                : authMode === 'login'
                  ? 'Log in'
                  : 'Create account'}
            </button>
          </form>

          <div className="auth-switch">
            {authMode === 'login' ? (
              <>
                Don't have an account?{' '}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                >
                  Log in
                </button>
              </>
            )}
          </div>

          <p className="auth-note">
            New registrations receive Team Member access.
            Admin accounts are created separately.
          </p>

        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-mark">R</div>

          <div>
            <b>ProjectRelay</b>
            <span>INTELLIGENCE WORKSPACE</span>
          </div>
        </div>

        <div className="side-label">
          WORKSPACE
        </div>

        <nav className="side-nav">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={
                activeNav === id
                  ? 'nav-link active'
                  : 'nav-link'
              }
              onClick={() => navigateTo(id)}
            >
              <Icon className="nav-icon" size={19} />
              {label}
            </button>
          ))}

          <button
            className={
              activeNav === 'handover-report'
                ? 'nav-link active'
                : 'nav-link'
            }
            onClick={generateReport}
            disabled={loading}
          >
            <FileText className="nav-icon" size={19} />
            Handover reports
          </button>
        </nav>

        <div className="sidebar-bottom">

          <div className="workspace-avatar">
            {(auth.fullName || 'U')
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="logged-user">
            <b>{auth.fullName}</b>

            <span>
              {auth.role === 'ADMIN'
                ? 'Administrator'
                : 'Team Member'}
            </span>
          </div>

          <button
            className="logout-button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={19} />
          </button>

        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="main-area" id="overview">

        {/* TOP BAR */}
        <div className="topbar">

          <div className="breadcrumb">
            WORKSPACE <span>/</span> OVERVIEW
          </div>

          <div className="topbar-right">

            <span className="live-indicator">
              <i />
              LIVE WORKSPACE
            </span>

            <span className="role-label">
              {auth.role === 'ADMIN'
                ? 'ADMIN'
                : 'TEAM MEMBER'}
            </span>

            <div className="top-avatar">
              {(auth.fullName || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>
        </div>

        {/* HERO HEADER */}
        <header className="hero-header">

          <div>
            <p className="overline">
              YOUR TEAM, IN SYNC
            </p>

            <h1>
              Knowledge command center<span>.</span>
            </h1>

            <p className="hero-description">
              One connected view of your team's work,
              decisions and handover risks.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={generateReport}
            disabled={loading}
          >
            <Sparkles size={17} />

            {loading
              ? 'Generating...'
              : 'Generate handover'}

            <ArrowUpRight size={17} />
          </button>

        </header>

        {/* MESSAGES */}
        {error && (
          <div className="message error-message">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            <CircleCheck size={17} />
            {success}
          </div>
        )}

        {/* METRICS */}
        <section className="metric-grid">

          <div className="metric-card featured-metric">

            <div className="metric-top">
              <span>Total knowledge</span>

              <span className="metric-icon">
                <Database size={21} />
              </span>
            </div>

            <strong>{items.length}</strong>

            <small>Records in your workspace</small>

            <div className="metric-bottom">
              <span className="metric-line" />
              Connected knowledge
            </div>

          </div>

          <div className="metric-card">

            <div className="metric-top">
              <span>Tasks</span>

              <span className="metric-icon violet">
                <CheckSquare size={21} />
              </span>
            </div>

            <strong>{counts.tasks}</strong>

            <small>Work items being tracked</small>

            <div className="metric-bottom">
              Execution
              <b>{taskStats.percentage}% complete</b>
            </div>

          </div>

          <div className="metric-card">

            <div className="metric-top">
              <span>Decisions</span>

              <span className="metric-icon teal">
                <GitBranch size={21} />
              </span>
            </div>

            <strong>{counts.decisions}</strong>

            <small>Documented team decisions</small>

            <div className="metric-bottom">
              Knowledge <b>preserved</b>
            </div>

          </div>

          <div className="metric-card">

            <div className="metric-top">
              <span>Open issues</span>

              <span className="metric-icon orange">
                <AlertTriangle size={21} />
              </span>
            </div>

            <strong>
              {items.filter(
                i =>
                  i.type === 'ISSUE' &&
                  i.status !== 'RESOLVED'
              ).length}
            </strong>

            <small>Issues needing attention</small>

            <div className="metric-bottom">
              Risk <b>monitoring</b>
            </div>

          </div>

        </section>

        {/* ANALYTICS */}
        <section className="visual-grid">

          <div className="surface analytics-surface">

            <div className="section-heading">

              <div>
                <span className="section-kicker">
                  PERFORMANCE
                </span>

                <h2>Execution analytics</h2>

                <p>
                  A real-time snapshot of task progress.
                </p>
              </div>

              <span className="mini-badge">
                LIVE DATA
              </span>

            </div>

            <div className="analytics-body">

              <div className="donut-wrap">

                <div
                  className="donut"
                  style={chartStyle}
                >
                  <div className="donut-center">
                    <strong>
                      {taskStats.percentage}%
                    </strong>

                    <span>COMPLETED</span>
                  </div>
                </div>

                <p>Task completion rate</p>

              </div>

              <div className="legend-list">

                <div>
                  <i className="legend-purple" />
                  <span>Completed</span>
                  <b>{taskStats.completed}</b>
                </div>

                <div>
                  <i className="legend-teal" />
                  <span>In progress</span>
                  <b>{taskStats.inProgress}</b>
                </div>

                <div>
                  <i className="legend-orange" />
                  <span>Blocked</span>
                  <b>{taskStats.blocked}</b>
                </div>

                <div>
                  <i className="legend-grey" />
                  <span>Pending</span>
                  <b>{taskStats.pending}</b>
                </div>

              </div>
            </div>

            <div className="analytics-foot">
              <span>
                {taskStats.completed} of {taskStats.total} tasks completed
              </span>

              <span>
                {taskStats.total} total tasks
              </span>
            </div>

          </div>

          {/* PROGRESS OVERVIEW */}
          <div className="surface progress-surface">

            <div className="section-heading">

              <div>
                <span className="section-kicker">
                  PROJECT HEALTH
                </span>

                <h2>Progress overview</h2>

                <p>
                  How work is moving across the team.
                </p>
              </div>

              <span className="health-icon">
                <Activity size={21} />
              </span>

            </div>

            <div className="progress-number">

              <strong>
                {taskStats.percentage}
                <small>%</small>
              </strong>

              <span>overall completion</span>

            </div>

            <div className="progress-track">
              <div
                style={{
                  width: `${taskStats.percentage}%`
                }}
              />
            </div>

            <div className="progress-breakdown">

              <div>
                <span className="break-dot teal" />
                <b>{taskStats.completed}</b>
                <small>Completed</small>
              </div>

              <div>
                <span className="break-dot purple" />
                <b>{taskStats.inProgress}</b>
                <small>In progress</small>
              </div>

              <div>
                <span className="break-dot orange" />
                <b>{taskStats.blocked}</b>
                <small>Blocked</small>
              </div>

            </div>

            <div className="progress-note">
              <span>
                <Sparkles size={17} />
              </span>

              <p>
                {taskStats.total
                  ? `${taskStats.pending} task(s) are still pending.`
                  : 'Add tasks to start tracking project progress.'}
              </p>
            </div>

          </div>

        </section>

        {/* KNOWLEDGE NETWORK */}
        <section className="surface map-surface">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                CONNECTED WORKSPACE
              </span>

              <h2>Knowledge network</h2>

              <p>
                A visual map of the information your team is preserving.
              </p>
            </div>

            <span className="network-label">
              <i />
              {items.length} CONNECTED RECORDS
            </span>

          </div>

          <div className="network-visual">

            <svg
              className="network-lines"
              viewBox="0 0 900 270"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M450 132 L190 55 M450 132 L710 55 M450 132 L190 215 M450 132 L710 215" />
              <path d="M190 55 L710 55 M190 215 L710 215" />

              <circle cx="450" cy="132" r="5" />
              <circle cx="190" cy="55" r="4" />
              <circle cx="710" cy="55" r="4" />
              <circle cx="190" cy="215" r="4" />
              <circle cx="710" cy="215" r="4" />
            </svg>

            <div className="network-node node-tasks">
              <span>
                <CheckSquare size={20} />
              </span>

              <b>{counts.tasks}</b>
              <small>TASKS</small>
            </div>

            <div className="network-node node-decisions">
              <span>
                <GitBranch size={20} />
              </span>

              <b>{counts.decisions}</b>
              <small>DECISIONS</small>
            </div>

            <div className="network-center">

              <div className="network-core">R</div>

              <b>ProjectRelay</b>
              <small>TEAM KNOWLEDGE</small>

            </div>

            <div className="network-node node-issues">
              <span>
                <AlertTriangle size={20} />
              </span>

              <b>{counts.issues}</b>
              <small>ISSUES</small>
            </div>

            <div className="network-node node-updates">
              <span>
                <RefreshCw size={20} />
              </span>

              <b>{counts.updates}</b>
              <small>UPDATES</small>
            </div>

          </div>

          <div className="network-caption">
            <span>
              <i className="legend-purple" />
              Tasks
            </span>

            <span>
              <i className="legend-teal" />
              Decisions
            </span>

            <span>
              <i className="legend-orange" />
              Issues
            </span>

            <span>
              <i className="legend-blue" />
              Updates
            </span>
          </div>

        </section>

        {/* INSIGHTS AND ACTIVITY */}
        <section className="insight-grid">

          <div className="surface insight-surface">

            <div className="section-heading">

              <div>
                <span className="section-kicker">
                  RELAY INTELLIGENCE
                </span>

                <h2>Workspace insights</h2>

                <p>
                  Automated checks based on your saved records.
                </p>
              </div>

              <span className="ai-spark">
                <Sparkles size={22} />
              </span>

            </div>

            <div className="insight-list">

              {insights.map((insight, index) => {
                const Icon =
                  insightIcons[insight.icon] || Lightbulb;

                return (
                  <div
                    className="insight-row"
                    key={index}
                  >
                    <div
                      className={`insight-icon ${insight.tone}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div>
                      <b>{insight.title}</b>
                      <p>{insight.detail}</p>
                    </div>
                  </div>
                );
              })}

            </div>

          </div>

          {/* RECENT ACTIVITY */}
          <div className="surface activity-surface">

            <div className="section-heading">

              <div>
                <span className="section-kicker">
                  WORKSPACE FEED
                </span>

                <h2>Recent activity</h2>

                <p>
                  Your latest knowledge records.
                </p>
              </div>

              <button
                className="text-button"
                onClick={() => navigateTo('recent-knowledge')}
              >
                View all <ArrowUpRight size={15} />
              </button>

            </div>

            {latestItems.length ? (
              <div className="activity-list">

                {latestItems.map(item => {
                  const ItemIcon =
                    item.type === 'TASK'
                      ? CheckSquare
                      : item.type === 'DECISION'
                        ? GitBranch
                        : item.type === 'ISSUE'
                          ? AlertTriangle
                          : RefreshCw;

                  return (
                    <div
                      className="activity-row"
                      key={item.id}
                    >
                      <div
                        className={`activity-icon ${statusClass(item.type)}`}
                      >
                        <ItemIcon size={18} />
                      </div>

                      <div className="activity-copy">
                        <b>{item.title}</b>

                        <span>
                          {item.ownerName || 'Unassigned'}
                          {' · '}
                          {item.type}
                        </span>
                      </div>

                      <span
                        className={`status-pill ${statusClass(item.status)}`}
                      >
                        {(item.status || '').replaceAll('_', ' ')}
                      </span>
                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="activity-empty">
                Your activity will appear here when you add records.
              </div>
            )}

          </div>

        </section>

        {/* ADD KNOWLEDGE AND GAP DETECTOR */}
        <section className="content-grid">

          {/* ADD KNOWLEDGE FORM */}
          <div
            className="surface form-surface"
            id="knowledge-base"
          >

            <div className="section-heading">

              <div>
                <span className="section-kicker">
                  CAPTURE KNOWLEDGE
                </span>

                <h2>Add to your knowledge base</h2>

                <p>
                  Keep important project context in one place.
                </p>
              </div>

              <span className="form-icon">
                <Plus size={22} />
              </span>

            </div>

            <form onSubmit={addItem}>

              <label>
                Title <em>*</em>

                <input
                  required
                  value={form.title}
                  onChange={e =>
                    updateForm('title', e.target.value)
                  }
                  placeholder="e.g. Payment API integration"
                />
              </label>

              <div className="two">

                <label>
                  Type <em>*</em>

                  <select
                    required
                    value={form.type}
                    onChange={e =>
                      updateForm('type', e.target.value)
                    }
                  >
                    <option value="TASK">Task</option>
                    <option value="DECISION">Decision</option>
                    <option value="ISSUE">Issue</option>
                    <option value="UPDATE">Update</option>
                  </select>
                </label>

                <label>
                  Status <em>*</em>

                  <select
                    required
                    value={form.status}
                    onChange={e =>
                      updateForm('status', e.target.value)
                    }
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </label>

              </div>

              <label>
                Importance <em>*</em>

                <select
                  required
                  value={form.importance}
                  onChange={e =>
                    updateForm('importance', e.target.value)
                  }
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>

              <label>
                Owner <em>*</em>

                <input
                  required
                  value={form.ownerName}
                  onChange={e =>
                    updateForm('ownerName', e.target.value)
                  }
                  placeholder="Who is responsible?"
                />
              </label>

              <label>
                Details <em>*</em>

                <textarea
                  required
                  value={form.details}
                  onChange={e =>
                    updateForm('details', e.target.value)
                  }
                  placeholder="Add context, progress and next steps..."
                />
              </label>

              {form.type === 'DECISION' && (
                <label>
                  Reason for decision <em>*</em>

                  <textarea
                    required
                    value={form.decisionReason}
                    onChange={e =>
                      updateForm('decisionReason', e.target.value)
                    }
                    placeholder="Why was this decision made?"
                  />
                </label>
              )}

              <button
                className="primary-button submit-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={17} />
                    Saving record...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Save knowledge item
                  </>
                )}
              </button>

              <p className="form-hint">
                * All fields are mandatory.
              </p>

            </form>

          </div>

          {/* KNOWLEDGE LOSS DETECTOR */}
          <div
            className="surface detector-surface"
            id="knowledge-gaps"
          >

            <div className="section-heading">

              <div>
                <span className="section-kicker">
                  RISK DETECTION
                </span>

                <h2>Knowledge loss detector</h2>

                <p>
                  Identify what could be missed during a handover.
                </p>
              </div>

              <span className="detector-icon">
                <ScanSearch size={22} />
              </span>

            </div>

            <div className="detector-banner">

              <div className="detector-symbol">
                <ShieldCheck size={25} />
              </div>

              <div>
                <b>Protect your team's knowledge</b>

                <p>
                  Scan for missing context, unassigned work,
                  undocumented decisions and unresolved issues.
                </p>
              </div>

            </div>

            <button
              className="secondary-button"
              onClick={scanGaps}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={17} />
                  Scanning workspace...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Scan for knowledge gaps
                </>
              )}
            </button>

            <div className="gap-results">

              <div className="gap-results-title">
                SCAN RESULTS
                <span>{gaps.length}</span>
              </div>

              {gaps.length ? (
                gaps.map((gap, index) => (
                  <div
                    className="gap-row"
                    key={gap.id ?? index}
                  >
                    <span
                      className={`gap-severity ${statusClass(gap.severity)}`}
                    />

                    <div>
                      <b>{gap.title}</b>
                      <p>{gap.message}</p>
                      <small>{gap.suggestedAction}</small>
                    </div>

                    <strong>{gap.severity}</strong>
                  </div>
                ))
              ) : (
                <p className="empty-hint">
                  No scan results yet. Run a scan to check your workspace.
                </p>
              )}

            </div>

          </div>

        </section>

        {/* KNOWLEDGE RECORDS TABLE */}
        <section
          className="surface records-surface"
          id="recent-knowledge"
        >

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                KNOWLEDGE LIBRARY
              </span>

              <h2>Recent knowledge records</h2>

              <p>
                Browse and manage your team's saved information.
              </p>
            </div>

            <span className="record-count">
              {items.length} RECORDS
            </span>

          </div>

<div className="record-search">
  <Search size={17} />

  <input
    type="search"
    value={recordSearch}
    onChange={e => {
      const value = e.target.value;
      setRecordSearch(value);
      loadItems(value);
    }}
    placeholder="Search records, owners or status..."
    aria-label="Search knowledge records"
  />
</div>

          {filteredItems.length ? (
            <div className="table-scroll">

              <table>
                <thead>
                <tr>
  <th>RECORD</th>
  <th>TYPE</th>
  <th>OWNER</th>
  <th>STATUS</th>
  <th>IMPORTANCE</th>
  <th>RISK SCORE</th>
  {isAdmin && <th>ACTION</th>}
</tr>
                </thead>

                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id}>

                      <td>
                        <b>{item.title}</b>
                        <small>{item.details}</small>
                      </td>

                      <td>
                        <span className="type-pill">
                          {item.type}
                        </span>
                      </td>

                      <td>
                        {item.ownerName || 'Unassigned'}
                      </td>

                      <td>
                        <span
                          className={`status-pill ${statusClass(item.status)}`}
                        >
                          {(item.status || '').replaceAll('_', ' ')}
                        </span>
                      </td>

                      <td>
  {item.importance || 'MEDIUM'}
</td>

<td>
  <strong>{item.riskScore ?? 0} / 100</strong>
  <br />
  <span>
    {item.riskLevel || 'LOW'}
  </span>
</td>

                      {isAdmin && (
                        <td>
                          <button
                            className="delete-button"
                            onClick={() => removeItem(item.id)}
                            title="Delete record"
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </td>
                      )}

                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          ) : (
            <div className="empty-table">
              {items.length
                ? 'No records match your search.'
                : 'No records yet. Add your first knowledge item above.'}
            </div>
          )}

        </section>

        
{/* HANDOVER REPORT */}
{report && (
  <section
    className="surface report-surface"
    id="handover-report"
  >
    <div className="report-header">
      <div>
        <span className="section-kicker">
          PROJECT DOCUMENTATION
        </span>

        <h2>Handover Report</h2>

        <p>
          A structured overview of your team's knowledge
          and project progress.
        </p>

        <span className="report-date">
          <Clock3 size={14} />
          {report.generatedAt
            ? new Date(report.generatedAt).toLocaleString()
            : 'Generated just now'}
        </span>
      </div>

      <button
        className="secondary-button print-button"
        onClick={printReport}
      >
        <Printer size={17} />
        Print / Save PDF
      </button>
    </div>

    <div className="report-metrics">
      <div className="report-stat">
        <Database size={20} />
        <strong>{report.totalItems ?? items.length}</strong>
        <span>Knowledge items</span>
      </div>

      <div className="report-stat">
        <AlertTriangle size={20} />
        <strong>
          {report.totalGaps ??
            report.knowledgeGaps?.length ??
            0}
        </strong>
        <span>Knowledge gaps</span>
      </div>
    </div>

    <div className="report-section-grid">
      {[
        {
          key: 'tasks',
          title: 'Tasks',
          description: 'Work items and responsibilities',
          Icon: CheckSquare,
          tone: 'report-purple'
        },
        {
          key: 'decisions',
          title: 'Decisions',
          description: 'Important project decisions',
          Icon: GitBranch,
          tone: 'report-teal'
        },
        {
          key: 'issues',
          title: 'Issues',
          description: 'Problems requiring attention',
          Icon: AlertTriangle,
          tone: 'report-orange'
        }
      ].map(({ key, title, description, Icon, tone }) => (
        <div className="report-category-card" key={key}>
          <div className="report-category-heading">
            <div className={`report-category-icon ${tone}`}>
              <Icon size={20} />
            </div>

            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>

            <span className="report-count">
              {report[key]?.length ?? 0}
            </span>
          </div>

          <div className="report-record-list">
            {report[key]?.length ? (
              report[key].map(item => (
                <div className="report-record" key={item.id}>
                  <div className="report-record-top">
                    <b>{item.title}</b>

                    <span className={`status-pill ${statusClass(item.status)}`}>
                      {(item.status || 'OPEN').replaceAll('_', ' ')}
                    </span>
                  </div>

                  <p>{item.details || 'No additional details provided.'}</p>

                  <div className="report-owner">
                    <span className="owner-avatar">
                      {(item.ownerName || 'U').charAt(0).toUpperCase()}
                    </span>
                    <span>{item.ownerName || 'Unassigned'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="report-empty">
                <CircleCheck size={19} />
                <span>No {title.toLowerCase()} recorded.</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    <div className="report-gaps-card">
      <div className="report-gaps-heading">
        <div className="report-category-icon report-orange">
          <ShieldCheck size={21} />
        </div>

        <div>
          <h3>Knowledge gaps requiring attention</h3>
          <p>Items that may need attention during handover.</p>
        </div>

        <span className="report-count">
          {report.knowledgeGaps?.length ?? 0}
        </span>
      </div>

      {report.knowledgeGaps?.length ? (
        <div className="report-gap-list">
          {report.knowledgeGaps.map((gap, index) => (
            <div className="report-gap-item" key={gap.id ?? index}>
              <div className="gap-alert-icon">
                <AlertTriangle size={18} />
              </div>

              <div className="report-gap-content">
                <div className="report-record-top">
                  <b>{gap.title}</b>

                  <span className={`gap-severity ${statusClass(gap.severity)}`}>
                    {gap.severity}
                  </span>
                </div>

                <p>{gap.message}</p>

                {gap.suggestedAction && (
                  <div className="suggested-action">
                    <Lightbulb size={15} />
                    <span>{gap.suggestedAction}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="report-empty report-healthy">
          <ShieldCheck size={20} />
          No knowledge gaps detected. Your recorded information
          is ready for handover.
        </div>
      )}
    </div>

    <div className="report-footer">
      <Layers3 size={17} />
      <span>PROJECTRELAY · TEAM KNOWLEDGE PRESERVATION</span>
    </div>
  </section>
)}

        {/* FOOTER */}
        <footer className="app-footer">
          <span className="footer-signature">
            SisParadox
          </span>
        </footer>

      </main>
    </div>
  );
}
