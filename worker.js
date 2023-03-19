const { parentPort } = require('node:worker_threads');
const { TransformStream } = require('node:stream/web');
const { lineByLineTransform, catifyTransform, NDJSONTransform } = require('./catify-stream');

// this code will be run inside the worker thread
parentPort.onmessage = async ({ data }) => {
  // an identity stream gives as a convenient
  // way to get chunks from our stream back
  // to the parent thread.
  const { readable, writable } = new TransformStream();
  data
    .pipeThrough(lineByLineTransform())
    .pipeThrough(catifyTransform())
    .pipeThrough(NDJSONTransform())
    .pipeTo(writable);

  // chunks are piped into writable end
  // of our indentity stream. We read
  // them here and send them back to the 
  // parent thread
  for await(const chunk of readable) {
    // parent port has access to the parent thread
    parentPort.postMessage(chunk);
  }
  parentPort.close();
}