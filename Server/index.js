import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import imageRoutes from "./routes/image.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", imageRoutes);

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
