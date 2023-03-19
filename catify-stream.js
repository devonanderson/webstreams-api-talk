const { TransformStream } = require('node:stream/web');
const { Worker } = require('worker_threads');

/**
 * The size of the data chunks are decided by the processing power
 * of your computer, and may or may not terminate cleanly on a new
 * line. This transform stream will split up the chunk into full
 * lines and feed them to the next stream line-by-line.
 * @returns {TransformStream}
 */
function lineByLineTransform () {
  return new TransformStream({
    strayLine: null,
    transform(chunk, controller) {
      const numNewLines = (chunk.match(/\n/g) || []).length;
      const lines = chunk.split(/\n/);

      // if the chunk exists but doesn't terminate in a newline
      // then it is the final record, prefix it with the stray line
      // if it exists
      if (!lines.length && chunk.length) {
        controller.enqueue(`${this.strayLine ? this.strayLine : ''}${chunk}`);
        return;
      }

      // if there is a stray line from the previous chunk prefix
      // it to the first line of the current chunk
      if (this.strayLine) {
        lines[0] = `${this.strayLine}${lines[0]}`;
        this.strayLine = null;
      }

      // if there are more lines than new line characters then
      // we have an incomplete line. Remove the incomplete line
      // from the chunk and save it for the next chunk
      if (lines.length > numNewLines) {
        this.strayLine = lines.pop();
      }

      lines.forEach((line) => controller.enqueue(line));
    }
  });
}

/**
 * This transform stream takes a record formatted like
 * {trackid}<SEP>{artist}<SEP>{song} separates it changes
 * one random word in the song title to "cat" and joins 
 * it back together lile {artist}<SEP>{song}
 * @returns {TransformStream}
 */
function catifyTransform() {
  return new TransformStream({
    transform(chunk, controller) {
      const [,artist,song] = chunk.split('<SEP>');
  
      const songWords = song.split(' ');
      const randomIndex = Math.floor(Math.random() * songWords.length);
      songWords[randomIndex] = 'Cat';
      const catifiedSong = songWords.join(' ');
  
      controller.enqueue(`${artist}<SEP>${catifiedSong}`);
    }
  }); 
} 

/**
 * This transform stream takes in a record formatted like
 * {artist}<SEP>{song} and creates an NDJSON formatted 
 * record.
 * {@link https://github.com/ndjson/ndjson-spec}
 * @returns {TransformStream}
 */
function NDJSONTransform () {
  return new TransformStream({
    transform(chunk, controller) {
      const [artist,song] = chunk.split('<SEP>');
      const record = {
        artist,
        song
      };
      // NDJSON formatting
      controller.enqueue(`${JSON.stringify(record)}\n`);
    }
  });
}

/**
 * Takes in a readable/writable pair and pipes them
 * through a series of transform streams to "catify"
 * the records.
 * @param {ReadableStream} readStream - readable side
 * @param {WritableStream} writeStream - writable side
 * @returns 
 */
function catifyStream(readStream, writeStream) {
  return readStream
    .pipeThrough(lineByLineTransform())
    .pipeThrough(catifyTransform())
    .pipeThrough(NDJSONTransform())
    .pipeThrough(new TextEncoderStream())
    .pipeTo(writeStream);
}

/**
 * Takes in a readable/writable pair and sends the 
 * readable side to a new worker thread. The data 
 * received back from the thread is written to the 
 * writable side.
 * @param {ReadableStream} readStream - readable side
 * @param {WritableStream} writeStream - writable side
 */
function catifyStreamInWorker(readStream, writeStream) {
  const worker = new Worker('./worker.js');
  const writer = writeStream.getWriter();
  
  worker.on('message', (data) => writer.write(data));
  worker.postMessage(readStream, [readStream]);
}

module.exports = {
  catifyStream,
  catifyStreamInWorker,
  lineByLineTransform,
  catifyTransform,
  NDJSONTransform
};