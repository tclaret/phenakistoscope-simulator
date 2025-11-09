// phenakistoscope.js
// Separated JS for the simulator. Make sure this file is saved next to index.html.

window.onload = function() {
  console.log("Phenakistoscope v3 (separated JS) starting...");

  // All images from your images/ folder (use exactly these filenames)
  const imageFiles = [
    "a_cheval.png",
    "AEO175939_PhenakistoscopeGiroux60.jpg",
    "AEO185553_PhenakistiscopeDisc_ManInBlueAndRed.jpg",
    "Dancing.jpg",
    "Gernamy_1949_R_Balzer.png",
    "Jongleur.png",
    "McLean_1.png",
    "medium_1990_5036_3369.jpg",
    "medium_a001813b.jpg",
    "phenakistoscope-4.gif",
    "tumblr_oc1czn99ZM1r9jbwno1_500.png",
    "tumblr_oc1d3skVsF1r9jbwno1_500.png",
    "tumblr_oc1d4wZeB81r9jbwno1_500.png",
    "tumblr_oc1d6377G91r9jbwno1_500.png",
    "tumblr_oc1d7io0Kp1r9jbwno1_500.png",
    "tumblr_oc1da70gPN1r9jbwno1_500.png",
    "WomanChoppingTree.jpg"
  ];

  // DOM refs
  const discSelect = document.getElementById('discSelect');
  const thumbnail = document.getElementById('thumbnail');
  const fileInput = document.getElementById('fileInput');
  const imageUrl = document.getElementById('imageUrl');
  const loadUrl = document.getElementById('loadUrl');
  const viewModeSel = document.getElementById('viewMode');
  const startStop = document.getElementById('startStop');
  const reverseBtn = document.getElementById('reverseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const indicator = document.getElementById('indicator');
  const speedSlider = document.getElementById('speed');
  const speedValue = document.getElementById('speedValue');
  // Lignes pour 'lightSlider' et 'lightValue' retirées
  const toggleInset = document.getElementById('toggleInset');
  const insetDiv = document.getElementById('inset');
  const spinner = document.getElementById('spinner');
  const status = document.getElementById('status');
  // Ligne pour 'glow' retirée

  // NEW slit controls
  const slitsSlider = document.getElementById('slits');
  const slitsValue = document.getElementById('slitsValue');
  const slitLenSlider = document.getElementById('slitLen');
  const slitLenValue = document.getElementById('slitLenValue');

  const canvas = document.getElementById('viewCanvas');
  const ctx = canvas.getContext('2d');
  const insetCanvas = document.getElementById('insetCanvas');
  const insetCtx = insetCanvas.getContext('2d');

  // state
  let discImage = new Image();
  let backgroundFrame = new Image();

  // image transform state
  let imageZoom = 1;
  let panX = 0;
  let panY = 0;
  let lastPanX = 0;
  let lastPanY = 0;

  let viewMode = 'simulation';
  let isRunning = false;
  let rotation = 0;
  let rotationVelocity = 0;   // actual angular velocity (radians/frame)
  let rotationSpeed = parseFloat(speedSlider.value); // base speed used for auto-run
  let showInset = false;
  let autoStopTimer = null;
  let glowIntensity = 0; // Initialisé à 0 car la lumière est supprimée.

  // slit state
  let slitCount = parseInt(slitsSlider.value || 12);
  let slitLengthDeg = parseInt(slitLenSlider.value || 10);

  // drag spin variables
  let isDragging = false;
  let lastPointerAngle = 0;
  let lastPointerTime = 0;
  let pointerVelSamples = []; // recent samples of angular velocity

  // helpers
  function pathFor(filename){ return "images/" + filename; }

  function populateDropdown(){
    discSelect.innerHTML = '';
    imageFiles.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f; opt.textContent = f;
      discSelect.appendChild(opt);
    });
    // default first
    discSelect.selectedIndex = 0;
    loadSelectedDisc();
  }

  function showSpinner(on){ spinner.classList.toggle('visible', !!on); }

  function updateThumbnail(src){
    thumbnail.style.opacity = 0;
    thumbnail.onload = () => { thumbnail.style.opacity = 1; };
    thumbnail.src = src;
  }

  // load from images/ folder (photo mode default)
  function loadSelectedDisc(){
    const f = discSelect.value;
    if(!f) return;
    const p = pathFor(f);
    showSpinner(true);
    const img = new Image();
    img.onload = () => {
      discImage = img;
      updateThumbnail(p);
      status.textContent = "Loaded " + f;
      showSpinner(false);
      console.log("Loaded", p);
    };
    img.onerror = (e) => {
      status.textContent = "Error loading " + f;
      showSpinner(false);
      console.error("Error loading image", p, e);
    };
    img.src = p;
  }

  // local upload via FileReader -> base64 data URL
  fileInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    showSpinner(true);
    status.textContent = "Loading local file...";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        discImage = img;
        updateThumbnail(ev.target.result);
        status.textContent = "Loaded local " + f.name;
        showSpinner(false);
        console.log("Local loaded", f.name);
      };
      img.onerror = () => { status.textContent = "Failed to load local file"; showSpinner(false); };
      img.src = ev.target.result;
    };
    reader.onerror = () => { status.textContent = "File read error"; showSpinner(false); };
    reader.readAsDataURL(f);
  });

  // load by URL
  loadUrl.addEventListener('click', ()=>{
    const url = imageUrl.value.trim();
    if(!url) { status.textContent = "Enter image URL"; return; }
    showSpinner(true); status.textContent = "Loading URL...";
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      discImage = img;
      updateThumbnail(url);
      status.textContent = "Loaded from URL";
      showSpinner(false);
    };
    img.onerror = (e) => { status.textContent = "Failed to load URL (CORS?)"; showSpinner(false); console.error(e); };
    img.src = url;
  });

  // view change
  viewModeSel.addEventListener('change', (e) => {
    viewMode = e.target.value;
    status.textContent = "View: " + viewMode;
  });

  // start/stop toggle
  startStop.addEventListener('click', ()=>{
    isRunning = !isRunning;
    indicator.classList.toggle('on', isRunning);
    startStop.textContent = isRunning ? "⏸ Pause" : "▶️ Start";
    status.textContent = isRunning ? "Playing" : "Paused";
    if(!isRunning && autoStopTimer){ clearTimeout(autoStopTimer); autoStopTimer = null; }
  });

  // reverse spin
  reverseBtn.addEventListener('click', ()=>{
    rotationVelocity = -rotationVelocity;
    status.textContent = "Direction reversed";
  });

  // reset
  resetBtn.addEventListener('click', ()=>{
    rotation = 0; rotationVelocity = 0; status.textContent = "Reset";
  });

  // speed slider
  speedSlider.addEventListener('input', (e)=>{
    rotationSpeed = parseFloat(e.target.value);
    speedValue.textContent = rotationSpeed.toFixed(3);
  });

  // light slider (bloc supprimé)

  // slit sliders listeners (NEW)
  slitsSlider.addEventListener('input', (e) => {
    slitCount = parseInt(e.target.value, 10);
    slitsValue.textContent = slitCount;
  });
  slitLenSlider.addEventListener('input', (e) => {
    slitLengthDeg = parseInt(e.target.value, 10);
    slitLenValue.textContent = slitLengthDeg + "°";
  });

  // toggle inset
  toggleInset.addEventListener('click', ()=>{
    showInset = !showInset;
    insetDiv.style.display = showInset ? 'block' : 'none';
    toggleInset.textContent = showInset ? "Hide Inset" : "Show Inset";
  });

  // dropdown change
  discSelect.addEventListener('change', loadSelectedDisc);

  // resize canvas for DPR and responsiveness
  function resizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(Math.max(400, rect.width), 900);
    canvas.width = Math.floor(size * dpr);
    canvas.height = canvas.width;
    // inset
    const irect = insetCanvas.getBoundingClientRect();
    insetCanvas.width = Math.floor(irect.width * dpr);
    insetCanvas.height = Math.floor(irect.height * dpr);
  }
  window.addEventListener('resize', resizeCanvas);

  // draw glow (fonction supprimée)

  // draw photo mode (circular disc)
  function drawPhoto(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cx = canvas.width/2, cy = canvas.height/2;
    const r = canvas.width * 0.42;
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    if(backgroundFrame.complete && backgroundFrame.naturalWidth>0){
      ctx.save();
      ctx.globalAlpha = 0.06;
      const s = (canvas.width*1.0)/backgroundFrame.naturalWidth;
      const bw = backgroundFrame.naturalWidth * s, bh = backgroundFrame.naturalHeight * s;
      ctx.drawImage(backgroundFrame, cx - bw/2, cy - bh/2, bw, bh);
      ctx.restore();
    }

    ctx.beginPath(); ctx.arc(cx, cy + r*0.06, r*1.02, 0, Math.PI*2); ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fill();

    if(discImage && discImage.complete && discImage.naturalWidth>0){
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.closePath(); ctx.clip();
      ctx.translate(cx, cy); ctx.rotate(rotation);
      const s = Math.max((r*2)/discImage.width, (r*2)/discImage.height) * imageZoom;
      const iw = discImage.width * s, ih = discImage.height * s;
      ctx.drawImage(discImage, -iw/2 + panX * s, -ih/2 + panY * s, iw, ih); ctx.restore();
    }

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.lineWidth = Math.max(6, canvas.width*0.008); ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.stroke();

    // holes ring (decorative)
    const holes = 24;
    const holeR = Math.max(4, canvas.width*0.006);
    for(let i=0;i<holes;i++){
      const a = i * (Math.PI*2/holes) + rotation;
      const hx = cx + Math.cos(a)*(r*0.92), hy = cy + Math.sin(a)*(r*0.92);
      ctx.beginPath(); ctx.arc(hx,hy,holeR,0,Math.PI*2); ctx.fillStyle="rgba(0,0,0,0.65)"; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.stroke();
    }

    ctx.beginPath(); ctx.arc(cx,cy,Math.max(6,canvas.width*0.01),0,Math.PI*2); ctx.fillStyle="#222"; ctx.fill();
    ctx.lineWidth=2; ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.stroke();

    const g = ctx.createRadialGradient(cx,cy,r*0.2,cx,cy,r*1.1); g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,0.45)");
    ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // simulation mode: flat spinning with slit mask using slitCount & slitLengthDeg
  function drawSimulation(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cx = canvas.width/2, cy = canvas.height/2;
    ctx.fillStyle = "#070b10"; ctx.fillRect(0,0,canvas.width,canvas.height);

    if(discImage && discImage.complete && discImage.naturalWidth>0){
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(rotation);
      const s = Math.min((canvas.width*0.9)/discImage.width,(canvas.height*0.9)/discImage.height) * imageZoom;
      const iw = discImage.width*s, ih = discImage.height*s; ctx.drawImage(discImage,-iw/2 + panX * s,-ih/2 + panY * s,iw,ih); ctx.restore();
    }

    // dynamic slits from sliders
    const slits = slitCount || 12;
    const slitW = (slitLengthDeg || 10) * Math.PI/180;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(-rotation);
    ctx.globalCompositeOperation = "destination-in"; ctx.beginPath();
    for(let i=0;i<slits;i++){
      const a = i*(2*Math.PI/slits)-slitW/2;
      ctx.moveTo(0,0);
      ctx.arc(0,0,Math.max(canvas.width,canvas.height),a,a+slitW);
    }
    ctx.fillStyle="#fff"; ctx.fill(); ctx.restore();
  }

  // inset draw
  function drawInset(){
    insetCtx.clearRect(0,0,insetCanvas.width,insetCanvas.height);
    if(!showInset) return;
    insetCtx.save(); insetCtx.translate(insetCanvas.width/2,insetCanvas.height/2); insetCtx.rotate(rotation);
    if(discImage && discImage.complete && discImage.naturalWidth>0){
      const s = Math.max(insetCanvas.width/discImage.width, insetCanvas.height/discImage.height);
      const iw = discImage.width*s, ih = discImage.height*s; insetCtx.drawImage(discImage,-iw/2,-ih/2,iw,ih);
    }
    insetCtx.restore();
    insetCtx.beginPath(); insetCtx.arc(insetCanvas.width/2,insetCanvas.height/2,insetCanvas.width/2 - 2,0,Math.PI*2); insetCtx.lineWidth = 3; insetCtx.strokeStyle="rgba(255,255,255,0.06)"; insetCtx.stroke();
  }

  // main render loop
  function render(){
    // Lignes de glow supprimées

    if(viewMode === 'simulation') drawSimulation();
    else if(viewMode === 'photo') drawPhoto();

    drawInset();
    requestAnimationFrame(render);
  }

  // physics: update rotation by velocity; apply friction when not driven
  function physicsStep(){
    if(isRunning && Math.abs(rotationVelocity) < Math.abs(rotationSpeed*1.2)){
      const target = rotationSpeed * Math.sign(rotationVelocity || 1);
      rotationVelocity += (target - rotationVelocity) * 0.03;
    }
    rotation += rotationVelocity;
    // Amélioration de la friction pour une meilleure sensation de spin au doigt
    rotationVelocity *= isDragging ? 0.998 : 0.99;
    if(Math.abs(rotationVelocity) < 0.000001) rotationVelocity = 0;
    requestAnimationFrame(physicsStep);
  }

  // pointer helpers
  function pointerAngle(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    return Math.atan2(clientY - cy, clientX - cx);
  }

  function onPointerDown(e){
    isDragging = true;
    pointerVelSamples = [];
    lastPointerAngle = pointerAngle(e.clientX, e.clientY);
    lastPointerTime = performance.now();
    try { canvas.setPointerCapture(e.pointerId); } catch(e){}
  }
  function onPointerMove(e){
    if(!isDragging) return;
    const now = performance.now();
    const angle = pointerAngle(e.clientX, e.clientY);
    let delta = angle - lastPointerAngle;
    while(delta > Math.PI) delta -= 2*Math.PI;
    while(delta < -Math.PI) delta += 2*Math.PI;
    rotation += delta;
    const dt = Math.max(1, now - lastPointerTime);
    pointerVelSamples.push({v: delta / (dt/16.6667), t: now});
    if(pointerVelSamples.length > 6) pointerVelSamples.shift();
    lastPointerAngle = angle;
    lastPointerTime = now;
  }
  function onPointerUp(e){
    if(!isDragging) return;
    isDragging = false;
    if(pointerVelSamples.length){
      let sum=0, weight=0;
      for(let i=0;i<pointerVelSamples.length;i++){
        const age = (performance.now() - pointerVelSamples[i].t)/1000;
        const w = Math.max(0.1, 1 - age*2);
        sum += pointerVelSamples[i].v * w;
        weight += w;
      }
      let est = weight? sum/weight : 0;
      // Multiplicateur pour l'impulsion initiale
      rotationVelocity = est * (Math.max(0.5, rotationSpeed*25));
    }
    pointerVelSamples = [];
  }

  // events
  // Les événements 'pointer' gèrent nativement le toucher et la souris, y compris sur Android.
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);

  // Zoom controls (slider + wheel + touch pinch)
  const zoomSlider = document.getElementById('zoom');
  const zoomValue = document.getElementById('zoomValue');
  let lastPinchDist = 0;
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => {
      imageZoom = parseFloat(e.target.value);
      if (zoomValue) zoomValue.textContent = imageZoom.toFixed(2) + '×';
      status.textContent = `Zoom: ${imageZoom.toFixed(2)}`;
    });
  }

  // mouse wheel zoom (use Ctrl or when in photo view)
  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey || viewMode === 'photo') {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.07 : 0.93;
      imageZoom = Math.max(0.2, Math.min(5, imageZoom * delta));
      if (zoomSlider) zoomSlider.value = imageZoom;
      if (zoomValue) zoomValue.textContent = imageZoom.toFixed(2) + '×';
      status.textContent = `Zoom: ${imageZoom.toFixed(2)}`;
    }
  }, { passive: false });

  // Enhanced touch gesture handlers
  let lastTouchCenter = null;
  let lastTouchAngle = null;
  let initialPanOffset = null;
  
  function getTouchCenter(t0, t1) {
    return {
      x: (t0.clientX + t1.clientX) / 2,
      y: (t0.clientY + t1.clientY) / 2
    };
  }

  function getTouchAngle(t0, t1) {
    return Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
  }

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      // Single touch for panning when zoomed
      if (imageZoom > 1) {
        const touch = e.touches[0];
        lastPanX = touch.clientX;
        lastPanY = touch.clientY;
        initialPanOffset = { x: panX, y: panY };
      }
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const t0 = e.touches[0], t1 = e.touches[1];
      
      // Initialize pinch-zoom
      lastPinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      lastTouchCenter = getTouchCenter(t0, t1);
      lastTouchAngle = getTouchAngle(t0, t1);
      
      // Remember initial pan offset for relative adjustments
      initialPanOffset = { x: panX, y: panY };
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && imageZoom > 1) {
      // Pan with single touch when zoomed
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - lastPanX;
      const dy = touch.clientY - lastPanY;
      
      // Scale pan by zoom level for consistent feel
      panX = initialPanOffset.x + dx / imageZoom;
      panY = initialPanOffset.y + dy / imageZoom;
      
      // Limit pan range based on zoom level
      const maxPan = (imageZoom - 1) * canvas.width / 4;
      panX = Math.max(-maxPan, Math.min(maxPan, panX));
      panY = Math.max(-maxPan, Math.min(maxPan, panY));
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const t0 = e.touches[0], t1 = e.touches[1];
      const center = getTouchCenter(t0, t1);
      const pinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const touchAngle = getTouchAngle(t0, t1);
      
      // Handle pinch-zoom with proper center point
      if (lastPinchDist && lastTouchCenter) {
        const zoomChange = pinchDist / lastPinchDist;
        const prevZoom = imageZoom;
        imageZoom = Math.max(0.2, Math.min(5, imageZoom * zoomChange));
        
        // Adjust pan to maintain center point
        if (prevZoom !== imageZoom) {
          const rect = canvas.getBoundingClientRect();
          const cx = (center.x - rect.left) / rect.width - 0.5;
          const cy = (center.y - rect.top) / rect.height - 0.5;
          panX += cx * (1/prevZoom - 1/imageZoom) * canvas.width;
          panY += cy * (1/prevZoom - 1/imageZoom) * canvas.height;
        }
        
        // Update zoom UI
        if (zoomSlider) zoomSlider.value = imageZoom;
        if (zoomValue) zoomValue.textContent = imageZoom.toFixed(2) + '×';
      }
      
      // Handle rotation gesture for speed control
      if (lastTouchAngle !== null) {
        const angleDelta = touchAngle - lastTouchAngle;
        const speedDelta = angleDelta * 0.02; // Scale factor for smooth control
        rotationSpeed = Math.max(0.001, Math.min(0.12, rotationSpeed + speedDelta));
        speedSlider.value = rotationSpeed;
        speedValue.textContent = rotationSpeed.toFixed(3);
      }
      
      lastPinchDist = pinchDist;
      lastTouchCenter = center;
      lastTouchAngle = touchAngle;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      lastPinchDist = null;
      lastTouchCenter = null;
      lastTouchAngle = null;
      initialPanOffset = null;
    } else if (e.touches.length === 1) {
      // Reset two-finger gesture state but keep panning state
      lastPinchDist = null;
      lastTouchCenter = null;
      lastTouchAngle = null;
      const touch = e.touches[0];
      lastPanX = touch.clientX;
      lastPanY = touch.clientY;
      initialPanOffset = { x: panX, y: panY };
    }
  }, { passive: true });

  // auto-start 2 minutes
  function startAuto(duration=120000){
    if(!isRunning){
      isRunning = true; indicator.classList.add('on'); startStop.textContent="⏸ Pause"; status.textContent="Auto-play";
      rotationVelocity = rotationSpeed;
    }
    if(autoStopTimer) clearTimeout(autoStopTimer);
    autoStopTimer = setTimeout(()=>{
      isRunning = false; indicator.classList.remove('on'); startStop.textContent="▶️ Start"; status.textContent="Auto-play finished";
      autoStopTimer = null;
    }, duration);
  }

  // initial setup
  populateDropdown();
  resizeCanvas();
  render();
  physicsStep();
  startAuto(120000);

  // expose some console debugging
  console.log("Ready. Images:", imageFiles.length, "Default:", discSelect.value);

  document.addEventListener('visibilitychange', () => { if(document.visibilityState==='visible') resizeCanvas(); });
};
