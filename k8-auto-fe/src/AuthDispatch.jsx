import { useEffect, useState } from "react";
import { Octokit } from "@octokit/core";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Link } from "react-router-dom"; // Import Link for navigation

function AuthDispatch() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("github_token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");

  // State for workflow inputs
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [ec2Count, setEc2Count] = useState("3");
  const [instanceType, setInstanceType] = useState("t2.micro");

  const [workflowDispatched, setWorkflowDispatched] = useState(localStorage.getItem("workflow_dispatched") === "true");
  const [failedStep, setFailedStep] = useState(localStorage.getItem("failed_step") || null);

  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !token) {
      console.log("code found: " + code);
      
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
      console.log("data from be res:");
      console.log(data);

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
    if (!awsAccessKey.trim()) {
      toast.error("AWS Access Key is required!");
      return;
    }
    if (!awsSecretAccessKey.trim()) {
      toast.error("AWS Secret Access Key is required!");
      return;
    }

    try {
      await octokit.request(
        "POST /repos/waqas2714/k8-automate/actions/workflows/known-hosts-check.yml/dispatches",
        {
          ref: "ping-alr-made-instances",
          inputs: {
            awsAccessKey,
            awsSecretAccessKey,
            ec2_count: ec2Count,
            instance_type: instanceType,
          },
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }
      );

      toast.success("Workflow dispatched successfully!");
      localStorage.setItem("workflow_dispatched", "true"); // Store dispatch status
      localStorage.removeItem("failed_step"); // Clear any previous failure
      setWorkflowDispatched(true);
      navigate("/status");
    } catch (error) {
      toast.error("There was an error. Please try again.");
      console.error("Error dispatching workflow:", error);
    }
  };

  return (
    <div className="bg-yellow-400 p-6 rounded-lg">
      {workflowDispatched && (
        <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Your request is being handled. <Link to="/status" className="underline">See status</Link>.
        </div>
      )}

      {failedStep && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          The step <strong>{failedStep}</strong> has failed. Please check and retry.
        </div>
      )}

      {!token || !isAuthenticated ? (
        <button onClick={redirectToGitHub} className="bg-green-500 text-white px-4 py-2 rounded">
          Login with GitHub
        </button>
      ) : (
        <div className="flex flex-col space-y-3">
          <input type="text" placeholder="AWS Access Key" value={awsAccessKey} onChange={(e) => setAwsAccessKey(e.target.value)} className="p-2 border rounded" />
          <input type="password" placeholder="AWS Secret Access Key" value={awsSecretAccessKey} onChange={(e) => setAwsSecretAccessKey(e.target.value)} className="p-2 border rounded" />
          <input type="number" placeholder="Number of EC2 Instances" value={ec2Count} onChange={(e) => setEc2Count(e.target.value)} className="p-2 border rounded" />

          <select value={instanceType} onChange={(e) => setInstanceType(e.target.value)} className="p-2 border rounded">
            <option value="t2.micro">t2.micro</option>
            <option value="t2.small">t2.small</option>
            <option value="t2.medium">t2.medium</option>
          </select>

          <button onClick={workflowDispatch} className="bg-blue-500 text-white px-4 py-2 rounded">
            Dispatch Workflow
          </button>
        </div>
      )}
    </div>
  );
}

export default AuthDispatch;
