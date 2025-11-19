// Session management service using cookies
const SESSION_COOKIE_NAME = 'splitstar_session';
const SESSION_EXPIRY_DAYS = 30;

export const sessionService = {
  // Set a cookie
  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${JSON.stringify(value)};expires=${expires.toUTCString()};path=/`;
  },

  // Get a cookie
  getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
      if (cookie.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(cookie.substring(nameEQ.length, cookie.length));
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  },

  // Delete a cookie
  deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  },

  // Save current user session
  saveSession(user) {
    this.setCookie(SESSION_COOKIE_NAME, user, SESSION_EXPIRY_DAYS);
  },

  // Get current user session
  getSession() {
    return this.getCookie(SESSION_COOKIE_NAME);
  },

  // Clear session
  clearSession() {
    this.deleteCookie(SESSION_COOKIE_NAME);
  },

  // Check if user is logged in
  isLoggedIn() {
    return this.getSession() !== null;
  },

  // Update user session
  updateSession(userData) {
    const currentSession = this.getSession();
    if (currentSession) {
      const updatedSession = { ...currentSession, ...userData };
      this.saveSession(updatedSession);
      return updatedSession;
    }
    return null;
  }
};
