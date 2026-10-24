import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [shortUrl, setShortUrl] = useState("");

  const [analyticsCode, setAnalyticsCode] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      if (mode === "register") {
        const res = await axios.post(
          "http://localhost:5000/api/auth/register",
          {
            name,
            email,
            password,
          }
        );

        setMessage(res.data.message);
        setMode("login");
        setName("");
        setPassword("");
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/auth/login",
          {
            email,
            password,
          }
        );

        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);

        setPassword("");
        setMessage("Login successful");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong"
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setShortUrl("");
    setAnalytics(null);
  };

  const shortenUrl = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        setError("Only HTTP and HTTPS URLs are allowed");
        return;
      }
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/urls/shorten",
        {
          originalUrl: url,
          customCode,
          expiresAt: expiresAt || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShortUrl(res.data.shortUrl);

      setUrl("");
      setCustomCode("");
      setExpiresAt("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to shorten URL"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setMessage("URL copied");
  };

  const getAnalytics = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setAnalytics(null);

    if (!analyticsCode.trim()) {
      setError("Please enter a short code");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/urls/${analyticsCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalytics(res.data);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to fetch analytics"
      );
    }
  };

  if (!token) {
    return (
      <div className="container">
        <div className="card">
          <h1>URL Shortener</h1>

          <h2>
            {mode === "login"
              ? "Login"
              : "Create Account"}
          </h2>

          <form onSubmit={handleAuth}>
            {mode === "register" && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button type="submit">
              {mode === "login"
                ? "Login"
                : "Register"}
            </button>
          </form>

          {error && (
            <p className="error">{error}</p>
          )}

          {message && (
            <p className="message">{message}</p>
          )}

          <button
            className="switch-button"
            onClick={() => {
              setMode(
                mode === "login"
                  ? "register"
                  : "login"
              );
              setError("");
              setMessage("");
            }}
          >
            {mode === "login"
              ? "Create an account"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header-row">
          <h1>URL Shortener</h1>

          <button onClick={logout}>
            Logout
          </button>
        </div>

        <p className="subtitle">
          Create and manage your shortened URLs.
        </p>

        <h2>Create Short URL</h2>

        <form onSubmit={shortenUrl}>
          <input
            type="text"
            placeholder="Paste your long URL here..."
            value={url}
            onChange={(e) =>
              setUrl(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Custom alias (optional)"
            value={customCode}
            onChange={(e) =>
              setCustomCode(e.target.value)
            }
          />

          <label>
            Expiration date (optional)
          </label>

          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) =>
              setExpiresAt(e.target.value)
            }
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Shortening..."
              : "Shorten URL"}
          </button>
        </form>

        {shortUrl && (
          <div className="result">
            <p>Your shortened URL:</p>

            <div className="result-row">
              <a
                href={shortUrl}
                target="_blank"
                rel="noreferrer"
              >
                {shortUrl}
              </a>

              <button onClick={copyUrl}>
                Copy
              </button>
            </div>
          </div>
        )}

        <hr />

        <h2>URL Analytics</h2>

        <form onSubmit={getAnalytics}>
          <input
            type="text"
            placeholder="Enter short code"
            value={analyticsCode}
            onChange={(e) =>
              setAnalyticsCode(e.target.value)
            }
          />

          <button type="submit">
            View Analytics
          </button>
        </form>

        {analytics && (
          <div className="analytics">
            <p>
              <strong>Original URL:</strong>{" "}
              {analytics.originalUrl}
            </p>

            <p>
              <strong>Short Code:</strong>{" "}
              {analytics.shortCode}
            </p>

            <p>
              <strong>Clicks:</strong>{" "}
              {analytics.clicks}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {new Date(
                analytics.createdAt
              ).toLocaleString()}
            </p>

            <p>
              <strong>Expires:</strong>{" "}
              {analytics.expiresAt
                ? new Date(
                    analytics.expiresAt
                  ).toLocaleString()
                : "Never"}
            </p>
          </div>
        )}

        {error && (
          <p className="error">{error}</p>
        )}

        {message && (
          <p className="message">{message}</p>
        )}
      </div>
    </div>
  );
}

export default App;