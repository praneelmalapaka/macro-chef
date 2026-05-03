import { Router, type Request, type Response, type NextFunction } from "express";
import * as recipeService from "../services/recipe.service";
import { requireAuth } from "../middleware/auth";

const router = Router();

function getAuthenticatedUserId(req: Request, res: Response): number | null {
  const userId = req.user?.id;

  if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  return userId;
}

function getRecipeId(req: Request, res: Response): number | null {
  const recipeId = Number(req.params.id);

  if (!Number.isInteger(recipeId) || recipeId <= 0) {
    res.status(400).json({ error: "Invalid recipe id" });
    return null;
  }

  return recipeId;
}

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (userId === null) return;

    const recipe = await recipeService.createRecipe(userId, req.body);
    res.status(201).json(recipe);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const recipes = await recipeService.getRecipes();
    res.json(recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recipeId = getRecipeId(req, res);
    if (recipeId === null) return;

    const recipe = await recipeService.getRecipeById(recipeId);

    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (userId === null) return;

    const recipeId = getRecipeId(req, res);
    if (recipeId === null) return;

    const recipe = await recipeService.updateRecipe(recipeId, userId, req.body);

    if (!recipe) {
      res.status(404).json({ error: "Recipe not found or not owned by user" });
      return;
    }

    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (userId === null) return;

    const recipeId = getRecipeId(req, res);
    if (recipeId === null) return;

    const deleted = await recipeService.deleteRecipe(recipeId, userId);

    if (!deleted) {
      res.status(404).json({ error: "Recipe not found or not owned by user" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;