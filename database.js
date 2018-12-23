const AWS = require('aws-sdk');

AWS.config.update({region: 'us-west-2'});
const db = new AWS.DynamoDB({apiVersion: '2012-10-08'});

function putKill(timestampAsMoment,
		 killerName, killerId, killerX, killerY, killerZ,
		 victimName, victimId, victimX, victimY, victimZ) {
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
	    killerX: {S: killerX.toString()},
	    killerY: {S: killerY.toString()},
	    killerZ: {S: killerZ.toString()},
	    victimName: {S: victimName.toString()},
	    victimId: {S: victimId.toString()},
	    victimX: {S: victimX.toString()},
	    victimY: {S: victimY.toString()},
	    victimZ: {S: victimZ.toString()},
	}
    };
    db.putItem(params, (err, data) => {
	if (err) {
	    throw err;
	}
    });
}

exports.putKill = putKill;
