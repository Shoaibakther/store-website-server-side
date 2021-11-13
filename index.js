const express = require('express')
const app = express()
const cors = require('cors');

require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;


const port = process.env.PORT || 7000;

var admin = require("firebase-admin");

var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m7jsy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1]

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email
    }
    catch {
      
    }
  }
  next();
}


async function run() {
    try {
        await client.connect();
        const database = client.db('sunglassStore');
           const productsCollection = database.collection('products');
      const usersCollection = database.collection('users');
      const ordersCollection = database.collection('orders');
      const reviewCollection = database.collection('review');
        
        // Get all products 
         app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({})
            const products = await cursor.toArray();
            res.send(products)
         })
      // Get single api 
        app.get('/products/:id', async (req, res) => {
          const id = req.params.id;
          console.log(id);
          const query = { _id: ObjectId(id) };
            const service = await productsCollection.findOne(query)
            res.json(service)
        })
      // add order 
       app.post('/addOrder', async (req, res) => {
            const service = req.body;
            const result = await ordersCollection.insertOne(service)
            // console.log(result);
            res.json(result)
       })
      
        // Get Orders 
            app.get("/myOrders/:email", async (req, res) => {
                const result = await ordersCollection.find({ email: req.params.email }).toArray();
                res.send(result);
            })
        
        // post api 
        app.post('/products', async (req, res) => {
            const service = req.body;
            const result = await productsCollection.insertOne(service)
            res.json(result)
        })
      
      // user post 
      app.post('/users', async (req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        console.log(result);
        res.json(result)
      })
      // update users 
      app.put('/users', async (req, res) => {
        const user = req.body;
        const filter = { email: user.email };
        const options = { upsert: true };
        const updateDoc = { $set: user };
        const result = await usersCollection.updateOne(filter, updateDoc, options)
        res.json(result)
      })

      // admin email 
      app.get('/users/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query)
        let isAdmin = false;
        if (user?.role === 'admin') {
          isAdmin = true;
        }
        res.json({admin: isAdmin})
      })

      // make admin 
      app.put('/users/admin',verifyToken, async (req, res) => {
        const user = req.body;
        const requester = req.decodedEmail;
        if (requester) {
          const requesterAccount = await usersCollection.findOne({email: requester})
          if (requesterAccount.role === 'admin') {
            const filter = { email: user.email };
        const updateDoc = { $set: {role: 'admin'}}
        const result = await usersCollection.updateOne(filter, updateDoc)
        res.json(result);
          }
        }
        else {
          res.status(403).json({message: 'You have no permit'})
        }
      
      })

      // add review 
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review)
            // console.log(result);
            res.json(result)
        })
      
      // Get review 
       app.get('/review', async (req, res) => {
            const cursor = reviewCollection.find({})
            const review = await cursor.toArray();
            res.send(review)
         })

       
    } finally {
        // await client.close();
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})