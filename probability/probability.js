function toggleLangMenu(e) {
  e.stopPropagation();
  document.getElementById('lang-menu').classList.toggle('show');
}
window.addEventListener('click', () => {
  const m = document.getElementById('lang-menu');
  if(m) m.classList.remove('show');
});

function setLang(lang) {
  document.body.setAttribute('data-active-lang',lang);
  document.documentElement.setAttribute('lang',lang==='ja'?'ja':lang==='id'?'id':'en');
  ['en','ja','id'].forEach(l=>document.getElementById('lb-'+l).classList.toggle('active',l===lang));
  localStorage.setItem('aiml-lang',lang);
  updateTheoryNote(); render();
}
setTimeout(() => { const _sl=localStorage.getItem('aiml-lang'); if(_sl) setLang(_sl); }, 0);
function togglePanel(name){document.getElementById('ph-'+name)?.classList.toggle('collapsed');document.getElementById('pb-'+name)?.classList.toggle('collapsed');}


const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
let W,H;


let currentTab='normal';
let normalMu=0, normalSigma=1, normalK=1;
let bayesPA=0.3, bayesPBA=0.9, bayesPBNA=0.2;
let binomN=10, binomP=0.5;
let cltN=5, cltSamples=[];
let mvSx=1.0, mvSy=1.0, mvRho=0.0;
let mkPaa=0.7, mkPbb=0.4, mkSteps=0, mkState=[1.0, 0.0];

function stepMarkov() {
  const pA = mkState[0]*mkPaa + mkState[1]*(1-mkPbb);
  const pB = mkState[0]*(1-mkPaa) + mkState[1]*mkPbb;
  mkState = [pA, pB]; mkSteps++; render();
}

function setTab(t){
  currentTab=t;
  ['normal','multivar','bayes','binom','clt','markov'].forEach(id=>{
    const el=document.getElementById('tab-'+id);
    if(el) el.classList.toggle('active',id===t);
    const c=document.getElementById('ctrl-'+id);
    if(c)c.style.display=id===t?'flex':'none';
  });
  if(t==='clt'&&!cltSamples.length) runCLT();
  if(t==='markov'){ mkSteps=0; mkState=[1.0, 0.0]; }
  updateTheoryNote(); render();
}


function normalPDF(x,mu,sigma){return Math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));}
function normalCDF(x,mu,sigma){
  const z=(x-mu)/(sigma*Math.SQRT2);
  return 0.5*(1+erf(z));
}
function erf(x){
  const t=1/(1+0.3275911*Math.abs(x));
  const p=t*(0.254829592+t*(-0.284496736+t*(1.421413741+t*(-1.453152027+t*1.061405429))));
  const r=1-p*Math.exp(-x*x);
  return x>=0?r:-r;
}
function binomCoeff(n,k){
  if(k<0||k>n) return 0;
  if(k===0||k===n) return 1;
  let r=1; for(let i=0;i<Math.min(k,n-k);i++){r=r*(n-i)/(i+1);} return r;
}
function binomPMF(k,n,p){return binomCoeff(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k);}


function clearCanvas(){ctx.clearRect(0,0,W,H);}
function drawAxes(xMin,xMax,yMin,yMax,pad=40){
  const dark=isDark();
  ctx.strokeStyle=dark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.2)'; ctx.lineWidth=1;
  const toX=x=>(x-xMin)/(xMax-xMin)*(W-2*pad)+pad;
  const toY=y=>H-pad-(y-yMin)/(yMax-yMin)*(H-2*pad);
  ctx.beginPath(); ctx.moveTo(pad,H-pad); ctx.lineTo(W-pad,H-pad); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad,pad); ctx.lineTo(pad,H-pad); ctx.stroke();
  ctx.font='9px "JetBrains Mono",monospace'; ctx.fillStyle=dark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.3)'; ctx.textAlign='center';
  const xStep=Math.ceil((xMax-xMin)/8);
  for(let v=Math.ceil(xMin);v<=xMax;v+=xStep){
    const px=toX(v); if(px<pad||px>W-pad) continue;
    ctx.fillText(v,px,H-pad+14);
    ctx.strokeStyle=dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)'; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(px,pad); ctx.lineTo(px,H-pad); ctx.stroke();
  }
  return {toX,toY};
}


