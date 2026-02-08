import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [city, setCity] = useState("");
  const [weatherList, setWeatherList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("metric"); // metric=Celsius, imperial=Fahrenheit
  const [darkMode, setDarkMode] = useState(false);

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("weather-favorites");
    if (saved) setWeatherList(JSON.parse(saved));
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("weather-favorites", JSON.stringify(weatherList));
  }, [weatherList]);

  // Fetch weather + 5-day forecast
  const fetchWeather = async () => {
    if (!city) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unit}`
      );

      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unit}`
      );

      // Extract next 5 days (12:00) data
      const forecastData = forecastRes.data.list.filter(item => item.dt_txt.includes("12:00:00"));
      res.data.forecast = forecastData;

      // Prevent duplicate city
      if (weatherList.find(w => w.id === res.data.id)) {
        setError("City already added!");
        setLoading(false);
        return;
      }

      setWeatherList(prev => [res.data, ...prev]);
      setCity("");
    } catch (err) {
      if (err.response?.status === 404) setError("City not found!");
      else if (err.response?.status === 429) setError("API limit exceeded!");
      else setError("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // Remove city from favorites
  const removeCity = (id) => {
    setWeatherList(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div style={{
      padding: "40px",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      minHeight: "100vh",
      background: darkMode ? "#2c3e50" : "linear-gradient(to right, #d6eaf8, #aed6f1)",
      color: darkMode ? "#ecf0f1" : "#000"
    }}>
      <h1 style={{ marginBottom: "20px" }}>🌤 Weather Dashboard</h1>

      {/* Dark / Light Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{ padding: "5px 10px", cursor: "pointer", borderRadius: "5px", border:"none", background:"#34495e", color:"#fff" }}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Celsius / Fahrenheit Toggle */}
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={() => setUnit("metric")}
          style={{ marginRight: "10px", padding: "5px 10px", cursor: "pointer", background: unit==="metric"?"#3498db":"#ccc", color:"#fff", border:"none", borderRadius:"5px" }}
        >
          °C
        </button>
        <button
          onClick={() => setUnit("imperial")}
          style={{ padding: "5px 10px", cursor: "pointer", background: unit==="imperial"?"#3498db":"#ccc", color:"#fff", border:"none", borderRadius:"5px" }}
        >
          °F
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={e => setCity(e.target.value)}
          style={{ padding: "10px", width: "220px", marginRight: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button
          onClick={fetchWeather}
          style={{ padding: "10px 16px", borderRadius: "5px", border: "none", backgroundColor: "#3498db", color: "#fff", cursor: "pointer" }}
        >
          Add City
        </button>
      </div>

      {/* Loading / Error */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      {/* Weather Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
        {weatherList.map(w => (
          <div key={w.id} style={{
            padding: "20px",
            background: darkMode ? "#34495e" : "#fff",
            borderRadius: "15px",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.15)",
            width: "220px",
            textAlign: "center",
            position: "relative",
            color: darkMode ? "#ecf0f1" : "#000"
          }}>
            <button
              onClick={() => removeCity(w.id)}
              style={{ position: "absolute", top: "10px", right: "10px", border: "none", background: "red", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer" }}
            >
              X
            </button>
            <h2>{w.name}</h2>
            <img src={`https://openweathermap.org/img/wn/${w.weather[0].icon}@2x.png`} alt={w.weather[0].description} />
            <p>🌡 {w.main.temp}°{unit === "metric" ? "C" : "F"}</p>
            <p>💧 {w.main.humidity}%</p>
            <p style={{ textTransform: "capitalize" }}>☁ {w.weather[0].description}</p>

            {/* 5-Day Forecast */}
            {w.forecast && (
              <div style={{ marginTop: "10px" }}>
                {w.forecast.map(day => (
                  <div key={day.dt} style={{
                    display: "inline-block",
                    margin: "5px",
                    padding: "5px",
                    background: darkMode ? "#2c3e50" : "#f0f8ff",
                    borderRadius: "8px",
                    width: "70px",
                    fontSize: "12px"
                  }}>
                    <p>{new Date(day.dt_txt).toLocaleDateString(undefined, { weekday: "short" })}</p>
                    <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt={day.weather[0].description} />
                    <p>{Math.round(day.main.temp)}°{unit==="metric"?"C":"F"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
