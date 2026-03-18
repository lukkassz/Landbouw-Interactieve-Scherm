import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import EventList from "./pages/EventList";
import EventForm from "./pages/EventForm";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<EventList />} />
        <Route path="event/new" element={<EventForm />} />
        <Route path="event/:id" element={<EventForm />} />
      </Route>
    </Routes>
  );
}
