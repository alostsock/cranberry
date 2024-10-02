import { render } from "preact";
import { App } from "./app.tsx";
import "./normalize.css";
import "./variables.css";
import "./index.css";

render(<App />, document.getElementById("app")!);
