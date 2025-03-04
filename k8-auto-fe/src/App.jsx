import { Octokit } from "@octokit/core";

function App() {

  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  const workflowDispatch = async ()=>{
    await octokit.request('POST /repos/waqas2714/k8-automate/actions/workflows/github-actions-demo.yml/dispatches', {
      owner: 'waqas2714',
      repo: 'k8-automate',
      workflow_id: 'github-actions-demo.yml',
      ref: 'topic-branch',
      inputs: {
        greeting: 'Hello from REST API :)'
      },
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  }

  return (
    <>
      <h1>{import.meta.env.VITE_GITHUB_PAT}</h1>
    </>
  )
}

export default App
