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
  const lightSlider = document.getElementById('light');
  const lightValue = document.getElementById('lightValue');
  const toggleInset = document.getElementById('toggleInset');
  const insetDiv = document.getElementById('inset');
  const spinner = document.getElementById('spinner');
  const status = document.getElementById('status');
  const glow = document.getElementById('glow');

  // slit controls
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
  backgroundFrame.src = "images/frame_2.png";

  let viewMode = 'simulation'; // DÉFAUT MAINTENANT SUR 'simulation'
  let isRunning = false;
  let rotation = 0;
  let rotationVelocity = 0;   // actual angular velocity (radians/frame)
  let rotationSpeed = parseFloat(speedSlider.value); // base speed used for auto-run
  let showInset = true; // DÉFAUT À VRAI pour montrer la loupe
  let autoStopTimer = null;
  let glowIntensity = parseFloat(lightSlider.value);

  // NOUVEAU: Offset pour le centrage de l'image
  let offsetX = 0;
  let offsetY = 0;

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
    // Sélectionner 'simulation' par défaut dans le HTML
    viewModeSel.value = 'simulation';
    // Afficher l'incrustation par défaut
    insetDiv.style.display = showInset ? 'block' : 'none';
    toggleInset.textContent = showInset ? "Hide Inset" : "Show Inset";
  }

  function showSpinner(on){ spinner.classList.toggle('visible', !!on); }

  function updateThumbnail(src){
    thumbnail.style.opacity = 0;
    thumbnail.onload = () => { thumbnail.style.opacity = 1; };
    thumbnail.src = src;
  }

  // Centrage automatique (méthode simple)
  function centerDisc() {
    if (!discImage || !discImage.width) {
      resetDiscOffset();
      return;
    }
    // L'offset est calculé pour aligner le centre de l'image (width/2, height/2) avec (0,0) après translation du canvas
    offsetX = -(discImage.width * 0.5);
    offsetY = -(discImage.height * 0.5);

    status.textContent = `Centrage ajusté (dx: ${offsetX.toFixed(0)}, dy: ${offsetY.toFixed(0)})`;
  }

  function resetDiscOffset() {
    offsetX = 0;
    offsetY = 0;
    status.textContent = "Centrage réinitialisé (offset 0)";
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
      centerDisc(); // Centrer après le chargement
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
        centerDisc(); // Centrer après le chargement
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
      centerDisc(); // Centrer après le chargement
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

  // light slider
  lightSlider.addEventListener('input', (e)=>{
    glowIntensity = parseFloat(e.target.value);
    lightValue.textContent = glowIntensity.toFixed(2);
  });

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
    insetCanvas.height = insetCanvas.width; // Force carré
  }
  window.addEventListener('resize', resizeCanvas);

  // draw glow
  function drawGlow(opacity){
    const el = glow;
    const size = Math.min(canvas.width, canvas.height) + 80;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width/2 - size/2;
    const cy = rect.top + rect.height/2 - size/2;
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    el.style.background = `radial-gradient(circle, rgba(110,231,183,${0.25*opacity}) 0%, rgba(110,231,183,${0.02*opacity}) 35%, rgba(0,0,0,0) 65%)`;
    el.style.opacity = opacity>0.01 ? Math.min(1, opacity) : 0;
  }

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
      const s = Math.max((r*2)/discImage.width, (r*2)/discImage.height);
      const iw = discImage.width * s, ih = discImage.height * s;

      // APPLIQUER L'OFFSET
      ctx.drawImage(discImage, offsetX, offsetY, iw, ih);

      ctx.restore();
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

  // Simulation mode: dessine l'image avec une rotation compensée pour créer la persistance de vision.
  function drawSimulation(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cx = canvas.width/2, cy = canvas.height/2;
    ctx.fillStyle = "#070b10"; ctx.fillRect(0,0,canvas.width,canvas.height);

    if(discImage && discImage.complete && discImage.naturalWidth>0){

        const slits = slitCount || 12;
        // Angle de rotation par segment (en radians)
        const rotationPerSegment = (2 * Math.PI / slits);

        // Calculer l'index de l'image (frame) actuellement visible.
        let frameIndex = Math.floor(rotation / rotationPerSegment);

        // Rotation COMPENSÉE
        const compensatedRotation = rotation - (frameIndex * rotationPerSegment);

        // --- Rendu de l'image (légèrement tournante, mais synchronisée) ---
        ctx.save();
        ctx.translate(cx, cy);

        // APPLIQUER LA ROTATION COMPENSÉE.
        ctx.rotate(compensatedRotation);

        const s = Math.min((canvas.width*0.9)/discImage.width,(canvas.height*0.9)/discImage.height);
        const iw = discImage.width*s, ih = discImage.height*s;

        // APPLIQUER L'OFFSET
        ctx.drawImage(discImage, offsetX, offsetY, iw, ih);

        ctx.restore();
    }
  }


  // --- FONCTION INSET MODIFIÉE : ZOOM SUR LE SEGMENT ---
  function drawInset(){
    insetCtx.clearRect(0,0,insetCanvas.width,insetCanvas.height);
    if(!showInset || !discImage || !discImage.complete) return;

    const slits = slitCount || 12;
    const rotationPerSegment = (2 * Math.PI / slits);
    const frameIndex = Math.floor(rotation / rotationPerSegment);
    const iw = discImage.width;
    const ih = discImage.height;

    // 1. Déterminer la zone (segment) à zoomer sur l'image source (discImage)
    // Nous supposons que les segments sont répartis autour du centre de l'image.
    // Pour simplifier, nous allons zoomer sur la zone du segment actuellement "visible"
    // qui correspond à l'angle 0 (ou 3 heures).

    // Calculer l'angle où se trouve le segment "frameIndex"
    const segmentAngle = frameIndex * rotationPerSegment;

    // Déterminer la rotation NÉCESSAIRE pour amener ce segment (frameIndex)
    // à la position 0 (au centre de l'incrustation)
    const rotationToCenterSegment = rotation - segmentAngle;

    // 2. Préparer l'incrustation
    const icx = insetCanvas.width/2;
    const icy = insetCanvas.height/2;

    // 3. Dessiner l'image entière, mais en appliquant la rotation corrigée et un zoom élevé
    insetCtx.save();

    // Pour zoomer le segment au centre :
    // - On translate l'origine au centre de l'incrustation
    // - On applique un zoom (facteur 4 ici, à ajuster)
    // - On applique la rotation pour centrer le segment actuellement vu
    insetCtx.translate(icx, icy);
    const zoomFactor = 4; // Facteur de zoom
    insetCtx.scale(zoomFactor, zoomFactor);

    // Appliquer la rotation corrigée + rotation restante pour le ralenti
    insetCtx.rotate(rotationToCenterSegment);

    // Mise à l'échelle de l'image source pour qu'elle corresponde à la zone zoomée
    const scaleForZoom = (icx * 2) / iw;
    const sw = iw * scaleForZoom;
    const sh = ih * scaleForZoom;

    // Dessiner l'image centrée sur le point de rotation (0,0) avec l'offset
    insetCtx.drawImage(discImage, offsetX * scaleForZoom, offsetY * scaleForZoom, sw, sh);

    insetCtx.restore();

    // Ajout d'une bordure décorative
    insetCtx.beginPath(); insetCtx.arc(icx, icy, icx - 2, 0, Math.PI*2); insetCtx.lineWidth = 3; insetCtx.strokeStyle="rgba(255,255,255,0.15)"; insetCtx.stroke();
  }
  // --- FIN DE LA FONCTION INSET MODIFIÉE ---


  // main render loop
  function render(){
    const glowOp = isRunning ? (0.4 + 0.6*Math.abs(Math.sin(rotation*0.2))) * glowIntensity : 0.05 * glowIntensity;
    drawGlow(glowOp);

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
    rotationVelocity *= isDragging ? 0.995 : 0.995;
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
      rotationVelocity = est * (Math.max(0.5, rotationSpeed*25));
    }
    pointerVelSamples = [];
  }

  // events
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);

  // auto-start 2 minutes
  function startAuto(duration=120000){
    if(!isRunning){
      isRunning = true; indicator.classList.add('on'); startStop.textContent="⏸ Pause"; status.textContent="Auto-play";
      rotationVelocity = rotationSpeed * 50; // Démarrer avec une rotation plus rapide pour simuler le lancement
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
