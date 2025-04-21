import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("github_token") || null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !token) {
      setLoading(true);
      exchangeCodeForToken(code);
    } else if (token) {
      navigate("/provision");
    }
  }, []);

  const exchangeCodeForToken = async (code) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}api/auth/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("github_token", data.access_token);
        navigate("/provision");
      }
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      setLoading(false);
    }
  };

  const redirectToGitHub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,workflow`;
  };

  return (
    <div className="p-6 w-screen h-screen flex justify-center items-center bg-[#25292E]">
      {loading ? (
        <div className="loader text-white">Loading...</div>
      ) : (
        <div
          onClick={redirectToGitHub}
          className="group bg-[#2A2F35] hover:bg-[#F7F7F7] text-white rounded cursor-pointer flex flex-col items-center p-4 space-y-1.5"
        >
          <img src="assets/github.png" alt="logo" className="h-24" />
          <h3 className="group-hover:text-[#2A2F35]">Login with GitHub</h3>
        </div>
      )}
    </div>
  );
}

export default Login;