function renderNormal(){
  clearCanvas();
  const dark=isDark();
  const pad=45, xMin=-5,xMax=5;
  const yMax=normalPDF(normalMu,normalMu,normalSigma)*1.15;
  const {toX,toY}=drawAxes(xMin,xMax,0,yMax,pad);
  const acColor=dark?'#9a88d8':'#5b4a9e';
  
  const lo=normalMu-normalK*normalSigma, hi=normalMu+normalK*normalSigma;
  ctx.fillStyle=dark?'rgba(154,136,216,0.25)':'rgba(91,74,158,0.15)';
  ctx.beginPath();
  ctx.moveTo(toX(lo),toY(0));
  for(let x=lo;x<=hi;x+=0.02){
    const y=normalPDF(x,normalMu,normalSigma);
    ctx.lineTo(toX(x),toY(y));
  }
  ctx.lineTo(toX(hi),toY(0)); ctx.closePath(); ctx.fill();
  
  ctx.strokeStyle=acColor; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath();
  let first=true;
  for(let x=xMin;x<=xMax;x+=0.04){
    const y=normalPDF(x,normalMu,normalSigma);
    if(y<0) continue;
    const px=toX(x),py=toY(y);
    if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);
  }
  ctx.stroke();
  
  ctx.setLineDash([6,4]); ctx.strokeStyle=acColor; ctx.globalAlpha=0.5; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(toX(normalMu),pad); ctx.lineTo(toX(normalMu),H-pad); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha=1;
  
  const prob=normalCDF(normalMu+normalK*normalSigma,normalMu,normalSigma)-normalCDF(normalMu-normalK*normalSigma,normalMu,normalSigma);
  const lang=document.body.getAttribute('data-active-lang')||'en';
  const areaLabel=lang==='ja'?`μ±${normalK.toFixed(1)}σ内の確率`:lang==='id'?`Prob dalam μ±${normalK.toFixed(1)}σ`:`Prob within μ±${normalK.toFixed(1)}σ`;
  document.getElementById('normal-result').innerHTML=`
    <div><span style="color:var(--ink3)">μ = </span><strong>${normalMu.toFixed(1)}</strong>, <span style="color:var(--ink3)">σ = </span><strong>${normalSigma.toFixed(2)}</strong></div>
    <div><span style="color:var(--ink3)">σ² = </span><strong>${(normalSigma*normalSigma).toFixed(4)}</strong></div>
    <div style="margin-top:4px"><span style="color:var(--ink3)">${areaLabel} = </span><span style="color:${acColor};font-weight:500">${(prob*100).toFixed(2)}%</span></div>
    <div style="color:var(--ink3);font-size: 13px;margin-top:3px">peak = ${normalPDF(normalMu,normalMu,normalSigma).toFixed(4)}</div>
  `;
}


