const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());



app.get('/',(req,res) => {
    res.send("job Portal server in running")
});





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lewcb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const jobCollections = client.db('jobPortal').collection('jobs');
    const jobApplications = client.db('jobPortal').collection('applications')

    app.get('/jobs',async(req,res) => {
        const result = await jobCollections.find().toArray()
        res.send(result);
    });

    app.get('/jobs/:id',async(req,res) => {
      const ids = req.params.id
      console.log(ids)
      const query = {_id : new ObjectId(ids)}
      const result = await jobCollections.findOne(query);
      console.log(result);
      res.send(result);
    });

    // job application api 
    app.post('/job-application',async(req,res) => {
      const application = req.body 
      const result = await jobApplications.insertOne(application);
      res.send(result);
    });

    app.get('/application',async(req,res) => {
      const email = req.query.email;
      const query = {applicant_email:email}
      const result = await jobApplications.find(query).toArray();
      res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`job is running on port ${port}`);
});