import mongoose, { Schema } from "mongoose";
const PointSchema = {
    type: {
        type: String,
        enum: ["Point"],
        default: "Point",
    },
    coordinates: {
        type: [Number],
        required: true,
    },
};
const OrderSchema = new Schema({
    restaurantName: { type: String, required: true, trim: true },
    pickupLocation: PointSchema,
    dropLocation: PointSchema,
    status: {
        type: String,
        enum: [
            "placed",
            "batched",
            "assigned",
            "picked_up",
            "delivered",
            "reassigned",
            "cancelled",
        ],
        default: "placed",
    },
    assignedPartnerId: {
        type: Schema.Types.ObjectId,
        ref: "DeliveryPartner",
    },
    batchId: { type: String },
    assignmentTimeoutAt: { type: Date, default: null },
    retryCount: { type: Number, default: 0 },
}, { timestamps: true });
OrderSchema.index({ pickupLocation: "2dsphere" });
OrderSchema.index({ dropLocation: "2dsphere" });
export const Order = mongoose.model("Order", OrderSchema);
