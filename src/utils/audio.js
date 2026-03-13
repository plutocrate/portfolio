// Web Audio API based manager — gapless looping, gain-only volume control (no source restarts)
// FIXED: isPlaying() now uses an explicit `active` flag instead of polling gain.value,
//        which was unreliable during fade transitions and caused double-play glitches.

class AudioManager {
  constructor() {
    this._ctx          = null
    this._buffers      = {}
    this._loops        = {}      // key → { source, gain, active }
    this._gainNodes    = {}
    this._played       = new Set()
    this.muted         = false
    this.volume        = 0.6
    this._pendingLoads = {}
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {})
    }
    return this._ctx
  }

  load(key, url) {
    this._pendingLoads[key] = url
    if (this._ctx) this._loadBuffer(key, url)
  }

  async _loadBuffer(key, url) {
    if (this._buffers[key]) return
    try {
      const res = await fetch(url)
      const ab  = await res.arrayBuffer()
      const buf = await this._ctx.decodeAudioData(ab)
      this._buffers[key] = buf
    } catch (e) {
      console.warn('AudioManager: failed to load', url, e)
    }
  }

  async _ensureAllLoaded() {
    const promises = []
    for (const [key, url] of Object.entries(this._pendingLoads)) {
      if (!this._buffers[key]) promises.push(this._loadBuffer(key, url))
    }
    if (promises.length) await Promise.all(promises)
  }

  _getGain(key, volume) {
    if (!this._gainNodes[key]) {
      const g = this._ctx.createGain()
      g.gain.value = this.muted ? 0 : volume
      g.connect(this._ctx.destination)
      this._gainNodes[key] = g
    }
    return this._gainNodes[key]
  }

  _rampGain(gainNode, target, timeConstant = 0.04) {
    const ctx = this._ctx
    gainNode.gain.cancelScheduledValues(ctx.currentTime)
    gainNode.gain.setTargetAtTime(
      this.muted ? 0 : target,
      ctx.currentTime,
      timeConstant
    )
  }

  play(key, { loop = false, volume = this.volume } = {}) {
    const ctx = this._getCtx()

    const _start = () => {
      const buf = this._buffers[key]
      if (!buf) return

      if (loop) {
        if (this._loops[key]) {
          // Already running — mark active and ramp volume up
          this._loops[key].active = true
          this._rampGain(this._loops[key].gain, volume)
          return
        }
        const gain = this._getGain(key, 0)
        const source = ctx.createBufferSource()
        source.buffer    = buf
        source.loop      = true
        source.loopStart = 0
        source.loopEnd   = buf.duration
        source.connect(gain)
        source.start(0)
        this._loops[key] = { source, gain, active: true }
        this._rampGain(gain, volume, 0.03)
      } else {
        const gain = ctx.createGain()
        gain.gain.value = this.muted ? 0 : volume
        gain.connect(ctx.destination)
        const source = ctx.createBufferSource()
        source.buffer = buf
        source.connect(gain)
        source.start(0)
      }
    }

    if (this._buffers[key]) {
      _start()
    } else {
      this._loadBuffer(key, this._pendingLoads[key]).then(_start)
    }
  }

  playOnce(key, opts = {}) {
    if (this._played.has(key)) return
    this._played.add(key)
    this.play(key, opts)
  }

  // Uses explicit active flag — gain.value lies during fade transitions
  isPlaying(key) {
    const loop = this._loops[key]
    if (!loop) return false
    return loop.active === true
  }

  // Stop = mark inactive + fast ramp to 0 (source keeps running silently)
  stop(key) {
    const loop = this._loops[key]
    if (!loop) return
    loop.active = false
    this._rampGain(loop.gain, 0, 0.03)
  }

  kill(key) {
    const loop = this._loops[key]
    if (!loop) return
    try { loop.source.stop(0) } catch (_) {}
    delete this._loops[key]
    delete this._gainNodes[key]
  }

  fadeOut(key, duration = 500) {
    const loop = this._loops[key]
    if (!loop) return
    const ctx  = this._ctx
    if (!ctx) return
    loop.active = false  // mark immediately so isPlaying() is accurate
    const secs = duration / 1000
    loop.gain.gain.cancelScheduledValues(ctx.currentTime)
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, ctx.currentTime)
    loop.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + secs)
  }

  setMuted(val) {
    this.muted = val
    if (!this._ctx) return
    for (const g of Object.values(this._gainNodes)) {
      g.gain.setTargetAtTime(val ? 0 : this.volume, this._ctx.currentTime, 0.05)
    }
  }

  setVolume(vol) {
    this.volume = vol
    if (!this._ctx || this.muted) return
    for (const g of Object.values(this._gainNodes)) {
      g.gain.setTargetAtTime(vol, this._ctx.currentTime, 0.05)
    }
  }

  unlock() {
    this._getCtx()
    this._ensureAllLoaded()
  }
}

export const audioManager = new AudioManager()

// Single shared volume for run sound — use this constant in ALL scenes
export const RUN_VOLUME = 0.45
