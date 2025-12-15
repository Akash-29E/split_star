// Session management service using cookies
const SESSION_COOKIE_NAME = 'splitstar_session';
const SESSION_EXPIRY_DAYS = 1; // 24 hours (synced with JWT token expiration)

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
  },

  // Get group memberships from localStorage (supports multiple groups)
  getGroupMemberships() {
    try {
      const memberships = localStorage.getItem('splitstar_groups');
      return memberships ? JSON.parse(memberships) : {};
    } catch (e) {
      return {};
    }
  },

  // Save group membership (stores PIN and member info per group)
  saveGroupMembership(groupId, memberData) {
    const memberships = this.getGroupMemberships();
    memberships[groupId] = {
      ...memberData,
      lastAccessed: new Date().toISOString()
    };
    localStorage.setItem('splitstar_groups', JSON.stringify(memberships));
  },

  // Get membership for a specific group
  getGroupMembership(groupId) {
    const memberships = this.getGroupMemberships();
    return memberships[groupId] || null;
  },

  // Check if user has access to a specific group
  hasGroupAccess(groupId) {
    const membership = this.getGroupMembership(groupId);
    return membership !== null;
  },

  // Clear all group memberships
  clearGroupMemberships() {
    localStorage.removeItem('splitstar_groups');
  }
};

export default sessionService;