"use strict";

/* ---------- Text ---------- */
const T = {
  en:{tagline:"Every category you want, in English or Spanish. No ads, no packs, no paywall.",lang:"Language",round:"Round",controls:"Controls",tilt:"Tilt",tap:"Tap",who:"Players",everyone:"Everyone",kidsOnly:"Kids mode",pick:"Pick a category",words:"words",kid:"Kids",mix:"Mix it up",mixSub:"A bit of everything",custom:"Your own words",customSub:"Inside jokes go here",edit:"Edit",customTitle:"Your own words",customDesc:"One per line. Names of friends, inside jokes, anything goes.",save:"Save",cancel:"Cancel",empty:"Add some words first.",forehead:"Phone on your forehead",ready:"Get ready",tiltHint:"Tilt down: correct · Tilt up: pass · or tap right / left",tapHint:"Tap right: correct · Tap left: pass",correct:"Correct!",pass:"Pass",timeUp:"Time's up!",scoreLabel:"correct",again:"Play again",cats:"Categories",noMotion:"No motion sensor found, so it's tap-only this round.",denied:"Motion access was blocked, so it's tap-only. Reload the page and tap Allow to use tilt.",foot:"Tip: add this page to your home screen so it opens full screen like an app. Hold the phone sideways on your forehead, screen facing your friends.",count:n=>n+" categories"},
  es:{tagline:"Todas las categorías que quieras, en inglés o español. Sin anuncios, sin packs, sin pagar.",lang:"Idioma",round:"Ronda",controls:"Controles",tilt:"Inclinar",tap:"Tocar",who:"Jugadores",everyone:"Todos",kidsOnly:"Modo peques",pick:"Elige categoría",words:"palabras",kid:"Peques",mix:"Mezcla",mixSub:"Un poco de todo",custom:"Tus palabras",customSub:"Para las bromas internas",edit:"Editar",customTitle:"Tus palabras",customDesc:"Una por línea. Nombres de amigos, bromas internas, lo que sea.",save:"Guardar",cancel:"Cancelar",empty:"Añade algunas palabras primero.",forehead:"Móvil en la frente",ready:"Preparados",tiltHint:"Abajo: acierto · Arriba: pasar · o toca derecha / izquierda",tapHint:"Toca derecha: acierto · Izquierda: pasar",correct:"¡Acierto!",pass:"Paso",timeUp:"¡Tiempo!",scoreLabel:"aciertos",again:"Otra ronda",cats:"Categorías",noMotion:"No se detecta el sensor de movimiento: esta ronda es solo tocando.",denied:"El acceso al movimiento está bloqueado: solo tocando. Recarga la página y pulsa Permitir para inclinar.",foot:"Truco: añade esta página a la pantalla de inicio y se abre a pantalla completa como una app. Móvil de lado en la frente, con la pantalla hacia tus amigos.",count:n=>n+" categorías"}
};

/* ---------- Categories (loaded from words.json) ---------- */
let C = [];

/* ---------- State ---------- */
const store = {
  get(k,d){try{const v=localStorage.getItem("cf_"+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem("cf_"+k,JSON.stringify(v))}catch(e){}}
};
const S = {
  lang: store.get("lang", (navigator.language||"en").toLowerCase().startsWith("es")?"es":"en"),
  time: store.get("time", 60),
  ctl: store.get("ctl", "tilt"),
  who: store.get("who", "all"),
  custom: store.get("custom", "")
};
const used = {}; // per category+lang, words already shown this session
let G = null;    // current game

const $ = id => document.getElementById(id);
const t = k => T[S.lang][k];
const customWords = () => S.custom.split("\n").map(x=>x.trim()).filter(Boolean);
const visibleCats = () => C.filter(c => S.who==="all" || c.kids);

/* ---------- Home ---------- */
function renderText(){
  document.documentElement.lang = S.lang;
  document.querySelectorAll("[data-t]").forEach(el => { const v=t(el.dataset.t); if(typeof v==="string") el.textContent=v; });
}
function renderSegs(){
  const map = {segLang:"lang",segTime:"time",segCtl:"ctl",segKids:"who"};
  for (const id in map) $(id).querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v)===String(S[map[id]])));
}
function tile(opts){
  const b=document.createElement("button");
  b.className="tile"+(opts.dashed?" dashed":"");
  if(opts.color) b.style.setProperty("--c",opts.color);
  const name=document.createElement("b"); name.textContent=opts.name; b.appendChild(name);
  if(opts.sub){const s=document.createElement("div");s.className="sub";s.textContent=opts.sub;b.appendChild(s)}
  const m=document.createElement("div"); m.className="meta";
  const n=document.createElement("span"); n.textContent=opts.count+" "+t("words"); m.appendChild(n);
  if(opts.kid){const k=document.createElement("span");k.className="kid";k.textContent=t("kid");m.appendChild(k)}
  b.appendChild(m);
  b.addEventListener("click", opts.onClick);
  return b;
}
function renderGrid(){
  const g=$("grid"); g.textContent="";
  const cats=visibleCats();
  const mixCount=cats.reduce((n,c)=>n+c["w_"+S.lang].length,0);
  g.appendChild(tile({name:t("mix"),sub:t("mixSub"),count:mixCount,color:"#FFF6E8",onClick:()=>start("mix")}));
  cats.forEach(c=>{
    const [name,sub]=c[S.lang];
    g.appendChild(tile({name,sub,count:c["w_"+S.lang].length,color:c.c,kid:c.kids&&S.who==="all",onClick:()=>start(c.id)}));
  });
  const cw=customWords();
  const ct=tile({name:t("custom"),sub:t("customSub"),count:cw.length,dashed:true,onClick:()=>cw.length?start("custom"):openSheet()});
  const e=document.createElement("span"); e.className="edit"; e.textContent=t("edit"); e.setAttribute("role","button");
  e.addEventListener("click",ev=>{ev.stopPropagation();openSheet()});
  ct.appendChild(e); g.appendChild(ct);
  $("count").textContent=T[S.lang].count(cats.length+2);
}
function renderHome(){renderText();renderSegs();renderGrid()}

