const topbar = document.getElementById("topbar");

if (topbar) {
  let latestScrollY = window.scrollY;
  let isTicking = false;
  let scrollEndTimer;
  const scrollStateTarget = document.body;

  const updateTopbar = () => {
    topbar.classList.toggle("scrolled", latestScrollY > 6);
    isTicking = false;
  };

  const markScrolling = () => {
    if (!scrollStateTarget) {
      return;
    }

    scrollStateTarget.classList.add("is-scrolling");
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(() => {
      scrollStateTarget.classList.remove("is-scrolling");
    }, 150);
  };

  window.addEventListener(
    "scroll",
    () => {
      latestScrollY = window.scrollY;
      markScrolling();
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
const root = document.documentElement;
const systemThemeMedia =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark") {
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

function getPreferredTheme() {
  return systemThemeMedia && systemThemeMedia.matches ? "dark" : "light";
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
}

let currentTheme = getStoredTheme() || getPreferredTheme();
applyTheme(currentTheme);

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

  function themeIcon(theme) {
    if (theme === "dark") {
      return '<svg class="theme-icon" viewBox="0 0 24 24"><path d="M20 12.5A8.5 8.5 0 1 1 11.5 4 7 7 0 0 0 20 12.5z"/></svg>';
    }
    return '<svg class="theme-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>';
  }

  function renderThemeButton() {
    const isDark = currentTheme === "dark";
    themeButton.innerHTML = themeIcon(currentTheme);
    themeButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    themeButton.setAttribute("title", isDark ? "Light Mode" : "Dark Mode");
  }

  renderThemeButton();
  navRight.insertBefore(themeButton, bellButton);
  navRight.insertBefore(appsButton, themeButton);

  const appCatalog = [
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
    <button class="menu-item" type="button">Settings</button>
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

    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
    setStoredTheme(currentTheme);
    renderThemeButton();

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
    if (getStoredTheme()) {
      return;
    }

    currentTheme = event.matches ? "dark" : "light";
    applyTheme(currentTheme);
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
    return "Today's weather is Sunny 24C. Best outdoor window is afternoon.";
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
