// firebase.js — offline mode for local testing
export const auth = null;
export const db   = null;
export const messaging = null;

// Fake Firebase ref that does nothing
export const fakeRef = () => ({
  on:    () => () => {},
  set:   async () => {},
  update:async () => {},
  push:  async () => {},
});

export default null;