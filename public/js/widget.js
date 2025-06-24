(function () {
  function getTenantId() {
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes("widget.js")) {
        return scripts[i].getAttribute("data-tenant-id");
      }
    }
    return null;
  }

  function createWidgetUI(shadowRoot, config) {
    const style = document.createElement("style");
    style.textContent = `
      .widget-container {
        font-family: Arial, sans-serif;
        border: 2px solid ${config.color || "#000"};
        padding: 10px;
        width: 300px;
        background: white;
        position: fixed;
        bottom: 80px;
        right: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        border-radius: 8px;
        z-index: 9999;
      }
      .header { display: flex; align-items: center; margin-bottom: 10px; }
      .header img { margin-right: 10px; border-radius: 50%; }
      .agent-status { font-size: 0.9em; margin-bottom: 10px; }
      .messages { border: 1px solid #ddd; height: 200px; overflow-y: auto; padding: 5px; margin-bottom: 10px; }
      .input-container { display: flex; gap: 5px; margin-top: 10px; }
      .floating-bubble {
        position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%;
        background-color: ${config.color || "#007bff"}; box-shadow: 0 0 10px rgba(0,0,0,0.3);
        display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; font-size: 24px; cursor: pointer; z-index: 9999;
      }
      .input-container input {
        flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 20px; outline: none; font-size: 14px;
      }
      .input-container button {
        background-color: ${config.color || "#007bff"}; border: none; border-radius: 50%;
        color: white; width: 40px; height: 40px; font-size: 20px; cursor: pointer;
      }
    `;
    shadowRoot.appendChild(style);

    const floatingBubble = document.createElement("div");
    floatingBubble.className = "floating-bubble";
    floatingBubble.innerHTML = "&#128172;";
    shadowRoot.appendChild(floatingBubble);

    const container = document.createElement("div");
    container.className = "widget-container";
    container.style.display = "none";
    container.innerHTML = `
      <div class="header">
        ${config.logoUrl ? `<img src="${config.logoUrl}" width="50" height="50" />` : ""}
        <h3 style="margin:0; color:${config.color || "#000"}">${config.widgetTitle}</h3>
      </div>
      <div>${config.welcomeText}</div>
      <div id="agentStatus" class="agent-status">Agents Online: Loading...</div>
      <div id="messages" class="messages"></div>
      <div class="input-container">
        <input id="chat_input" type="text" placeholder="Type a message..." />
        <button id="send_btn">&#10148;</button>
      </div>
    `;
    shadowRoot.appendChild(container);

    floatingBubble.onclick = () => {
      floatingBubble.style.display = "none";
      container.style.display = "block";
    };

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "X";
    Object.assign(closeBtn.style, { position: "absolute", top: "5px", right: "5px", border: "none", background: "transparent", fontSize: "16px", cursor: "pointer" });
    closeBtn.onclick = () => { container.style.display = "none"; floatingBubble.style.display = "flex"; };
    container.appendChild(closeBtn);

    return {
      messagesDiv: shadowRoot.getElementById("messages"),
      agentStatusEl: shadowRoot.getElementById("agentStatus"),
      chatInput: shadowRoot.getElementById("chat_input"),
      sendBtn: shadowRoot.getElementById("send_btn")
    };
  }

  function appendMessage(messagesDiv, type, senderName, message) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.marginBottom = "5px";
    wrapper.style.justifyContent = type === "client" ? "flex-end" : "flex-start";

    const bubble = document.createElement("div");
    bubble.style.padding = "8px 12px";
    bubble.style.borderRadius = "15px";
    bubble.style.maxWidth = "75%";
    bubble.style.wordWrap = "break-word";
    bubble.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";

    if (type === "client") {
      bubble.style.backgroundColor = "#007bff";
      bubble.style.color = "#fff";
      bubble.textContent = message;
    } else {
      bubble.style.backgroundColor = "#f1f1f1";
      bubble.style.color = "#000";
      bubble.textContent = `${senderName}: ${message}`;
    }

    wrapper.appendChild(bubble);
    messagesDiv.appendChild(wrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  window.addEventListener("load", () => {
    const tenantId = getTenantId();
    if (!tenantId) {
      console.error("Tenant ID not found");
      return;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const shadowRoot = container.attachShadow({ mode: "open" });

    fetch(`http://localhost:3000/widget-config/${tenantId}`)
      .then(res => res.json())
      .then(config => {
        const ui = createWidgetUI(shadowRoot, config);

        // Load chat history
        fetch(`http://localhost:3000/chat-history/${tenantId}`)
          .then(res => res.json())
          .then(history => {
            history.forEach(entry => {
              if (entry.sender === "client") {
                appendMessage(ui.messagesDiv, "client", "", entry.content);
              } else if (entry.sender === "agent") {
                appendMessage(ui.messagesDiv, "agent", entry.agentUsername, entry.content);
              }
            });
          });

        // Load socket.io dynamically
        const socketScript = document.createElement("script");
        socketScript.src = "http://localhost:3000/socket.io/socket.io.js";
        socketScript.onload = () => {
          const socket = io("http://localhost:3000");
          socket.emit("join", tenantId);

          ui.sendBtn.onclick = () => {
            const content = ui.chatInput.value.trim();
            if (!content) return;
            socket.emit("send_message", { tenantId, content });
            appendMessage(ui.messagesDiv, "client", "", content);
            ui.chatInput.value = "";
          };

          ui.chatInput.addEventListener("keyup", (event) => {
            if (event.key === "Enter") ui.sendBtn.click();
          });

          socket.on("agent_reply", (data) => {
            if (data.tenantId === tenantId) {
              appendMessage(ui.messagesDiv, "agent", data.agentUsername, data.content);
            }
          });

          socket.on("online_agents_count", (data) => {
            ui.agentStatusEl.innerText = `Agents Online: ${data.onlineAgents}`;
          });
        };
        shadowRoot.appendChild(socketScript);

        // Initial agent count (before WebSocket is ready)
        function updateAgentStatus() {
          fetch(`http://localhost:3000/online-agents/${tenantId}`)
            .then(res => res.json())
            .then(data => {
              ui.agentStatusEl.innerText = `Agents Online: ${data.onlineAgents}`;
            });
        }
        updateAgentStatus();
        setInterval(updateAgentStatus, 60000);
      });
  });
})();
