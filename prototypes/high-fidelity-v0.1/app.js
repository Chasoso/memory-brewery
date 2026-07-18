(() => {
  const state = {
    screen: "intro",
    sound: true,
    color: "#678077",
    gesture: [],
    gestureLabel: "ゆるやかな波",
    land: null,
    landTitle: "",
    landSubtitle: "",
    future: "",
    ending: "converge",
    audioStarted: false
  };

  const screens = [...document.querySelectorAll(".screen")];
  const soundToggle = document.querySelector("#soundToggle");
  let audioCtx = null;

  function ensureAudio() {
    if (!state.sound) return;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    state.audioStarted = true;
  }

  function tone(freq = 220, duration = 0.28, gainValue = 0.06, type = "sine") {
    if (!state.sound) return;
    ensureAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function chord(base = 196) {
    [1, 1.25, 1.5].forEach((m, i) => setTimeout(() => tone(base*m, .7, .035, i === 1 ? "triangle" : "sine"), i*70));
  }

  soundToggle.addEventListener("click", () => {
    state.sound = !state.sound;
    soundToggle.style.opacity = state.sound ? "1" : ".35";
    if (state.sound) tone(440, .12, .03);
  });

  document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
      ensureAudio();
      const target = btn.dataset.next;
      if (target === "odori") {
        tone(220, .3, .045);
        setTimeout(() => showScreen("odori"), 120);
      } else if (target === "opening") {
        prepareOpening();
        chord(state.land === "sea" ? 174 : state.land === "water" ? 220 : 196);
        showScreen(target);
        startOpeningAnimation();
      } else {
        tone(330, .16, .03);
        showScreen(target);
      }
    });
  });

  function showScreen(name) {
    state.screen = name;
    screens.forEach(s => s.classList.toggle("is-active", s.dataset.screen === name));
    window.scrollTo({ top: 0, behavior: "instant" });
    if (name === "odori") startOdori();
    if (name === "nakazoe") animateLandCards();
  }

  // Intro canvas
  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  function animateIntro() {
    const canvas = document.querySelector("#introCanvas");
    let t = 0;
    const particles = Array.from({length: 32}, (_, i) => ({
      a: Math.random()*Math.PI*2,
      r: 20 + Math.random()*95,
      s: .0015 + Math.random()*.002,
      z: 1 + Math.random()*2.4
    }));
    function frame() {
      const {ctx,w,h} = setupCanvas(canvas);
      ctx.clearRect(0,0,w,h);
      t += 1;
      particles.forEach((p, i) => {
        p.a += p.s * (i%2 ? 1 : -1) * 15;
        const x = w/2 + Math.cos(p.a) * p.r * (1 + Math.sin(t*.006+i)*.08);
        const y = h/2 + Math.sin(p.a) * p.r*.58;
        ctx.beginPath();
        ctx.fillStyle = i%4===0 ? "rgba(143,111,99,.32)" : "rgba(103,128,119,.32)";
        ctx.arc(x,y,p.z,0,Math.PI*2);
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    frame();
  }
  animateIntro();

  // Gesture canvas
  const gestureCanvas = document.querySelector("#gestureCanvas");
  let drawing = false;
  let last = null;

  function gesturePoint(e) {
    const rect = gestureCanvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top, t: performance.now() };
  }

  function beginGesture(e) {
    e.preventDefault();
    drawing = true;
    ensureAudio();
    last = gesturePoint(e);
    state.gesture.push(last);
    drawGesture();
  }
  function moveGesture(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = gesturePoint(e);
    state.gesture.push(p);
    if (state.gesture.length % 7 === 0) tone(180 + (p.x/Math.max(1,gestureCanvas.clientWidth))*180, .08, .012, "triangle");
    last = p;
    drawGesture();
    document.querySelector("#hatsuzoeNext").disabled = state.gesture.length < 4;
  }
  function endGesture() {
    drawing = false;
    if (state.gesture.length > 3) {
      const total = state.gesture.reduce((acc,p,i,arr) => {
        if (!i) return acc;
        return acc + Math.hypot(p.x-arr[i-1].x,p.y-arr[i-1].y);
      },0);
      state.gestureLabel = total > 900 ? "勢いのある流れ" : total > 480 ? "ほどける波" : "ゆるやかな波";
    }
  }

  ["pointerdown"].forEach(ev => gestureCanvas.addEventListener(ev, beginGesture));
  gestureCanvas.addEventListener("pointermove", moveGesture);
  window.addEventListener("pointerup", endGesture);

  function drawGesture() {
    const {ctx,w,h} = setupCanvas(gestureCanvas);
    ctx.clearRect(0,0,w,h);
    const grd = ctx.createRadialGradient(w*.5,h*.42,20,w*.5,h*.42,Math.max(w,h)*.65);
    grd.addColorStop(0, "rgba(255,255,255,.65)");
    grd.addColorStop(1, "rgba(217,231,227,.05)");
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);

    if (!state.gesture.length) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = state.color;
    ctx.globalAlpha = .76;
    ctx.lineWidth = 12;
    ctx.beginPath();
    state.gesture.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.stroke();

    ctx.globalAlpha = .18;
    ctx.lineWidth = 30;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  document.querySelectorAll(".color-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      state.color = chip.dataset.color;
      document.querySelectorAll(".color-chip").forEach(c => c.classList.toggle("is-selected", c===chip));
      tone(260 + [...document.querySelectorAll(".color-chip")].indexOf(chip)*40, .12, .025);
      drawGesture();
    });
  });

  // Odori
  let odoriTimer = null;
  function startOdori() {
    clearInterval(odoriTimer);
    let sec = 10;
    document.querySelector("#odoriSeconds").textContent = sec;
    animateOdori();
    odoriTimer = setInterval(() => {
      sec -= 1;
      document.querySelector("#odoriSeconds").textContent = sec;
      if (sec <= 0) {
        clearInterval(odoriTimer);
        chord(220);
        setTimeout(() => showScreen("nakazoe"), 350);
      }
    }, 1000);
  }

  let odoriAnimationStarted = false;
  function animateOdori() {
    if (odoriAnimationStarted) return;
    odoriAnimationStarted = true;
    const canvas = document.querySelector("#odoriCanvas");
    let t = 0;
    function frame() {
      const {ctx,w,h} = setupCanvas(canvas);
      ctx.clearRect(0,0,w,h);
      t += .018;
      for (let i=0;i<28;i++) {
        const a = i/28*Math.PI*2 + t*(i%2 ? 1 : -1);
        const r = 48 + Math.sin(t*1.8+i)*22 + i*.8;
        const x = w/2 + Math.cos(a)*r;
        const y = h/2 + Math.sin(a)*r;
        ctx.beginPath();
        ctx.fillStyle = state.color + (i%3===0 ? "88" : "44");
        ctx.arc(x,y,1.5+(i%4)*.6,0,Math.PI*2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  // Land selection
  function animateLandCards() {
    document.querySelectorAll(".land-card").forEach((c,i) => {
      c.animate([{opacity:0, transform:"translateY(12px)"},{opacity:1, transform:"translateY(0)"}], {duration:420, delay:i*90, fill:"both", easing:"cubic-bezier(.22,.61,.36,1)"});
    });
  }

  document.querySelectorAll(".land-card").forEach(card => {
    card.addEventListener("click", () => {
      state.land = card.dataset.land;
      state.landTitle = card.dataset.title;
      state.landSubtitle = card.dataset.subtitle;
      document.querySelectorAll(".land-card").forEach(c => c.classList.toggle("is-selected", c===card));
      document.querySelector("#nakazoeNext").disabled = false;
      document.querySelector("#landSourceText").textContent =
        `${state.landTitle}｜${state.landSubtitle}。石川県・気象・地理関連データを作品パラメーターへ変換。`;
      tone(state.land==="snow" ? 420 : state.land==="sea" ? 174 : 260, .32, .035, "sine");
    });
  });

  // Future selection
  const futureInput = document.querySelector("#futureInput");
  document.querySelectorAll(".future-card").forEach(card => {
    card.addEventListener("click", () => {
      state.future = card.dataset.future;
      state.ending = card.dataset.ending;
      futureInput.value = "";
      document.querySelectorAll(".future-card").forEach(c => c.classList.toggle("is-selected", c===card));
      document.querySelector("#tomezoeNext").disabled = false;
      tone(300 + [...document.querySelectorAll(".future-card")].indexOf(card)*45, .22, .03);
    });
  });
  futureInput.addEventListener("input", () => {
    state.future = futureInput.value.trim();
    state.ending = "float";
    document.querySelectorAll(".future-card").forEach(c => c.classList.remove("is-selected"));
    document.querySelector("#tomezoeNext").disabled = !state.future;
  });

  function colorName(hex) {
    return ({
      "#678077":"深い青緑",
      "#8f6f63":"赤茶",
      "#c5b87b":"稲穂色",
      "#6f7890":"青鼠",
      "#d9d4c7":"白練"
    })[hex] || "淡い色";
  }

  function prepareOpening() {
    const land = state.landTitle || "石川の土地";
    const future = state.future || "次の一杯";
    const titles = {
      snow: ["雪間の", future],
      sea: ["潮騒の", future],
      water: ["水脈の", future]
    };
    const prefix = (titles[state.land] || ["記憶の", future])[0];
    const suffix = (titles[state.land] || ["記憶の", future])[1];
    const title = `${prefix}${suffix}`;
    document.querySelector("#memoryTitle").textContent = title.length > 11 ? title.slice(0,11) : title;
    document.querySelector("#memorySummary").textContent =
      `${colorName(state.color)}の${state.gestureLabel}に、${land}と、未来の「${future}」を重ねました。`;
    document.querySelector("#recipeHatsu").textContent = `${colorName(state.color)}・${state.gestureLabel}`;
    document.querySelector("#recipeNaka").textContent = land;
    document.querySelector("#recipeTome").textContent = future;
  }

  let openingParticles = [];
  let openingRaf = null;
  function startOpeningAnimation() {
    const canvas = document.querySelector("#openingCanvas");
    openingParticles = Array.from({length: 110}, (_,i)=>({
      x: Math.random(),
      y: Math.random(),
      s: .2 + Math.random()*.7,
      r: .6 + Math.random()*2.4,
      phase: Math.random()*Math.PI*2
    }));
    let t = 0;
    cancelAnimationFrame(openingRaf);
    function frame() {
      const {ctx,w,h} = setupCanvas(canvas);
      t += .012;
      ctx.clearRect(0,0,w,h);
      const bg = ctx.createRadialGradient(w*.52,h*.37,10,w*.52,h*.42,Math.max(w,h)*.7);
      bg.addColorStop(0, state.color+"aa");
      bg.addColorStop(.48, state.color+"38");
      bg.addColorStop(1, "#17201e");
      ctx.fillStyle = bg;
      ctx.fillRect(0,0,w,h);

      openingParticles.forEach((p,i) => {
        const sway = Math.sin(t*1.6+p.phase)*18*p.s;
        let x = p.x*w + sway;
        let y = p.y*h;
        if (state.land==="sea") x += Math.sin(t+p.y*8)*30;
        if (state.land==="water") y += Math.sin(t*1.2+p.x*7)*18;
        if (state.land==="snow") y = (p.y*h + t*16*(.5+p.s)) % h;
        ctx.beginPath();
        ctx.fillStyle = i%7===0 ? "rgba(213,199,156,.76)" : "rgba(255,255,255,.40)";
        ctx.arc(x,y,p.r,0,Math.PI*2);
        ctx.fill();
      });

      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1.2;
      for(let j=0;j<5;j++){
        ctx.beginPath();
        for(let x=0;x<=w;x+=8){
          const y = h*.45 + j*18 + Math.sin(x*.014 + t*2 + j)*8;
          x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      openingRaf = requestAnimationFrame(frame);
    }
    frame();
  }

  document.querySelector("#replayButton").addEventListener("click", () => {
    chord(state.land==="sea" ? 174 : state.land==="water" ? 220 : 196);
    startOpeningAnimation();
  });

  window.addEventListener("resize", () => {
    if (state.screen==="hatsuzoe") drawGesture();
  });
})();