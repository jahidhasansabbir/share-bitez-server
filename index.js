const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(cors());
app.use(express.json());

const uri = process.env.URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const foodColl = client.db("food-share").collection("foods");
    const RequestColl = client.db("food-share").collection('requested-food')

    app.get("/foods", async (req, res) => {
      const result = await foodColl
        .find()
        .sort({ foodQuantity: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
    app.get("/available-foods", async (req, res) => {
      const result = await foodColl
        .find({ foodStatus: "available" })
        .sort({ expireDate: 1 })
        .toArray();
      res.send(result);
    });
    app.post("/foods", async (req, res) => {
      const data = req.body;
      const result = await foodColl.insertOne(data);
      res.send(result);
    });
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodColl.findOne(query);
      res.send(result);
    });

    app.patch("/food/:id", async (req, res) => {
      const id = req.params.id;
      const { foodStatus, requestedDate } = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          foodStatus,
          requestedDate
        },
      };
      const result = await foodColl.updateOne(query, update);
      res.send(result);
    });

    app.patch("/update/:id", async (req, res) => {
      const {
        foodName,
        foodImage,
        foodQuantity,
        pickupLocation,
        expireDate,
        additionalNotes,
      } = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          foodName,
          foodImage,
          foodQuantity,
          pickupLocation,
          expireDate,
          additionalNotes,
        },
      };
      const result = await foodColl.updateOne(query, update);
      res.send(result)
    });

    app.delete('/delete/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await foodColl.deleteOne(query);
      res.send(result);
    })

    app.get('/requested-food', async(req, res)=>{
      const result = await foodColl.find({ "requestedDate": { $exists: true } }).toArray();
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run();

app.get("/", (req, res) => {
  res.send("Server is running...");
});
app.listen(port, () => {
  console.log("The server is running on port ", port);
});
