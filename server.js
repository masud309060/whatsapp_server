// importing 
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors'
import Pusher from 'pusher'
import Messages from './dbMessages.js'
require('dotenv').config()

// PASS=hfZxvOivgoaDEPeo

// app config 
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1115636",
  key: "74b449df464dac7b1b64",
  secret: "f39957013ee26da866c0",
  cluster: "eu",
  useTLS: true
});

// middleware 
app.use(express.json());
app.use(cors())

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
})


// DB config 
const cunnection_url = `mongodb+srv://admin:${process.env.DB_PASS}@cluster0.e1jdm.mongodb.net/whatsapp_db?retryWrites=true&w=majority`


// ??? 
mongoose.connect(cunnection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connection");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {

    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('message', 'inserted', 
      {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received
      }
      );
    } else {
      console.log('Error triggering Pusher')
    }

  });
});

// api routing 
app.get('/', (req, res) => {
  res.status(200).send('Hello world')
})

app.get('/messages/sync', (req, res) => {
  Messages.find({}, (err, data) => {
    if(err) {
      res.send(err)
    } else {
      res.send(data)
    }
  })
});

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if(err) {
      res.status(500).send(err)
    } else {
      res.status(201).send(data)
    }
  })
})

// listen 
app.listen(port, () => console.log(`Listening to the localhost: ${port}`))