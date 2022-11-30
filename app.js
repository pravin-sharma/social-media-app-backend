const express = require("express");
const app = express();

const cors = require("cors");
const userRoute = require("./routes/user");
const customErrorHandler = require("./utils/customErrorHandler");

app.use(express.json());
// app.use(express.urlencoded())
app.use(cors());

//routes
app.use("/", userRoute);

//error handler
app.use(customErrorHandler)

module.exports = app;
