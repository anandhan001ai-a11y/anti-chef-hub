import { useState, useEffect } from 'react';
import { TaskProvider } from './contexts/TaskContext';
import { CleaningTaskProvider } from './contexts/CleaningTaskContext';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  const [chefName, setChefName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedChefName = localStorage.getItem('chefName');
    if (savedChefName) {
      setChefName(savedChefName);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (name: string) => {
    setChefName(name);
    setIsLoggedIn(true);
    localStorage.setItem('chefName', name);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <TaskProvider>
      <CleaningTaskProvider>
        <Dashboard chefName={chefName} />
      </CleaningTaskProvider>
    </TaskProvider>
  );
}

export default App;
