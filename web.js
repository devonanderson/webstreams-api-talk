const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.get('/', function(_, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static('public'));

app.listen(port, function () {
  console.log(`App listening at http://localhost:${port}`);
});