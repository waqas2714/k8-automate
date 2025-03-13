import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Home from './Home';
import AuthDispatch from './AuthDispatch';
import WorkflowStatus from './WorkflowStatus';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<AuthDispatch />} />
        <Route path='/status' element={<WorkflowStatus />} />
      </Routes>
    </Router>
  )
}

export default App