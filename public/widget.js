(function () {
  window.addEventListener('load', () => {
    const scripts = document.getElementsByTagName('script');
    let tenantId = null;

    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes('widget.js')) {
        tenantId = scripts[i].getAttribute('data-tenant-id');
        break;
      }
    }

    if (!tenantId) {
      console.error("Tenant ID not found in widget script tag");
      return;
    }


    const tenantInfo = document.createElement('p');
    tenantInfo.innerHTML = `<strong>Connected to Tenant ID:</strong> ${tenantId}`;
    document.body.insertBefore(tenantInfo, document.body.firstChild);

    const chatDiv = document.createElement('div');
    chatDiv.innerHTML = `
      <div id="chat-window" style="border:1px solid black; padding:10px; width:auto;">
        <h3>Chat with us!</h3>
        <div id="messages" style="border:1px solid black; height:300px; overflow-y:auto; padding:10px;"></div>
        <input id="chat_input" placeholder="Type message..." style="width:200px;" />
        <button id="send_btn">Send</button>
      </div>`;
    document.body.appendChild(chatDiv);

    // Load chat history first
    fetch(`http://localhost:3000/chat-history/${tenantId}`)
      .then(res => res.json())
      .then(history => {
        const messagesDiv = document.getElementById('messages');
        history.forEach(entry => {
          const messageBlock = document.createElement('div');
          if (entry.type === 'client_message') {
            messageBlock.innerHTML = `<p><strong>Client:</strong> ${entry.message}</p>`;
          } else if (entry.type === 'agent_reply') {
            messageBlock.innerHTML = `<p><strong>Agent (${entry.agentUsername}):</strong> ${entry.message}</p>`;
          }
          document.getElementById('messages').appendChild(messageBlock);
        });
      });

    // Load socket.io client dynamically after history
    const socketScript = document.createElement('script');
    socketScript.src = 'http://localhost:3000/socket.io/socket.io.js';
    socketScript.onload = () => {
      const socket = io('http://localhost:3000');
      socket.emit('join', tenantId);

      document.getElementById('send_btn').onclick = () => {
        const message = document.getElementById('chat_input').value.trim();
        if (!message) return;
        socket.emit('send_message', { tenantId, message });

        const msgDiv = document.createElement('div');
        msgDiv.innerHTML = `<p><strong>You:</strong> ${message}</p>`;
        document.getElementById('messages').appendChild(msgDiv);
        document.getElementById('chat_input').value = '';
      };

      document.getElementById('chat_input').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
          document.getElementById('send_btn').click();
        }
      });

      socket.on('agent_reply', (data) => {
        if (data.tenantId === tenantId) {
          const replyDiv = document.createElement('div');
          replyDiv.innerHTML = `<p><strong>Agent (${data.agentUsername}):</strong> ${data.message}</p>`;
          document.getElementById('messages').appendChild(replyDiv);
        }
      });
    };
    document.body.appendChild(socketScript);


  });
})();
