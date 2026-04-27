// ═══════════════════════════════════════════════════════════════
//  Human-like Behavior Simulation
//  Bezier mouse, realistic typing, natural scrolling
// ═══════════════════════════════════════════════════════════════

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const randFloat = (min, max) => Math.random() * (max - min) + min;

// ─── BEZIER CURVE MOUSE MOVEMENT ───────────────────────────────

/**
 * Compute a point on a cubic Bezier curve at parameter t ∈ [0,1]
 */
function bezierPoint(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * Generate bezier curve points between (x0,y0) and (x1,y1)
 * with randomized control points for natural movement
 */
function generateBezierPath(x0, y0, x1, y1, numPoints = 25) {
  // Control points with randomized offsets for natural curves
  const cp1x = x0 + (x1 - x0) * randFloat(0.2, 0.5) + randFloat(-50, 50);
  const cp1y = y0 + (y1 - y0) * randFloat(0.0, 0.3) + randFloat(-50, 50);
  const cp2x = x0 + (x1 - x0) * randFloat(0.5, 0.8) + randFloat(-30, 30);
  const cp2y = y0 + (y1 - y0) * randFloat(0.7, 1.0) + randFloat(-30, 30);

  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    points.push({
      x: Math.round(bezierPoint(t, x0, cp1x, cp2x, x1)),
      y: Math.round(bezierPoint(t, y0, cp1y, cp2y, y1)),
    });
  }
  return points;
}

/**
 * Move mouse along a bezier curve with random speed variations.
 * Feels like a real human moving a mouse.
 */
export async function humanMouseMove(page, toX, toY, fromX = null, fromY = null) {
  // Use current mouse position or random starting point
  const startX = fromX ?? randInt(100, 400);
  const startY = fromY ?? randInt(100, 400);

  const points = generateBezierPath(startX, startY, toX, toY, randInt(15, 30));

  for (const point of points) {
    await page.mouse.move(point.x, point.y);
    await delay(randInt(5, 25)); // Natural micro-delays between moves
  }
}

/**
 * Click at a position with slight overshoot, pause, then correct and click.
 * Mimics real user hesitation/correction behavior.
 */
export async function humanClick(page, x, y) {
  // Overshoot slightly
  const overshootX = x + randInt(-8, 8);
  const overshootY = y + randInt(-8, 8);

  await humanMouseMove(page, overshootX, overshootY);
  await delay(randInt(50, 150)); // Brief pause (human correcting aim)

  // Correct to exact position
  await page.mouse.move(x + randInt(-2, 2), y + randInt(-2, 2), { steps: randInt(3, 6) });
  await delay(randInt(30, 80));

  await page.mouse.down();
  await delay(randInt(30, 90)); // Hold click briefly like a real user
  await page.mouse.up();
}

/**
 * Click on an element with human-like behavior
 */
export async function humanClickElement(page, selector) {
  const el = await page.$(selector);
  if (!el) return false;

  const box = await el.boundingBox();
  if (!box) return false;

  // Click at a random position within the element
  const x = box.x + box.width * randFloat(0.25, 0.75);
  const y = box.y + box.height * randFloat(0.25, 0.75);

  await humanClick(page, x, y);
  return true;
}

// ─── HUMAN-LIKE TYPING ─────────────────────────────────────────

/**
 * Type text with realistic per-keystroke delays.
 * Includes occasional pauses (thinking) and speed bursts.
 */
export async function humanType(page, selector, text) {
  await humanClickElement(page, selector);
  await delay(randInt(200, 500)); // Pause before typing

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    await page.keyboard.type(char);

    // Variable typing speed
    let baseDelay = randInt(60, 180);

    // Occasional longer pause (thinking, or after word boundaries)
    if (char === ' ' || char === '.' || char === ',') {
      baseDelay += randInt(50, 200);
    }

    // Rare burst of fast typing
    if (Math.random() < 0.1) {
      baseDelay = randInt(30, 60);
    }

    // Rare long pause (human distraction)
    if (Math.random() < 0.03) {
      baseDelay += randInt(300, 800);
    }

    await delay(baseDelay);
  }
}

// ─── NATURAL SCROLLING ─────────────────────────────────────────

/**
 * Scroll with easeInOut timing and random amounts.
 * Feels like a real user browsing content.
 */
export async function humanScroll(page, direction = 'down', maxDistance = 2000) {
  const totalDistance = randInt(300, maxDistance);
  const steps = randInt(5, 12);
  const stepDistance = totalDistance / steps;

  for (let i = 0; i < steps; i++) {
    // EaseInOut: slower at start/end, faster in middle
    const progress = i / steps;
    const easeMultiplier = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const scrollAmount = Math.round(stepDistance * (0.5 + easeMultiplier));
    const scrollDir = direction === 'down' ? scrollAmount : -scrollAmount;

    await page.evaluate((dist) => window.scrollBy(0, dist), scrollDir);
    await delay(randInt(80, 250));
  }
}

/**
 * Full-page scroll with realistic pauses (reading time).
 * Used to load lazy-loaded content and appear human.
 */
export async function humanAutoScroll(page) {
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const maxScrolls = Math.min(Math.ceil(totalHeight / viewportHeight), 15);

  for (let i = 0; i < maxScrolls; i++) {
    await humanScroll(page, 'down', viewportHeight * randFloat(0.5, 1.2));
    // Simulate reading pause
    await delay(randInt(400, 1500));

    // Occasionally scroll up slightly (re-reading)
    if (Math.random() < 0.15) {
      await humanScroll(page, 'up', randInt(100, 300));
      await delay(randInt(300, 800));
    }

    // Check if we've reached the bottom
    const atBottom = await page.evaluate(() =>
      window.scrollY + window.innerHeight >= document.body.scrollHeight - 50
    );
    if (atBottom) break;
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await delay(randInt(500, 1000));
}

// ─── PAGE DWELL & IDLE BEHAVIOR ────────────────────────────────

/**
 * Simulate idle time on page with occasional micro-movements.
 * Makes the session look like a real user reading/browsing.
 */
export async function humanDwell(page, minMs = 1000, maxMs = 4000) {
  const dwellTime = randInt(minMs, maxMs);
  const moveCount = randInt(1, 3);
  const interval = dwellTime / (moveCount + 1);

  for (let i = 0; i < moveCount; i++) {
    await delay(interval);
    // Small idle mouse movements
    await page.mouse.move(
      randInt(200, 1200),
      randInt(100, 700),
      { steps: randInt(5, 10) }
    );
  }

  await delay(interval);
}

/**
 * Random mouse jiggle — subtle movement near current position.
 * Anti-bot systems check for perfectly still cursors.
 */
export async function mouseJiggle(page) {
  const baseX = randInt(300, 900);
  const baseY = randInt(200, 600);

  for (let i = 0; i < randInt(2, 5); i++) {
    await page.mouse.move(
      baseX + randInt(-30, 30),
      baseY + randInt(-30, 30),
      { steps: randInt(3, 8) }
    );
    await delay(randInt(100, 300));
  }
}
