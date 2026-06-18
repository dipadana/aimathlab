function toggleLangMenu(e) {
  e.stopPropagation();
  document.getElementById('lang-menu').classList.toggle('show');
}
window.addEventListener('click', () => {
  const m = document.getElementById('lang-menu');
  if(m) m.classList.remove('show');
});

function setLang(lang) {
  document.body.setAttribute('data-active-lang', lang);
  document.documentElement.setAttribute('lang', lang === 'ja' ? 'ja' : lang === 'id' ? 'id' : 'en');
  ['en','ja','id'].forEach(l => document.getElementById('lb-'+l).classList.toggle('active', l === lang));
  localStorage.setItem('aiml-lang', lang);
  updateInfo();
  if (typeof updateTheoryNote === 'function') updateTheoryNote();
}
setTimeout(() => { const _sl = localStorage.getItem('aiml-lang'); if (_sl) setLang(_sl); }, 0);

function updateTheoryNote() {
  const lang = document.body.getAttribute('data-active-lang')||'en';
  const notes = {
    en:`<p><strong>Linear Transformation:</strong> A $2 \\times 2$ matrix $A$ acts as a linear map $f: \\mathbb{R}^2 \\to \\mathbb{R}^2$. The determinant $\\det(A)$ signifies the scaling factor of area; if $\\det(A) < 0$, orientation is reversed.</p><p><strong>Eigenvectors:</strong> Non-zero vectors $\\mathbf{v}$ satisfying $A\\mathbf{v} = \\lambda\\mathbf{v}$. They span the invariant sub-spaces of $A$.</p><p><strong>Singular Value Decomposition (SVD):</strong> Any real matrix $A$ can be factored as $A = U \\Sigma V^T$, where $U, V$ are orthogonal matrices (rotations/reflections) and $\\Sigma$ is a diagonal matrix (scaling). This implies any linear transformation can be decomposed into a rotation, scaling, and a second rotation.</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">Reference: Lay, D. C. (2012). <em>Linear Algebra and its Applications</em>. Pearson.</p>`,
    ja:`<p><strong>線形変換:</strong> $2 \\times 2$ 行列 $A$ は $\\mathbb{R}^2 \\to \\mathbb{R}^2$ の線形写像として機能します。行列式 $\\det(A)$ は面積の拡大率を意味し、負の場合は反転します。</p><p><strong>固有ベクトル:</strong> $A\\mathbf{v} = \\lambda\\mathbf{v}$ を満たすゼロでないベクトル $\\mathbf{v}$ です。</p><p><strong>特異値分解 (SVD):</strong> 任意の実数行列 $A$ は $A = U \\Sigma V^T$ と分解できます。ここで $U, V$ は直交行列（回転・反転）、$\\Sigma$ は対角行列（拡大縮小）です。つまり、任意の線形変換は回転・拡大・回転の3段階に分解できることを意味します。</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">参考文献: Lay, D. C. (2012). <em>Linear Algebra and its Applications</em>. Pearson.</p>`,
    id:`<p><strong>Transformasi Linear:</strong> Matriks $2 \\times 2$ $A$ bertindak sebagai pemetaan linear $f: \\mathbb{R}^2 \\to \\mathbb{R}^2$. Determinan $\\det(A)$ menandakan faktor penskalaan luas.</p><p><strong>Vektor Eigen:</strong> Vektor bukan nol $\\mathbf{v}$ yang memenuhi $A\\mathbf{v} = \\lambda\\mathbf{v}$.</p><p><strong>Dekomposisi Nilai Singular (SVD):</strong> Setiap matriks real $A$ dapat difaktorkan sebagai $A = U \\Sigma V^T$, di mana $U, V$ adalah matriks ortogonal (rotasi/refleksi) dan $\\Sigma$ adalah matriks diagonal (penskalaan). Ini menyiratkan setiap transformasi linear dapat didekomposisi menjadi rotasi, penskalaan, dan rotasi kedua.</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">Referensi: Lay, D. C. (2012). <em>Linear Algebra and its Applications</em>. Pearson.</p>`
  };
  const el = document.getElementById('theory-text');
  if (el) { el.innerHTML = notes[lang] || notes.en; }
  if (window.MathJax) { MathJax.typesetPromise([el]).catch(()=>{}); }
}

