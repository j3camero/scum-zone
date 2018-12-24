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

function updateKillDatabase() {
    console.log('Current time: ' + moment());
    console.log('Getting latest known timestamp from the database...');
    db.getMaxKillTimestamp((newMaxTime) => {
	maxTime = newMaxTime;
	console.log('maxTime:', maxTime);
	if (maxTime <= 0) {
	    throw 'There is a problem with the max timestamp in the database.';
	}
	scraper.downloadLatestKillLog(true, handleKill, () => {
	    const delay = 2 + poissonRandomNumber(3);
	    console.log(`Scheduling next DB update for ${delay}m...`);
	    console.log('Current time: ' + moment());
	    setInterval(updateKillDatabase, delay * 60 * 1000);
	});
    });
}

updateKillDatabase();
