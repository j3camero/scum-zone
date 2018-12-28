const express = require('express');
const fs = require('fs');
const moment = require('moment-timezone');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    console.log('index');
    const json = fs.readFileSync('ranks.json');
    const ranks = JSON.parse(json);
    const t = moment.unix(ranks.timestamp);
    res.render('index', {
	ranks: ranks.ranks,
	updateDuration: t.from(moment()),
	updateTime: t.tz('America/Los_Angeles').format('MMM Do h:mm A'),
    });
});

port = 80
app.listen(port);
console.log(`Serving on port ${port}`);
