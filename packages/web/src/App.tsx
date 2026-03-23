import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { TopPage } from "./pages/TopPage";
import { NewGenerationPage } from "./pages/NewGenerationPage";
import { NovelPage } from "./pages/NovelPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GroupPage } from "./pages/GroupPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TopPage />} />
        <Route path="/generate" element={<NewGenerationPage />} />
        <Route path="/groups/:id" element={<GroupPage />} />
        <Route path="/novels/:id" element={<NovelPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
