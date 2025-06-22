// /public/js/widget.js
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

  function updateAgentStatus(tenantId) {
    fetch(`http://localhost:3000/online-agents/${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("agentStatus").innerHTML = `<p><strong>Agents Online:</strong> ${data.onlineAgents}</p>`;
      });
  }

  function appendMessage(type, senderName, message) {
    const div = document.createElement('div');
    div.classList.add('d-flex', 'mb-2');
    if (type === 'client') {
      div.classList.add('justify-content-start');
      div.innerHTML = `
        <div class="bg-light border rounded p-2">
          <strong>Client:</strong> ${message}
        </div>`;
    } else {
      div.classList.add('justify-content-end');
      div.innerHTML = `
        <div class="bg-primary text-white rounded p-2">
          <strong>Agent (${senderName}):</strong> ${message}
        </div>`;
    }
    document.getElementById("messages").appendChild(div);
    document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
  }


  window.addEventListener("load", () => {
    const tenantId = getTenantId();
    if (!tenantId) {
      console.error("Tenant ID not found in widget script tag");
      return;
    }

    const tenantInfo = document.createElement("p");
    tenantInfo.innerHTML = `<strong>Connected to Tenant ID:</strong> ${tenantId}`;
    document.body.insertBefore(tenantInfo, document.body.firstChild);

    fetch(`http://localhost:3000/widget-config/${tenantId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Widget config not found");
        return res.json();
      })
      .then((config) => {
        const chatDiv = document.createElement("div");
        chatDiv.style.border = `2px solid ${config.color || "#000000"}`;
        chatDiv.style.padding = "10px";
        chatDiv.style.margin = "10px";

        chatDiv.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom:10px;">
            ${config.logoUrl ? `<img src="${config.logoUrl}" width="50" height="50" style="margin-right:10px"/>` : ""}
            <h3 style="color:${config.color}; margin:0;">${config.widgetTitle}</h3>
          </div>
          <p>${config.welcomeText}</p>
          <div id="agentStatus"><p>Agents Online: Loading...</p></div>
          <div id="messages" style="margin-top: 10px;"></div>
          <input id="chat_input" placeholder="Type message..." style="margin-top:10px;width:70%;" />
          <button id="send_btn">Send</button>
        `;
        document.body.appendChild(chatDiv);

        // Load chat history after DOM created
        fetch(`http://localhost:3000/chat-history/${tenantId}`)
          .then(res => res.json())
          .then(history => {
            history.forEach(entry => {
              if (entry.type === "client_message") {
                appendMessage('client', '', entry.message);
              } else if (entry.type === "agent_reply") {
                appendMessage('agent', entry.agentUsername, entry.message);
              }
            });
          });

        // Load socket.io after DOM created
        const socketScript = document.createElement("script");
        socketScript.src = "http://localhost:3000/socket.io/socket.io.js";
        socketScript.onload = () => {
          const socket = io("http://localhost:3000");
          socket.emit("join", tenantId);

          document.getElementById("send_btn").onclick = () => {
            const message = document.getElementById("chat_input").value.trim();
            if (!message) return;
            socket.emit("send_message", { tenantId, message });

            const msgDiv = document.createElement("div");
            msgDiv.innerHTML = `<p><strong>You:</strong> ${message}</p>`;
            document.getElementById("messages").appendChild(msgDiv);
            document.getElementById("chat_input").value = "";
          };

          document.getElementById("chat_input").addEventListener("keyup", function (event) {
            if (event.key === "Enter") {
              document.getElementById("send_btn").click();
            }
          });

          socket.on("agent_reply", (data) => {
            if (data.tenantId === tenantId) {
              appendMessage('agent', data.agentUsername, data.message);
            }
          });
        };
        document.body.appendChild(socketScript);

        // Start agent status updater after DOM is fully ready
        updateAgentStatus(tenantId);
        setInterval(() => updateAgentStatus(tenantId), 60000);
      })
      .catch((err) => {
        console.error("Widget config fetch failed", err);
      });
  });
})();
