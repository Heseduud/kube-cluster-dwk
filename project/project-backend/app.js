const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const axios = require('axios');
const cors = require('cors');
const { connect, JSONCodec, StringCodec } = require('nats');
const { json } = require('express');

const app = express();
const pool = new Pool();
const port = 5000;

var imgDate = new Date();

const imgPath = path.resolve(__dirname, 'files', 'photo.jpg');
const timestampPath = path.resolve(__dirname, 'files', 'timestamp.txt');

app.use(express.json());
app.use(cors());

// Check if we're in GKE
if (process.env.GKE='true') {
  app.use(express.static('build'));
}

const checkDay = () => {
  const dateNow = new Date();
  if (fs.existsSync(timestampPath)) {
    const timestamp = fs.readFileSync(timestampPath).toString();
    if (dateNow.toISOString().substring(0, 10) !== timestamp) {
      fs.writeFileSync(timestampPath, `${dateNow.toISOString().substring(0, 10)}`);
      return false;
    } else {
      return true;
    }
  } else {
    fs.writeFileSync(timestampPath, `${dateNow.toISOString().substring(0, 10)}`);
    return false;
  }
};

const downloadImage = async () => {
  const url = 'https://picsum.photos/400/600.jpg';
  if (fs.existsSync(imgPath)) {
    try {
      fs.unlinkSync(imgPath);
    } catch (e) {
      console.log(e);
    }
  }

  const writer = fs.createWriteStream(imgPath);

  const res = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  res.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

app.put('/api/todos/:id', async (req, res) => {
  const dbRes = await pool.query('UPDATE todos SET done = true WHERE id = ($1) RETURNING *', [req.params.id]);
  console.log('Db res: ' + dbRes);
  console.log(JSON.stringify(dbRes));
  if (process.env.NATS_URL) {
    console.log('Sending nats message');
    const nc = await connect({ servers: process.env.NATS_URL });
    const jc = JSONCodec();
    const s = dbRes.rows[0];
    console.log(s)

    const r = {
      msg: 'Todo modified',
      id: s.id,
      todo: s.todo,
      done: s.done
    };

    nc.publish('nats', jc.encode(r));
    await nc.drain();
    console.log('Nats message sent');
  }

  res.status(200).send('Todo updated');
});

app.post('/api/todos', async (req, res) => {
  if (req.body.todo.length > 140) { 
    res.status(403).send('Todo too long'); 
  } else {
    const dbRes = await pool.query('INSERT INTO todos (todo) VALUES ($1) RETURNING *', [req.body.todo]);
    console.log('Db rows: ' + JSON.stringify(dbRes.rows));
    if (process.env.NATS_URL) {
      console.log('Sending nats message');
      const nc = await connect({ servers: process.env.NATS_URL });
      const jc = JSONCodec();
      const s = dbRes.rows[0];

      const r = {
        msg: 'New todo inserted: ',
        id: s.id,
        todo: s.todo,
        done: s.done
      };

      nc.publish("nats", jc.encode(r));
      await nc.drain();
      console.log('Nats message sent');
    }

    res.status(201).send('Insert succesful');
  }
});

app.get('/api/todos', (req, res) => {
  pool.query('SELECT * FROM todos ORDER BY ID ASC', (err, resdb) => {
    if (err) {
      console.log(err);
    }

    res.status(200).json(resdb.rows)
  })
})

app.get('/api/getImage', async (req, res) => {
  if (checkDay() && fs.existsSync(imgPath)) {
    res.sendFile(imgPath);
  } else {
    imgDate = new Date();

    await downloadImage()
    res.sendFile(imgPath);
  }
});

app.get('/api', (req, res) => {
  res.send('<p>Working as intended!</p>');
});

// Healthcheck endpoint for kube probes
app.get('/healthz', (req, res) => {
  pool.query('SELECT * FROM todos', (err, dbres) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    }
    // We have Db connection AND todos schema/table exists
    if (dbres.rows) {
      res.sendStatus(200);
    }
  });
});

app.listen(port, () => {
  console.log(`Server started in port ${port}`);

  pool.query('CREATE SCHEMA IF NOT EXISTS todos', (err, res) => {
    if (err) {
      console.log(err);
      // throw err;
    }
  });

  pool.query(`CREATE TABLE IF NOT EXISTS todos (
    ID SERIAL PRIMARY KEY,
    todo VARCHAR NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false
  )`, (err, res) => {
    if (err) {
      console.log(err);
    }
  });
});