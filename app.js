const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listings.js");
const path = require("path");
const ejsMate = require("ejs-mate");
const Review = require("./models/review.js");

// MongoDB Connection URL
const MONGO_URL = "mongodb://127.0.0.1:27017/WanderLust";

// App configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static("public"));

// Database connection
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Connected to the database"))
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1); // Exit if database connection fails
  });

// Utility to catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to WanderLust");
});

// Fetch all listings
app.get(
  "/listings",
  catchAsync(async (req, res) => {
    const alllistings = await Listing.find({});
    res.render("listings/index", { alllistings });
  })
);

// Form for creating a new listing
app.get("/listings/new", (req, res) => {
  res.render("listings/new");
});

// Fetch a specific listing by ID
app.get(
  "/listings/:id",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews"); // Populate reviews here
    if (!listing) {
      return res.status(404).send("Listing not found");
    }
    res.render("listings/show", { listing });
  })
);

// Create a new listing
app.post(
  "/listings",
  catchAsync(async (req, res, next) => {
    const { title, description, image, price, country, location } = req.body;
    const newListing = new Listing({ title, description, image, price, country, location });
    await newListing.save();
    res.redirect("/listings");
  })
);

// Edit a listing form
app.get(
  "/listings/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }
    res.render("listings/edit", { listing });
  })
);

// Update a listing
app.post(
  "/listings/:id",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, image, price, country, location } = req.body;
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { title, description, image, price, country, location },
      { new: true, runValidators: true }
    );
    if (!updatedListing) {
      return res.status(404).send("Listing not found");
    }
    res.redirect(`/listings/${id}`);
  })
);

// Delete a listing
app.post(
  "/listings/:id/delete",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) {
      return res.status(404).send("Listing not found");
    }
    res.redirect("/listings");
  })
);

// Submit a review
app.post(
  "/listings/:id/reviews",
  catchAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }
    const review = new Review(req.body.review);
    listing.reviews.push(review);
    await review.save();
    await listing.save();
    res.redirect(`/listings/${req.params.id}`);
  })
);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).send("Page Not Found");
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === "ValidationError") {
    return res.status(400).send("Validation Error: " + err.message);
  }
  res.status(err.status || 500).send(err.message || "Internal Server Error");
});

// Server initialization
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});




