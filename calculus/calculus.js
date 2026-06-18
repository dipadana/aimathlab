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
  document.documentElement.setAttribute('lang', lang==='ja'?'ja':lang==='id'?'id':'en');
  ['en','ja','id'].forEach(l=>document.getElementById('lb-'+l).classList.toggle('active',l===lang));
  localStorage.setItem('aiml-lang', lang);
  updateTheoryNote(); render();
}
setTimeout(() => { const _sl=localStorage.getItem('aiml-lang'); if(_sl) setLang(_sl); }, 0);

function togglePanel(name) {
  document.getElementById('ph-'+name)?.classList.toggle('collapsed');
  document.getElementById('pb-'+name)?.classList.toggle('collapsed');
}


const canvas=document.getElementById('canvas'), ctx=canvas.getContext('2d');
let W,H,CX,CY;
const UNIT=55;
function wc(x,y){return [CX+x*UNIT,CY-y*UNIT];}


let currentTab='deriv';
function setTab(t) {
  currentTab=t;
  ['deriv','integ','taylor','gd','gd2d'].forEach(id=>{
    const tabEl=document.getElementById('tab-'+id);
    if(tabEl) tabEl.classList.toggle('active',id===t);
    const c=document.getElementById('ctrl-'+id);
    if(c) c.style.display=id===t?'flex':'none';
  });
  document.getElementById('ctrl-fn').style.display=(t==='gd'||t==='gd2d')?'none':'block';
  updateTheoryNote(); render();
}


const FNS = {
  sin:  {f:x=>Math.sin(x),         df:x=>Math.cos(x),         label:'sin(x)'},
  x2:   {f:x=>x*x,                 df:x=>2*x,                 label:'x²'},
  x3:   {f:x=>x*x*x-2*x,           df:x=>3*x*x-2,             label:'x³−2x'},
  exp:  {f:x=>Math.exp(x)/5,       df:x=>Math.exp(x)/5,       label:'eˣ/5'},
  gauss:{f:x=>Math.exp(-x*x/2),    df:x=>-x*Math.exp(-x*x/2), label:'e^(−x²/2)'},
  gd:   {f:x=>0.3*x*x*x*x-2*x*x+Math.sin(3*x)/2, df:x=>1.2*x*x*x-4*x+3*Math.cos(3*x)/2, label:'0.3x⁴ − 2x²'},
};
let fnKey='sin';
function updateFn(){fnKey=document.getElementById('fn-select').value;render();}
function fn(){return FNS[currentTab==='gd'?'gd':fnKey];}


let xPos=1.0;


let taylorA=0.0, taylorN=3;
function evalTaylor(x, a, n) {
  let sum=0, term=1;
  for (let k=0; k<=n; k++) {
    let deriv=0;
    if (fnKey==='sin') { const d=[Math.sin(a), Math.cos(a), -Math.sin(a), -Math.cos(a)]; deriv=d[k%4]; }
    else if (fnKey==='x2') { deriv=k===0?a*a : k===1?2*a : k===2?2 : 0; }
    else if (fnKey==='x3') { deriv=k===0?a*a*a-2*a : k===1?3*a*a-2 : k===2?6*a : k===3?6 : 0; }
    else if (fnKey==='exp') { deriv=Math.exp(a)/5; }
    else if (fnKey==='gauss') {
      let h_p2=0, h_p1=1, h=1;
      for (let i=1; i<=k; i++) { h=a*h_p1-(i-1)*h_p2; h_p2=h_p1; h_p1=h; }
      deriv=(k%2===1?-1:1)*h*Math.exp(-a*a/2);
    }
    sum += deriv*term; term *= (x-a)/(k+1);
  }
  return sum;
}


let intA=-2, intB=2, riemannN=10;