function renderBayes(){
  clearCanvas();
  const dark=isDark();
  const PB=bayesPA*bayesPBA+(1-bayesPA)*bayesPBNA;
  const PAB=bayesPA*bayesPBA/PB;
  const lang=document.body.getAttribute('data-active-lang')||'en';
  
  const pad=30, W2=W-2*pad, H2=H-2*pad-60;
  
  const xA=pad+bayesPA*W2;
  
  const h1=H2*bayesPA, h2=H2*(1-bayesPA);
  const colors={
    ABtrue:  dark?'rgba(90,186,128,0.5)':'rgba(46,125,82,0.45)',
    ABfalse: dark?'rgba(154,136,216,0.35)':'rgba(91,74,158,0.28)',
    nABtrue: dark?'rgba(212,112,112,0.4)':'rgba(184,64,64,0.35)',
    nABfalse:dark?'rgba(90,186,128,0.2)':'rgba(46,125,82,0.15)',
  };
  function drawRect(x,y,w,h,col,label,sub){
    ctx.fillStyle=col; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.12)'; ctx.lineWidth=1;
    ctx.strokeRect(x,y,w,h);
    if(w>30&&h>18){
      ctx.fillStyle=dark?'rgba(255,255,255,0.85)':'rgba(0,0,0,0.75)';
      ctx.font=`bold ${Math.min(11,w/5)}px "JetBrains Mono",monospace`; ctx.textAlign='center';
      ctx.fillText(label,x+w/2,y+h/2-4);
      if(sub&&h>30){ctx.font=`9px "JetBrains Mono",monospace`;ctx.fillText(sub,x+w/2,y+h/2+9);}
    }
  }
  
  const y1=pad;
  const wAB=bayesPBA*W2*0.9, wAnB=(1-bayesPBA)*W2*0.9;
  drawRect(pad,y1,wAB,h1,colors.ABtrue,'P(A)·P(B|A)',`=${(bayesPA*bayesPBA).toFixed(3)}`);
  drawRect(pad+wAB,y1,wAnB,h1,colors.ABfalse,'P(A)·P(¬B|A)',`=${(bayesPA*(1-bayesPBA)).toFixed(3)}`);
  
  const y2=pad+h1+6;
  const wNAB=bayesPBNA*W2*0.9, wNAnB=(1-bayesPBNA)*W2*0.9;
  drawRect(pad,y2,wNAB,h2,colors.nABtrue,'P(¬A)·P(B|¬A)',`=${((1-bayesPA)*bayesPBNA).toFixed(3)}`);
  drawRect(pad+wNAB,y2,wNAnB,h2,colors.nABfalse,'P(¬A)·P(¬B|¬A)',`=${((1-bayesPA)*(1-bayesPBNA)).toFixed(3)}`);
  
  const labelCol=dark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.5)';
  ctx.fillStyle=labelCol; ctx.font='10px "JetBrains Mono",monospace'; ctx.textAlign='left';
  ctx.fillText(`P(A)=${bayesPA.toFixed(2)}`,pad,H-55);
  ctx.fillText(`P(¬A)=${(1-bayesPA).toFixed(2)}`,pad,H-43);
  ctx.fillText(`P(B)=${PB.toFixed(3)}`,pad+160,H-55);
  
  const posterior=lang==='ja'?'事後確率':lang==='id'?'Posterior':'Posterior';
  const prior=lang==='ja'?'事前確率':lang==='id'?'Prior':'Prior';
  document.getElementById('bayes-result').innerHTML=`
    <div style="font-size: 13px;color:var(--ink3);margin-bottom:4px">P(A|B) = P(B|A)·P(A) / P(B)</div>
    <div><span style="color:var(--ink3)">${prior} P(A) = </span>${bayesPA.toFixed(2)}</div>
    <div><span style="color:var(--ink3)">P(B) = </span>${PB.toFixed(4)}</div>
    <div style="margin-top:4px"><span style="color:var(--ink3)">${posterior} P(A|B) = </span><span style="color:${dark?'#5aba80':'#2e7d52'};font-weight:600;font-size:13px">${PAB.toFixed(4)}</span></div>
  `;
}


function renderBinom(){
  clearCanvas();
  const dark=isDark();
  const vals=[];
  for(let k=0;k<=binomN;k++) vals.push({k,p:binomPMF(k,binomN,binomP)});
  const yMax=Math.max(...vals.map(v=>v.p))*1.15;
  const pad=45;
  const {toX,toY}=drawAxes(0,binomN,0,yMax,pad);
  const barW=Math.max(4,Math.min(30,(W-2*pad)/(binomN+1)*0.7));
  const mean=binomN*binomP,variance=binomN*binomP*(1-binomP);
  const acColor=dark?'#6a9fd8':'#2a5caa';
  vals.forEach(({k,p})=>{
    const px=toX(k);
    const isMean=Math.abs(k-Math.round(mean))<0.5;
    ctx.fillStyle=isMean?(dark?'rgba(90,186,128,0.7)':'rgba(46,125,82,0.7)'):`rgba(${dark?'106,159,216':'42,92,170'},0.55)`;
    ctx.strokeStyle=acColor; ctx.lineWidth=0.8;
    const y=toY(p),h=H-pad-y;
    ctx.fillRect(px-barW/2,y,barW,h); ctx.strokeRect(px-barW/2,y,barW,h);
    if(barW>16){
      ctx.fillStyle=dark?'rgba(255,255,255,0.55)':'rgba(0,0,0,0.5)';
      ctx.font='8px "JetBrains Mono",monospace'; ctx.textAlign='center';
      if(p>yMax*0.05) ctx.fillText(p.toFixed(2),px,y-4);
    }
  });
  const lang=document.body.getAttribute('data-active-lang')||'en';
  const meanLabel=lang==='ja'?'平均':lang==='id'?'Rata-rata':'Mean';
  const varLabel=lang==='ja'?'分散':lang==='id'?'Variansi':'Variance';
  document.getElementById('binom-result').innerHTML=`
    <div><span style="color:var(--ink3)">n=${binomN}, p=${binomP.toFixed(2)}</span></div>
    <div><span style="color:var(--ink3)">${meanLabel} μ = np = </span><strong>${mean.toFixed(3)}</strong></div>
    <div><span style="color:var(--ink3)">${varLabel} σ² = np(1−p) = </span><strong>${variance.toFixed(3)}</strong></div>
    <div style="color:var(--ink3);font-size: 13px;margin-top:3px">P(X=E[X]) = ${binomPMF(Math.round(mean),binomN,binomP).toFixed(4)}</div>
  `;
}


