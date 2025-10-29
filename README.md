# 🌦️ WeatherSense Pro | Full-Stack Weather Application

A feature-rich weather application built with **Node.js, Express, and Vanilla JavaScript**, offering real-time data, forecasts, and a personalized, multilingual experience.

<p align="center">
  <!-- 🎬 IMPORTANT: A GIF showing the search, geolocation, dark mode toggle, and adding a favorite would be a perfect showcase. -->
  <!-- <img src="path/to/your/weathersense-demo.gif" width="90%"> -->
</p>

---

### 🛠️ Tech Stack & Key Tools

| Backend | Frontend | APIs & Tools |
| :---: | :---: | :---: |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) | ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white) |
| ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) | ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) | ![WeatherAPI](https://img.shields.io/badge/WeatherAPI-4CAF50?style=for-the-badge) |
| ![Helmet](https://img.shields.io/badge/Helmet-000000?style=for-the-badge) | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) | ![OpenCage](https://img.shields.io/badge/OpenCage-D43E2A?style=for-the-badge) |
| ![i18n-node](https://img.shields.io/badge/i18n-4DA296?style=for-the-badge) | ![Handlebars](https://img.shields.io/badge/Handlebars.js-FF7D00?style=for-the-badge&logo=handlebarsdotjs&logoColor=white) | |

---

### ✨ Core Features

-   **📍 Geolocation Support:** Automatically fetch weather for the user's current location with a single click.
-   **☀️ Multi-Day Forecasts:** View detailed weather predictions for the upcoming days.
-   **⭐ Favorite Locations:** Save and manage a list of favorite locations for quick lookups (persisted via `localStorage`).
-   **🌙 Dark/Light Mode:** A sleek, user-toggleable theme for comfortable viewing.
-   **🌍 Multilingual Interface (i18n):** Fully localized UI supporting both English and Arabic.
-   **📱 Fully Responsive Design:** Optimized for a seamless experience on desktops, tablets, and mobile devices.

---

<details>
<summary>🚀 <strong>Getting Started: Local Setup & Run</strong></summary>

To get a local copy up and running, follow these simple steps.

#### Prerequisites
-   Node.js (v16.x or later)
-   npm (comes with Node.js)

#### Installation & Setup
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/77hamed77/WeatherApp.git
    cd WeatherApp
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your API keys:
    ```env
    WEATHERAPI_KEY=your_weatherapi_com_api_key
    OPENCAGE_API_KEY=your_opencagedata_com_api_key
    PORT=3000
    ```

4.  **Run the application:**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:3000`.

</details>

<details>
<summary>🔮 <strong>Future Enhancements & Roadmap</strong></summary>

-   **Improved UI/UX:** Implement toast notifications, skeleton loaders, and advanced animations.
-   **More Weather Details:** Add hourly forecasts, Air Quality Index (AQI), and sunrise/sunset times.
-   **User Accounts:** Introduce a database-backed user system to save preferences permanently.
-   **PWA Features:** Add offline support and make the app installable.
-   **Testing:** Implement unit and integration tests for a more robust codebase.

</details>

---

### 🤝 Contributing

Contributions, issues, and feature requests are welcome. Please feel free to fork the repo and create a pull request.

---

### 👨‍💻 Author

**Hamed Almurai**

<p>
  <a href="https://github.com/77hamed77" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Github">
  </a>
  <a href="https://www.linkedin.com/in/hamidmuhammad/" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
</p>

---

### 📝 License

This project is licensed under the MIT License.
