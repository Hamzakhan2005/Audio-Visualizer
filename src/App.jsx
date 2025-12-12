import { useEffect, useRef } from "react";
import "./App.css";

function App() {
  const canvasRef = useRef(null);

  const accessMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function tick() {
      analyser.getByteFrequencyData(dataArray);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // RESPONSIVE resize
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bars = 100;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      const innerRadius = Math.min(canvas.width, canvas.height) * 0.15;
      const maxBarLength = Math.min(canvas.width, canvas.height) * 0.25;

      const rotation = performance.now() / 3000;

      // Apply rotation ONCE
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      const freqLimit = Math.floor(dataArray.length * 0.7);
      const chunk = Math.floor(freqLimit / bars);

      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < chunk; j++) {
          sum += dataArray[i * chunk + j];
        }
        let value = sum / chunk; // smoothened frequency intensity

        let barLength = (value / 255) * maxBarLength;
        let angle = (i / bars) * 2 * Math.PI;

        const x1 = cx + Math.cos(angle) * innerRadius;
        const y1 = cy + Math.sin(angle) * innerRadius;

        const x2 = cx + Math.cos(angle) * (innerRadius + barLength);
        const y2 = cy + Math.sin(angle) * (innerRadius + barLength);

        let hue = (i / bars) * 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, ${40 + value / 6}%)`;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw center pulse OUTSIDE loop
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      const pulse = (avg / 255) * (innerRadius * 0.5);

      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius * 0.6 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${avg / 255})`;
      ctx.fill();

      ctx.restore();

      requestAnimationFrame(tick);
    }

    tick();
  };

  useEffect(() => {
    accessMic();
  }, []);

  return (
    <>
      <div className="visualizer-container">
        <canvas ref={canvasRef} className="visualizer-canvas"></canvas>
      </div>
    </>
  );
}

export default App;