let gdX0=3.5, gdLR=0.2, gdPath=[], gdRunning=false, gdTimerId=null;
function resetGD(){
  gdPath=[{x:gdX0,y:FNS.gd.f(gdX0)}];
  if(gdTimerId!==null){clearInterval(gdTimerId);gdTimerId=null;gdRunning=false;}
  render();
}
function stepGD(){
  if(!gdPath.length) gdPath=[{x:gdX0,y:FNS.gd.f(gdX0)}];
  const last=gdPath[gdPath.length-1];
  const grad=FNS.gd.df(last.x);
  const nx=last.x-gdLR*grad;
  gdPath.push({x:nx,y:FNS.gd.f(nx)});
  render();
}
function runGD(){
  if(gdRunning){clearInterval(gdTimerId);gdTimerId=null;gdRunning=false;return;}
  gdRunning=true;
  gdTimerId=setInterval(()=>{
    stepGD();
    const last=gdPath[gdPath.length-1];
    if(Math.abs(FNS.gd.df(last.x))<0.001||gdPath.length>200){clearInterval(gdTimerId);gdTimerId=null;gdRunning=false;}
  },80);
}


const FNS2D = { gd2d: { f: (x,y) => x*x/2 + y*y + Math.cos(x)*Math.sin(y), dfx: (x,y) => x - Math.sin(x)*Math.sin(y), dfy: (x,y) => 2*y + Math.cos(x)*Math.cos(y) } };
let gd2dX0=-3, gd2dY0=3, gd2dLR=0.1, gd2dPath=[], gd2dRunning=false, gd2dTimerId=null;
function resetGD2D(){ gd2dPath=[{x:gd2dX0,y:gd2dY0}]; if(gd2dTimerId){clearInterval(gd2dTimerId);gd2dTimerId=null;gd2dRunning=false;} render(); }
function stepGD2D(){
  if(!gd2dPath.length) gd2dPath=[{x:gd2dX0,y:gd2dY0}];
  const last=gd2dPath[gd2dPath.length-1];
  const gx=FNS2D.gd2d.dfx(last.x,last.y), gy=FNS2D.gd2d.dfy(last.x,last.y);
  gd2dPath.push({x:last.x-gd2dLR*gx, y:last.y-gd2dLR*gy}); render();
}
function runGD2D(){
  if(gd2dRunning){clearInterval(gd2dTimerId);gd2dTimerId=null;gd2dRunning=false;return;}
  gd2dRunning=true;
  gd2dTimerId=setInterval(()=>{
    stepGD2D(); const last=gd2dPath[gd2dPath.length-1];
    const gx=FNS2D.gd2d.dfx(last.x,last.y), gy=FNS2D.gd2d.dfy(last.x,last.y);
    if(Math.sqrt(gx*gx+gy*gy)<0.001 || gd2dPath.length>300){clearInterval(gd2dTimerId);gd2dTimerId=null;gd2dRunning=false;}
  },40);
}


function drawAxes(){
  const dark=isDark();
  
  ctx.strokeStyle=dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.05)'; ctx.lineWidth=0.5;
  for(let i=-10;i<=10;i++){
    const [gx,]=wc(i,0),[,gy]=wc(0,i);
    ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke();
  }
  
  ctx.strokeStyle=dark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.22)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,CY); ctx.lineTo(W,CY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CX,0); ctx.lineTo(CX,H); ctx.stroke();
  
  ctx.font='9px "JetBrains Mono",monospace'; ctx.fillStyle=dark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.3)'; ctx.textAlign='center';
  for(let i=-8;i<=8;i++){
    if(i===0) continue;
    const [gx,]=wc(i,0),[,gy]=wc(0,i);
    ctx.fillText(i,gx,CY+12);
    ctx.textAlign='right'; ctx.fillText(i,CX-5,gy+4); ctx.textAlign='center';
  }
}

function plotCurve(f, color, lw=1.8, dashArr=[]) {
  const dark=isDark();
  ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.lineCap='round';
  ctx.setLineDash(dashArr);
  ctx.beginPath();
  let first=true;
  for(let px=0;px<=W;px+=1.5){
    const x=(px-CX)/UNIT;
    const y=f(x);
    if(!isFinite(y)||Math.abs(y)>20){first=true;continue;}
    const [,py]=wc(0,y);
    if(first){ctx.moveTo(px,py);first=false;}
    else ctx.lineTo(px,py);
  }
  ctx.stroke(); ctx.setLineDash([]);
}


