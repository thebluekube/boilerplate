import React from 'react';
import Dashboard from './pages/Dashboard';

console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-blue-100 to-blue-200 flex flex-col">
      <div className="text-xs text-gray-500 bg-yellow-100 p-2 border-b border-yellow-300">
        API URL: {import.meta.env.VITE_API_URL}
      </div>
      <header className="bg-blue-700 text-white p-4 text-2xl font-bold shadow flex items-center gap-3">
        <span className="text-3xl animate-bounce">🚀</span>
        CSF Deploy 
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl p-6 bg-white/90 rounded-2xl shadow-xl mt-8 animate-fade-in">
          <Dashboard />
        </div>
      </main>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
} 