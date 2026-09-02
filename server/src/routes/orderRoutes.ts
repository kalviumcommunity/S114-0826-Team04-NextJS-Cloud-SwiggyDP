import { Router } from "express";
import { batchOrders, createOrder, reassignOrder } from "../controllers/orderController.js";

const router = Router();

router.post("/orders", createOrder);
router.post("/orders/batch", batchOrders);
router.post("/orders/:orderId/reassign", reassignOrder);

export default router;
