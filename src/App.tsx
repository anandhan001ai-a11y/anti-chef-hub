import { TaskProvider } from './contexts/TaskContext';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <TaskProvider>
      <Dashboard />
    </TaskProvider>
  );
}

export default App;
