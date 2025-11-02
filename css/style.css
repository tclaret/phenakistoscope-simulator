<style>
  :root{
    --bg:#05121a;
    --panel:#0b1220;
    --muted:#9aa7bf;
    --accent:#6ee7b7;
  }
  html,body{height:100%;margin:0;background:linear-gradient(180deg,#02050a 0%, var(--bg) 100%);color:#e8f0fb;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial;}
  .container{max-width:1200px;margin:18px auto;padding:18px;box-sizing:border-box;}
  header{display:flex;flex-direction:column;gap:6px;align-items:center;margin-bottom:14px}
  h1{margin:0;font-size:20px;font-weight:600}
  .layout{display:grid;grid-template-columns:360px 1fr;gap:20px;align-items:start}
  @media (max-width:920px){ .layout{grid-template-columns:1fr} }
  .panel{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); padding:12px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,0.7)}
  label{font-size:13px;color:var(--muted);display:block;margin-bottom:6px}
  select,input[type=text],input[type=file],button{width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit;font-size:14px}
  .controlsPanel{display:flex;flex-direction:column;gap:10px}
  .instrument{display:flex;flex-direction:column;gap:10px;padding:8px;border-radius:10px;background:linear-gradient(180deg,#0e1518,#061015);box-shadow:inset 0 2px 8px rgba(0,0,0,0.5)}
  .controls-top{display:flex;gap:8px;flex-wrap:wrap}
  .controls-top>div{flex:1 1 160px;min-width:140px}
  .controls-bottom{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  .btn{padding:8px 10px;border-radius:8px;background:#0b1620;border:1px solid rgba(255,255,255,0.03);cursor:pointer}
  .btn:hover{transform:translateY(-1px)}
  .indicator{width:12px;height:12px;border-radius:50%;background:#300;margin-left:8px}
  .indicator.on{background:var(--accent);box-shadow:0 0 10px var(--accent)}
  .speedWrap{display:flex;align-items:center;gap:8px}
  .speedValue{min-width:56px;text-align:right;color:var(--accent)}
  .viewer{display:flex;flex-direction:column;gap:10px;align-items:center}
  .canvasWrap{position:relative;width:100%;display:flex;justify-content:center;align-items:center;padding:12px}
  canvas{background:#000;border-radius:16px;max-width:calc(100% - 36px);height:auto;box-shadow: 0 12px 40px rgba(1,6,14,0.9)}
  .glowRing{position:absolute;pointer-events:none;border-radius:50%;filter:blur(20px);mix-blend-mode:screen;transition:opacity 0.25s}
  .inset{position:absolute;right:22px;bottom:22px;width:140px;height:140px;border-radius:50%;overflow:hidden;border:3px solid rgba(255,255,255,0.04);display:none}
  .thumbnail{margin-top:8px;display:flex;justify-content:center}
  .thumbImg{width:140px;height:140px;object-fit:cover;border-radius:8px;opacity:0;transition:opacity 360ms ease}
  .spinner{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;display:none;align-items:center;justify-content:center}
  .spinner.visible{display:flex}
  .spinner .dot{width:14px;height:14px;border-radius:50%;background:var(--accent);animation:spin 1s linear infinite}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  footer{margin-top:10px;color:var(--muted);font-size:14px}
  footer a{color:var(--accent);text-decoration:none}
  .about{margin-top:14px;padding:12px;border-radius:10px;background:linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.01));font-size:14px;color:var(--muted)}
  @media (max-width:520px){ .inset{display:none} .thumbImg{width:120px;height:120px} }
</style>