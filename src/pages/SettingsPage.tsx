import { BellRing, DatabaseZap, Save, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { SectionHeading } from '../components/SectionHeading'
import { useToast } from '../hooks/useToast'
import { getApiBaseUrl, getAuthToken, setApiBaseUrl, setAuthToken } from '../utils/backend-config'

export function SettingsPage() {
  const { pushToast } = useToast()
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl())
  const [authToken, setAuthTokenState] = useState(getAuthToken())

  const settings = [
    {
      icon: BellRing,
      title: 'Live refresh',
      description:
        'Dashboard, shops, reminders, deliveries, and reports refresh from the backend automatically every 10 seconds.',
    },
    {
      icon: DatabaseZap,
      title: 'Backend source',
      description:
        'Point the frontend to your running backend and provide a valid JWT access token from the internal login API.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure sync',
      description:
        'The live dashboard reads from protected APIs, so the token you save here controls what records the frontend can access.',
    },
  ]

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Settings"
        title="Live backend connection"
        description="Configure the frontend to read real-time CRM data from your running API."
      />

      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">API Base URL</span>
            <input
              value={apiBaseUrl}
              onChange={(event) => setApiBaseUrlState(event.target.value)}
              className="input"
              placeholder="http://localhost:4001/api/v1"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">JWT Access Token</span>
            <input
              value={authToken}
              onChange={(event) => setAuthTokenState(event.target.value)}
              className="input"
              placeholder="Paste access token from /auth/login"
            />
          </label>
        </div>
        <button
          onClick={() => {
            setApiBaseUrl(apiBaseUrl.trim())
            setAuthToken(authToken.trim())
            pushToast('Live settings saved', 'Refresh the page or wait for the next polling cycle.')
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1d6b57] px-5 py-3 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" />
          Save connection settings
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {settings.map((item) => (
          <section
            key={item.title}
            className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]"
          >
            <div className="w-fit rounded-2xl bg-[#eff6f4] p-3 text-[#1d6b57]">
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
