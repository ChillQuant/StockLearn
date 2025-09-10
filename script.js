// Timer and portfolio logic
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const sessionLengthInput = document.getElementById('session-length');

let timerInterval = null;
let elapsed = 0; // seconds
let portfolioValue = 1000;
let portfolioData = [{ time: 0, value: portfolioValue }];
let isRunning = false;

const chartCanvas = document.getElementById('chart');
const ctx = chartCanvas.getContext('2d');

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerInterval = setInterval(() => {
    elapsed++;
    updateTimerDisplay();
    updatePortfolio();
    drawChart();
    const maxSeconds = parseInt(sessionLengthInput.value, 10) * 60;
    if (elapsed >= maxSeconds) {
      pauseTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  storeSession();
}

function resetTimer() {
  pauseTimer();
  elapsed = 0;
  portfolioValue = 1000;
  portfolioData = [{ time: 0, value: portfolioValue }];
  updateTimerDisplay();
  drawChart();
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function updatePortfolio() {
  const lastTime = portfolioData[portfolioData.length - 1].time;
  if (elapsed > lastTime) {
    let change = portfolioValue * (0.0005 + Math.random() * 0.001);
    if (Math.random() < 0.1) {
      change = -portfolioValue * (Math.random() * 0.0005);
    }
    portfolioValue += change;
    portfolioData.push({ time: elapsed, value: portfolioValue });
  }
}

function drawChart() {
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  const pad = 20;
  const times = portfolioData.map(p => p.time);
  const values = portfolioData.map(p => p.value);
  const maxTime = Math.max(...times);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const rangeVal = maxVal - minVal || 1;
  ctx.beginPath();
  for (let i = 0; i < portfolioData.length; i++) {
    const x = pad + (chartCanvas.width - 2 * pad) * (times[i] / (maxTime || 1));
    const y = chartCanvas.height - pad - (chartCanvas.height - 2 * pad) * ((values[i] - minVal) / rangeVal);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#4caf50';
  ctx.lineWidth = 2;
  ctx.stroke();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseTimer();
  }
});

// Ambient sound using Web Audio API
const soundSelect = document.getElementById('sound-select');
const soundToggle = document.getElementById('sound-toggle');
const volumeSlider = document.getElementById('volume');
let audioCtx = null;
let currentSound = null;

function createWhiteNoise() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volumeSlider.value;
  whiteNoise.connect(gainNode).connect(audioCtx.destination);
  whiteNoise.start();
  currentSound = { source: whiteNoise, gain: gainNode };
}

function createBrownNoise() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // gain
  }
  const brownNoise = audioCtx.createBufferSource();
  brownNoise.buffer = noiseBuffer;
  brownNoise.loop = true;
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volumeSlider.value;
  brownNoise.connect(gainNode).connect(audioCtx.destination);
  brownNoise.start();
  currentSound = { source: brownNoise, gain: gainNode };
}

function createCoffeeNoise() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 200;
  const gainNode = audioCtx.createGain();
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = volumeSlider.value;
  gainNode.gain.value = volumeSlider.value / 4;
  noise.connect(noiseGain).connect(audioCtx.destination);
  osc.connect(gainNode).connect(audioCtx.destination);
  noise.start();
  osc.start();
  currentSound = { source: noise, extra: osc, gain: noiseGain };
}

function playSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const type = soundSelect.value;
  if (type === 'rain') {
    createWhiteNoise();
  } else if (type === 'coffee') {
    createCoffeeNoise();
  } else if (type === 'forest') {
    createBrownNoise();
  }
}

function stopSound() {
  if (currentSound) {
    currentSound.source.stop();
    if (currentSound.extra) currentSound.extra.stop();
    currentSound = null;
  }
}

soundToggle.addEventListener('click', () => {
  if (currentSound) {
    stopSound();
    soundToggle.textContent = 'Play';
  } else if (soundSelect.value !== 'none') {
    playSound();
    soundToggle.textContent = 'Pause';
  }
});

volumeSlider.addEventListener('input', () => {
  if (currentSound) {
    if (currentSound.gain) currentSound.gain.gain.value = volumeSlider.value;
    if (currentSound.extra && currentSound.extra.gain) currentSound.extra.gain.value = volumeSlider.value;
  }
});

// Stats using localStorage
function renderStats() {
  const stats = JSON.parse(localStorage.getItem('stats')) || { total: 0, best: 0 };
  document.getElementById('total-time').textContent = Math.floor(stats.total / 60);
  document.getElementById('best-session').textContent = Math.floor(stats.best / 60);
}

function storeSession() {
  const stats = JSON.parse(localStorage.getItem('stats')) || { total: 0, best: 0 };
  stats.total += elapsed;
  if (elapsed > stats.best) stats.best = elapsed;
  localStorage.setItem('stats', JSON.stringify(stats));
  renderStats();
}

renderStats();
updateTimerDisplay();
drawChart();
