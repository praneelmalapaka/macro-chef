import { createApp } from "./app";
import { config } from "./config";
import ingredientRoutes from "./routes/ingredients";

const app = createApp();

app.listen(config.port, () => {
  console.log(`MacroChef API listening on :${config.port}`);
});

app.use(ingredientRoutes);
