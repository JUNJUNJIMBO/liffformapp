(function () {
  const opening = document.getElementById("opening");
  const slides = document.getElementById("slides");
  const main = document.querySelector("main");
  const footer = document.querySelector(".site-footer");
  const menuButton = document.querySelector(".menu-trigger");
  const menuLabel = menuButton.querySelector(".menu-label");
  const nav = document.getElementById("site-nav");
  nav.setAttribute("aria-hidden", "true");
  const frames = [...document.querySelectorAll(".seq [data-photo]")];
  const byName = new Map(frames.map((frame, index) => [frame.dataset.photo, index]));
  const viewer = document.getElementById("viewer");
  const viewerImg = document.getElementById("viewer-img");
  const viewerCaption = document.getElementById("viewer-caption");
  const viewerCount = document.getElementById("viewer-count");
  let viewerIndex = 0;
  let lastTrigger = null;

  function setCovered(covered) {
    main.inert = covered;
    footer.inert = covered;
  }

  function dismissOpening(focusSlides) {
    if (!opening || opening.hidden) return;
    const finish = () => {
      opening.hidden = true;
      document.body.classList.remove("is-opening");
      setCovered(false);
      if (focusSlides) {
        slides.focus({ preventScroll: true });
      }
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    opening.classList.add("is-leaving");
    opening.addEventListener("transitionend", finish, { once: true });
  }

  function closeMenu() {
    document.body.classList.remove("is-menu", "is-locked");
    nav.classList.remove("is-open");
    nav.setAttribute("aria-hidden", "true");
    menuButton.setAttribute("aria-expanded", "false");
    menuLabel.textContent = "MENU";
  }

  function openMenu() {
    document.body.classList.add("is-menu", "is-locked");
    nav.classList.add("is-open");
    nav.setAttribute("aria-hidden", "false");
    menuButton.setAttribute("aria-expanded", "true");
    menuLabel.textContent = "CLOSE";
    const first = nav.querySelector("a");
    if (first) first.focus();
  }

  menuButton.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) closeMenu();
    else openMenu();
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
      dismissOpening(false);
    });
  });

  document.getElementById("enter").addEventListener("click", () => {
    dismissOpening(true);
  });

  document.querySelector(".skip").addEventListener("click", () => {
    dismissOpening(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeMenu();
      menuButton.focus();
    }
  });

  const slideNodes = [...document.querySelectorAll(".slide")];
  const pager = document.querySelector(".pager");
  let slideIndex = 0;

  function showSlide(next) {
    slideIndex = (next + slideNodes.length) % slideNodes.length;
    slideNodes.forEach((slide, index) => {
      const current = index === slideIndex;
      slide.classList.toggle("is-current", current);
      slide.setAttribute("aria-hidden", current ? "false" : "true");
      slide.inert = !current;
    });
    const number = String(slideIndex + 1).padStart(2, "0");
    const total = String(slideNodes.length).padStart(2, "0");
    pager.textContent = number + "  /  " + total;
  }

  document.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("click", () => {
      showSlide(slideIndex + Number(button.dataset.dir));
    });
  });

  slides.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") showSlide(slideIndex + 1);
    if (event.key === "ArrowLeft") showSlide(slideIndex - 1);
  });

  let touchX = null;
  slides.addEventListener("touchstart", (event) => {
    touchX = event.changedTouches[0].clientX;
  }, { passive: true });
  slides.addEventListener("touchend", (event) => {
    if (touchX == null) return;
    const delta = event.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 48) showSlide(slideIndex + (delta < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  const lightQuery = new IntersectionObserver(([entry]) => {
    document.body.classList.toggle("is-light", entry.isIntersecting && entry.intersectionRatio > 0.12);
  }, { threshold: [0, 0.12, 0.4] });
  lightQuery.observe(slides);

  function renderViewer() {
    const frame = frames[viewerIndex];
    const source = frame.querySelector("img");
    viewerImg.src = source.currentSrc || source.src;
    viewerImg.alt = source.alt;
    viewerImg.width = source.width;
    viewerImg.height = source.height;
    viewerCaption.textContent = source.alt;
    viewerCount.textContent = String(viewerIndex + 1).padStart(3, "0") + "  /  " + String(frames.length).padStart(3, "0");
  }

  function openAt(index) {
    if (index == null) return;
    viewerIndex = index;
    renderViewer();
    if (!viewer.open) viewer.showModal();
  }

  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-photo]");
    if (!button || !viewer) return;
    lastTrigger = button;
    openAt(byName.get(button.dataset.photo));
  });

  viewer.querySelector("[data-view='-1']").addEventListener("click", () => {
    viewerIndex = (viewerIndex - 1 + frames.length) % frames.length;
    renderViewer();
  });
  viewer.querySelector("[data-view='1']").addEventListener("click", () => {
    viewerIndex = (viewerIndex + 1) % frames.length;
    renderViewer();
  });
  viewer.querySelector("[data-close]").addEventListener("click", () => viewer.close());
  viewer.addEventListener("close", () => {
    if (lastTrigger) lastTrigger.focus();
  });
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      viewerIndex = (viewerIndex + 1) % frames.length;
      renderViewer();
    }
    if (event.key === "ArrowLeft") {
      viewerIndex = (viewerIndex - 1 + frames.length) % frames.length;
      renderViewer();
    }
  });

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "送信先が未設定のため、この内容は届きません。連絡先が決まり次第、この欄を差し替えてください。";
  });

  if (location.hash && location.hash !== "#opening") {
    dismissOpening(false);
  } else {
    setCovered(true);
  }

  showSlide(0);
})();
