const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

var mongoURL =
  "mongodb+srv://kosarvillage:kosarvillage@cluster0.93sie2d.mongodb.net/sismul";



mongoose.connect(mongoURL);

var connection = mongoose.connection;

connection.on("error", () => {
  console.log("Mongo DB Connection Failed");
});

connection.on("connected", () => {
  console.log("Mongo DB Connection Success");
});

module.exports = mongoose;
