import { useEffect, useState, useRef } from "react";
import { Octokit } from "@octokit/core";
import { toast } from "react-toastify";
import Dashboard from "../components/Dashboard";
import { useNavigate } from "react-router-dom";

function WorkflowStatus() {
  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });
  const userId = localStorage.getItem("userName");

  const [steps, setSteps] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const pollingRef = useRef(null); // Track interval

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("github_token");
    if (!token) {
      navigate("/");
      return;
    }
  
    const storedSteps = localStorage.getItem("workflow_steps");
    const workflowComplete = localStorage.getItem("workflow_complete") === "true";
  
    if (storedSteps) {
      const parsedSteps = JSON.parse(storedSteps);
      setSteps(parsedSteps);
      setLoading(false);
    }
  
    if (workflowComplete) {
      setLoading(false);
      setSuccessMsg("Your cluster has been deployed successfully!");
      return;
    }
  
    const timeout = setTimeout(() => {
      getWorkflowRun();
      setLoading(false);
  
      pollingRef.current = setInterval(getWorkflowRun, 60000);
    }, 25000);
  
    return () => {
      clearTimeout(timeout);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);
  

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
            console.log(step);
            
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
        console.log(foundSteps);
        localStorage.setItem("workflow_steps", JSON.stringify(foundSteps));
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
    const steps = jobData.steps.map((step) => ({
      name: step.name,
      status: step.status,
      conclusion: step.conclusion,
    }));
  
    setSteps(steps);
    localStorage.setItem("workflow_steps", JSON.stringify(steps));
  
    const failedStep = steps.find((step) => step.conclusion === "failure");
  
    if (failedStep) {
      const updatedSteps = steps.map((step, index) => {
        if (index === steps.indexOf(failedStep)) {
          return { ...step, status: "failed" };
        }
        if (index > steps.indexOf(failedStep)) {
          return { ...step, status: "canceled" };
        }
        return step;
      });
  
      setSteps(updatedSteps);
      localStorage.setItem("workflow_steps", JSON.stringify(updatedSteps));
      localStorage.setItem("workflow_complete", "true");
  
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
  
      toast.error(
        `Error found in step: ${failedStep.name}. All subsequent steps have been canceled.`
      );
  
      setFailed(true);
      return;
    }
  
    const allSuccess = steps.every((step) => step.conclusion === "success");
    if (allSuccess) {
      localStorage.setItem("workflow_complete", "true");
  
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
  
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
    <Dashboard>
    <div className={`w-full`}>
      {loading && (
          <p className="text-black text-lg text-center mt-12 ">Your progress will be showed soon!</p>
      )}

      {!loading && steps.length > 0 && (
        <div className="p-4">
          <h2 className="font-bold text-2xl ">Progress:</h2>
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
    </Dashboard>
  );
}

export default WorkflowStatus;
