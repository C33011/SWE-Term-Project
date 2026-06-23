import React from 'react';
import HomePage from './HomePage';

function App() {
  return (
    <div>
      <HomePage onNavigateToDetails={(id) => console.log("Navigate to movie:", id)} />
    </div>
  );
}
export default App;