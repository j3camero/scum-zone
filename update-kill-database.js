const fs = require('fs');
const moment = require('moment');

const db = require('./database');
const scraper = require('./scraper');

let maxTime;

function handleKill(data) {
    if (data.unixTime > maxTime) {
	console.log('New kill detected:');
	console.log(data);
	maxTime = data.unixTime;
	db.putKill(data, true);
	db.updateScumUser(data.killerId, data.killerName);
	db.updateScumUser(data.victimId, data.victimName);
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

function writeRankDataToFile(ranks) {
    console.log('Writing ranks to file.');
    const json = JSON.stringify({
	ranks,
	timestamp: moment().unix(),
    });
    fs.writeFile('ranks.json', json, 'utf8', () => {
	console.log('Wrote ranks to file.');
	const delay = 2 + poissonRandomNumber(61);
	console.log(`Scheduling next update for ${delay}m...`);
	console.log('Current time: ' + moment());
	setTimeout(update, delay * 60 * 1000);
    });
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
	    // Wait a bit before querying the database because some writes may
	    // still be finishing.
	    setTimeout(() => {
		db.calculateRankings(30 * 86400, writeRankDataToFile);
	    }, 2000);
	});
    });
}

update();
