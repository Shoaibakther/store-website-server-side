const express = require('express')
const app = express()
const cors = require('cors');
// const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m7jsy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('sunglassStore');
           const productsCollection = database.collection('products');

        
        // Get all products 
         app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({})
            const products = await cursor.toArray();
            res.send(products)
         })
        
        // post api 
        app.post('/products', async (req, res) => {
            const service = req.body;
     
            const result = await productsCollection.insertOne(service)
            // console.log(result);
            res.json(result)
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