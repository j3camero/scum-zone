const process = require('child_process');

// Makes the minimum score 1. Transforms the other scores by the same amount.
function normalizeEloScores(scores) {
    const m = Math.min(...Object.values(scores));
    const newScores = {};
    Object.keys(scores).forEach((key) => {
	newScores[key] = scores[key] - m + 1;
    });
    return newScores;
}

// Input: a list of pairs of player IDs. The winner is listed first, the
//        loser second. Ex: [['mdraper', 'jeff'], ['jeff', 'jesus']]
// Output: an object with the player IDs as keys and ELO scores as values.
//         Ex: {'mdraper': 223, 'jeff': 112, 'jesus': 1}
function calculateEloScores(gameOutcomes, success, failure) {
    const elo = process.spawn('bayeselo/bayeselo');
    const rawEloScores = {};
    const playerNames = [];
    elo.stdout.on('data', (data) => {
	const lines = data.toString().split(/\r?\n/);
	lines.forEach((line) => {
	    const match = line.trim().replace(/\s\s+/g, ' ').match(/(\d+) player(\d+) (-?\d+\.?\d*) (-?\d+\.?\d*) (-?\d+\.?\d*) (-?\d+\.?\d*) (-?\d+\.?\d*)\% (-?\d+\.?\d*) (-?\d+\.?\d*)\%/);
	    if (match) {
		const playerIndex = parseInt(match[2]);
		const playerId = playerNames[playerIndex];
		const eloScore = parseInt(match[3]);
		rawEloScores[playerId] = eloScore;
	    }
	});
    });
    elo.stderr.on('data', (data) => {
	failure(data);
    });
    elo.on('close', (code) => {
	if (code === 0) {
	    const normalizedEloScores = normalizeEloScores(rawEloScores);
	    success(normalizedEloScores);
	} else {
	    failure(`bayeselo process failed with return code ${code}.`);
	}
    });
    elo.stdin.setEncoding = 'utf-8';
    gameOutcomes.forEach((game) => {
	const winner = game[0];
	if (playerNames.indexOf(winner) < 0) {
	    elo.stdin.write(`addplayer player${playerNames.length}\n`);
	    playerNames.push(winner);
	}
	const winnerIndex = playerNames.indexOf(winner);
	const loser = game[1];
	if (playerNames.indexOf(loser) < 0) {
	    elo.stdin.write(`addplayer player${playerNames.length}\n`);
	    playerNames.push(loser);
	}
	const loserIndex = playerNames.indexOf(loser);
	elo.stdin.write(`addresult ${winnerIndex} ${loserIndex} 2\n`);
    });
    elo.stdin.write('elo\n');
    elo.stdin.write('advantage 0\n');
    elo.stdin.write('mm\n');
    elo.stdin.write('ratings\n');
    elo.stdin.end();
}

exports.calculateEloScores = calculateEloScores;
