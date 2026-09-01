'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  Batch,
  NotificationItem,
  Partner,
  PartnerOfferPayload,
  BatchReassignedPayload,
  DeliveryProgressPayload,
} from '@/types';
import { IDeliveryService } from '@/lib/services/DeliveryService';
import { mockDeliveryService } from '@/lib/services/MockDeliveryService';

interface DeliveryContextValue {
  service: IDeliveryService;
  isLiveConnected: boolean;
  activeBatches: Batch[];
  currentPartner: Partner;
  availablePartners: Partner[];
  setCurrentPartner: (partner: Partner) => void;
  notifications: NotificationItem[];
  addNotification: (
    title: string,
    message: string,
    type?: NotificationItem['type']
  ) => void;
  dismissNotification: (id: string) => void;
  createDemoBatch: (customers?: string[]) => Promise<Batch>;
  respondToOffer: (
    partnerId: string,
    accepted: boolean,
    reason?: string
  ) => Promise<void>;
  forceReassign: (batchId: string) => Promise<void>;
  advanceDeliveryStep: (batchId: string) => Promise<void>;
}

const DeliveryContext = createContext<DeliveryContextValue | null>(null);

export function DeliveryProvider({
  children,
  customService,
}: {
  children: React.ReactNode;
  customService?: IDeliveryService;
}) {
  const service = customService || mockDeliveryService;

  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [activeBatches, setActiveBatches] = useState<Batch[]>([]);
  const [availablePartners, setAvailablePartners] = useState<Partner[]>([]);
  const [currentPartner, setCurrentPartner] = useState<Partner>({
    id: 'partner-101',
    name: 'Suresh Kumar',
    phone: '+91 98765 43210',
    rating: 4.85,
    vehicleType: 'bike',
    currentArea: 'Koramangala 4th Block',
    isOnline: true,
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback(
    (
      title: string,
      message: string,
      type: NotificationItem['type'] = 'info'
    ) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const notif: NotificationItem = {
        id,
        title,
        message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        type,
      };
      setNotifications((prev) => [notif, ...prev.slice(0, 7)]); // Keep max 8 notifications

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6000);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const refreshBatches = useCallback(async () => {
    const list = await service.getActiveBatches();
    setActiveBatches([...list]);
  }, [service]);

  useEffect(() => {
    // Initial data fetch
    service.getAvailablePartners().then((partners) => {
      setAvailablePartners(partners);
      if (partners.length > 0) setCurrentPartner(partners[0]);
    });
    refreshBatches();

    // Event listeners
    const unsubs = [
      service.onConnectionChange((connected) => setIsLiveConnected(connected)),

      service.onBatchCreated((batch) => {
        addNotification(
          'New Batch Formed',
          `Batch ${batch.id} (${batch.orders.length} orders) ready for dispatch`,
          'info'
        );
        refreshBatches();
      }),

      service.onBatchUpdated(() => {
        refreshBatches();
      }),

      service.onPartnerOffer((payload: PartnerOfferPayload) => {
        if (payload.partnerId === currentPartner.id) {
          addNotification(
            'New Batch Offer',
            `Offer received for Batch ${payload.batch.id}`,
            'warning'
          );
        }
        refreshBatches();
      }),

      service.onPartnerAccepted(({ batch, partnerId }) => {
        addNotification(
          'Batch Accepted',
          `Partner ${partnerId} accepted Batch ${batch.id}`,
          'success'
        );
        refreshBatches();
      }),

      service.onPartnerRejected(({ batch, partnerId }) => {
        addNotification(
          'Batch Declined',
          `Partner ${partnerId} rejected Batch ${batch.id}. Reassigning in < 5s...`,
          'error'
        );
        refreshBatches();
      }),

      service.onBatchReassigned((payload: BatchReassignedPayload) => {
        addNotification(
          'Batch Reassigned',
          `Batch ${payload.batch.id} instantly reassigned to ${payload.partnerId}`,
          'warning'
        );
        refreshBatches();
      }),

      service.onDeliveryProgress((payload: DeliveryProgressPayload) => {
        addNotification(
          'Delivery Update',
          `Order ${payload.completedOrderId} delivered! (${payload.remaining} stops remaining)`,
          'info'
        );
        refreshBatches();
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [service, currentPartner.id, addNotification, refreshBatches]);

  const createDemoBatch = useCallback(
    async (customers?: string[]) => {
      const batch = await service.createDemoBatch(customers);
      await refreshBatches();
      return batch;
    },
    [service, refreshBatches]
  );

  const respondToOffer = useCallback(
    async (partnerId: string, accepted: boolean, reason?: string) => {
      await service.respondToOffer(partnerId, accepted, reason);
      await refreshBatches();
    },
    [service, refreshBatches]
  );

  const forceReassign = useCallback(
    async (batchId: string) => {
      await service.forceReassign(batchId);
      await refreshBatches();
    },
    [service, refreshBatches]
  );

  const advanceDeliveryStep = useCallback(
    async (batchId: string) => {
      await service.advanceDeliveryStep(batchId);
      await refreshBatches();
    },
    [service, refreshBatches]
  );

  return (
    <DeliveryContext.Provider
      value={{
        service,
        isLiveConnected,
        activeBatches,
        currentPartner,
        availablePartners,
        setCurrentPartner,
        notifications,
        addNotification,
        dismissNotification,
        createDemoBatch,
        respondToOffer,
        forceReassign,
        advanceDeliveryStep,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
}
