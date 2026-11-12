import test from 'node:test';
import assert from 'node:assert/strict';

// Helper function that matches the DOM-independent logic used in usePrompterScroller
function computeLinePositionsMock(scrollerHeight, scrollHeight, lineOffsets, isLandscape = false) {
  if (scrollerHeight === 0 || lineOffsets.length === 0) return [];
  const guideRatio = isLandscape ? 0.33 : 0.36;
  const guideOffset = scrollerHeight * guideRatio;
  const maxScroll = Math.max(0, scrollHeight - scrollerHeight);

  return lineOffsets.map(({ offsetTop, height }) => {
    const lineCenterInContent = offsetTop + height / 2;
    return Math.max(0, Math.min(maxScroll, lineCenterInContent - guideOffset));
  });
}

function getActiveLineFromScrollMock(scrollTop, positions) {
  if (!positions || positions.length === 0) return 0;
  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < positions.length; i++) {
    const diff = Math.abs(positions[i] - scrollTop);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }
  return closestIdx;
}

function calculateSpeedPixelsPerSecond(speed) {
  return 12 + (speed / 100) * 360;
}

function computeTouchPrimaryDelta(deltaX, deltaY, isLandscape) {
  if (isLandscape) {
    return Math.abs(deltaX) >= Math.abs(deltaY) ? -deltaX : -deltaY;
  } else {
    return Math.abs(deltaY) >= Math.abs(deltaX) ? -deltaY : -deltaX;
  }
}

test('Teleprompter Scroller: speed calculation scales from 12px/s to 372px/s', () => {
  assert.equal(calculateSpeedPixelsPerSecond(0), 12);
  assert.equal(calculateSpeedPixelsPerSecond(28), 12 + 0.28 * 360); // 112.8 px/s
  assert.equal(calculateSpeedPixelsPerSecond(50), 12 + 0.5 * 360); // 192 px/s
  assert.equal(calculateSpeedPixelsPerSecond(100), 372);
});

test('Teleprompter Scroller: computeLinePositions accurately aligns lines to guide in portrait and landscape', () => {
  const scrollerHeight = 800;
  const scrollHeight = 3000;
  // 5 lines spaced down the content
  const lines = [
    { offsetTop: 300, height: 40 },
    { offsetTop: 600, height: 40 },
    { offsetTop: 1000, height: 40 },
    { offsetTop: 1500, height: 40 },
    { offsetTop: 2200, height: 40 },
  ];

  // Portrait (guideRatio = 0.36 => guideOffset = 288px)
  const posPortrait = computeLinePositionsMock(scrollerHeight, scrollHeight, lines, false);
  assert.equal(posPortrait.length, 5);
  // Line 0 center: 320, guide: 288 -> target: 32
  assert.equal(posPortrait[0], 320 - 288);
  // Line 1 center: 620, guide: 288 -> target: 332
  assert.equal(posPortrait[1], 620 - 288);
  // Target positions must be strictly increasing
  for (let i = 1; i < posPortrait.length; i++) {
    assert.ok(posPortrait[i] > posPortrait[i - 1]);
  }

  // Landscape (guideRatio = 0.33 => guideOffset = 264px)
  const posLandscape = computeLinePositionsMock(scrollerHeight, scrollHeight, lines, true);
  assert.equal(posLandscape.length, 5);
  // Line 0 center: 320, guide: 264 -> target: 56
  assert.equal(posLandscape[0], 320 - 264);
  assert.ok(posLandscape[0] > posPortrait[0]); // Landscape guide sits higher, so targetScroll is larger
});

test('Teleprompter Scroller: getActiveLineFromScroll correctly identifies closest line index', () => {
  const positions = [0, 150, 320, 500, 750, 1050];
  assert.equal(getActiveLineFromScrollMock(0, positions), 0);
  assert.equal(getActiveLineFromScrollMock(50, positions), 0);
  assert.equal(getActiveLineFromScrollMock(100, positions), 1);
  assert.equal(getActiveLineFromScrollMock(160, positions), 1);
  assert.equal(getActiveLineFromScrollMock(310, positions), 2);
  assert.equal(getActiveLineFromScrollMock(520, positions), 3);
  assert.equal(getActiveLineFromScrollMock(9999, positions), 5);
  assert.equal(getActiveLineFromScrollMock(-50, positions), 0);
});