function renderDerivative(){
  const dark=isDark();
  const F=fn();
  
  
  plotCurve(F.f, dark?'#d47070':'#b84040',2);
  
  const y0=F.f(xPos), slope=F.df(xPos);
  const tangentF=x=>y0+slope*(x-xPos);
  plotCurve(tangentF, dark?'#d4a06a':'#9a6e00',1.5,[6,5]);
  
  const [px,py]=wc(xPos,y0);
  ctx.fillStyle=dark?'#d47070':'#b84040';
  ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=isDark()?'#141312':'#fdfcf8';
  ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2); ctx.fill();
  
  const [bx,by]=wc(xPos,0);
  ctx.setLineDash([3,4]);
  ctx.strokeStyle=dark?'rgba(212,112,112,0.3)':'rgba(184,64,64,0.3)';
  ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(bx,by); ctx.stroke();
  ctx.setLineDash([]);
  
  const lang=document.body.getAttribute('data-active-lang')||'en';
  const fLabel=lang==='ja'?'値':lang==='id'?'nilai':'f(x)';
  const dfLabel="f'(x)";
  document.getElementById('deriv-result').innerHTML=`
    <div><span style="color:var(--ink3)">x = </span><strong>${xPos.toFixed(3)}</strong></div>
    <div><span style="color:var(--ink3)">${fLabel} = </span><strong>${F.f(xPos).toFixed(4)}</strong></div>
    <div><span style="color:var(--ink3)">${dfLabel} = </span><span style="color:${dark?'#d4a06a':'#9a6e00'};font-weight:500">${F.df(xPos).toFixed(4)}</span></div>
    <div style="margin-top:4px;color:var(--ink3);font-size:10px">slope × Δx → Δy</div>
  `;
}

function renderIntegral(){
  const dark=isDark();
  const F=fn();
  const a=Math.min(intA,intB), b=Math.max(intA,intB);
  
  const step=(b-a)/riemannN;
  ctx.fillStyle=dark?'rgba(154,136,216,0.25)':'rgba(91,74,158,0.18)';
  for(let i=0;i<riemannN;i++){
    const xi=a+i*step+step/2;
    const yi=F.f(xi);
    const [rx,]=wc(a+i*step,0);
    const [rx2,]=wc(a+(i+1)*step,0);
    const [,ry]=wc(0,yi);
    const rectH=CY-ry;
    ctx.fillRect(rx,ry>CY?CY:ry,rx2-rx,Math.abs(rectH));
  }
  
  plotCurve(F.f,dark?'#9a88d8':'#5b4a9e',2);
  
  ctx.setLineDash([5,4]);
  ctx.strokeStyle=dark?'rgba(154,136,216,0.5)':'rgba(91,74,158,0.5)'; ctx.lineWidth=1;
  const [ax,]=wc(a,0),[bx2,]=wc(b,0);
  const [,aTop]=wc(0,F.f(a)),[,bTop]=wc(0,F.f(b));
  ctx.beginPath(); ctx.moveTo(ax,aTop); ctx.lineTo(ax,CY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx2,bTop); ctx.lineTo(bx2,CY); ctx.stroke();
  ctx.setLineDash([]);
  
  let integral=0;
  const ns=200;
  const hs=(b-a)/ns;
  for(let i=0;i<=ns;i++){
    const x=a+i*hs, w=(i===0||i===ns)?1:(i%2===0?2:4);
    integral+=w*F.f(x);
  }
  integral*=hs/3;
  const lang=document.body.getAttribute('data-active-lang')||'en';
  const rLabel=lang==='ja'?'リーマン和':lang==='id'?'Jumlah Riemann':'Riemann sum';
  const approxLabel=lang==='ja'?'数値積分 (Simpson)':lang==='id'?'Integral numerik (Simpson)':'Numerical integral (Simpson)';
  document.getElementById('integ-result').innerHTML=`
    <div><span style="color:var(--ink3)">∫ ${F.label} dx</span></div>
    <div><span style="color:var(--ink3)">[${a.toFixed(1)}, ${b.toFixed(1)}]</span></div>
    <div style="margin-top:4px"><span style="color:var(--ink3)">${approxLabel} ≈ </span><strong>${integral.toFixed(5)}</strong></div>
    <div style="color:var(--ink3);font-size: 13px;margin-top:3px">${rLabel} n = ${riemannN}</div>
  `;
}

