import { useEffect, useState, useRef } from "react";
import { Octokit } from "@octokit/core";
import { toast } from "react-toastify";

function WorkflowStatus() {
  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });
  const userId = localStorage.getItem("uniqueUserId");

  const [steps, setSteps] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const pollingRef = useRef(null); // Track interval

  useEffect(() => {
    // Start polling after an initial delay of 25 seconds
    const timeout = setTimeout(() => {
      getWorkflowRun();
      setLoading(false);
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
        processJobSteps({ steps: foundSteps });
      } else {
        setMessage("No jobs found.");
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
    const failed = jobData.steps.find((step) => step.conclusion === "failure");
    if (failed) {
      // If a failure is found, set the status of all remaining steps to 'canceled'

      const updatedSteps = steps.map((step, index) => {
        if (index === steps.indexOf(failed)) {
          return { ...step, status: "failed" };
        }
        if (index > steps.indexOf(failed)) {
          return { ...step, status: "canceled" };
        }
        return step;
      });

      setSteps(updatedSteps);

      // Stop polling and display error message
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      // Optionally, you can show a toast or alert here to notify the user
      toast.error(
        `Error found in step: ${failed.name}. All subsequent steps have been canceled.`
      );

      setFailed(true);
    }

    // If all steps are successful, show a success message
    const allSuccess = steps.every((step) => step.conclusion === "success");
    if (allSuccess) {
      setSuccessMsg("Your cluster has been deployed successfully!");
    }
  };

  const getStepBackgroundColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-[#0D70E0]"; // Blue for pending
      case "completed":
        return "bg-[#2EB54D]"; // Green for completed
      case "failed":
        return "bg-[#B72B00]"; // Red for failed
      case "canceled":
        return "bg-[#949494]"; // Gray for canceled
      case "in_progress":
        return "bg-[#F7D000]"; // Yellow for in progress
      default:
        return "bg-gray-400"; // Default fallback color
    }
  };

  return (
    <div className={`bg-[#25292E] min-h-screen w-screen ${!loading && 'py-12'}`}>
      {loading && (
        <div className="text-center h-screen w-full flex flex-col space-y-16 justify-center items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-[#F7F7F7] border-solid"></div>
          <p className="text-[#F7F7F7] text-lg ">Your progress will be showed soon!</p>
        </div>
      )}

      {!loading && steps.length > 0 && (
        <div className="p-4 w-[95%] mx-auto">
          <h2 className="font-bold text-2xl text-white">Progress:</h2>
          <div className="flex flex-wrap space-y-5 space-x-2 mt-6">
            {steps.map((step, index) => {
              if (index < 2 || index > 15) {
                return;
              }
              return (
                <div
                  key={index}
                  className={`flex items-center rounded ${getStepBackgroundColor(step.status)} px-4 py-3`}
                >
                  <div className="flex">
                    <h1 className="font-medium text-sm">{index - 1}.</h1>
                    <h1 className="font-medium text-sm ml-1">{step.name}</h1>
                  </div>

                  {/* Add loader for "in_progress" steps */}
                  {step.status === "in_progress" && (
                    <div className="ml-3 animate-spin rounded-full h-6 w-6 border-t-2 border-[#F7F7F7] border-solid"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show success message if all steps are successful */}
          {successMsg && (
            <div className="mt-6 text-center text-green-500 font-semibold">
              {successMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkflowStatus;