function togglePanel(name) {
  const head = document.querySelector(`[onclick="togglePanel('${name}')"]`);
  const body = document.getElementById('pb-'+name);
  if (!body) return;
  head.classList.toggle('collapsed');
  body.classList.toggle('collapsed');
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, CX, CY;
const UNIT = 50;
let mat = [1, 0, 0, 1];
let matBase = [1, 0, 0, 1];

var lmeVec = { x: 2, y: 1 };
var showLME = true;
var lmeAnimStep = -1;
var lmeAnimRaf = null;
var animT = 1.0;
var animRaf = null;
var showGrid = true, showEigen = true;

function multiply2x2(A, B) {
  return [
    A[0]*B[0] + A[1]*B[2], A[0]*B[1] + A[1]*B[3],
    A[2]*B[0] + A[3]*B[2], A[2]*B[1] + A[3]*B[3]
  ];
}

function svd2x2(a, b, c, d) {
  const E = (a+d)/2, F = (a-d)/2, G = (c+b)/2, svdH = (c-b)/2;
  const Q = Math.sqrt(E*E + svdH*svdH), R = Math.sqrt(F*F + G*G);
  const s1 = Q + R, s2 = Math.abs(Q - R);
  const a1 = Math.atan2(G, F), a2 = Math.atan2(svdH, E);
  const theta = (a2 - a1)/2, phi = (a2 + a1)/2;
  const sgn = (Q - R < 0) ? -1 : 1;
  const V_T = [Math.cos(theta), -Math.sin(theta), Math.sin(theta), Math.cos(theta)];
  const U = [Math.cos(phi), -sgn*Math.sin(phi), Math.sin(phi), sgn*Math.cos(phi)];
  const Sigma = [s1, 0, 0, s2];
  return { U, Sigma, V_T };
}

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function resize() {
  const dpr = window.devicePixelRatio || 1, cssW = canvas.offsetWidth, cssH = 500;
  canvas.width = cssW * dpr; canvas.height = cssH * dpr;
  canvas.style.height = cssH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  W = cssW; H = cssH; CX = W/2; CY = H/2;
  render();
}

function getM(t) {
  return mat.map((v,i) => matBase[i] + (v - matBase[i]) * t);
}

function wc(x, y) { return [CX + x * UNIT, CY - y * UNIT]; }

function applyM(m, x, y) { return [m[0]*x + m[1]*y, m[2]*x + m[3]*y]; }

function drawGrid(m) {
  if (!showGrid) return;
  const dark = isDark();
  const range = Math.ceil(Math.max(W, H) / 2 / UNIT) + 2;
  ctx.lineWidth = 0.6;
  for (let i = -range; i <= range; i++) {
    const drawLine = (p1x,p1y,p2x,p2y,alpha) => {
      const [tx1,ty1]=applyM(m,p1x,p1y),[tx2,ty2]=applyM(m,p2x,p2y);
      const [sx1,sy1]=wc(tx1,ty1),[sx2,sy2]=wc(tx2,ty2);
      ctx.strokeStyle=`rgba(${dark?'106,159,216':'42,92,170'},${alpha})`;
      ctx.beginPath(); ctx.moveTo(sx1,sy1); ctx.lineTo(sx2,sy2); ctx.stroke();
    };
    const isAxis = i === 0;
    const alpha = isAxis ? (dark?0.45:0.4) : (dark?0.07:0.08);
    ctx.lineWidth = isAxis ? 1.2 : 0.5;
    drawLine(i,-range,i,range,alpha);
    drawLine(-range,i,range,i,alpha);
  }
  ctx.setLineDash([4,4]); ctx.lineWidth = 0.4;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  for (let i = -range; i <= range; i++) {
    const [xa,ya]=wc(i,-range),[xb,yb]=wc(i,range);
    ctx.beginPath(); ctx.moveTo(xa,ya); ctx.lineTo(xb,yb); ctx.stroke();
    const [xc,yc]=wc(-range,i),[xd,yd]=wc(range,i);
    ctx.beginPath(); ctx.moveTo(xc,yc); ctx.lineTo(xd,yd); ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawBasisArrow(sx, sy, ex, ey, color, label) {
  const dx=ex-sx,dy=ey-sy,len=Math.sqrt(dx*dx+dy*dy); if (len<2) return;
  const angle=Math.atan2(dy,dx),hl=Math.min(12,len*0.3);
  ctx.strokeStyle=color; ctx.lineWidth=2.2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(sx,sy);
  ctx.lineTo(ex-Math.cos(angle)*hl*0.6,ey-Math.sin(angle)*hl*0.6); ctx.stroke();
  ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(ex,ey);
  ctx.lineTo(ex-hl*Math.cos(angle-0.4),ey-hl*Math.sin(angle-0.4));
  ctx.lineTo(ex-hl*Math.cos(angle+0.4),ey-hl*Math.sin(angle+0.4));
  ctx.closePath(); ctx.fill();
  if (label) {
    ctx.font='bold 12px "JetBrains Mono",monospace'; ctx.textAlign='center'; ctx.fillStyle=color;
    ctx.fillText(label,ex+Math.cos(angle)*14,ey+Math.sin(angle)*14);
  }
}

function drawSquare(m, t) {
  const dark=isDark();
  const corners=[[0,0],[1,0],[1,1],[0,1]];
  const tc=corners.map(([x,y])=>{
    const [mx,my]=applyM(m,x,y);
    return wc(mx,my);
  });
  ctx.fillStyle=dark?'rgba(90,186,128,0.12)':'rgba(46,125,82,0.10)';
  ctx.strokeStyle=dark?'rgba(90,186,128,0.6)':'rgba(46,125,82,0.65)';
  ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(...tc[0]);
  tc.forEach(p=>ctx.lineTo(...p));
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.setLineDash([5,4]); ctx.lineWidth=0.8;
  ctx.strokeStyle=dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)';
  ctx.beginPath(); ctx.moveTo(...wc(0,0)); ctx.lineTo(...wc(1,0)); ctx.lineTo(...wc(1,1)); ctx.lineTo(...wc(0,1)); ctx.closePath(); ctx.stroke();
  ctx.setLineDash([]);
  const [o1,o2]=wc(0,0);
  const [e1x,e1y]=applyM(m,1,0),[e2x,e2y]=applyM(m,0,1);
  const [p1x,p1y]=wc(e1x,e1y),[p2x,p2y]=wc(e2x,e2y);
  drawBasisArrow(o1,o2,p1x,p1y,dark?'#6a9fd8':'#2a5caa','ê₁');
  drawBasisArrow(o1,o2,p2x,p2y,dark?'#d4a06a':'#8b5a2b','ê₂');
}

function drawEigenvectors(eigenData) {
  if (!showEigen || !eigenData) return;
  const dark = isDark();
  const colors = [dark?'#d47070':'#b84040', dark?'#9a88d8':'#5b4a9e'];
  const [o1,o2]=wc(0,0);
  eigenData.forEach((ev,i) => {
    if (!ev.real) return;
    const scale=3.5;
    const [ex,ey]=wc(ev.vx*scale,ev.vy*scale);
    const [nx,ny]=wc(-ev.vx*scale,-ev.vy*scale);
    ctx.setLineDash([5,4]);
    ctx.strokeStyle=colors[i]; ctx.lineWidth=1.5; ctx.globalAlpha=0.7;
    ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(ex,ey); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha=1;
    ctx.fillStyle=colors[i];
    ctx.beginPath(); ctx.arc(ex,ey,4,0,Math.PI*2); ctx.fill();
    ctx.font='10px "JetBrains Mono",monospace'; ctx.textAlign='center';
    ctx.fillText(`λ=${ev.lambda.toFixed(2)}`,ex+14,ey-8);
  });
}

function computeEigenvalues(m) {
  const [a,b,c,d] = m;
  const tr = a+d, det2 = a*d-b*c;
  const disc = tr*tr - 4*det2;
  if (disc < 0) {
    return [{real:false,lambda:0,vx:0,vy:0},{real:false,lambda:0,vx:0,vy:0}];
  }
  const sqrtD = Math.sqrt(disc);
  const l1 = (tr+sqrtD)/2, l2 = (tr-sqrtD)/2;
  function eigvec(l) {
    const r1 = [a-l, b], r2 = [c, d-l];
    let vx,vy;
    if (Math.abs(r1[1])>1e-9) { vx=r1[1]; vy=-(r1[0]); }
    else if (Math.abs(r2[1])>1e-9) { vx=r2[1]; vy=-(r2[0]); }
    else { vx=1; vy=0; }
    const n=Math.sqrt(vx*vx+vy*vy);
    if (n<1e-9) return [1,0];
    return [vx/n, vy/n];
  }
  const [vx1,vy1]=eigvec(l1), [vx2,vy2]=eigvec(l2);
  return [{real:true,lambda:l1,vx:vx1,vy:vy1},{real:true,lambda:l2,vx:vx2,vy:vy2}];
}

function drawLME(m) {
  if (!showLME) return;
  const dark = isDark();
  const { x, y } = lmeVec;
  const [a, b, c, d] = m;
  const col1x = a, col1y = c;
  const col2x = b, col2y = d;
  const scaledCol1 = [x * col1x, x * col1y];
  const scaledCol2 = [y * col2x, y * col2y];
  const outX = scaledCol1[0] + scaledCol2[0];
  const outY = scaledCol1[1] + scaledCol2[1];
  const [ox, oy] = wc(0, 0);

  const step = lmeAnimStep;
  const showInput  = step === -1 || step >= 0;
  const showCol1   = step === -1 || step >= 1;
  const showCol2   = step === -1 || step >= 2;
  const showOutput = step === -1 || step >= 3;

  if (showCol1) {
    const [e1x, e1y] = wc(scaledCol1[0], scaledCol1[1]);
    ctx.globalAlpha = 0.75;
    drawBasisArrow(ox, oy, e1x, e1y, dark ? '#6a9fd8' : '#2a5caa', null);
    ctx.globalAlpha = 1;
    ctx.font = '11px "JetBrains Mono",monospace';
    ctx.fillStyle = dark ? '#6a9fd8' : '#2a5caa';
    ctx.textAlign = 'left';
    ctx.fillText(`x·col₁ (${fmt(scaledCol1[0])}, ${fmt(scaledCol1[1])})`, e1x + 7, e1y - 4);
  }

  if (showCol2) {
    const startX = scaledCol1[0];
    const startY = scaledCol1[1];
    const [s2x, s2y] = wc(startX, startY);
    const [e2x, e2y] = wc(startX + scaledCol2[0], startY + scaledCol2[1]);
    ctx.globalAlpha = 0.75;
    drawBasisArrow(s2x, s2y, e2x, e2y, dark ? '#d4a06a' : '#8b5a2b', null);
    ctx.globalAlpha = 1;
    ctx.font = '11px "JetBrains Mono",monospace';
    ctx.fillStyle = dark ? '#d4a06a' : '#8b5a2b';
    ctx.textAlign = 'left';
    ctx.fillText(`y·col₂ (${fmt(scaledCol2[0])}, ${fmt(scaledCol2[1])})`, e2x + 7, e2y + 14);
  }

  if (showInput) {
    const [ivx, ivy] = wc(x, y);
    ctx.globalAlpha = 0.45;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ivx, ivy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(ivx, ivy, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.font = '11px "JetBrains Mono",monospace';
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText(`v=(${fmt(x)},${fmt(y)})`, ivx, ivy - 10);
  }

  if (showOutput) {
    const [rx, ry] = wc(outX, outY);
    ctx.globalAlpha = 1;
    drawBasisArrow(ox, oy, rx, ry, dark ? '#5aba80' : '#2e7d52', null);
    ctx.beginPath(); ctx.arc(rx, ry, 5.5, 0, Math.PI*2);
    ctx.fillStyle = dark ? '#5aba80' : '#2e7d52'; ctx.fill();
    ctx.font = 'bold 12px "JetBrains Mono",monospace';
    ctx.fillStyle = dark ? '#5aba80' : '#2e7d52';
    ctx.textAlign = 'left';
    ctx.fillText(`Av=(${fmt(outX)},${fmt(outY)})`, rx + 8, ry - 6);
  }
}

function fmt(v) { return Number.isInteger(v) ? v.toString() : v.toFixed(2).replace(/\.?0+$/, ''); }

function render() {
  ctx.clearRect(0,0,W,H);
  const dark=isDark();
  ctx.strokeStyle=dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.1)'; ctx.lineWidth=0.5;
  ctx.beginPath(); ctx.moveTo(0,CY); ctx.lineTo(W,CY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CX,0); ctx.lineTo(CX,H); ctx.stroke();
  const m = getM(animT);
  drawGrid(m);
  drawSquare(m, animT);
  if (animT >= 1) {
    const eig = computeEigenvalues(mat);
    drawEigenvectors(eig);
    drawLME(mat);
  }
  updateInfo();
}

function updateInfo() {
  const lang = document.body.getAttribute('data-active-lang')||'en';
  const dark = isDark();
  const [a,b,c,d] = mat;
  const det = a*d - b*c;
  const tr = a+d;
  const disc = tr*tr - 4*det;
  const eig = computeEigenvalues(mat);
  const detLabel  = lang==='ja'?'行列式':lang==='id'?'Determinan':'det(A)';
  const trLabel   = lang==='ja'?'トレース':lang==='id'?'Jejak':'trace(A)';
  const rankLabel = lang==='ja'?'ランク':lang==='id'?'Rank':'rank';
  const eigLabel  = lang==='ja'?'固有値':lang==='id'?'Nilai Eigen':'Eigenvalues';
  const singLabel = lang==='ja'?'(特異行列)':lang==='id'?'(singular)':'(singular)';
  const cplxLabel = lang==='ja'?'複素数':lang==='id'?'kompleks':'complex';
  const rank = Math.abs(det) > 1e-9 ? 2 : (a===0&&b===0&&c===0&&d===0 ? 0 : 1);
  let eigStr;
  if (!eig[0].real) {
    const re = (tr/2).toFixed(2);
    const im = (Math.sqrt(-disc)/2).toFixed(2);
    const modulus = Math.sqrt((tr/2)**2 + (Math.sqrt(-disc)/2)**2).toFixed(3);
    const angleDeg = (Math.atan2(Math.sqrt(-disc)/2, tr/2) * 180/Math.PI).toFixed(1);
    eigStr=`${cplxLabel}: ${re} ± ${im}i  |λ|=${modulus}, ∠=${angleDeg}°`;
  } else {
    eigStr=`λ₁ = ${eig[0].lambda.toFixed(3)}, λ₂ = ${eig[1].lambda.toFixed(3)}`;
  }
  const detColor = dark ? (det<0?'#d47070':'#5aba80') : (det<0?'#b84040':'#2e7d52');
  document.getElementById('matrix-info').innerHTML=`
    <div style="margin-bottom:5px"><span style="color:var(--ink3)">${detLabel} = </span><span style="color:${detColor};font-weight:500">${det.toFixed(4)}</span>${Math.abs(det)<1e-9?` <span style="color:var(--ink3);font-size:10px">${singLabel}</span>`:''}</div>
    <div style="margin-bottom:5px"><span style="color:var(--ink3)">${trLabel} = </span><span style="color:var(--ink)">${tr.toFixed(4)}</span></div>
    <div style="margin-bottom:5px"><span style="color:var(--ink3)">${rankLabel} = </span><span style="color:var(--ink)">${rank}</span></div>
    <div><span style="color:var(--ink3)">${eigLabel}: </span><span style="color:var(--ink)">${eigStr}</span></div>
  `;
}

function updateMatrix() {
  mat = [
    parseFloat(document.getElementById('m-a').value)||0,
    parseFloat(document.getElementById('m-b').value)||0,
    parseFloat(document.getElementById('m-c').value)||0,
    parseFloat(document.getElementById('m-d').value)||0,
  ];
  animT = 1;
  if (typeof refreshLMEPanel === 'function') refreshLMEPanel();
  render();
}

function setPreset(a,b,c,d) {
  document.getElementById('m-a').value=a;
  document.getElementById('m-b').value=b;
  document.getElementById('m-c').value=c;
  document.getElementById('m-d').value=d;
  updateMatrix(); startAnimation();
}

function runAnimationSequence(matrices, startBase) {
  if (startBase === undefined) startBase = [1,0,0,1];
  if (animRaf) cancelAnimationFrame(animRaf);
  let stepIdx = 0;
  function nextStep() {
    if (stepIdx >= matrices.length) return;
    matBase = stepIdx === 0 ? startBase : matrices[stepIdx-1];
    mat = matrices[stepIdx];
    animT = 0;
    const start = performance.now(), dur = 1000;
    function frame(now) {
      const t = Math.min(1, (now-start)/dur);
      animT = easeInOut(t); render();
      if (t < 1) animRaf = requestAnimationFrame(frame);
      else {
        animT = 1; render();
        stepIdx++;
        if (stepIdx < matrices.length) setTimeout(nextStep, 300);
        else animRaf = null;
      }
    }
    animRaf = requestAnimationFrame(frame);
  }
  nextStep();
}

function startAnimation() { runAnimationSequence([mat], [1,0,0,1]); }

function resetAnim() {
  if (animRaf) cancelAnimationFrame(animRaf);
  matBase = [1,0,0,1]; animT = 0; render();
}

function composeMatrices() {
  const B = [
    parseFloat(document.getElementById('m2-a').value)||0, parseFloat(document.getElementById('m2-b').value)||0,
    parseFloat(document.getElementById('m2-c').value)||0, parseFloat(document.getElementById('m2-d').value)||0
  ];
  const BA = multiply2x2(B, mat);
  runAnimationSequence([mat, BA], [1,0,0,1]);
  mat = BA;
  document.getElementById('m-a').value = BA[0].toFixed(2);
  document.getElementById('m-b').value = BA[1].toFixed(2);
  document.getElementById('m-c').value = BA[2].toFixed(2);
  document.getElementById('m-d').value = BA[3].toFixed(2);
  refreshLMEPanel();
}

function applyInverse() {
  const [a,b,c,d] = mat, det = a*d - b*c;
  if (Math.abs(det) < 1e-9) { alert("Matrix is singular!"); return; }
  const prevMat = [...mat];
  mat = [1,0,0,1];
  runAnimationSequence([[1,0,0,1]], prevMat);
  document.getElementById('m-a').value = 1; document.getElementById('m-b').value = 0;
  document.getElementById('m-c').value = 0; document.getElementById('m-d').value = 1;
  refreshLMEPanel();
}

function animateSVD() {
  const originalMat = [...mat];
  const { U, Sigma, V_T } = svd2x2(mat[0], mat[1], mat[2], mat[3]);
  const step1 = V_T;
  const step2 = multiply2x2(Sigma, V_T);
  const step3 = [...originalMat];
  runAnimationSequence([step1, step2, step3], [1,0,0,1]);
}

function updateLME() {
  lmeVec.x = parseFloat(document.getElementById('lme-x').value) || 0;
  lmeVec.y = parseFloat(document.getElementById('lme-y').value) || 0;
  refreshLMEPanel();
  render();
}

function refreshLMEPanel() {
  const lang = document.body.getAttribute('data-active-lang') || 'en';
  const [a, b, c, d] = mat;
  const { x, y } = lmeVec;
  const col1x = a, col1y = c;
  const col2x = b, col2y = d;
  const sc1x = x * col1x, sc1y = x * col1y;
  const sc2x = y * col2x, sc2y = y * col2y;
  const outX = sc1x + sc2x, outY = sc1y + sc2y;

  document.getElementById('lme-col1-val').textContent = `[ ${fmt(col1x)}, ${fmt(col1y)} ]`;
  document.getElementById('lme-col2-val').textContent = `[ ${fmt(col2x)}, ${fmt(col2y)} ]`;

  const eq = document.getElementById('lme-equation');
  eq.innerHTML =
    `<span class="lme-muted">A·v = </span>` +
    `<span class="lme-x">${fmt(x)}</span>` +
    `<span class="lme-muted"> · </span>` +
    `<span class="lme-col1">[ ${fmt(col1x)}, ${fmt(col1y)} ]</span>` +
    `<span class="lme-muted"> + </span>` +
    `<span class="lme-y">${fmt(y)}</span>` +
    `<span class="lme-muted"> · </span>` +
    `<span class="lme-col2">[ ${fmt(col2x)}, ${fmt(col2y)} ]</span>` +
    `<br>` +
    `<span class="lme-muted">     = </span>` +
    `<span class="lme-col1">[ ${fmt(sc1x)}, ${fmt(sc1y)} ]</span>` +
    `<span class="lme-muted"> + </span>` +
    `<span class="lme-col2">[ ${fmt(sc2x)}, ${fmt(sc2y)} ]</span>` +
    `<br>` +
    `<span class="lme-muted">     = </span>` +
    `<span class="lme-out">[ ${fmt(outX)}, ${fmt(outY)} ]</span>`;

  const steps = document.getElementById('lme-steps');
  const labels = {
    en: ['Input vector', 'Scale col₁ by x', 'Scale col₂ by y', 'Output = col₁ + col₂'],
    ja: ['入力ベクトル', 'col₁ を x 倍', 'col₂ を y 倍', '出力 = col₁ + col₂'],
    id: ['Vektor input', 'Skalakan col₁ dengan x', 'Skalakan col₂ dengan y', 'Output = col₁ + col₂'],
  };
  const L = labels[lang] || labels.en;
  steps.innerHTML = [
    { cls: 'step-input',  icon: '<i class="fa-solid fa-arrow-right"></i>', text: `${L[0]}: v = (${fmt(x)}, ${fmt(y)})` },
    { cls: 'step-col1',   icon: '<i class="fa-solid fa-xmark"></i>', text: `${L[1]}: (${fmt(sc1x)}, ${fmt(sc1y)})` },
    { cls: 'step-col2',   icon: '<i class="fa-solid fa-xmark"></i>', text: `${L[2]}: (${fmt(sc2x)}, ${fmt(sc2y)})` },
    { cls: 'step-output', icon: '<i class="fa-solid fa-equals"></i>', text: `${L[3]}: (${fmt(outX)}, ${fmt(outY)})` },
  ].map(s => `<div class="lme-step ${s.cls}"><span class="lme-step-icon">${s.icon}</span><span>${s.text}</span></div>`).join('');
}

function animateLMESteps() {
  if (lmeAnimRaf) cancelAnimationFrame(lmeAnimRaf);
  const btn = document.getElementById('lme-btn-animate');
  btn.classList.add('active');
  lmeAnimStep = 0;
  const steps = [-1, 0, 1, 2, 3];
  let si = 0;
  const dur = 700;
  let start = performance.now();

  function tick(now) {
    if (now - start >= dur) {
      si++;
      if (si >= steps.length) {
        lmeAnimStep = -1;
        render();
        btn.classList.remove('active');
        lmeAnimRaf = null;
        return;
      }
      lmeAnimStep = steps[si];
      start = now;
    }
    render();
    lmeAnimRaf = requestAnimationFrame(tick);
  }
  lmeAnimStep = steps[0];
  render();
  lmeAnimRaf = requestAnimationFrame(tick);
}

function resetLME() {
  if (lmeAnimRaf) cancelAnimationFrame(lmeAnimRaf);
  lmeAnimRaf = null;
  lmeAnimStep = -1;
  document.getElementById('lme-x').value = 2;
  document.getElementById('lme-y').value = 1;
  document.getElementById('lme-btn-animate').classList.remove('active');
  updateLME();
}

window.addEventListener('resize',resize);
window.addEventListener('themechange',()=>{const p=palette();if(typeof render==='function')render();});
resize();
updateTheoryNote();

AIMathTutor.renderCard('canvas-column-mat');

window.buildAIContext = function (userMessage = null) {
  const [a,b,c,d] = mat;
  const det = a*d - b*c;
  const tr  = a+d;
  const eig = computeEigenvalues(mat);
  let eigStr;
  if (!eig[0].real) {
    eigStr = `complex (rotation/scaling)`;
  } else {
    eigStr = `λ1=${eig[0].lambda.toFixed(3)}, λ2=${eig[1].lambda.toFixed(3)}`;
  }
  const context = [
    `Matrix A = [[${a}, ${b}], [${c}, ${d}]]`,
    `det(A) = ${det.toFixed(4)}${Math.abs(det)<1e-9?' (singular — collapses space to a line or point)':''}`,
    `trace(A) = ${tr.toFixed(4)}`,
    `Eigenvalues: ${eigStr}`,
    `LME input vector: (${lmeVec.x}, ${lmeVec.y}) → output Av = (${(a*lmeVec.x+b*lmeVec.y).toFixed(3)}, ${(c*lmeVec.x+d*lmeVec.y).toFixed(3)})`,
    `Controllable Parameter DOM IDs: mat-a, mat-b, mat-c, mat-d, lme-x, lme-y`
  ];
  const msgs = window.buildAIMessages('Matrix Transformations', context);
  AIMathTutor.ask(msgs, 'ai-card-body', userMessage);
};
updateMatrix();
updateLME();