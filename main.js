const topbar = document.getElementById("topbar");

if (topbar) {
  let latestScrollY = window.scrollY;
  let isTicking = false;
  let isScrolled = latestScrollY > 6;

  const updateTopbar = () => {
    const nextScrolled = latestScrollY > 6;
    if (nextScrolled !== isScrolled) {
      topbar.classList.toggle("scrolled", nextScrolled);
      isScrolled = nextScrolled;
    }
    isTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      latestScrollY = window.scrollY;
      if (!isTicking) {
        window.requestAnimationFrame(updateTopbar);
        isTicking = true;
      }
    },
    { passive: true }
  );

  updateTopbar();
}

const pageName = document.body.dataset.page;
const navLinks = document.querySelectorAll("[data-link]");
const themeStorageKey = "staff_theme";
const settingsStorageKey = "staff_settings";
const themeModes = ["light", "dark", "system"];
const pageShortcuts = {
  h: "index.html",
  w: "workspace.html",
  s: "services.html",
  t: "settings.html",
  q: "faq.html",
  e: "technical.html",
  v: "version.html",
  l: "legal.html",
  p: "privacy.html"
};
const root = document.documentElement;
const brand = document.querySelector(".brand");
const portalStoragePrefixes = ["staff_layout_"];
const portalStorageKeys = [themeStorageKey, settingsStorageKey, "public_room_messages"];
const systemThemeMedia =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
const defaultWeatherLocation = {
  label: "Yangon",
  latitude: 16.8661,
  longitude: 96.1951
};
let weatherWidgetIconNode = null;
let weatherWidgetStatusNode = null;
let weatherWidgetLocationNode = null;
let weatherWidgetMetaNode = null;
let weatherTriggerNode = null;
let weatherPopoverIconNode = null;
let latestWeatherSummary = "Weather data is loading for Yangon.";
const petScriptsUrl = "assets/pet-scripts.json";
const fallbackPetScripts = {
  scriptsByCondition: {
    sedentary_long: [
      "Time to stand up and stretch for one minute.",
      "Tiny exercise break. Your chair can wait.",
      "Please walk a few steps and wake your legs up."
    ],
    cold_weather: [
      "It feels cold. Keep warm and relax your shoulders.",
      "Chilly reminder: warm your hands before more typing."
    ],
    mosquito_care: [
      "Mosquito check. Keep repellent nearby if needed.",
      "Evening bug reminder: protect your skin and rest easy."
    ],
    eye_care: [
      "Eye break time. Look away from the screen for a moment.",
      "Blink slowly and let your eyes relax."
    ],
    relax_break: [
      "Take one deep breath and unclench your jaw.",
      "A calm minute still counts as progress."
    ],
    music_boost: [
      "A gentle song could make this task feel lighter.",
      "Queue one favorite track and keep moving."
    ],
    kindness_love: [
      "Be kind to yourself. You are doing enough for this moment.",
      "A little love for your future self starts with one small break."
    ]
  }
};
let deskPetNode = null;
let deskPetButtonNode = null;
let deskPetBubbleNode = null;
let deskPetBubbleTimer = null;
let deskPetReminderTimer = null;
let deskPetScriptsByCondition = { ...fallbackPetScripts.scriptsByCondition };
let deskPetLastMessage = "";
let deskPetLastCondition = "";
let deskPetVisibleAccumulatedMs = 0;
let deskPetVisibleStartedAt = document.hidden ? null : Date.now();
let latestWeatherState = {
  icon: "cloud",
  temperature: null,
  isDay: true,
  location: defaultWeatherLocation.label
};

function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (themeModes.includes(stored)) {
      return stored;
    }
  } catch (_error) {
    return null;
  }
  return null;
}

function setStoredTheme(theme) {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch (_error) {
    // Ignore storage write failures (private mode / blocked storage).
  }
}

