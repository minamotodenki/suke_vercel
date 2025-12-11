import { Routes, Route, Link } from 'react-router-dom';
import CreateEvent from './pages/CreateEvent';
import ViewEvent from './pages/ViewEvent';
import RespondEvent from './pages/RespondEvent';

function App() {
  return (
    <div>
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="home-link" style={{ textDecoration: 'none' }}>
              <svg 
                className="home-icon" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </Link>
            <div className="header-title">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <h1>Suke</h1>
              </Link>
              <p>みんなの予定を簡単調整</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<CreateEvent />} />
          <Route path="/event/:id" element={<ViewEvent />} />
          <Route path="/event/:id/respond" element={<RespondEvent />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

