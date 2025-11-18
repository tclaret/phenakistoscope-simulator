<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Interactive Turning Vinyl</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #333;
            /* Prevents image from being highlighted on drag */
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }

        h1 {
            position: absolute;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 30px;
            transition: all 0.5s;
        }

        img {
            position: absolute;
            display: block;
            width: 600px;
            height: 600px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(0deg);
            /* Initial fast transition for smooth dragging */
            transition: 0.05s linear; 
            border-radius: 50%;
            cursor: grab; /* Indicates it's draggable */
        }
    </style>
</head>

<body>
    <h1>Drag the Vinyl to Spin! Double-Click/Tap to Stop.</h1>
    <img id="vinyl" src="img/DISC.png" alt="Disque">

</body>
<script>
    const vinyl = document.getElementById("vinyl");
    const napis = document.querySelector("h1");

    let isDragging = false;
    let startAngle = 0;
    let currentRotation = 0;
    let lastRotation = 0; // New variable to track rotation for speed calculation
    let center = { x: 0, y: 0 };
    let rotationSpeed = 0;
    let stopRotationInterval;

    // --- Utility Functions ---

    function getAngle(x, y) {
        return Math.atan2(y - center.y, x - center.x) * (180 / Math.PI);
    }

    function updateCenter() {
        const rect = vinyl.getBoundingClientRect();
        center.x = rect.left + rect.width / 2;
        center.y = rect.top + rect.height / 2;
    }

    function applyRotation(angle) {
        vinyl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        currentRotation = angle;
    }

    // --- Event Handlers ---

    function startTurn(e) {
        e.preventDefault();
        clearInterval(stopRotationInterval);
        vinyl.style.transition = '0.05s linear';
        
        isDragging = true;
        updateCenter();

        const eventX = e.clientX || e.touches[0].clientX;
        const eventY = e.clientY || e.touches[0].clientY;
        
        const pointAngle = getAngle(eventX, eventY);
        
        startAngle = currentRotation - pointAngle;
        lastRotation = currentRotation; // Initialize last rotation for speed tracking

        window.addEventListener('mousemove', rotate);
        window.addEventListener('mouseup', endTurn);
        window.addEventListener('touchmove', rotate);
        window.addEventListener('touchend', endTurn);
        
        napis.textContent = "Scratching...";
    }

    function rotate(e) {
        if (!isDragging) return;

        const eventX = e.clientX || e.touches[0].clientX;
        const eventY = e.clientY || e.touches[0].clientY;
        
        const newAngle = getAngle(eventX, eventY);
        let newRotation = startAngle + newAngle;

        // Calculate rotation speed based on the change in rotation
        rotationSpeed = newRotation - lastRotation;
        lastRotation = newRotation; // Update last rotation
        
        applyRotation(newRotation);
    }

    function endTurn() {
        if (!isDragging) return;

        isDragging = false;
        
        window.removeEventListener('mousemove', rotate);
        window.removeEventListener('mouseup', endTurn);
        window.removeEventListener('touchmove', rotate);
        window.removeEventListener('touchend', endTurn);
        
        // Start coasting if speed is significant (allowing fast scratch release)
        if (Math.abs(rotationSpeed) > 0.1) { 
            startDeceleration();
        } else {
            napis.textContent = "Drag the Vinyl to Scratch! Double-Click/Tap to Stop.";
        }
    }

    function startDeceleration() {
        // DECELERATION CHANGE: Closer to 1.0 makes it spin much longer.
        const decelerationRate = 0.995; 
        vinyl.style.transition = '0s';

        // INTERVAL CHANGE: Faster update loop for smoother high-speed coasting.
        stopRotationInterval = setInterval(() => {
            currentRotation += rotationSpeed; 
            applyRotation(currentRotation);

            rotationSpeed *= decelerationRate; 

            // Stop when speed is very low
            if (Math.abs(rotationSpeed) < 0.01) { // Adjusted stop threshold
                clearInterval(stopRotationInterval);
                napis.textContent = "Stopped.";
            }
        }, 5); 
    }

    function stopRotation() {
        clearInterval(stopRotationInterval);
        rotationSpeed = 0;
        vinyl.style.transition = '0.2s ease-out';
        // Snap to nearest full rotation for a clean stop
        applyRotation(Math.round(currentRotation / 360) * 360); 
        napis.textContent = "Stopped by Double-Click/Tap!";
    }

    // --- Initial Event Listeners ---
    vinyl.addEventListener('mousedown', startTurn);
    vinyl.addEventListener('touchstart', startTurn);
    vinyl.addEventListener('dblclick', stopRotation);
    vinyl.addEventListener('touchend', (e) => {
        const now = new Date().getTime();
        const lastTouchTime = vinyl.lastTouchTime || 0;
        const delta = now - lastTouchTime;
        const doubleTapThreshold = 300; 

        if (delta > 0 && delta < doubleTapThreshold) {
            e.preventDefault(); 
            stopRotation();
        }
        vinyl.lastTouchTime = now;
    });

    // Initial setup for vinyl center
    window.addEventListener('resize', updateCenter);
    window.addEventListener('load', updateCenter);
</script>
</html>
