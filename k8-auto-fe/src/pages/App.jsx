import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import WorkflowStatus from './WorkflowStatus';
import Login from './Login';
import Provision from './Provision';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/provision' element={<Provision />} />
        <Route path='/status' element={<WorkflowStatus />} />
      </Routes>
    </Router>
  )
}

export default App