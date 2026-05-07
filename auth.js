const BB_COLORS = [
  '#2a6dbf', '#bf5a2a', '#2abf6d', '#8c2abf',
  '#bf2a5a', '#2abfbf', '#6d8c2a', '#8c6d2a'
];

window.currentUser = null;

const CLIENT_ID =
  "821906457084-1cctu5foq0vrenon1275g7cb3ed423d1.apps.googleusercontent.com";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyD5oir2beAnURC3hy56VCA4vIaJXuu6KoGlNmF03cyXEzqSwbAzqZOH9yiKdYGlEYQ/exec";

let tokenClient = null;
let _pendingCallback = null;

// ---------------- STORAGE HELPERS ----------------
function bbGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

function bbSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { console.warn("bbSet failed", key, e); }
}

// ---------------- SESSION ----------------
function saveSession(user) {
  localStorage.setItem("bb-user", JSON.stringify(user));
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem("bb-user")); }
  catch { return null; }
}

function clearSession() {
  localStorage.removeItem("bb-user");
}

// ---------------- AUTH MODAL ----------------
function injectAuthModal() {
  if (document.getElementById('bb-auth-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'bb-auth-modal';
  overlay.className = 'auth-modal-overlay';
  overlay.innerHTML = `
    <div class="auth-modal">
      <div class="auth-modal-icon">🔒</div>
      <div class="auth-modal-title" id="auth-modal-title">Sign in to continue</div>
      <div class="auth-modal-sub" id="auth-modal-sub">
        You need to be signed in to do that.
      </div>
      <button class="auth-modal-btn" onclick="signInFromModal()">
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.3 0-9.7-3.2-11.3-7.8l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C37 38 44 32.8 44 24c0-1.3-.1-2.6-.4-3.9z"/>
        </svg>
        Sign in with Google
      </button>
      <button class="auth-modal-cancel" onclick="closeAuthModal()">Maybe later</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAuthModal();
  });
}

function openAuthModal(title, sub, callback) {
  injectAuthModal();
  _pendingCallback = callback || null;

  if (title) document.getElementById('auth-modal-title').textContent = title;
  if (sub)   document.getElementById('auth-modal-sub').textContent   = sub;

  document.getElementById('bb-auth-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  const modal = document.getElementById('bb-auth-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  _pendingCallback = null;
}

window.closeAuthModal = closeAuthModal;

window.signInFromModal = function () {
  closeAuthModal();
  if (!tokenClient) return;
  tokenClient.requestAccessToken();
};

// ---------------- AUTH GUARD ----------------
window.authGuard = function (callback, title, sub) {
  if (window.currentUser) {
    callback();
    return;
  }
  openAuthModal(
    title || 'Sign in to continue',
    sub   || 'You need to be signed in to do that.',
    callback
  );
};

// ---------------- GOOGLE AUTH ----------------
function initGoogleAuth() {
  if (!window.google?.accounts?.oauth2) return;

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: "openid email profile",
    callback: async (response) => {
      const userInfo = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${response.access_token}` } }
      ).then(r => r.json());

      const firstName = (userInfo.name || "").split(" ")[0] || "?";

      window.currentUser = {
        uid:      userInfo.sub,
        name:     userInfo.name,
        email:    userInfo.email,
        picture:  userInfo.picture,
        color:    BB_COLORS[Math.floor(Math.random() * BB_COLORS.length)],
        initials: firstName.charAt(0).toUpperCase()
      };

      saveSession(window.currentUser);
      saveUserIfNeeded(window.currentUser);
      updateNavAuth();
      window.dispatchEvent(new Event("bb-auth-change"));
      syncToSheet({ action: "upsertUser", user: window.currentUser });

      if (_pendingCallback) {
        const cb = _pendingCallback;
        _pendingCallback = null;
        cb();
      }
    }
  });
}

// ---------------- SHEET SYNC ----------------
function syncToSheet(payload) {
  try {
    const encoded = encodeURIComponent(JSON.stringify(payload));
    const url     = `${APPS_SCRIPT_URL}?payload=${encoded}`;
    fetch(url, { mode: "no-cors" }).catch(() => {});
  } catch (err) { console.warn("syncToSheet skipped:", err); }
}

// ---------------- SESSION RESTORE ----------------
function restoreSession() {
  const saved = loadSession();
  if (saved) window.currentUser = saved;
}

