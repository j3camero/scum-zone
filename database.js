const AWS = require('aws-sdk');

AWS.config.update({region: 'us-west-2'});
const db = new AWS.DynamoDB({apiVersion: '2012-10-08'});

function putKill(data, verbose) {
    const killId = `K${killerId}V${victimId}T${unixTime}`;
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

exports.putKill = putKill;
exports.getMaxKillTimestamp = getMaxKillTimestamp;
