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

  /* Верхние кнопки */
  bind(document.getElementById("historyBtn"), "Chat history — coming soon");
  bind(document.getElementById("settingsBtn"), "Settings — coming soon");

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

  /* ============ BOTTOM SHEET ============ */
  const premiumSheet   = document.getElementById("premiumSheet");
  const premiumOverlay = document.getElementById("premiumOverlay");
  const premiumHandle  = document.getElementById("premiumHandle");
  const premiumClose   = document.getElementById("premiumClose");
  const premiumSub     = document.getElementById("premiumSubscribe");

  let sheetOpen = false;
  let startY = 0;
  let currentY = 0;
  let dragging = false;

  function openSheet() {
    if (!premiumSheet || sheetOpen) return;
    sheetOpen = true;
    premiumOverlay.hidden = false;
    premiumSheet.hidden = false;

    /* форсируем рефлоу, чтобы transition сработал */
    void premiumSheet.offsetHeight;

    requestAnimationFrame(function () {
      premiumOverlay.classList.add("is-open");
      premiumSheet.classList.add("is-open");
    });

    haptic(8);
  }

  function closeSheet() {
    if (!premiumSheet || !sheetOpen) return;
    sheetOpen = false;

    premiumOverlay.classList.remove("is-open");
    premiumSheet.classList.remove("is-open");
    premiumSheet.style.transform = "";

    setTimeout(function () {
      premiumSheet.hidden = true;
      premiumOverlay.hidden = true;
    }, 380);

    haptic(6);
  }

  /* кнопка Try Premium открывает модалку */
  if (premiumBtn) {
    premiumBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openSheet();
    });
  }

  /* клик по фону / Maybe later — закрыть */
  if (premiumOverlay)  premiumOverlay.addEventListener("click", closeSheet);
  if (premiumClose)    premiumClose.addEventListener("click", closeSheet);

  /* ---------- Свайп вниз для закрытия ---------- */
  if (premiumHandle && premiumSheet) {
    premiumHandle.addEventListener("pointerdown", function (e) {
      dragging = true;
      startY = e.clientY;
      currentY = 0;
      premiumSheet.style.transition = "none";
      premiumHandle.setPointerCapture(e.pointerId);
    });

    premiumHandle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      currentY = Math.max(0, e.clientY - startY);
      premiumSheet.style.transform = "translateY(" + currentY + "px)";
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      premiumSheet.style.transition = "";
      if (currentY > 100) {
        closeSheet();
      } else {
        premiumSheet.style.transform = "";
      }
      currentY = 0;
    }

    premiumHandle.addEventListener("pointerup", endDrag);
    premiumHandle.addEventListener("pointercancel", endDrag);
  }
})();