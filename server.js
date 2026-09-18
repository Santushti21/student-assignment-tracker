const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error);
    });

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    assignment: {
        type: String,
        required: true
    },
    deadline: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    }
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

// GET all assignments
app.get("/api/assignments", async (req, res) => {
    try {
        const assignments = await Assignment.find();
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching assignments" });
    }
});

// ADD a new assignment
app.post("/api/assignments", async (req, res) => {
    try {
        const newAssignment = new Assignment(req.body);
        await newAssignment.save();
        res.status(201).json(newAssignment);
    } catch (error) {
        res.status(400).json({ message: "Error adding assignment" });
    }
});

// MARK assignment as completed
app.put("/api/assignments/:id", async (req, res) => {
    try {
        const updatedAssignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            { completed: true },
            { new: true }
        );

        res.json(updatedAssignment);
    } catch (error) {
        res.status(500).json({ message: "Error updating assignment" });
    }
});

// DELETE an assignment
app.delete("/api/assignments/:id", async (req, res) => {
    try {
        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting assignment" });
    }
});

// Serve index.html for the homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});