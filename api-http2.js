const http2 = require('node:http2');
const fs = require('node:fs');
const { Writable, Readable } = require('node:stream');
const { catifyStream, catifyStreamInWorker } = require('./catify-stream');

const port = 8443;
// We need to save the stream from the response request
// this will allow us to stream the transformed data
// back to our client
let receiver;

// make sure you run `npm run generate-certs` before using 
// this code. HTTP2 requires https.
const server = http2.createSecureServer({
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem'),
});

server.on('error', (err) => console.error(err));

/**
 * Based on the server-side example for the http2 module in the Node.js docs
 * {@link https://nodejs.org/api/http2.html}
 */
server.on('stream', (stream, headers) => {
  // Request streams always send a pre-flight request
  if (headers[':method'] === 'OPTIONS') {
    stream.respond({
      'Access-Control-Allow-Methods': 'GET,POST',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      ':status': 204,
    });
  }

  if (headers[':method'] === 'POST' && headers[':path'] === '/send') {   
    stream.respond({
      'Content-type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      ':status': 200,
    });
    stream.on('end', () => {
      stream.end();
    });

    catifyStreamInWorker(Readable.toWeb(stream).pipeThrough(new TextDecoderStream()), Writable.toWeb(receiver));
  }

  if (headers[':method'] === 'GET' && headers[':path'] === '/receive') {
    // We save the response stream so that the request stream can be
    // piped into the response after being transformed
    receiver = stream;
    stream.respond({
      'Content-type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      ':status': 200,
    });
  }
});

server.listen(port, () => console.log(`App listening on port: ${port}`));