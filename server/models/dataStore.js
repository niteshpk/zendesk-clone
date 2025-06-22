// /server/models/dataStore.js

const tenants = {
  tenant_1: {
    businessName: "Example Corp",
    email: "cb@email.com",
    password: "cv",
    passwordHash:"$2b$10$uwYlkyH6jasKlxJu.loZCOvSaL7SfItEKHpli8YBh.Vs7d2Yo.5.e",
    tenantId: "tenant_1",
  },
  tenant_2: {
    businessName: "CWN",
    email: "cwn@email.com",
    password: "cwn",
    passwordHash: "$2b$10$TDJlgDJo2pxuF2e2BN.55ePi.rnMz8YxelCNQm.CMiSCTLDid5C4.",
    tenantId: "tenant_2",
  },
};

const widgets = {
  tenant_1: {
    tenantId: "tenant_1",
    color: "#4CAF50",
    widgetTitle: "Example Corp Support",
    welcomeText: "Welcome to Example Corp support!",
    logoUrl: "https://picsum.photos/id/1/75/75",
  },
  tenant_2: {
    tenantId: "tenant_2",
    color: "#2196F3",
    widgetTitle: "CWN Support",
    welcomeText: "Welcome to CWN support!",
    logoUrl: "https://picsum.photos/id/1/50/50",
  },
};

const agents = {
  tenant_1: [
    {
      agentId: "agent_1",
      username: "n1",
      plainPassword: "n1",
      passwordHash:
        "$2b$10$Bp4tywHd65ZmoBr7gGyjYuEn1x2mDjEfdntFuLW0WaMLdL0qpo3A6",
    },
    {
      agentId: "agent_2",
      username: "n2",
      plainPassword: "n2",
      passwordHash:
        "$2b$10$3bVQPdL/tRf72z8c8xN7qO93Mzgnru9aZBPNPrOHCcJ57DAEsWdce",
    },
  ],
  tenant_2: [
    {
      agentId: "agent_3",
      username: "c1",
      plainPassword: "c2",
      passwordHash:
        "$2b$10$HbA1u3E/QzJBKajjFOu8Z.GthOBRZIXqnv5seim/E/XUre0Pickbe",
    },
    {
      agentId: "agent_4",
      username: "c2",
      plainPassword: "c2",
      passwordHash:
        "$2b$10$HbA1u3E/QzJBKajjFOu8Z.GthOBRZIXqnv5seim/E/XUre0Pickbe",
    },
  ],
};

const chats = {};
const onlineAgents = {}; // tenantId -> number of online agents
const offlineMessages = {}; // tenantId -> array of client messages


module.exports = {
  tenants,
  widgets,
  agents,
  chats,
  onlineAgents,
  offlineMessages,
};