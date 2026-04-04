import { useState, useEffect, useMemo } from "react";
import { getFoods, addToCart } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";



const PEXELS_API_KEY = "B4wSKLq8KrcrcEzcbCgapT1ApnUS9m0ip9tDYTXmJkJ7xG2I11p9lQUU";

// Smart keyword map — maps food name → best search phrase for Pexels
function getSearchQuery(name) {
  const n = name.toLowerCase();
  if (n.includes("biryani"))                              return "chicken biryani rice dish";
  if (n.includes("pizza"))                               return "pizza slice";
  if (n.includes("burger"))                              return "beef burger";
  if (n.includes("pasta") || n.includes("spaghetti"))    return "pasta dish";
  if (n.includes("noodle") || n.includes("ramen"))       return "noodles bowl";
  if (n.includes("dosa"))                                return "dosa south indian food";
  if (n.includes("idli"))                                return "idli sambar";
  if (n.includes("paneer"))                              return "paneer tikka masala";
  if (n.includes("tikka"))                               return "chicken tikka masala";
  if (n.includes("dal") || n.includes("daal"))           return "dal tadka lentil";
  if (n.includes("samosa"))                              return "samosa indian snack";
  if (n.includes("curry"))                               return "indian curry dish";
  if (n.includes("masala"))                              return "masala curry food";
  if (n.includes("tandoori"))                            return "tandoori chicken";
  if (n.includes("chicken"))                             return "chicken dish food";
  if (n.includes("mutton") || n.includes("lamb"))        return "mutton curry";
  if (n.includes("fish") || n.includes("seafood"))       return "fish curry seafood";
  if (n.includes("prawn") || n.includes("shrimp"))       return "prawn curry";
  if (n.includes("egg"))                                 return "egg dish food";
  if (n.includes("rice") && !n.includes("biryani"))      return "rice dish food";
  if (n.includes("fried rice"))                          return "fried rice";
  if (n.includes("sandwich"))                            return "sandwich food";
  if (n.includes("wrap") || n.includes("roll"))          return "wrap roll food";
  if (n.includes("taco"))                                return "tacos food";
  if (n.includes("salad"))                               return "fresh salad bowl";
  if (n.includes("soup"))                                return "soup bowl food";
  if (n.includes("cake"))                                return "cake dessert";
  if (n.includes("ice cream"))                           return "ice cream dessert";
  if (n.includes("dessert") || n.includes("sweet"))      return "dessert sweet food";
  if (n.includes("halwa") || n.includes("kheer"))        return "indian dessert sweet";
  if (n.includes("coffee"))                              return "coffee cup";
  if (n.includes("tea") || n.includes("chai"))           return "tea cup chai";
  if (n.includes("juice"))                               return "fresh fruit juice";
  if (n.includes("shake") || n.includes("smoothie"))     return "milkshake smoothie";
  if (n.includes("lassi"))                               return "lassi drink";
  if (n.includes("chaat"))                               return "chaat indian street food";
  if (n.includes("pani puri") || n.includes("golgappa")) return "pani puri street food";
  if (n.includes("vada"))                                return "vada south indian food";
  if (n.includes("uttapam"))                             return "uttapam indian food";
  if (n.includes("paratha"))                             return "paratha indian bread";
  if (n.includes("roti") || n.includes("chapati"))       return "roti chapati indian";
  if (n.includes("naan"))                                return "naan bread indian";
  if (n.includes("pav bhaji"))                           return "pav bhaji indian food";
  if (n.includes("chole") || n.includes("chana"))        return "chole bhature indian";
  if (n.includes("rajma"))                               return "rajma chawal indian food";
  if (n.includes("steak"))                               return "steak beef";
  if (n.includes("wing"))                                return "chicken wings";
  // Fallback: use the food name itself — Pexels handles it well
  return `${name} food dish`;
}

const imgCache = {};

