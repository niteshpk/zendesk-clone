(function () {
  window.addEventListener('load', () => {
    // Find the script tag which loaded this widget
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

    // Create chat UI
    const chatDiv = document.createElement('div');
    chatDiv.innerHTML = `
      <div id="chat-window" style="border:1px solid black; padding:10px; width:300px;">
        <h3>Chat with us!</h3>
        <div id="messages" style="height:200px; overflow-y:auto; border:1px solid gray; margin-bottom:10px;"></div>
        <input id="chat_input" placeholder="Type message..." style="width:200px;" />
        <button id="send_btn">Send</button>
      </div>`;
    document.body.appendChild(chatDiv);

    // Load socket.io client dynamically
    const socketScript = document.createElement('script');
    socketScript.src = 'http://localhost:3000/socket.io/socket.io.js';
    socketScript.onload = () => {
      const socket = io('http://localhost:3000');
      socket.emit('join', tenantId);

      document.getElementById('chat_input').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
          document.getElementById('send_btn').click();
        }
      });

      // Send message to agent
      document.getElementById('send_btn').onclick = () => {
        const message = document.getElementById('chat_input').value.trim();
        if (!message) return;
        socket.emit('send_message', { tenantId, message });

        // Show client message in chat window
        const msgDiv = document.createElement('div');
        msgDiv.innerHTML = `<p><strong>You:</strong> ${message}</p>`;
        document.getElementById('messages').appendChild(msgDiv);
        document.getElementById('chat_input').value = '';
      };

      // Listen for agent replies
      socket.on('agent_reply', (data) => {
        if (data.tenantId === tenantId) {
          const replyDiv = document.createElement('div');
          replyDiv.innerHTML = `<p><strong>Agent:</strong> ${data.message}</p>`;
          document.getElementById('messages').appendChild(replyDiv);
        }
      });
    };
    document.body.appendChild(socketScript);
  });
})();
