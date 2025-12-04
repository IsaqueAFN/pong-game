import React from 'react';
import PongGame from './components/PongGame';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center">
      <PongGame />
    </div>
  );
};

export default App;
