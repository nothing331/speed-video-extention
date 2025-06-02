class VideoSpeedController {
  constructor() {
    this.videos = [];
    this.overlays = new Map();
    this.speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    this.init();
  }

  init() {
    this.observeVideos();
    this.setupKeyboardShortcuts();
  }

  observeVideos() {
    // Initial scan for videos
    this.scanForVideos();

    // Watch for new videos being added
    const observer = new MutationObserver(() => {
      this.scanForVideos();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  scanForVideos() {
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      if (!this.videos.includes(video)) {
        this.videos.push(video);
        this.createOverlay(video);
        this.setupVideoEvents(video);
      }
    });

    // Remove overlays for videos that no longer exist
    this.videos = this.videos.filter((video) => {
      if (!document.contains(video)) {
        this.removeOverlay(video);
        return false;
      }
      return true;
    });
  }

  createOverlay(video) {
    const overlay = document.createElement("div");
    overlay.className = "video-speed-overlay";
    overlay.innerHTML = `
        <div class="speed-controls">
          <button class="speed-btn decrease" title="Decrease Speed">−</button>
          <span class="speed-display">${video.playbackRate.toFixed(2)}x</span>
          <button class="speed-btn increase" title="Increase Speed">+</button>
          <button class="speed-btn reset" title="Reset Speed">1x</button>
        </div>
      `;

    // Position overlay
    this.positionOverlay(overlay, video);

    // Add event listeners
    this.setupOverlayEvents(overlay, video);

    // Add to DOM
    document.body.appendChild(overlay);
    this.overlays.set(video, overlay);

    // Update position on resize
    window.addEventListener("resize", () => {
      this.positionOverlay(overlay, video);
    });

    // Update position on scroll
    window.addEventListener("scroll", () => {
      this.positionOverlay(overlay, video);
    });
  }

  positionOverlay(overlay, video) {
    const rect = video.getBoundingClientRect();
    overlay.style.position = "fixed";
    overlay.style.top = `${rect.top + 10}px`;
    overlay.style.left = `${rect.left + 10}px`;
    overlay.style.zIndex = "10000";
    overlay.style.display =
      rect.width > 0 && rect.height > 0 ? "block" : "none";
  }

  setupOverlayEvents(overlay, video) {
    const decreaseBtn = overlay.querySelector(".decrease");
    const increaseBtn = overlay.querySelector(".increase");
    const resetBtn = overlay.querySelector(".reset");
    const speedDisplay = overlay.querySelector(".speed-display");

    decreaseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.decreaseSpeed(video, speedDisplay);
    });

    increaseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.increaseSpeed(video, speedDisplay);
    });

    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.resetSpeed(video, speedDisplay);
    });

    // Hide overlay when not hovering over video
    let hideTimeout;
    const showOverlay = () => {
      clearTimeout(hideTimeout);
      overlay.style.opacity = "1";
    };

    const hideOverlay = () => {
      hideTimeout = setTimeout(() => {
        overlay.style.opacity = "0.3";
      }, 2000);
    };

    video.addEventListener("mouseenter", showOverlay);
    video.addEventListener("mouseleave", hideOverlay);
    overlay.addEventListener("mouseenter", showOverlay);
    overlay.addEventListener("mouseleave", hideOverlay);

    // Initial hide
    hideOverlay();
  }

  setupVideoEvents(video) {
    // Update overlay position when video size changes
    const resizeObserver = new ResizeObserver(() => {
      const overlay = this.overlays.get(video);
      if (overlay) {
        this.positionOverlay(overlay, video);
      }
    });
    resizeObserver.observe(video);
  }

  decreaseSpeed(video, display) {
    const currentSpeed = video.playbackRate;
    const currentIndex = this.speeds.findIndex(
      (speed) => speed >= currentSpeed
    );
    const newIndex = Math.max(0, currentIndex - 1);
    this.setSpeed(video, this.speeds[newIndex], display);
  }

  increaseSpeed(video, display) {
    const currentSpeed = video.playbackRate;
    const currentIndex = this.speeds.findIndex((speed) => speed > currentSpeed);
    const newIndex =
      currentIndex === -1 ? this.speeds.length - 1 : currentIndex;
    this.setSpeed(video, this.speeds[newIndex], display);
  }

  resetSpeed(video, display) {
    this.setSpeed(video, 1, display);
  }

  setSpeed(video, speed, display) {
    video.playbackRate = speed;
    display.textContent = `${speed.toFixed(2)}x`;
    this.showSpeedNotification(video, speed);
  }

  showSpeedNotification(video, speed) {
    const notification = document.createElement("div");
    notification.className = "speed-notification";
    notification.textContent = `Speed: ${speed.toFixed(2)}x`;

    const rect = video.getBoundingClientRect();
    notification.style.position = "fixed";
    notification.style.top = `${rect.top + rect.height / 2}px`;
    notification.style.left = `${rect.left + rect.width / 2}px`;
    notification.style.transform = "translate(-50%, -50%)";
    notification.style.zIndex = "10001";

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 1000);
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Only work when a video is focused or playing
      const activeVideo = this.videos.find(
        (video) => !video.paused || document.activeElement === video
      );

      if (!activeVideo) return;

      const overlay = this.overlays.get(activeVideo);
      const speedDisplay = overlay?.querySelector(".speed-display");

      switch (e.key) {
        case "-":
        case "_":
          e.preventDefault();
          this.decreaseSpeed(activeVideo, speedDisplay);
          break;
        case "+":
        case "=":
          e.preventDefault();
          this.increaseSpeed(activeVideo, speedDisplay);
          break;
        case "0":
          e.preventDefault();
          this.resetSpeed(activeVideo, speedDisplay);
          break;
      }
    });
  }

  removeOverlay(video) {
    const overlay = this.overlays.get(video);
    if (overlay) {
      overlay.remove();
      this.overlays.delete(video);
    }
  }
}

// Add CSS styles
const style = document.createElement("style");
style.textContent = `
    .video-speed-overlay {
      position: fixed;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      color: white;
      backdrop-filter: blur(10px);
      transition: opacity 0.3s ease;
      pointer-events: auto;
      user-select: none;
    }
  
    .speed-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  
    .speed-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 4px;
      color: white;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background 0.2s ease;
    }
  
    .speed-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  
    .speed-btn:active {
      background: rgba(255, 255, 255, 0.4);
    }
  
    .speed-display {
      min-width: 35px;
      text-align: center;
      font-weight: bold;
      color: #fff;
    }
  
    .speed-notification {
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: bold;
      backdrop-filter: blur(10px);
      animation: speedNotification 1s ease-out forwards;
      pointer-events: none;
    }
  
    @keyframes speedNotification {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }
      20% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      80% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }
    }
  `;

document.head.appendChild(style);

// Initialize the controller
new VideoSpeedController();
