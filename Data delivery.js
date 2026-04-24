// DATA DELIVERY - versione compatta per Code.org Game Lab
// Solo JavaScript. Clic sullo schermo per intro/dialoghi, frecce o WASD per muoverti.

var gameState = "story1", difficulty = "", dialogIndex = 0, dialogAuto = 0;
var meX = 200, meY = 332, meR = 14, meSpeed = 3.4, invFrames = 0;
var serverX = 200, serverY = 112, serverR = 30;
var packets = [], bugs = [], fx = [], matrixDrops = [];
var cleanDelivered = 0, brokenDelivered = 0, bagTotal = 0, bagBroken = 0, maxBag = 4;
var timeLeft = 60, frameCounter = 0, pulseTick = 0, missionWon = false, brokenPercent = 100;
var enemyCount = 4, enemySpeed = 2.3, packetSpawnRate = 72, enemySpawnRate = 210, maxEnemies = 5, startingPackets = 8;

var menuOrder = ["facile", "media", "difficile"];
var diffCfg = {
  facile:    {y: 164, label: "FACILE",    sub: "02 bug | 75s",  c: [77,240,255],  h: [120,255,255], count: 2, speed: 1.7, packet: 78, enemy: 240, max: 3,  start: 8, time: 75},
  media:     {y: 232, label: "MEDIA",     sub: "04 bug | 60s",  c: [170,92,255],  h: [210,140,255], count: 4, speed: 2.4, packet: 72, enemy: 210, max: 6,  start: 8, time: 60},
  difficile: {y: 300, label: "DIFFICILE", sub: "08+ bug | 42s", c: [255,90,130],  h: [255,130,170], count: 8, speed: 3.9, packet: 86, enemy: 165, max: 11, start: 7, time: 42}
};

var dialogList = [
  {speaker: "OPERATORE", me: false, lines: ["Agente, la citta' e' stata hackerata.", "Dobbiamo salvarla subito."]},
  {speaker: "TU",        me: true,  lines: ["Sono pronto.", "Risolvero' il problema."]},
  {speaker: "OPERATORE", me: false, lines: ["Porta i dati dispersi", "al server centrale."]},
  {speaker: "TU",        me: true,  lines: ["Ricevuto."]},
  {speaker: "OPERATORE", me: false, lines: ["Il server riceve i pacchetti di dati", "che gli consengi anche quelli corrotti.", "Se la corruzione supera il 10%,", "la missione fallira'."]}
];

