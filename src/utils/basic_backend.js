/*
 * MXDealerAdvantage – Minimal Demo Backend
 * ----------------------------------------
 * Purpose: give dealers a URL where they can
 *   • POST quotes
 *   • List their quotes
 *   • See simple metrics
 *   • Hit “apply now” (email notification)
 *
 * Tech stack: Node.js + Express (no DB – in‑memory for demo)
 * ----------------------------------------
 * How to run:
 *   1. npm install express cors nodemailer dotenv uuid
 *   2. Create .env with:
 *        PORT=4000
 *        EMAIL_TO=your@email.com
 *        SMTP_HOST=smtp.example.com
 *        SMTP_PORT=465
 *        SMTP_USER=SMTP‑USER
 *        SMTP_PASS=SMTP‑PASS
 *   3. node basic_backend.js
 *
 * End‑points (all JSON):
 *   POST   /api/quotes            { dealerId, quote } → { id }
 *   GET    /api/quotes?dealer=ID  → [ quotes ]
 *   GET    /api/metrics           → { totalQuotes }
 *   POST   /api/quotes/:id/apply  → { ok: true }
 * ----------------------------------------
 */

import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// In‑memory quote store: { id, dealerId, quote, created }
const quotes = [];

// Create quote
app.post("/api/quotes", (req, res) => {
  const { dealerId, quote } = req.body;
  if (!dealerId || !quote) return res.status(400).json({ error: "dealerId & quote required" });
  const id = uuid();
  quotes.push({ id, dealerId, quote, created: new Date() });
  res.json({ id });
});

// List quotes (optionally filter by dealer)
app.get("/api/quotes", (req, res) => {
  const { dealer } = req.query; // ?dealer=123
  const data = dealer ? quotes.filter(q => q.dealerId === dealer) : quotes;
  res.json(data);
});

// Basic metrics
app.get("/api/metrics", (_, res) => {
  res.json({ totalQuotes: quotes.length });
});

// Apply now – sends email
app.post("/api/quotes/:id/apply", async (req, res) => {
  const q = quotes.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: "Quote not found" });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    const info = await transporter.sendMail({
      from: `MXDealerAdvantage <no‑reply@mxdealeradvantage.com>`,
      to: process.env.EMAIL_TO,
      subject: `Apply Now – Quote ${q.id} (${q.dealerId})`,
      text: JSON.stringify(q, null, 2)
    });
    console.log("Email sent", info.messageId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    // Fallback: log to console so nothing blocks demo
    res.json({ ok: true, email: "failed; logged instead" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Demo backend up on http://localhost:${PORT}`));
