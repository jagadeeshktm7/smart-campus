// config/firebase.js — Firebase DISABLED for local testing
const admin = {
  database: () => ({
    ref: () => ({
      set: async () => {},
      update: async () => {},
      push: async () => {},
    }),
  }),
  messaging: () => ({
    send: async () => {},
  }),
};

console.log("⚠️  Firebase running in OFFLINE mode (local testing)");
module.exports = admin;