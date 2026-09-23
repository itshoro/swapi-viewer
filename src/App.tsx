import { createBrowserRouter, RouterProvider } from "react-router";
import { HomePage } from "./app/routes/HomePage";
import { NotFoundPage } from "./app/routes/NotFoundPage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },

  { path: "*", element: <NotFoundPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
