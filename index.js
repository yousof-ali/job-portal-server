const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin:[
    'http://localhost:5173',
    'https://job-portal-2a260.web.app',
    'https://job-portal-2a260.firebaseapp.com'
  ],
  credentials:true,
}));
app.use(express.json());
app.use(cookieParser());


const verifyToken = (req,res,next) => {
   const token = req?.cookies?.token

   if(!token){
    return res.status(401).send({massage:'Unauthorized access'})
   }
   jwt.verify(token,process.env.JWT_SECRET,(err,decoded) =>{
    if(err){
      return res.status(401).send({message:'unauthorized access'})
    }
    req.user = decoded;
    next();
   })

}



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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const jobCollections = client.db('jobPortal').collection('jobs');
    const jobApplications = client.db('jobPortal').collection('applications')

    // auth related api 
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '5h' });
    
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })
        .send({ success: true });
    });
    

    app.post('/logout', async (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })
        .send({ success: true });
    });

    // jobCollections api 

    app.get('/jobs',async(req,res) => {
      const email = req.query.email
      let query = {}
      if(email){
        query={hr_email:email}
      }
        const result = await jobCollections.find(query).toArray()
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

    app.post('/add-job',async(req,res) => {
      const data = req.body;
      const result = await jobCollections.insertOne(data)
      res.send(result);
    });

    // job application api 
    app.post('/job-application',async(req,res) => {
      const application = req.body 
      const result = await jobApplications.insertOne(application);
      res.send(result);
    });

    app.get('/job-applications/:id',async(req,res) => {
      const id = req.params.id 
      const qurey = {job_id : id}
      const result = await jobApplications.find(qurey).toArray();
      res.send(result);
    })

    app.patch('/setStatus/:id',async(req,res) => {
      
      const id = req.params.id 
      const data = req.body.status
      const query = {_id: new ObjectId(id)};
      console.log(query);
      const updateDoc = {
        $set:{
          status:data
        }
      }
      const result = await jobApplications.updateOne(query,updateDoc);
      res.send(result);
    })

    app.get('/application',verifyToken,async(req,res) => {
      const email = req.query.email;
      const query = {applicant_email:email}
      if(req.user.email !== req.query.email){
        return res.status(403).send({message:'forbidden access'})
      }
      const result = await jobApplications.find(query).toArray();
      
      for(const jobId of result){
        const query2 = {_id : new ObjectId(jobId.job_id)}
        const result2 = await jobCollections.findOne(query2);
        if(result2){
          jobId.title = result2.title
          jobId.location = result2.location
          jobId.company_logo = result2.company_logo
          jobId.company = result2.company
        };
      }
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