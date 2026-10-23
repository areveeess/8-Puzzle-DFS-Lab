const CHANNELS = new Set(['trace', 'route']);
const SPEEDS = new Set([0.5, 1, 2]);
const DEFAULT_STEP_MS = 700;

function validLength(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Create the single-scheduler controller for independent trace and route playback. */
export function createPlaybackController({
  traceLength = 0,
  routeLength = 0,
  now = () => performance.now(),
  schedule = (callback, delay) => setTimeout(callback, delay),
  cancel = (handle) => clearTimeout(handle),
  stepDurationMs = DEFAULT_STEP_MS,
  onChange = () => {},
} = {}) {
  if (!validLength(traceLength) || !validLength(routeLength)) throw new RangeError('Playback sequence lengths must be non-negative safe integers.');
  if (typeof now !== 'function' || typeof schedule !== 'function' || typeof cancel !== 'function' || typeof onChange !== 'function') {
    throw new TypeError('Playback clock, scheduler, and change callback must be functions.');
  }
  if (!Number.isFinite(stepDurationMs) || stepDurationMs <= 0) throw new RangeError('Playback step duration must be positive.');

  const lengths = { trace: traceLength, route: routeLength };
  const cursors = { trace: 0, route: 0 };
  let activeChannel = null;
  let playing = false;
  let speed = 1;
  let elapsedMs = 0;
  let segmentStartedAt = null;
  let timerHandle = null;
  let generation = 0;

  function snapshot() {
    const runningTime = playing && segmentStartedAt !== null ? Math.max(0, now() - segmentStartedAt) : 0;
    return Object.freeze({
      traceLength: lengths.trace,
      routeLength: lengths.route,
      traceCursor: cursors.trace,
      routeCursor: cursors.route,
      activeChannel,
      playing,
      speed,
      playbackMs: elapsedMs + runningTime,
      timerActive: timerHandle !== null,
    });
  }

  function publish(reason, announce = false) {
    onChange(snapshot(), { reason, announce });
  }

  function clearTimer() {
    generation += 1;
    if (timerHandle !== null) cancel(timerHandle);
    timerHandle = null;
  }

  function stopSegment() {
    if (playing && segmentStartedAt !== null) elapsedMs += Math.max(0, now() - segmentStartedAt);
    playing = false;
    segmentStartedAt = null;
    clearTimer();
  }

  function scheduleNext(expectedGeneration) {
    timerHandle = schedule(() => {
      if (expectedGeneration !== generation || !playing || !activeChannel) return;
      timerHandle = null;
      cursors[activeChannel] = Math.min(lengths[activeChannel] - 1, cursors[activeChannel] + 1);
      if (cursors[activeChannel] >= lengths[activeChannel] - 1) {
        stopSegment();
        publish('complete', true);
        return;
      }
      publish('tick');
      scheduleNext(expectedGeneration);
    }, stepDurationMs / speed);
  }

  function canStep(channel, direction) {
    if (!CHANNELS.has(channel) || !Number.isInteger(direction) || direction === 0 || lengths[channel] === 0) return false;
    const next = cursors[channel] + Math.sign(direction);
    return next >= 0 && next < lengths[channel];
  }

  function configure({ traceLength: nextTraceLength, routeLength: nextRouteLength }) {
    if (!validLength(nextTraceLength) || !validLength(nextRouteLength)) throw new RangeError('Playback sequence lengths must be non-negative safe integers.');
    stopSegment();
    lengths.trace = nextTraceLength;
    lengths.route = nextRouteLength;
    cursors.trace = 0;
    cursors.route = 0;
    activeChannel = null;
    elapsedMs = 0;
    publish('configure');
    return snapshot();
  }

  function play(channel) {
    if (!CHANNELS.has(channel) || lengths[channel] < 2) return false;
    if (playing && activeChannel === channel) return true;
    if (playing) stopSegment();
    if (cursors[channel] >= lengths[channel] - 1) {
      activeChannel = channel;
      publish('complete', true);
      return false;
    }
    activeChannel = channel;
    playing = true;
    segmentStartedAt = now();
    clearTimer();
    scheduleNext(generation);
    publish('play', true);
    return true;
  }

  function pause() {
    if (!playing) return false;
    stopSegment();
    publish('pause', true);
    return true;
  }

  function step(channel, amount) {
    if (!CHANNELS.has(channel) || !Number.isInteger(amount) || amount === 0 || lengths[channel] === 0) return cursors[CHANNELS.has(channel) ? channel : 'trace'];
    if (playing) stopSegment();
    activeChannel = channel;
    cursors[channel] = Math.max(0, Math.min(lengths[channel] - 1, cursors[channel] + amount));
    publish('step', true);
    return cursors[channel];
  }

  function reset(channel) {
    if (!CHANNELS.has(channel)) return false;
    stopSegment();
    activeChannel = channel;
    cursors[channel] = 0;
    elapsedMs = 0;
    publish('reset', true);
    return true;
  }

  function setSpeed(nextSpeed) {
    if (!SPEEDS.has(nextSpeed)) return false;
    if (speed === nextSpeed) return true;
    speed = nextSpeed;
    if (playing && activeChannel) {
      clearTimer();
      scheduleNext(generation);
    }
    publish('speed');
    return true;
  }

  function invalidate() {
    stopSegment();
    lengths.trace = 0;
    lengths.route = 0;
    cursors.trace = 0;
    cursors.route = 0;
    activeChannel = null;
    elapsedMs = 0;
    publish('invalidate');
  }

  return Object.freeze({
    getState: snapshot,
    canStep,
    configure,
    play,
    pause,
    step,
    reset,
    setSpeed,
    invalidate,
  });
}
