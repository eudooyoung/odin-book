import { createBrowserRouter } from "react-router";
import App from "../App";

const routes = [
  {
    element: <App />,
    path: "/",
  },
];

export const router = createBrowserRouter(routes);
