
function drawMapWithCircleZone(canvasId, zoneX, zoneY, zoneRadius) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientWidth;
    const scumMap = new Image();
    scumMap.onload = () => {
	context.drawImage(scumMap, 0, 0, canvas.width, canvas.height);
	context.beginPath();
	context.fillStyle = 'rgba(255, 58, 133, 0.25)';
	context.strokeStyle = 'rgb(255, 58, 133)';
	context.lineWidth = 2;
	const x = (6000 - zoneX) / 12000 * canvas.width;
	const y = (6000 - zoneY) / 12000 * canvas.height;
	const radius = zoneRadius / 12000 * canvas.width;
	context.arc(x, y, radius, 0, 2 * Math.PI);
	context.fill();
	context.stroke();
    };
    scumMap.src = '/map.jpg';
}

function drawZoomedMapWithCircleZone(canvasId, zoneX, zoneY, zoneRadius,
				     viewSizeInMeters) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');
    const w = canvas.clientWidth;
    canvas.width = w;
    canvas.height = w;
    const mapSize = 12000;
    const scumMap = new Image();
    scumMap.onload = () => {
	const v = viewSizeInMeters / 2;
	// Transform the coords into positive quadrant.
	zoneX = mapSize / 2 - zoneX;
	zoneY = mapSize / 2 - zoneY;
	const centerX = Math.min(Math.max(zoneX, v), mapSize - v);
	const centerY = Math.min(Math.max(zoneY, v), mapSize - v);
	const px = scumMap.width * (centerX - v) / mapSize;
	const py = scumMap.height * (centerY - v) / mapSize;
	const pw = scumMap.width * viewSizeInMeters / mapSize;
	console.log(centerX, centerY, px, py, pw);
	context.drawImage(scumMap, px, py, pw, pw, 0, 0, w, w);
	context.beginPath();
	context.fillStyle = 'rgba(255, 58, 133, 0.25)';
	context.strokeStyle = 'rgb(255, 58, 133)';
	context.lineWidth = 5;
	const x = (zoneX - centerX) / viewSizeInMeters * w + (w / 2);
	const y = (zoneY - centerY) / viewSizeInMeters * w + (w / 2);
	const radius = zoneRadius / viewSizeInMeters * w;
	context.arc(x, y, radius, 0, 2 * Math.PI);
	context.fill();
	context.stroke();
    };
    scumMap.src = '/map.jpg';
    
}

function main() {
    drawMapWithCircleZone('bigmap', -400, -4900, 500);
    drawZoomedMapWithCircleZone('smallmap', -400, -4900, 500, 2000);
}

// Self-executing function that runs after the DOM loads.
(function() {
    // The DOM is available here. It's safe to start doing stuff.
    main();
})();
