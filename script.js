/* ============================================================
   LumaAI — frontend prototype.
   ============================================================ */

(function () {
  "use strict";

    /* ============ ПРЕДЗАГРУЗКА ИКОНОК НАВЫКОВ ============ */
  (function preloadSkillImages() {
    const paths = [
      "images/skill-hello.png",
      "images/skill-image.png",
      "images/skill-voice.png",
      "images/skill-document.png",
      "images/skill-translation.png"
    ];
    paths.forEach(function (src) {
      const img = new Image();
      img.src = src;
    });
  })();

    const IMAGE_GEN_DURATION = 5000;

  /* ============ VISUAL VIEWPORT (keyboard fix) ============ */
  (function () {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    function update() {
      root.style.setProperty("--vvh", vv.height + "px");
      root.style.setProperty("--vvt", vv.offsetTop + "px");
    }
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
  })();

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

  /* ============ BLOCK ZOOM ============ */
  document.addEventListener("gesturestart",  function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener("gesturechange", function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener("gestureend",    function (e) { e.preventDefault(); }, { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener("touchend", function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener("touchmove", function (e) {
    if (e.target.closest(".sheet__body, .chat-messages, .chat-input, .chat-composer")) return;
    e.preventDefault();
  }, { passive: false });

  /* ============ BOTTOM SHEETS ============ */
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
  /* ---------- Premium: выбор плана ---------- */
  const premiumPlans = document.getElementById("premiumPlans");
  let selectedPlan = "boss";

  function syncPremiumButton() {
    if (!premiumSub) return;
    const label = selectedPlan === "pro" ? "Pro" : "Boss";
    premiumSub.textContent = "Continue with " + label;
  }

  if (premiumPlans) {
    premiumPlans.addEventListener("click", function (e) {
      const card = e.target.closest(".premium-plan");
      if (!card) return;
      selectedPlan = card.dataset.plan || "boss";
      premiumPlans.querySelectorAll(".premium-plan").forEach(function (el) {
        el.classList.toggle("is-active", el === card);
      });
      syncPremiumButton();
      haptic(4);
    });
  }

  if (premiumSub) {
    premiumSub.addEventListener("click", function () {
      const label = selectedPlan === "pro" ? "Pro" : "Boss";
      showToast("Subscribed to " + label + " — coming soon");
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
    /* Если приложение закрыли во время генерации — догенерируем */
    chats.forEach(function (c) {
      /* Миграция: раньше можно было копить навыки — оставляем только первый */
      if (Array.isArray(c.skills) && c.skills.length > 1) {
        c.skills = [c.skills[0]];
      }
      if (Array.isArray(c.skills) && c.skills.length === 1) {
        c.skill = Object.values(SKILL_MAP).find(function (s) {
          return s.tag === c.skills[0];
        }) || null;
      }
      if (c.messages) {
        c.messages.forEach(function (m) {
          if (m.type === "image-gen" && m.status === "loading") {
            m.status = "ready";
          }
        });
      }
    });
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
  const chatEmojiBtn  = document.getElementById("chatEmojiBtn");
  const chatAttachBtn = document.getElementById("chatAttachBtn");
    const chatHashBtn = document.getElementById("chatHashBtn");
  const chatAttachBtnVoice = document.getElementById("chatAttachBtnVoice");
  const newChatBtn    = document.getElementById("newChatBtn");

  const chatPending      = document.getElementById("chatPending");
  const chatSendBtnExtra = document.getElementById("chatSendBtnExtra");
  const MAX_PENDING = 10;

  let pendingAttachments = [];

  const SKILL_MAP = {
    "Create Image":          { tag: "#Image",       img: "images/skill-image.png",       prompt: "What image should I create?" },
    "Voice Assistant":       { tag: "#Voice",       img: "images/skill-voice.png",       prompt: "Tap and I'll listen…" },
    "Scan Document":         { tag: "#Document",    img: "images/skill-document.png",    prompt: "Scan a document to get started" },
    "Help with Translation": { tag: "#Translation", img: "images/skill-translation.png", prompt: "What would you like to translate?" }
  };

    const LANGS = [
    { code: "auto",  name: "Auto" },
    { code: "en",    name: "English" },
    { code: "ru",    name: "Russian" },
    { code: "es",    name: "Spanish" },
    { code: "fr",    name: "French" },
    { code: "de",    name: "German" },
    { code: "it",    name: "Italian" },
    { code: "pt",    name: "Portuguese" },
    { code: "zh",    name: "Chinese" },
    { code: "ja",    name: "Japanese" },
    { code: "ko",    name: "Korean" },
    { code: "ar",    name: "Arabic" },
    { code: "hi",    name: "Hindi" },
    { code: "tr",    name: "Turkish" },
    { code: "pl",    name: "Polish" },
    { code: "uk",    name: "Ukrainian" }
  ];

  function langName(code) {
    const l = LANGS.find(function (x) { return x.code === code; });
    return l ? l.name : code;
  }

  const DEFAULT_ICON   = "images/skill-hello.png";
  const DEFAULT_EMOJI  = "👋";                     /* фолбэк, если картинки нет */
  const DEFAULT_PROMPT = "How can I help you today?";

  function setEmptyState(info) {
    const emojiEl = chatEmpty && chatEmpty.querySelector(".chat-empty__emoji");
    const textEl  = chatEmpty && chatEmpty.querySelector(".chat-empty__text");
    if (!textEl) return;                    /* нет — молча выходим */
    if (!emojiEl) { textEl.textContent = (info && info.prompt) || DEFAULT_PROMPT; return; }

    /* Сброс на дефолт */
    emojiEl.innerHTML = "";
    if (DEFAULT_ICON) {
      const defImg = document.createElement("img");
      defImg.src = DEFAULT_ICON;
      defImg.alt = "";
      defImg.className = "chat-empty__icon";
      defImg.onerror = function () { emojiEl.textContent = DEFAULT_EMOJI; };
      emojiEl.appendChild(defImg);
    } else {
      emojiEl.textContent = DEFAULT_EMOJI;
    }
    textEl.textContent = DEFAULT_PROMPT;

    if (!info) return;

    if (info.img) {
      emojiEl.innerHTML = "";
      const img = document.createElement("img");
      img.src = info.img;
      img.alt = "";
      img.className = "chat-empty__icon";
      img.onerror = function () { emojiEl.textContent = info.emoji || DEFAULT_EMOJI; };
      emojiEl.appendChild(img);
    } else if (info.emoji) {
      emojiEl.textContent = info.emoji;
    }

    if (info.prompt) textEl.textContent = info.prompt;
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
      if (m.role === "assistant" && !m.type && m.text) {
        b.classList.add("chat-bubble--assistant");
      }

      if (m.type === "image-gen") {
        /* --- Правая сторона: сообщение пользователя --- */
        const userBubble = document.createElement("div");
        userBubble.className = "chat-bubble";

        if (m.skills && m.skills.length) {
          const skillsRow = document.createElement("div");
          skillsRow.className = "chat-bubble__skills";
          m.skills.forEach(function (tag) {
            const tagEl = document.createElement("span");
            tagEl.className = "chat-bubble__skill";
            tagEl.textContent = tag;
            skillsRow.appendChild(tagEl);
          });
          userBubble.appendChild(skillsRow);
        }

        if (m.attachments && m.attachments.length) {
          m.attachments.forEach(function (att) {
            if (att.type === "image" && att.dataUrl) {
              const img = document.createElement("img");
              img.src = att.dataUrl;
              img.className = "chat-bubble__image";
              img.alt = att.name || "Image";
              userBubble.appendChild(img);
            } else if (att.type === "video" && att.dataUrl) {
              const video = document.createElement("video");
              video.src = att.dataUrl;
              video.controls = true;
              video.className = "chat-bubble__image";
              userBubble.appendChild(video);
            } else {
              const fileEl = document.createElement("div");
              fileEl.className = "chat-bubble__file";
              fileEl.textContent = (att.name || "File") + (att.size ? " (" + formatSize(att.size) + ")" : "");
              userBubble.appendChild(fileEl);
            }
          });
        }

        if (m.prompt) {
          const promptEl = document.createElement("div");
          promptEl.className = "chat-bubble__text";
          promptEl.textContent = m.prompt;
          userBubble.appendChild(promptEl);
        }

        chatMessages.appendChild(userBubble);

        /* --- Левая сторона: результат ИИ --- */
        const aiBubble = document.createElement("div");
        aiBubble.className = "chat-bubble chat-bubble--ai chat-bubble--image-gen";

        const wrap = document.createElement("div");
        wrap.className = "chat-bubble__image-gen chat-bubble__image-gen--" +
          (m.aspect === "16:9" ? "wide" : m.aspect === "9:16" ? "tall" : "square");

        if (m.status === "loading") {
          wrap.classList.add("is-loading");
          wrap.innerHTML =
            '<div class="img-loading">' +
              '<div class="img-loading__grid"></div>' +
              '<div class="img-loading__pulse"></div>' +
              '<div class="img-loading__percent">0%</div>' +
              '<div class="img-loading__label">Rendering</div>' +
            '</div>';
        } else {
          const ph = document.createElement("div");
          ph.className = "chat-bubble__image-placeholder";
          ph.textContent = "✨";
          wrap.appendChild(ph);
        }
        aiBubble.appendChild(wrap);
        chatMessages.appendChild(aiBubble);

        /* Анимацию запускаем ПОСЛЕ вставки в DOM, иначе isConnected === false */
        if (m.status === "loading") {
          const pctEl = wrap.querySelector(".img-loading__percent");
          if (pctEl) animateImageProgress(pctEl, m.at, IMAGE_GEN_DURATION);
        }
        /* image-gen отрисован полностью: user + AI. Выходим из итерации. */
        return;
      } else if (m.type === "translation") {
        b.classList.add("chat-bubble--ai");
        const tr = document.createElement("div");
        tr.className = "chat-bubble__translation";

        const langsEl = document.createElement("div");
        langsEl.className = "chat-bubble__translation-langs";
        langsEl.textContent = langName(m.from) + " → " + langName(m.to);

        const textEl = document.createElement("div");
        textEl.className = "chat-bubble__translation-text";
        textEl.textContent = m.result || "";

        tr.appendChild(langsEl);
        tr.appendChild(textEl);
        b.appendChild(tr);
        chatMessages.appendChild(b);
        return;
      } else if (m.skills && m.skills.length) {
        const skillsRow = document.createElement("div");
        skillsRow.className = "chat-bubble__skills";
        m.skills.forEach(function (tag) {
          const tagEl = document.createElement("span");
          tagEl.className = "chat-bubble__skill";
          tagEl.textContent = tag;
          skillsRow.appendChild(tagEl);
        });
        b.appendChild(skillsRow);
      }

      if (m.type === "voice") {
        const voiceEl = document.createElement("div");
        voiceEl.className = "chat-bubble__voice";

        const playBtn = document.createElement("span");
        playBtn.className = "chat-bubble__voice-play";
        playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        voiceEl.appendChild(playBtn);

        const waveEl = document.createElement("span");
        waveEl.className = "chat-bubble__voice-wave";
        (m.bars || []).forEach(function (h) {
          const bar = document.createElement("span");
          bar.style.height = Math.round(h * 100) + "%";
          waveEl.appendChild(bar);
        });
        voiceEl.appendChild(waveEl);

        const durEl = document.createElement("span");
        durEl.className = "chat-bubble__voice-dur";
        durEl.textContent = formatDuration(m.duration);
        voiceEl.appendChild(durEl);

        b.appendChild(voiceEl);

        /* Play / Pause — визуальный проигрыш */
        let playing = false;
        let playTimer = null;
        playBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (playing) {
            playing = false;
            clearTimeout(playTimer);
            playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            waveEl.classList.remove("is-playing");
          } else {
            playing = true;
            playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
            waveEl.classList.add("is-playing");
            haptic(6);
            playTimer = setTimeout(function () {
              playing = false;
              playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
              waveEl.classList.remove("is-playing");
            }, m.duration);
          }
        });
      }

      if (m.attachments && m.attachments.length) {
        m.attachments.forEach(function (att) {
          if (att.type === "image" && att.dataUrl) {
            const img = document.createElement("img");
            img.src = att.dataUrl;
            img.className = "chat-bubble__image";
            img.alt = att.name || "Image";
            b.appendChild(img);
          } else if (att.type === "video" && att.dataUrl) {
            const video = document.createElement("video");
            video.src = att.dataUrl;
            video.controls = true;
            video.className = "chat-bubble__image";
            b.appendChild(video);
          } else {
            const fileEl = document.createElement("div");
            fileEl.className = "chat-bubble__file";
            fileEl.textContent = (att.name || "File") + (att.size ? " (" + formatSize(att.size) + ")" : "");
            b.appendChild(fileEl);
          }
        });
      }

      if (m.text) {
        const textEl = document.createElement("div");
        textEl.className = "chat-bubble__text";
        textEl.textContent = m.text;
        b.appendChild(textEl);
      }

      chatMessages.appendChild(b);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function createChat(skillInfo) {
    activeChat = {
      id: uid(),
      title: null,
      messages: [],
      skill: skillInfo || null,
      skills: (skillInfo && skillInfo.tag) ? [skillInfo.tag] : [],
      imageStyle: "photo",
      imageAspect: "1:1",
      fromLang: "auto",
      toLang: "en",
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

  function addMessage(text, attachments) {
    if (!activeChat) createChat(null);
    const msg = {
      role: "user",
      text: text || "",
      at: Date.now(),
      skills: (activeChat.skills || []).slice()
    };
    if (attachments && attachments.length) {
      msg.attachments = attachments;
    }
    activeChat.messages.push(msg);

    if (!activeChat.title) {
      activeChat.title = text
        ? text.slice(0, 40)
        : (attachments && attachments[0] && attachments[0].name) || "Attachment";
    }
    activeChat.updatedAt = Date.now();
    commitActiveChat();
    renderActiveMessages();
    renderHistory();
  }

    /* ============ AI FAKE REPLY ============ */
  const AI_REPLIES = [
    "Got it. Tell me more.",
    "Interesting. Could you elaborate?",
    "I'm with you. What's next?",
    "That makes sense.",
    "Noted. Anything else on your mind?"
  ];

  function pickAIReply(text) {
    const t = (text || "").toLowerCase().trim();
    if (/^(hi|hello|hey|привет|здравствуй|прив)\b/.test(t)) {
      return "Hey! Great to see you. What are we working on?";
    }
    if (/\?$/.test(t)) {
      return "Good question. Let me think about it…";
    }
    if (t.includes("help") || t.includes("помог")) {
      return "Of course. What do you need help with?";
    }
    if (t.includes("thank") || t.includes("спасиб")) {
      return "You're welcome!";
    }
    if (t.includes("how are you")) {
      return "Running at full capacity. Thanks for asking — how can I help?";
    }
    return AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
  }

  function addAIMessage(text) {
    if (!activeChat) return;
    activeChat.messages.push({
      role: "assistant",
      text: text,
      at: Date.now()
    });
    activeChat.updatedAt = Date.now();
    commitActiveChat();
    renderActiveMessages();
  }

  function scheduleAIReply(userText) {
    if (!activeChat) return;
    const chatId = activeChat.id;
    const delay = 700 + Math.random() * 600;

    setTimeout(function () {
      if (!activeChat || activeChat.id !== chatId) return;
      if (!chatScreen.classList.contains("is-open")) return;
      addAIMessage(pickAIReply(userText));
      haptic(4);
    }, delay);
  }

  function openChatScreen(skillInfo) {
    const info = skillInfo || (activeChat && activeChat.skill) || null;
    const hasMessages = activeChat && activeChat.messages && activeChat.messages.length > 0;

    if (!hasMessages) setEmptyState(info);

    if (chatHoldBtn) chatHoldBtn.classList.remove("is-recording");
    if (chatHoldLabel) chatHoldLabel.textContent = "Hold to speak";

    renderActiveMessages();
    renderSkills();

    if (chatOverlay) chatOverlay.classList.add("is-open");
    chatScreen.classList.add("is-open");
    chatScreen.setAttribute("aria-hidden", "false");

    setTimeout(function () {
      if (chatInput && chatInput.offsetParent !== null) chatInput.focus();
    }, 360);

    haptic(8);
  }

  function openChatById(id) {
    const chat = chats.find(function (c) { return c.id === id; });
    if (!chat) return;
    clearPendingAndInput();
    activeChat = chat;
    openChatScreen(chat.skill || null);
  }

  function closeChat() {
    if (chatInput) chatInput.blur();
    clearPendingAndInput();
    if (chatOverlay) chatOverlay.classList.remove("is-open");
    chatScreen.classList.remove("is-open");
    chatScreen.setAttribute("aria-hidden", "true");

    if (activeChat && activeChat.messages && activeChat.messages.length === 0) {
      activeChat = null;
    }

    haptic(6);
  }

  function clearPendingAndInput() {
    pendingAttachments = [];
    renderPending();
    if (chatInput) {
      chatInput.value = "";
      chatInput.style.height = "auto";
    }
  }

  /* ---------- Home actions ---------- */
  if (newChatBtn) {
    newChatBtn.addEventListener("click", function () {
      clearPendingAndInput();
      createChat(null);
      openChatScreen(null);
    });
  }

  document.querySelectorAll(".action-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const info = SKILL_MAP[card.dataset.action] || null;
      clearPendingAndInput();
      createChat(info);
      openChatScreen(info);
    });
  });

  if (historyNewBtn) {
    historyNewBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (historyAPI) historyAPI.close();
      clearPendingAndInput();
      createChat(null);
      openChatScreen(null);
    });
  }

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
    const hasAttachments = pendingAttachments.length > 0;

    if (!text && !hasAttachments) return;

    addMessage(text, pendingAttachments.slice());

    chatInput.value = "";
    chatInput.style.height = "auto";
    pendingAttachments = [];
    renderPending();
    haptic(6);

    if (text) scheduleAIReply(text);
  }

  if (chatSendBtn) chatSendBtn.addEventListener("click", sendChatMessage);
  if (chatSendBtnExtra) chatSendBtnExtra.addEventListener("click", sendChatMessage);

  if (chatInput) {
    chatInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.shiftKey) return;
      e.preventDefault();

      /* Enter работает по активному режиму */
      if (chatComposer && chatComposer.classList.contains("is-image")) {
        if (imageGenerateBtn) imageGenerateBtn.click();
        return;
      }
      if (chatComposer && chatComposer.classList.contains("is-translate")) {
        if (translateBtn) translateBtn.click();
        return;
      }
      if (chatComposer && (chatComposer.classList.contains("is-voice") ||
                           chatComposer.classList.contains("is-document"))) {
        /* В voice/doc textarea скрыта — Enter игнорируем */
        return;
      }
      sendChatMessage();
    });

    chatInput.addEventListener("input", function () {
      chatInput.style.height = "auto";
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
    });
  }

  /* ============ POPUPS ============ */
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

  /* ---------- Emoji ---------- */
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
      btn.addEventListener("click", function () { insertEmoji(emoji); });
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

  if (chatAttachBtnVoice) {
    chatAttachBtnVoice.addEventListener("click", function (e) {
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
      if (kind === "Camera") { fileCamera && fileCamera.click(); return; }
      if (kind === "Album")  { fileAlbum  && fileAlbum.click();  return; }
      if (kind === "File")   { fileDoc    && fileDoc.click();    return; }
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
      btn.addEventListener("click", function () { applySkill(skill.tag); });
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

    if (match) {
      const start = beforeCursor.length - match[0].length;
      chatInput.value = val.slice(0, start) + afterCursor;
      chatInput.setSelectionRange(start, start);
    }

    addSkill(tag);
    if (chatInput.offsetParent !== null) chatInput.focus();
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
    closeAllPopups();
  }

  /* ---------- Detecting # on input ---------- */
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

  /* ---------- Close on outside click ---------- */
  document.addEventListener("click", function (e) {
    if (e.target.closest(".chat-popup")) return;
    if (e.target.closest("#chatEmojiBtn")) return;
    if (e.target.closest("#chatAttachBtn")) return;
        if (e.target.closest("#chatHashBtn")) return;
    if (e.target.closest("#chatAttachBtnVoice")) return;
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
        addVoiceMessage(held);
      }
    }

    chatHoldBtn.addEventListener("pointerdown", startHold);
    chatHoldBtn.addEventListener("pointerup", endHold);
    chatHoldBtn.addEventListener("pointercancel", endHold);
    chatHoldBtn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

    /* ============ VOICE MESSAGE ============ */
  function addVoiceMessage(durationMs) {
    if (!activeChat) createChat(null);

    /* Генерируем фейковую волну — 24 столбика разной высоты */
    const barCount = 24;
    const bars = [];
    for (let i = 0; i < barCount; i++) {
      bars.push(0.3 + Math.random() * 0.7);
    }

    const msg = {
      role: "user",
      type: "voice",
      duration: durationMs,
      bars: bars,
      at: Date.now(),
      skills: (activeChat.skills || []).slice()
    };

    activeChat.messages.push(msg);
    if (!activeChat.title) activeChat.title = "Voice message";
    activeChat.updatedAt = Date.now();

    commitActiveChat();
    renderActiveMessages();
    renderHistory();
    haptic(6);
  }

  function formatDuration(ms) {
    const total = Math.max(1, Math.round(ms / 1000));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return min + ":" + (sec < 10 ? "0" : "") + sec;
  }

  /* ============ PERSISTENT SKILL CHIPS ============ */
  function renderSkills() {
    if (chatComposer) {
      const skills = (activeChat && activeChat.skills) || [];
      const hasVoice = skills.indexOf("#Voice") !== -1;
      const hasDoc   = skills.indexOf("#Document") !== -1;
      const hasImage = skills.indexOf("#Image") !== -1;
      const hasTranslate = skills.indexOf("#Translation") !== -1;

      chatComposer.classList.toggle("is-voice",     hasVoice);
      chatComposer.classList.toggle("is-document",  !hasVoice && hasDoc);
      chatComposer.classList.toggle("is-image",     !hasVoice && !hasDoc && hasImage);
      chatComposer.classList.toggle("is-translate", !hasVoice && !hasDoc && !hasImage && hasTranslate);

      if (imageOptions) imageOptions.hidden = !hasImage;
      if (translatePanel) translatePanel.hidden = !hasTranslate;
    }
    renderImageOptions();
    renderTranslatePanel();

    const containers = [
      document.getElementById("chatSkills"),
      document.getElementById("chatSkillsVoice")
    ].filter(Boolean);

    const skills = (activeChat && activeChat.skills) || [];

    containers.forEach(function (container) {
      container.innerHTML = "";
      if (skills.length === 0) {
        container.hidden = container.id === "chatSkills";
        return;
      }
      container.hidden = false;

      skills.forEach(function (tag) {
        const chip = document.createElement("span");
        chip.className = "chat-skill-tag";
        const label = document.createElement("span");
        label.textContent = tag;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-skill-tag__remove";
        btn.setAttribute("aria-label", "Remove " + tag);
        btn.textContent = "×";
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          removeSkill(tag);
        });
        chip.appendChild(label);
        chip.appendChild(btn);
        container.appendChild(chip);
      });
    });
  }

  function addSkill(tag) {
    if (!tag) return;
    if (!activeChat) createChat(null);
    if (!Array.isArray(activeChat.skills)) activeChat.skills = [];

    /* Уже выбран именно этот навык — ничего не меняем */
    if (activeChat.skills.length === 1 && activeChat.skills[0] === tag) return;

    const wasSpecial =
      activeChat.skills.indexOf("#Voice") !== -1 ||
      activeChat.skills.indexOf("#Document") !== -1;

    /* Только один навык за раз — заменяем массив целиком */
    activeChat.skills = [tag];

    const isNowSpecial = tag === "#Voice" || tag === "#Document";

    /* Вход в спец-режим — очищаем скрытую textarea */
    if (isNowSpecial && !wasSpecial && chatInput) {
      chatInput.value = "";
      chatInput.style.height = "auto";
    }

    syncActiveSkill();

    /* Обновляем плашку в пустом чате (пока нет сообщений) */
    if (!activeChat.messages || activeChat.messages.length === 0) {
      setEmptyState(activeChat.skill);
    }

    activeChat.updatedAt = Date.now();
    commitActiveChat();
    renderSkills();
    haptic(6);
  }

  function removeSkill(tag) {
    if (!activeChat || !Array.isArray(activeChat.skills)) return;
    activeChat.skills = activeChat.skills.filter(function (s) { return s !== tag; });

    syncActiveSkill();

    /* Пустой чат — обновляем плашку в центре */
    if (!activeChat.messages || activeChat.messages.length === 0) {
      setEmptyState(activeChat.skill);
    }

    commitActiveChat();
    renderSkills();
    haptic(4);
  }

  function syncActiveSkill() {
    if (!activeChat) return;
    const skills = activeChat.skills || [];
    if (skills.length === 0) {
      activeChat.skill = null;
      return;
    }
    const firstTag = skills[0];
    const match = Object.values(SKILL_MAP).find(function (s) { return s.tag === firstTag; });
    activeChat.skill = match || null;
  }

  /* ============ FILE ATTACHMENTS ============ */
  const fileCamera = document.getElementById("fileCamera");
  const fileScan   = document.getElementById("fileScan");
  const fileAlbum  = document.getElementById("fileAlbum");
  const fileDoc    = document.getElementById("fileDoc");

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";

    const slotsLeft = MAX_PENDING - pendingAttachments.length;
    if (slotsLeft <= 0) {
      showToast("Max " + MAX_PENDING + " files");
      return;
    }

    const toAdd = files.slice(0, slotsLeft);
    if (files.length > slotsLeft) showToast("Only " + slotsLeft + " more allowed");

    toAdd.forEach(function (file) {
      if (file.size > 1024 * 1024) {
        showToast(file.name + " too large (max 1 MB)");
        return;
      }

      const isImage = file.type && file.type.indexOf("image/") === 0;
      const isVideo = file.type && file.type.indexOf("video/") === 0;

      if (isImage || isVideo) {
        const reader = new FileReader();
        reader.onload = function () {
          pendingAttachments.push({
            type: isVideo ? "video" : "image",
            name: file.name,
            size: file.size,
            dataUrl: reader.result
          });
          renderPending();
        };
        reader.readAsDataURL(file);
      } else {
        pendingAttachments.push({
          type: "file",
          name: file.name,
          size: file.size
        });
        renderPending();
      }
    });

    haptic(6);
  }

  if (fileCamera) fileCamera.addEventListener("change", handleFileChange);
  if (fileAlbum)  fileAlbum.addEventListener("change", handleFileChange);
  if (fileDoc)    fileDoc.addEventListener("change", handleFileChange);
  if (fileScan)   fileScan.addEventListener("change", handleFileChange);

  /* ============ SCAN DOCUMENT BUTTON ============ */
  const scanDocBtn = document.getElementById("scanDocBtn");
  if (scanDocBtn && fileScan) {
    scanDocBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      fileScan.click();
    });
  }

  /* ============ PENDING ATTACHMENTS: render ============ */
  function renderPending() {
    if (!chatPending) return;
    chatPending.innerHTML = "";

    if (pendingAttachments.length === 0) {
      chatPending.hidden = true;
      if (chatComposer) chatComposer.classList.remove("has-pending");
      return;
    }

    chatPending.hidden = false;
    if (chatComposer) chatComposer.classList.add("has-pending");

    pendingAttachments.forEach(function (att, idx) {
      const item = document.createElement("div");
      item.className = "pending-item" + (att.type === "file" ? " pending-item--file" : "");

      if (att.type === "image" && att.dataUrl) {
        const img = document.createElement("img");
        img.src = att.dataUrl;
        img.alt = att.name || "";
        item.appendChild(img);
      } else if (att.type === "video" && att.dataUrl) {
        const video = document.createElement("video");
        video.src = att.dataUrl;
        video.muted = true;
        item.appendChild(video);
      } else {
        item.textContent = att.name || "File";
      }

      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "pending-item__remove";
      rm.setAttribute("aria-label", "Remove " + (att.name || "file"));
      rm.textContent = "×";
      rm.addEventListener("click", function (e) {
        e.stopPropagation();
        pendingAttachments.splice(idx, 1);
        renderPending();
        haptic(4);
      });
      item.appendChild(rm);

      chatPending.appendChild(item);
    });
  }

    /* ============ IMAGE OPTIONS (styles / aspects) ============ */
  const imageOptions = document.getElementById("imageOptions");
  const imageStyles  = document.getElementById("imageStyles");
  const imageAspects = document.getElementById("imageAspects");

    const translatePanel      = document.getElementById("translatePanel");
  const translateFromBtn    = document.getElementById("translateFromBtn");
  const translateToBtn      = document.getElementById("translateToBtn");
  const translateFromValue  = document.getElementById("translateFromValue");
  const translateToValue    = document.getElementById("translateToValue");
  const translateSwapBtn    = document.getElementById("translateSwapBtn");
  const translateBtn        = document.getElementById("translateBtn");

  function renderImageOptions() {
    if (!imageStyles || !imageAspects) return;
    const style  = (activeChat && activeChat.imageStyle)  || "photo";
    const aspect = (activeChat && activeChat.imageAspect) || "1:1";

    imageStyles.querySelectorAll(".image-chip").forEach(function (chip) {
      chip.classList.toggle("is-active", chip.dataset.style === style);
    });
    imageAspects.querySelectorAll(".image-chip").forEach(function (chip) {
      chip.classList.toggle("is-active", chip.dataset.aspect === aspect);
    });
  }

  if (imageStyles) {
    imageStyles.addEventListener("click", function (e) {
      const chip = e.target.closest(".image-chip");
      if (!chip || !activeChat) return;
      activeChat.imageStyle = chip.dataset.style;
      activeChat.updatedAt = Date.now();
      commitActiveChat();
      renderImageOptions();
      haptic(4);
    });
  }

  if (imageAspects) {
    imageAspects.addEventListener("click", function (e) {
      const chip = e.target.closest(".image-chip");
      if (!chip || !activeChat) return;
      activeChat.imageAspect = chip.dataset.aspect;
      activeChat.updatedAt = Date.now();
      commitActiveChat();
      renderImageOptions();
      haptic(4);
    });
  }

  /* ============ IMAGE GENERATE ============ */
  const imageGenerateBtn = document.getElementById("imageGenerateBtn");

  if (imageGenerateBtn) {
    imageGenerateBtn.addEventListener("click", function () {
      const prompt = chatInput ? chatInput.value.trim() : "";
      if (!prompt) {
        showToast("Describe your image first");
        return;
      }
      if (!activeChat) createChat(null);

      const msg = {
        role: "user",
        type: "image-gen",
        prompt: prompt,
        style: activeChat.imageStyle || "photo",
        aspect: activeChat.imageAspect || "1:1",
        status: "loading",
        at: Date.now(),
        skills: (activeChat.skills || []).slice(),
        attachments: pendingAttachments.slice()
      };
      activeChat.messages.push(msg);

      /* Очищаем pending: прикреплённые файлы ушли в сообщение */
      pendingAttachments = [];
      renderPending();

      if (!activeChat.title) activeChat.title = prompt.slice(0, 40);
      activeChat.updatedAt = Date.now();
      commitActiveChat();

      if (chatInput) {
        chatInput.value = "";
        chatInput.style.height = "auto";
      }
      chatEmpty.classList.add("is-hidden");
      renderActiveMessages();
      renderHistory();
      haptic(8);

      /* Через 2.5 сек — «готово» */
      setTimeout(function () {
        msg.status = "ready";
        if (activeChat) activeChat.updatedAt = Date.now();
        commitActiveChat();
        if (activeChat && chatScreen.classList.contains("is-open")) {
          renderActiveMessages();
        }
        haptic(6);
      }, IMAGE_GEN_DURATION);
    });
  }

    /* ============ IMAGE GEN PROGRESS ============ */
  function animateImageProgress(el, startedAt, duration) {
    if (!el) return;
    const start = startedAt || Date.now();

    function tick() {
      if (!el.isConnected) return;            /* DOM пересоздан — стоп */
      const now = Date.now();
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);   /* ease-out cubic */
      el.textContent = Math.round(eased * 100) + "%";
      if (now < start + duration) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = "100%";
      }
    }
    tick();
  }

    /* ============ TRANSLATE ============ */
  const langPicker = document.createElement("div");
  langPicker.className = "chat-popup chat-popup--langs";
  langPicker.id = "langPicker";
  langPicker.innerHTML = '<div class="lang-list" id="langList"></div>';

  if (chatComposer) chatComposer.appendChild(langPicker);

  const langList = document.getElementById("langList");
  let langTarget = "from";

  function renderTranslatePanel() {
    if (!translatePanel) return;
    const from = (activeChat && activeChat.fromLang) || "auto";
    const to   = (activeChat && activeChat.toLang)   || "en";
    if (translateFromValue) translateFromValue.textContent = langName(from);
    if (translateToValue)   translateToValue.textContent   = langName(to);
  }

  function openLangPicker(target) {
    langTarget = target;
    if (!langList) return;
    langList.innerHTML = "";

    const current = target === "from"
      ? ((activeChat && activeChat.fromLang) || "auto")
      : ((activeChat && activeChat.toLang)   || "en");

    LANGS.forEach(function (l) {
      if (target === "to" && l.code === "auto") return;
      const item = document.createElement("button");
      item.type = "button";
      item.className = "lang-item" + (l.code === current ? " is-active" : "");
      item.textContent = l.name;
      item.addEventListener("click", function () {
        if (activeChat) {
          if (target === "from") activeChat.fromLang = l.code;
          else activeChat.toLang = l.code;
          activeChat.updatedAt = Date.now();
          commitActiveChat();
        }
        renderTranslatePanel();
        closeAllPopups();
        haptic(4);
      });
      langList.appendChild(item);
    });

    openPopup("langPicker");
  }

  if (translateFromBtn) {
    translateFromBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openLangPicker("from");
    });
  }
  if (translateToBtn) {
    translateToBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openLangPicker("to");
    });
  }

  if (translateSwapBtn) {
    translateSwapBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!activeChat) return;
      const from = activeChat.fromLang || "auto";
      const to   = activeChat.toLang   || "en";
      activeChat.fromLang = to === "auto" ? "en" : to;
      activeChat.toLang   = from === "auto" ? "en" : from;
      activeChat.updatedAt = Date.now();
      commitActiveChat();
      renderTranslatePanel();
      haptic(6);
    });
  }

  /* Добавляем langPicker в список попапов */
  POPUP_IDS.push("langPicker");

  /* Клик вне — не закрывать popup языков при клике на кнопки выбора */
  document.addEventListener("click", function (e) {
    if (e.target.closest("#translateFromBtn")) return;
    if (e.target.closest("#translateToBtn")) return;
  });

  if (translateBtn) {
    translateBtn.addEventListener("click", function () {
      const text = chatInput ? chatInput.value.trim() : "";
      if (!text) {
        showToast("Enter text to translate");
        return;
      }
      if (!activeChat) createChat(null);

      const from = activeChat.fromLang || "auto";
      const to   = activeChat.toLang   || "en";

      /* Правое — сообщение пользователя с исходным текстом */
      const userMsg = {
        role: "user",
        text: text,
        at: Date.now(),
        skills: (activeChat.skills || []).slice(),
        attachments: pendingAttachments.slice()
      };
      activeChat.messages.push(userMsg);

      /* Левое — «перевод» */
      const transMsg = {
        role: "assistant",
        type: "translation",
        original: text,
        result: text,           /* заглушка: возвращаем тот же текст */
        from: from,
        to: to,
        at: Date.now()
      };
      activeChat.messages.push(transMsg);

      if (!activeChat.title) activeChat.title = text.slice(0, 40);
      activeChat.updatedAt = Date.now();
      commitActiveChat();

      chatInput.value = "";
      chatInput.style.height = "auto";
      pendingAttachments = [];
      renderPending();
      chatEmpty.classList.add("is-hidden");
      renderActiveMessages();
      renderHistory();
      haptic(8);
    });
  }

  /* Enter в translate — запускает Translate */
  if (chatInput) {
    /* (обработчик Enter уже перехватывает translate ниже через класс) */
  }

    /* ============ # BUTTON (regular chat) ============ */
  if (chatHashBtn) {
    chatHashBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePopup("skillPicker");
      openSkillPicker("");
    });
  }
})();