import { useEffect, useState } from "react";
import { Octokit } from "@octokit/core";
import { useNavigate } from "react-router-dom";

function AuthDispatch() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("github_token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");

  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !token) {
      exchangeCodeForToken(code);
    } else if (token) {
      verifyToken(token);
    }
  }, []);

  const exchangeCodeForToken = async (code) => {
    try {
      const response = await fetch("http://localhost:3001/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (data.access_token) {
        setToken(data.access_token);
        localStorage.setItem("github_token", data.access_token);
        verifyToken(data.access_token);
      }
    } catch (error) {
      console.error("Error exchanging code for token:", error);
    }
  };

  const verifyToken = async (token) => {
    try {
      const octokit = new Octokit({ auth: token });
      const response = await octokit.request("GET /user");

      localStorage.setItem("uniqueUserId", response.data.login);
      setUserId(response.data.login);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Invalid Token:", error);
      setIsAuthenticated(false);
      setToken(null);
      localStorage.removeItem("github_token");
    }
  };

  const redirectToGitHub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,workflow`;
  };

  const workflowDispatch = async () => {
    try {
      await octokit.request(
        "POST /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/dispatches",
        {
          ref: "main",
          inputs: { step1_name: userId },
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }
      );

      console.log("Workflow dispatched!");
      navigate("/status");
    } catch (error) {
      console.error("Error dispatching workflow:", error);
    }
  };

  return (
    <div className="bg-yellow-400 p-4">
      {!token || !isAuthenticated ? (
        <button onClick={redirectToGitHub}>Login with GitHub</button>
      ) : (
        <button onClick={workflowDispatch} className="bg-blue-500 text-white px-4 py-2 rounded">
          DISPATCH!!!
        </button>
      )}
    </div>
  );
}

export default AuthDispatch;
