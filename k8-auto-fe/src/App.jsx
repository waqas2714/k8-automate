import { Octokit } from "@octokit/core";
import { useEffect, useState } from "react";

function App() {
  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  // State to store the dynamic user ID
  const [userId, setUserId] = useState("");
  const [steps, setSteps] = useState([]); // Store found steps
  const [message, setMessage] = useState(""); // Message for no jobs found

  // Function to generate a unique ID
  const generateUniqueId = () => `user-${Math.random().toString(36).substr(2, 9)}`;

  // On component mount, check if there's a userId in localStorage; if not, create and store it
  useEffect(() => {
    let storedUserId = localStorage.getItem("uniqueUserId");
    if (!storedUserId) {
      storedUserId = generateUniqueId();
      localStorage.setItem("uniqueUserId", storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  const workflowDispatch = async () => {
    await octokit.request(
      "POST /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/dispatches",
      {
        ref: "workflow-by-dynamic-step",
        inputs: { step1_name: userId },
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      }
    );
  };

  const getWorkflowRun = async () => {
    try {
      setSteps([]); // Clear previous steps
      setMessage(""); // Reset message

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
            break; // Stop checking further runs once a match is found
          }
        }
      }

      if (foundSteps.length > 0) {
        setSteps(foundSteps);
      } else {
        setMessage("No jobs found.");
      }
    } catch (error) {
      console.error("Error getting workflow run:", error);
      setMessage("Error retrieving workflow runs.");
    }
  };

  return (
    <div className="p-4">
      <button onClick={workflowDispatch} className="bg-blue-500 text-white px-4 py-2 rounded">
        DISPATCH!!!
      </button>
      <button onClick={getWorkflowRun} className="bg-green-500 text-white px-4 py-2 rounded mx-6">
        Get Workflow Runs
      </button>

      {steps.length > 0 ? (
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
      ) : (
        message && <p className="mt-4 text-red-500">{message}</p>
      )}
    </div>
  );
}

export default App;
