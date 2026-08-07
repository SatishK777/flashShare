// App config
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./api/routes/index.js";
import { errorHandler } from "./api/middlewares/errorHandler.js";
import { apiLimiter } from "./api/middlewares/rateLimiter.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins dynamically while supporting credentials: true
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// Apply rate limiting to all requests
app.use(apiLimiter);

// API routes
app.use("/api", routes);

// Error handling
app.use(errorHandler);

export { app };
