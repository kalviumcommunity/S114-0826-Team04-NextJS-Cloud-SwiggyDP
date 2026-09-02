export type BatchStatus = 'pending' | 'assigned' | 'in_transit' | 'rejected' | 'delivered';

export type OrderStatus =
  | 'placed'
  | 'batched'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Location {
  lat?: number;
  lng?: number;
  address: string;
  area?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

export interface Order {
  id: string;
  customer: string;
  customerPhone?: string;
  deliveryAddress?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  itemsSummary?: string;
  items?: OrderItem[];
  status: OrderStatus;
  placedAt?: string;
  deliveredAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  phone?: string;
  rating?: number;
  vehicleType?: 'bike' | 'scooter' | 'ev';
  currentArea?: string;
  isOnline?: boolean;
}

export interface Batch {
  id: string;
  orders: Order[];
  partnerId: string | null;
  partner?: Partner | null;
  status: BatchStatus;
  etaMinutes: number;
  totalDistanceKm?: number;
  createdAt?: string;
  reassignmentCount?: number;
  assignmentTimeoutAt?: string;
  timeoutRemainingSeconds?: number;
  restaurantName?: string;
  restaurantArea?: string;
}

export interface DeliverySequenceItem {
  orderId: string;
  customerName: string;
  deliveryAddress?: string;
  status: OrderStatus;
  sequenceNumber: number;
  isCurrentStop: boolean;
  etaMinutes: number;
}

export interface CustomerTrackingData {
  order: Order;
  batch: Batch | null;
  position: number | null;
  totalOrdersInBatch: number;
  ordersBeforeCustomer: number;
  etaMinutes: number | null;
  sequence: DeliverySequenceItem[];
  partner: Partner | null;
  reassigned: boolean;
}

// Socket / Event Payload Types
export interface PartnerOfferPayload {
  batch: Batch;
  partnerId: string;
  expiresInSeconds?: number;
}

export interface PartnerAcceptedPayload {
  batch: Batch;
  partnerId: string;
}

export interface PartnerRejectedPayload {
  batch: Batch;
  partnerId: string;
  reason?: string;
}

export interface BatchReassignedPayload {
  batch: Batch;
  partnerId: string;
  previousPartnerId?: string;
  reason?: string;
}

export interface DeliveryProgressPayload {
  batchId: string;
  sequenceIndex: number;
  remaining: number;
  completedOrderId?: string;
}

export interface EtaUpdatePayload {
  batchId: string;
  etaMinutes: number;
  orderId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
