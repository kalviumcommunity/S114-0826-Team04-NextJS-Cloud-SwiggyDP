'use client';

import {
  Batch,
  Order,
  PartnerOfferPayload,
  PartnerAcceptedPayload,
  PartnerRejectedPayload,
  BatchReassignedPayload,
  DeliveryProgressPayload,
  EtaUpdatePayload,
} from '@/types';
import { mockDeliveryService } from './services/MockDeliveryService';

export type { Batch, Order };

type EventCallback<T = unknown> = (payload: T) => void;

class TypedSocketBridge {
  private listeners: Record<string, EventCallback<unknown>[]> = {};

  constructor() {
    // Forward mockDeliveryService events through standard socket event names
    mockDeliveryService.onBatchCreated((batch) => this.emit('batch_created', batch));
    mockDeliveryService.onBatchUpdated((batch) => this.emit('batch_update', batch));
    mockDeliveryService.onPartnerOffer((p) => this.emit('partner_offer', p));
    mockDeliveryService.onPartnerAccepted((p) => this.emit('partner_accepted', p));
    mockDeliveryService.onPartnerRejected((p) => this.emit('partner_rejected', p));
    mockDeliveryService.onBatchReassigned((p) => this.emit('batch_reassigned', p));
    mockDeliveryService.onDeliveryProgress((p) => this.emit('delivery_progress', p));
    mockDeliveryService.onEtaUpdate((p) => this.emit('eta_update', p));
  }

  on<T>(event: string, cb: EventCallback<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    const genericCb = cb as EventCallback<unknown>;
    this.listeners[event].push(genericCb);
    return () => this.off(event, genericCb);
  }

  off(event: string, cb?: EventCallback<unknown>): void {
    if (!this.listeners[event]) return;
    if (!cb) {
      delete this.listeners[event];
    } else {
      this.listeners[event] = this.listeners[event].filter((c) => c !== cb);
    }
  }

  emit<T>(event: string, payload: T): void {
    const handlers = this.listeners[event] || [];
    handlers.forEach((cb) => cb(payload));
  }

  createBatch(customers: string[]): Batch {
    // Async in service, but synchronous wrapper for legacy compatibility
    let created: Batch | null = null;
    mockDeliveryService.createDemoBatch(customers).then((b) => {
      created = b;
    });
    return (
      created || {
        id: `batch-${Date.now()}`,
        orders: customers.map((c, i) => ({
          id: `order-${i + 1}-${Date.now()}`,
          customer: c,
          status: 'placed',
        })),
        partnerId: null,
        status: 'pending',
        etaMinutes: 20,
      }
    );
  }

  partnerRespond(partnerId: string, accepted: boolean, reason?: string): void {
    mockDeliveryService.respondToOffer(partnerId, accepted, reason);
  }

  reassign(batchId: string): void {
    mockDeliveryService.forceReassign(batchId);
  }

  listBatches(): Batch[] {
    // Sync cache lookup
    let batches: Batch[] = [];
    mockDeliveryService.getActiveBatches().then((list) => {
      batches = list;
    });
    return batches;
  }
}

// Properly instantiate the singleton
export const mockSocket = new TypedSocketBridge();
export default mockSocket;
