// /src/models/dataStore.js


const onlineAgents = {}; // tenantId -> number of online agents
const offlineMessages = {}; // tenantId -> array of client messages


module.exports = {
  onlineAgents,
  offlineMessages,
};