function cyber() { textFont("Courier New"); }
function dist(x1, y1, x2, y2) { var dx = x1 - x2, dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function hitBox(px, py, x, y, w, h) { return px >= x && px <= x + w && py >= y && py <= y + h; }
function deliveredTotal() { return cleanDelivered + brokenDelivered; }

function initMatrix() {
  var i;
  matrixDrops = [];
  for (i = 0; i < 26; i++) matrixDrops.push({x: 8 + i * 15, y: randomNumber(-360, 0), speed: randomNumber(2, 6), len: randomNumber(8, 16)});
}

function glow(t, x, y, s, a, b, c, d, e, f) {
  cyber();
  textSize(s);
  textAlign(CENTER);
  fill(a, b, c); text(t, x - 2, y); text(t, x + 2, y);
  fill(d, e, f); text(t, x, y - 2); text(t, x, y + 2);
  fill(255, 255, 255); text(t, x, y);
}

function framePanel(x, y, w, h, alpha) {
  noStroke();
  fill(6, 10, 18, alpha || 255); rect(x, y, w, h);
  stroke(77, 240, 255); strokeWeight(2); noFill(); rect(x, y, w, h);
  stroke(255, 57, 189);
  line(x, y, x + 44, y); line(x, y, x, y + 36);
  line(x + w - 44, y, x + w, y); line(x + w, y, x + w, y + 36);
  line(x, y + h - 36, x, y + h); line(x, y + h, x + 44, y + h);
  line(x + w, y + h - 36, x + w, y + h); line(x + w - 44, y + h, x + w, y + h);
  noStroke();
}

function writeLines(lines, x, y, size, gap, r, g, b) {
  var i;
  cyber();
  fill(r, g, b); textSize(size); textAlign(CENTER);
  for (i = 0; i < lines.length; i++) text(lines[i], x, y + i * gap);
}

function sky() {
  var i;
  for (i = 0; i < 200; i += 4) { noStroke(); fill(4, 8 + i / 10, 18 + i / 8); rect(0, i, 400, 4); }
}

function drawMatrixRain() {
  var i, j, yy;
  cyber();
  for (i = 0; i < matrixDrops.length; i++) {
    for (j = 0; j < matrixDrops[i].len; j++) {
      yy = matrixDrops[i].y - j * 13;
      fill(j === 0 ? 198 : j < 4 ? 71 : j < 8 ? 26 : 10, j === 0 ? 255 : j < 4 ? 255 : j < 8 ? 210 : 120, j === 0 ? 236 : j < 4 ? 176 : j < 8 ? 122 : 74);
      textSize(12);
      text(randomNumber(0, 1), matrixDrops[i].x, yy);
    }
    matrixDrops[i].y += matrixDrops[i].speed;
    if (matrixDrops[i].y - matrixDrops[i].len * 13 > 430) matrixDrops[i].y = randomNumber(-240, -20);
  }
}

function drawGridBg() {
  var x, y;
  sky();
  fill(12, 18, 42); rect(0, 175, 400, 225);
  fill(28, 180, 255, 60); rect(0, 165, 400, 14);
  fill(100, 240, 255, 25); rect(0, 158, 400, 8);
  stroke(47, 215, 255); strokeWeight(1);
  for (x = -160; x <= 560; x += 24) line(x, 400, 200, 175);
  for (y = 186; y <= 400; y += 20) line(0, y, 400, y);
  stroke(255, 57, 189); line(0, 175, 400, 175); noStroke();
}

function drawCityBg() {
  var i, j;
  sky();
  drawMatrixRain();
  fill(0, 0, 0, 90); rect(0, 200, 400, 200);
  fill(20, 28, 48);
  rect(12, 210, 38, 190); rect(56, 170, 46, 230); rect(108, 195, 30, 205); rect(142, 132, 54, 268);
  rect(202, 165, 48, 235); rect(255, 120, 44, 280); rect(304, 184, 36, 216); rect(346, 155, 42, 245);
  fill(38, 180, 220); rect(70, 182, 16, 78); rect(158, 148, 12, 96); rect(220, 188, 14, 72); rect(272, 138, 12, 104); rect(362, 171, 10, 82);
  for (i = 20; i < 390; i += 48) for (j = 210; j < 370; j += 18) {
    fill(((i + j) / 2) % 4 < 2 ? 90 : 255, ((i + j) / 2) % 4 < 2 ? 230 : 60, ((i + j) / 2) % 4 < 2 ? 255 : 155, 170);
    rect(i, j, 8, 8); rect(i + 14, j, 8, 8);
  }
  fill(255, 90, 90, 220); rect(64, 220, 88, 24); rect(286, 246, 90, 24);
  fill(255, 240, 240); textAlign(CENTER); textSize(12); text("SYSTEM FAILURE", 108, 237); text("CITY OFFLINE", 331, 263);
  fill(40, 40, 60, 70); ellipse(116, 160, 62, 36); ellipse(180, 118, 52, 30); ellipse(300, 144, 58, 34); ellipse(337, 195, 76, 42);
}

function drawButton(x, y, w, h, label, sub, c, hover) {
  var on = hitBox(World.mouseX, World.mouseY, x, y, w, h), rgb = on ? hover : c;
  stroke(rgb[0], rgb[1], rgb[2]); strokeWeight(2); fill(10, 15, 28); rect(x, y, w, h);
  stroke(255, 57, 189);
  line(x + 6, y + 6, x + 42, y + 6); line(x + 6, y + 6, x + 6, y + 20);
  line(x + w - 42, y + h - 6, x + w - 6, y + h - 6); line(x + w - 6, y + h - 20, x + w - 6, y + h - 6);
  stroke(rgb[0], rgb[1], rgb[2]);
  line(x + w - 48, y + 6, x + w - 6, y + 6); line(x + w - 6, y + 6, x + w - 6, y + 22);
  line(x + 6, y + h - 6, x + 46, y + h - 6); line(x + 6, y + h - 22, x + 6, y + h - 6);
  noStroke(); cyber();
  fill(rgb[0], rgb[1], rgb[2]); textSize(18); textAlign(CENTER); text(label, x + w / 2, y + 22);
  fill(255, 255, 255); textSize(11); text(sub, x + w / 2, y + 40);
}

function applyDifficulty(level) {
  var d = diffCfg[level];
  difficulty = level;
  enemyCount = d.count; enemySpeed = d.speed; packetSpawnRate = d.packet; enemySpawnRate = d.enemy;
  maxEnemies = d.max; startingPackets = d.start; timeLeft = d.time;
}

function startGame(level) {
  var i;
  applyDifficulty(level);
  meX = 200; meY = 332; invFrames = 0;
  packets = []; bugs = []; fx = [];
  cleanDelivered = 0; brokenDelivered = 0; bagTotal = 0; bagBroken = 0; frameCounter = 0; pulseTick = 0;
  missionWon = false; brokenPercent = 100;
  for (i = 0; i < startingPackets; i++) spawnPacket();
  for (i = 0; i < enemyCount; i++) spawnBug();
  gameState = "play";
}

function spawnPacket() {
  var x = randomNumber(28, 372), y = randomNumber(126, 360), tries = 0;
  if (packets.length >= 14) return;
  while ((dist(x, y, serverX, serverY) < 74 || dist(x, y, meX, meY) < 34) && tries < 20) { x = randomNumber(28, 372); y = randomNumber(126, 360); tries++; }
  packets.push({x: x, y: y, r: 10, pulse: randomNumber(0, 100)});
}

function spawnBug() {
  var x = randomNumber(32, 368), y = randomNumber(130, 360), a = randomNumber(0, 359), s = enemySpeed + randomNumber(0, 10) / 10, tries = 0;
  if (bugs.length >= maxEnemies) return;
  while ((dist(x, y, meX, meY) < 70 || dist(x, y, serverX, serverY) < 80) && tries < 20) { x = randomNumber(32, 368); y = randomNumber(130, 360); tries++; }
  bugs.push({x: x, y: y, r: randomNumber(15, 22), vx: Math.cos(a * Math.PI / 180) * s, vy: Math.sin(a * Math.PI / 180) * s, pulse: randomNumber(0, 100)});
}

function addFx(x, y, label, r, g, b) { fx.push({x: x, y: y, label: label, life: 34, r: r, g: g, b: b}); }

function corruptBag() {
  invFrames = 48;
  if (bagTotal > 0 && bagBroken < bagTotal) { bagBroken = bagTotal; addFx(meX, meY - 16, "BUG -> DATI CORROTTI", 255, 110, 95); }
  else addFx(meX, meY - 16, "BUG DI RETE", 255, 160, 110);
}

function deliverBag() {
  var good = bagTotal - bagBroken, bad = bagBroken;
  cleanDelivered += good; brokenDelivered += bad;
  if (good > 0) addFx(serverX, serverY - 40, "SANI " + good, 89, 214, 255);
  if (bad > 0) addFx(serverX, serverY - 22, "BUG " + bad, 255, 110, 95);
  bagTotal = 0; bagBroken = 0;
}

function finalizeMission() {
  var total = deliveredTotal();
  brokenPercent = total ? (brokenDelivered * 100) / total : 100;
  missionWon = total > 0 && brokenPercent < 10;
  gameState = "over";
}

function updateGame() {
  var i, dx, dy, b;
  frameCounter++; pulseTick++;
  if (frameCounter % 30 === 0 && --timeLeft <= 0) { finalizeMission(); return; }
  if (frameCounter % packetSpawnRate === 0) spawnPacket();
  if (frameCounter % enemySpawnRate === 0) spawnBug();

  dx = (keyDown("right") || keyDown("d") ? 1 : 0) - (keyDown("left") || keyDown("a") ? 1 : 0);
  dy = (keyDown("down") || keyDown("s") ? 1 : 0) - (keyDown("up") || keyDown("w") ? 1 : 0);
  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
  meX = clamp(meX + dx * meSpeed, meR, 400 - meR);
  meY = clamp(meY + dy * meSpeed, 64 + meR, 400 - meR);
  if (invFrames > 0) invFrames--;

  for (i = packets.length - 1; i >= 0; i--) {
    packets[i].pulse++;
    if (dist(meX, meY, packets[i].x, packets[i].y) < meR + packets[i].r && bagTotal < maxBag) {
      bagTotal++; addFx(packets[i].x, packets[i].y - 10, "PACCHETTO", 88, 255, 214); packets.splice(i, 1);
    }
  }

  if (dist(meX, meY, serverX, serverY) < meR + serverR && bagTotal > 0) deliverBag();

  for (i = 0; i < bugs.length; i++) {
    b = bugs[i];
    b.pulse++; b.x += b.vx; b.y += b.vy;
    if (difficulty === "difficile" && frameCounter % 70 === 0) { b.vx += randomNumber(-4, 4) / 10; b.vy += randomNumber(-4, 4) / 10; }
    if (b.x - b.r < 0 || b.x + b.r > 400) { b.vx = -b.vx; b.x = clamp(b.x, b.r, 400 - b.r); }
    if (b.y - b.r < 64 || b.y + b.r > 400) { b.vy = -b.vy; b.y = clamp(b.y, 64 + b.r, 400 - b.r); }
    if (difficulty === "difficile" && frameCounter % 110 === 0) { b.vx += b.vx > 0 ? 0.12 : -0.12; b.vy += b.vy > 0 ? 0.12 : -0.12; }
    if (invFrames === 0 && dist(meX, meY, b.x, b.y) < meR + b.r - 3) corruptBag();
  }

  for (i = fx.length - 1; i >= 0; i--) { fx[i].y--; fx[i].life--; if (fx[i].life <= 0) fx.splice(i, 1); }
}

function drawStory1() {
  drawCityBg();
  glow("ALLERTA CRITICA", 200, 50, 26, 255, 110, 95, 255, 57, 189);
  framePanel(42, 108, 316, 212, 235);
  writeLines(["LEGGI CON ATTENZIONE"], 200, 132, 14, 18, 255, 87, 199);
  writeLines(["ANNO 2089 // NEO-LYNX SOTTO ATTACCO"], 200, 158, 13, 18, 97, 255, 217);
  writeLines([
    "Una citta' del futuro e' stata hackerata.",
    "Energia, trasporti e comunicazioni",
    "sono in crisi. Il flusso dei dati",
    "e corrotto. Solo un trasferimento",
    "pulito al server puo evitare",
    "il collasso totale della citta'."
  ], 200, 186, 12, 17, 255, 255, 255);
  if (mouseWentDown("leftButton")) { gameState = "story2"; dialogIndex = 0; dialogAuto = 0; }
}

function drawDialogBubble(d) {
  var x = 54, w = 292, y = 100, pad = 14;
  var h = 22 + 22 + d.lines.length * 20 + 14;
  var edge = d.me ? [255, 87, 199] : [77, 240, 255];
  var titleCol = d.me ? [255, 220, 240] : [97, 255, 217];
  var i;
  stroke(edge[0], edge[1], edge[2]); strokeWeight(2); fill(9, 14, 28); rect(x, y, w, h); noStroke();
  cyber(); textAlign(LEFT); textSize(11);
  fill(titleCol[0], titleCol[1], titleCol[2]); text(d.speaker, x + pad, y + 18);
  fill(255, 255, 255); textSize(12);
  for (i = 0; i < d.lines.length; i++) text(d.lines[i], x + pad, y + 38 + i * 20);
}

function drawStory2() {
  drawGridBg();
  framePanel(34, 24, 332, 344, 255);
  glow("CANALE OPERATORE", 200, 56, 24, 77, 240, 255, 255, 57, 189);
  drawDialogBubble(dialogList[dialogIndex]);

  if (dialogIndex < dialogList.length - 1) {
    if (mouseWentDown("leftButton")) {
      dialogIndex++;
      if (dialogIndex === dialogList.length - 1) dialogAuto = 72;
    }
  } else {
    if (mouseWentDown("leftButton")) gameState = "menu";
  }
}

function drawMenu() {
  var i, d, mx, my;
  drawGridBg();
  framePanel(34, 24, 332, 344, 255);
  writeLines(["SELEZIONA LA DIFFICOLTA DELLA MISSIONE"], 200, 110, 12, 16, 97, 255, 217);
  writeLines(["LIVELLO OPERAZIONE"], 200, 136, 13, 16, 210, 220, 240);
  for (i = 0; i < menuOrder.length; i++) { d = diffCfg[menuOrder[i]]; drawButton(86, d.y, 228, 52, d.label, d.sub, d.c, d.h); }
  writeLines(["MUOVITI CON FRECCE O WASD", "RACCOGLI DATI, EVITA BUG, CONSEGNA AL SERVER"], 200, 382, 10, 14, 130, 226, 255);

  if (!mouseWentDown("leftButton")) return;
  mx = World.mouseX; my = World.mouseY;
  for (i = 0; i < menuOrder.length; i++) {
    d = diffCfg[menuOrder[i]];
    if (hitBox(mx, my, 86, d.y, 228, 52)) startGame(menuOrder[i]);
  }
}

function drawHud() {
  noStroke(); fill(6, 10, 18); rect(0, 0, 400, 64);
  stroke(77, 240, 255); strokeWeight(2); line(0, 63, 400, 63); noStroke(); cyber();
  fill(255, 87, 199); textSize(9); textAlign(CENTER);
  text("RACCOGLI DATI  |  EVITA I BUG  |  CONSEGNA AL SERVER", 200, 12);
  textSize(13);
  fill(255, 255, 255); textAlign(LEFT); text("TIME " + timeLeft + "s", 12, 30);
  fill(97, 255, 217); textAlign(CENTER); text("SANI " + cleanDelivered, 200, 30);
  fill(255, 110, 95); textAlign(RIGHT); text("BUG " + brokenDelivered, 388, 30);
  fill(130, 226, 255); textSize(9); textAlign(LEFT);
  text("TRASPORTO " + bagTotal + "/" + maxBag, 12, 52);
  textAlign(RIGHT);
  text("CORROTTI " + bagBroken, 388, 52);
}

function drawArenaBg() {
  var x, y;
  background(5, 8, 18);
  for (y = 50; y <= 400; y += 20) { stroke(16, 34, 56); line(0, y, 400, y); }
  for (x = 0; x <= 400; x += 20) { stroke(12, 24, 42); line(x, 50, x, 400); }
  for (y = 58; y <= 400; y += 40) { stroke(35, 70, 110); line(0, y, 400, y); }
  for (x = 0; x <= 400; x += 40) { stroke(35, 70, 110); line(x, 50, x, 400); }
  stroke(255, 57, 189); line(0, 388, 400, 388); noStroke();
}

function drawServer() {
  var p = 3 * Math.sin(pulseTick / 10);
  noStroke(); fill(18, 66, 92); ellipse(serverX, serverY, 90 + p, 90 + p);
  fill(40, 150, 190); ellipse(serverX, serverY, 72 + p, 72 + p);
  fill(6, 12, 26); rect(serverX - 30, serverY - 18, 60, 36);
  fill(77, 240, 255); rect(serverX - 19, serverY - 8, 38, 16);
  fill(255, 57, 189); rect(serverX - 12, serverY + 14, 24, 4);
  cyber(); fill(255, 255, 255); textSize(14); textAlign(CENTER); text("SERVER", serverX, serverY + 45);
}

function drawPackets() {
  var i, p;
  for (i = 0; i < packets.length; i++) {
    p = 2 * Math.sin(packets[i].pulse / 8);
    noStroke(); fill(48, 210, 255); ellipse(packets[i].x, packets[i].y, 24 + p, 24 + p);
    fill(255, 57, 189); rect(packets[i].x - 9, packets[i].y - 6, 18, 12);
    fill(255, 255, 255); rect(packets[i].x - 5, packets[i].y - 2, 10, 4);
    fill(77, 240, 255); rect(packets[i].x - 1, packets[i].y - 7, 2, 14);
  }
}

function drawBugs() {
  var i, b, p;
  for (i = 0; i < bugs.length; i++) {
    b = bugs[i]; p = 2 * Math.sin(b.pulse / 7);
    noStroke(); fill(70, 30, 20); ellipse(b.x, b.y, b.r * 2.4 + p, b.r * 2.4 + p);
    fill(255, 98, 70); ellipse(b.x, b.y, b.r * 1.6, b.r * 1.6);
    stroke(255, 194, 121); strokeWeight(1); line(b.x - b.r, b.y, b.x + b.r, b.y); line(b.x, b.y - b.r, b.x, b.y + b.r);
    stroke(255, 244, 214); strokeWeight(4); line(b.x - b.r / 2, b.y - b.r / 2, b.x + b.r / 2, b.y + b.r / 2); line(b.x + b.r / 2, b.y - b.r / 2, b.x - b.r / 2, b.y + b.r / 2);
  }
  noStroke();
}

function drawMe() {
  var i;
  if (invFrames > 0 && frameCounter % 6 < 3) return;
  noStroke(); fill(30, 90, 115); ellipse(meX, meY, 38, 38);
  fill(77, 240, 255); ellipse(meX, meY, 28, 28);
  fill(255, 57, 189); ellipse(meX, meY, 14, 14);
  cyber(); fill(255, 255, 255); textSize(10); textAlign(CENTER); text("ME", meX, meY + 3);
  for (i = 0; i < bagTotal; i++) { fill(i < bagBroken ? 255 : 97, i < bagBroken ? 110 : 255, i < bagBroken ? 95 : 217); rect(meX - bagTotal * 5 + i * 10, meY - 24, 8, 8); }
  fill(97, 255, 217); text("ME", meX, meY + 27);
}

function drawFx() {
  var i;
  cyber(); textAlign(CENTER); textSize(12);
  for (i = 0; i < fx.length; i++) { fill(fx[i].r, fx[i].g, fx[i].b); text(fx[i].label, fx[i].x, fx[i].y); }
}

function drawArena() {
  drawArenaBg(); drawHud(); drawServer(); drawPackets(); drawBugs(); drawMe(); drawFx();
}

function drawGameOver() {
  drawGridBg();
  framePanel(34, 24, 332, 344, 255);
  glow(missionWon ? "MISSIONE RIUSCITA" : "MISSIONE FALLITA", 200, 86, 24, missionWon ? 77 : 255, missionWon ? 240 : 110, missionWon ? 255 : 95, 255, 57, 189);
  writeLines(["PACCHETTI SANI CONSEGNATI " + cleanDelivered], 200, 138, 15, 18, 97, 255, 217);
  writeLines(["PACCHETTI CON BUG CONSEGNATI " + brokenDelivered], 200, 168, 15, 18, 255, 110, 95);
  writeLines(["TOTALE CONSEGNATI " + deliveredTotal()], 200, 198, 15, 18, 130, 226, 255);
  writeLines(["PERCENTUALE BUG " + Math.round(brokenPercent * 100) / 100 + "%"], 200, 228, 15, 18, 255, 255, 255);
  writeLines(missionWon ? ["OBIETTIVO RAGGIUNTO: MENO DEL 10%"] : ["OBIETTIVO NON RAGGIUNTO:", "SERVE MENO DEL 10%"], 200, 248, 13, 16, missionWon ? 210 : 255, missionWon ? 255 : 200, missionWon ? 230 : 210);
  writeLines(["DIFFICOLTA " + difficulty.toUpperCase()], 200, 286, 13, 16, 255, 87, 199);
  drawButton(112, 308, 176, 50, "RIGIOCA", "torna al menu", [77, 240, 255], [120, 255, 255]);
  if (mouseWentDown("leftButton") && hitBox(World.mouseX, World.mouseY, 112, 308, 176, 50)) gameState = "menu";
}

function draw() {
  if (gameState === "story1") drawStory1();
  else if (gameState === "story2") drawStory2();
  else if (gameState === "menu") drawMenu();
  else if (gameState === "play") { updateGame(); drawArena(); }
  else if (gameState === "over") drawGameOver();
}

initMatrix();

