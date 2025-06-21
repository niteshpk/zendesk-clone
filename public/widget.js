(function () {
  function updateAgentStatus(tenantId) {
    fetch(`http://localhost:3000/online-agents/${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        document.getElementById(
          "agentStatus"
        ).innerHTML = `<p><strong>Agents Online:</strong> ${data.onlineAgents}</p>`;
      });
  }

  window.addEventListener("load", () => {
    const scripts = document.getElementsByTagName("script");
    let tenantId = null;

    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes("widget.js")) {
        tenantId = scripts[i].getAttribute("data-tenant-id");
        break;
      }
    }

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
         <div style="display: flex; align-items: center;">
            ${
              config.logoUrl
                ? `<img src="${config.logoUrl}" width="50" height="50" style="margin-right:10px; border-radius: 25px;"/>`
                : ""
            }
            <h3 style="color:${config.color}; margin:0;">${
          config.widgetTitle
        }</h3>
          </div>
          <p>${config.welcomeText}</p>
          <div id="messages"></div> 
          <input id="chat_input" placeholder="Type message..." />
          <button id="send_btn">Send</button>
        `;
        document.body.appendChild(chatDiv);

        updateAgentStatus(tenantId);
        setInterval(() => {
          updateAgentStatus(tenantId);
        }, 60000); // every 1 minutes

        const statusDiv = document.createElement("div");
        statusDiv.id = "agentStatus";
        statusDiv.innerHTML = `<p><strong>Agents Online:</strong> Loading...</p>`;
        chatDiv.insertBefore(statusDiv, chatDiv.firstChild);
      })
      .catch((err) => {
        console.error("Widget config fetch failed", err);
      });

    // Load chat history first
    fetch(`http://localhost:3000/chat-history/${tenantId}`)
      .then((res) => res.json())
      .then((history) => {
        history.forEach((entry) => {
          const messageBlock = document.createElement("div");
          if (entry.type === "client_message") {
            messageBlock.innerHTML = `<p><strong>Client:</strong> ${entry.message}</p>`;
          } else if (entry.type === "agent_reply") {
            messageBlock.innerHTML = `<p><strong>Agent (${entry.agentUsername}):</strong> ${entry.message}</p>`;
          }
          document.getElementById("messages").appendChild(messageBlock);
        });
      });

    // Load socket.io client dynamically after history
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

      document
        .getElementById("chat_input")
        .addEventListener("keyup", function (event) {
          if (event.key === "Enter") {
            document.getElementById("send_btn").click();
          }
        });

      socket.on("agent_reply", (data) => {
        if (data.tenantId === tenantId) {
          const replyDiv = document.createElement("div");
          replyDiv.innerHTML = `<p><strong>Agent (${data.agentUsername}):</strong> ${data.message}</p>`;
          document.getElementById("messages").appendChild(replyDiv);
        }
      });
    };
    document.body.appendChild(socketScript);
  });
})();
