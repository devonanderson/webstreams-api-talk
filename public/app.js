/**
 * The size of the data chunks are decided by the network speed
 * and may or may not terminate cleanly on a new line. This 
 * transform stream will split up the chunk into full lines and 
 * feed them to the next stream line-by-line.
 * @returns {TransformStream}
 */
function lineByLineTransform() { 
  return new TransformStream({
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
 * A writable stream that creates a new list item element
 * for each record and appends them to an unordered list.
 * It limits the items to 3000 so it doesn't destroy the 
 * DOM.
 * @returns {WritableStream}
 */
function appendToListStream() {
  return  new WritableStream({
    counterEl: document.querySelector('#counter'),
    listEl: document.querySelector('#list'),
    count: 0,
    max: 3000,
    write(chunk) {
      if (this.count <= this.max) {
        const data = JSON.parse(chunk);
        const listItemEl = document.createElement('li');
        listItemEl.innerHTML = `<h2>${data.artist}</h2><p>${data.song}</p>`
        this.listEl.appendChild(listItemEl);
      } 
      this.count++;
      this.counterEl.innerHTML = `# of records read: <b>${this.count}</b>`
    }
  });
}

/**
 * Start a simple response stream
 */
async function startStream() {
  try {
    const res = await fetch('http://localhost:9000');
    res.body.pipeThrough(new TextDecoderStream()).pipeThrough(lineByLineTransform()).pipeTo(appendToListStream());
  } catch (err) {
    console.error(err);
  }
}

/**
 * Starts a POST request stream, sending a file to the server and 
 * opening up a GET request stream to receive the transformed
 * data from the server.
 * @param {File} file - The file object received from the user
 */
async function uploadFile(file) {
  const fileStream = file.stream();

  // request streams can only be done in half-duplex. Where 
  // the entire send must be completed before receiving a
  // response.
  // {@link https://fetch.spec.whatwg.org/#dom-requestinit-duplex}
  try {
    fetch('https://localhost:8443/send', {
      method: 'POST',
      body: fileStream,
      duplex: 'half'
    });
    const res = await fetch('https://localhost:8443/receive');
    res.body.pipeThrough(new TextDecoderStream()).pipeThrough(lineByLineTransform()).pipeTo(appendToListStream());
  } catch (err) {
    console.error(err);
  }
}

const buttonEl = document.querySelector('#button');
buttonEl.addEventListener('click', (e) => {
  e.preventDefault();
  startStream();
});

const fileEl = document.querySelector('#file');
fileEl.addEventListener('change', (e) => {
  e.preventDefault();
  const { files } = e.target;
  const [ file ] = files;
  if (file) {
    uploadFile(file);
  }
});