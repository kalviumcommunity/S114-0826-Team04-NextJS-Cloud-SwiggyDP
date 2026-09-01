'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Batch, BatchReassignedPayload } from '@/types';
import mockSocket from '@/lib/socket';

export default function AdminMonitor() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setBatches(mockSocket.listBatches());

    const unsub1 = mockSocket.on<Batch>('batch_created', (batch: Batch) => {
      setLogs((s) => [`Batch created ${batch.id}`, ...s]);
      refresh();
    });
    const unsub2 = mockSocket.on<Batch>('batch_update', (batch: Batch) => {
      setLogs((s) => [
        `Batch update ${batch.id} status=${batch.status}`,
        ...s,
      ]);
      refresh();
    });
    const unsub3 = mockSocket.on<BatchReassignedPayload>(
      'batch_reassigned',
      (p: BatchReassignedPayload) => {
        setLogs((s) => [
          `Batch reassigned ${p.batch.id} -> ${p.partnerId}`,
          ...s,
        ]);
        refresh();
      }
    );

    // initial load
    refresh();
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  function createDemo() {
    const names = ['Rahul Sharma', 'You', 'Anjali Nair', 'Vikram Singh'].slice(
      0,
      Math.floor(Math.random() * 3) + 2
    );
    const b = mockSocket.createBatch(names);
    setLogs((s) => [`Created demo batch ${b.id}`, ...s]);
    setBatches(mockSocket.listBatches());
  }

  function forceReassign(batchId: string) {
    mockSocket.reassign(batchId);
    setLogs((s) => [`Forced reassign for ${batchId}`, ...s]);
    setBatches(mockSocket.listBatches());
  }

  return (
    <main className="min-h-screen p-8 bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-slate-400 hover:text-white underline">
          ← Home
        </Link>

        <h1 className="text-2xl font-bold mt-4">Operations Monitor</h1>
        <p className="text-sm text-slate-400">
          Monitor active batches, inspect status, and observe rapid reassignments.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={createDemo}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 font-semibold rounded-lg text-sm transition"
          >
            + Create Demo Batch
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h3 className="font-semibold text-base text-white">Active Batches</h3>
            <ul className="mt-3 text-sm space-y-3 text-slate-300">
              {batches.length === 0 && (
                <li className="text-slate-500 py-4 text-center">No active batches</li>
              )}
              {batches.map((b) => (
                <li key={b.id} className="border border-slate-800 bg-slate-800/30 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white">{b.id}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Status: <span className="text-amber-400 font-mono">{b.status}</span> • Partner: {b.partnerId ?? '—'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Orders: {b.orders.length} • ETA: {b.etaMinutes}m
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => forceReassign(b.id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 font-medium rounded text-xs transition"
                      >
                        Reassign
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h3 className="font-semibold text-base text-white">Event Log</h3>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-400 bg-slate-950 p-3 rounded-lg h-72 overflow-auto font-mono">
              {logs.length === 0 && <li className="text-slate-600">Waiting for live events...</li>}
              {logs.map((l, i) => (
                <li key={i} className="leading-relaxed border-b border-slate-900/60 pb-1">{l}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
