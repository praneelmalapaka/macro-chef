import { useEffect, useState } from "react";

export default function RecipeFeed() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/recipes")
      .then((res) => res.json())
      .then((data) => {
        setRecipes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch recipes:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading recipes...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>MacroChef Recipes 🍳</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <img
              src={recipe.image_url}
              alt={recipe.title}
              style={{ width: "100%", height: "180px", objectFit: "cover" }}
            />

            <div style={{ padding: "15px" }}>
              <h2>{recipe.title}</h2>

              <p style={{ color: "#666", fontSize: "14px" }}>
                {recipe.description || "No description"}
              </p>

              {/* Macros */}
              <div style={{ margin: "10px 0" }}>
                <strong>Calories:</strong> {recipe.calories || "—"} <br />
                <strong>Protein:</strong> {recipe.protein_g || "—"}g
              </div>

              {/* Ingredients preview */}
              <div style={{ fontSize: "14px", marginBottom: "10px" }}>
                <strong>Ingredients:</strong>
                <ul>
                  {recipe.ingredients?.slice(0, 3).map((ing, i) => (
                    <li key={i}>{ing.name}</li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div>
                {recipe.tags?.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#eee",
                      padding: "4px 8px",
                      marginRight: "5px",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}