function bindSeg(id,key,num){
  $(id).addEventListener("click",e=>{
    const b=e.target.closest("button"); if(!b) return;
    S[key]=num?Number(b.dataset.v):b.dataset.v; store.set(key,S[key]); renderHome();
  });
}
bindSeg("segLang","lang"); bindSeg("segTime","time",true); bindSeg("segCtl","ctl"); bindSeg("segKids","who");

/* Custom sheet */
function openSheet(){ $("customText").value=S.custom; $("sheet").hidden=false; setTimeout(()=>$("customText").focus(),50); }
$("cancelCustom").onclick=()=>{$("sheet").hidden=true};
$("saveCustom").onclick=()=>{S.custom=$("customText").value; store.set("custom",S.custom); $("sheet").hidden=true; renderGrid();};

/* ---------- Deck ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function deckFor(id){
  let pool;
  if(id==="custom") pool=customWords();
  else if(id==="mix") pool=visibleCats().flatMap(c=>c["w_"+S.lang]);
  else pool=C.find(c=>c.id===id)["w_"+S.lang];
  const key=id+"|"+S.lang+"|"+S.who;
  used[key]=used[key]||new Set();
  let fresh=pool.filter(w=>!used[key].has(w));
  if(fresh.length<8){used[key].clear();fresh=pool.slice()}
  return {key,list:shuffle(fresh)};
}
function catName(id){
  if(id==="mix") return t("mix");
  if(id==="custom") return t("custom");
  return C.find(c=>c.id===id)[S.lang][0];
}

/* ---------- Sound, vibration, wake lock ---------- */
let AC=null, wake=null;
function audioInit(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume()}catch(e){}}
function beep(freq,dur,type,vol){
  if(!AC) return;
  try{const o=AC.createOscillator(),g=AC.createGain();o.type=type||"sine";o.frequency.value=freq;
    g.gain.setValueAtTime(vol||.18,AC.currentTime);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+dur);
    o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+dur)}catch(e){}
}
const buzz = p => { try{navigator.vibrate&&navigator.vibrate(p)}catch(e){} };
async function wakeOn(){try{wake=await navigator.wakeLock.request("screen")}catch(e){wake=null}}
function wakeOff(){try{wake&&wake.release()}catch(e){}wake=null}
document.addEventListener("visibilitychange",()=>{if(G&&document.visibilityState==="visible")wakeOn()});

/* ---------- Motion ----------
   z = how much the screen faces up (1), sideways (0) or down (-1).
   Phone on forehead: screen sideways. Nod down: screen faces floor = correct. Look up: faces ceiling = pass. */
let motionOK=false, motionListening=false, z=0, needNeutral=true;
function onOrient(e){
  if(e.beta==null||e.gamma==null) return;
  motionOK=true;
  const b=e.beta*Math.PI/180, g=e.gamma*Math.PI/180;
  z=Math.cos(b)*Math.cos(g);
  if(!G||G.phase!=="play") { if(Math.abs(z)<.35) needNeutral=false; return; }
  if(Math.abs(z)<.35){needNeutral=false;return}
  if(needNeutral) return;
  if(z<-.6) mark(true); else if(z>.6) mark(false);
}
async function motionInit(){
  // Must run inside a tap on iOS
  try{
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const r=await DeviceOrientationEvent.requestPermission();
      if(r!=="granted") return "denied";
    }
  }catch(e){return "denied"}
  if(!motionListening){window.addEventListener("deviceorientation",onOrient);motionListening=true}
  return "ok";
}

