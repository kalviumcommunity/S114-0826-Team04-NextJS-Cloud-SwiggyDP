import {
  Batch,
  CustomerTrackingData,
  Partner,
  PartnerOfferPayload,
  DeliveryProgressPayload,
  EtaUpdatePayload,
  BatchReassignedPayload,
} from '@/types';

export type UnsubscribeFn = () => void;

export interface IDeliveryService {
  // Queries
  getOrderTracking(orderId: string): Promise<CustomerTrackingData | null>;
  getActiveBatches(): Promise<Batch[]>;
  getAvailablePartners(): Promise<Partner[]>;

  // Actions
  respondToOffer(
    partnerId: string,
    accepted: boolean,
    reason?: string
  ): Promise<void>;
  createDemoBatch(customers?: string[]): Promise<Batch>;
  forceReassign(batchId: string): Promise<void>;
  advanceDeliveryStep(batchId: string): Promise<void>;

  // Subscriptions
  onBatchCreated(cb: (batch: Batch) => void): UnsubscribeFn;
  onBatchUpdated(cb: (batch: Batch) => void): UnsubscribeFn;
  onPartnerOffer(cb: (payload: PartnerOfferPayload) => void): UnsubscribeFn;
  onPartnerAccepted(
    cb: (payload: PartnerAcceptedPayload) => void
  ): UnsubscribeFn;
  onPartnerRejected(
    cb: (payload: PartnerRejectedPayload) => void
  ): UnsubscribeFn;
  onBatchReassigned(
    cb: (payload: BatchReassignedPayload) => void
  ): UnsubscribeFn;
  onDeliveryProgress(
    cb: (payload: DeliveryProgressPayload) => void
  ): UnsubscribeFn;
  onEtaUpdate(cb: (payload: EtaUpdatePayload) => void): UnsubscribeFn;
  onConnectionChange(cb: (connected: boolean) => void): UnsubscribeFn;
}