function renderGradientDescent(){
  const dark=isDark();
  const F=FNS.gd;
  
  plotCurve(F.f,dark?'#d4a06a':'#9a6e00',2);
  
  if(gdPath.length>1){
    ctx.strokeStyle=dark?'rgba(90,186,128,0.7)':'rgba(46,125,82,0.7)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    gdPath.forEach((p,i)=>{
      const [px,py]=wc(p.x,p.y);
      if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    });
    ctx.stroke();
    
    gdPath.forEach((p,i)=>{
      const [px,py]=wc(p.x,p.y);
      const r=i===0?5:i===gdPath.length-1?6:2.5;
      const col=i===gdPath.length-1?(dark?'#5aba80':'#2e7d52'):(dark?'rgba(90,186,128,0.5)':'rgba(46,125,82,0.4)');
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();
    });
  }
  const lang=document.body.getAttribute('data-active-lang')||'en';
  const stepLabel=lang==='ja'?'ステップ':lang==='id'?'Langkah':'Step';
  const lrLabel=lang==='ja'?'学習率 (η)':lang==='id'?'Learning rate (η)':'Learning rate (η)';
  const gradLabel=lang==='ja'?'勾配':lang==='id'?'Gradien':'Gradient';
  const convergeLabel=lang==='ja'?'収束':lang==='id'?'Konvergen':'Converged';
  const last=gdPath.length?gdPath[gdPath.length-1]:{x:gdX0,y:F.f(gdX0)};
  const grad=F.df(last.x);
  document.getElementById('gd-result').innerHTML=`
    <div><span style="color:var(--ink3)">${stepLabel} = </span><strong>${gdPath.length}</strong></div>
    <div><span style="color:var(--ink3)">x = </span><strong>${last.x.toFixed(5)}</strong></div>
    <div><span style="color:var(--ink3)">f(x) = </span><strong>${last.y.toFixed(5)}</strong></div>
    <div><span style="color:var(--ink3)">${gradLabel} = </span><span style="color:${dark?'#d47070':'#b84040'}">${grad.toFixed(5)}</span></div>
    <div><span style="color:var(--ink3)">${lrLabel} = </span>${gdLR.toFixed(2)}</div>
    ${Math.abs(grad)<0.001?`<div style="color:${dark?'#5aba80':'#2e7d52'};margin-top:4px;font-size:10px"> ${convergeLabel}</div>`:''}
  `;
}

function drawContourMap() {
  const dark=isDark(), res=10;
  for (let py=0; py<H; py+=res) {
    for (let px=0; px<W; px+=res) {
      const x=(px-CX)/UNIT, y=(CY-py)/UNIT, v=FNS2D.gd2d.f(x,y);
      const norm=Math.min(1, Math.max(0, v/12));
      ctx.fillStyle=dark?`rgba(212,112,112,${norm*0.8})`:`rgba(184,64,64,${norm*0.6})`;
      ctx.fillRect(px, py, res, res);
    }
  }
}