function getStoredSettings() {
  try {
    const stored = window.localStorage.getItem(settingsStorageKey);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function setStoredSettings(settings) {
  try {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  } catch (_error) {
    // Ignore storage write failures (private mode / blocked storage).
  }
}

function slugifyText(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function getLayoutStorageKey() {
  return `staff_layout_${pageName || "page"}`;
}

function getLayoutSections() {
  if (pageName === "technical") {
    return [...document.querySelectorAll("[data-doc-section]")];
  }

  const main = document.querySelector("main");
  if (!main) {
    return [];
  }

  return [...main.querySelectorAll(":scope > section")];
}

function getSectionLabel(section, index) {
  const heading = section.querySelector("h1, h2, h3");
  if (heading?.textContent.trim()) {
    return heading.textContent.trim();
  }

  const eyebrow = section.querySelector(".eyebrow");
  if (eyebrow?.textContent.trim()) {
    return eyebrow.textContent.trim();
  }

  return `Section ${index + 1}`;
}

function getStoredLayoutState() {
  try {
    const stored = window.localStorage.getItem(getLayoutStorageKey());
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") {
      return {
        order: Array.isArray(parsed.order) ? parsed.order : [],
        hidden: Array.isArray(parsed.hidden) ? parsed.hidden : []
      };
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function setStoredLayoutState(state) {
  try {
    window.localStorage.setItem(getLayoutStorageKey(), JSON.stringify(state));
  } catch (_error) {
    // Ignore layout write failures.
  }
}

function clearStoredLayoutState() {
  try {
    window.localStorage.removeItem(getLayoutStorageKey());
  } catch (_error) {
    // Ignore layout clear failures.
  }
}

function clearPortalStorage() {
  try {
    const keysToRemove = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) {
        continue;
      }

      if (
        portalStorageKeys.includes(key) ||
        portalStoragePrefixes.some((prefix) => key.startsWith(prefix))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (_error) {
    // Ignore storage clear failures.
  }
}

function layoutDragIconSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/></svg>';
}

function layoutHideIconSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"/><path d="m4 4 16 16"/></svg>';
}

function layoutRestoreIconSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function layoutResetIconSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
}

function layoutAssistantPetSvg() {
  return `
    <svg class="layout-assistant-pet-svg" viewBox="0 0 96 96" aria-hidden="true">
      <path class="layout-assistant-pet-ear" d="M29 34 34 19l12 12" />
      <path class="layout-assistant-pet-ear" d="M51 31 64 20l3 16" />
      <path class="layout-assistant-pet-tail" d="M72 58c8 2 12 9 10 15-2 6-8 9-14 7" />
      <ellipse class="layout-assistant-pet-body" cx="48" cy="56" rx="23" ry="21" />
      <ellipse class="layout-assistant-pet-belly" cx="48" cy="61" rx="12" ry="10" />
      <circle class="layout-assistant-pet-eye" cx="40" cy="52" r="2.7" />
      <circle class="layout-assistant-pet-eye" cx="56" cy="52" r="2.7" />
      <circle class="layout-assistant-pet-blush" cx="34" cy="58" r="3" />
      <circle class="layout-assistant-pet-blush" cx="62" cy="58" r="3" />
      <path class="layout-assistant-pet-mouth" d="M44 60c1.8 2 5.2 2 7 0" />
      <ellipse class="layout-assistant-pet-paw" cx="39" cy="74" rx="5" ry="3.8" />
      <ellipse class="layout-assistant-pet-paw" cx="57" cy="74" rx="5" ry="3.8" />
    </svg>
  `;
}

function setupPageLayoutManager() {
  const sections = getLayoutSections();
  if (!sections.length) {
    return;
  }

  const main = document.querySelector("main");
  if (!main) {
    return;
  }

  const ids = new Set();
  sections.forEach((section, index) => {
    const label = getSectionLabel(section, index);
    let baseId = section.id ? slugifyText(section.id) : slugifyText(label);
    if (!baseId) {
      baseId = `section-${index + 1}`;
    }

    let layoutId = `${pageName || "page"}-${baseId}`;
    let counter = 2;
    while (ids.has(layoutId)) {
      layoutId = `${pageName || "page"}-${baseId}-${counter}`;
      counter += 1;
    }

    ids.add(layoutId);
    section.dataset.layoutId = layoutId;
    section.dataset.layoutLabel = label;
    section.classList.add("layout-section");
  });

  const initialOrder = sections.map((section) => section.dataset.layoutId);
  const initialTopicOrder = pageName === "technical"
    ? [...document.querySelectorAll("[data-doc-topic]")].map((button) => button.dataset.docTopic)
    : [];
  const state = getStoredLayoutState() || {
    order: [...initialOrder],
    hidden: []
  };
  const sectionMap = new Map(
    sections.map((section) => [section.dataset.layoutId, section])
  );

  const manager = document.createElement("div");
  manager.className = "layout-assistant";
  manager.innerHTML = `
    <button class="layout-assistant-ball" type="button" aria-label="Open page customization assistant" aria-expanded="false" data-layout-toggle>
      <span class="layout-assistant-icon">
        ${layoutAssistantPetSvg()}
      </span>
      <span class="layout-assistant-badge" data-layout-badge hidden></span>
      <span class="pet-namecard pet-namecard-assistant" aria-hidden="true">
        <strong>Tom</strong>
        <span>Layout Love Engineer</span>
      </span>
    </button>
    <div class="layout-assistant-panel" data-layout-panel hidden>
      <div class="layout-assistant-panel-head">
        <strong>Customize This Page</strong>
        <span>Hide sections or drag them into the order you prefer.</span>
      </div>
      <div class="layout-manager-actions">
        <div class="layout-hidden-list" data-layout-hidden-list></div>
        <button class="layout-reset-btn" type="button" data-layout-reset>
          ${layoutResetIconSvg()}
          <span>Reset Layout</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(manager);

  const hiddenList = manager.querySelector("[data-layout-hidden-list]");
  const resetButton = manager.querySelector("[data-layout-reset]");
  const toggleButton = manager.querySelector("[data-layout-toggle]");
  const panel = manager.querySelector("[data-layout-panel]");
  const badge = manager.querySelector("[data-layout-badge]");
  let draggedSectionId = "";

  function setAssistantOpen(isOpen) {
    if (!toggleButton || !panel) {
      return;
    }

    toggleButton.setAttribute("aria-expanded", String(isOpen));
    manager.classList.toggle("is-open", isOpen);
    panel.hidden = !isOpen;
  }

  function getCurrentSections() {
    return getLayoutSections().filter((section) => section.dataset.layoutId);
  }

  function syncDocumentationTopicOrder() {
    if (pageName !== "technical") {
      return;
    }

    const topicList = document.querySelector(".docs-topic-list");
    if (!topicList) {
      return;
    }

    getCurrentSections().forEach((section) => {
      const topicButton = topicList.querySelector(`[data-doc-topic="${section.id}"]`);
      if (topicButton) {
        topicList.appendChild(topicButton);
      }
    });
  }

  function refreshDocumentationLayout() {
    if (pageName === "technical" && typeof window.refreshDocumentationPageLayout === "function") {
      window.refreshDocumentationPageLayout();
    }
  }

  function saveLayoutState() {
    const order = getCurrentSections().map((section) => section.dataset.layoutId);
    const hidden = order.filter((id) => {
      const section = sectionMap.get(id);
      return section?.dataset.layoutHidden === "true";
    });

    state.order = order;
    state.hidden = hidden;
    setStoredLayoutState(state);
  }

  function setSectionHidden(section, hidden) {
    section.dataset.layoutHidden = hidden ? "true" : "false";
    section.classList.toggle("is-layout-hidden", hidden);
    refreshDocumentationLayout();
  }

  function renderHiddenSections() {
    if (!hiddenList) {
      return;
    }

    const hiddenSections = getCurrentSections().filter(
      (section) => section.dataset.layoutHidden === "true"
    );

    if (badge) {
      badge.textContent = String(hiddenSections.length);
      badge.hidden = hiddenSections.length === 0;
    }

    if (!hiddenSections.length) {
      hiddenList.innerHTML = '<span class="layout-hidden-empty">No hidden sections</span>';
      return;
    }

    hiddenList.innerHTML = "";
    hiddenSections.forEach((section) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "layout-hidden-chip";
      chip.innerHTML = `${layoutRestoreIconSvg()}<span>${section.dataset.layoutLabel}</span>`;
      chip.addEventListener("click", () => {
        setSectionHidden(section, false);
        renderHiddenSections();
        saveLayoutState();
      });
      hiddenList.appendChild(chip);
    });
  }

  function applyStoredOrder(order) {
    const parent = getCurrentSections()[0]?.parentElement;
    if (!parent) {
      return;
    }

    order.forEach((id) => {
      const section = sectionMap.get(id);
      if (section && section.parentElement === parent) {
        parent.appendChild(section);
      }
    });

    syncDocumentationTopicOrder();
  }

  function resetLayout() {
    applyStoredOrder(initialOrder);
    getCurrentSections().forEach((section) => {
      setSectionHidden(section, false);
    });

    if (pageName === "technical") {
      const topicList = document.querySelector(".docs-topic-list");
      if (topicList) {
        initialTopicOrder.forEach((topicId) => {
          const button = topicList.querySelector(`[data-doc-topic="${topicId}"]`);
          if (button) {
            topicList.appendChild(button);
          }
        });
      }
    }

    state.order = [...initialOrder];
    state.hidden = [];
    clearStoredLayoutState();
    renderHiddenSections();
    refreshDocumentationLayout();
  }

  sections.forEach((section) => {
    const label = section.dataset.layoutLabel || "Section";
    const controls = document.createElement("div");
    controls.className = "layout-section-controls";
    controls.innerHTML = `
      <button class="layout-control-btn layout-drag-handle" type="button" draggable="true" aria-label="Drag to reorder ${label}" title="Drag to reorder">
        ${layoutDragIconSvg()}
      </button>
      <button class="layout-control-btn layout-hide-btn" type="button" aria-label="Hide ${label}" title="Hide section">
        ${layoutHideIconSvg()}
      </button>
    `;
    section.appendChild(controls);

    const dragHandle = controls.querySelector(".layout-drag-handle");
    const hideButton = controls.querySelector(".layout-hide-btn");

    if (dragHandle) {
      dragHandle.addEventListener("dragstart", (event) => {
        draggedSectionId = section.dataset.layoutId || "";
        section.classList.add("is-layout-dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", draggedSectionId);
        }
      });

      dragHandle.addEventListener("dragend", () => {
        draggedSectionId = "";
        getCurrentSections().forEach((item) => {
          item.classList.remove("is-layout-dragging", "is-layout-drop-target");
        });
        saveLayoutState();
      });
    }

    if (hideButton) {
      hideButton.addEventListener("click", () => {
        setSectionHidden(section, true);
        renderHiddenSections();
        saveLayoutState();
      });
    }

    section.addEventListener("dragover", (event) => {
      if (!draggedSectionId || draggedSectionId === section.dataset.layoutId) {
        return;
      }

      event.preventDefault();
      const draggedSection = sectionMap.get(draggedSectionId);
      if (!draggedSection || !section.parentElement) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const insertAfter = event.clientY > rect.top + rect.height / 2;
      section.classList.add("is-layout-drop-target");

      if (insertAfter) {
        section.parentElement.insertBefore(draggedSection, section.nextSibling);
      } else {
        section.parentElement.insertBefore(draggedSection, section);
      }

      syncDocumentationTopicOrder();
    });

    section.addEventListener("dragleave", () => {
      section.classList.remove("is-layout-drop-target");
    });

    section.addEventListener("drop", (event) => {
      if (!draggedSectionId) {
        return;
      }

      event.preventDefault();
      section.classList.remove("is-layout-drop-target");
      saveLayoutState();
    });
  });

  if (resetButton) {
    resetButton.addEventListener("click", resetLayout);
  }

  if (toggleButton && panel) {
    toggleButton.addEventListener("click", (event) => {
      event.stopPropagation();
      setAssistantOpen(panel.hidden);
    });

    manager.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", () => {
      setAssistantOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setAssistantOpen(false);
      }
    });
  }

  applyStoredOrder(state.order);
  getCurrentSections().forEach((section) => {
    setSectionHidden(section, state.hidden.includes(section.dataset.layoutId));
  });
  renderHiddenSections();
  saveLayoutState();
}

function setupDocumentationPage() {
  const searchInput = document.querySelector("[data-doc-search]");
  const topicButtons = [...document.querySelectorAll("[data-doc-topic]")];
  const sections = [...document.querySelectorAll("[data-doc-section]")];
  const emptyState = document.querySelector("[data-doc-empty]");

  if (!searchInput || !topicButtons.length || !sections.length) {
    return;
  }

  const topicMap = new Map(
    topicButtons.map((button) => [button.dataset.docTopic, button])
  );

  function setActiveTopic(sectionId, updateHash = false) {
    topicButtons.forEach((button) => {
      const isActive = button.dataset.docTopic === sectionId;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (updateHash && window.location.hash !== `#${sectionId}`) {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  }

  function getVisibleSections() {
    return [...document.querySelectorAll("[data-doc-section]")].filter((section) => !section.hidden);
  }

  function filterSections() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    sections.forEach((section) => {
      const text = [
        section.dataset.docTitle || "",
        section.dataset.docKeywords || "",
        section.textContent || ""
      ]
        .join(" ")
        .toLowerCase();
      const isLayoutHidden = section.dataset.layoutHidden === "true";
      const isVisible = !isLayoutHidden && (!query || text.includes(query));
      section.hidden = !isVisible;

      const topicButton = topicMap.get(section.id);
      if (topicButton) {
        topicButton.hidden = !isVisible;
      }

      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }

    const visibleSections = getVisibleSections();
    if (!visibleSections.length) {
      return;
    }

    const currentHash = window.location.hash.slice(1);
    const nextSection =
      visibleSections.find((section) => section.id === currentHash) || visibleSections[0];
    setActiveTopic(nextSection.id);
  }

  topicButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));
    button.addEventListener("click", () => {
      const sectionId = button.dataset.docTopic;
      if (!sectionId) {
        return;
      }

      const targetSection = document.getElementById(sectionId);
      if (!targetSection || targetSection.hidden) {
        return;
      }

      setActiveTopic(sectionId, true);
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  searchInput.addEventListener("input", filterSections);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting && !entry.target.hidden);
        if (!visibleEntry) {
          return;
        }

        setActiveTopic(visibleEntry.target.id);
      },
      {
        rootMargin: "-28% 0px -55% 0px",
        threshold: 0.12
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  const initialHash = window.location.hash.slice(1);
  const initialSection = sections.find((section) => section.id === initialHash);
  if (initialSection) {
    setActiveTopic(initialSection.id);
  }

  window.refreshDocumentationPageLayout = filterSections;
  filterSections();
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function handlePageShortcut(event) {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return false;
  }

  if (isTypingTarget(event.target)) {
    return false;
  }

  const key = event.key.toLowerCase();
  const nextPage = pageShortcuts[key];
  if (!nextPage) {
    return false;
  }

  event.preventDefault();

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  if (currentPath === nextPage) {
    return true;
  }

  window.location.href = nextPage;
  return true;
}

function setupWeatherWidget() {
  if (!brand || !brand.parentElement) {
    return;
  }

  const brandGroup = document.createElement("div");
  brandGroup.className = "brand-group";

  brand.parentElement.insertBefore(brandGroup, brand);
  brandGroup.appendChild(brand);

  const weatherWidget = document.createElement("div");
  weatherWidget.className = "nav-weather";
  weatherWidget.innerHTML = `
    <button class="weather-trigger" type="button" aria-label="Current weather">
      <span class="weather-trigger-icon" data-nav-weather-icon>
        ${weatherIconSvg("cloud")}
      </span>
    </button>
    <div class="weather-popover" role="status" aria-live="polite">
      <div class="weather-popover-top">
        <span class="weather-popover-icon" data-nav-weather-panel-icon>
          ${weatherIconSvg("cloud")}
        </span>
        <div class="weather-popover-copy">
          <strong data-nav-weather-status>Loading weather...</strong>
          <span data-nav-weather-location>Yangon</span>
        </div>
      </div>
      <p class="weather-popover-meta" data-nav-weather-meta>Using Yangon until location is available.</p>
    </div>
  `;

  brandGroup.appendChild(weatherWidget);

  weatherTriggerNode = weatherWidget.querySelector(".weather-trigger");
  weatherWidgetIconNode = weatherWidget.querySelector("[data-nav-weather-icon]");
  weatherPopoverIconNode = weatherWidget.querySelector("[data-nav-weather-panel-icon]");
  weatherWidgetStatusNode = weatherWidget.querySelector("[data-nav-weather-status]");
  weatherWidgetLocationNode = weatherWidget.querySelector("[data-nav-weather-location]");
  weatherWidgetMetaNode = weatherWidget.querySelector("[data-nav-weather-meta]");
}

function deskPetSvg() {
  return `
    <svg class="desk-pet-svg" viewBox="0 0 96 96" aria-hidden="true">
      <path class="desk-pet-tail" d="M72 57c9 1 14 8 12 16-2 8-10 12-18 8" />
      <path class="desk-pet-ear" d="M31 28 39 17l9 14" />
      <path class="desk-pet-ear" d="M49 31 58 17l8 13" />
      <ellipse class="desk-pet-body" cx="48" cy="56" rx="24" ry="22" />
      <ellipse class="desk-pet-belly" cx="48" cy="61" rx="13" ry="11" />
      <circle class="desk-pet-eye" cx="40" cy="52" r="2.8" />
      <circle class="desk-pet-eye" cx="56" cy="52" r="2.8" />
      <circle class="desk-pet-blush" cx="33" cy="58" r="3.2" />
      <circle class="desk-pet-blush" cx="63" cy="58" r="3.2" />
      <path class="desk-pet-mouth" d="M45 60c1.5 2 4.5 2 6 0" />
      <path class="desk-pet-whisker" d="M21 54h11M21 59h10M64 54h11M65 59h10" />
      <ellipse class="desk-pet-paw" cx="39" cy="74" rx="5.5" ry="4" />
      <ellipse class="desk-pet-paw" cx="57" cy="74" rx="5.5" ry="4" />
    </svg>
  `;
}

function setupDeskPet() {
  if (!document.body || deskPetNode) {
    return;
  }

  const pet = document.createElement("div");
  pet.className = "desk-pet";
  pet.hidden = true;
  pet.innerHTML = `
    <button class="desk-pet-button" type="button" aria-label="Desk pet">
      <span class="pet-namecard" aria-hidden="true">
        <strong>Daisy</strong>
        <span>Chief Comfort Officer</span>
      </span>
      <span class="desk-pet-bubble" aria-hidden="true">Hi</span>
      ${deskPetSvg()}
    </button>
  `;

  document.body.appendChild(pet);
  deskPetNode = pet;
  deskPetButtonNode = pet.querySelector(".desk-pet-button");
  deskPetBubbleNode = pet.querySelector(".desk-pet-bubble");

  if (deskPetButtonNode) {
    deskPetButtonNode.addEventListener("click", () => {
      if (!deskPetNode || deskPetNode.hidden) {
        return;
      }

      showDeskPetReminder();
      queueDeskPetReminder(180000);
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && deskPetVisibleStartedAt) {
      deskPetVisibleAccumulatedMs += Date.now() - deskPetVisibleStartedAt;
      deskPetVisibleStartedAt = null;
    } else if (!document.hidden && !deskPetVisibleStartedAt) {
      deskPetVisibleStartedAt = Date.now();
    }

    syncDeskPet();
  });
}

async function loadDeskPetScripts() {
  if (typeof fetch !== "function") {
    deskPetScriptsByCondition = { ...fallbackPetScripts.scriptsByCondition };
    return;
  }

  try {
    const response = await fetch(petScriptsUrl);
    if (!response.ok) {
      throw new Error(`Pet script request failed with ${response.status}`);
    }

    const data = await response.json();
    if (data && data.scriptsByCondition && typeof data.scriptsByCondition === "object") {
      deskPetScriptsByCondition = data.scriptsByCondition;
      return;
    }
  } catch (_error) {
    deskPetScriptsByCondition = { ...fallbackPetScripts.scriptsByCondition };
  }
}

function animateDeskPetBubble(message) {
  if (!deskPetNode || !deskPetBubbleNode || !message) {
    return;
  }

  deskPetBubbleNode.textContent = message;
  deskPetNode.classList.remove("is-wave");
  void deskPetNode.offsetWidth;
  deskPetNode.classList.add("is-wave");

  window.clearTimeout(deskPetBubbleTimer);
  deskPetBubbleTimer = window.setTimeout(() => {
    if (deskPetNode) {
      deskPetNode.classList.remove("is-wave");
    }
  }, 5200);
}

function getDeskPetActiveConditions() {
  const visibleMs =
    deskPetVisibleAccumulatedMs +
    (deskPetVisibleStartedAt ? Date.now() - deskPetVisibleStartedAt : 0);
  const elapsedMinutes = Math.floor(visibleMs / 60000);
  const active = new Set(["kindness_love"]);

  if (elapsedMinutes >= 12) {
    active.add("music_boost");
  }

  if (elapsedMinutes >= 18) {
    active.add("eye_care");
  }

  if (elapsedMinutes >= 24) {
    active.add("posture_check");
  }

  if (elapsedMinutes >= 30) {
    active.add("relax_break");
  }

  if (elapsedMinutes >= 36) {
    active.add("hydration_break");
  }

  if (elapsedMinutes >= 45) {
    active.add("sedentary_long");
  }

  if (typeof latestWeatherState.temperature === "number" && latestWeatherState.temperature <= 20) {
    active.add("cold_weather");
  }

  if (["rain", "fog", "storm"].includes(latestWeatherState.icon)) {
    active.add("rainy_weather");
  }

  if (
    ["rain", "fog", "storm"].includes(latestWeatherState.icon) ||
    (!latestWeatherState.isDay && typeof latestWeatherState.temperature === "number" && latestWeatherState.temperature >= 26)
  ) {
    active.add("mosquito_care");
  }

  return [
    "sedentary_long",
    "cold_weather",
    "mosquito_care",
    "rainy_weather",
    "eye_care",
    "posture_check",
    "hydration_break",
    "relax_break",
    "music_boost",
    "kindness_love"
  ].filter((condition) => active.has(condition));
}

function pickDeskPetScript() {
  const activeConditions = getDeskPetActiveConditions().filter((condition) => {
    return Array.isArray(deskPetScriptsByCondition[condition]) && deskPetScriptsByCondition[condition].length > 0;
  });

  const candidateConditions = activeConditions.length > 0 ? activeConditions : ["kindness_love"];
  const conditionPool =
    candidateConditions.length > 1
      ? candidateConditions.filter((condition) => condition !== deskPetLastCondition)
      : candidateConditions;
  const nextCondition = conditionPool[Math.floor(Math.random() * conditionPool.length)] || "kindness_love";
  const messages = Array.isArray(deskPetScriptsByCondition[nextCondition])
    ? deskPetScriptsByCondition[nextCondition]
    : [];
  const messagePool = messages.length > 1 ? messages.filter((message) => message !== deskPetLastMessage) : messages;
  const nextMessage = messagePool[Math.floor(Math.random() * messagePool.length)] || "Small break. Big kindness.";

  deskPetLastCondition = nextCondition;
  deskPetLastMessage = nextMessage;

  return nextMessage;
}

function clearDeskPetReminderTimer() {
  window.clearTimeout(deskPetReminderTimer);
  deskPetReminderTimer = null;
}

function queueDeskPetReminder(delayMs = 120000) {
  clearDeskPetReminderTimer();

  if (!deskPetNode || deskPetNode.hidden || document.hidden) {
    return;
  }

  deskPetReminderTimer = window.setTimeout(() => {
    showDeskPetReminder();
    queueDeskPetReminder(180000);
  }, delayMs);
}

function showDeskPetReminder() {
  if (!deskPetNode || deskPetNode.hidden || document.hidden) {
    return;
  }

  animateDeskPetBubble(pickDeskPetScript());
}

function getWeatherPalette({ icon, temperature, isDay }) {
  if (icon === "storm") {
    return {
      accent: "#7a56d6",
      border: "rgba(122, 86, 214, 0.34)",
      triggerBackground: "linear-gradient(145deg, rgba(244, 238, 255, 0.98), rgba(231, 225, 255, 0.94))",
      iconBackground: "linear-gradient(145deg, rgba(237, 229, 255, 0.96), rgba(251, 247, 255, 0.98))"
    };
  }

  if (icon === "rain" || icon === "fog") {
    return {
      accent: "#2f7de1",
      border: "rgba(47, 125, 225, 0.3)",
      triggerBackground: "linear-gradient(145deg, rgba(235, 244, 255, 0.98), rgba(225, 239, 255, 0.94))",
      iconBackground: "linear-gradient(145deg, rgba(229, 241, 255, 0.96), rgba(248, 251, 255, 0.98))"
    };
  }

  if (icon === "moon") {
    return {
      accent: "#5f6fd6",
      border: "rgba(95, 111, 214, 0.34)",
      triggerBackground: "linear-gradient(145deg, rgba(238, 241, 255, 0.98), rgba(229, 233, 255, 0.94))",
      iconBackground: "linear-gradient(145deg, rgba(231, 236, 255, 0.96), rgba(248, 249, 255, 0.98))"
    };
  }

  if (typeof temperature === "number") {
    if (temperature >= 35) {
      return {
        accent: "#e25555",
        border: "rgba(226, 85, 85, 0.32)",
        triggerBackground: "linear-gradient(145deg, rgba(255, 241, 236, 0.98), rgba(255, 232, 222, 0.94))",
        iconBackground: "linear-gradient(145deg, rgba(255, 236, 229, 0.96), rgba(255, 249, 247, 0.98))"
      };
    }

    if (temperature >= 29) {
      return {
        accent: "#d8891a",
        border: "rgba(216, 137, 26, 0.32)",
        triggerBackground: "linear-gradient(145deg, rgba(255, 248, 234, 0.98), rgba(255, 238, 214, 0.94))",
        iconBackground: "linear-gradient(145deg, rgba(255, 242, 218, 0.96), rgba(255, 251, 244, 0.98))"
      };
    }

    if (temperature <= 18) {
      return {
        accent: "#2f7de1",
        border: "rgba(47, 125, 225, 0.3)",
        triggerBackground: "linear-gradient(145deg, rgba(236, 246, 255, 0.98), rgba(225, 239, 255, 0.94))",
        iconBackground: "linear-gradient(145deg, rgba(229, 241, 255, 0.96), rgba(248, 251, 255, 0.98))"
      };
    }
  }

  if (icon === "sun" || isDay) {
    return {
      accent: "#cf8c00",
      border: "rgba(207, 140, 0, 0.3)",
      triggerBackground: "linear-gradient(145deg, rgba(255, 250, 236, 0.98), rgba(255, 241, 218, 0.94))",
      iconBackground: "linear-gradient(145deg, rgba(255, 245, 222, 0.96), rgba(255, 252, 244, 0.98))"
    };
  }

  return {
    accent: "#4f79a0",
    border: "rgba(79, 121, 160, 0.28)",
    triggerBackground: "linear-gradient(145deg, rgba(242, 247, 252, 0.98), rgba(233, 241, 249, 0.94))",
    iconBackground: "linear-gradient(145deg, rgba(236, 243, 250, 0.96), rgba(250, 252, 255, 0.98))"
  };
}

function updateWeatherWidget({ icon, status, location, meta, temperature, isDay }) {
  const palette = getWeatherPalette({ icon, temperature, isDay });

  if (weatherWidgetIconNode) {
    weatherWidgetIconNode.innerHTML = weatherIconSvg(icon);
    weatherWidgetIconNode.style.color = palette.accent;
  }

  if (weatherPopoverIconNode) {
    weatherPopoverIconNode.innerHTML = weatherIconSvg(icon);
    weatherPopoverIconNode.style.color = palette.accent;
    weatherPopoverIconNode.style.background = palette.iconBackground;
    weatherPopoverIconNode.style.borderColor = palette.border;
  }

  if (weatherWidgetStatusNode) {
    weatherWidgetStatusNode.textContent = status;
    weatherWidgetStatusNode.style.color = palette.accent;
  }

  if (weatherWidgetLocationNode) {
    weatherWidgetLocationNode.textContent = location;
  }

  if (weatherWidgetMetaNode) {
    weatherWidgetMetaNode.textContent = meta;
  }

  if (weatherTriggerNode) {
    weatherTriggerNode.style.color = palette.accent;
    weatherTriggerNode.style.borderColor = palette.border;
    weatherTriggerNode.style.background = palette.triggerBackground;
  }
}

function weatherIconSvg(name) {
  if (name === "sun") {
    return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>';
  }

  if (name === "moon") {
    return '<svg viewBox="0 0 24 24"><path d="M20 12.5A8.5 8.5 0 1 1 11.5 4 7 7 0 0 0 20 12.5z"/></svg>';
  }

  if (name === "cloud") {
    return '<svg viewBox="0 0 24 24"><path d="M7 18h9a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6 8.5 3.5 3.5 0 0 0 7 18z"/></svg>';
  }

  if (name === "fog") {
    return '<svg viewBox="0 0 24 24"><path d="M6 10a4 4 0 1 1 7.7-1.5A3.5 3.5 0 1 1 17 14H6"/><path d="M4 17h12"/><path d="M6 20h10"/></svg>';
  }

  if (name === "rain") {
    return '<svg viewBox="0 0 24 24"><path d="M7 15h9a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6 5.5 3.5 3.5 0 0 0 7 15z"/><path d="M9 18l-1 3"/><path d="M13 18l-1 3"/><path d="M17 18l-1 3"/></svg>';
  }

  if (name === "storm") {
    return '<svg viewBox="0 0 24 24"><path d="M7 15h9a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6 5.5 3.5 3.5 0 0 0 7 15z"/><path d="M12 16l-2 4h2l-1 3 4-5h-2l1-2"/></svg>';
  }

  return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>';
}

function getWeatherPresentation(code, isDay) {
  if (code === 0) {
    return {
      label: isDay ? "Clear" : "Clear night",
      icon: isDay ? "sun" : "moon"
    };
  }

  if (code === 1 || code === 2) {
    return {
      label: code === 1 ? "Mainly clear" : "Partly cloudy",
      icon: "cloud"
    };
  }

  if (code === 3) {
    return { label: "Cloudy", icon: "cloud" };
  }

  if (code === 45 || code === 48) {
    return { label: "Foggy", icon: "fog" };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { label: "Drizzle", icon: "rain" };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: "Rain", icon: "rain" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: "Snow", icon: "cloud" };
  }

  if ([95, 96, 99].includes(code)) {
    return { label: "Thunderstorm", icon: "storm" };
  }

  return { label: "Weather update", icon: "cloud" };
}

function getLocationPermissionState() {
  if (!navigator.permissions || typeof navigator.permissions.query !== "function") {
    return Promise.resolve("prompt");
  }

  return navigator.permissions
    .query({ name: "geolocation" })
    .then((result) => result.state)
    .catch(() => "prompt");
}

function getDeviceLocation() {
  if (!navigator.geolocation) {
    return Promise.resolve({
      ...defaultWeatherLocation,
      meta: "Location access is unavailable in this browser. Showing Yangon."
    });
  }

  return getLocationPermissionState().then((permissionState) => {
    if (permissionState === "denied") {
      return {
        ...defaultWeatherLocation,
        meta: "Location access is blocked. Showing Yangon."
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            label: "Current location",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            meta: "Live weather based on your device location."
          });
        },
        () => {
          resolve({
            ...defaultWeatherLocation,
            meta: "Location access was not allowed. Showing Yangon."
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 600000
        }
      );
    });
  });
}

