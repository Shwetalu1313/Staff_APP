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
const root = document.documentElement;
const brand = document.querySelector(".brand");
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
let latestWeatherSummary = "Weather data is loading for Yangon.";

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

  weatherWidgetIconNode = weatherWidget.querySelector("[data-nav-weather-icon]");
  weatherWidgetStatusNode = weatherWidget.querySelector("[data-nav-weather-status]");
  weatherWidgetLocationNode = weatherWidget.querySelector("[data-nav-weather-location]");
  weatherWidgetMetaNode = weatherWidget.querySelector("[data-nav-weather-meta]");
}

function updateWeatherWidget({ icon, status, location, meta }) {
  if (weatherWidgetIconNode) {
    weatherWidgetIconNode.innerHTML = weatherIconSvg(icon);
  }

  const popoverIconNode = document.querySelector("[data-nav-weather-panel-icon]");
  if (popoverIconNode) {
    popoverIconNode.innerHTML = weatherIconSvg(icon);
  }

  if (weatherWidgetStatusNode) {
    weatherWidgetStatusNode.textContent = status;
  }

  if (weatherWidgetLocationNode) {
    weatherWidgetLocationNode.textContent = location;
  }

  if (weatherWidgetMetaNode) {
    weatherWidgetMetaNode.textContent = meta;
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

    latestWeatherSummary = `${presentation.label} ${temperature}C in ${weatherLocation.label}.`;

    updateWeatherWidget({
      icon: presentation.icon,
      status: `${presentation.label} ${temperature}C`,
      location: weatherLocation.label,
      meta: weatherLocation.meta
    });
  } catch (_error) {
    latestWeatherSummary = `Live weather is unavailable right now for ${weatherLocation.label}.`;

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
    { label: "Support", short: "SP", href: "support.html", desc: "Help desk" },
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

const themeOptions = document.querySelectorAll("[data-theme-option]");
const themeStatus = document.querySelector("[data-theme-status]");
const themeCurrentValues = document.querySelectorAll("[data-theme-current]");
const settingsSwitches = document.querySelectorAll("[data-setting-switch]");
const defaultSettings = {
  browserAlerts: true,
  emailDigest: false,
  productUpdates: true
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

const aiFallback = "I can help with leave, tickets, policy, approvals, and workspace tips.";

function getAiReply(text) {
  const value = text.toLowerCase();

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

  addAiMessage(question, "user");

  window.setTimeout(() => {
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
