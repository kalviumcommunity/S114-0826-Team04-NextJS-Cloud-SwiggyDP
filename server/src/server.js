import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js";
import { processTimedOutAssignments } from "./assignmentTimeout.js";
dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
});
app.set("io", io);
app.use(cors());
app.use(express.json());
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        service: "Swiggy DP Batching & Reassignment Engine",
        timestamp: new Date().toISOString(),
    });
});
app.use("/api", orderRoutes);
io.on("connection", (socket) => {
    console.log(`⚡ Connected client/partner: ${socket.id}`);
    socket.on("disconnect", () => {
        console.log(`❌ Disconnected: ${socket.id}`);
    });
});
setInterval(() => {
    processTimedOutAssignments(io).catch((error) => {
        console.error("Assignment timeout check failed:", error);
    });
}, 15000);
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await connectDB();
    httpServer.listen(PORT, () => {
        console.log(`🚀 Backend server listening on http://localhost:${PORT}`);
    });
};
startServer();