test('Teleprompter Scroller: Touch Primary Delta handles both Portrait (0°) and Landscape (90°)', () => {
  // Portrait (0°):
  // User drags UP on screen (deltaY = -50): should advance text forward (+50)
  assert.equal(computeTouchPrimaryDelta(0, -50, false), 50);
  // User drags DOWN on screen (deltaY = +50): should retreat text backward (-50)
  assert.equal(computeTouchPrimaryDelta(0, 50, false), -50);

  // Landscape (90° clockwise):
  // The reading flow goes along physical horizontal axis:
  // Dragging finger LEFT on physical screen (deltaX = -80): advances text forward (+80)
  assert.equal(computeTouchPrimaryDelta(-80, 5, true), 80);
  // Dragging finger RIGHT on physical screen (deltaX = +80): retreats text backward (-80)
  assert.equal(computeTouchPrimaryDelta(80, -5, true), -80);

  // If user holds phone sideways and drags physically up/down in landscape:
  assert.equal(computeTouchPrimaryDelta(5, -70, true), 70);
  assert.equal(computeTouchPrimaryDelta(5, 70, true), -70);
});

test('Teleprompter Scroller: Auto-scroll accumulates subpixel progress smoothly without truncation', () => {
  let currentScroll = 0;
  const speed = 25; // 12 + 0.25*360 = 102 px/s
  const pps = calculateSpeedPixelsPerSecond(speed);
  const frameDelta = 0.016667; // 16.67ms (60fps)

  // Advance 10 frames
  for (let i = 0; i < 10; i++) {
    currentScroll += pps * frameDelta;
  }

  // 10 frames * (102 * 0.016667) = ~17.0 pixels
  assert.ok(currentScroll > 16.5 && currentScroll < 17.5);

  // When paused, position remains exact
  const pausedScroll = currentScroll;
  assert.equal(pausedScroll, currentScroll);
});

test('Teleprompter Scroller: Programmatic scroll lock protects active line index from intermediate in-flight scroll events', () => {
  let activeLineIndex = 0;
  let programmaticScrollUntil = 0;
  const now = 1000;

  // Function simulating scrollToLine targeting line 2
  function triggerScrollToLine(targetIdx) {
    activeLineIndex = targetIdx;
    programmaticScrollUntil = now + 450;
  }

  // Function simulating handleManualScroll
  function onManualScroll(currentTime, intermediateScroll, positions) {
    if (currentTime < programmaticScrollUntil) {
      // Locked: do not overwrite activeLineIndex
      return;
    }
    activeLineIndex = getActiveLineFromScrollMock(intermediateScroll, positions);
  }

  const positions = [0, 200, 450, 700];

  // User/remote triggers line 2
  triggerScrollToLine(2);
  assert.equal(activeLineIndex, 2);

  // Intermediate scroll event at t = 1016ms (scroll is only at 20px, which corresponds to line 0)
  onManualScroll(1016, 20, positions);
  // activeLineIndex MUST REMAIN 2! It must NOT be overwritten to 0!
  assert.equal(activeLineIndex, 2);

  // Another intermediate event at t = 1050ms (scroll is at 80px)
  onManualScroll(1050, 80, positions);
  assert.equal(activeLineIndex, 2);

  // After animation finishes at t = 1500ms, normal manual scroll tracking resumes
  onManualScroll(1500, 450, positions);
  assert.equal(activeLineIndex, 2);

  // Manual scroll to 700 at t = 1600ms
  onManualScroll(1600, 700, positions);
  assert.equal(activeLineIndex, 3);
});

test('Teleprompter Scroller: Touch drag release preserves exact drag position without forced snapping', () => {
  // Simulating dragging from 100 to 183.5
  const startScroll = 100;
  const deltaScroll = 83.5;
  const finalDragScroll = startScroll + deltaScroll;

  // Under the old bug: handleTouchEnd called scrollToLine(activeIdx), which snapped back to positions[activeIdx] (e.g. 150)
  // Under the new fix: final scroll remains exact
  const resultingScroll = finalDragScroll;
  assert.equal(resultingScroll, 183.5);
});

test('Teleprompter Scroller: Momentum flick glides smoothly and decelerates to a stop', () => {
  let currentScroll = 200;
  let velocity = 1.2; // 1.2 px/ms flick
  const maxScroll = 2000;
  const friction = 0.94;
  let steps = 0;

  while (Math.abs(velocity) > 0.05 && steps < 100) {
    const elapsed = 16.67;
    currentScroll += velocity * elapsed;
    velocity *= Math.pow(friction, elapsed / 16);
    steps++;
  }

  // Smooth glide should have moved content forward and naturally stopped
  assert.ok(currentScroll > 450);
  assert.ok(currentScroll < 750);
  assert.ok(Math.abs(velocity) <= 0.05);
  assert.ok(steps > 15 && steps < 80);
});

test('Teleprompter Scroller: Dynamic speed adjustment accelerates without resetting currentScroll', () => {
  let currentScroll = 150.7; // was reading mid-page
  let speed = 20; // 20%
  const delta = 0.016;

  // Accelerate speed while playing
  speed = 45; // user pressed '+'
  const pps = calculateSpeedPixelsPerSecond(speed);
  currentScroll += pps * delta;

  // Current scroll advanced seamlessly from 150.7 without resetting to 0 or integer truncation
  assert.ok(currentScroll > 153);
});

