const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const MESSAGES = require("./constants/responseMessages");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const gameRoutes = require("./routes/gameRoutes");
const worldcupRoutes = require("./routes/worldcupRoutes");
const adminRoutes = require("./routes/adminRoutes");


const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json');


const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env";

dotenv.config({ path: envFile });

const app = express();

connectDB();
const corsOptions = process.env.NODE_ENV === "production" 
  ? {
      origin: process.env.FRONTEND_URL,
      optionsSuccessStatus: 200,
      credentials: true
    }
  : {
      origin: true, 
      optionsSuccessStatus: 200,
      credentials: true
    };

app.set('trust proxy', true);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: MESSAGES.ERROR.TO_MANY_REQUEST,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip.split(':')[0];
  }
});

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/worldcup", worldcupRoutes);

// app.use("/api/admin", adminRoutes);
//require('./jobs/matchSettlementJob');

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile));
}
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
