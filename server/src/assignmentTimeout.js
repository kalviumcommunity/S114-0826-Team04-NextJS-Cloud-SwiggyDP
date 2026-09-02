import { DeliveryPartner } from "./models/DeliveryPartner.js";
import { Order } from "./models/Order.js";
import { findNearestAvailablePartner } from "./batching.js";
export const DEFAULT_ASSIGNMENT_TIMEOUT_MS = 45000;
export const MAX_ASSIGNMENT_RETRIES = 3;
export const getNextAssignmentTimeout = (now = Date.now()) => new Date(now + DEFAULT_ASSIGNMENT_TIMEOUT_MS);
export const shouldProcessAssignmentTimeout = (order, now = Date.now()) => {
    if (!order || !order.assignmentTimeoutAt) {
        return false;
    }
    if (order.status !== "assigned" && order.status !== "reassigned") {
        return false;
    }
    const timeoutAt = new Date(order.assignmentTimeoutAt).getTime();
    if (Number.isNaN(timeoutAt)) {
        return false;
    }
    return timeoutAt <= now && (order.retryCount ?? 0) < MAX_ASSIGNMENT_RETRIES;
};
export const processTimedOutAssignments = async (io, now = new Date()) => {
    const orders = await Order.find({
        status: { $in: ["assigned", "reassigned"] },
        assignmentTimeoutAt: { $lte: now },
    }).lean();
    const results = [];
    for (const order of orders) {
        const retryCount = order.retryCount ?? 0;
        if (!shouldProcessAssignmentTimeout(order, now.getTime())) {
            continue;
        }
        const currentPartnerId = order.assignedPartnerId ? String(order.assignedPartnerId) : null;
        const partners = await DeliveryPartner.find({ status: "available" }).lean();
        const filteredPartners = partners.filter((partner) => !currentPartnerId || String(partner._id) !== currentPartnerId);
        const nearest = findNearestAvailablePartner(filteredPartners.map((partner) => ({
            id: String(partner._id),
            status: partner.status,
            location: { coordinates: partner.location.coordinates },
        })), {
            lat: order.dropLocation.coordinates[1],
            lng: order.dropLocation.coordinates[0],
        });
        if (!nearest) {
            const updatedOrder = await Order.findByIdAndUpdate(order._id, {
                status: "reassigned",
                assignmentTimeoutAt: null,
                retryCount: retryCount + 1,
            }, { new: true });
            io?.emit("order:reassignment_pending", {
                orderId: String(order._id),
                order: updatedOrder,
            });
            results.push({
                orderId: String(order._id),
                assigned: false,
                reason: "No available partner after timeout",
            });
            continue;
        }
        const updatedOrder = await Order.findByIdAndUpdate(order._id, {
            assignedPartnerId: nearest.id,
            status: "assigned",
            assignmentTimeoutAt: getNextAssignmentTimeout(now.getTime()),
            retryCount: retryCount + 1,
        }, { new: true });
        if (updatedOrder) {
            io?.emit("order:timeout_reassigned", {
                orderId: String(updatedOrder._id),
                partnerId: nearest.id,
                order: updatedOrder,
            });
        }
        results.push({
            orderId: String(order._id),
            assigned: true,
            partnerId: nearest.id,
        });
    }
    return results;
};