async function loadWeather() {
  if (!weatherWidgetStatusNode && !weatherWidgetIconNode) {
    return;
  }

  const weatherLocation = await getDeviceLocation();
  latestWeatherState = {
    icon: "cloud",
    temperature: null,
    isDay: true,
    location: weatherLocation.label
  };

  updateWeatherWidget({
    icon: "cloud",
    status: "Loading weather...",
    location: weatherLocation.label,
    meta: weatherLocation.meta
  });

  try {
    const query = new URLSearchParams({
      latitude: String(weatherLocation.latitude),
      longitude: String(weatherLocation.longitude),
      current: "temperature_2m,weather_code,is_day",
      timezone: "auto",
      forecast_days: "1"
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Weather request failed with ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    if (!current) {
      throw new Error("Missing current weather data");
    }

    const presentation = getWeatherPresentation(current.weather_code, current.is_day === 1);
    const temperature = Math.round(current.temperature_2m);
    latestWeatherState = {
      icon: presentation.icon,
      temperature,
      isDay: current.is_day === 1,
      location: weatherLocation.label
    };

    latestWeatherSummary = `${presentation.label} ${temperature}C in ${weatherLocation.label}.`;

    updateWeatherWidget({
      icon: presentation.icon,
      status: `${presentation.label} ${temperature}C`,
      location: weatherLocation.label,
      meta: weatherLocation.meta,
      temperature,
      isDay: current.is_day === 1
    });
  } catch (_error) {
    latestWeatherSummary = `Live weather is unavailable right now for ${weatherLocation.label}.`;
    latestWeatherState = {
      icon: "cloud",
      temperature: null,
      isDay: true,
      location: weatherLocation.label
    };

    updateWeatherWidget({
      icon: "cloud",
      status: "Weather unavailable",
      location: weatherLocation.label,
      meta: "Unable to reach the weather service right now."
    });
  }
}

function getPreferredTheme() {
  return systemThemeMedia && systemThemeMedia.matches ? "dark" : "light";
}

function resolveTheme(themeMode) {
  return themeMode === "system" ? getPreferredTheme() : themeMode;
}

function applyTheme(themeMode) {
  const resolvedTheme = resolveTheme(themeMode);
  root.setAttribute("data-theme", resolvedTheme);
  root.setAttribute("data-theme-mode", themeMode);
  return resolvedTheme;
}

function formatThemeName(themeMode) {
  return themeMode.charAt(0).toUpperCase() + themeMode.slice(1);
}

let currentTheme = getStoredTheme() || "system";
applyTheme(currentTheme);
setupWeatherWidget();
setupDeskPet();
loadDeskPetScripts();

window.requestAnimationFrame(() => {
  root.classList.add("theme-ready");
});

navLinks.forEach((link) => {
  if (link.dataset.link === pageName) {
    link.classList.add("active");
  }
});

const navRight = document.querySelector(".nav-right");
const bellButton = navRight ? navRight.querySelector(".icon-btn") : null;
const profileButton = document.querySelector(".profile-chip");
const bellBadge = document.querySelector(".icon-badge");

if (navRight && bellButton && profileButton) {
  bellButton.classList.add("bell-btn");
  bellButton.setAttribute("aria-haspopup", "menu");
  bellButton.setAttribute("aria-expanded", "false");
  profileButton.setAttribute("aria-haspopup", "menu");
  profileButton.setAttribute("aria-expanded", "false");

  const appsButton = document.createElement("button");
  appsButton.className = "icon-btn apps-btn";
  appsButton.type = "button";
  appsButton.setAttribute("aria-label", "Open app launcher");
  appsButton.setAttribute("aria-haspopup", "menu");
  appsButton.setAttribute("aria-expanded", "false");
  appsButton.setAttribute("title", "Apps");
  appsButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="6" r="1.5"></circle>
      <circle cx="12" cy="6" r="1.5"></circle>
      <circle cx="18" cy="6" r="1.5"></circle>
      <circle cx="6" cy="12" r="1.5"></circle>
      <circle cx="12" cy="12" r="1.5"></circle>
      <circle cx="18" cy="12" r="1.5"></circle>
      <circle cx="6" cy="18" r="1.5"></circle>
      <circle cx="12" cy="18" r="1.5"></circle>
      <circle cx="18" cy="18" r="1.5"></circle>
    </svg>
  `;

  const themeButton = document.createElement("button");
  themeButton.className = "icon-btn theme-btn";
  themeButton.type = "button";
  themeButton.setAttribute("aria-live", "polite");

  function themeIcon(themeMode) {
    if (themeMode === "system") {
      return '<svg class="theme-icon" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M8 19h8"/><path d="M12 9.2V12"/><path d="M10.6 10.6 12 9.2l1.4 1.4"/></svg>';
    }

    if (themeMode === "dark") {
      return '<svg class="theme-icon" viewBox="0 0 24 24"><path d="M20 12.5A8.5 8.5 0 1 1 11.5 4 7 7 0 0 0 20 12.5z"/></svg>';
    }
    return '<svg class="theme-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>';
  }

  function renderThemeButton() {
    const resolvedTheme = resolveTheme(currentTheme);
    const buttonTheme = currentTheme === "system" ? "system" : resolvedTheme;
    themeButton.innerHTML = themeIcon(buttonTheme);
    themeButton.setAttribute(
      "aria-label",
      currentTheme === "system"
        ? `Theme follows system. Current appearance is ${resolvedTheme}. Click to override.`
        : resolvedTheme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
    );
    themeButton.setAttribute(
      "title",
      currentTheme === "system"
        ? `System Mode (${formatThemeName(resolvedTheme)})`
        : `${formatThemeName(resolvedTheme)} Mode`
    );
  }

  renderThemeButton();
  navRight.insertBefore(themeButton, bellButton);
  navRight.insertBefore(appsButton, themeButton);

  const appCatalog = [
    { label: "MyBoard", short: "MB", href: "https://www.myboard.aml.mobi", desc: "Boards and projects", external: true },
    { label: "MyTicket", short: "TK", href: "https://www.myticket.aml.mobi", desc: "Issue tracking", external: true },
    { label: "MySpace", short: "MS", href: "https://www.myspace.aml.mobi", desc: "Notes and docs", external: true },
    { label: "Performance", short: "PM", href: "https://pmp.aml.mobi", desc: "Goals and reviews", external: true },
    { label: "Workspace", short: "WS", href: "workspace.html", desc: "Tasks" },
    { label: "Services", short: "SV", href: "services.html", desc: "Requests" },
    { label: "Help Desk", short: "HD", href: "services.html#support-help", desc: "Support desk" },
    { label: "Docs", short: "DC", href: "https://docs.google.com", desc: "Files", external: true },
    { label: "Mail", short: "ML", href: "https://mail.google.com", desc: "Inbox", external: true },
    { label: "Calendar", short: "CL", href: "https://calendar.google.com", desc: "Schedule", external: true },
    { label: "Meet", short: "MT", href: "https://meet.google.com", desc: "Calls", external: true },
    { label: "Jira", short: "JR", href: "https://id.atlassian.com/login", desc: "Projects", external: true },
    { label: "Drive", short: "DV", href: "https://drive.google.com", desc: "Storage", external: true }
  ];

  function renderAppLinks() {
    return appCatalog
      .map((app) => {
        const attrs = app.external ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `
          <a class="app-shortcut compact" href="${app.href}"${attrs}>
            <span class="app-icon">${app.short}</span>
            <span class="app-label">${app.label}</span>
            <span class="app-desc">${app.desc}</span>
          </a>
        `;
      })
      .join("");
  }

  const appsPanel = document.createElement("div");
  appsPanel.className = "nav-panel apps-panel";
  appsPanel.hidden = true;
  appsPanel.innerHTML = `
    <p class="panel-title">Apps</p>
    <div class="apps-mini-grid">
      ${renderAppLinks()}
    </div>
    <a class="menu-item apps-all-link" href="apps.html">Open App Hub</a>
  `;

  const bellPanel = document.createElement("div");
  bellPanel.className = "nav-panel";
  bellPanel.hidden = true;
  bellPanel.innerHTML = `
    <p class="panel-title">Notifications</p>
    <div class="notif-item">
      <strong>Leave request approved</strong>
      <span>2 min ago</span>
    </div>
    <div class="notif-item">
      <strong>New company update</strong>
      <span>15 min ago</span>
    </div>
    <div class="notif-item">
      <strong>Ticket #124 moved to in-progress</strong>
      <span>1 hr ago</span>
    </div>
  `;

  const profilePanel = document.createElement("div");
  profilePanel.className = "nav-panel";
  profilePanel.hidden = true;
  profilePanel.innerHTML = `
    <p class="panel-title">Profile</p>
    <button class="menu-item" type="button">My Profile</button>
    <a class="menu-item" href="settings.html">Settings</a>
    <button class="menu-item" type="button">Sign Out (Demo)</button>
  `;

  navRight.appendChild(appsPanel);
  navRight.appendChild(bellPanel);
  navRight.appendChild(profilePanel);

  function closeMenus() {
    appsPanel.hidden = true;
    bellPanel.hidden = true;
    profilePanel.hidden = true;
    appsButton.setAttribute("aria-expanded", "false");
    bellButton.setAttribute("aria-expanded", "false");
    profileButton.setAttribute("aria-expanded", "false");
  }

  function toggleMenu(panel, button) {
    const willOpen = panel.hidden;
    closeMenus();

    if (willOpen) {
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
    }
  }

  themeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    themeButton.classList.add("switching");

    const resolvedTheme = resolveTheme(currentTheme);
    currentTheme = resolvedTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
    setStoredTheme(currentTheme);
    renderThemeButton();
    syncThemeSettings();

    window.setTimeout(() => {
      themeButton.classList.remove("switching");
    }, 320);
  });

  appsButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(appsPanel, appsButton);
  });

  bellButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(bellPanel, bellButton);
    if (bellBadge) {
      bellBadge.style.display = "none";
    }
  });

  profileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(profilePanel, profileButton);
  });

  navRight.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  profilePanel.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      closeMenus();
    });
  });

  appsPanel.querySelectorAll("a").forEach((item) => {
    item.addEventListener("click", () => {
      closeMenus();
    });
  });

  document.addEventListener("click", closeMenus);
  document.addEventListener("keydown", (event) => {
    if (handlePageShortcut(event)) {
      closeMenus();
      return;
    }

    if (event.key === "Escape") {
      closeMenus();
    }
  });
}

if (systemThemeMedia) {
  systemThemeMedia.addEventListener("change", (event) => {
    if (currentTheme !== "system") {
      return;
    }

    applyTheme(currentTheme);
    renderThemeButton();
    syncThemeSettings();
  });
}

if (pageName === "technical") {
  setupDocumentationPage();
}

setupPageLayoutManager();

const themeOptions = document.querySelectorAll("[data-theme-option]");
const themeStatus = document.querySelector("[data-theme-status]");
const themeCurrentValues = document.querySelectorAll("[data-theme-current]");
const settingsSwitches = document.querySelectorAll("[data-setting-switch]");
const resetPortalButton = document.querySelector("[data-reset-portal]");
const defaultSettings = {
  browserAlerts: true,
  emailDigest: false,
  productUpdates: true,
  deskPet: true
};
let currentSettings = {
  ...defaultSettings,
  ...(getStoredSettings() || {})
};

function syncThemeSettings() {
  const resolvedTheme = resolveTheme(currentTheme);

  themeOptions.forEach((option) => {
    const isActive = option.dataset.themeOption === currentTheme;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });

  if (themeStatus) {
    themeStatus.textContent =
      currentTheme === "system"
        ? `System mode is active. Current appearance follows your device and is ${formatThemeName(resolvedTheme)}.`
        : `${formatThemeName(currentTheme)} mode is active for this site.`;
  }

  themeCurrentValues.forEach((node) => {
    node.textContent =
      currentTheme === "system"
        ? `System (${formatThemeName(resolvedTheme)})`
        : formatThemeName(currentTheme);
  });
}

function setThemeMode(themeMode) {
  if (!themeModes.includes(themeMode)) {
    return;
  }

  currentTheme = themeMode;
  applyTheme(currentTheme);
  setStoredTheme(currentTheme);
  renderThemeButton();
  syncThemeSettings();
}

function syncSettingSwitches() {
  settingsSwitches.forEach((button) => {
    const { settingSwitch } = button.dataset;
    if (!settingSwitch) {
      return;
    }

    const isEnabled = Boolean(currentSettings[settingSwitch]);
    const labelNode = button.querySelector(".switch-toggle-label");
    const metaTitle = button.closest(".pref-row")?.querySelector(".pref-meta strong")?.textContent?.trim() || "Preference";

    button.classList.toggle("on", isEnabled);
    button.classList.toggle("off", !isEnabled);
    button.setAttribute("aria-checked", String(isEnabled));
    button.setAttribute("aria-label", `${metaTitle} ${isEnabled ? "enabled" : "disabled"}`);

    if (labelNode) {
      labelNode.textContent = isEnabled ? "On" : "Off";
    }
  });
}

function syncDeskPet() {
  if (!deskPetNode) {
    return;
  }

  const isEnabled = Boolean(currentSettings.deskPet);
  deskPetNode.hidden = !isEnabled;
  deskPetNode.classList.toggle("is-paused", document.hidden);

  if (!isEnabled || document.hidden) {
    deskPetNode.classList.remove("is-wave");
    window.clearTimeout(deskPetBubbleTimer);
    clearDeskPetReminderTimer();
    return;
  }

  queueDeskPetReminder(90000);
}

function setSettingValue(settingName, nextValue) {
  if (!(settingName in defaultSettings)) {
    return;
  }

  currentSettings = {
    ...currentSettings,
    [settingName]: nextValue
  };

  setStoredSettings(currentSettings);
  syncSettingSwitches();
  syncDeskPet();
}

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const { themeOption } = option.dataset;
    if (!themeOption) {
      return;
    }

    setThemeMode(themeOption);
  });
});

syncThemeSettings();
syncSettingSwitches();
syncDeskPet();
loadWeather();

settingsSwitches.forEach((button) => {
  button.addEventListener("click", () => {
    const { settingSwitch } = button.dataset;
    if (!settingSwitch) {
      return;
    }

    setSettingValue(settingSwitch, !currentSettings[settingSwitch]);
  });
});

if (resetPortalButton) {
  resetPortalButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Reset this portal UI for this browser? This will clear saved theme, settings, section layout, and demo chat data."
    );

    if (!confirmed) {
      return;
    }

    clearPortalStorage();
    window.location.reload();
  });
}

const revealNodes = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("show"));
}

const aiForm = document.querySelector("[data-ai-form]");
const aiInput = document.querySelector("[data-ai-input]");
const aiLog = document.querySelector("[data-ai-log]");
const aiPrompts = document.querySelectorAll("[data-ai-prompt]");
const publicRoomLog = document.querySelector("[data-public-room-log]");
const publicRoomForm = document.querySelector("[data-public-room-form]");
const publicRoomInput = document.querySelector("[data-public-room-input]");
let aiEffectTimer = null;
const publicRoomStorageKey = "public_room_messages";
const publicRoomSeedMessages = [
  {
    id: "seed-room-1",
    text: "Anonymous note: the new homepage feels much calmer after the animation cleanup.",
    createdAt: "2026-03-15T08:30:00.000Z",
    own: false
  },
  {
    id: "seed-room-2",
    text: "Anonymous idea: a quiet room like this is useful for honest suggestions without pressure.",
    createdAt: "2026-03-15T09:10:00.000Z",
    own: false
  },
  {
    id: "seed-room-3",
    text: "Anonymous feedback: the light mode texture is much nicer now on mobile too.",
    createdAt: "2026-03-15T10:00:00.000Z",
    own: false
  }
];

const aiFallback = "I can help with leave, tickets, policy, approvals, and workspace tips.";

function getStoredPublicRoomMessages() {
  try {
    const stored = window.localStorage.getItem(publicRoomStorageKey);
    if (!stored) {
      return publicRoomSeedMessages;
    }

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (_error) {
    return publicRoomSeedMessages;
  }

  return publicRoomSeedMessages;
}

function setStoredPublicRoomMessages(messages) {
  try {
    window.localStorage.setItem(publicRoomStorageKey, JSON.stringify(messages));
  } catch (_error) {
    // Ignore storage write failures.
  }
}

function formatPublicRoomTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  } catch (_error) {
    return "Just now";
  }
}

function renderPublicRoomMessages(messages) {
  if (!publicRoomLog) {
    return;
  }

  publicRoomLog.innerHTML = "";

  messages.forEach((message) => {
    const bubble = document.createElement("article");
    bubble.className = `public-room-msg ${message.own ? "self" : "other"}`;
    bubble.innerHTML = `
      <div class="public-room-meta">
        <strong>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0z"/><path d="M3.5 12h17M12 3.5c2.2 2.1 3.5 5.1 3.5 8.5S14.2 18.4 12 20.5M12 3.5C9.8 5.6 8.5 8.6 8.5 12s1.3 6.4 3.5 8.5"/></svg>
          Anonymous
        </strong>
        <span>${formatPublicRoomTime(message.createdAt)}</span>
      </div>
      <p></p>
    `;
    const content = bubble.querySelector("p");
    if (content) {
      content.textContent = message.text;
    }
    publicRoomLog.appendChild(bubble);
  });

  publicRoomLog.scrollTop = publicRoomLog.scrollHeight;
}

if (publicRoomLog && publicRoomForm && publicRoomInput) {
  let publicRoomMessages = getStoredPublicRoomMessages();
  renderPublicRoomMessages(publicRoomMessages);

  publicRoomForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = publicRoomInput.value.trim();
    if (!text) {
      return;
    }

    publicRoomMessages = [
      ...publicRoomMessages,
      {
        id: `room-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        own: true
      }
    ].slice(-40);

    setStoredPublicRoomMessages(publicRoomMessages);
    renderPublicRoomMessages(publicRoomMessages);
    publicRoomInput.value = "";
    publicRoomInput.focus();
  });
}

