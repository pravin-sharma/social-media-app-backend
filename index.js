require("dotenv").config();

const connectDb = require("./db");
const app = require("./app");
const PORT = process.env.PORT || 4000;

connectDb();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
