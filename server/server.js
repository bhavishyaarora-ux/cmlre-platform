import express from "express";
import cors from "cors";
import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 1. CONNECT TO MONGODB
// 1. CONNECT TO MONGODB
const myDatabaseString =
  "mongodb+srv://Admin:Kanha123456%40%23@cluster0.opkhl0p.mongodb.net/?appName=Cluster0";

mongoose.connect(myDatabaseString)
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 2. DEFINE THE DATABASE SCHEMA (How a record should look)
const eDNASchema = new mongoose.Schema({
  sequenceId: String,
  sampleLoc: String,
  match: String,
  confidence: String,
  date: { type: Date, default: Date.now },
});

const EDNARecord = mongoose.model("EDNARecord", eDNASchema);

// 3. API ROUTES

// Route A: Fetch OBIS Taxonomy (From Day 2)
app.get("/api/species", async (req, res) => {
  try {
    const obisUrl =
      "https://api.obis.org/v3/occurrence?geometry=POLYGON((75%209,77%209,77%2011,75%2011,75%209))&size=10";
    const response = await axios.get(obisUrl);
    const cleanedData = response.data.results.map((item) => ({
      id: item.id,
      name: item.scientificName,
      commonName: item.vernacularName || "Scientific Sample",
      status: item.category || "Research Grade",
      depth: item.maximumDepthInMeters
        ? `${item.maximumDepthInMeters}m`
        : "Surface",
    }));
    res.json(cleanedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marine data" });
  }
});

// Route B: Fetch all eDNA Records from OUR Database
app.get("/api/edna", async (req, res) => {
  try {
    const records = await EDNARecord.find().sort({ date: -1 }); // Newest first
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ledger" });
  }
});

// Route C: Simulate AI Analysis and Save to Database
app.post("/api/edna/analyze", async (req, res) => {
  try {
    const { sequence } = req.body;

    // Fake "AI Processing" logic for the presentation
    const mockMatches = [
      "Sardinella longiceps",
      "Penaeus monodon",
      "Unknown Dark Taxa",
    ];
    const randomMatch =
      mockMatches[Math.floor(Math.random() * mockMatches.length)];
    const randomConfidence = (Math.random() * (99 - 70) + 70).toFixed(1) + "%";

    // Create and save the new record to MongoDB
    const newRecord = new EDNARecord({
      sequenceId: `SEQ-${Math.floor(Math.random() * 10000)}`,
      sampleLoc: "Kochi Upload",
      match: randomMatch,
      confidence: randomConfidence,
    });

    await newRecord.save();
    res.json({ message: "Analysis complete", record: newRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to analyze sequence" });
  }
});
// Route E: Overfishing Detection Zones (Mock Data for India)
app.get('/api/overfishing', (req, res) => {
  const overfishingZones = [
    { id: 'Z-101', name: 'Arabian Sea (Kochi Coast)', lat: 10.15, lng: 75.50, risk: 'Critical', vessels: 42, radius: 40000, color: '#ef4444' }, // Red
    { id: 'Z-102', name: 'Gulf of Mannar', lat: 8.80, lng: 78.80, risk: 'High', vessels: 28, radius: 30000, color: '#f97316' }, // Orange
    { id: 'Z-103', name: 'Bay of Bengal (Odisha Coast)', lat: 19.50, lng: 86.50, risk: 'Critical', vessels: 55, radius: 45000, color: '#ef4444' },
    { id: 'Z-104', name: 'Gujarat Coast', lat: 21.00, lng: 69.50, risk: 'Moderate', vessels: 15, radius: 25000, color: '#eab308' } // Yellow
  ];
  res.json(overfishingZones);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
