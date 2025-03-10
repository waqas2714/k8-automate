import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Octokit } from "@octokit/core";

function App() {
  const { user } = useUser()

  user && console.log(user);
  
  const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

  const workflowDispatch = async ()=>{
    const currentTime = new Date().toISOString();
    const response = await octokit.request('POST /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/dispatches', {
      ref: 'main',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    
    console.log(response);
    
    console.log("workflow run dispatched on: " + currentTime);
    
  }

  const getWorkflowRun = async ()=>{
    const response = await octokit.request('GET /repos/waqas2714/k8-automate/actions/workflows/polling-test.yml/runs', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    console.log(response);
    
  }

  return (
    <div className="bg-yellow-400">
      <SignedOut>
        <SignInButton  />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <button onClick={workflowDispatch}>DISPATCH!!!</button>
      <button onClick={getWorkflowRun}>Get Workflow</button>
    </div>
  )
}

export default App
