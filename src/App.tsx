import { createBrowserRouter, RouterProvider } from "react-router";
import { HomePage } from "./app/routes/HomePage";
import { AddPage } from "./app/routes/AddPage";
import { EditPage } from "./app/routes/EditPage";
import { NotFoundPage } from "./app/routes/NotFoundPage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/:category/add", element: <AddPage /> },
  { path: "/:category/:id/edit", element: <EditPage /> },
  { path: "/:category/:id", element: <HomePage /> },
  { path: "*", element: <NotFoundPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
