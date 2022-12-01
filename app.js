const express = require("express");
const app = express();

const cors = require("cors");
const userRoute = require("./routes/user");
const postRoute = require("./routes/post");
const customErrorHandler = require("./utils/customErrorHandler");
const CustomError = require("./utils/CustomError");

app.use(express.json());
// app.use(express.urlencoded())
app.use(cors());

//routes
app.use("/", userRoute);
app.use("/", postRoute);

app.use("*", (req,res,next)=>next(CustomError.notFound('Invalid API Path')))

//error handler
app.use(customErrorHandler)

module.exports = app;
