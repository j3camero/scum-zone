const AWS = require('aws-sdk');

AWS.config.update({region: 'us-west-2'});
const db = new AWS.DynamoDB({apiVersion: '2012-10-08'});

function putKill(timestampAsMoment,
		 killerName, killerId,
		 victimName, victimId, verbose) {
    const formattedTime = timestampAsMoment.format('YYYY-MM-DD HH:mm:ss');
    const unixTime = timestampAsMoment.unix();
    const killId = `K${killerId}V${victimId}T${unixTime}`;
    const params = {
	TableName: 'scum-kills',
	Item: {
	    killId: {S: killId},
	    unixTime: {N: unixTime.toString()},
	    formattedTime: {S: formattedTime},
	    killerName: {S: killerName},
	    killerId: {S: killerId.toString()},
	    victimName: {S: victimName.toString()},
	    victimId: {S: victimId.toString()},
	}
    };
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
