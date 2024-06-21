const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.htmjwbo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    //collection
    const userCollection = client.db("AtgWorldDB").collection("users");
    const postCollection = client.db("AtgWorldDB").collection("posts");

    app.post("/register_user", async (req, res) => {
      const userInfo = req.body;
      const email = userInfo.email;
      const userName = userInfo.username;

      const emailExist = await userCollection.findOne({ email: email });
      if (emailExist) {
        return res.send({ message: "Email Already Registered" });
      }
      const usernameExist = await userCollection.findOne({
        username: userName,
      });
      if (usernameExist) {
        return res.send({ message: "username has already taken" });
      }

      const result = await userCollection.insertOne(userInfo);
      res.send({ message: "Sign Up Successful" });
    });

    app.post("/login", async (req, res) => {
      const userInfo = req.body;
      const userName = userInfo.username;
      const password = userInfo.password;

      const userExist = await userCollection.findOne({ username: userName });

      if (!userExist) {
        return res.send({ message: "user not found" });
      }

      if (password !== userExist.password) {
        return res.send({ message: "Invalid Password" });
      }

      if (password == userExist.password) {
        return res.send({ message: "login successful", user: userExist });
      }
    });

    app.post("/forgot-password", async (req, res) => {
      const userInfo = req.body;
      const query = {
        username: userInfo.username,
        email: userInfo.email,
      };

      const userExist = await userCollection.findOne(query);

      if (!userExist) {
        return res.send({ message: "user not found" });
      }
      return res.send({ message: "user found", userInfo: userExist });
    });

    app.patch("/change-password/:email", async (req, res) => {
      const email = req.params?.email;
      const newPassword = req.body?.password;
      const filter = {
        email: email,
      };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          password: newPassword,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      return res.send(result);
    });

    //post related apis

    app.get("/posts", async (req, res) => {
      const result = await postCollection.find().toArray();
      res.send(result);
    });

    app.get("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await postCollection.findOne(query);
      res.send(result);
    });

    app.post("/posts", async (req, res) => {
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
    });

    app.patch("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const updatedPost = req.body;
      const filter = {
        _id: new ObjectId(id),
      };
      const options = {
        upsert: true,
      };
      const updateDoc = {
        $set: {
          ...updatedPost,
        },
      };

      const result = await postCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await postCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Atg server is running...");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
