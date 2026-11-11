(function () {
  "use strict";

  const header = document.getElementById("header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const loader = document.querySelector(".loader");

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  const hideLoader = () => loader && loader.classList.add("is-done");
  document.addEventListener("DOMContentLoaded", () => setTimeout(hideLoader, 900));
  window.addEventListener("load", () => setTimeout(hideLoader, 120));
  setTimeout(hideLoader, 1800);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateCount(el) {
    const target = Number(el.getAttribute("data-count"));
    if (!Number.isFinite(target)) return;
    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            entry.target.querySelectorAll("[data-count]").forEach(animateCount);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("is-visible");
      el.querySelectorAll("[data-count]").forEach(animateCount);
    });
  }

  if (!reduceMotion) {
    document.querySelectorAll(".auction-card, .card, .stat").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        card.style.transform = "translateY(-8px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 8).toFixed(2) + "deg)";
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = lightbox && lightbox.querySelector("img");
  if (lightbox && lightboxImg) {
    document.querySelectorAll("[data-lightbox]").forEach((img) => {
      img.addEventListener("click", () => {
        lightboxImg.src = img.getAttribute("src");
        lightboxImg.alt = img.getAttribute("alt") || "Gallery image";
        lightbox.classList.add("is-open");
      });
    });
    lightbox.addEventListener("click", () => lightbox.classList.remove("is-open"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") lightbox.classList.remove("is-open");
    });
  }

  const tabs = document.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll("[data-panel]");
  if (tabs.length) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.getAttribute("data-tab");
        tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
        panels.forEach((panel) => {
          panel.classList.toggle("is-active", panel.getAttribute("data-panel") === id);
        });
      });
    });
  }

  const copyButtons = document.querySelectorAll("[data-copy]");
  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(value);
        const original = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => {
          btn.textContent = original;
        }, 1600);
      } catch (error) {
        window.prompt("Copy this value", value);
      }
    });
  });

  const newsForm = document.getElementById("news-form");
  const formNote = document.getElementById("form-note");

  function showNote(message, ok) {
    if (!formNote) {
      window.alert(message);
      return;
    }
    formNote.textContent = message;
    formNote.className = "form-note " + (ok ? "is-ok" : "is-error");
  }

  function sendEmail(subject, body, onDone) {
    if (typeof Email === "undefined") {
      onDone(false, "Email service is unavailable. Please WhatsApp the organisers.");
      return;
    }
    Email.send({
      SecureToken: "e9ba95e0-b278-47ba-9396-1cf8388fab1c",
      To: "rpl.tournament.howrah@outlook.com",
      From: "rpl.tournament.howrah@outlook.com",
      Subject: subject,
      Body: body
    }).then((message) => {
      onDone(message === "OK", message === "OK" ? "Message sent. The RPL team will contact you shortly." : "Could not send right now. Please try WhatsApp.");
    }).catch(() => {
      onDone(false, "Could not send right now. Please try WhatsApp.");
    });
  }

  if (newsForm) {
    newsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = document.getElementById("newsEmail").value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        showNote("Enter a valid email to subscribe.", false);
        return;
      }
      sendEmail("RPL newsletter from " + email, "Email: " + email, (ok, message) => {
        showNote(ok ? "Subscribed. Fixture updates will reach this inbox." : message, ok);
        if (ok) newsForm.reset();
      });
    });
  }

  const squadForm = document.getElementById("squad-form");
  const roster = document.getElementById("roster");

  if (squadForm || roster) {
    const STORAGE_KEY = "rpl-season8-players";
    const CATEGORIES = [
      { id: "batsman", label: "Batsman" },
      { id: "bowler", label: "Bowler" },
      { id: "allrounder", label: "All-rounder" }
    ];
    const ROLES = [
      { id: "captain", label: "Captain / Owner" },
      { id: "player", label: "Player" }
    ];

    function normalizedRole(role) {
      if (role === "captain" || role === "owner") return "captain";
      return "player";
    }

    const squadNote = document.getElementById("squad-note");
    const photoInput = document.getElementById("sqPhoto");
    const photoPreview = document.getElementById("sqPreview");
    const countEl = document.getElementById("squad-count");
    const syncEl = document.getElementById("squad-sync");
    const channel = "BroadcastChannel" in window ? new BroadcastChannel("rpl-season8-players") : null;
    const host = location.hostname;
    const apiEndpoints = ["api/players"];
    if (location.protocol === "file:" || host === "localhost" || host === "127.0.0.1") {
      apiEndpoints.push("http://127.0.0.1:8080/api/players");
    }

    let dbPromise = null;
    let cachedPlayers = [];
    let usingSharedServer = false;

    function openDb() {
      if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
          const req = indexedDB.open("rpl-season8", 1);
          req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains("kv")) {
              req.result.createObjectStore("kv");
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
      }
      return dbPromise;
    }

    async function idbGet() {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const req = db.transaction("kv", "readonly").objectStore("kv").get("players");
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => reject(req.error);
      });
    }

    async function idbSet(list) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(list, "players");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    function readLegacy() {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function writeLegacy(list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (error) {
        // Photos can exceed localStorage. IndexedDB is the real store.
      }
    }

    async function requestApi(options) {
      const isPut = options.method === "PUT";
      for (const url of apiEndpoints) {
        try {
          const res = await fetch(url, options);
          if (!res.ok) continue;
          if (isPut) return true;
          const data = await res.json();
          if (Array.isArray(data)) return data;
        } catch (error) {
          // Try the next candidate.
        }
      }
      return isPut ? false : null;
    }

    function setSyncStatus(shared) {
      usingSharedServer = shared;
      if (syncEl) {
        syncEl.textContent = shared ? "saved for every device" : "saved in this browser";
      }
    }

    function setSquadNote(message, ok) {
      if (!squadNote) return;
      squadNote.textContent = message;
      squadNote.className = "form-note " + (ok ? "is-ok" : "is-error");
    }

    async function cacheLocal(list) {
      try {
        await idbSet(list);
      } catch (error) {
        writeLegacy(list);
      }
    }

    async function loadPlayers() {
      const shared = await requestApi({ cache: "no-store", headers: { Accept: "application/json" } });
      if (shared) {
        cachedPlayers = shared;
        setSyncStatus(true);
        await cacheLocal(shared);
        return shared;
      }

      try {
        let local = await idbGet();
        if (!local.length) local = readLegacy();
        cachedPlayers = local;
        setSyncStatus(false);
        return local;
      } catch (error) {
        const local = readLegacy();
        cachedPlayers = local;
        setSyncStatus(false);
        return local;
      }
    }

    async function savePlayers(list) {
      cachedPlayers = list;
      await cacheLocal(list);
      writeLegacy(list);
      const shared = await requestApi({
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(list)
      });
      setSyncStatus(shared);
      if (channel) channel.postMessage("updated");
      return shared;
    }

    function compressPhoto(file) {
      return new Promise((resolve) => {
        if (!file) {
          resolve("");
          return;
        }
        const reader = new FileReader();
        reader.onerror = () => resolve("");
        reader.onload = () => {
          const image = new Image();
          image.onerror = () => resolve("");
          image.onload = () => {
            const max = 420;
            let width = image.width;
            let height = image.height;
            if (width > height && width > max) {
              height = Math.round((height * max) / width);
              width = max;
            } else if (height > max) {
              width = Math.round((width * max) / height);
              height = max;
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d").drawImage(image, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.72));
          };
          image.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function labelFor(list, id) {
      const found = list.find((item) => item.id === id);
      return found ? found.label : id;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function renderRoster(players) {
      if (!roster) return;
      players = Array.isArray(players) ? players : cachedPlayers;
      if (countEl) countEl.textContent = String(players.length);
      if (!players.length) {
        roster.innerHTML = '<p class="empty-role">No players added yet. Use the form above to build the Season 8 squad.</p>';
        return;
      }

      roster.innerHTML = CATEGORIES.map((category) => {
        const inCategory = players.filter((player) => player.category === category.id);
        const rolesHtml = ROLES.map((role) => {
          const inRole = inCategory.filter((player) => normalizedRole(player.role) === role.id);
          const cards = inRole.length
            ? '<div class="player-grid">' + inRole.map((player) => `
                <article class="player-card">
                  <img src="${player.photo || "images/cricket-ball.svg"}" alt="${escapeHtml(player.name)}">
                  <div class="body">
                    <div class="badges">
                      <span class="badge ${normalizedRole(player.role)}">${labelFor(ROLES, normalizedRole(player.role))}</span>
                      <span class="badge">${labelFor(CATEGORIES, player.category)}</span>
                    </div>
                    <h5>${escapeHtml(player.name)}</h5>
                    ${player.mobile ? `<p class="player-meta">${escapeHtml(player.mobile)}</p>` : ""}
                    <button class="btn btn-ghost btn-sm" type="button" data-remove="${player.id}">Remove</button>
                  </div>
                </article>
              `).join("") + "</div>"
            : '<p class="empty-role">No ' + role.label.toLowerCase() + " in this category yet.</p>";
          return `<div class="roster-role"><h4>${role.label}</h4>${cards}</div>`;
        }).join("");

        return `<section class="roster-category panel">
          <h3>${category.label} <small>(${inCategory.length})</small></h3>
          ${rolesHtml}
        </section>`;
      }).join("");
    }

    if (photoInput && photoPreview) {
      photoInput.addEventListener("change", async () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;
        const data = await compressPhoto(file);
        photoPreview.innerHTML = '<img src="' + data + '" alt="Selected player photo">';
        photoPreview.dataset.photo = data;
      });
    }

    if (squadForm) {
      squadForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("sqName").value.trim();
        const category = document.getElementById("sqCategory").value;
        const role = document.getElementById("sqRole").value;
        const mobile = document.getElementById("sqMobile").value.replace(/\D/g, "");
        const file = photoInput && photoInput.files && photoInput.files[0];

        if (!name || !category || !role || !mobile) {
          setSquadNote("Fill name, category, role and mobile number.", false);
          return;
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
          setSquadNote("Enter a valid 10-digit mobile number.", false);
          return;
        }

        const photo = photoPreview && photoPreview.dataset.photo
          ? photoPreview.dataset.photo
          : await compressPhoto(file);

        const list = (await loadPlayers()).slice();
        list.unshift({
          id: String(Date.now()),
          name: name,
          category: category,
          role: role,
          mobile: mobile,
          photo: photo || ""
        });
        await savePlayers(list);
        squadForm.reset();
        if (photoPreview) {
          photoPreview.innerHTML = "No photo selected";
          delete photoPreview.dataset.photo;
        }
        setSquadNote(
          usingSharedServer
            ? name + " is on the Season 8 list. Refresh or open another phone — the player stays until you remove them."
            : name + " is saved on this browser. Start start-rpl.bat and open that link on other devices to share the squad.",
          true
        );
        renderRoster(list);
        const board = document.getElementById("squad-board");
        if (board) board.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (roster) {
      roster.innerHTML = '<p class="empty-role">Loading squad…</p>';
      roster.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-remove]");
        if (!button) return;
        const next = (await loadPlayers()).filter((player) => player.id !== button.getAttribute("data-remove"));
        await savePlayers(next);
        renderRoster(next);
      });
      loadPlayers().then(renderRoster);
      if (channel) {
        channel.addEventListener("message", async () => {
          renderRoster(await loadPlayers());
        });
      }
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible") {
          renderRoster(await loadPlayers());
        }
      });
    }
  }
})();

