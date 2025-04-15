import React, { useEffect, useState } from 'react';
import JobForm from '../components/JobForm';
import JobRow from '../components/JobRow';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const AUTH_KEY = 'auth';
const AUTH_MAX_AGE = 12 * 60 * 60 * 1000; // 12 hours in ms

function LoginForm({ onLogin, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = e => {
    e.preventDefault();
    onLogin(username, password);
  };
  return (
    <form onSubmit={handleSubmit} className="max-w-xs mx-auto mt-20 bg-white/90 p-6 rounded-xl shadow flex flex-col gap-4 animate-fade-in-form">
      <h2 className="text-lg font-semibold">Login Required</h2>
      <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="border p-2 rounded-lg" autoFocus />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 rounded-lg" />
      <button type="submit" className="bg-blue-600 text-white py-2 rounded-lg font-semibold">Login</button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <style>{`
        @keyframes fade-in-form { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        .animate-fade-in-form { animation: fade-in-form 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </form>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auth, setAuth] = useState(null); // { username, password }
  const [loginError, setLoginError] = useState(null);

  // On mount, check for persisted auth
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      try {
        const { username, password, ts } = JSON.parse(saved);
        if (Date.now() - ts < AUTH_MAX_AGE) {
          setAuth({ username, password });
        } else {
          localStorage.removeItem(AUTH_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  const getAuthHeader = () => {
    if (!auth) return {};
    const token = btoa(`${auth.username}:${auth.password}`);
    return { Authorization: `Basic ${token}` };
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/jobs`, { headers: getAuthHeader() });
      setJobs(res.data);
      setError(null);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setAuth(null);
        setLoginError('Invalid username or password');
        localStorage.removeItem(AUTH_KEY);
      } else {
        setError('Failed to fetch jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvs = async () => {
    try {
      const res = await axios.get(`${API_URL}/envs`, { headers: getAuthHeader() });
      setEnvs(res.data);
    } catch {}
  };

  useEffect(() => {
    if (auth) {
      fetchEnvs();
      fetchJobs();
    }
    // eslint-disable-next-line
  }, [auth]);

  const getEnvName = (key) => envs.find(e => e.key === key)?.name || key;

  const handleLogin = async (username, password) => {
    setLoginError(null);
    try {
      const token = btoa(`${username}:${password}`);
      await axios.get(`${API_URL}/jobs`, { headers: { Authorization: `Basic ${token}` } });
      const authData = { username, password, ts: Date.now() };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      setAuth({ username, password });
    } catch {
      setLoginError('Invalid username or password');
      localStorage.removeItem(AUTH_KEY);
    }
  };

  if (!auth) {
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Scheduled Jobs</h2>
        <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition">Logout</button>
      </div>
      <JobForm onAdd={fetchJobs} auth={auth} />
      {loading ? (
        <div className="mt-4">Loading...</div>
      ) : error ? (
        <div className="mt-4 text-red-600">{error}</div>
      ) : (
        <table className="min-w-full mt-4 bg-white shadow rounded">
          <thead>
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Date & Time</th>
              <th className="p-2 text-left">Environment</th>
              <th className="p-2 text-left">Last Run</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <JobRow key={job.id} job={{ ...job, envName: getEnvName(job.env) }} onDelete={fetchJobs} auth={auth} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 