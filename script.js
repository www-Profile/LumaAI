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
      if (e.target.closest(".sheet__body, .chat-messages, .chat-input, .chat-composer")) return;   /* внутри модалки скролл разрешён */
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
  const historyBtn         = document.getElementById("historyBtn");
  const historySettingsBtn = document.getElementById("historySettingsBtn");
  const historyNewBtn      = document.getElementById("historyNewBtn");
  const historyList        = document.getElementById("historyList");

  const historyAPI = createSheet(
    document.getElementById("historySheet"),
    document.getElementById("historyOverlay"),
    document.getElementById("historyHandle")
  );

  /* ---------- State ---------- */
  let chats = [];
  let activeChat = null;
  let editMode = false;

  try {
    const raw = localStorage.getItem("luma_chats");
    if (raw) chats = JSON.parse(raw);
  } catch (e) { chats = []; }

  function saveChats() {
    try { localStorage.setItem("luma_chats", JSON.stringify(chats)); } catch (e) {}
  }

  function uid() {
    return "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function formatTime(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return min + "m ago";
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + "h ago";
    const day = Math.floor(hr / 24);
    if (day === 1) return "Yesterday";
    if (day < 7) return day + "d ago";
    return new Date(ts).toLocaleDateString();
  }

  function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = "";

    const sorted = chats
      .filter(function (c) { return c.messages && c.messages.length > 0; })
      .sort(function (a, b) { return b.updatedAt - a.updatedAt; });

    if (sorted.length === 0) {
      const empty = document.createElement("li");
      empty.className = "history-empty";
      empty.textContent = "No chats yet";
      historyList.appendChild(empty);
      return;
    }

    sorted.forEach(function (c) {
      const li = document.createElement("li");
      li.className = "history-item";
      li.dataset.id = c.id;

      const title = document.createElement("span");
      title.className = "history-item__title";
      title.textContent = c.title || "New chat";
      li.appendChild(title);

      if (editMode) {
        const trash = document.createElement("button");
        trash.className = "history-item__trash";
        trash.setAttribute("aria-label", "Delete chat");
        trash.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>';
        trash.addEventListener("click", function (e) {
          e.stopPropagation();
          deleteChat(c.id);
        });
        li.appendChild(trash);
      } else {
        const meta = document.createElement("span");
        meta.className = "history-item__meta";
        meta.textContent = formatTime(c.updatedAt);
        li.appendChild(meta);
      }

      li.addEventListener("click", function () {
        if (editMode) return;
        if (historyAPI) historyAPI.close();
        openChatById(c.id);
      });

      historyList.appendChild(li);
    });
  }

  function updateEditModeUI() {
    if (historySettingsBtn) historySettingsBtn.classList.toggle("is-active", editMode);
    renderHistory();
  }

  function deleteChat(id) {
    chats = chats.filter(function (c) { return c.id !== id; });
    saveChats();

    if (activeChat && activeChat.id === id) {
      activeChat = null;
      if (chatScreen && chatScreen.classList.contains("is-open")) closeChat();
    }

    renderHistory();
    haptic(10);
  }

  if (historyBtn && historyAPI) {
    historyBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      editMode = false;
      updateEditModeUI();
      historyAPI.open();
    });
  }

  if (historySettingsBtn) {
    historySettingsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      editMode = !editMode;
      updateEditModeUI();
      haptic(8);
    });
  }

  if (historyNewBtn) {
    historyNewBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (historyAPI) historyAPI.close();
      createChat(null);
      openChatScreen(null);
    });
  }

  /* ============ CHAT SCREEN ============ */
  const chatScreen    = document.getElementById("chatScreen");
  const chatOverlay   = document.getElementById("chatOverlay");
  const chatComposer  = document.getElementById("chatComposer");
  const chatHoldBtn   = document.getElementById("chatHoldBtn");
  const chatHoldLabel = document.getElementById("chatHoldLabel");
  const chatExitBtn   = document.getElementById("chatExitBtn");
  const chatHistBtn   = document.getElementById("chatHistoryBtn");
  const chatMessages  = document.getElementById("chatMessages");
  const chatEmpty     = document.getElementById("chatEmpty");
  const chatInput     = document.getElementById("chatInput");
  const chatSendBtn   = document.getElementById("chatSendBtn");
  const chatSkill     = document.getElementById("chatSkill");
  const chatEmojiBtn  = document.getElementById("chatEmojiBtn");
  const chatAttachBtn = document.getElementById("chatAttachBtn");
  const newChatBtn    = document.getElementById("newChatBtn");

  const SKILL_MAP = {
    "Create Image":          { tag: "#Image",       emoji: "📸", prompt: "What image should I create?" },
    "Voice Assistant":       { tag: "#Voice",       emoji: "🎙️", prompt: "Tap and I'll listen…" },
    "Scan Document":         { tag: "#Document",    emoji: "📚", prompt: "Scan a document to get started" },
    "Help with Translation": { tag: "#Translation", emoji: "🌎", prompt: "What would you like to translate?" }
  };

  const DEFAULT_EMPTY = { emoji: "👋", prompt: "How can I help you today?" };

  function setEmptyState(info) {
    const emojiEl = chatEmpty.querySelector(".chat-empty__emoji");
    const textEl  = chatEmpty.querySelector(".chat-empty__text");
    const data = info || DEFAULT_EMPTY;
    if (emojiEl) emojiEl.textContent = data.emoji;
    if (textEl)  textEl.textContent  = data.prompt;
  }

  function renderActiveMessages() {
    chatMessages.querySelectorAll(".chat-bubble").forEach(function (b) { b.remove(); });

    if (!activeChat || !activeChat.messages || activeChat.messages.length === 0) {
      chatEmpty.classList.remove("is-hidden");
      return;
    }

    chatEmpty.classList.add("is-hidden");
    activeChat.messages.forEach(function (m) {
      const b = document.createElement("div");
      b.className = "chat-bubble";
      b.textContent = m.text;
      chatMessages.appendChild(b);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function createChat(skillInfo) {
    activeChat = {
      id: uid(),
      title: null,
      messages: [],
      skill: skillInfo || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return activeChat;
  }

  function commitActiveChat() {
    if (!activeChat) return;
    if (!activeChat.messages || activeChat.messages.length === 0) return;
    const idx = chats.findIndex(function (c) { return c.id === activeChat.id; });
    if (idx === -1) chats.unshift(activeChat);
    else chats[idx] = activeChat;
    saveChats();
  }

  function addMessage(text) {
    if (!activeChat) createChat(null);
    activeChat.messages.push({ role: "user", text: text, at: Date.now() });
    if (!activeChat.title) activeChat.title = text.slice(0, 40);
    activeChat.updatedAt = Date.now();
    commitActiveChat();

    if (chatSkill) chatSkill.hidden = true;

    renderActiveMessages();
    renderHistory();
  }

  function openChatScreen(skillInfo) {
    const hasMessages = activeChat && activeChat.messages && activeChat.messages.length > 0;

    if (!hasMessages) {
      if (skillInfo && skillInfo.tag) {
        chatSkill.textContent = skillInfo.tag;
        chatSkill.hidden = false;
        setEmptyState(skillInfo);
      } else {
        chatSkill.hidden = true;
        setEmptyState(null);
      }
    } else {
      chatSkill.hidden = true;
    }

    /* Голосовой режим: чип #Voice → показываем hold-to-speak */
    const isVoice = !!(skillInfo && skillInfo.tag === "#Voice");
    if (chatComposer) chatComposer.classList.toggle("is-voice", isVoice);
    if (chatHoldBtn) {
      chatHoldBtn.classList.remove("is-recording");
    }
    if (chatHoldLabel) chatHoldLabel.textContent = "Hold to speak";

    renderActiveMessages();

    if (chatOverlay) chatOverlay.classList.add("is-open");
    chatScreen.classList.add("is-open");
    chatScreen.setAttribute("aria-hidden", "false");

    setTimeout(function () {
      if (chatInput) chatInput.focus();
    }, 360);

    haptic(8);
  }

  function openChatById(id) {
    const chat = chats.find(function (c) { return c.id === id; });
    if (!chat) return;
    activeChat = chat;
    openChatScreen(chat.skill || null);
  }

  function closeChat() {
    if (chatOverlay) chatOverlay.classList.remove("is-open");
    chatScreen.classList.remove("is-open");
    chatScreen.setAttribute("aria-hidden", "true");

    if (activeChat && activeChat.messages && activeChat.messages.length === 0) {
      activeChat = null;
    }

    haptic(6);
  }

  if (newChatBtn) {
    newChatBtn.addEventListener("click", function () {
      createChat(null);
      openChatScreen(null);
    });
  }

  document.querySelectorAll(".action-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const info = SKILL_MAP[card.dataset.action] || null;
      createChat(info);
      openChatScreen(info);
    });
  });

  if (chatExitBtn) chatExitBtn.addEventListener("click", closeChat);

  if (chatHistBtn && historyAPI) {
    chatHistBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      editMode = false;
      updateEditModeUI();
      historyAPI.open();
    });
  }

  function sendChatMessage() {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text);
    chatInput.value = "";
    chatInput.style.height = "auto";
    haptic(6);
  }

  if (chatSendBtn) chatSendBtn.addEventListener("click", sendChatMessage);

  if (chatInput) {
    chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    chatInput.addEventListener("input", function () {
      chatInput.style.height = "auto";
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
    });
  }

  /* ============ POPUPS: emoji / skills / attach ============ */
  const POPUP_IDS = ["emojiPicker", "skillPicker", "attachMenu"];

  function closeAllPopups() {
    POPUP_IDS.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove("is-open");
    });
  }

  function openPopup(id) {
    closeAllPopups();
    const el = document.getElementById(id);
    if (el) el.classList.add("is-open");
  }

  function togglePopup(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.classList.contains("is-open")) el.classList.remove("is-open");
    else openPopup(id);
  }

  /* ---------- Emoji picker ---------- */
  const EMOJIS = [
    "😀","😃","😄","😁","😆","😅","😂","🤣",
    "😊","😇","🙂","🙃","😉","😌","😍","🥰",
    "😘","😗","😙","😚","😋","😛","😝","😜",
    "🤪","🤨","🧐","🤓","😎","🥳","😏","😒",
    "😞","😔","😟","😕","🙁","☹️","😣","😖",
    "😫","😩","🥺","😢","😭","😤","😠","😡",
    "🤬","🤯","😳","🥵","🥶","😱","😨","😰",
    "😥","😓","🤗","🤔","🤭","🤫","🤥","😶",
    "😐","😑","😬","🙄","😯","😦","😧","😮",
    "😲","🥱","😴","🤤","😪","😵","🤐","🥴",
    "🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠",
    "😈","👿","👹","👺","🤡","💩","👻","💀",
    "☠️","👽","👾","🤖","🎃","😺","😸","😹",
    "😻","😼","😽","🙀","😿","😾",
    "❤️","🧡","💛","💚","💙","💜","🖤","🤍",
    "🤎","💔","❣️","💕","💞","💓","💗","💖",
    "💘","💝","💟","👍","👎","👌","🤌","🤏",
    "✌️","🤞","🤟","🤘","🤙","👈","👉","👆",
    "👇","☝️","👋","🤚","🖐️","✋","🖖","👏",
    "🙌","🤲","🤝","🙏","✍️","💪","🦾","🦿",
    "🔥","✨","⭐","🌟","💫","⚡","☀️","🌙"
  ];

  const emojiGrid = document.getElementById("emojiGrid");
  if (emojiGrid && emojiGrid.children.length === 0) {
    EMOJIS.forEach(function (emoji) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "emoji-btn";
      btn.textContent = emoji;
      btn.addEventListener("click", function () {
        insertEmoji(emoji);
      });
      emojiGrid.appendChild(btn);
    });
  }

  function insertEmoji(emoji) {
    if (!chatInput) return;
    const start = chatInput.selectionStart || 0;
    const end = chatInput.selectionEnd || 0;
    const val = chatInput.value;
    chatInput.value = val.slice(0, start) + emoji + val.slice(end);
    const pos = start + emoji.length;
    chatInput.setSelectionRange(pos, pos);
    chatInput.focus();
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
  }

  if (chatEmojiBtn) {
    chatEmojiBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePopup("emojiPicker");
    });
  }

  /* ---------- Attach menu ---------- */
  if (chatAttachBtn) {
    chatAttachBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePopup("attachMenu");
    });
  }

  document.querySelectorAll(".attach-option").forEach(function (opt) {
    opt.addEventListener("click", function () {
      const kind = opt.dataset.attach;
      if (kind === "Skills") {
        openSkillPicker("");
        return;
      }
      closeAllPopups();
      showToast(kind + " — coming soon");
    });
  });

  /* ---------- Skills picker ---------- */
  const skillList = document.getElementById("skillList");

  function openSkillPicker(filter) {
    if (!skillList) return;
    skillList.innerHTML = "";

    const q = (filter || "").toLowerCase();
    let found = 0;

    Object.values(SKILL_MAP).forEach(function (skill) {
      const tagLower = skill.tag.toLowerCase();
      if (q && tagLower.indexOf("#" + q) !== 0) return;
      found++;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "skill-item";
      btn.innerHTML =
        '<span class="skill-item__tag">' + skill.tag + '</span>' +
        '<span class="skill-item__desc">' + skill.prompt + '</span>';
      btn.addEventListener("click", function () {
        applySkill(skill.tag);
      });
      skillList.appendChild(btn);
    });

    if (found === 0) {
      const empty = document.createElement("div");
      empty.className = "skill-empty";
      empty.textContent = "No matching skills";
      skillList.appendChild(empty);
    }

    openPopup("skillPicker");
  }

  function applySkill(tag) {
    if (!chatInput) return;
    const val = chatInput.value;
    const cursor = chatInput.selectionStart || val.length;
    const beforeCursor = val.slice(0, cursor);
    const afterCursor = val.slice(cursor);
    const match = beforeCursor.match(/#(\w*)$/);

    let newVal, newPos;
    if (match) {
      const start = beforeCursor.length - match[0].length;
      newVal = val.slice(0, start) + tag + " " + afterCursor;
      newPos = start + tag.length + 1;
    } else {
      newVal = beforeCursor + tag + " " + afterCursor;
      newPos = cursor + tag.length + 1;
    }

    chatInput.value = newVal;
    chatInput.setSelectionRange(newPos, newPos);
    chatInput.focus();
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";

    closeAllPopups();
  }

  /* ---------- Детект # при вводе ---------- */
  if (chatInput) {
    chatInput.addEventListener("input", function () {
      const emojiPicker = document.getElementById("emojiPicker");
      const attachMenu  = document.getElementById("attachMenu");
      if (emojiPicker) emojiPicker.classList.remove("is-open");
      if (attachMenu)  attachMenu.classList.remove("is-open");

      const val = chatInput.value;
      const cursor = chatInput.selectionStart || 0;
      const beforeCursor = val.slice(0, cursor);
      const match = beforeCursor.match(/#(\w*)$/);

      if (match) {
        openSkillPicker(match[1]);
      } else {
        const sp = document.getElementById("skillPicker");
        if (sp) sp.classList.remove("is-open");
      }
    });
  }

  /* ---------- Закрытие по клику вне ---------- */
  document.addEventListener("click", function (e) {
    if (e.target.closest(".chat-popup")) return;
    if (e.target.closest("#chatEmojiBtn")) return;
    if (e.target.closest("#chatAttachBtn")) return;
    if (e.target.closest("#chatInput")) return;
    closeAllPopups();
  });

    /* ============ ACCENT COLOR PICKER ============ */
  const accentPicker = document.getElementById("accentPicker");
  if (accentPicker) {
    const dots = accentPicker.querySelectorAll(".accent-dot");
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        const color = dot.dataset.color;
        if (!color) return;
        document.documentElement.style.setProperty("--accent", color);
        dots.forEach(function (d) { d.classList.remove("is-active"); });
        dot.classList.add("is-active");
        haptic(6);
      });
    });
  }

    /* ============ HOLD TO SPEAK ============ */
  if (chatHoldBtn) {
    let recording = false;
    let recordStart = 0;

    function startHold(e) {
      if (recording) return;
      recording = true;
      recordStart = Date.now();
      chatHoldBtn.classList.add("is-recording");
      if (chatHoldLabel) chatHoldLabel.textContent = "Listening…";
      haptic(12);
      if (e && e.pointerId != null && chatHoldBtn.setPointerCapture) {
        try { chatHoldBtn.setPointerCapture(e.pointerId); } catch (err) {}
      }
    }

    function endHold() {
      if (!recording) return;
      recording = false;
      chatHoldBtn.classList.remove("is-recording");
      if (chatHoldLabel) chatHoldLabel.textContent = "Hold to speak";

      const held = Date.now() - recordStart;
      haptic(6);
      if (held > 300) {
        showToast("Voice — coming soon");
      }
    }

    chatHoldBtn.addEventListener("pointerdown", startHold);
    chatHoldBtn.addEventListener("pointerup", endHold);
    chatHoldBtn.addEventListener("pointercancel", endHold);
    chatHoldBtn.addEventListener("pointerleave", endHold);

    /* Запрет контекстного меню по долгому тапу на мобильных */
    chatHoldBtn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
})();