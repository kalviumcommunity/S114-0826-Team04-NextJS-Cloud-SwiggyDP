import mongoose, { Schema } from "mongoose";
const DeliveryPartnerSchema = new Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ["available", "busy", "offline"],
        default: "offline",
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
            default: [0, 0],
        },
    },
    currentOrderIds: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    maxBatchSize: { type: Number, default: 3 },
}, { timestamps: true });
// Enables geospatial queries like $near, $geoWithin
DeliveryPartnerSchema.index({ location: "2dsphere" });
export const DeliveryPartner = mongoose.model("DeliveryPartner", DeliveryPartnerSchema);
