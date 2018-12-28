const AWS = require('aws-sdk');
const moment = require('moment');

const bayeselo = require('./bayeselo-wrapper.js');

AWS.config.update({region: 'us-west-2'});
const db = new AWS.DynamoDB({apiVersion: '2012-10-08'});

function putKill(data, verbose) {
    const killId = `K${data.killerId}V${data.victimId}T${data.unixTime}`;
    const params = {
	TableName: 'scum-kills',
	Item: {
	    killId: {S: killId},
	    unixTime: {N: data.unixTime.toString()},
	    formattedTime: {S: data.formattedTime},
	    killerName: {S: data.killerName},
	    killerId: {S: data.killerId.toString()},
	    victimName: {S: data.victimName.toString()},
	    victimId: {S: data.victimId.toString()},
	}
    };
    if (data.killerX && data.killerY && data.killerZ) {
	params.Item.killerX = {N: data.killerX.toString()};
	params.Item.killerY = {N: data.killerY.toString()};
	params.Item.killerZ = {N: data.killerZ.toString()};
    }
    if (data.victimX && data.victimY && data.victimZ) {
	params.Item.victimX = {N: data.victimX.toString()};
	params.Item.victimY = {N: data.victimY.toString()};
	params.Item.victimZ = {N: data.victimZ.toString()};
    }
    if (verbose) console.log('About to write a new kill to the database.');
    db.putItem(params, (err, data) => {
	if (err) {
	    throw err;
	} else if (verbose) {
	    console.log('Great success.');
	}
    });
}

function getMaxKillTimestamp(callback) {
    var params = {
	ProjectionExpression: 'unixTime',
	TableName: 'scum-kills',
    };
    db.scan(params, (err, data) => {
	if (err) {
	    throw err;
	} else {
	    let maxTime = 0;
	    data.Items.forEach((element, index, array) => {
		if (element.unixTime.N > maxTime) {
		    maxTime = element.unixTime.N;
		}
	    });
	    callback(maxTime);
	}
    });
}

function addNonViolentPlayers(violentPlayers, callback) {
    console.log('Adding non-violent players.');
    const params = {
	TableName: 'scum-users',
    };
    db.scan(params, (err, data) => {
	if (err) {
	    throw err;
	} else {
	    const nonviolent = {};
	    data.Items.forEach((user) => {
		nonviolent[user.steamId.S] = user.name.S;
	    });
	    violentPlayers.forEach((player) => {
		delete nonviolent[player.id];
	    });
	    Object.keys(nonviolent).forEach((id) => {
		violentPlayers.push({
		    deaths: 0,
		    elo: 0,
		    id,
		    kills: 0,
		    maxTimestamp: 0,
		    name: nonviolent[id],
		});
	    });
	    callback();
	}
    });
}

function sortPlayersByElo(players, callback) {
    const sortedPlayers = Object.values(players).sort((a, b) => {
	if (a.elo < b.elo) return 1;
	if (a.elo > b.elo) return -1;
	if (a.kills < b.kills) return 1;
	if (a.kills > b.kills) return -1;
	if (a.deaths < b.deaths) return 1;
	if (a.deaths > b.deaths) return -1;
	if (a.maxTimestamp < b.maxTimestamp) return 1;
	if (a.maxTimestamp > b.maxTimestamp) return -1;
	return 0;
    });
    addNonViolentPlayers(sortedPlayers, () => {
	sortedPlayers.forEach((player, index) => {
	    player.rank = index + 1;
	});
	callback(sortedPlayers);
    });
}

function calculateRankings(lookbackSeconds, callback) {
    const cutoffTime = moment().subtract(lookbackSeconds, 'seconds').unix();
    const params = {
	TableName: 'scum-kills',
    };
    db.scan(params, (err, data) => {
	if (err) {
	    throw err;
	} else {
	    const playersById = {};
	    const killPairs = [];
	    data.Items.forEach((kill) => {
		if (kill.unixTime.N < cutoffTime) {
		    return;
		}
		const killer = playersById[kill.killerId.S] || {
		    deaths: 0,
		    id: kill.killerId.S,
		    kills: 0,
		    maxTimestamp: 0,
		};
		killer.kills += 1;
		if (kill.unixTime.N > killer.maxTimestamp) {
		    killer.name = kill.killerName.S;
		    killer.maxTimestamp = kill.unixTime.N;
		}
		playersById[killer.id] = killer;
		const victim = playersById[kill.victimId.S] || {
		    deaths: 0,
		    id: kill.victimId.S,
		    kills: 0,
		    maxTimestamp: 0,
		};
		victim.deaths += 1;
		if (kill.unixTime.N > victim.maxTimestamp) {
		    victim.name = kill.victimName.S;
		    victim.maxTimestamp = kill.unixTime.N;
		}
		playersById[victim.id] = victim;
		killPairs.push([killer.id, victim.id]);
	    });
	    bayeselo.calculateEloScores(
		killPairs,
		(eloScores) => {
		    Object.keys(eloScores).forEach((id) => {
			playersById[id].elo = eloScores[id];
		    });
		    sortPlayersByElo(playersById, callback);
		}, (error) => {
		    throw error;
		});
	}
    });
}

function updateScumUser(steamId, newName) {
    const params = {
	TableName: 'scum-users',
	Item: {
	    steamId: {S: steamId},
	    name: {S: newName},
	}
    };
    console.log(`Updating SCUM user with Steam ID ${steamId} (${newName}).`);
    db.putItem(params, (err, data) => {
	if (err) {
	    throw err;
	} else {
	    console.log('Great success.');
	}
    });
}

exports.putKill = putKill;
exports.getMaxKillTimestamp = getMaxKillTimestamp;
exports.calculateRankings = calculateRankings;
exports.updateScumUser = updateScumUser;
