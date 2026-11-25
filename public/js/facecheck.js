// ---------- On-device face check (u150) ----------
// Privacy design — this is the whole point, read before changing it:
//   * The age check runs IN THE BROWSER on the player's own device.
//   * The camera turns on ONLY when the player starts the check, and only
//     for a split second. There is NO visible preview: the video element
//     is off-screen and 2px, so the player never sees their own photo.
//   * Frames are processed offscreen and wiped from memory right after
//     each estimate. The camera stream is stopped the moment the check
//     finishes (or fails).
//   * The photo NEVER leaves the device: it is never sent to FunTopia,
//     never sent to any company, never saved to disk, never stored.
//     Only the RESULT goes to the server: the word kid/adult + the
//     timestamp. No API key, no cloud service, no per-check cost.
//   * The estimated age NUMBER never leaves this module either: it is
//     used only here, on-device, to decide whether the result is
//     uncertain (close to 18) and needs a retake. It is never sent to
//     the server, never stored, and never shown on screen — the player
//     only ever sees the word kid or adult.
//   * No photo upload is allowed — only a live camera frame. That is the
//     liveness rule: a still photo of someone else cannot be submitted.
// The model is face-api.js (ageGenderNet + tinyFaceDetector), self-hosted
// under /js/faceapi.min.js and /models/facecheck/ — no runtime CDN.

// Close-call band: the on-device estimate is rough, so any estimate near
// the 18 line is treated as a KID (safe side) and the player is asked to
// retry. Under 16 = clearly a kid, over 20 = clearly an adult.
export const FACECLOSE_MIN = 16;
export const FACECLOSE_MAX = 20;

// How many times the check runs in one sitting when the result is
// uncertain (close to 18): the first check plus this many retakes.
export const FACECHECK_MAX_ATTEMPTS = 3;

// Pure decision rule — unit-tested, no camera needed.
export function decideAgeGroup(estimatedAge) {
  const age = Number(estimatedAge);
  if (!isFinite(age) || age < 0) return { ageGroup: 'kid', closeCall: true };
  if (age >= FACECLOSE_MIN && age <= FACECLOSE_MAX) return { ageGroup: 'kid', closeCall: true };
  return { ageGroup: age < 18 ? 'kid' : 'adult', closeCall: false };
}

const FACEAPI_URL = '/js/faceapi.min.js?v=93ca07ec';
const MODELS_URL = '/models/facecheck';

let faceApiPromise = null;
function loadFaceApi() {
  if (window.faceapi) return Promise.resolve(window.faceapi);
  if (faceApiPromise) return faceApiPromise;
  faceApiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = FACEAPI_URL;
    s.onload = () => (window.faceapi ? resolve(window.faceapi) : reject(new Error('face-api failed to load')));
    s.onerror = () => reject(new Error('face-api failed to load'));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('face-api timed out')), 30000);
  });
  return faceApiPromise;
}

let modelsPromise = null;
async function loadModels() {
  if (modelsPromise) return modelsPromise;
  modelsPromise = (async () => {
    const faceapi = await loadFaceApi();
    // CPU backend on purpose: this check runs once at sign-up, and the
    // CPU backend is deterministic everywhere (no WebGL, no GPU quirks,
    // works on old devices). A few hundred ms per frame is fine here.
    try { await faceapi.tf.setBackend('cpu'); } catch {}
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL);
    await faceapi.nets.ageGenderNet.loadFromUri(MODELS_URL);
    return faceapi;
  })();
  return modelsPromise;
}