/* ---------- Game ---------- */
async function start(id){
  if(id==="custom"&&!customWords().length){openSheet();return}
  audioInit();
  let notice="";
  if(S.ctl==="tilt"){ const r=await motionInit(); if(r==="denied") notice=t("denied"); }
  const d=deckFor(id);
  G={id,deck:d.list,key:d.key,i:-1,results:[],phase:"count",endAt:0,tick:null,tiltWanted:S.ctl==="tilt"&&!notice};
  wakeOn();
  try{ if(document.documentElement.requestFullscreen&&/Android/i.test(navigator.userAgent)){await document.documentElement.requestFullscreen();await screen.orientation.lock("landscape")} }catch(e){}
  $("home").hidden=true; $("results").hidden=true; $("game").hidden=false;
  $("gcat").textContent=catName(id); $("gscore").textContent="0"; $("time").textContent=S.time; $("time").classList.remove("low");
  $("hint").textContent=G.tiltWanted?t("tiltHint"):t("tapHint");
  $("notice").textContent=notice; $("notice").hidden=!notice;
  countdown(3);
  if(G.tiltWanted) setTimeout(()=>{ if(G&&!motionOK){ G.tiltWanted=false; $("notice").textContent=t("noMotion"); $("notice").hidden=false; $("hint").textContent=t("tapHint"); } },1500);
}
function showWord(text,small){
  const w=$("word"); w.textContent=text; w.dataset.small=small?"1":""; fit();
}
function fit(){
  const w=$("word"), box=$("stage"); if(!w.textContent) return;
  let s=Math.min(box.clientWidth*.22, box.clientHeight*.62);
  if(w.dataset.small) s*=.6;
  w.style.fontSize=s+"px"; let i=0;
  while((w.scrollWidth>box.clientWidth-8||w.scrollHeight>box.clientHeight-8)&&i<80){s*=.93;w.style.fontSize=s+"px";i++}
}
window.addEventListener("resize",()=>{ if(G) fit(); });

function countdown(n){
  if(!G) return;
  if(n===0){ play(); return; }
  showWord(n===3?t("forehead"):String(n), n===3);
  if(n<3) beep(520,.12,"square",.12);
  G.cd=setTimeout(()=>countdown(n-1), n===3?1800:900);
}
function play(){
  G.phase="play"; needNeutral=true;
  G.endAt=Date.now()+S.time*1000;
  beep(880,.18,"square",.14);
  next();
  G.tick=setInterval(tick,200);
}
function next(){
  if(!G.deck.length){ const d=deckFor(G.id); G.deck=d.list; }
  G.i++;
  if(G.i>=G.deck.length){ G.deck=G.deck.concat(shuffle(G.deck.slice())); }
  showWord(G.deck[G.i]);
}
function tick(){
  if(!G) return;
  const left=Math.max(0,Math.ceil((G.endAt-Date.now())/1000));
  const el=$("time");
  if(el.textContent!==String(left)){ el.textContent=left; if(left<=10&&left>0){el.classList.add("low");beep(660,.06,"sine",.08)} }
  if(left<=0) finish();
}
function mark(ok){
  if(!G||G.phase!=="play") return;
  const w=G.deck[G.i];
  G.results.push({w,ok});
  used[G.key].add(w);
  G.phase="flash"; needNeutral=true;
  const g=$("game"); g.classList.add(ok?"good":"passed");
  showWord(ok?t("correct"):t("pass"));
  $("gscore").textContent=G.results.filter(r=>r.ok).length;
  if(ok){beep(784,.1,"sine",.2);setTimeout(()=>beep(1175,.16,"sine",.2),90);buzz(60)}else{beep(220,.22,"triangle",.2);buzz([30,40,30])}
  setTimeout(()=>{
    if(!G||G.phase!=="flash") return;
    g.classList.remove("good","passed");
    if(Date.now()>=G.endAt){finish();return}
    G.phase="play"; next();
  },750);
}
function cleanupGame(){
  if(!G) return;
  clearInterval(G.tick); clearTimeout(G.cd);
  $("game").classList.remove("good","passed");
  wakeOff();
  try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){}
}
function finish(){
  if(!G||G.phase==="over") return;
  G.phase="over"; cleanupGame();
  beep(330,.5,"sawtooth",.12); buzz(300);
  const r=G.results, n=r.filter(x=>x.ok).length;
  $("game").hidden=true; $("results").hidden=false;
  $("rscore").textContent=n; $("rlabel").textContent=t("scoreLabel")+" · "+catName(G.id);
  const ch=$("chips"); ch.textContent="";
  r.forEach(x=>{const s=document.createElement("span");s.className="chip "+(x.ok?"ok":"no");s.textContent=x.w;ch.appendChild(s)});
  if(!r.length){const s=document.createElement("span");s.className="chip no";s.textContent=t("timeUp");ch.appendChild(s)}
  renderText();
  window.scrollTo(0,0);
}
function quit(){ cleanupGame(); G=null; $("game").hidden=true; $("results").hidden=true; $("home").hidden=false; renderHome(); }

$("zGood").addEventListener("click",()=>mark(true));
$("zPass").addEventListener("click",()=>mark(false));
$("quit").addEventListener("click",quit);
$("again").addEventListener("click",()=>{const id=G&&G.id;G=null;start(id||"mix")});
$("back").addEventListener("click",quit);

fetch("words.json").then(r=>r.json()).then(d=>{C=d;renderHome()});
