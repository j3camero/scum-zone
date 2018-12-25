const fs = require('fs');
const moment = require('moment');

const db = require('./database');
const scraper = require('./latest-kill-log');

let maxTime;

function handleKill(data) {
    if (data.unixTime > maxTime) {
	console.log('New kill detected:');
	console.log(data);
	maxTime = data.unixTime;
	db.putKill(data, true);
    }
}

// Don't put massive inputs into this. For lambda > 100 or so, a normal
// approximation will be more efficient.
function poissonRandomNumber(lambda) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
	++k;
	p *= Math.random();
    } while (p > L);
    return k - 1;
}

function update() {
    console.log('Current time: ' + moment());
    console.log('Getting latest known timestamp from the database...');
    db.getMaxKillTimestamp((newMaxTime) => {
	maxTime = newMaxTime;
	console.log('maxTime:', maxTime);
	if (maxTime <= 0) {
	    throw 'There is a problem with the max timestamp in the database.';
	}
	scraper.downloadLatestKillLog(true, handleKill, () => {
	    console.log('Done updating DB. Calculating ranks.');
	    db.calculateRankings(30 * 86400, (ranks) => {
		const json = JSON.stringify({
		    ranks,
		    timestamp: moment().unix(),
		});
		console.log('Ranks calculated. Writing to file.');
		fs.writeFile('ranks.json', json, 'utf8', () => {
		    console.log('Wrote ranks to file.');
		    const delay = 2 + poissonRandomNumber(61);
		    console.log(`Scheduling next update for ${delay}m...`);
		    console.log('Current time: ' + moment());
		    setTimeout(update, delay * 60 * 1000);
		});
	    });
	});
    });
}

update();
