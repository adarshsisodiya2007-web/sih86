/**
 * ServerConfigModal.tsx
 * Allows tester/citizen to inspect and update the backend server endpoint
 * (e.g. Wi-Fi IP or Render.com production URL).
 */
import React, { useState } from 'react'
import { getActiveBackendUrl, setActiveBackendUrl, DEFAULT_REMOTE_BACKEND } from '../api'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export const ServerConfigModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const [currentUrl, setCurrentUrl] = useState<string>(getActiveBackendUrl())
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleTest = async () => {
    setTestStatus('testing')
    setErrorMsg('')
    const start = performance.now()
    const target = currentUrl.trim().replace(/\/+$/, '')

    try {
      const res = await fetch(`${target}/api/health`, { method: 'GET' })
      const elapsed = Math.round(performance.now() - start)
      if (res.ok) {
        setLatencyMs(elapsed)
        setTestStatus('success')
      } else {
        setTestStatus('failed')
        setErrorMsg(`Server responded with HTTP ${res.status}`)
      }
    } catch (err: any) {
      setTestStatus('failed')
      setErrorMsg(err.message || 'Cannot reach server. Check Wi-Fi or URL.')
    }
  }

  const handleSave = () => {
    setActiveBackendUrl(currentUrl.trim())
    onSaved()
    onClose()
  }

  const handleResetDefault = () => {
    setCurrentUrl(DEFAULT_REMOTE_BACKEND)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,7,17,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#0b1329] border border-cyan-500/40 rounded-3xl p-5 w-full max-w-sm shadow-2xl font-mono text-slate-100 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <div>
              <div className="font-black text-sm text-cyan-300">SERVER CONFIGURATION</div>
              <div className="text-[10px] text-slate-400">CONNECT TO BACKEND / RENDER</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-300 font-bold block mb-1.5">
            Backend API Endpoint URL:
          </label>
          <input
            type="text"
            value={currentUrl}
            onChange={e => setCurrentUrl(e.target.value)}
            placeholder="http://172.18.88.116:8000 or Render URL"
            className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            📍 Local Wi-Fi (172.18.88.116)
          </button>
          <button
            type="button"
            onClick={() => setCurrentUrl('http://10.0.2.2:8000')}
            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            📱 Android Emulator
          </button>
        </div>

        {/* Test Result Message */}
        {testStatus === 'testing' && (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-400 animate-pulse flex items-center gap-2">
            <span>⏳</span> Pinging backend...
          </div>
        )}
        {testStatus === 'success' && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500 text-xs text-emerald-300 flex items-center gap-2">
            <span>✅</span> Connected! Latency: {latencyMs}ms
          </div>
        )}
        {testStatus === 'failed' && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500 text-xs text-red-300">
            <div>❌ Connection Failed</div>
            <div className="text-[10px] text-red-400 mt-0.5">{errorMsg}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleTest}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition-colors"
          >
            TEST PING
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-[#863bff] to-cyan-500 hover:opacity-90 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition-opacity"
          >
            SAVE & SYNC
          </button>
        </div>
      </div>
    </div>
  )
}
