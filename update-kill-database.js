const db = require('./database');
const scraper = require('./latest-kill-log');

let maxTime;

function handleKill(timestampAsMoment,
		    killerName, killerId, victimName, victimId) {
    const unixTime = timestampAsMoment.unix();
    if (unixTime > maxTime) {
	console.log('New kill detected:', killerName, victimName, unixTime);
	maxTime = unixTime;
	db.putKill(timestampAsMoment,
		   killerName, killerId,
		   victimName, victimId, true);
    }
}

console.log('Getting latest known timestamp from the database...');
db.getMaxKillTimestamp((newMaxTime) => {
    maxTime = newMaxTime;
    console.log('maxTime:', maxTime);
    if (maxTime <= 0) {
	throw 'There is a problem with the max timestamp in the database.';
    }
    scraper.downloadLatestKillLog(true, handleKill);
});
