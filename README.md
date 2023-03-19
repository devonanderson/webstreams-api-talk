# Web Streams Code Examples

Hello! If you are reading this, then it is likely that you attended my talk on the Web Streams API, if so, thank you for that. This repo contains the companion code for the live coding sessions that were performed as part of the talk. This is the completed version of the code, and has been fully commented for your convenience.

## Getting started

There isn't much to do to get things started. In order to run the request streams example, you will need to generate a self-signed certificate. To do so, simply run:

```bash
$ npm run generate-certs
```

After this you should end up with two files: `localhost-cert.pem` and `localhost-privkey.pem`. This is all you need to run the example.

## Basic command line example
The `file-read.js` file contains a simple example of reading from a file to a stream, transforming the stream, and writing to a a new file.

```shell
$ npm run file-read.js
```

This should generate an `output.ndjson` file containing the transformed text.

## Streaming API response
To see the streaming API response in action, you need to run two servers. The web server and the API server. In two separate terminal shells run:

```shell
$ npm run web
```

```shell
$ npm run api
```

Visit `localhost:3000` and click the "Start Stream" button.

## Streaming API request 
To see the streaming API request in action, you need to run two servers. The web server and the API server. In two separate terminal shells run:

```shell
$ npm run web
```

```shell
$ npm run api-http2
```

Visit `localhost:3000` and upload the `input.txt` file found in this repo using the "Choose file..." file upload input.

## Troubleshooting.
The HTTP2 example uses self-signed certs to provide https. This can sometimes be blocked by browsers. If you see `NET::ERR_CERT_AUTHORITY_INVALID` errors in your console, then you will need to change the browser settings to allow self-signed certs for `localhost`.

### In Chrome
Visit `chrome://flags/#allow-insecure-localhost`