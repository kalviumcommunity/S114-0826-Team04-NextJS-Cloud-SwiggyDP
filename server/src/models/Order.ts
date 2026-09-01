import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus =
  | "placed"
  | "batched"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "reassigned"
  | "cancelled";

export interface IOrder extends Document {
  restaurantName: string;
  pickupLocation: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  dropLocation: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  status: OrderStatus;
  assignedPartnerId?: mongoose.Types.ObjectId;
  batchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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

const OrderSchema = new Schema<IOrder>(
  {
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
  },
  { timestamps: true },
);

OrderSchema.index({ pickupLocation: "2dsphere" });
OrderSchema.index({ dropLocation: "2dsphere" });

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
