import { useState, useEffect } from "react";
import { Octokit } from "@octokit/core";

function App() {
  const [token, setToken] = useState(localStorage.getItem("github_token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

      console.log("Full Response:", response); // Log full response
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
  

  const octokit = new Octokit({ auth: token });

  const workflowDispatch = async () => {
    try {
      const response = await octokit.request(
        "POST /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/dispatches",
        {
          ref: "main",
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }
      );
      console.log(response);
    } catch (error) {
      console.error("Error dispatching workflow:", error);
    }
  };

  const getWorkflowRun = async () => {
    try {
      const response = await octokit.request(
        "GET /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/runs",
        {
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }
      );
      console.log(response);
    } catch (error) {
      console.error("Error getting workflow run:", error);
    }
  };

  return (
    <div className="bg-yellow-400 p-4">
      {!token || !isAuthenticated ? (
        <button onClick={redirectToGitHub}>Login with GitHub</button>
      ) : (
        <>
          <button onClick={workflowDispatch}>DISPATCH!!!</button>
          <button onClick={getWorkflowRun}>Get Workflow</button>
        </>
      )}
    </div>
  );
}

export default App;
