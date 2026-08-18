import Link from "next/link";
import { Bike, UserCheck, ShieldAlert } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-white">
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-block bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-1.5 rounded-full text-sm font-semibold">
          Swiggy Delivery Partner Batching Engine
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Smart Batching & Instant Reassignment
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Optimizing multi-order deliveries, sub-second partner reassignments,
          and transparent customer tracking.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-8 text-left">
          {/* Partner View */}
          <Link
            href="/partner/dashboard"
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-orange-500 transition duration-200 group"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4 group-hover:bg-orange-500 group-hover:text-white transition">
              <Bike size={22} />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Partner App</h2>
            <p className="text-xs text-slate-400">
              Accept or reject batch offers with a 15-second live countdown.
            </p>
          </Link>

          {/* Customer View */}
          <Link
            href="/customer/track/order-101"
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500 transition duration-200 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition">
              <UserCheck size={22} />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Customer View</h2>
            <p className="text-xs text-slate-400">
              Track delivery queue position (e.g. Stop 1 of 2) in real time.
            </p>
          </Link>

          {/* Admin / Monitor View */}
          <Link
            href="/admin/monitor"
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500 transition duration-200 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition">
              <ShieldAlert size={22} />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Admin Monitor</h2>
            <p className="text-xs text-slate-400">
              Trigger order batches and simulate instant reject-reassignments.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
