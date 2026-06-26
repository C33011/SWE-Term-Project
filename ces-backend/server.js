const express = require("express");
const cors = require("cors");
require("dotenv").config();

const movieRoutes = require("./routes/movies");

const app = express();


//Set the port that will be from .env file I add after getting datbase connections
const PORT = process.env.PORT || 5000;

 //run on every request before the actual request is made to the API
app.use(cors());
app.use(express.json());
app.use("/api", movieRoutes);

//check
app.get("/", (req, res) => {
  res.json({ message: "CES Backend API is running!" });
});

// Start server with requests on specificed port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});