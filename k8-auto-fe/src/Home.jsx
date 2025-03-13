import { Octokit } from "@octokit/core";
import { useEffect, useState } from "react";

function Home() {
  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  // State variables
  const [userId, setUserId] = useState("");
  const [steps, setSteps] = useState([]); // Stores found steps
  const [message, setMessage] = useState(""); // Message for no jobs found
  const [loading, setLoading] = useState(false); // Loading state
  const [polling, setPolling] = useState(null); // Store polling interval ID
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

      console.log("token: " + data.access_token);
      
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

      localStorage.setItem('uniqueUserId', response.data.login);
      setUserId(response.data.login);

      console.log("Full Response:", response); // Log full response
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
      const response = await octokit.request(
        "POST /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/dispatches",
        {
          ref: "main",
          inputs: { step1_name: userId },
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }
      );

      console.log("Workflow dispatched:", response);

      // Wait 15 seconds before the first check
      setTimeout(() => {
        getWorkflowRun();
        // Start polling every 30 seconds
        if (!polling) {
          const interval = setInterval(getWorkflowRun, 60000);
          setPolling(interval);
        }
      }, 25000);

      console.log(response);
    } catch (error) {
      console.error("Error dispatching workflow:", error);
    }
  };

  const getWorkflowRun = async () => {
    try {
      setSteps([]); // Clear previous steps
      setMessage(""); // Reset message
      setLoading(true); // Show loader

      const response = await octokit.request(
        "GET /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/runs",
        { headers: { "X-GitHub-Api-Version": "2022-11-28" } }
      );

      const workflowRuns = response.data.workflow_runs;
      if (!workflowRuns || workflowRuns.length === 0) {
        setMessage("No jobs found.");
        return;
      }

      let foundSteps = [];

      for (const run of workflowRuns) {
        const jobsResponse = await octokit.request(
          `GET /repos/waqas2714/k8-automate/actions/runs/${run.id}/jobs`,
          { headers: { "X-GitHub-Api-Version": "2022-11-28" } }
        );

        const jobs = jobsResponse.data.jobs;
        if (jobs.length > 0 && jobs[0].steps.length > 1) {
          const steps = jobs[0].steps;
          const matchingStep = steps.find((step) => step.name === userId);

          if (matchingStep) {
            foundSteps = steps.map((step) => ({
              name: step.name,
              status: step.status,
            }));
            break; // Stop searching after the first match
          }
        }
      }

      if (foundSteps.length > 0) {
        setSteps(foundSteps);
        clearInterval(polling); // Stop polling when a match is found
        setPolling(null);
      } else {
        setMessage("No jobs found.");
      }
    } catch (error) {
      console.error("Error getting workflow run:", error);
      setMessage("Error retrieving workflow runs.");
    } finally {
      setLoading(false); // Hide loader
    }
  };

  return (
    <div className="bg-yellow-400 p-4">
      {!token || !isAuthenticated ? (
        <button onClick={redirectToGitHub}>Login with GitHub</button>
      ) : (
        <div className='p-4'>
<button onClick={workflowDispatch} className="bg-blue-500 text-white px-4 py-2 rounded">
        DISPATCH!!!
      </button>
      <button onClick={getWorkflowRun} className="bg-green-500 text-white px-4 py-2 rounded mx-6">
        Get Workflow Runs
      </button>

      {loading && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 border-solid"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      )}

      {!loading && steps.length > 0 && (
        <div className="mt-4 p-4 border border-gray-300 rounded">
          <h2 className="font-bold text-lg">Matched Workflow Steps:</h2>
          <ul className="list-disc ml-6">
            {steps.map((step, index) => (
              <li key={index}>
                <span className="font-medium">{step.name}</span> -{" "}
                <span className="text-gray-600">{step.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
      )}
    </div>
  );
}

export default Home;
