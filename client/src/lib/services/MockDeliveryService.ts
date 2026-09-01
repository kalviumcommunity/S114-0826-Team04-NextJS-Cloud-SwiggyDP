import { v4 as uuidv4 } from 'uuid';
import {
  Batch,
  CustomerTrackingData,
  DeliveryProgressPayload,
  DeliverySequenceItem,
  EtaUpdatePayload,
  Order,
  Partner,
  PartnerOfferPayload,
  BatchReassignedPayload,
} from '@/types';
import { IDeliveryService, UnsubscribeFn } from './DeliveryService';

type Listener<T> = (data: T) => void;

export class MockDeliveryService implements IDeliveryService {
  private batches: Batch[] = [];
  private partners: Partner[] = [
    {
      id: 'partner-101',
      name: 'Suresh Kumar',
      phone: '+91 98765 43210',
      rating: 4.85,
      vehicleType: 'bike',
      currentArea: 'Koramangala 4th Block',
      isOnline: true,
    },
    {
      id: 'partner-102',
      name: 'Rajesh Varma',
      phone: '+91 91234 56789',
      rating: 4.9,
      vehicleType: 'ev',
      currentArea: 'Indiranagar 100ft Rd',
      isOnline: true,
    },
    {
      id: 'partner-103',
      name: 'Amit Patel',
      phone: '+91 99887 76655',
      rating: 4.75,
      vehicleType: 'scooter',
      currentArea: 'HSR Layout Sector 1',
      isOnline: true,
    },
  ];

  private listeners = {
    batchCreated: new Set<Listener<Batch>>(),
    batchUpdated: new Set<Listener<Batch>>(),
    partnerOffer: new Set<Listener<PartnerOfferPayload>>(),
    partnerAccepted: new Set<Listener<{ batch: Batch; partnerId: string }>>(),
    partnerRejected: new Set<Listener<{ batch: Batch; partnerId: string }>>(),
    batchReassigned: new Set<Listener<BatchReassignedPayload>>(),
    deliveryProgress: new Set<Listener<DeliveryProgressPayload>>(),
    etaUpdate: new Set<Listener<EtaUpdatePayload>>(),
    connectionChange: new Set<Listener<boolean>>(),
  };

  private deliveryIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Pre-seed a rich default batch containing order-101 so customer link /customer/track/order-101 works immediately!
    const defaultBatch: Batch = {
      id: 'batch-swiggy-8841',
      restaurantName: 'Meghana Foods — Biryani & North Indian',
      restaurantArea: 'Koramangala 5th Block',
      partnerId: 'partner-101',
      partner: this.partners[0],
      status: 'assigned',
      etaMinutes: 22,
      totalDistanceKm: 4.2,
      createdAt: new Date().toISOString(),
      reassignmentCount: 0,
      orders: [
        {
          id: 'order-100',
          customer: 'Rahul Sharma',
          customerPhone: '+91 98450 11223',
          deliveryAddress: 'Flat 402, Green Glen Layout, Bellandur',
          restaurantName: 'Meghana Foods',
          restaurantAddress: '124, 5th Block, Koramangala',
          itemsSummary: '1x Chicken Biryani, 1x Paneer Butter Masala',
          status: 'assigned',
          placedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          id: 'order-101',
          customer: 'You',
          customerPhone: '+91 99001 22334',
          deliveryAddress: 'House 18, 4th Cross, Koramangala 4th Block',
          restaurantName: 'Meghana Foods',
          restaurantAddress: '124, 5th Block, Koramangala',
          itemsSummary: '2x Special Mutton Biryani, 1x Gulab Jamun (2 pcs)',
          status: 'assigned',
          placedAt: new Date(Date.now() - 12 * 60000).toISOString(),
        },
        {
          id: 'order-102',
          customer: 'Anjali Nair',
          customerPhone: '+91 97400 33445',
          deliveryAddress: 'Tower B - 1201, Oasis Apartments, Ejipura',
          restaurantName: 'Meghana Foods',
          restaurantAddress: '124, 5th Block, Koramangala',
          itemsSummary: '1x Veg Hyderabadi Biryani, 1x Raita',
          status: 'assigned',
          placedAt: new Date(Date.now() - 8 * 60000).toISOString(),
        },
      ],
    };

