import { useEffect, useState } from "react";
import { Octokit } from "@octokit/core";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function AuthDispatch() {
  const navigate = useNavigate();
  const [token, setToken] = useState(
    localStorage.getItem("github_token") || null
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");

  // State for workflow inputs
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [ec2Count, setEc2Count] = useState("3");
  const [instanceType, setInstanceType] = useState("t2.micro");

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
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/authenticate`, {
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
        "POST /repos/waqas2714/k8-automate/actions/workflows/main-wf.yml/dispatches",
        {
          ref: "main",
          inputs: {
            user_name: userId,
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
      navigate("/status");
    } catch (error) {
      toast.error("There was an error. Please try again.");
      console.error("Error dispatching workflow:", error);
    }
  };

  return (
    <div
  className={`p-6 w-screen h-screen flex flex-col justify-center items-center`}
  style={{ backgroundColor: !token || !isAuthenticated ? "#25292E" : "#F7F7F7" }}
>
      {!token || !isAuthenticated ? (
        <div
          onClick={redirectToGitHub}
          className="group bg-[#2A2F35] hover:bg-[#F7F7F7] transition-all ease-in-out duration-150 text-white rounded cursor-pointer flex flex-col items-center space-y-1.5 p-4"
        >
          <div>
            <img
              src="assets/github.png"
              alt="logo"
              className="h-24 transition-all ease-in-out duration-100"
            />
          </div>
          <h3 className="font-semi-bold text-[#F7F7F7] group-hover:text-[#2A2F35] transition-all ease-in-out duration-150">
            Login with GitHub
          </h3>
        </div>
      ) : (
        <>
        <h1 className="text-4xl fixed top-24">K8-Automate</h1>
        <div className="w-[100%] flex flex-wrap justify-center gap-x-4 gap-y-6">
            <input
              type="text"
              placeholder="AWS Access Key"
              value={awsAccessKey}
              onChange={(e) => setAwsAccessKey(e.target.value)}
              className="border rounded w-[80%] sm:w-[45%]"
              style={{padding: 10}}
            />

            <input
              type="password"
              placeholder="AWS Secret Access Key"
              value={awsSecretAccessKey}
              onChange={(e) => setAwsSecretAccessKey(e.target.value)}
              className="border rounded w-[80%] sm:w-[45%]"
              style={{padding: 10}}
            />

            <input
              type="number"
              placeholder="Number of EC2 Instances"
              value={ec2Count}
              onChange={(e) => setEc2Count(e.target.value)}
              className="border rounded w-[80%] sm:w-[45%]"
              style={{padding: 10}}
              max={10}
            />

            <select
              value={instanceType}
              onChange={(e) => setInstanceType(e.target.value)}
              className="border rounded w-[80%] sm:w-[45%]"
              style={{padding: 10}}
            >
              <option value="t2.micro">t2.micro</option>
              <option value="t2.small">t2.small</option>
              <option value="t2.medium">t2.medium</option>
            </select>
          <button
            onClick={workflowDispatch}
            className="mt-6 text-white rounded cursor-pointer bg-[#2A2F35] hover:bg-[#F7F7F7] hover:text-[#2A2F35] hover:border hover:border-[#2A2F35] transition-all duration-150 ease-in-out"
            style={{paddingLeft: 20, paddingRight: 20, paddingTop: 15, paddingBottom: 15}}
          >
            Dispatch Workflow
          </button>
        </div>
        </>
      )}
    </div>
  );
}

export default AuthDispatch;
