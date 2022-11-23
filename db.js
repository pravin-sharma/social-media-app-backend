const mongoose = require("mongoose");

const connectDb = () => {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => {
      console.log(error);
      process.exitCode = 1;
    });
};

module.exports = connectDb;
