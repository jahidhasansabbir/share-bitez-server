const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors");
const cookieParser = require("cookie-parser");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const serviceAccount = require("./firebaseServiceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

    // home
    app.get("/foods", async (req, res) => {
      const result = await foodColl
        .find()
        .sort({ foodQuantity: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    const verifyToken = (req, res, next) => {
      const token = req?.cookies?.token;
      if (!token) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // available-food
    app.get("/available-foods", async (req, res) => {
      const result = await foodColl
        .find({ foodStatus: "available" })
        .sort({ expireDate: 1 })
        .toArray();
      res.send(result);
    });

    // add food
    app.post("/foods", async (req, res) => {
      const data = req.body;
      const result = await foodColl.insertOne(data);
      res.send(result);
    });

    // food details
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodColl.findOne(query);
      res.send(result);
    });

    // request food
    app.patch("/food/:id", async (req, res) => {
      const id = req.params.id;
      const { foodStatus, requestedDate, requestedEmail } = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          foodStatus,
          requestedDate,
          requestedEmail,
        },
      };
      const result = await foodColl.updateOne(query, update);
      res.send(result);
    });

    // update my food
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
      res.send(result);
    });

    // delete my food
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodColl.deleteOne(query);
      res.send(result);
    });

    // manage my food
    app.get("/manage-my-food/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email != req.decoded.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await foodColl.find({ "donor.email": email }).toArray();
      res.send(result);
    });

    // request food
    app.get("/requested-food/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email != req.decoded.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await foodColl
        .find({
          requestedEmail: email,
        })
        .toArray();
      res.send(result);
    });

    app.post("/jwt", async (req, res) => {
      const userInfo = req.body;
      const token = jwt.sign(userInfo, process.env.SECRET_KEY, {
        expiresIn: "7d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
      });
      res.send({ message: "Successfully token created" });
    });

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