// ---------------- LOCAL CACHE USER ----------------
function saveUserIfNeeded(user) {
  const key  = "bb-users";
  let users  = bbGet(key) || [];
  if (!users.find(u => u.uid === user.uid)) {
    users.push({
      uid: user.uid, name: user.name, color: user.color,
      initials: user.initials, wishlist: 0, ridden: 0, fav: 0, total: 0
    });
    bbSet(key, users);
  }
}

// ---------------- SIGN IN / OUT ----------------
window.signIn = function () {
  if (!tokenClient) return;
  tokenClient.requestAccessToken();
};

window.signOut = function () {
  window.currentUser = null;
  clearSession();
  updateNavAuth();
  window.dispatchEvent(new Event("bb-auth-change"));
};

// ---------------- NAV ----------------
function updateNavAuth() {
  const area = document.getElementById("auth-area");
  if (!area) return;

  if (!window.currentUser) {
    area.innerHTML = `<a href="#" class="nav-signin" onclick="signIn(); return false;">Sign In</a>`;
    return;
  }

  area.innerHTML = `
    <div class="user-chip" id="user-chip">
      <div class="user-avatar" style="background:${window.currentUser.color}">
        ${window.currentUser.initials}
      </div>
      <span class="user-name">${window.currentUser.name}</span>
      <div class="user-menu">
        <a href="#" id="signout-btn">Sign out</a>
      </div>
    </div>
  `;

  const chip = document.getElementById("user-chip");
  chip.onclick = (e) => { e.stopPropagation(); chip.classList.toggle("open"); };
  document.addEventListener("click", () => chip.classList.remove("open"));
  document.getElementById("signout-btn").onclick = (e) => { e.preventDefault(); signOut(); };
}

// ---------------- TOAST ----------------
window.showToast = function (msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
};

// ---------------- ACTIONS ----------------
window.toggleAction = function (bikeId, bikeName, action) {
  if (!window.currentUser) {
    openAuthModal(
      'Sign in to save bikes',
      'Sign in with Google to wishlist, favourite, and mark bikes as ridden.',
      () => toggleAction(bikeId, bikeName, action)
    );
    return;
  }

  const uid    = window.currentUser.uid;
  const actKey = "bb-actions-" + uid;
  let actions  = bbGet(actKey) || {};

  if (!actions[bikeId]) actions[bikeId] = {};

  const wasActive         = !!actions[bikeId][action];
  const isNowActive       = !wasActive;
  actions[bikeId][action] = isNowActive;
  bbSet(actKey, actions);

  const usersKey = "bb-users";
  let users      = bbGet(usersKey) || [];
  const idx      = users.findIndex(u => u.uid === uid);

  if (idx !== -1) {
    users[idx][action] = (users[idx][action] || 0) + (wasActive ? -1 : 1);
    users[idx][action] = Math.max(0, users[idx][action]);
    users[idx].total   = (users[idx].wishlist || 0) + (users[idx].ridden || 0) + (users[idx].fav || 0);
    bbSet(usersKey, users);
  }

  // Sync counts to sheet
  syncToSheet({ action: "updateCounts", uid, bikeId, stat: action, delta: wasActive ? -1 : 1 });

  // Add or remove feed entry depending on toggle direction
  syncToSheet({
    action:   "feedEntry",
    uid:      uid,
    userName: window.currentUser.name,
    photoURL: window.currentUser.picture,
    stat:     action,
    bikeId:   bikeId,
    bikeName: bikeName,
    active:   isNowActive,  // false = delete row from Feed sheet, true = upsert it
  });

  const labels = {
    wishlist: isNowActive ? "Added to Wishlist"   : "Removed from Wishlist",
    ridden:   isNowActive ? "Marked as Ridden"    : "Unmarked as Ridden",
    fav:      isNowActive ? "Added to Favourites" : "Removed from Favourites"
  };

  showToast(labels[action]);
  window.dispatchEvent(new CustomEvent("bb-action-change", { detail: { bikeId, action, active: isNowActive } }));
  return isNowActive;
};

// ---------------- GET ACTIONS ----------------
window.getUserActions = function () {
  if (!window.currentUser) return {};
  return bbGet("bb-actions-" + window.currentUser.uid) || {};
};

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
  restoreSession();
  updateNavAuth();
  injectAuthModal();

  if (window.google?.accounts?.oauth2) {
    initGoogleAuth();
  } else {
    window.addEventListener("load", initGoogleAuth);
  }
});