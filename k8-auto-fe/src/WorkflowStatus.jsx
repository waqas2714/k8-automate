import { useEffect, useState } from "react";
import { Octokit } from "@octokit/core";

function WorkflowStatus() {
  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  const userId = localStorage.getItem("uniqueUserId");

  const [steps, setSteps] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(null);

  useEffect(() => {

    setLoading(true);
    // Initial delay of 25 seconds before first check
    const timeout = setTimeout(() => {
      getWorkflowRun();
      const interval = setInterval(getWorkflowRun, 60000); // Poll every 60s
      setPolling(interval);
    }, 25000);

    return () => {
      clearTimeout(timeout);
      clearInterval(polling);
    };
  }, []);

  const getWorkflowRun = async () => {
    try {
      setSteps([]);
      setMessage("");

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
          foundSteps = steps
            .filter((_, index) => index > 1)
            .map((step) => ({
              name: step.name,
              status: step.status,
            }));
          break;
        }
      }

      if (foundSteps.length > 0) {
        setSteps(foundSteps);
        clearInterval(polling);
        setPolling(null);
        setLoading(false);
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
  );
}

export default WorkflowStatus;
