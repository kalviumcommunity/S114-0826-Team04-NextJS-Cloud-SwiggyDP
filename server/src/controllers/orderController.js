import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { DeliveryPartner } from "../models/DeliveryPartner.js";
import { findNearestAvailablePartner } from "../batching.js";
import { getNextAssignmentTimeout } from "../assignmentTimeout.js";
export const createOrder = async (req, res) => {
    try {
        const { restaurantName, pickupLocation, dropLocation } = req.body;
        if (!restaurantName || !pickupLocation || !dropLocation) {
            return res.status(400).json({ message: "restaurantName, pickupLocation, and dropLocation are required" });
        }
        const order = await Order.create({
            restaurantName,
            pickupLocation,
            dropLocation,
            status: "placed",
        });
        const io = req.app.get("io");
        io.emit("order:created", { order });
        return res.status(201).json({
            message: "Order created and queued for batching",
            order,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return res.status(500).json({ message });
    }
};
export const batchOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: { $in: ["placed", "reassigned"] } }).limit(20).lean();
        const partners = await DeliveryPartner.find({ status: "available" }).lean();
        const assignments = await Promise.all(orders.map(async (order) => {
            const partner = findNearestAvailablePartner(partners.map((p) => ({
                id: String(p._id),
                status: p.status,
                location: { coordinates: p.location.coordinates },
            })), {
                lat: order.dropLocation.coordinates[1],
                lng: order.dropLocation.coordinates[0],
            });
            if (!partner) {
                return {
                    orderId: String(order._id),
                    assigned: false,
                    reason: "No available partner",
                };
            }
            const updatedOrder = await Order.findByIdAndUpdate(order._id, {
                assignedPartnerId: partner.id,
                status: "assigned",
                batchId: `batch-${Date.now()}`,
                assignmentTimeoutAt: getNextAssignmentTimeout(),
                retryCount: 0,
            }, { new: true });
            await DeliveryPartner.findByIdAndUpdate(partner.id, {
                $push: { currentOrderIds: order._id },
                status: "busy",
            });
            const io = req.app.get("io");
            io.emit("order:assigned", {
                orderId: String(order._id),
                partnerId: partner.id,
                order: updatedOrder,
            });
            return {
                orderId: String(order._id),
                assigned: true,
                partnerId: partner.id,
                order: updatedOrder,
            };
        }));
        return res.json({ assignments });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return res.status(500).json({ message });
    }
};
export const reassignOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        const partners = await DeliveryPartner.find({ status: "available" }).lean();
        const nearest = findNearestAvailablePartner(partners.map((p) => ({
            id: String(p._id),
            status: p.status,
            location: { coordinates: p.location.coordinates },
        })), {
            lat: order.dropLocation.coordinates[1],
            lng: order.dropLocation.coordinates[0],
        });
        if (!nearest) {
            order.status = "reassigned";
            await order.save();
            const io = req.app.get("io");
            io.emit("order:reassignment_pending", { orderId, order });
            return res.status(200).json({ message: "No partner available; order marked for reassignment", order });
        }
        order.assignedPartnerId = new mongoose.Types.ObjectId(nearest.id);
        order.status = "reassigned";
        order.assignmentTimeoutAt = getNextAssignmentTimeout();
        order.retryCount = (order.retryCount ?? 0) + 1;
        await order.save();
        const io = req.app.get("io");
        io.emit("order:reassigned", {
            orderId,
            partnerId: nearest.id,
            order,
        });
        return res.json({
            message: "Order reassigned successfully",
            order,
            partnerId: nearest.id,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return res.status(500).json({ message });
    }
};