function renderTaylor() {
  const dark = isDark(), F = fn();
  plotCurve(F.f, dark?'#d47070':'#b84040', 2);
  const tFn = (x) => evalTaylor(x, taylorA, taylorN);
  plotCurve(tFn, dark?'#5aba80':'#2e7d52', 2, [5,5]);
  const [px, py] = wc(taylorA, F.f(taylorA));
  ctx.fillStyle = dark?'#5aba80':'#2e7d52';
  ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
  
  document.getElementById('taylor-result').innerHTML = `
    <div><span style="color:var(--ink3)">Expansion point a = </span><strong>${taylorA.toFixed(2)}</strong></div>
    <div><span style="color:var(--ink3)">Degree n = </span><strong>${taylorN}</strong></div>
    <div style="margin-top:4px;color:var(--ink3);font-size:10px">Approximating using $P_n(x)$ around $a$.</div>
  `;
  if (window.MathJax) { MathJax.typesetPromise([document.getElementById('taylor-result')]).catch(()=>{}); }
}

function renderGD2D() {
  const dark = isDark();
  if(gd2dPath.length>1){
    ctx.strokeStyle = dark?'#5aba80':'#2e7d52'; ctx.lineWidth = 2; ctx.beginPath();
    gd2dPath.forEach((p,i)=>{ const [px,py]=wc(p.x,p.y); if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); });
    ctx.stroke();
    gd2dPath.forEach((p,i)=>{
      const [px,py]=wc(p.x,p.y), r=i===0?5:i===gd2dPath.length-1?6:2.5;
      ctx.fillStyle = i===gd2dPath.length-1?(dark?'#5aba80':'#2e7d52'):(dark?'#ffffff':'#000000');
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();
    });
  }
  const last = gd2dPath.length?gd2dPath[gd2dPath.length-1]:{x:gd2dX0,y:gd2dY0};
  const gx = FNS2D.gd2d.dfx(last.x, last.y), gy = FNS2D.gd2d.dfy(last.x, last.y), gradMag = Math.sqrt(gx*gx+gy*gy);
  document.getElementById('gd2d-result').innerHTML=`
    <div><span style="color:var(--ink3)">Step = </span><strong>${gd2dPath.length}</strong></div>
    <div><span style="color:var(--ink3)">(x, y) = </span><strong>(${last.x.toFixed(3)}, ${last.y.toFixed(3)})</strong></div>
    <div><span style="color:var(--ink3)">f(x, y) = </span><strong>${FNS2D.gd2d.f(last.x,last.y).toFixed(4)}</strong></div>
    <div><span style="color:var(--ink3)">|∇f| = </span><span style="color:${dark?'#d47070':'#b84040'}">${gradMag.toFixed(4)}</span></div>
  `;
}

function render(){
  if(!W) return;
  ctx.clearRect(0,0,W,H);
  if (currentTab==='gd2d') drawContourMap();
  drawAxes();
  if(currentTab==='deriv') renderDerivative();
  else if(currentTab==='integ') renderIntegral();
  else if(currentTab==='taylor') renderTaylor();
  else if(currentTab==='gd2d') renderGD2D();
  else renderGradientDescent();
}

