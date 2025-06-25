"use client";

const CLIENT_ID = "191753538716-8j1qbfgmtjmhbd827n1tb0omtddh7tca.apps.googleusercontent.com";
const SCOPE = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly"
].join(" ");

export default function GoogleLoginButton() {
  const handleLogin = () => {
    const REDIRECT_URI = "http://localhost:3000/google-callback";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token id_token&scope=${encodeURIComponent(SCOPE)}&include_granted_scopes=true&prompt=consent&nonce=${Date.now()}`;
    window.location.href = url;
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold mt-4"
    >
      Sign in with Google
    </button>
  );
} 