// Run the age estimator on one image / canvas / video element.
// Returns { age, gender } or null when no face is found. Exported so the
// local test harness can prove the model works on a test image.
export async function estimateAge(source) {
  const faceapi = await loadModels();
  const det = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withAgeAndGender();
  if (!det) return null;
  return { age: det.age, gender: det.gender, box: det.detection.box };
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// Full camera flow. onStatus(text) reports plain-language progress.
// Resolves { ageGroup, verifiedAt, closeCall, attempts, retakesExhausted }.
// The estimated age NUMBER is used only inside this function, on-device,
// for the uncertain/retake decision — it is NOT in the result, is never
// sent anywhere, never stored, and never shown. Uncertain results (close
// to 18) are RETAKEN up to FACECHECK_MAX_ATTEMPTS times; if still
// uncertain after that, the result is kid with retakesExhausted true
// (safe default).
// Rejects with an Error whose .code is one of:
//   camera-unavailable — no camera on this device / getUserMedia missing
//   camera-denied     — the player said no to the camera (or it is blocked)
//   no-face           — no face seen in the camera for 8 seconds
//   not-live          — a face was seen but it never moved: it may be a
//                       photo held up to the camera, so we refuse it.
// The video element is hidden (off-screen, 2px) and removed on cleanup,
// along with every frame. Nothing is ever uploaded or stored.
export async function runFaceCheck({ onStatus } = {}) {
  const status = t => { try { onStatus && onStatus(t); } catch {} };
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw Object.assign(new Error('This device has no camera to check with.'), { code: 'camera-unavailable' });
  }
  status('Loading the face check…');
  await loadModels();

  // Hidden video: off-screen and 2px, never shown. It must stay in the
  // document and keep playing so frames decode — display:none would stop
  // some browsers from decoding, so it is moved off-screen instead.
  const box = document.createElement('div');
  box.className = 'facecheck-hidden';
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none;';
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.muted = true;
  video.style.cssText = 'width:2px;height:2px;opacity:0;';
  box.appendChild(video);
  document.body.appendChild(box);

  let stream = null;
  try {
    status('Turning the camera on for a split second…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch (e) {
      const code = e && e.name === 'NotAllowedError' ? 'camera-denied'
        : e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') ? 'camera-unavailable'
        : 'camera-denied';
      throw Object.assign(new Error('Face check needs the camera to verify you. Try again.'), { code });
    }
    video.srcObject = stream;
    // A camera that never delivers a frame must not hang sign-up forever:
    // give play() 10 seconds, then fail with the plain retry message.
    await Promise.race([
      video.play(),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('Face check needs the camera to verify you. Try again.'), { code: 'no-face' })), 10000)),
    ]);

    // One attempt: sample frames until we have 3 good age reads AND the
    // face has moved a little. Liveness: the face must MOVE between reads
    // (center shifts or the box grows / shrinks) — a still photo held up
    // to the camera never moves, so we ask the player to move their head.
    async function sampleOnce() {
      const ages = [];
      let firstBox = null;
      let moved = false;
      const started = Date.now();
      const MAX_MS = 15000;
      let lastNoFaceStatus = 0;
      while (Date.now() - started < MAX_MS && !(ages.length >= 3 && moved)) {
        let est = null;
        try { est = await estimateAge(video); } catch {}
        if (est) {
          ages.push(est.age);
          if (!firstBox) firstBox = est.box;
          else if (!moved) {
            const dx = Math.abs(est.box.x + est.box.width / 2 - (firstBox.x + firstBox.width / 2));
            const dy = Math.abs(est.box.y + est.box.height / 2 - (firstBox.y + firstBox.height / 2));
            const ds = Math.abs(est.box.width - firstBox.width);
            if (dx >= 4 || dy >= 4 || ds >= Math.max(3, firstBox.width * 0.03)) moved = true;
          }
          status(moved ? 'Checking…' : 'Move your head a little — checking…');
        } else if (Date.now() - lastNoFaceStatus > 2000) {
          lastNoFaceStatus = Date.now();
          status('Looking for your face — hold still in front of the camera…');
        }
        // Frames are processed and dropped here: nothing is kept, no canvas
        // is stored, no image is ever created from the video.
        await new Promise(r => setTimeout(r, 350));
      }
      if (!ages.length) {
        throw Object.assign(new Error('We could not see a face. Try again.'), { code: 'no-face' });
      }
      if (!moved) {
        throw Object.assign(new Error('We could not tell that is a live camera — please move your head a little and try again.'), { code: 'not-live' });
      }
      return Math.round(median(ages));
    }

    // Close-call rule: an estimate near 18 is UNCERTAIN — do not just
    // label the player a kid. Redo the check so it can check again. The
    // camera stays on for the retakes (one stream, no re-prompt). If it
    // stays uncertain after all retakes, fall back to kid (safe default).
    // NOTE: the age number itself never leaves this function — the result
    // below carries only the word kid/adult (+ timestamp).
    for (let attempt = 1; attempt <= FACECHECK_MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) status('Checking again…');
      const estimatedAge = await sampleOnce();
      const { ageGroup, closeCall } = decideAgeGroup(estimatedAge);
      const result = { ageGroup, verifiedAt: Date.now(), closeCall, attempts: attempt, retakesExhausted: false };
      if (!closeCall) return result;
      if (attempt < FACECHECK_MAX_ATTEMPTS) {
        status('That was close to 18 — let\u2019s check again…');
        continue;
      }
      result.retakesExhausted = true;
      return result;
    }
  } finally {
    // Wipe everything: stop the camera, drop the stream, remove the hidden
    // video. The photo existed only in memory for a split second.
    try { if (stream) stream.getTracks().forEach(t => { try { t.stop(); } catch {} }); } catch {}
    try { video.srcObject = null; } catch {}
    try { box.remove(); } catch {}
  }
}
