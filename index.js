const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
app.use(cors());
app.use(express.json());

// console.log(process.env);

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@iftekharbases.ulu3uwc.mongodb.net/?retryWrites=true&w=majority&appName=IftekharBases`;

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
    await client.connect();

    // db name creating
    const database = client.db("job-portal");
    const jobsCollection = database.collection("jobs");
    const apllicationsCollection = database.collection("applications");

    app.get("/jobs", async (req, res) => {
      const jobData = jobsCollection.find();
      const result = await jobData.toArray();
      res.send(result);
    });

    app.get(`/jobs/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post(`/applications`, async (req, res) => {
      const application = req.body;
      const result = await apllicationsCollection.insertOne(application);
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

app.get("/", (req, res) => {
  res.send("I am Cooking");
});

app.listen(port, () => {
  console.log(`server running on`, port);
});