function sampleSource(src){
  if(src==='uniform') return Math.random();
  if(src==='exp') return -Math.log(1-Math.random());
  if(src==='bern') return Math.random()<0.3?1:0;
  return Math.random();
}
function runCLT(){
  const src=document.getElementById('clt-src').value;
  cltN=parseInt(document.getElementById('clt-n').value)||5;
  cltSamples=[];
  for(let i=0;i<800;i++){
    let s=0; for(let j=0;j<cltN;j++) s+=sampleSource(src);
    cltSamples.push(s/cltN);
  }
  if(!W) return;
  render();
}
function renderCLT(){
  clearCanvas();
  if(!cltSamples.length) return;
  const dark=isDark();
  const mn=Math.min(...cltSamples),mx=Math.max(...cltSamples);
  if(mx===mn){clearCanvas();return;} 
  const bins=40, binW=(mx-mn)/bins;
  if(binW<=0) return;
  const hist=new Array(bins).fill(0);
  cltSamples.forEach(v=>{
    const b=Math.min(bins-1,Math.floor((v-mn)/binW));
    hist[b]++;
  });
  const yMax=Math.max(...hist)/cltSamples.length/binW*1.15;
  if(!isFinite(yMax)||yMax<=0) return;
  const pad=45;
  const {toX,toY}=drawAxes(mn,mx,0,yMax,pad);
  const bw=Math.max(1,(toX(mn+binW)-toX(mn))-1);
  const acColor=dark?'#5aba80':'#2e7d52';
  hist.forEach((count,i)=>{
    const x=mn+i*binW, density=count/cltSamples.length/binW;
    ctx.fillStyle=dark?'rgba(90,186,128,0.45)':'rgba(46,125,82,0.38)';
    ctx.strokeStyle=acColor; ctx.lineWidth=0.6;
    const py=toY(density),ph=H-pad-py;
    ctx.fillRect(toX(x),py,bw,ph); ctx.strokeRect(toX(x),py,bw,ph);
  });
  
  const mean=cltSamples.reduce((a,b)=>a+b,0)/cltSamples.length;
  const variance=cltSamples.reduce((a,v)=>a+(v-mean)**2,0)/cltSamples.length;
  const sigma=Math.sqrt(variance);
  if(sigma>0){
    ctx.strokeStyle=dark?'#d47070':'#b84040'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath();
    let first2=true;
    for(let x=mn;x<=mx;x+=(mx-mn)/200){
      const y=Math.exp(-0.5*((x-mean)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
      if(!isFinite(y)){first2=true;continue;}
      const px2=toX(x),py2=toY(y);
      if(first2){ctx.moveTo(px2,py2);first2=false;}else ctx.lineTo(px2,py2);
    }
    ctx.stroke();
  }
  const lang=document.body.getAttribute('data-active-lang')||'en';
  const sampLabel=lang==='ja'?'サンプル数':lang==='id'?'Sampel':'Samples';
  const sumLabel=lang==='ja'?`n=${cltN} 個の平均`:lang==='id'?`Rata-rata ${cltN} sampel`:`Mean of ${cltN} samples`;
  document.getElementById('clt-result').innerHTML=`
    <div><span style="color:var(--ink3)">${sampLabel} = </span>800</div>
    <div><span style="color:var(--ink3)">${sumLabel}</span></div>
    <div><span style="color:var(--ink3)">μ̂ = </span><strong>${mean.toFixed(4)}</strong></div>
    <div><span style="color:var(--ink3)">σ̂ = </span><strong>${sigma.toFixed(4)}</strong></div>
    <div style="color:var(--ink3);font-size: 13px;margin-top:3px">→ N(μ, σ²/n) as n→∞</div>
  `;
}

function renderMultivariate(){
  clearCanvas();
  const dark=isDark(), res=8, cx=W/2, cy=H/2, scale=40;
  const c = 1 / (2*Math.PI*mvSx*mvSy*Math.sqrt(1-mvRho*mvRho));
  const coef = -0.5 / (1-mvRho*mvRho);
  
  for (let py=0; py<H; py+=res) {
    for (let px=0; px<W; px+=res) {
      const x=(px-cx)/scale, y=(cy-py)/scale;
      const z1 = (x/mvSx)**2, z2 = 2*mvRho*x*y/(mvSx*mvSy), z3 = (y/mvSy)**2;
      const pdf = c * Math.exp(coef * (z1 - z2 + z3));
      const norm = Math.min(1, pdf / c);
      ctx.fillStyle = dark?`rgba(154,136,216,${norm})`:`rgba(91,74,158,${norm})`;
      ctx.fillRect(px, py, res, res);
    }
  }
  ctx.strokeStyle=dark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.2)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();
  
  document.getElementById('multivar-result').innerHTML=`
    <div><span style="color:var(--ink3)">det(Σ) = </span><strong>${((mvSx**2)*(mvSy**2)*(1-mvRho**2)).toFixed(3)}</strong></div>
    <div><span style="color:var(--ink3)">Max Density = </span><strong>${c.toFixed(3)}</strong></div>
  `;
}

function renderMarkov(){
  clearCanvas();
  const dark=isDark(), cx=W/2, cy=H/2;
  const pA=mkState[0], pB=mkState[1], pba=1-mkPaa, pab=1-mkPbb;
  const piA = (1-mkPbb) / ((1-mkPaa) + (1-mkPbb)), piB = (1-mkPaa) / ((1-mkPaa) + (1-mkPbb));
  const r=40, dist=100, ax=cx-dist, bx=cx+dist;
  
  ctx.strokeStyle = dark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.5)'; ctx.lineWidth=2;
  ctx.font='12px "JetBrains Mono",monospace'; ctx.fillStyle=dark?'rgba(255,255,255,0.8)':'rgba(0,0,0,0.8)';
  ctx.textAlign='center';
  
  ctx.beginPath(); ctx.moveTo(ax, cy-15); ctx.quadraticCurveTo(cx, cy-50, bx, cy-15); ctx.stroke();
  ctx.fillText(`P(B|A)=${pba.toFixed(2)}`, cx, cy-55);
  ctx.beginPath(); ctx.moveTo(bx, cy+15); ctx.quadraticCurveTo(cx, cy+50, ax, cy+15); ctx.stroke();
  ctx.fillText(`P(A|B)=${pab.toFixed(2)}`, cx, cy+60);
  
  ctx.beginPath(); ctx.arc(ax-30, cy, 25, Math.PI/2, Math.PI*3/2); ctx.stroke();
  ctx.fillText(`P(A|A)=${mkPaa.toFixed(2)}`, ax-60, cy);
  ctx.beginPath(); ctx.arc(bx+30, cy, 25, -Math.PI/2, Math.PI/2); ctx.stroke();
  ctx.fillText(`P(B|B)=${mkPbb.toFixed(2)}`, bx+60, cy);
  
  const cA = dark?`rgba(212,112,112,${0.3+0.7*pA})`:`rgba(184,64,64,${0.3+0.7*pA})`;
  const cB = dark?`rgba(90,186,128,${0.3+0.7*pB})`:`rgba(46,125,82,${0.3+0.7*pB})`;
  
  ctx.fillStyle=cA; ctx.beginPath(); ctx.arc(ax, cy, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle=cB; ctx.beginPath(); ctx.arc(bx, cy, r, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = dark?'#fff':'#000'; ctx.font='bold 16px "DM Sans",sans-serif';
  ctx.fillText(`State A`, ax, cy-5); ctx.fillText(`${(pA*100).toFixed(1)}%`, ax, cy+15);
  ctx.fillText(`State B`, bx, cy-5); ctx.fillText(`${(pB*100).toFixed(1)}%`, bx, cy+15);
  
  document.getElementById('markov-result').innerHTML=`
    <div><span style="color:var(--ink3)">Steps = </span><strong>${mkSteps}</strong></div>
    <div><span style="color:var(--ink3)">Current = </span>[${pA.toFixed(3)}, ${pB.toFixed(3)}]</div>
    <div style="margin-top:6px"><span style="color:var(--ink3)">Steady State π = </span>[${piA.toFixed(3)}, ${piB.toFixed(3)}]</div>
  `;
}

function render(){
  if(!W) return;
  if(currentTab==='normal') renderNormal();
  else if(currentTab==='multivar') renderMultivariate();
  else if(currentTab==='bayes') renderBayes();
  else if(currentTab==='binom') renderBinom();
  else if(currentTab==='clt') renderCLT();
  else if(currentTab==='markov') renderMarkov();
}

function updateTheoryNote(){
  const lang=document.body.getAttribute('data-active-lang')||'en';
  const notes={
    normal:{
      en:`<p><strong>Normal Distribution:</strong> The Normal distribution $\\mathcal{N}(\\mu, \\sigma^2)$ is central to statistics and AI. Its probability density function is $f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\left(-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2\\right)$. It governs noise modeling and neural network weight initialization.</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">Reference: Bishop, C. M. (2006). <em>Pattern Recognition and Machine Learning</em>. Springer.</p>`,
      ja:`<p><strong>正規分布:</strong> 正規分布 $\\mathcal{N}(\\mu, \\sigma^2)$ は統計とAIの中心です。確率密度関数は $f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\left(-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2\\right)$。ノイズモデリングやニューラルネットの重み初期化を支配します。</p>`,
      id:`<p><strong>Distribusi Normal:</strong> Distribusi Normal $\\mathcal{N}(\\mu, \\sigma^2)$ merupakan inti dari statistik dan AI. Fungsi kepadatan probabilitasnya adalah $f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\left(-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2\\right)$.</p>`
    },
    multivar:{
      en:`<p><strong>Multivariate Normal:</strong> A generalization of the normal distribution to higher dimensions. Governed by a mean vector $\\mathbf{\\mu}$ and a covariance matrix $\\mathbf{\\Sigma}$. In machine learning, it forms the basis of Gaussian Mixture Models (GMMs) and Gaussian Processes.</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">Reference: Murphy, K. P. (2012). <em>Machine Learning: A Probabilistic Perspective</em>. MIT Press.</p>`,
      ja:`<p><strong>多変量正規分布:</strong> 正規分布の高次元への一般化。平均ベクトル $\\mathbf{\\mu}$ と共分散行列 $\\mathbf{\\Sigma}$ に支配されます。機械学習では、ガウス混合モデル（GMM）やガウス過程の基礎となります。</p>`,
      id:`<p><strong>Normal Multivariat:</strong> Generalisasi distribusi normal ke dimensi yang lebih tinggi. Diatur oleh vektor rata-rata $\\mathbf{\\mu}$ dan matriks kovarian $\\mathbf{\\Sigma}$.</p>`
    },
    bayes:{
      en:`<p><strong>Bayes' Theorem:</strong> Evaluates the posterior probability $P(A|B) = \\frac{P(B|A)P(A)}{P(B)}$. It updates prior beliefs $P(A)$ given new evidence $P(B|A)$. Fundamental to Bayesian Deep Learning, generative modeling, and variational inference.</p>`,
      ja:`<p><strong>ベイズの定理:</strong> 事後確率 $P(A|B) = \\frac{P(B|A)P(A)}{P(B)}$ を評価します。新しい証拠が与えられたときの事前信念を更新します。</p>`,
      id:`<p><strong>Teorema Bayes:</strong> Mengevaluasi probabilitas posterior $P(A|B) = \\frac{P(B|A)P(A)}{P(B)}$. Ini memperbarui keyakinan prior mengingat bukti baru.</p>`
    },
    binom:{
      en:`<p><strong>Binomial Distribution:</strong> Models the number of successes $k$ in $n$ independent Bernoulli trials, each with success probability $p$. PMF: $P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}$. Foundational for understanding cross-entropy and logistic regression classification.</p>`,
      ja:`<p><strong>二項分布:</strong> 成功確率 $p$ の独立したベルヌーイ試行を $n$ 回行ったときの成功数 $k$ をモデル化します。</p>`,
      id:`<p><strong>Distribusi Binomial:</strong> Memodelkan jumlah keberhasilan $k$ dalam $n$ percobaan Bernoulli independen.</p>`
    },
    clt:{
      en:`<p><strong>Central Limit Theorem:</strong> Asserts that the normalized sum of independent, identically distributed (i.i.d.) random variables tends toward a standard normal distribution. $Z_n = \\frac{\\bar{X}_n - \\mu}{\\sigma / \\sqrt{n}} \\to \\mathcal{N}(0,1)$.</p>`,
      ja:`<p><strong>中心極限定理:</strong> 独立同分布の確率変数の正規化された和は、元の分布に関わらず標準正規分布に収束することを示します。</p>`,
      id:`<p><strong>Teorema Limit Pusat:</strong> Menegaskan bahwa jumlah ternormalisasi dari variabel acak i.i.d. cenderung menuju distribusi normal standar.</p>`
    },
    markov:{
      en:`<p><strong>Markov Chains:</strong> A stochastic model describing a sequence of possible events where the probability of each event depends only on the state attained in the previous event. Crucial for Reinforcement Learning (MDPs) and PageRank.</p>`,
      ja:`<p><strong>マルコフ連鎖:</strong> 各事象の確率が直前の状態のみに依存する確率過程モデル。強化学習（MDP）やPageRankに不可欠です。</p>`,
      id:`<p><strong>Rantai Markov:</strong> Model stokastik yang mendeskripsikan urutan peristiwa di mana probabilitas setiap peristiwa hanya bergantung pada keadaan sebelumnya.</p>`
    }
  };
  const note=notes[currentTab]||notes.normal;
  const el = document.getElementById('theory-text');
  if (el) { el.innerHTML = note[lang]||note.en; }
  if (window.MathJax) { MathJax.typesetPromise([el]).catch(()=>{}); }
}

function resize(){
  const dpr=window.devicePixelRatio||1,cssW=canvas.offsetWidth,cssH=440;
  canvas.width=cssW*dpr; canvas.height=cssH*dpr;
  canvas.style.height=cssH+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  W=cssW; H=cssH; render();
}
window.addEventListener('resize',resize);
window.addEventListener('themechange',()=>render());
resize();

runCLT();
updateTheoryNote();

AIMathTutor.renderCard('canvas-column-prob');

window.buildAIContext = function (userMessage = null) {
  const context = [`Active tab: ${currentTab}`];
  let params = [];

  if (currentTab === 'normal') {
    const prob = normalCDF(normalMu + normalK*normalSigma, normalMu, normalSigma) - normalCDF(normalMu - normalK*normalSigma, normalMu, normalSigma);
    context.push(`Normal distribution N(μ=${normalMu.toFixed(1)}, σ=${normalSigma.toFixed(2)})`);
    context.push(`Shaded area ±${normalK.toFixed(1)}σ = ${(prob*100).toFixed(2)}%`);
    params = ['normal-mu', 'normal-sigma', 'normal-k'];
  } else if (currentTab === 'bayes') {
    const PB = bayesPA*bayesPBA + (1-bayesPA)*bayesPBNA;
    const PAB = bayesPA*bayesPBA / PB;
    context.push(`P(A)=${bayesPA.toFixed(2)}, P(B|A)=${bayesPBA.toFixed(2)}, P(B|¬A)=${bayesPBNA.toFixed(2)}`);
    context.push(`P(B)=${PB.toFixed(4)}, posterior P(A|B)=${PAB.toFixed(4)}`);
    params = ['bayes-pa', 'bayes-pba', 'bayes-pbna'];
  } else if (currentTab === 'binom') {
    context.push(`Binomial B(n=${binomN}, p=${binomP.toFixed(2)}), mean=${(binomN*binomP).toFixed(2)}, variance=${(binomN*binomP*(1-binomP)).toFixed(3)}`);
    params = ['binom-n', 'binom-p'];
  } else if (currentTab === 'clt') {
    context.push(`CLT with n=${cltN} samples per group, source = ${document.getElementById('clt-src').value}`);
    params = ['clt-n'];
  } else if (currentTab === 'multivar') {
    context.push(`Multivariate Normal: σ_x=${mvSx.toFixed(1)}, σ_y=${mvSy.toFixed(1)}, correlation ρ=${mvRho.toFixed(2)}`);
    params = ['mv-sx', 'mv-sy', 'mv-rho'];
  } else if (currentTab === 'markov') {
    context.push(`Markov chain: P(A|A)=${mkPaa.toFixed(2)}, P(B|B)=${mkPbb.toFixed(2)}, steps=${mkSteps}`);
    context.push(`Current state: P(A)=${mkState[0].toFixed(3)}, P(B)=${mkState[1].toFixed(3)}`);
    params = ['mk-paa', 'mk-pbb'];
  }

  if (params.length > 0) {
    context.push(`Controllable Parameter DOM IDs: ${params.join(', ')}`);
  }

  const msgs = window.buildAIMessages('Probability & Statistics', context);
  AIMathTutor.ask(msgs, 'ai-card-body', userMessage);
};