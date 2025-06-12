const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("inside logger : ", token);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("inside token", token);

  if (!token) {
    return res.status(401).send({ message: "unauthorized entry" });
  }

  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized entry" });
    }
    req.decoded = decoded;
    next();
  });
};

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

    app.post("/jwt", async (req, res) => {
      const userData = req.body;
      // console.log(userData);
      const token = jwt.sign(userData, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "1d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      res.send({ success: true });
    });

    app.post("/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    });

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;

      const query = {};
      if (email) {
        query.hr_email = email;
      }

      const jobData = jobsCollection.find(query);
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

    app.get("/applications", logger, verifyToken, async (req, res) => {
      const email = req.query.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden authorize" });
      }
      const query = { applicant: email };
      const result = await apllicationsCollection.find(query).toArray();

      for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) };
        const job = await jobsCollection.findOne(jobQuery);
        application.company = job.company;
        application.company_logo = job.company_logo;
        application.title = job.title;
      }
      res.send(result);
    });

    app.get("/applications/job/:job_id", async (req, res) => {
      const job_id = req.params.job_id;
      const query = { jobId: job_id };
      const result = await apllicationsCollection.find(query).toArray();
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
