"use client";

/**
 * Mixed recorder for a watch-party call.
 *
 * Runs a MediaRecorder over a COMPOSITE stream built from every participant:
 *  - video: each participant's stream (local + remotes) is drawn onto a hidden
 *    <canvas> on every animation frame and captured via canvas.captureStream()
 *  - audio: every participant's audio track is mixed through a WebAudio graph
 *    into a MediaStreamAudioDestinationNode
 *
 * Only the host should start/own this; the resulting recording is downloaded
 * locally (no server upload).
 */

export type RecorderSource = {
  stream: MediaStream;
  name: string;
  muted?: boolean;
  mirrored?: boolean;
};

export class CallRecorder {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private videoEls = new Map<MediaStream, HTMLVideoElement>();
  private audioCtx: AudioContext | null = null;
  private audioDest: MediaStreamAudioDestinationNode | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private sources: RecorderSource[] = [];
  private boundStreams = new Set<MediaStream>();
  private stopRequested = false;
  private onResult: (blob: Blob) => void;

  constructor(onResult: (blob: Blob) => void) {
    this.onResult = onResult;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.canvas.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;width:1280px;height:720px;";
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  getMediaElement(stream: MediaStream): HTMLVideoElement {
    let el = this.videoEls.get(stream);
    if (!el) {
      el = document.createElement("video");
      el.autoplay = true;
      el.muted = true;
      el.playsInline = true;
      el.srcObject = stream;
      el.play().catch(() => {});
      this.videoEls.set(stream, el);
    }
    return el;
  }

  private draw() {
    if (this.stopRequested) return;
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, W, H);

    const live = this.sources.filter(
      (s) => s.stream && s.stream.getVideoTracks().length > 0
    );
    const n = Math.max(live.length, 1);
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cellW = W / cols;
    const cellH = H / rows;

    this.sources.forEach((src, i) => {
      const cx = (i % cols) * cellW;
      const cy = Math.floor(i / cols) * cellH;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cellW - 2, cellH - 2);
      ctx.clip();
      let el: HTMLVideoElement | null = null;
      if (src.stream.getVideoTracks().length > 0) {
        el = this.getMediaElement(src.stream);
      }
      if (el && el.videoWidth > 0) {
        const vw = el.videoWidth;
        const vh = el.videoHeight;
        const scale = Math.max((cellW - 2) / vw, (cellH - 2) / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = cx + (cellW - 2 - dw) / 2;
        const dy = cy + (cellH - 2 - dh) / 2;
        ctx.save();
        if (src.mirrored) {
          ctx.translate(dx + dw / 2, 0);
          ctx.scale(-1, 1);
          ctx.translate(-(dx + dw / 2), 0);
        }
        ctx.drawImage(el, dx, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.fillStyle = "#333333";
        ctx.fillRect(cx, cy, cellW - 2, cellH - 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(src.name.charAt(0).toUpperCase() || "?", cx + (cellW - 2) / 2, cy + (cellH - 2) / 2);
      }
      // name label
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      const lh = 22;
      ctx.fillRect(cx, cy + cellH - 2 - lh, cellW - 2, lh);
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(src.name, cx + 6, cy + cellH - 8);
      ctx.restore();
    });

    this.raf = requestAnimationFrame(() => this.draw());
  }

  private ensureAudioGraph() {
    if (this.audioCtx && this.audioDest) return;
    const AudioCtx: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioCtx();
    this.audioDest = this.audioCtx.createMediaStreamDestination();
  }

  private bindAudio(stream: MediaStream) {
    if (!this.audioCtx || !this.audioDest) return;
    if (this.boundStreams.has(stream)) return;
    const hasAudio = stream.getAudioTracks().length > 0;
    if (!hasAudio) return;
    try {
      const src = this.audioCtx.createMediaStreamSource(stream);
      const gain = this.audioCtx.createGain();
      gain.gain.value = 1;
      src.connect(gain);
      gain.connect(this.audioDest);
      this.boundStreams.add(stream);
    } catch {
      // some streams can't be re-sourced; skip
    }
  }

  start(sources: RecorderSource[]): boolean {
    if (this.recorder && this.recorder.state !== "inactive") return false;
    this.sources = sources;    this.stopRequested = false;
    this.chunks = [];

    let mimeType = "video/webm";
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ) {
      mimeType = "video/webm;codecs=vp9";
    } else if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported("video/mp4")
    ) {
      mimeType = "video/mp4";
    }

    try {
      this.ensureAudioGraph();
      this.draw();

      const compVideo = this.canvas.captureStream(30);
      const compAudio = this.audioDest!.stream;
      // Bind current + any future remote audio into the mixer.
      this.sources.forEach((s) => this.bindAudio(s.stream));
      // Start silent so a participant with no audio still records.
      const composite = new MediaStream();
      compVideo.getVideoTracks().forEach((t) => composite.addTrack(t));
      composite.addTrack(compAudio.getAudioTracks()[0]);

      const recorder = new MediaRecorder(composite, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
        audioBitsPerSecond: 128_000,
      });
      this.recorder = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.chunks.push(e.data);
      };
      recorder.onstop = () => {
        this.cleanup();
        const blob = new Blob(this.chunks, { type: recorder.mimeType || "video/webm" });
        this.chunks = [];
        if (blob.size > 0) this.onResult(blob);
      };
      recorder.start(1000);
      return true;
    } catch (error) {
      console.error("[call-recorder] failed to start:", error);
      this.cleanup();
      return false;
    }
  }

  stop() {
    this.stopRequested = true;
    cancelAnimationFrame(this.raf);
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    } else {
      this.cleanup();
    }
  }

  /** Swap the live participant set (new joiners/leavers while recording). */
  updateSources(sources: RecorderSource[]) {
    this.sources = sources;
    if (this.audioCtx && this.audioDest) {
      sources.forEach((s) => this.bindAudio(s.stream));
    }
  }

  private cleanup() {
    cancelAnimationFrame(this.raf);
    this.videoEls.forEach((el) => {
      try {
        el.pause();
        el.srcObject = null;
      } catch {
        // noop
      }
    });
    this.videoEls.clear();
    try {
      this.audioCtx?.close();
    } catch {
      // noop
    }
    this.audioCtx = null;
    this.audioDest = null;
    this.boundStreams.clear();
    this.recorder = null;
    try {
      this.canvas.remove();
    } catch {
      // noop
    }
  }
}
