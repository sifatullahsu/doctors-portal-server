const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5001;

const app = express();

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${pass}@cluster0.rbe1w.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    const db = client.db('our-doctors-portal');

    const servicesCollection = db.collection('services');
    const appointmentsCollection = db.collection('appointments');
    const bookingsCollection = db.collection('bookings');
    const doctorsCollection = db.collection('doctors');


    app.get('/appointments', async (req, res) => {
      const date = req.query.date;

      const query = {}
      const appointments = await servicesCollection.find(query).toArray();

      const bookingsQuery = { "appointmentInfo.date": date }
      const bookings = await bookingsCollection.find(bookingsQuery).toArray();

      appointments.forEach(appointment => {
        const booked = bookings.filter(bookedItem => bookedItem.appointmentInfo.treatmentId === appointment._id.toString());
        const bookedSlots = booked.map(bookedItem => bookedItem.appointmentInfo.slot);
        const remainingSlots = appointment.slots.filter(slot => !bookedSlots.includes(slot));

        appointment.slots = remainingSlots;
      });

      res.send(appointments);
    });

    app.get('/services', async (req, res) => {
      const query = {}
      const services = await servicesCollection.find(query).toArray();

      res.send(services);
    });

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) }
      const service = await servicesCollection.findOne(query);

      const doctorsQuery = { email: { $in: service?.doctors } }
      const doctors = await doctorsCollection.find(doctorsQuery).project({ name: 1, email: 1, _id: 0 }).toArray();

      const doctorsProcess = doctors.map(i => {
        return ({ value: i.email, label: `${i.name} (${i.email})` });
      });

      service?.doctors ? service.doctors = doctorsProcess : '';

      res.send(service);
    });

    app.post('/services/add', async (req, res) => {
      const data = req.body;
      const result = await servicesCollection.insertOne(data);

      res.send(result);
    });

    app.patch('/services/edit/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      const query = { _id: ObjectId(id) }
      const updateDoc = {
        $set: data
      };

      const result = await servicesCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    app.post('/booking', async (req, res) => {
      const data = req.body;
      const result = await bookingsCollection.insertOne(data);

      res.send(result);
    });

    app.post('/doctors/add', async (req, res) => {
      const data = req.body;
      const result = await doctorsCollection.insertOne(data);

      res.send(result);
    });

    app.patch('/doctors/edit/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      const query = { _id: ObjectId(id) }
      const updateDoc = {
        $set: data
      };

      const result = await doctorsCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    app.get('/doctors', async (req, res) => {
      const query = {}
      const doctors = await doctorsCollection.find(query).toArray();

      res.send(doctors);
    });

    app.get('/doctors/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) }
      const doctor = await doctorsCollection.findOne(query);

      res.send(doctor);
    });

    app.get('/doctors/name/:name', async (req, res) => {
      const name = req.params.name;

      const query = { name: { $text: { $search: name } } }
      const doctors = await doctorsCollection.find(query).project({ name: 1, email: 1, _id: 0 }).toArray();

      const dataProcess = doctors.map(i => {
        return ({ value: i.email, label: `${i.name} (${i.email})` });
      });


      res.send(dataProcess);
    });

  }
  finally {

  }
}
run().catch(console.log);


/* app.get('/', async (req, res) => {
  res.send('Our doctors portal server is running');
}); */

app.get('/', (res, req) => {
  req.json({ result: true })
})

app.listen(port, () => {
  console.log(`Our Doctors portal running on ${port}`)
});