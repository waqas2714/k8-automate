import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import WorkflowStatus from './WorkflowStatus';
import Login from './Login';
import Provision from './Provision';
import CreatePods from './CreatePods';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/provision' element={<Provision />} />
        <Route path='/status' element={<WorkflowStatus />} />
        <Route path='/create' element={<CreatePods />} />
      </Routes>
    </Router>
  )
}

export default App