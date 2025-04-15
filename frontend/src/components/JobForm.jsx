import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Spinner() {
  return (
    <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin align-middle"></span>
  );
}

export default function JobForm({ onAdd, auth }) {
  const [form, setForm] = useState({ name: '', runAt: '', env: '' });
  const [envs, setEnvs] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEnvs, setLoadingEnvs] = useState(true);

  const getAuthHeader = () => {
    if (!auth) return {};
    const token = btoa(`${auth.username}:${auth.password}`);
    return { Authorization: `Basic ${token}` };
  };

  useEffect(() => {
    const fetchEnvs = async () => {
      setLoadingEnvs(true);
      try {
        const res = await axios.get(`${API_URL}/envs`, { headers: getAuthHeader() });
        setEnvs(res.data);
        setForm(f => ({ ...f, env: res.data[0]?.key || '' }));
        setError(null);
      } catch {
        setError('Failed to load environments');
      } finally {
        setLoadingEnvs(false);
      }
    };
    fetchEnvs();
    // eslint-disable-next-line
  }, [auth]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    if (!form.name || !form.runAt || !form.env) {
      setError('All fields are required');
      setSubmitting(false);
      return;
    }
    // Convert local datetime to UTC ISO string
    const localDate = new Date(form.runAt);
    const runAtIso = localDate.toISOString();
    try {
      await axios.post(`${API_URL}/jobs`, {
        name: form.name,
        runAt: runAtIso,
        env: form.env,
      }, { headers: getAuthHeader() });
      setForm({ name: '', runAt: '', env: envs[0]?.key || '' });
      if (onAdd) onAdd();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 p-4 rounded-xl shadow mb-4 flex flex-wrap gap-4 items-end animate-fade-in-form">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 transition" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date & Time</label>
        <input name="runAt" type="datetime-local" value={form.runAt} onChange={handleChange} required className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 transition" />
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium mb-1">Environment</label>
        {loadingEnvs ? (
          <div className="flex items-center gap-2"><Spinner /> <span>Loading...</span></div>
        ) : (
          <select name="env" value={form.env} onChange={handleChange} required className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 transition w-full">
            {envs.map(env => (
              <option key={env.key} value={env.key}>{env.name}</option>
            ))}
          </select>
        )}
      </div>
      <button type="submit" disabled={submitting || loadingEnvs} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg shadow transition transform hover:scale-105 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 flex items-center gap-2">
        {submitting ? <Spinner /> : null}
        {submitting ? 'Adding...' : 'Add Job'}
      </button>
      {error && <div className="text-red-600 ml-4">{error}</div>}
      <style>{`
        @keyframes fade-in-form { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        .animate-fade-in-form { animation: fade-in-form 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </form>
  );
} 