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

// Export globally
window.utils = {
  getCookie,
  deleteCookie,
};