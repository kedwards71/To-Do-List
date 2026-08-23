import React from 'react';
import { HashRouter, Routes, Route} from 'react-router-dom';
import Landing from '../components/Landing/Landing.jsx';
import Tasks from '../components/Tasks/Tasks.jsx';


const App = () => {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/tasks" element={<Tasks/>} />
        </Routes>
      </HashRouter>
    </>
  )
}

export default App