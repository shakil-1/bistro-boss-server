const express = require('express');
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;



const corsOptions = {
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  
};
app.use(cors(corsOptions));
app.use(express.json());


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
const paymentCollection = client.db('bistroDB').collection('payments')

// jwt related api 
app.post('/jwt', async (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
    res.send({ token })
  } catch (err) {
    console.log(err);
  }
})


// middelwares
const verifyToken = (req, res, next) => {
 try{
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
 }catch (err) {
  console.log(err);
}
}

// use verify admin after verifyToken 
const verifyAdmin = async (req, res, next) => {
 try{
  const email = req.decoded.email;
  const query = { email: email }
  const user = await userCollection.findOne(query)
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbdden access' })
  }
  next();
 }catch(err){
  console.log(err);
 }
}

// user related api 
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
 try{
  const result = await userCollection.find().toArray()
  res.send(result)
 }catch(err){
  console.log(err);
 }
})


app.get('/users/admin/:email', verifyToken, async (req, res) => {
 try{
  const email = req.params.email;
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: 'forbidden access' })
  }
  const query = { email: email }
  const user = await userCollection.findOne(query)
  let admin = false;
  if (user) {
    admin = user?.role === 'admin'
  }
  res.send({ admin });
 }catch(err){
  console.log(err);
 }
})

app.post('/users', async (req, res) => {
  try{
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
  }catch(err){
    console.log(err);
   }
})

app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
 try{
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const updatedDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result = await userCollection.updateOne(filter, updatedDoc)
  res.send(result)

 }catch(err){
  console.log(err);
 }
})

app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try{
    const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await userCollection.deleteOne(query)
  res.send(result)
  }catch(err){
    console.log(err);
   }
})



// menu related api 
app.get('/menu', async (req, res) => {
 try{
  const result = await menuCollection.find().toArray()
  res.send(result)
 }catch(err){
  console.log(err);
 }
})

app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {
 try{
  const item = req.body;
  const result = await menuCollection.insertOne(item)
  res.send(result)
 }catch(err){
  console.log(err);
 }
})

app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
  try{
    const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const result = await menuCollection.deleteOne(query)
  res.send(result)
  }catch(err){
    console.log(err);
   }
})

app.get('/menu/:id', async (req, res) => {
  try{
    const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const result = await menuCollection.findOne(query)
  res.send(result)
  }catch(err){
    console.log(err);
   }
})

app.patch('/menu/:id', async (req, res) => {
  try{
    const item = req.body;
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const updatedDoc = {
    $set: {
      name: item.name,
      category: item.category,
      price: item.price,
      recipe: item.recipe,
      image: item.image
    }
  }
  const result = await menuCollection.updateOne(filter, updatedDoc)
  res.send(result)
  }catch(err){
    console.log(err);
   }
})

// review related api 
app.get('/review', async (req, res) => {
 try{
  const result = await reviewsCollection.find().toArray()
  res.send(result)
 }catch(err){
  console.log(err);
 }
})



// carts collection 
app.get('/carts', async (req, res) => {
  try{
    const email = req.query.email;
  const query = { email: email }
  const result = await cartCollection.find(query).toArray()
  res.send(result)
  }catch(err){
    console.log(err);
   }
})



app.post('/carts', async (req, res) => {
 try{
  const cartItem = req.body;
  const result = await cartCollection.insertOne(cartItem)
  res.send(result)
 }catch(err){
  console.log(err);
 }
})

app.delete('/carts/:id', async (req, res) => {
 try{
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await cartCollection.deleteOne(query)
  res.send(result)
 }catch(err){
  console.log(err);
 }
})


//payment intent 
app.post('/create-payment-intent', async (req, res) => {
 try{
  const { price } = req.body;

  const amount = parseInt(price * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card']

  })
  res.send({
    clientSecret: paymentIntent.client_secret
  })
 }catch(err){
  console.log(err);
 }
})


app.get('/payments', verifyToken, async (req, res) => {
 try{
  const query = { email: req.query.email };
  if (req.params.email !== req.params.email) {
    return res.status(403).send({ message: 'forbidden access' })
  }
  const result = await paymentCollection.find(query).toArray()
  res.send(result)
 }catch(err){
  console.log(err);
 }
})


// payment related api 
app.post('/payments', verifyToken, async (req, res) => {
 try{
  const payment = req.body;
  const paymentResult = await paymentCollection.insertOne(payment)
  // carefully delete eact item from the cart
  const query = {
    _id: {
      $in: payment.cartIds.map(id => new ObjectId(id))
    }
  }
  const deleterResult = await cartCollection.deleteMany(query)
  res.send({ paymentResult, deleterResult })
 }catch(err){
  console.log(err);
 }
})

//stats or analytics
app.get('/admin-stats', verifyToken, verifyAdmin, async (req, res) => {
  try{
    const users = await userCollection.estimatedDocumentCount();
  const menuItems = await menuCollection.estimatedDocumentCount();
  const orders = await paymentCollection.estimatedDocumentCount();
  // this is not the best way 
  // const payments = await paymentCollection.find().toArray()
  // const revenue = payments.reduce((total, payment)=>total + payment.price,0)
  const result = await paymentCollection.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: '$price'
        }
      }
    }
  ]).toArray()
  const revenue = result.length > 0 ? result[0].totalRevenue : 0;

  res.send({
    users,
    menuItems,
    orders,
    revenue
  })
  }catch(err){
    console.log(err);
   }
})

// payment._id = payment._id.map(id => new ObjectId(id));
// oreder status
/**
 * ------
 * NON-EFFICIENT WAY
 * ----------
 * 1. lodad all the payments
 * 2. for every  menuItemIds (which is an array ), go find th item menu collection
 * 3. for every item in the menu collection that you found from  a payment entry (document)
 */



// usering aggregate pipline 
app.get('/order-stats', verifyToken, verifyAdmin, async (req, res) => {
  try{
    const result = await paymentCollection.aggregate([

      { $unwind: '$menuItemIds' },
      { "$project": { "menuItemId": { "$toObjectId": "$menuItemIds" } } },
      {
        $lookup: {
          from: 'menu',
          localField: 'menuItemId',
          foreignField: '_id',
          as: 'menuItems'
        }
      },
  
      { $unwind: '$menuItems' },
  
      {
        $group: {
          _id: '$menuItems.category',
          quantity: { $sum: 1 },
          revenue: { $sum: '$menuItems.price' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          quantity: '$quantity',
          revenue: '$revenue'
        }
      }
    ]).toArray();
  
    res.send(result);
  }catch(err){
    console.log(err);
   }

})


// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);

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