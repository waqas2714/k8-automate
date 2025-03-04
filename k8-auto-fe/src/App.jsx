import { Octokit } from "@octokit/core";

function App() {

  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  const workflowDispatch = async ()=>{
    const response = await octokit.request('POST /repos/waqas2714/k8-automate/actions/workflows/github-actions-demo.yml/dispatches', {
      ref: 'main',
      inputs: {
        greeting: 'Hello from REST API :)'
      },
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    console.log(response);
    
  }

  return (
    <>
      <button onClick={workflowDispatch}>DISPATCH!!!</button>
    </>
  )
}

export default App
