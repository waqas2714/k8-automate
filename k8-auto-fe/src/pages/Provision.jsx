import { useEffect, useState } from "react";
import { Octokit } from "@octokit/core";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";

function Provision() {
  const navigate = useNavigate();
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [ec2Count, setEc2Count] = useState("3");
  const [instanceType, setInstanceType] = useState("t2.micro");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("github_token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const verifyToken = async () => {
      try {
        const octokit = new Octokit({ auth: token });
        const response = await octokit.request("GET /user");
        console.log(response.data.login);
        
        setUserId(response.data.login);
        localStorage.setItem("userName", response.data.login);
        setLoading(false);
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem("github_token");
        navigate("/");
      }
    };

    verifyToken();
  }, []);

  const workflowDispatch = async () => {
    if (!awsAccessKey.trim()) return toast.error("AWS Access Key is required!");
    if (!awsSecretAccessKey.trim()) return toast.error("AWS Secret Access Key is required!");

    try {
      const octokit = new Octokit({ auth: import.meta.env.VITE_GITHUB_PAT });

      await octokit.request(
        "POST /repos/waqas2714/k8-automate/actions/workflows/main-wf.yml/dispatches",
        {
          ref: "revamp",
          inputs: {
            user_name: userId,
            awsAccessKey,
            awsSecretAccessKey,
            ec2_count: ec2Count,
            instance_type: instanceType,
          },
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }
      );

      toast.success("Workflow dispatched successfully!");
      localStorage.setItem("workflow_dispatched", "true");
      localStorage.removeItem("workflow_complete");
      localStorage.removeItem("workflow_steps");
      
      navigate("/status");
    } catch (error) {
      toast.error("There was an error. Please try again.");
      console.error("Error dispatching workflow:", error);
    }
  };

  if (loading) return <div className="w-screen h-screen flex justify-center items-center"> <div className="ml-3 animate-spin rounded-full h-6 w-6 border-t-2 border-[#25292E] border-solid"></div></div>;

  return (
    <Dashboard>
    <div className="p-6 flex-1 flex-col justify-center items-center">
      <h2 className="text-center text-4xl font-semibold mb-6">Create Your Cluster!</h2>
      <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-6">
        <input
          type="text"
          placeholder="AWS Access Key"
          value={awsAccessKey}
          onChange={(e) => setAwsAccessKey(e.target.value)}
          className="border rounded w-[80%] sm:w-[45%] p-2"
        />
        <input
          type="password"
          placeholder="AWS Secret Access Key"
          value={awsSecretAccessKey}
          onChange={(e) => setAwsSecretAccessKey(e.target.value)}
          className="border rounded w-[80%] sm:w-[45%] p-2"
        />
        <input
          type="number"
          placeholder="Number of EC2 Instances"
          value={ec2Count}
          onChange={(e) => setEc2Count(e.target.value)}
          className="border rounded w-[80%] sm:w-[45%] p-2"
          max={10}
        />
        <select
          value={instanceType}
          onChange={(e) => setInstanceType(e.target.value)}
          className="border rounded w-[80%] sm:w-[45%] p-2"
        >
          <option value="t2.micro">t2.micro</option>
          <option value="t2.small">t2.small</option>
          <option value="t2.medium">t2.medium</option>
        </select>
        <button
          onClick={workflowDispatch}
          className="mt-6 text-white bg-[#2A2F35] hover:bg-[#F7F7F7] hover:text-[#2A2F35] hover:border hover:border-[#2A2F35] rounded p-4 transition-all cursor-pointer"
        >
          Dispatch Workflow
        </button>
      </div>
    </div>
    </Dashboard>
  );
}

export default Provision;
