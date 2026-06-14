"use client";

export const PW_KEY = "lf_auth";

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PW_KEY) === "ok";
}

export function login(pw, correctPw) {
  if (pw === correctPw) {
    localStorage.setItem(PW_KEY, "ok");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(PW_KEY);
}
