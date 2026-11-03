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
  bind(document.getElementById("premiumBtn"), "Premium is coming soon");
  bind(document.getElementById("settingsBtn"), "Settings — coming soon");

  /* Сетка 2×2 */
  document.querySelectorAll(".action-card").forEach(function (card) {
    const action = card.dataset.action || "Action";
    bind(card, action + " — coming soon");
  });

  /* Главная кнопка */
  bind(document.getElementById("newChatBtn"), "Starting a new chat…");

  /* Блокировка «резинки» при скролле на iOS */
  document.addEventListener(
    "touchmove",
    function (e) {
      if (e.target.closest(".content")) return;
      e.preventDefault();
    },
    { passive: false }
  );
})();