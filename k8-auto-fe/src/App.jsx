import { Octokit } from "@octokit/core";

function App() {

  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  const workflowDispatch = async ()=>{
    const response = await octokit.request('POST /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/dispatches', {
      ref: 'workflow-by-dynamic-step',
      inputs: {
        step1_name: "waqas2714"
      },
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    console.log(response);
    
  }

  
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
    <>
      <button onClick={workflowDispatch}>DISPATCH!!!</button>
      <button onClick={getWorkflowRun} className="mx-6">Get Workflow Runs</button>
    </>
  )
}

export default App