async function fetchFoodImage(foodName, foodId) {
  const cacheKey = `${foodId}`;
  if (imgCache[cacheKey] !== undefined) return imgCache[cacheKey];

  const query = getSearchQuery(foodName);

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=1`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      // Use food ID as offset so same food always gets same photo
      const photo = data.photos[foodId % data.photos.length];
      const url = photo.src.medium; // 350×233px — perfect for cards
      imgCache[cacheKey] = url;
      return url;
    }
  } catch (_) {
    // Network error or API down — emoji fallback will show
  }

  imgCache[cacheKey] = null;
  return null;
}

const CATEGORIES = {
  All: null,
  "🍕 Pizza":    ["pizza"],
  "🍔 Burgers":  ["burger"],
  "🍚 Rice":     ["rice", "biryani", "fried"],
  "🍝 Pasta":    ["pasta", "noodle", "spaghetti"],
  "🐔 Chicken":  ["chicken", "wing", "poultry"],
  "🥗 Healthy":  ["salad", "soup", "veg", "green", "dal"],
  "🍰 Desserts": ["cake", "dessert", "sweet", "ice"],
  "☕ Drinks":   ["coffee", "juice", "drink", "tea", "shake"],
};

export default function MenuPage() {
  const { user } = useAuth();
  const { increment } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    getFoods()
      .then((r) => setFoods(r.data))
      .catch(() => addToast("Failed to load menu", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = foods;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      );
    }
    const keywords = CATEGORIES[activeCategory];
    if (keywords) {
      list = list.filter((f) =>
        keywords.some((k) => f.name.toLowerCase().includes(k) || f.description.toLowerCase().includes(k))
      );
    }
    return list;
  }, [foods, search, activeCategory]);

  const handleAdd = async (food) => {
    if (!user) { navigate("/login"); return; }
    setAddingId(food.id);
    try {
      await addToCart(food.id, 1);
      increment();
      setAddedIds((prev) => new Set([...prev, food.id]));
      setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(food.id); return n; }), 1800);
      addToast(`${food.name} added to cart!`);
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to add item", "error");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="page">
      <div className="menu-hero">
        <div className="menu-hero-content">
          <p className="menu-hero-eyebrow">Fresh Today</p>
          <h1 className="menu-hero-title">What are you<br /><em>craving?</em></h1>
        </div>
        <div className="menu-hero-deco">
          {["🍕","🍔","🌮","🍜","🥗","🍰"].map((e, i) => (
            <span key={i} className="deco-emoji" style={{ "--delay": `${i * 0.12}s`, "--x": `${i * 16}%` }}>{e}</span>
          ))}
        </div>
      </div>

      <div className="menu-search-row">
        <div className="search-wrap">
          <span className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input className="search-input" placeholder="Search by name or description…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="menu-count">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      <div className="category-bar">
        {Object.keys(CATEGORIES).map((cat) => (
          <button key={cat} className={`cat-chip${activeCategory === cat ? " active" : ""}`}
            onClick={() => setActiveCategory(cat)}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div className="food-grid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No items found</h3>
          <p>Try a different search or category</p>
          <button className="btn-ghost" onClick={() => { setSearch(""); setActiveCategory("All"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="food-grid">
          {filtered.map((food, i) => (
            <FoodCard key={food.id} food={food} index={i}
              onAdd={handleAdd} adding={addingId === food.id}
              added={addedIds.has(food.id)} isLoggedIn={!!user} />
          ))}
        </div>
      )}
    </div>
  );
}

function FoodCard({ food, index, onAdd, adding, added, isLoggedIn }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setImgLoading(true);
    fetchFoodImage(food.name, food.id).then((url) => {
      if (!cancelled) {
        setImgUrl(url);
        setImgLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [food.id, food.name]);

  const showEmoji = !imgLoading && !imgUrl;

  return (
    <div className={`food-card${added ? " food-card--added" : ""}`}
      style={{ animationDelay: `${index * 0.06}s` }}>

      <div className="food-card-img-wrap">
        {imgLoading && <div className="food-card-img-skeleton" />}

        {imgUrl && (
          <img
            src={imgUrl}
            alt={food.name}
            className={`food-card-img${imgLoaded ? " loaded" : ""}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgUrl(null); setImgLoading(false); }}
          />
        )}

        {showEmoji && (
          <div className="food-card-img-fallback">
            <span className="food-card-emoji">{getFoodEmoji(food.name)}</span>
          </div>
        )}

        <div className="food-img-price-badge">₹{food.price.toFixed(2)}</div>
      </div>

      <div className="food-card-body">
        <h3 className="food-name">{food.name}</h3>
        <p className="food-desc">{food.description}</p>
      </div>

      <div className="food-card-footer">
        <div className="food-price-wrap">
          <span className="food-price-label">Price</span>
          <span className="food-price">₹{food.price.toFixed(2)}</span>
        </div>
        <button className={`btn-add${added ? " btn-add--done" : ""}`}
          onClick={() => onAdd(food)} disabled={adding}>
          {adding ? <span className="spinner spinner--sm" />
            : added ? <><span>✓</span> Added</>
            : <><span className="btn-add-plus">+</span>{isLoggedIn ? "Add" : "Login"}</>}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="food-card">
      <div className="food-card-img-wrap">
        <div className="food-card-img-skeleton" />
      </div>
      <div className="food-card-body">
        <div className="skeleton-line" style={{ width: "60%", height: 16, marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: "90%", height: 12 }} />
        <div className="skeleton-line" style={{ width: "75%", height: 12, marginTop: 6 }} />
      </div>
      <div className="food-card-footer">
        <div className="skeleton-line" style={{ width: 60, height: 20 }} />
        <div className="skeleton-line" style={{ width: 64, height: 34, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function getFoodEmoji(name = "") {
  const n = name.toLowerCase();
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger") || n.includes("sandwich")) return "🍔";
  if (n.includes("pasta") || n.includes("spaghetti")) return "🍝";
  if (n.includes("noodle") || n.includes("ramen")) return "🍜";
  if (n.includes("biryani") || n.includes("rice")) return "🍚";
  if (n.includes("taco") || n.includes("wrap")) return "🌮";
  if (n.includes("salad")) return "🥗";
  if (n.includes("soup")) return "🍲";
  if (n.includes("cake") || n.includes("dessert") || n.includes("sweet")) return "🍰";
  if (n.includes("ice cream")) return "🍦";
  if (n.includes("coffee")) return "☕";
  if (n.includes("juice") || n.includes("shake") || n.includes("drink")) return "🧃";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("fish") || n.includes("seafood")) return "🐟";
  if (n.includes("egg")) return "🍳";
  return "🍽️";
}