function updateTheoryNote(){
  const lang=document.body.getAttribute('data-active-lang')||'en';
  const notes={
    deriv:{
      en:`<p><strong>Derivative:</strong> The derivative $f'(x)$ represents the instantaneous rate of change or the slope of the tangent line. Formally, $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$. In Deep Learning, derivatives represent the gradient of the loss function concerning the network weights, evaluated via Backpropagation.</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">Reference: Goodfellow, I., Bengio, Y., & Courville, A. (2016). <em>Deep Learning</em>. MIT Press.</p>`,
      ja:`<p><strong>微分:</strong> 微分 $f'(x)$ は瞬間変化率、すなわち接線の傾きを表します。数式的には $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$ と定義されます。深層学習において、微分は誤差逆伝播法（バックプロパゲーション）による重みの勾配を表します。</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">参考文献: Goodfellow, I., Bengio, Y., & Courville, A. (2016). <em>Deep Learning</em>. MIT Press.</p>`,
      id:`<p><strong>Turunan (Derivative):</strong> Turunan $f'(x)$ mewakili laju perubahan sesaat atau kemiringan garis singgung. Secara formal, $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$. Dalam Deep Learning, turunan mewakili gradien fungsi kerugian terhadap bobot jaringan, dievaluasi melalui Backpropagation.</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">Referensi: Goodfellow, I., Bengio, Y., & Courville, A. (2016). <em>Deep Learning</em>. MIT Press.</p>`
    },
    integ:{
      en:`<p><strong>Integral:</strong> The definite integral $\\int_{a}^{b} f(x)\\,dx$ computes the signed area under the curve. This is fundamental in probability theory for computing expectations and probability densities, such as $P(a \\le X \\le b) = \\int_a^b p(x)\\,dx$.</p>`,
      ja:`<p><strong>積分:</strong> 定積分 $\\int_{a}^{b} f(x)\\,dx$ は曲線の下の符号付き面積を計算します。これは確率論における期待値や確率密度の計算の基礎であり、例えば $P(a \\le X \\le b) = \\int_a^b p(x)\\,dx$ のように用いられます。</p>`,
      id:`<p><strong>Integral:</strong> Integral tentu $\\int_{a}^{b} f(x)\\,dx$ menghitung luas bertanda di bawah kurva. Ini sangat mendasar dalam teori probabilitas untuk menghitung ekspektasi dan kepadatan probabilitas, seperti $P(a \\le X \\le b) = \\int_a^b p(x)\\,dx$.</p>`
    },
    taylor:{
      en:`<p><strong>Taylor Series:</strong> A Taylor series approximates a function as an infinite sum of terms calculated from its derivatives at a single point $a$. <br> $P_n(x) = \\sum_{k=0}^n \\frac{f^{(k)}(a)}{k!} (x-a)^k$. Higher degree $n$ yields a closer approximation around $a$.</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">Reference: Stewart, J. (2015). <em>Calculus: Early Transcendentals</em>. Cengage Learning.</p>`,
      ja:`<p><strong>テイラー展開:</strong> 関数をある一点 $a$ における微係数を用いて、多項式の無限和として近似します。<br> $P_n(x) = \\sum_{k=0}^n \\frac{f^{(k)}(a)}{k!} (x-a)^k$。次数 $n$ が高いほど、$a$ の近くでの近似精度が向上します。</p>`,
      id:`<p><strong>Deret Taylor:</strong> Deret Taylor memperkirakan suatu fungsi sebagai jumlah tak terhingga dari suku-suku yang dihitung dari turunannya pada satu titik $a$. <br> $P_n(x) = \\sum_{k=0}^n \\frac{f^{(k)}(a)}{k!} (x-a)^k$.</p>`
    },
    gd:{
      en:`<p><strong>Gradient Descent:</strong> A first-order iterative optimization algorithm for finding a local minimum of a differentiable function. The step is defined by $\\mathbf{x}_{n+1} = \\mathbf{x}_n - \\eta \\nabla f(\\mathbf{x}_n)$, where $\\eta$ is the learning rate.</p><p style="font-size: 13px;color:var(--ink3);margin-top:8px">Reference: Nocedal, J., & Wright, S. (2006). <em>Numerical Optimization</em>. Springer.</p>`,
      ja:`<p><strong>勾配降下法:</strong> 微分可能な関数の局所的最小値を見つけるための反復最適化アルゴリズム。更新は $\\mathbf{x}_{n+1} = \\mathbf{x}_n - \\eta \\nabla f(\\mathbf{x}_n)$ で行われます（$\\eta$ は学習率）。</p>`,
      id:`<p><strong>Penurunan Gradien (Gradient Descent):</strong> Algoritma optimasi iteratif untuk menemukan minimum lokal dari fungsi yang dapat diturunkan. Langkah didefinisikan sebagai $\\mathbf{x}_{n+1} = \\mathbf{x}_n - \\eta \\nabla f(\\mathbf{x}_n)$.</p>`
    },
    gd2d:{
      en:`<p><strong>2D Gradient Descent:</strong> In multidimensional space, the gradient $\\nabla f(x, y) = \\left[ \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y} \\right]^T$ points in the direction of the steepest ascent. We step in the opposite direction ($- \\nabla f$) to find the minimum of the surface contour.</p>`,
      ja:`<p><strong>2D勾配降下法:</strong> 多次元空間では、勾配 $\\nabla f(x, y) = \\left[ \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y} \\right]^T$ が最大傾斜方向を指します。表面の等高線の最小値を見つけるために、逆方向 ($- \\nabla f$) に進みます。</p>`,
      id:`<p><strong>Penurunan Gradien 2D:</strong> Dalam ruang multidimensi, gradien menunjuk ke arah pendakian paling curam. Kita melangkah ke arah yang berlawanan untuk menemukan minimum dari kontur permukaan.</p>`
    }
  };
  const note=notes[currentTab]||notes.deriv;
  const el = document.getElementById('theory-text');
  if (el) { el.innerHTML = note[lang]||note.en; }
  if (window.MathJax) { MathJax.typesetPromise([el]).catch(()=>{}); }
}

