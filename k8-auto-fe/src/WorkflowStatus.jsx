import { useEffect, useState, useRef } from "react";
import { Octokit } from "@octokit/core";
import { toast } from "react-toastify";

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

      const savedJobId = localStorage.getItem("savedJobId");

      if (savedJobId) {
        // If we have a saved job ID, fetch the job directly
        const jobResponse = await octokit.request(
          `GET /repos/waqas2714/k8-automate/actions/jobs/${savedJobId}`,
          { headers: { "X-GitHub-Api-Version": "2022-11-28" } }
        );
        processJobSteps(jobResponse.data);
      } else {
        // If no job ID is saved, we need to look through the runs
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
        let foundJobId = null;

        // Iterate through the workflow runs to find the correct job
        for (const run of workflowRuns) {
          const jobsResponse = await octokit.request(
            `GET /repos/waqas2714/k8-automate/actions/runs/${run.id}/jobs`,
            { headers: { "X-GitHub-Api-Version": "2022-11-28" } }
          );
          
          const jobs = jobsResponse.data.jobs;
          if (jobs.length > 0) {
            for (const job of jobs) {
              const steps = job.steps;

              // Check if the second step's name matches the uniqueUserId
              const step = steps[1]; // Assuming step[1] is the one you want
              if (step && step.name === userId) {
                foundJobId = job.id;
                foundSteps = steps.map((step) => ({
                  name: step.name,
                  status: step.status,
                  conclusion: step.conclusion, // Use conclusion instead of status
                }));
                break;
              }
            }
          }

          if (foundJobId) break; // Break out of the loop if we found the job
        }

        // If we found the job and steps, store the job ID and show the steps
        if (foundSteps.length > 0) {
          setSteps(foundSteps);
          localStorage.setItem("savedJobId", foundJobId);

          processJobSteps({ steps: foundSteps });

        } else {
          setMessage("No jobs found.");
        }
      }
    } catch (error) {
      console.error("Error getting workflow run:", error);
      setMessage("Error retrieving workflow runs.");
    }
  };

  const processJobSteps = (jobData) => {
    // Process the steps from the job data directly
    const steps = jobData.steps.map((step) => ({
      name: step.name,
      status: step.status,
      conclusion: step.conclusion,
    }));

    setSteps(steps);

    // Check for any failed steps based on conclusion
    const failed = steps.find((step) => step.conclusion === "failure");
    if (failed) {
      // If a failure is found, set the status of all remaining steps to 'canceled'
      const updatedSteps = steps.map((step, index) => {
        if (index === steps.indexOf(failed)) {
          return { ...step, status: 'failed' };
        }
        if (index > steps.indexOf(failed)) {
          return { ...step, status: 'canceled' };
        }
        return step;
      });

      setSteps(updatedSteps);

      // Stop polling and display error message
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      setLoading(false);

      // Optionally, you can show a toast or alert here to notify the user
      toast.error(`Error found in step: ${failed.name}. All subsequent steps have been canceled.`);
    } else {
      // If no failure, clear previous error-related data
      localStorage.removeItem("workflow_dispatched");
      localStorage.removeItem("failed_step");
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
                <span className={`text-${step.status === "failed" ? "red" : step.status === "canceled" ? "yellow" : "gray"}-600`}>
                  {step.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

export default WorkflowStatus;
