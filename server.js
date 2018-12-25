const express = require('express');
const fs = require('fs');
const moment = require('moment');

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    console.log('index');
    const json = fs.readFileSync('ranks.json');
    const ranks = JSON.parse(json);
    const t = moment.unix(ranks.timestamp);
    res.render('index', {
	ranks: ranks.ranks,
	updateDuration: t.from(moment()),
	updateTime: t.format('MMMM Do YYYY, HH:mm:ss'),
    });
});

port = 8080
app.listen(port);
console.log(`Serving on port ${port}`);
