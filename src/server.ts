// 3rd-party lib
import { createServer } from "http";

// local modules
import app from "@/app";
import { webSocketGatewayInstance } from "@/gateway";
import { prismaServiceInstance } from "@/core";
import { PORT } from "@/common";

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket gateway with authentication
webSocketGatewayInstance.initialize(httpServer);

// Application Entry
httpServer.listen(PORT, () => {
  console.log(`Server Running On Port: ${PORT}`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer.close(async () => {
    console.log("✓ HTTP server closed");

    try {
      // Shutdown Socket.IO and cleanup
      await webSocketGatewayInstance.shutdown();

      // Disconnect Prisma
      prismaServiceInstance.init();
      console.log("✓ Database connection closed");

      // Exit successfully
      process.exit(0);
    } catch (error) {
      console.error("✗ Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("✗ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("✗ Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("✗ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});
