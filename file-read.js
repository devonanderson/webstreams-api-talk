const { createReadStream, createWriteStream } = require('fs');
const { Readable, Writable } = require('stream');
const { catifyStream, catifyStreamInWorker } = require('./catify-stream');

// both of these methods use the old stream API, but
// we can convert them to web streams.
const readStream = Readable.toWeb(createReadStream('./input.txt', { encoding: 'UTF-8' }));
const writeStream = Writable.toWeb(createWriteStream('./output.ndjson'));

catifyStreamInWorker(readStream, writeStream);