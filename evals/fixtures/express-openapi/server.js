import express from "express";

const app = express();
const PORT = process.env.PORT || 3100;

app.use(express.json());

// --- Paid endpoint #1: price quote ---
app.post("/api/quote", (req, res) => {
  const payment = req.headers["x-payment"];
  if (!payment) {
    return res.status(402).json({
      x402Version: 2,
      error: "Payment Required",
      resource: {
        url: `http://localhost:${PORT}/api/quote`,
        description: "Get a price quote for a product",
        mimeType: "application/json",
      },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          asset: "USDC",
          amount: "0.01",
          payTo: "0x1234567890abcdef1234567890abcdef12345678",
          maxTimeoutSeconds: 300,
          extra: {},
        },
      ],
    });
  }
  res.json({
    quote: {
      product: req.body?.product || "widget",
      price: 42.0,
      currency: "USD",
    },
  });
});

// --- Paid endpoint #2: company enrichment (more expensive) ---
app.post("/api/enrich", (req, res) => {
  const payment = req.headers["x-payment"];
  if (!payment) {
    return res.status(402).json({
      x402Version: 2,
      error: "Payment Required",
      resource: {
        url: `http://localhost:${PORT}/api/enrich`,
        description: "Enrich company data from domain",
        mimeType: "application/json",
      },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          asset: "USDC",
          amount: "0.05",
          payTo: "0x1234567890abcdef1234567890abcdef12345678",
          maxTimeoutSeconds: 300,
          extra: {},
        },
      ],
    });
  }
  res.json({
    company: {
      name: "Acme Corp",
      domain: req.body?.domain || "acme.com",
      employees: 150,
    },
  });
});

// --- Free endpoints (should NOT appear in paid discovery) ---
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/status", (req, res) => {
  res.json({ uptime: process.uptime(), version: "1.0.0" });
});

// --- Broken discovery attempt by a clueless dev ---
// They tried to add well-known but got the format wrong
app.get("/.well-known/x402", (req, res) => {
  // Wrong: uses version 2 and object entries instead of string entries
  res.json({
    version: 2,
    endpoints: [
      { path: "/api/quote", method: "POST", price: "0.01 USDC" },
      { path: "/api/enrich", method: "POST", price: "0.05 USDC" },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
