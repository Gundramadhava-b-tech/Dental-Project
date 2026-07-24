import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

const allowedOrigins = [
  "https://madhava-d298a.web.app",
  "https://madhava-d298a.firebaseapp.com",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:5173",
  "http://localhost:5000",
  // Allow all origins in development
  ...(process.env.NODE_ENV !== "production" ? ["*"] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // permissive for college project
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
