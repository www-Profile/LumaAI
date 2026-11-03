/* ============================================================
   AI Assistant — макет без реальных функций.
   Все кнопки показывают toast (на английском) + лёгкая вибрация.
   ============================================================ */

(function () {
  "use strict";

  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 1800);
  }

  function haptic(ms) {
    if (navigator.vibrate) navigator.vibrate(ms || 10);
  }

  function bind(element, message) {
    if (!element) return;
    element.addEventListener("click", function () {
      haptic(8);
      showToast(message);
    });
  }

  /* Сетка 2×2 */
  document.querySelectorAll(".action-card").forEach(function (card) {
    const action = card.dataset.action || "Action";
    bind(card, action + " — coming soon");
  });

  /* Главная кнопка */
  bind(document.getElementById("newChatBtn"), "Starting a new chat…");

  /* ============ БЛОКИРОВКА ЗУМА (pinch) ============ */
  document.addEventListener(
    "gesturestart",
    function (e) { e.preventDefault(); },
    { passive: false }
  );
  document.addEventListener(
    "gesturechange",
    function (e) { e.preventDefault(); },
    { passive: false }
  );
  document.addEventListener(
    "gestureend",
    function (e) { e.preventDefault(); },
    { passive: false }
  );

  /* Двойной тап = зум в Safari — гасим */
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    function (e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false }
  );

  /* Блокировка «резинки» при скролле на iOS */
  document.addEventListener(
    "touchmove",
    function (e) {
      if (e.target.closest(".sheet__body")) return;   /* внутри модалки скролл разрешён */
      e.preventDefault();
    },
    { passive: false }
  );

  /* ============ BOTTOM SHEETS (shared) ============ */
  function createSheet(sheetEl, overlayEl, handleEl) {
    if (!sheetEl || !overlayEl || !handleEl) return null;

    let isOpen = false;
    let startY = 0;
    let currentY = 0;
    let dragging = false;

    function open() {
      if (isOpen) return;
      isOpen = true;
      overlayEl.hidden = false;
      sheetEl.hidden = false;
      void sheetEl.offsetHeight;
      requestAnimationFrame(function () {
        overlayEl.classList.add("is-open");
        sheetEl.classList.add("is-open");
      });
      haptic(8);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      overlayEl.classList.remove("is-open");
      sheetEl.classList.remove("is-open");
      sheetEl.style.transform = "";
      setTimeout(function () {
        sheetEl.hidden = true;
        overlayEl.hidden = true;
      }, 380);
      haptic(6);
    }

    overlayEl.addEventListener("click", close);

    handleEl.addEventListener("pointerdown", function (e) {
      dragging = true;
      startY = e.clientY;
      currentY = 0;
      sheetEl.style.transition = "none";
      handleEl.setPointerCapture(e.pointerId);
    });

    handleEl.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      currentY = Math.max(0, e.clientY - startY);
      sheetEl.style.transform = "translateY(" + currentY + "px)";
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      sheetEl.style.transition = "";
      if (currentY > 100) close();
      else sheetEl.style.transform = "";
      currentY = 0;
    }

    handleEl.addEventListener("pointerup", endDrag);
    handleEl.addEventListener("pointercancel", endDrag);

    return { open: open, close: close };
  }

  /* ---------- Premium ---------- */
  const premiumBtn     = document.getElementById("premiumBtn");
  const premiumClose   = document.getElementById("premiumClose");
  const premiumSub     = document.getElementById("premiumSubscribe");

  const premiumAPI = createSheet(
    document.getElementById("premiumSheet"),
    document.getElementById("premiumOverlay"),
    document.getElementById("premiumHandle")
  );

  if (premiumBtn && premiumAPI) {
    premiumBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      premiumAPI.open();
    });
  }
  if (premiumClose && premiumAPI) {
    premiumClose.addEventListener("click", premiumAPI.close);
  }
  if (premiumSub) {
    premiumSub.addEventListener("click", function () {
      showToast("Premium — coming soon");
    });
  }

  /* ---------- Settings ---------- */
  const settingsBtn = document.getElementById("settingsBtn");

  const settingsAPI = createSheet(
    document.getElementById("settingsSheet"),
    document.getElementById("settingsOverlay"),
    document.getElementById("settingsHandle")
  );

  if (settingsBtn && settingsAPI) {
    settingsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      settingsAPI.open();
    });
  }

  /* Клик по строкам настроек — пока заглушка */
  document.querySelectorAll(".settings-row--button").forEach(function (row) {
    row.addEventListener("click", function () {
      showToast(row.dataset.setting + " — coming soon");
    });
  });

    /* ---------- Chat History ---------- */
  const historyBtn = document.getElementById("historyBtn");

  const historyAPI = createSheet(
    document.getElementById("historySheet"),
    document.getElementById("historyOverlay"),
    document.getElementById("historyHandle")
  );

  if (historyBtn && historyAPI) {
    historyBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      historyAPI.open();
    });
  }

  /* Кнопки внутри истории — пока не рабочие */
  const historySettingsBtn = document.getElementById("historySettingsBtn");
  const historyNewBtn      = document.getElementById("historyNewBtn");

  if (historySettingsBtn) {
    historySettingsBtn.addEventListener("click", function (e) {
      e.stopPropagation();       /* чтобы не закрывать модалку по клику на фон */
    });
  }

  if (historyNewBtn) {
    historyNewBtn.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  /* Клик по чату — заглушка */
  document.querySelectorAll(".history-item").forEach(function (item) {
    item.addEventListener("click", function () {
      showToast(item.querySelector(".history-item__title").textContent + " — coming soon");
    });
  });
})();