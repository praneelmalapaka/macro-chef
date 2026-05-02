import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`MacroChef API listening on :${config.port}`);
});
