const PALETTE = '   ...:::---+++***◦◦••▢▣';
const FLOWER_PALETTE = '   ...:::---+++***◦◦••';
const CELL = 18;
const FONT_SIZE = 13;

function hash(value) {
  return Math.abs(Math.sin(value * 127.1 + 311.7) * 43758.5453123 % 1);
}

function flowerMotif(x, y, centerX, centerY, size, time, seed) {
  const deltaX = x - centerX;
  const deltaY = y - centerY;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance > size * 1.55) return 0;
  const petals = 5 + (seed % 3);
  const angle = Math.atan2(deltaY, deltaX);
  const turn = hash(seed + 2) * Math.PI * 2 + Math.sin(time * 0.62 + seed) * 0.34;
  const lobe = 0.5 + 0.5 * Math.cos(petals * (angle - turn));
  const uneven = 0.86 + 0.12 * Math.sin(angle * 3.1 + seed) + 0.06 * Math.sin(angle * 7.3 - seed);
  const edge = size * (0.38 + 0.58 * Math.pow(Math.max(0, lobe), 1.55)) * uneven;
  const petal = Math.exp(-Math.pow(distance - edge, 2) / (2 * Math.pow(size * 0.135, 2)));
  const core = Math.exp(-(distance * distance) / (2 * Math.pow(size * 0.18, 2))) * 0.42;
  return Math.max(petal, core);
}

function flowerFieldPattern(x, y, time) {
  const columns = 9;
  const rows = 6;
  const gridX = Math.floor(x * columns);
  const gridY = Math.floor(y * rows);
  let field = 0;
  for (let yIndex = gridY - 1; yIndex <= gridY + 1; yIndex += 1) {
    if (yIndex < 0 || yIndex >= rows) continue;
    for (let xIndex = gridX - 1; xIndex <= gridX + 1; xIndex += 1) {
      if (xIndex < 0 || xIndex >= columns) continue;
      const id = yIndex * columns + xIndex + 1;
      let centerX = (xIndex + 0.28 + hash(id) * 0.52) / columns;
      let centerY = (yIndex + 0.26 + hash(id + 19) * 0.5) / rows;
      const titleFade = Math.max(0, 1 - Math.exp(
        -Math.pow((centerX - 0.27) / 0.26, 2) - Math.pow((centerY - 0.5) / 0.34, 2)
      ));
      const topFade = centerY < 0.16 ? 0.45 : 1;
      const edgeFade = Math.min(1, Math.max(0, (centerX - 0.02) * 14), Math.max(0, (1.02 - centerX) * 14));
      const weight = (0.48 + hash(id + 41) * 0.42) * (0.24 + titleFade * 0.76) * topFade * edgeFade;
      if (weight < 0.14) continue;
      const phase = time * (0.44 + hash(id + 7) * 0.28) + id * 1.73;
      centerX += Math.sin(phase * 0.78) * 0.006;
      centerY += Math.cos(phase * 0.64) * 0.005;
      const size = (0.034 + hash(id + 13) * 0.014) * (1 + Math.sin(phase * 0.47) * 0.055);
      field = Math.max(field, flowerMotif(x, y, centerX, centerY, size, time, id) * weight);
    }
  }
  return field;
}

function setup(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return false;
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext('2d');
  if (!context) return false;
  const mono = (getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace').trim();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.font = `500 ${FONT_SIZE}px ${mono}`;
  context.textBaseline = 'top';
  canvas.__asciiContext = context;
  canvas.__asciiWidth = width;
  canvas.__asciiHeight = height;
  return true;
}

function draw(canvas, time) {
  const context = canvas.__asciiContext;
  const width = canvas.__asciiWidth;
  const height = canvas.__asciiHeight;
  if (!context || !width || !height) return;
  context.clearRect(0, 0, width, height);
  const columns = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const isCover = canvas.closest('.slide')?.dataset.layout === 'SWISS-COVER-ASCII';
  const bloom = 0.5 + 0.5 * Math.sin(time * 0.62 - 0.65);
  const patternPulse = isCover ? 0.28 + 0.62 * bloom * bloom * (3 - 2 * bloom) : 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = (column + 0.5) / columns;
      const y = (row + 0.5) / rows;
      const pattern = patternPulse ? flowerFieldPattern(x, y, time) * patternPulse : 0;
      const noise = (
        Math.sin(column * 0.18 + time)
        + Math.sin(row * 0.24 - time * 0.7)
        + Math.sin((column + row) * 0.12 + time * 0.45)
        + Math.sin(Math.hypot(column - columns * 0.5, row - rows * 0.5) * 0.16 - time * 0.55)
      ) / 4;
      const base = (noise + 1) / 2;
      const value = Math.max(base * (1 - patternPulse * 0.2), pattern * 2.42);
      if (value < 0.22 && pattern < 0.05) continue;
      const palette = pattern > 0.075 ? FLOWER_PALETTE : PALETTE;
      const index = Math.min(palette.length - 1, Math.floor((value + pattern * 0.72) * palette.length));
      const character = palette[index];
      if (character === ' ') continue;
      const alpha = Math.min(0.88, 0.075 + (value - 0.22) * 0.46 + pattern * 0.56);
      context.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      context.fillText(character, column * CELL, row * CELL);
    }
  }
}

export function mountAsciiBackground({ controller, slides }) {
  let state = controller.getState();
  let animationFrame = 0;
  let resizeFrame = 0;
  let startTime = performance.now();
  let frame = 0;

  const currentCanvas = () => slides[state.currentSlideIndex]?.querySelector('canvas.ascii-bg');
  const tick = (now) => {
    const canvas = currentCanvas();
    if (!canvas || state.lowPowerMode) {
      animationFrame = 0;
      return;
    }
    frame += 1;
    if ((frame & 1) === 0) draw(canvas, (now - startTime) / 1000 * 0.55);
    animationFrame = requestAnimationFrame(tick);
  };
  const start = () => {
    const canvas = currentCanvas();
    if (!canvas || state.lowPowerMode) return;
    setup(canvas);
    if (animationFrame) return;
    startTime = performance.now();
    frame = 0;
    animationFrame = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };
  const sync = () => {
    stop();
    start();
  };
  const onResize = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (currentCanvas()) setup(currentCanvas());
    });
  };

  window.addEventListener('resize', onResize, { passive: true });
  const unsubscribe = controller.subscribe((next) => {
    state = next;
    sync();
  });
  return () => {
    unsubscribe();
    stop();
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    window.removeEventListener('resize', onResize);
  };
}
