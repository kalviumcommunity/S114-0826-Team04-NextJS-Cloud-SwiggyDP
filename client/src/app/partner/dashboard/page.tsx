'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Batch,
  Order,
  PartnerOfferPayload,
  PartnerAcceptedPayload,
  PartnerRejectedPayload,
} from '@/types';
import mockSocket from '@/lib/socket';

export default function PartnerDashboard() {
  const [offer, setOffer] = useState<Batch | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const offOffer = mockSocket.on<PartnerOfferPayload>(
      'partner_offer',
      (p: PartnerOfferPayload) => {
        setOffer(p.batch);
        setLogs((s) => [
          `Received offer for batch ${p.batch.id} from ${p.partnerId}`,
          ...s,
        ]);
      }
    );

    const offAccepted = mockSocket.on<PartnerAcceptedPayload>(
      'partner_accepted',
      (p: PartnerAcceptedPayload) => {
        setLogs((s) => [
          `Accepted: ${p.batch.id} by ${p.partnerId}`,
          ...s,
        ]);
        setOffer(null);
      }
    );

    const offRejected = mockSocket.on<PartnerRejectedPayload>(
      'partner_rejected',
      (p: PartnerRejectedPayload) => {
        setLogs((s) => [
          `Rejected: ${p.batch.id} by ${p.partnerId}`,
          ...s,
        ]);
        setOffer(null);
      }
    );

    return () => {
      offOffer();
      offAccepted();
      offRejected();
    };
  }, []);

  function accept() {
    if (!offer || !offer.partnerId) return;
    mockSocket.partnerRespond(offer.partnerId, true);
    setLogs((s) => [`You accepted ${offer.id}`, ...s]);
  }

  function reject() {
    if (!offer || !offer.partnerId) return;
    mockSocket.partnerRespond(offer.partnerId, false);
    setLogs((s) => [`You rejected ${offer.id}`, ...s]);
  }

  return (
    <main className="min-h-screen p-8 bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-slate-400 hover:text-white underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold mt-4">Partner Dashboard</h1>

        <div className="mt-6">
          {offer ? (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h2 className="font-semibold text-lg text-white">
                Batch Offer: {offer.id}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Total Orders: {offer.orders.length} • Est. Time: {offer.etaMinutes} mins
              </p>
              <ol className="mt-4 list-decimal list-inside space-y-2 text-sm text-slate-200">
                {offer.orders.map((o: Order) => (
                  <li key={o.id} className="p-2 bg-slate-800/50 rounded">
                    <span className="font-medium text-white">{o.customer}</span> — {o.deliveryAddress || o.id}
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={accept}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-sm transition"
                >
                  Accept Batch
                </button>
                <button
                  onClick={reject}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 font-semibold rounded-lg text-sm transition"
                >
                  Decline Batch
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
              No pending batch offers. Waiting for incoming assignments...
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="font-medium text-slate-300">Activity Log</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-400 bg-slate-900 border border-slate-800 p-4 rounded-xl max-h-56 overflow-auto font-mono text-xs">
            {logs.length === 0 && <li>No recent activity</li>}
            {logs.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