    this.batches.push(defaultBatch);
  }

  async getOrderTracking(orderId: string): Promise<CustomerTrackingData | null> {
    for (const batch of this.batches) {
      const orderIndex = batch.orders.findIndex((o) => o.id === orderId);
      if (orderIndex >= 0) {
        const order = batch.orders[orderIndex];
        const deliveredCount = batch.orders.filter(
          (o) => o.status === 'delivered'
        ).length;
        const currentActivePosition = Math.max(1, orderIndex + 1 - deliveredCount);
        const ordersBeforeCustomer = Math.max(0, orderIndex - deliveredCount);

        const sequence: DeliverySequenceItem[] = batch.orders.map((o, idx) => ({
          orderId: o.id,
          customerName: o.customer,
          deliveryAddress: o.deliveryAddress,
          status: o.status,
          sequenceNumber: idx + 1,
          isCurrentStop: idx === deliveredCount && batch.status === 'in_transit',
          etaMinutes: Math.max(5, batch.etaMinutes - (deliveredCount - idx) * 7),
        }));

        return {
          order,
          batch,
          position: currentActivePosition,
          totalOrdersInBatch: batch.orders.length,
          ordersBeforeCustomer,
          etaMinutes: batch.etaMinutes,
          sequence,
          partner: batch.partner || null,
          reassigned: (batch.reassignmentCount || 0) > 0,
        };
      }
    }

    // Fallback: If not found, create a demo order
    return null;
  }

  async getActiveBatches(): Promise<Batch[]> {
    return [...this.batches];
  }

  async getAvailablePartners(): Promise<Partner[]> {
    return [...this.partners];
  }

  async createDemoBatch(customers?: string[]): Promise<Batch> {
    const customerList =
      customers && customers.length > 0
        ? customers
        : ['Rahul Sharma', 'You', 'Anjali Nair'];
    const randomPartner =
      this.partners[Math.floor(Math.random() * this.partners.length)];

    const newOrders: Order[] = customerList.map((cust, i) => ({
      id: `order-${Math.floor(Math.random() * 900) + 100}`,
      customer: cust,
      customerPhone: `+91 98765 ${Math.floor(Math.random() * 89999 + 10000)}`,
      deliveryAddress: `Stop ${i + 1}, Sector ${i + 2}, HSR Layout`,
      restaurantName: 'Truffles — Burgers & Steaks',
      restaurantAddress: '80 Feet Rd, Koramangala 4th Block',
      itemsSummary: '1x All American Cheese Burger, 1x Peri Peri Fries',
      status: 'placed',
      placedAt: new Date().toISOString(),
    }));

    const batch: Batch = {
      id: `batch-swiggy-${uuidv4().substring(0, 6)}`,
      orders: newOrders,
      partnerId: randomPartner.id,
      partner: randomPartner,
      status: 'assigned',
      etaMinutes: Math.max(12, Math.floor(Math.random() * 20) + 12),
      totalDistanceKm: Number((Math.random() * 3 + 2.5).toFixed(1)),
      createdAt: new Date().toISOString(),
      reassignmentCount: 0,
      restaurantName: 'Truffles — Burgers & Steaks',
      restaurantArea: 'Koramangala 4th Block',
    };

    this.batches.unshift(batch);
    this.notifyBatchCreated(batch);
    this.notifyPartnerOffer({
      batch,
      partnerId: randomPartner.id,
      expiresInSeconds: 15,
    });

    return batch;
  }

  async respondToOffer(
    partnerId: string,
    accepted: boolean,
    reason?: string
  ): Promise<void> {
    const batch = this.batches.find(
      (b) => b.partnerId === partnerId && b.status === 'assigned'
    );
    if (!batch) return;

    if (accepted) {
      batch.status = 'in_transit';
      batch.orders.forEach((o) => (o.status = 'in_transit'));
      this.notifyPartnerAccepted({ batch, partnerId });
      this.notifyBatchUpdated(batch);
      this.startDeliverySimulation(batch);
    } else {
      batch.status = 'rejected';
      this.notifyPartnerRejected({ batch, partnerId, reason });
      this.notifyBatchUpdated(batch);

      // Rapid Reassignment within 5 seconds as specified in PRD FR3
      setTimeout(() => {
        this.forceReassign(batch.id);
      }, 2500);
    }
  }

  async forceReassign(batchId: string): Promise<void> {
    const batch = this.batches.find((b) => b.id === batchId);
    if (!batch) return;

    const currentPartnerId = batch.partnerId;
    const nextPartner =
      this.partners.find((p) => p.id !== currentPartnerId) || this.partners[0];

    batch.partnerId = nextPartner.id;
    batch.partner = nextPartner;
    batch.status = 'assigned';
    batch.reassignmentCount = (batch.reassignmentCount || 0) + 1;
    // Slight ETA drift on reassignment (2-4 mins)
    batch.etaMinutes = Math.min(60, batch.etaMinutes + 3);

    const payload: BatchReassignedPayload = {
      batch,
      partnerId: nextPartner.id,
      previousPartnerId: currentPartnerId || undefined,
      reason: 'Previous partner declined or timed out',
    };

    this.notifyBatchReassigned(payload);
    this.notifyBatchUpdated(batch);
    this.notifyPartnerOffer({
      batch,
      partnerId: nextPartner.id,
      expiresInSeconds: 15,
    });
  }

  async advanceDeliveryStep(batchId: string): Promise<void> {
    const batch = this.batches.find((b) => b.id === batchId);
    if (!batch || batch.status !== 'in_transit') return;

    const nextUndelivered = batch.orders.find((o) => o.status !== 'delivered');
    if (nextUndelivered) {
      nextUndelivered.status = 'delivered';
      nextUndelivered.deliveredAt = new Date().toISOString();
      const remaining = batch.orders.filter((o) => o.status !== 'delivered').length;
      const sequenceIndex = batch.orders.indexOf(nextUndelivered);

      if (remaining === 0) {
        batch.status = 'delivered';
        batch.etaMinutes = 0;
      } else {
        batch.etaMinutes = Math.max(4, batch.etaMinutes - 7);
      }

      this.notifyDeliveryProgress({
        batchId: batch.id,
        sequenceIndex,
        remaining,
        completedOrderId: nextUndelivered.id,
      });
      this.notifyEtaUpdate({
        batchId: batch.id,
        etaMinutes: batch.etaMinutes,
      });
      this.notifyBatchUpdated(batch);
    }
  }

  private startDeliverySimulation(batch: Batch) {
    if (this.deliveryIntervals.has(batch.id)) {
      clearInterval(this.deliveryIntervals.get(batch.id)!);
    }

    const interval = setInterval(() => {
      const nextUndelivered = batch.orders.find((o) => o.status !== 'delivered');
      if (!nextUndelivered) {
        clearInterval(interval);
        this.deliveryIntervals.delete(batch.id);
        return;
      }
      this.advanceDeliveryStep(batch.id);
    }, 7000);

    this.deliveryIntervals.set(batch.id, interval);
  }

  // Subscription Listeners
  onBatchCreated(cb: Listener<Batch>): UnsubscribeFn {
    this.listeners.batchCreated.add(cb);
    return () => this.listeners.batchCreated.delete(cb);
  }

  onBatchUpdated(cb: Listener<Batch>): UnsubscribeFn {
    this.listeners.batchUpdated.add(cb);
    return () => this.listeners.batchUpdated.delete(cb);
  }

  onPartnerOffer(cb: Listener<PartnerOfferPayload>): UnsubscribeFn {
    this.listeners.partnerOffer.add(cb);
    return () => this.listeners.partnerOffer.delete(cb);
  }

  onPartnerAccepted(
    cb: Listener<{ batch: Batch; partnerId: string }>
  ): UnsubscribeFn {
    this.listeners.partnerAccepted.add(cb);
    return () => this.listeners.partnerAccepted.delete(cb);
  }

  onPartnerRejected(
    cb: Listener<{ batch: Batch; partnerId: string }>
  ): UnsubscribeFn {
    this.listeners.partnerRejected.add(cb);
    return () => this.listeners.partnerRejected.delete(cb);
  }

  onBatchReassigned(cb: Listener<BatchReassignedPayload>): UnsubscribeFn {
    this.listeners.batchReassigned.add(cb);
    return () => this.listeners.batchReassigned.delete(cb);
  }

  onDeliveryProgress(cb: Listener<DeliveryProgressPayload>): UnsubscribeFn {
    this.listeners.deliveryProgress.add(cb);
    return () => this.listeners.deliveryProgress.delete(cb);
  }

  onEtaUpdate(cb: Listener<EtaUpdatePayload>): UnsubscribeFn {
    this.listeners.etaUpdate.add(cb);
    return () => this.listeners.etaUpdate.delete(cb);
  }

  onConnectionChange(cb: Listener<boolean>): UnsubscribeFn {
    this.listeners.connectionChange.add(cb);
    return () => this.listeners.connectionChange.delete(cb);
  }

  // Notifiers
  private notifyBatchCreated(batch: Batch) {
    this.listeners.batchCreated.forEach((cb) => cb(batch));
  }

  private notifyBatchUpdated(batch: Batch) {
    this.listeners.batchUpdated.forEach((cb) => cb(batch));
  }

  private notifyPartnerOffer(payload: PartnerOfferPayload) {
    this.listeners.partnerOffer.forEach((cb) => cb(payload));
  }

  private notifyPartnerAccepted(payload: { batch: Batch; partnerId: string }) {
    this.listeners.partnerAccepted.forEach((cb) => cb(payload));
  }

  private notifyPartnerRejected(payload: { batch: Batch; partnerId: string }) {
    this.listeners.partnerRejected.forEach((cb) => cb(payload));
  }

  private notifyBatchReassigned(payload: BatchReassignedPayload) {
    this.listeners.batchReassigned.forEach((cb) => cb(payload));
  }

  private notifyDeliveryProgress(payload: DeliveryProgressPayload) {
    this.listeners.deliveryProgress.forEach((cb) => cb(payload));
  }

  private notifyEtaUpdate(payload: EtaUpdatePayload) {
    this.listeners.etaUpdate.forEach((cb) => cb(payload));
  }
}

// Singleton export
export const mockDeliveryService = new MockDeliveryService();