function getAiEffect(text) {
  const value = text.toLowerCase();

  if (value.includes("--rotate--")) {
    return "rotate";
  }

  if (value.includes("--drop--")) {
    return "drop";
  }

  if (value.includes("--space--")) {
    return "space";
  }

  return null;
}

function triggerAiEffect(effectName) {
  let effectClass = "ai-effect-rotate";
  let effectDuration = 1400;

  if (effectName === "drop") {
    effectClass = "ai-effect-drop";
    effectDuration = 1700;
  } else if (effectName === "space") {
    effectClass = "ai-effect-space";
    effectDuration = 2200;
  }

  document.body.classList.remove("ai-effect-rotate", "ai-effect-drop", "ai-effect-space");
  void document.body.offsetWidth;
  document.body.classList.add(effectClass);

  window.clearTimeout(aiEffectTimer);
  aiEffectTimer = window.setTimeout(() => {
    document.body.classList.remove(effectClass);
  }, effectDuration);
}

function getAiReply(text) {
  const value = text.toLowerCase();

  if (value.includes("--rotate--")) {
    return "Portal spin engaged.";
  }

  if (value.includes("--drop--")) {
    return "Gravity mode enabled.";
  }

  if (value.includes("--space--")) {
    return "Orbit mode engaged.";
  }

  if (value.includes("leave")) {
    return "Open Services > HR > Leave Request, choose type, dates, and submit.";
  }

  if (value.includes("ticket")) {
    return "Open Workspace > Tickets. Current queue shows 12 open requests.";
  }

  if (value.includes("policy")) {
    return "Use Services > InfoHub to search policy name and check latest revision date.";
  }

  if (value.includes("approval") || value.includes("approve")) {
    return "You have 12 pending approvals in Workspace. High-priority items appear first.";
  }

  if (value.includes("weather")) {
    return latestWeatherSummary;
  }

  if (value.includes("app")) {
    return "Open the Apps button in the top navigation or visit the Apps page to launch company tools.";
  }

  return aiFallback;
}

function addAiMessage(message, role) {
  if (!aiLog) {
    return;
  }

  const bubble = document.createElement("div");
  bubble.className = `ai-msg ${role}`;
  bubble.textContent = message;
  aiLog.appendChild(bubble);
  aiLog.scrollTop = aiLog.scrollHeight;
}

function askAi(text) {
  const question = text.trim();
  if (!question) {
    return;
  }

  const aiEffect = getAiEffect(question);

  addAiMessage(question, "user");

  window.setTimeout(() => {
    if (aiEffect) {
      triggerAiEffect(aiEffect);
    }

    addAiMessage(getAiReply(question), "bot");
  }, 260);
}

if (aiForm && aiInput) {
  aiForm.addEventListener("submit", (event) => {
    event.preventDefault();
    askAi(aiInput.value);
    aiInput.value = "";
    aiInput.focus();
  });
}

aiPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    const prompt = button.getAttribute("data-ai-prompt");
    if (!prompt) {
      return;
    }

    if (aiInput) {
      aiInput.value = prompt;
    }

    askAi(prompt);
  });
});
