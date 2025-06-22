

# SaaS Support Chat Platform (Prototype)

This is a fully working prototype for a multi-tenant SaaS-style live chat platform similar to Zendesk, Intercom, Freshchat.

✅ Multi-tenant support  
✅ Agents & customers chat in real-time  
✅ Embed widget into any website via simple script  
✅ Dynamic tenant selection  
✅ Shadow DOM based widget isolation  
✅ Basic widget branding

---

## 💻 Project Setup

### 1️⃣ Start Server

Make sure you have Node.js installed.  
Then start your server:

```bash
npm install
node server.js
````

Server will run on:

```
http://localhost:3000/
```

---

## 2️⃣ Tenants

### Available Tenants

#### Tenant 1

| Field         | Value                               |
| ------------- | ----------------------------------- |
| Tenant ID     | tenant\_1                           |
| Business Name | Example Corp                        |
| Email         | [cb@email.com](mailto:cb@email.com) |
| Password      | cv                                  |

#### Tenant 2

| Field         | Value                                 |
| ------------- | ------------------------------------- |
| Tenant ID     | tenant\_2                             |
| Business Name | CWN                                   |
| Email         | [cwn@email.com](mailto:cwn@email.com) |
| Password      | cwn                                   |

---

## 3️⃣ Agents

### Agent Login URL

```
http://localhost:3000/agent-login
```

#### Agents for Tenant 1

| Tenant ID | Username | Password |
| -------- | -------- | -------- |
| tenant_1 | n1       | n1       |
| tenant_1 | n2       | n2       |

#### Agents for Tenant 2

| Tenant ID | Username | Password |
| -------- | -------- | -------- |
| tenant_2 | c1       | c2       |
| tenant_2 | c2       | c2       |

> ⚠ Note: Agent login requires both Tenant ID and agent credentials.

---

## 4️⃣ Tenant Admin Dashboard

### URL

```
http://localhost:3000/tenant-login
```

Use tenant credentials above to login.

* You can create new agents
* Customize widget branding
* View your personal SaaS embed code

---

## 5️⃣ Widget Usage (Customer Website)

You can test widget integration easily.

### Example client page:

* Prepare simple static HTML client page.
* Add following SaaS embed snippet.

```html
<script>
(function(w,d,s,u){
  const params = new URLSearchParams(window.location.search);
  const tid = params.get('t_id') || 'tenant_1'; // Default to tenant_1 if not provided
  if(!tid) { console.error("Missing tenant id (t_id) in URL"); return; }
  const js = d.createElement(s);
  js.src = u;
  js.setAttribute('data-tenant-id', tid);
  js.id = 'chat-widget';
  js.async = true;
  d.body.appendChild(js);
})(window, document, 'script', 'http://localhost:3000/js/widget.js');
</script>
```

Now load this page using:

```
http://127.0.0.1:8080/test1.html?t_id=tenant_1
```

or

```
http://127.0.0.1:8080/test1.html
```

✅ Widget will automatically load for correct tenant.

---

## 6️⃣ Widget Branding

Tenant admins can configure:

* Widget Title
* Welcome Message
* Logo Image
* Widget Color

Changes apply instantly to your live widget integration.

---

## 7️⃣ Features Covered (MVP-1)

* ✅ Multi-tenant SaaS
* ✅ Agent login / authentication
* ✅ Chat history (persistent on refresh)
* ✅ Offline messages queue
* ✅ Shadow DOM widget isolation
* ✅ Dynamic embeddable widget script
* ✅ Agent online status display
* ✅ Widget branding customization
* ✅ Agent multi-login supported
* ✅ SaaS-ready embed snippet generation

---

## 🔧 Tech Stack

* Node.js + Express
* Socket.IO (realtime chat)
* EJS (server-side rendering)
* Shadow DOM (widget isolation)
* Bootstrap (styling)
* bcryptjs (password hashing)

---

## 🛠 Next Features (MVP-2 ideas)

* User authentication for clients (optional)
* Group conversations
* Multi-agent routing logic
* Admin tenant analytics dashboard
* Widget position customization (bottom-right bubble)
* Notifications for offline agents
* Multi-language support
* SaaS billing integration

---

# 🚀 SaaS-Ready Structure

* `/server/` - Full backend
* `/views/` - EJS templates for tenants & agents
* `/public/js/` - Frontend widget.js and utils.js
* `/public/css/` - Custom widget styles

---
````markdown
# SaaS Chat Platform Architecture Diagram
+-----------------------+
| SaaS Client Website   |
| (3rd-party customer)  |
|                       |
| 1️⃣ Embeds Widget via  |
| SaaS Embed Snippet    |
| e.g.                  |
| <script src="...">    |
+-----------------------+
          |
          v
+-------------------------------------------------+
| Browser downloads                               |
|  ➔ widget-loader.js (optional loader)          |
|  ➔ widget.js (actual chat widget logic)        |
+-------------------------------------------------+
          |
          v
+-------------------------------------------------+
| Shadow DOM-based Widget (fully isolated)        |
| ➔ Tenant ID extracted from embed script tag    |
| ➔ Branding loaded (color, title, welcome text) |
| ➔ Online agents status                          |
| ➔ Realtime chat UI for visitors                 |
+-------------------------------------------------+
          |
          v
+-------------------------+
| Socket.IO Client        |
+-------------------------+
          |
          v
+-------------------------+
| SaaS Server (Node.js)   |
| http://localhost:3000   |
+-------------------------+
| Backend Logic:          |
| - Tenant Management     |
| - Agent Management      |
| - Chat History          |
| - Offline Messages      |
| - Widget Config         |
+-------------------------+
          |
          v
+-------------------------+
| Socket.IO Server        |
+-------------------------+
| Websocket communication |
| - Realtime chat         |
| - Room-based per-tenant |
+-------------------------+
          |
          v
+-------------------------+
| Agents Dashboard        |
| (agent.html / agent.ejs)|
+-------------------------+
| ➔ Agents join tenant rooms |
| ➔ Receive & reply to chats  |
| ➔ Persistent chat history   |
+-------------------------+
````
---

# 🔧 Key SaaS Design Patterns Used

* ✅ **Multi-tenancy** via Tenant IDs
* ✅ **Isolated embed** via Shadow DOM
* ✅ **Room-based socket.io communication** (per-tenant chat channels)
* ✅ **Widget dynamic branding** per-tenant
* ✅ **Dynamic SaaS embed snippet**
* ✅ **Offline queue when agents not online**

---

# 🔧 Codebase Modules

| Module                        | Responsibility                  |
| ----------------------------- | ------------------------------- |
| `server/server.js`            | Full backend logic              |
| `/views/`                     | Tenant & agent EJS views        |
| `/public/js/widget.js`        | Widget rendering logic          |
| `/public/js/utils.js`         | Shared frontend utilities       |
| `/public/js/widget-loader.js` | SaaS embed loader (optional)    |
| `/public/css/widget.css`      | Widget scoped styles (isolated) |

---
