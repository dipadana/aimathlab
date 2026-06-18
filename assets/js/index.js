function scrollCarousel(dir) {
        const c = document.getElementById("main-carousel");
        const card = c.querySelector(".module-card");
        if (!card) return;
        const cardWidth = card.offsetWidth + 18;
        c.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
      }

      function updateCarouselButtons() {
        const c = document.getElementById("main-carousel");
        if (!c) return;
        const leftBtn = document.querySelector(".carousel-btn.left");
        const rightBtn = document.querySelector(".carousel-btn.right");
        if (!leftBtn || !rightBtn) return;

        if (c.scrollLeft <= 5) {
          leftBtn.classList.add("hidden");
        } else {
          leftBtn.classList.remove("hidden");
        }

        if (c.scrollLeft + c.clientWidth >= c.scrollWidth - 5) {
          rightBtn.classList.add("hidden");
        } else {
          rightBtn.classList.remove("hidden");
        }
      }

      function toggleLangMenu(e) {
        e.stopPropagation();
        document.getElementById("lang-menu").classList.toggle("show");
      }
      window.addEventListener("click", () => {
        const m = document.getElementById("lang-menu");
        if (m) m.classList.remove("show");
      });

      function setLang(lang) {
        document.body.setAttribute("data-active-lang", lang);
        document.documentElement.setAttribute(
          "lang",
          lang === "ja" ? "ja" : lang === "id" ? "id" : "en",
        );
        ["en", "ja", "id"].forEach((l) => {
          const btn = document.getElementById("lb-" + l);
          if (btn) btn.classList.toggle("active", l === lang);
        });
        localStorage.setItem("aiml-lang", lang);
      }

      const saved = localStorage.getItem("aiml-lang");
      setTimeout(() => {
        if (saved) setLang(saved);
      }, 0);

      function drawVectorPreview(canvas) {
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth,
          h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;

        function render(time) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const dark = isDark();
          ctx.clearRect(0, 0, w, h);
          const cx = w / 2,
            cy = h / 2;

          ctx.strokeStyle = dark
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.06)";
          ctx.lineWidth = 0.5;
          for (let i = -5; i <= 5; i++) {
            const px = cx + i * 22;
            const py = cy + i * 22;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
            ctx.stroke();
          }

          ctx.strokeStyle = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, cy);
          ctx.lineTo(w, cy);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx, 0);
          ctx.lineTo(cx, h);
          ctx.stroke();

          const t = time / 1000;
          const arrows = [
            {
              dx: 2.5 * Math.cos(t),
              dy: -2 * Math.sin(t),
              color: dark ? "#6a9fd8" : "#2a5caa",
            },
            {
              dx: -1.5 * Math.cos(t * 1.3),
              dy: -2.5 * Math.sin(t * 0.8),
              color: dark ? "#d47070" : "#b84040",
            },
          ];
          arrows.forEach((a) => {
            const ex = cx + a.dx * 22,
              ey = cy - a.dy * 22;
            const angle = Math.atan2(ey - cy, ex - cx);
            const dx2 = ex - cx,
              dy2 = ey - cy,
              len = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            const hl = Math.min(10, len * 0.3);
            ctx.strokeStyle = a.color;
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
              ex - Math.cos(angle) * hl * 0.5,
              ey - Math.sin(angle) * hl * 0.5,
            );
            ctx.stroke();
            if (len > 2) {
              ctx.fillStyle = a.color;
              ctx.beginPath();
              ctx.moveTo(ex, ey);
              ctx.lineTo(
                ex - hl * Math.cos(angle - 0.45),
                ey - hl * Math.sin(angle - 0.45),
              );
              ctx.lineTo(
                ex - hl * 0.45 * Math.cos(angle),
                ey - hl * 0.45 * Math.sin(angle),
              );
              ctx.lineTo(
                ex - hl * Math.cos(angle + 0.45),
                ey - hl * Math.sin(angle + 0.45),
              );
              ctx.closePath();
              ctx.fill();
            }
          });
          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
      }

      function drawMatrixPreview(canvas) {
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth,
          h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;

        function render(time) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const dark = isDark();
          ctx.clearRect(0, 0, w, h);
          const cx = w / 2,
            cy = h / 2,
            s = 28;

          const t = time / 1500;
          const m = [
            1.2 + 0.3 * Math.sin(t),
            0.5 * Math.cos(t * 1.2),
            0.3 * Math.sin(t * 0.8),
            1.1 + 0.3 * Math.cos(t),
          ];
          function tx(x, y) {
            return [
              cx + (m[0] * x + m[1] * y) * s,
              cy - (m[2] * x + m[3] * y) * s,
            ];
          }

          ctx.strokeStyle = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.rect(cx, cy - s, s, s);
          ctx.stroke();
          ctx.setLineDash([]);

          const corners = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ];
          const tc = corners.map(([x, y]) => tx(x, y));
          ctx.strokeStyle = dark ? "#5aba80" : "#2e7d52";
          ctx.lineWidth = 1.5;
          ctx.fillStyle = dark ? "rgba(90,186,128,0.1)" : "rgba(46,125,82,0.1)";
          ctx.beginPath();
          ctx.moveTo(...tc[0]);
          tc.forEach((p) => ctx.lineTo(...p));
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          const [e1x, e1y] = tx(1, 0);
          const [e2x, e2y] = tx(0, 1);
          function arrow(x1, y1, x2, y2, color) {
            const ang = Math.atan2(y2 - y1, x2 - x1);
            const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            if (len < 2) return;
            const hl = Math.min(8, len * 0.3);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(
              x2 - Math.cos(ang) * hl * 0.5,
              y2 - Math.sin(ang) * hl * 0.5,
            );
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(
              x2 - hl * Math.cos(ang - 0.4),
              y2 - hl * Math.sin(ang - 0.4),
            );
            ctx.lineTo(
              x2 - hl * Math.cos(ang + 0.4),
              y2 - hl * Math.sin(ang + 0.4),
            );
            ctx.closePath();
            ctx.fill();
          }
          arrow(cx, cy, e1x, e1y, dark ? "#6a9fd8" : "#2a5caa");
          arrow(cx, cy, e2x, e2y, dark ? "#d4a06a" : "#8b5a2b");

          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
      }

      function drawCalculusPreview(canvas) {
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth,
          h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;

        function render(time) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const dark = isDark();
          ctx.clearRect(0, 0, w, h);
          const cx = w / 2,
            cy = h / 2 + 10;

          ctx.strokeStyle = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(10, cy);
          ctx.lineTo(w - 10, cy);
          ctx.stroke();

          ctx.strokeStyle = dark ? "#d47070" : "#b84040";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          for (let px = 10; px <= w - 10; px++) {
            const x = (px - cx) / 25;
            const y = Math.sin(x) * 35;
            if (px === 10) ctx.moveTo(px, cy - y);
            else ctx.lineTo(px, cy - y);
          }
          ctx.stroke();

          const t = time / 1000;
          const tx0 = Math.sin(t) * 2;
          const ty0 = Math.sin(tx0),
            slope = Math.cos(tx0);
          const px0 = cx + tx0 * 25,
            py0 = cy - ty0 * 35;
          const dx2 = 30;
          ctx.strokeStyle = dark ? "#d4a06a" : "#9a6e00";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(px0 - dx2, py0 + (slope * dx2 * 35) / 25);
          ctx.lineTo(px0 + dx2, py0 - (slope * dx2 * 35) / 25);
          ctx.stroke();
          ctx.fillStyle = dark ? "#d4a06a" : "#9a6e00";
          ctx.beginPath();
          ctx.arc(px0, py0, 4, 0, Math.PI * 2);
          ctx.fill();

          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
      }

      function drawProbPreview(canvas) {
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth,
          h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;

        function render(time) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const dark = isDark();
          ctx.clearRect(0, 0, w, h);
          const cx = w / 2,
            base = h - 20;
          const mu = 0;
          const sigma = 0.8 + 0.3 * Math.sin(time / 800);
          function normalY(x) {
            return (
              Math.exp(-0.5 * ((x - mu) / sigma) ** 2) /
              (sigma * Math.sqrt(2 * Math.PI))
            );
          }
          const scaleX = 45,
            scaleY = 160;
          ctx.fillStyle = dark
            ? "rgba(154,136,216,0.18)"
            : "rgba(91,74,158,0.1)";
          ctx.strokeStyle = dark ? "#9a88d8" : "#5b4a9e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let px = 10; px <= w - 10; px++) {
            const x = (px - cx) / scaleX;
            const y = normalY(x) * scaleY;
            if (px === 10) ctx.moveTo(px, base - y);
            else ctx.lineTo(px, base - y);
          }
          ctx.lineTo(w - 10, base);
          ctx.lineTo(10, base);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(10, base);
          ctx.lineTo(w - 10, base);
          ctx.stroke();

          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
      }

      function drawNeuralPreview(canvas) {
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth,
          h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;

        function render(time) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const dark = isDark();
          ctx.clearRect(0, 0, w, h);
          const neurons = [
            [
              { x: w * 0.12, y: h * 0.35 },
              { x: w * 0.12, y: h * 0.65 },
            ],
            [
              { x: w * 0.37, y: h * 0.22 },
              { x: w * 0.37, y: h * 0.5 },
              { x: w * 0.37, y: h * 0.78 },
            ],
            [
              { x: w * 0.63, y: h * 0.35 },
              { x: w * 0.63, y: h * 0.65 },
            ],
            [{ x: w * 0.88, y: h * 0.5 }],
          ];
          const colors = [
            dark ? "#6a9fd8" : "#2a5caa",
            dark ? "#5aba80" : "#2e7d52",
            dark ? "#d47070" : "#b84040",
            dark ? "#d4a06a" : "#9a6e00",
          ];

          ctx.lineWidth = 0.8;
          for (let li = 0; li < neurons.length - 1; li++) {
            neurons[li].forEach((a, i) => {
              neurons[li + 1].forEach((b, j) => {
                const v = Math.sin(li * 10 + i * 5 + j) > 0 ? 1 : -1;
                ctx.strokeStyle =
                  v > 0
                    ? dark
                      ? "rgba(106,159,216,0.25)"
                      : "rgba(42,92,170,0.2)"
                    : dark
                      ? "rgba(212,112,112,0.25)"
                      : "rgba(184,64,64,0.2)";
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();

                const pulseT =
                  (time / 2000 + (li * 0.3 + i * 0.2 + j * 0.5)) % 1.0;
                if (pulseT > 0 && pulseT < 0.2) {
                  const prog = pulseT * 5;
                  const px = a.x + (b.x - a.x) * prog;
                  const py = a.y + (b.y - a.y) * prog;
                  ctx.fillStyle =
                    v > 0
                      ? dark
                        ? "#6a9fd8"
                        : "#2a5caa"
                      : dark
                        ? "#d47070"
                        : "#b84040";
                  ctx.globalAlpha = Math.sin(prog * Math.PI);
                  ctx.beginPath();
                  ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.globalAlpha = 1;
                }
              });
            });
          }

          neurons.forEach((layer, li) => {
            layer.forEach((n, i) => {
              ctx.fillStyle = dark ? colors[li] : colors[li];
              ctx.strokeStyle = dark
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.1)";
              ctx.lineWidth = 1;

              const glow = Math.sin(time / 500 + li + i) * 0.5 + 0.5;
              const radius = 6 + glow * 1.5;
              ctx.beginPath();
              ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          });

          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
      }

      function initBackgroundAnimation() {
        const canvas = document.getElementById("bg-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let w, h;
        const nodes = [];
        const numNodes = Math.min(80, Math.floor(window.innerWidth / 15));

        function resize() {
          w = window.innerWidth;
          h = window.innerHeight;
          canvas.width = w * (window.devicePixelRatio || 1);
          canvas.height = h * (window.devicePixelRatio || 1);
          ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        }

        window.addEventListener("resize", resize);
        resize();

        const symbols = [
          {
            text: "∑",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          {
            text: "∫",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          {
            text: "∂",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          {
            text: "∞",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          {
            text: "∇",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          {
            text: "π",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          {
            text: "{ }",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          {
            text: "</>",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          {
            text: "λ",
            family: "'JetBrains Mono', monospace",
            weight: "normal",
          },
          { text: "\uf0c3", family: "'Font Awesome 6 Free'", weight: "900" },
          { text: "\uf610", family: "'Font Awesome 6 Free'", weight: "900" },
          { text: "\uf471", family: "'Font Awesome 6 Free'", weight: "900" },
          { text: "\uf5dc", family: "'Font Awesome 6 Free'", weight: "900" },
        ];
        for (let i = 0; i < numNodes; i++) {
          const isSymbol = Math.random() > 0.65;
          nodes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1,
            symbolObj: isSymbol
              ? symbols[Math.floor(Math.random() * symbols.length)]
              : null,
            size: isSymbol ? Math.random() * 10 + 12 : null,
          });
        }

        function render() {
          ctx.clearRect(0, 0, w, h);
          const dark = isDark();

          ctx.strokeStyle = dark
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.04)";
          ctx.lineWidth = 1;
          const gridSize = 50;
          const offsetX = (Date.now() * 0.005) % (gridSize * 4);
          const offsetY = (Date.now() * 0.005) % (gridSize * 4);

          ctx.beginPath();
          for (let x = -offsetX; x < w; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
          }
          for (let y = -offsetY; y < h; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
          }
          ctx.stroke();

          ctx.strokeStyle = dark
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.07)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = -offsetX; x < w; x += gridSize * 4) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
          }
          for (let y = -offsetY; y < h; y += gridSize * 4) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
          }
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          nodes.forEach((n) => {
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < -30) n.x = w + 30;
            else if (n.x > w + 30) n.x = -30;
            if (n.y < -30) n.y = h + 30;
            else if (n.y > h + 30) n.y = -30;

            if (n.symbolObj) {
              ctx.font = `${n.symbolObj.weight} ${n.size}px ${n.symbolObj.family}`;
              ctx.fillStyle = dark
                ? "rgba(255,255,255,0.25)"
                : "rgba(0,0,0,0.3)";
              ctx.fillText(n.symbolObj.text, n.x, n.y);
            } else {
              ctx.fillStyle = dark
                ? "rgba(255,255,255,0.35)"
                : "rgba(0,0,0,0.35)";
              ctx.beginPath();
              ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          const maxDist = 150;
          for (let i = 0; i < numNodes; i++) {
            for (let j = i + 1; j < numNodes; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * (dark ? 0.15 : 0.12);
                ctx.strokeStyle = dark
                  ? `rgba(255,255,255,${alpha})`
                  : `rgba(0,0,0,${alpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
              }
            }
          }
          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
      }

      window.addEventListener("load", () => {
        initBackgroundAnimation();
        drawVectorPreview(document.getElementById("prev-vector"));
        drawMatrixPreview(document.getElementById("prev-matrix"));
        drawCalculusPreview(document.getElementById("prev-calculus"));
        drawProbPreview(document.getElementById("prev-prob"));
        drawNeuralPreview(document.getElementById("prev-neural"));

        const c = document.getElementById("main-carousel");
        if (c) {
          c.addEventListener("scroll", updateCarouselButtons);
          window.addEventListener("resize", updateCarouselButtons);

          setTimeout(updateCarouselButtons, 50);
        }
      });