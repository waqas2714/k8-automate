import { useEffect, useState, useRef } from "react";
import { Octokit } from "@octokit/core";

function WorkflowStatus() {
  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });
  const userId = localStorage.getItem("uniqueUserId");

  const [steps, setSteps] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null); // Track interval

  useEffect(() => {
    setLoading(true);

    // Start polling after an initial delay of 25 seconds
    const timeout = setTimeout(() => {
      getWorkflowRun();
      pollingRef.current = setInterval(getWorkflowRun, 60000); // Poll every 60s
    }, 25000);

    // Cleanup function to clear interval and timeout
    return () => {
      clearTimeout(timeout);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const getWorkflowRun = async () => {
    try {
      setSteps([]);
      setMessage("");

      const response = await octokit.request(
        "GET /repos/waqas2714/k8-automate/actions/workflows/main-wf.yml/runs",
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
        if (jobs.length > 0) {
          const steps = jobs[0].steps;

          foundSteps = steps.map((step) => ({
            name: step.name,
            status: step.status,
          }));

          break;
        }
      }

      if (foundSteps.length > 0) {
        setSteps(foundSteps);

        const failed = foundSteps.find((step) => step.status === "failed");
        if (failed) {
          localStorage.setItem("failed_step", failed.name);
        } else {
          localStorage.removeItem("workflow_dispatched");
          localStorage.removeItem("failed_step");
        }

        // Stop polling if workflow completes (either success or failure)
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

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
                <span className={`text-${step.status === "failed" ? "red" : "gray"}-600`}>
                  {step.status}
                </span>
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
