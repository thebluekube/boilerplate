import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function StatusDot({ status }) {
  let color = 'bg-gray-400';
  if (status === 'scheduled') color = 'bg-yellow-400';
  else if (status === 'success' || status === 'completed') color = 'bg-green-500';
  else if (status === 'failed') color = 'bg-red-500';
  return <span className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${color}`}></span>;
}

function Spinner() {
  return (
    <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin align-middle"></span>
  );
}

function Toast({ message, type, onClose }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      style={{ minWidth: 200 }}>
      {message}
      <button className="ml-4 text-white/70 hover:text-white" onClick={onClose}>✕</button>
    </div>
  );
}

function DecisionDot({ decision }) {
  let color = 'bg-yellow-400';
  if (decision === 'approved') color = 'bg-green-500';
  else if (decision === 'denied') color = 'bg-red-500';
  return <span className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${color}`}></span>;
}

export default function JobRow({ job, onDelete, auth }) {
  const [deleting, setDeleting] = useState(false);
  const [fade, setFade] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [reminding, setReminding] = useState(false);
  const [toast, setToast] = useState(null);
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);

  const getAuthHeader = () => {
    if (!auth) return {};
    const token = btoa(`${auth.username}:${auth.password}`);
    return { Authorization: `Basic ${token}` };
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete job "${job.name}"?`)) return;
    setDeleting(true);
    setFade(true);
    setTimeout(async () => {
      try {
        await axios.delete(`${API_URL}/jobs/${job.id}`, { headers: getAuthHeader() });
        if (onDelete) onDelete();
      } catch {
        alert('Failed to delete job');
      } finally {
        setDeleting(false);
        setFade(false);
      }
    }, 400);
  };

  const handleExpand = async () => {
    if (!expanded && logs === null) {
      setLoadingLogs(true);
      setLogsError(null);
      try {
        const res = await axios.get(`${API_URL}/jobs/${job.id}/logs`, { headers: getAuthHeader() });
        setLogs(res.data);
      } catch {
        setLogsError('Failed to load logs');
      } finally {
        setLoadingLogs(false);
      }
    }
    setExpanded(e => !e);
  };

  const handleRemind = async e => {
    e.stopPropagation();
    setReminding(true);
    setToast(null);
    try {
      await axios.post(`${API_URL}/jobs/${job.id}/remind`, {}, { headers: getAuthHeader() });
      setToast({ message: 'Reminder sent!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to send reminder', type: 'error' });
    } finally {
      setReminding(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleApprove = async e => {
    e.stopPropagation();
    setApproving(true);
    setToast(null);
    try {
      await axios.post(`${API_URL}/jobs/${job.id}/approve`, {}, { headers: getAuthHeader() });
      setToast({ message: 'Job approved!', type: 'success' });
      if (onDelete) onDelete();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to approve job', type: 'error' });
    } finally {
      setApproving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleDeny = async e => {
    e.stopPropagation();
    setDenying(true);
    setToast(null);
    try {
      await axios.post(`${API_URL}/jobs/${job.id}/deny`, {}, { headers: getAuthHeader() });
      setToast({ message: 'Job denied!', type: 'success' });
      if (onDelete) onDelete();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to deny job', type: 'error' });
    } finally {
      setDenying(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const isScheduled = job.status === 'scheduled';
  const isFuture = new Date(job.runAt) > new Date();
  const canRemind = isScheduled && isFuture && job.decision === 'approved';
  const canApproveDeny = job.decision === 'pending' && isScheduled;

  const decisionLabel = job.decision
    ? job.decision.charAt(0).toUpperCase() + job.decision.slice(1)
    : 'Pending';

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <tr
        className={`border-t transition-all duration-400 ${fade ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} animate-fade-in-row hover:bg-blue-50 cursor-pointer`}
        onClick={handleExpand}
        title="Click to view logs"
      >
        <td className="p-2">{job.name}</td>
        <td className="p-2 text-xs">{job.runAt ? new Date(job.runAt).toLocaleString() : '-'}</td>
        <td className="p-2">{job.envName}</td>
        <td className="p-2 text-xs">{job.lastRun ? new Date(job.lastRun).toLocaleString() : '-'}</td>
        <td className="p-2 text-xs flex items-center">
          <StatusDot status={job.status} />
          {job.status || '-'}
        </td>
        <td className="p-2">
          <div className="flex items-center gap-x-6">
            {/* Status/Decision Indicator */}
            {job.decision !== 'pending' && (
              <span className="flex items-center font-semibold text-base">
                <span className={
                  job.decision === 'approved' ? 'text-green-600' :
                  job.decision === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }>
                  {decisionLabel}
                </span>
              </span>
            )}
            {/* Action Buttons */}
            <div className="flex items-center gap-x-3">
              {canApproveDeny && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="text-green-600 hover:underline disabled:opacity-50 transition-transform hover:scale-110 py-1 font-semibold"
                  >
                    {approving ? <Spinner /> : null} Approve
                  </button>
                  <button
                    onClick={handleDeny}
                    disabled={denying}
                    className="text-red-600 hover:underline disabled:opacity-50 transition-transform hover:scale-110 py-1 font-semibold"
                  >
                    {denying ? <Spinner /> : null} Deny
                  </button>
                </>
              )}
              <button
                onClick={e => { e.stopPropagation(); handleDelete(); }}
                disabled={deleting || canApproveDeny}
                className="text-red-600 hover:underline disabled:opacity-50 transition-transform hover:scale-110 py-1"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleRemind}
                disabled={!canRemind || reminding}
                className={`text-blue-600 hover:underline disabled:opacity-50 transition-transform hover:scale-110 flex items-center gap-1 py-1 ${!canRemind ? 'cursor-not-allowed' : ''}`}
                title={canRemind ? 'Send reminder' : 'Cannot remind for completed, denied, or past jobs'}
              >
                {reminding ? <Spinner /> : null}
                Send Reminder
              </button>
            </div>
          </div>
        </td>
        <style>{`
          @keyframes fade-in-row { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
          .animate-fade-in-row { animation: fade-in-row 0.5s cubic-bezier(.4,0,.2,1) both; }
        `}</style>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50 border-b p-0">
            <div className="p-4 animate-expand-log">
              {loadingLogs ? (
                <div className="flex items-center gap-2 text-blue-500"><Spinner /> Loading logs...</div>
              ) : logsError ? (
                <div className="text-red-600">{logsError}</div>
              ) : logs && logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">{log.runAt ? new Date(log.runAt).toLocaleString() : ''} &middot; {log.status}</div>
                    <pre className="bg-gray-900 text-green-200 text-xs rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-64 shadow-inner">
                      {log.output}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic">No logs yet.</div>
              )}
            </div>
            <style>{`
              @keyframes expand-log { from { max-height: 0; opacity: 0; } to { max-height: 500px; opacity: 1; } }
              .animate-expand-log { animation: expand-log 0.5s cubic-bezier(.4,0,.2,1) both; }
            `}</style>
          </td>
        </tr>
      )}
    </>
  );
} 