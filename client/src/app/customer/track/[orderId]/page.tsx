'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Batch,
  DeliveryProgressPayload,
  EtaUpdatePayload,
  Order,
  CustomerTrackingData,
} from '@/types';
import mockSocket from '@/lib/socket';
import { mockDeliveryService } from '@/lib/services/MockDeliveryService';

export default function CustomerTrackPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [trackingData, setTrackingData] = useState<CustomerTrackingData | null>(
    null
  );
  const [batch, setBatch] = useState<Batch | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    // Initial fetch from service
    const loadTracking = async () => {
      const data = await mockDeliveryService.getOrderTracking(orderId);
      if (data) {
        setTrackingData(data);
        setBatch(data.batch);
        setPosition(data.position);
        setEta(data.etaMinutes);
      }
    };
    loadTracking();

    const onBatchUpdate = (b: Batch) => {
      if (b.orders?.some((o: Order) => o.id === orderId)) {
        setBatch(b);
        const deliveredCount = b.orders.filter(
          (o) => o.status === 'delivered'
        ).length;
        const orderIdx = b.orders.findIndex((o: Order) => o.id === orderId);
        if (orderIdx >= 0) {
          setPosition(Math.max(1, orderIdx + 1 - deliveredCount));
        }
        setEta(b.etaMinutes ?? null);
      }
    };

    const onDeliveryProgress = (payload: DeliveryProgressPayload) => {
      mockDeliveryService.getOrderTracking(orderId).then((data) => {
        if (data) {
          setTrackingData(data);
          setBatch(data.batch);
          setPosition(data.position);
          setEta(data.etaMinutes);
        }
      });
    };

    const onEtaUpdate = (payload: EtaUpdatePayload) => {
      setEta(payload.etaMinutes);
    };

    const off1 = mockSocket.on<Batch>('batch_update', onBatchUpdate);
    const off2 = mockSocket.on<DeliveryProgressPayload>(
      'delivery_progress',
      onDeliveryProgress
    );
    const off3 = mockSocket.on<EtaUpdatePayload>('eta_update', onEtaUpdate);

    return () => {
      off1();
      off2();
      off3();
    };
  }, [orderId]);

  return (
    <main className="min-h-screen p-8 bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-slate-400 hover:text-white underline">
          ← Home
        </Link>

        <h1 className="text-2xl font-bold mt-4">Order Tracking</h1>
        <p className="text-sm text-slate-400">Order ID: {orderId}</p>

        {batch ? (
          <div className="mt-6 bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider">
                  Live Batch
                </span>
                <h2 className="font-semibold text-lg text-white">{batch.id}</h2>
              </div>
              <span
                className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  batch.status === 'in_transit'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {batch.status.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-slate-400 mt-2">
              Partner: <span className="text-white font-medium">{batch.partner?.name || batch.partnerId || 'Assigning...'}</span>
            </p>

            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-lg font-bold text-amber-400">
                Your Position: {position ?? '—'} of {batch.orders.length}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Number of orders before you:{' '}
                <span className="text-white font-semibold">
                  {position && position > 1 ? position - 1 : 0}
                </span>
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Estimated Delivery Time:{' '}
                <span className="text-white font-semibold">{eta ?? '—'} mins</span>
              </p>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-sm text-slate-300">
                Delivery Sequence
              </h3>
              <ol className="list-decimal list-inside mt-3 space-y-2 text-sm">
                {batch.orders.map((o: Order, i: number) => {
                  const isCurrent = i + 1 === position;
                  const isDelivered = o.status === 'delivered';
                  return (
                    <li
                      key={o.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isDelivered
                          ? 'bg-slate-900/50 border-slate-800 text-slate-500 line-through'
                          : isCurrent
                            ? 'bg-orange-500/10 border-orange-500/40 text-orange-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span>
                        {o.customer} {o.id === orderId ? '(You)' : ''}
                      </span>
                      <span className="text-xs font-normal">
                        {isDelivered ? '✓ Delivered' : isCurrent ? 'Next Stop' : 'Upcoming'}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-6 bg-slate-900 rounded-xl text-slate-400 border border-slate-800">
            Looking for your batch and live partner assignment...
          </div>
        )}
      </div>
    </main>
  );
}
