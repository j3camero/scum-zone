const fs = require('fs');
const moment = require('moment');

const db = require('./database');
const scraper = require('./scraper');

let maxTime;
let currentPvpZone;

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

function handleLogin(data) {
    // No timestamp comparison for logins. This means we will have redundant
    // database updates but it's not a huge deal.
    db.updateScumUser(data.steamId, data.name);
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
	pvpZone: currentPvpZone,
	ranks,
	timestamp: moment().unix(),
    });
    fs.writeFile('public/update.json', json, 'utf8', () => {
	console.log('Wrote ranks to file.');
	const delay = 2 + poissonRandomNumber(61);
	console.log(`Scheduling next update for ${delay}m...`);
	console.log('Current time: ' + moment());
	setTimeout(update, delay * 60 * 1000);
    });
}

function updateScumEvent(callback) {
    console.log('Checking for a running event.');
    db.getAllScumPlaces((places) => {
	db.getRecentScumEvents(24 * 3600, (todayEvents) => {
	    if (todayEvents.length > 0) {
		console.log('Event found. Getting event details.');
		const placeId = todayEvents[0];
		places.forEach((place) => {
		    if (place.id === placeId) {
			console.log('Event:', place);
			currentPvpZone = place;
			callback();
		    }
		});
	    } else {
		console.log('No event found. Creating new event.');
		db.getRecentScumEvents(30 * 24 * 3600, (monthEvents) => {
		    const eligibleLocations = [];
		    places.forEach((place) => {
			if (monthEvents.indexOf(place.id) < 0) {
			    eligibleLocations.push(place);
			}
		    });
		    const randomIndex = Math.floor(Math.random() *
						   eligibleLocations.length);
		    const randomPlace = eligibleLocations[randomIndex];
		    db.createScumEvent(randomPlace.id, () => {
			console.log('Event:', randomPlace);
			currentPvpZone = randomPlace;
			callback();
		    });
		});
	    }
	});
    });
}

function updateKills() {
    console.log('Current time: ' + moment());
    console.log('Getting latest known timestamp from the database...');
    db.getMaxKillTimestamp((newMaxTime) => {
	maxTime = newMaxTime;
	console.log('maxTime:', maxTime);
	if (maxTime <= 0) {
	    throw 'There is a problem with the max timestamp in the database.';
	}
	scraper.downloadLatestKillLog(true, handleKill, handleLogin, () => {
	    console.log('Done updating DB. Calculating ranks.');
	    // Wait a bit before querying the database because some writes may
	    // still be finishing.
	    setTimeout(() => {
		db.calculateRankings(30 * 86400, writeRankDataToFile);
	    }, 2000);
	});
    });
}

function update() {
    updateScumEvent(() => {
	updateKills();
    });
}

update();
