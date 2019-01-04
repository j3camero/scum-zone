
function main() {
    const bigCanvas = document.getElementById('bigmap');
    const bigContext = bigCanvas.getContext('2d');
    bigCanvas.width = bigCanvas.clientWidth;
    bigCanvas.height = bigCanvas.clientWidth;
    const scumMap = new Image();
    scumMap.onload = () => {
	bigContext.drawImage(scumMap, 0, 0, bigCanvas.width, bigCanvas.height);
	bigContext.beginPath();
	const color = '#D16014';
	bigContext.fillStyle = 'rgba(255, 58, 133, 0.25)';
	bigContext.strokeStyle = 'rgb(255, 58, 133)';
	bigContext.lineWidth = 2;
	const x = (6000 - (-375)) / 12000 * bigCanvas.width;
	const y = (6000 - (-4870)) / 12000 * bigCanvas.height;
	const radius = 500 / 12000 * bigCanvas.width;
	bigContext.arc(x, y, radius, 0, 2 * Math.PI);
	bigContext.fill();
	bigContext.stroke();
    };
    scumMap.src = '/map.jpg';
    const smallCanvas = document.getElementById('smallmap');
}

// Self-executing function that runs after the DOM loads.
(function() {
    // The DOM is available here. It's safe to start doing stuff.
    main();
})();
