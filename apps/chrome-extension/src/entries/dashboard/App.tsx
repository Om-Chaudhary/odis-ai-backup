import { DischargeTable } from './components/DischargeTable';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Daily Discharges</h1>
          <p className="mt-2 text-lg text-gray-600">Manage and send discharge summaries for today's cases.</p>
        </header>

        <main>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DischargeTable />
          </div>
        </main>
      </div>
    </div>
  );
}
