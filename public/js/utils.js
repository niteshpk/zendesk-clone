// /public/js/utils.js
// Read cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Delete cookie
function deleteCookie(name) {
  document.cookie = name + "=; Max-Age=0; path=/";
}

function appendMessage(messagesDiv, type, senderName, message) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.marginBottom = "5px";
  wrapper.style.justifyContent = type === "client" ? "flex-start" : "flex-end";

  const bubble = document.createElement("div");
  bubble.style.padding = "8px 12px";
  bubble.style.borderRadius = "15px";
  bubble.style.maxWidth = "75%";
  bubble.style.wordWrap = "break-word";
  bubble.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";
  bubble.style.fontSize = "14px";

  if (type === "client") {
    bubble.style.backgroundColor = "#f1f1f1";
    bubble.style.color = "#000";
    bubble.textContent = message;
  } else {
    bubble.style.backgroundColor = "#007bff";
    bubble.style.color = "#fff";
    bubble.textContent = `${senderName}: ${message}`;
  }

  wrapper.appendChild(bubble);
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Export globally
window.utils = {
  getCookie,
  deleteCookie,
  appendMessage,
};
