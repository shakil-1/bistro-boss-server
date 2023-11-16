const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



const corsOptions = {
  origin: 'http://localhost:5173',
  // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  // optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// middleware
app.use(express.json())


console.log(process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vte07fo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const menuCollection = client.db('bistroDB').collection('menu')
const reviewsCollection = client.db('bistroDB').collection('reviews')
const cartCollection = client.db('bistroDB').collection('carts')
const userCollection = client.db('bistroDB').collection('users')

// jwt related api 
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  res.send({ token })
})

// middelwares
const verifyToken = (req, res, next) => {
  console.log('inseide token', req.headers);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'forbidden access' })
  }
const token = req.headers.authorization.split(' ')[1];

  // next()

}

// user related api 
app.get('/users', verifyToken, async (req, res) => {
  const result = await userCollection.find().toArray()
  res.send(result)
})
app.post('/users', async (req, res) => {
  const user = req.body;
  // inser email if user doesnt exists;
  // you con do this many was (1. email unique , 2 . upsert3. simple checking)

  const query = { email: user.email }
  const existingUser = await userCollection.findOne(query)
  if (existingUser) {
    return res.send({ message: 'user already exist', insertedId: null })
  }
  const result = await userCollection.insertOne(user)
  res.send(result)
})

app.patch('/users/admin/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const updatedDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result = await userCollection.updateOne(filter, updatedDoc)
  res.send(result)

})

app.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await userCollection.deleteOne(query)
  res.send(result)
})



// menu related api 
app.get('/menu', async (req, res) => {
  const result = await menuCollection.find().toArray()
  res.send(result)
})
app.get('/review', async (req, res) => {
  const result = await reviewsCollection.find().toArray()
  res.send(result)
})


// carts collection 
app.get('/carts', async (req, res) => {
  const email = req.query.email;
  const query = { email: email }
  const result = await cartCollection.find(query).toArray()
  res.send(result)
})



app.post('/carts', async (req, res) => {
  const cartItem = req.body;
  const result = await cartCollection.insertOne(cartItem)
  res.send(result)
})

app.delete('/carts/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await cartCollection.deleteOne(query)
  res.send(result)

})



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('bistro bosss server is running')
})

app.listen(port, () => {
  console.log(`bisto servier running ${port}`);
})

/**
 * ---------------------------
 * NAMING CONVENTION
 * ---------------------
 * 
 * app.get('/user')
 * app.get('/user/:id')
 * app.post('/users')
 * app.put('/user/:id')
 * app.patch('/user/:id')
 * app.delete('/user/:id')
 * 
 */