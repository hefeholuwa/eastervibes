import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import LiveBoard from "./pages/LiveBoard";
import Moderation from "./pages/Moderation";
import Summary from "./pages/Summary";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join/:id" element={<JoinRoom />} />
        <Route path="/board/:id" element={<LiveBoard />} />
        <Route path="/board/:id/moderation" element={<Moderation />} />
        <Route path="/summary/:id" element={<Summary />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
