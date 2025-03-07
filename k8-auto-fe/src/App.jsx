import { Octokit } from "@octokit/core";

function App() {

  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  const workflowDispatch = async ()=>{
    const response = await octokit.request('POST /repos/waqas2714/k8-automate/actions/workflows/main-wf.yml/dispatches', {
      ref: 'main',
      inputs: {
        greeting: 'Hello from REST API :)',
        awsAccessKey: import.meta.env.VITE_AWS_ACCESS_KEY,
        awsSecretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
        ec2_count: '5'
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
