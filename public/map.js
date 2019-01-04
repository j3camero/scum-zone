
function drawMapWithCircleZone(canvas, zoneX, zoneY, zoneRadius) {
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

function drawZoomedMapWithCircleZone(canvas, zoneX, zoneY, zoneRadius,
				     viewSizeInMeters, aspectRatio,
				     lineWidth) {
    const context = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = w * aspectRatio;
    canvas.width = w;
    canvas.height = h;
    const mapSize = 12000;
    const scumMap = new Image();
    scumMap.onload = () => {
	const v = viewSizeInMeters / 2;
	const vh = v * aspectRatio;
	// Transform the coords into positive quadrant.
	zoneX = mapSize / 2 - zoneX;
	zoneY = mapSize / 2 - zoneY;
	const centerX = Math.min(Math.max(zoneX, v), mapSize - v);
	const centerY = Math.min(Math.max(zoneY, vh), mapSize - vh);
	const px = scumMap.width * (centerX - v) / mapSize;
	const py = scumMap.height * (centerY - vh) / mapSize;
	const pw = scumMap.width * viewSizeInMeters / mapSize;
	const ph = scumMap.height * aspectRatio * viewSizeInMeters / mapSize;
	context.drawImage(scumMap, px, py, pw, ph, 0, 0, w, h);
	context.beginPath();
	context.fillStyle = 'rgba(255, 58, 133, 0.25)';
	context.strokeStyle = 'rgb(255, 58, 133)';
	context.lineWidth = lineWidth;
	const x = (zoneX - centerX) / viewSizeInMeters * w + (w / 2);
	const y = (zoneY - centerY) / viewSizeInMeters * w + (h / 2);
	const radius = zoneRadius / viewSizeInMeters * w;
	context.arc(x, y, radius, 0, 2 * Math.PI);
	context.fill();
	context.stroke();
    };
    scumMap.src = '/map.jpg';
}

function main() {
    const bigMap = document.getElementById('bigmap');
    if (bigMap) {
	drawMapWithCircleZone(bigMap, -400, -4900, 500);
    }
    const smallMap = document.getElementById('smallmap');
    if (smallMap) {
	drawZoomedMapWithCircleZone(smallMap, -400, -4900, 500, 2000, 1, 5);
    }
    const homeMap = document.getElementById('homemap');
    if (homeMap) {
	drawZoomedMapWithCircleZone(homeMap, -400, -4900, 500, 9000, 0.618, 2);
    }
}

// Self-executing function that runs after the DOM loads.
(function() {
    // The DOM is available here. It's safe to start doing stuff.
    main();
})();
