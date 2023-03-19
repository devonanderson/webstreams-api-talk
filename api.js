const express = require('express');
const cors = require('cors');
const { Readable, Writable, } = require("stream");
const { createReadStream } = require('fs');
const { catifyStream } = require('./catify-stream.js');

const app = express();
const port = 9000;

app.use(cors());

app.get('/', function(_, res) {
    res.status(200);
    res.setHeader('Content-Type', 'application/x-ndjson'); 

    const readStream = Readable.toWeb(createReadStream('./input.txt', { encoding: 'UTF-8' }));
    // The response object uses the legacy Node.js stream module
    // it needs to be converted to a Web Stream manually
    catifyStream(readStream, Writable.toWeb(res));
});

app.listen(port, function () {
  console.log(`App listening at http://localhost:${port}`);
});