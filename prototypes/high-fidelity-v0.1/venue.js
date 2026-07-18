(() => {
  const canvas = document.querySelector("#venueCanvas");
  const countEl = document.querySelector("#participantCount");
  const counts = {
    kanazawa: Number(document.querySelector("#kanazawaCount").textContent),
    noto: Number(document.querySelector("#notoCount").textContent),
    hakusan: Number(document.querySelector("#hakusanCount").textContent)
  };
  let total = Number(countEl.textContent);
  let energy = 1;
  let audioCtx = null;

  function setupCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = rect.width*dpr;
    canvas.height = rect.height*dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx,w:rect.width,h:rect.height};
  }

  const layers = Array.from({length: 160}, (_,i)=>({
    x: Math.random(), y: Math.random(),
    speed: .15+Math.random()*.75,
    radius: .8+Math.random()*3,
    group: i%3,
    phase: Math.random()*Math.PI*2
  }));

  let t = 0;
  function frame(){
    const {ctx,w,h}=setupCanvas();
    t += .007*energy;
    const bg = ctx.createRadialGradient(w*.47,h*.48,20,w*.47,h*.48,Math.max(w,h)*.75);
    bg.addColorStop(0,"#35534a");
    bg.addColorStop(.45,"#233a34");
    bg.addColorStop(1,"#17201e");
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,w,h);

    ctx.globalCompositeOperation="screen";
    layers.forEach((p,i)=>{
      const groupOffset = p.group===0 ? -w*.18 : p.group===1 ? 0 : w*.18;
      const wave = Math.sin(t*(1+p.speed)+p.phase)*36;
      const x = w*.5 + groupOffset + (p.x-.5)*w*.45 + wave;
      const y = h*.48 + (p.y-.5)*h*.64 + Math.cos(t*1.4+p.phase)*18;
      ctx.beginPath();
      ctx.fillStyle = p.group===0 ? "rgba(201,213,230,.34)" : p.group===1 ? "rgba(104,149,160,.30)" : "rgba(156,185,171,.30)";
      ctx.arc(x,y,p.radius*(1+energy*.08),0,Math.PI*2);
      ctx.fill();
    });

    ctx.globalCompositeOperation="source-over";
    for(let j=0;j<8;j++){
      ctx.beginPath();
      ctx.strokeStyle=`rgba(255,255,255,${0.035+j*.008})`;
      ctx.lineWidth=1;
      for(let x=0;x<=w;x+=10){
        const y=h*.5+(j-4)*22+Math.sin(x*.008+t*1.7+j)*18;
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    requestAnimationFrame(frame);
  }
  frame();

  function tone(freq,duration=.5,gain=.035){
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended") audioCtx.resume();
    const now=audioCtx.currentTime;
    const osc=audioCtx.createOscillator();
    const g=audioCtx.createGain();
    osc.type="sine"; osc.frequency.value=freq;
    g.gain.setValueAtTime(.0001,now);
    g.gain.exponentialRampToValueAtTime(gain,now+.04);
    g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(now); osc.stop(now+duration+.05);
  }

  document.querySelector("#simulateMemory").addEventListener("click",()=>{
    total += 1;
    countEl.textContent=total;
    const keys=Object.keys(counts);
    const key=keys[Math.floor(Math.random()*keys.length)];
    counts[key]+=1;
    document.querySelector(key==="kanazawa"?"#kanazawaCount":key==="noto"?"#notoCount":"#hakusanCount").textContent=counts[key];
    energy=Math.min(2.2,energy+.16);
    tone(key==="kanazawa"?392:key==="noto"?174:246,.55,.04);
    countEl.animate([{transform:"scale(1)"},{transform:"scale(1.18)"},{transform:"scale(1)"}],{duration:500,easing:"ease"});
    const title=document.querySelector("#venueTitle");
    title.textContent = total>=18 ? "石川の記憶が、ひとつに醸された" : total>=15 ? "雪と海風、水脈が重なる" : "雪と海風のあいだ";
  });

  document.querySelector("#venueReplay").addEventListener("click",()=>{
    [174,220,261,330].forEach((f,i)=>setTimeout(()=>tone(f,1.4,.045),i*180));
    energy=2.5;
    setTimeout(()=>energy=1.3,2600);
    document.querySelector("#venueTitle").animate(
      [{letterSpacing:".04em",opacity:.7},{letterSpacing:".12em",opacity:1},{letterSpacing:".04em",opacity:1}],
      {duration:2600,easing:"cubic-bezier(.22,.61,.36,1)"}
    );
  });
})();