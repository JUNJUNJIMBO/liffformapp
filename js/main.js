(function () {
  const curtain = document.getElementById("curtain");
  const grid = document.getElementById("grid");
  const tiles = [...document.querySelectorAll(".tile")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const viewer = document.getElementById("viewer");
  const viewerImg = document.getElementById("viewer-img");
  const viewerCount = document.getElementById("viewer-count");
  let current = "selected";
  let visible = [];
  let viewerIndex = 0;
  let lastTrigger = null;

  function finishCurtain() {
    curtain.classList.add("is-done");
    curtain.addEventListener("transitionend", () => {
      curtain.hidden = true;
    }, { once: true });
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    curtain.hidden = true;
  } else {
    requestAnimationFrame(() => requestAnimationFrame(finishCurtain));
  }

  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      seen.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  function watch(list) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      list.forEach((tile) => tile.classList.add("is-in"));
      return;
    }
    list.forEach((tile) => {
      if (!tile.classList.contains("is-in")) seen.observe(tile);
    });
  }

  function apply(filter) {
    current = filter;
    document.body.dataset.view = filter;
    const ranked = tiles.slice().sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
    if (filter !== "selected") {
      ranked.sort((a, b) => a.dataset.photo.localeCompare(b.dataset.photo, "en"));
    }
    ranked.forEach((tile) => grid.appendChild(tile));
    visible = [];
    ranked.forEach((tile) => {
      const show = filter === "all" || (filter === "selected" ? tile.dataset.selected === "1" : tile.dataset.group === filter);
      tile.hidden = !show;
      if (show) visible.push(tile);
    });
    filters.forEach((button) => {
      const on = button.dataset.filter === filter;
      if (on) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    watch(visible);
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      apply(button.dataset.filter);
      if (window.scrollY > 40) {
        document.getElementById("grid").scrollIntoView({ block: "start" });
      }
    });
  });

  document.querySelector(".brand").addEventListener("click", (event) => {
    event.preventDefault();
    apply("selected");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function renderViewer() {
    const tile = visible[viewerIndex];
    const source = tile.querySelector("img");
    viewerImg.src = source.currentSrc || source.src;
    viewerImg.alt = source.alt;
    viewerCount.textContent = String(viewerIndex + 1).padStart(2, "0") + "  /  " + String(visible.length).padStart(2, "0");
  }

  function openAt(tile) {
    viewerIndex = Math.max(0, visible.indexOf(tile));
    renderViewer();
    if (!viewer.open) viewer.showModal();
    document.body.classList.add("is-locked");
  }

  grid.addEventListener("click", (event) => {
    const tile = event.target.closest(".tile");
    if (!tile || tile.hidden) return;
    event.preventDefault();
    lastTrigger = tile;
    openAt(tile);
  });

  function step(delta) {
    if (!visible.length) return;
    viewerIndex = (viewerIndex + delta + visible.length) % visible.length;
    renderViewer();
  }

  viewer.querySelector("[data-view='-1']").addEventListener("click", () => step(-1));
  viewer.querySelector("[data-view='1']").addEventListener("click", () => step(1));
  viewer.querySelector("[data-close]").addEventListener("click", () => viewer.close());
  viewer.addEventListener("close", () => {
    document.body.classList.remove("is-locked");
    if (lastTrigger) lastTrigger.focus();
  });
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  });

  let swipeX = 0;
  let swipeY = 0;
  let trackingSwipe = false;

  viewer.addEventListener("touchstart", (event) => {
    if (!window.matchMedia("(max-width: 650px)").matches) return;
    if (event.touches.length !== 1 || event.target.closest("button")) return;
    swipeX = event.touches[0].clientX;
    swipeY = event.touches[0].clientY;
    trackingSwipe = true;
  }, { passive: true });

  viewer.addEventListener("touchend", (event) => {
    if (!trackingSwipe) return;
    trackingSwipe = false;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipeX;
    const dy = touch.clientY - swipeY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  }, { passive: true });

  viewer.addEventListener("touchcancel", () => {
    trackingSwipe = false;
  });

  const hashMap = {
    "#ceremony": "ceremony",
    "#couple": "couple",
    "#reception": "reception",
    "#day": "all",
    "#selected": "selected"
  };

  if (hashMap[location.hash]) apply(hashMap[location.hash]);
  else apply("selected");
})();
