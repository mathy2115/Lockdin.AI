import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const mockData = [
  { day: 'Mon', mood: 4, energy: 3, focus: 4, hours: 2.5, stress: 2 },
  { day: 'Tue', mood: 3, energy: 2, focus: 3, hours: 1.5, stress: 4 },
  { day: 'Wed', mood: 4, energy: 4, focus: 5, hours: 3.0, stress: 2 },
  { day: 'Thu', mood: 2, energy: 2, focus: 2, hours: 1.0, stress: 5 },
  { day: 'Fri', mood: 3, energy: 3, focus: 3, hours: 2.0, stress: 3 },
  { day: 'Sat', mood: 5, energy: 4, focus: 4, hours: 2.5, stress: 1 },
  { day: 'Sun', mood: 4, energy: 5, focus: 5, hours: 3.5, stress: 1 },
];

const avgStress = mockData.reduce((a, b) => a + b.stress, 0) / mockData.length;
const burnoutLevel = avgStress >= 4 ? 'High' : avgStress >= 2.5 ? 'Moderate' : 'Low';
const burnoutColor = burnoutLevel === 'High' ? '#FF8FAB' : burnoutLevel === 'Moderate' ? '#FFB347' : '#4FC3F7';
const burnoutPct = Math.round((avgStress / 5) * 100);

export default function Wellness() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Wellness Dashboard</h1>
        <p className="text-sm text-[var(--fa-text-secondary)] mt-1">Your 7-day focus and wellbeing overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Mood', value: '3.6 / 5', color: '#6C8EFF' },
          { label: 'Avg Energy', value: '3.3 / 5', color: '#4FC3F7' },
          { label: 'Total Hours', value: '16h', color: '#B39DDB' },
          { label: 'Avg Focus', value: '3.7 / 5', color: '#FFB347' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--fa-bg-card)] rounded-xl p-4 border border-[var(--fa-border)]">
            <p className="text-xs text-[var(--fa-text-secondary)]">{stat.label}</p>
            <p className="text-xl font-semibold mt-1" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Burnout Meter */}
      <div className="bg-[var(--fa-bg-card)] rounded-xl p-5 border border-[var(--fa-border)]">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-white">Burnout Risk</p>
          <span className="text-sm font-semibold" style={{ color: burnoutColor }}>{burnoutLevel}</span>
        </div>
        <div className="w-full bg-[var(--fa-bg-hover)] rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{ width: `${burnoutPct}%`, backgroundColor: burnoutColor }}
          />
        </div>
        <p className="text-xs text-[var(--fa-text-secondary)] mt-2">
          {burnoutLevel === 'High'
            ? 'High stress detected over the past week. Consider taking a break.'
            : burnoutLevel === 'Moderate'
            ? 'Moderate stress levels. Keep an eye on your workload.'
            : 'You\'re managing well. Keep it up!'}
        </p>
      </div>

      {/* Mood & Energy Chart */}
      <div className="bg-[var(--fa-bg-card)] rounded-xl p-5 border border-[var(--fa-border)]">
        <p className="text-sm font-medium text-white mb-4">Mood & Energy (7 days)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: '#8892AA', fontSize: 12 }} />
            <YAxis domain={[0, 5]} tick={{ fill: '#8892AA', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1A2236', border: 'none', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="mood" stroke="#6C8EFF" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="energy" stroke="#4FC3F7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Focus Hours Chart */}
      <div className="bg-[var(--fa-bg-card)] rounded-xl p-5 border border-[var(--fa-border)]">
        <p className="text-sm font-medium text-white mb-4">Focus Hours (7 days)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: '#8892AA', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8892AA', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1A2236', border: 'none', borderRadius: '8px' }} />
            <Bar dataKey="hours" fill="#B39DDB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}