function resize(){
  const dpr=window.devicePixelRatio||1,cssW=canvas.offsetWidth,cssH=480;
  canvas.width=cssW*dpr; canvas.height=cssH*dpr;
  canvas.style.height=cssH+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  W=cssW; H=cssH; CX=W/2; CY=H/2;
  render();
}

window.addEventListener('resize',resize);
window.addEventListener('themechange', () => render());
resize();

gdPath=[{x:gdX0,y:FNS.gd.f(gdX0)}];
gd2dPath=[{x:gd2dX0,y:gd2dY0}];
updateTheoryNote();

AIMathTutor.renderCard('canvas-column-calc');

window.buildAIContext = function (userMessage = null) {
  const F = fn();
  const context = [`Active tab: ${currentTab}`, `Function: ${F ? F.label : 'n/a'}`];
  let params = [];

  if (currentTab === 'deriv') {
    context.push(`x = ${xPos.toFixed(3)}, f(x) = ${F.f(xPos).toFixed(4)}, f'(x) = ${F.df(xPos).toFixed(4)}`);
    params = ['x-slider'];
  } else if (currentTab === 'integ') {
    context.push(`Integration bounds: a = ${intA.toFixed(1)}, b = ${intB.toFixed(1)}, Riemann partitions n = ${riemannN}`);
    params = ['int-a', 'int-b', 'riemann-n'];
  } else if (currentTab === 'taylor') {
    context.push(`Taylor expansion point a = ${taylorA.toFixed(2)}, degree n = ${taylorN}`);
    params = ['taylor-a', 'taylor-n'];
  } else if (currentTab === 'gd') {
    const last = gdPath.length ? gdPath[gdPath.length-1] : {x: gdX0, y: FNS.gd.f(gdX0)};
    context.push(`Gradient descent: x₀ = ${gdX0}, η = ${gdLR}, steps = ${gdPath.length}`);
    context.push(`Current position: x = ${last.x.toFixed(4)}, f(x) = ${last.y.toFixed(4)}, gradient = ${FNS.gd.df(last.x).toFixed(4)}`);
    params = ['gd-x0', 'gd-lr'];
  } else if (currentTab === 'gd2d') {
    const last2 = gd2dPath.length ? gd2dPath[gd2dPath.length-1] : {x: gd2dX0, y: gd2dY0};
    context.push(`2D gradient descent: η = ${gd2dLR}, steps = ${gd2dPath.length}`);
    context.push(`Current position: (${last2.x.toFixed(3)}, ${last2.y.toFixed(3)}), f = ${FNS2D.gd2d.f(last2.x, last2.y).toFixed(4)}`);
    params = ['gd2d-lr'];
  }

  if (params.length > 0) {
    context.push(`Controllable Parameter DOM IDs: ${params.join(', ')}`);
  }

  const msgs = window.buildAIMessages('Calculus Visualizer', context);
  AIMathTutor.ask(msgs, 'ai-card-body', userMessage);
};