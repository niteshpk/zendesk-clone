// /public/js/utils.js
// Read cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Delete cookie
function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=0; path=/';
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

// Export globally
window.utils = {
  getCookie,
  deleteCookie,
  appendMessage,
};