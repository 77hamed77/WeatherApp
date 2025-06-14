// public/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // عناصر DOM الرئيسية
    const weatherForm = document.querySelector("#weatherForm");
    const addressInput = document.querySelector("#addressInput");
    const submitButton = document.querySelector("#submitButton");
    const buttonText = submitButton ? submitButton.querySelector(".button-text") : null;
    const buttonLoader = submitButton ? submitButton.querySelector(".button-loader") : null;
    const currentLocationButton = document.querySelector("#currentLocationButton");
    const darkModeToggleButton = document.querySelector("#darkModeToggle");

    const weatherResultsDiv = document.querySelector("#weatherResults");
    const locationNameEl = document.querySelector("#locationName");
    const conditionIconEl = document.querySelector("#conditionIcon");
    const temperatureEl = document.querySelector("#temperature");
    const conditionTextEl = document.querySelector("#conditionText");
    const feelsLikeEl = document.querySelector("#feelsLike");

    const humidityValueEl = document.querySelector("#humidityValue");
    const windValueEl = document.querySelector("#windValue");
    const pressureValueEl = document.querySelector("#pressureValue");
    const visibilityValueEl = document.querySelector("#visibilityValue");
    const uvIndexValueEl = document.querySelector("#uvIndexValue");
    const localtimeValueEl = document.querySelector("#localtimeValue");
    const coordinatesValueEl = document.querySelector("#coordinatesValue");

    const toggleFavoriteButton = document.querySelector("#toggleFavoriteButton");
    const favoritesListEl = document.querySelector("#favoritesList");
    const noFavoritesMessageEl = document.querySelector("#noFavoritesMessage");

    const forecastSectionEl = document.querySelector("#forecastSection");
    const forecastCardsContainerEl = document.querySelector("#forecastCardsContainer");

    const loadingIndicatorEl = document.querySelector("#loadingIndicator");
    const errorMessageEl = document.querySelector("#errorMessage");

    const currentYearEl = document.querySelector("#currentYear");

    let currentDisplayedLocationData = null;

    // --- تهيئة ---
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // --- دوال الترجمة ---
    const getTranslation = (key, replacements = {}) => {
        let text = (window.clientTranslations && window.clientTranslations[key]) ? window.clientTranslations[key] : key;
        for (const placeholder in replacements) {
            text = text.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
        }
        return text;
    };

    // --- إدارة الوضع الليلي ---
    const THEME_KEY = 'weatherAppTheme';
    const applyTheme = (theme) => {
        const iconElement = darkModeToggleButton ? darkModeToggleButton.querySelector('i') : null;
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (iconElement) { iconElement.classList.remove('fa-moon'); iconElement.classList.add('fa-sun'); }
            if (darkModeToggleButton) darkModeToggleButton.title = getTranslation("tooltipToggleLightMode");
            localStorage.setItem(THEME_KEY, 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            if (iconElement) { iconElement.classList.remove('fa-sun'); iconElement.classList.add('fa-moon'); }
            if (darkModeToggleButton) darkModeToggleButton.title = getTranslation("tooltipToggleDarkMode");
            localStorage.setItem(THEME_KEY, 'light');
        }
    };
    const toggleDarkMode = () => {
        const currentTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    };
    const initializeTheme = () => {
        const savedTheme = localStorage.getItem(THEME_KEY);
        applyTheme(savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    };

    // --- إدارة حالة الواجهة ---
    const showLoadingState = (isLoading, forCurrentLocation = false) => {
        if (isLoading) {
            if (!forCurrentLocation && submitButton && buttonText && buttonLoader) {
                buttonText.style.display = "none";
                buttonLoader.style.display = "inline-block";
                submitButton.disabled = true;
            }
            if (currentLocationButton) currentLocationButton.disabled = true;
            if (loadingIndicatorEl) loadingIndicatorEl.style.display = "flex";
            if (errorMessageEl) errorMessageEl.style.display = "none";
            if (weatherResultsDiv) weatherResultsDiv.style.display = "none";
            if (forecastSectionEl) forecastSectionEl.style.display = "none";
            if (toggleFavoriteButton) toggleFavoriteButton.style.display = "none";
        } else {
            if (submitButton && buttonText && buttonLoader) {
                buttonText.style.display = "inline-block";
                buttonLoader.style.display = "none";
                submitButton.disabled = false;
            }
            if (currentLocationButton) currentLocationButton.disabled = false;
            if (loadingIndicatorEl) loadingIndicatorEl.style.display = "none";
        }
    };
    const displayError = (messageKey, details = "") => {
        if (errorMessageEl) {
            errorMessageEl.textContent = getTranslation(messageKey, { details });
            errorMessageEl.style.display = "block";
        }
        if (weatherResultsDiv) weatherResultsDiv.style.display = "none";
        if (forecastSectionEl) forecastSectionEl.style.display = "none";
        if (toggleFavoriteButton) toggleFavoriteButton.style.display = "none";
    };
    const clearError = () => {
        if (errorMessageEl) { errorMessageEl.style.display = "none"; errorMessageEl.textContent = ""; }
    };

    // --- دوال إدارة المفضلة ---
    const FAVORITES_KEY = 'weatherAppFavorites';
    const getFavorites = () => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    const saveFavorites = (favorites) => {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        renderFavoritesList();
    };
    const isFavorite = (locationName) => {
        if (!locationName) return false;
        return getFavorites().some(fav => fav.name && fav.name.toLowerCase() === locationName.toLowerCase());
    };
    const addFavorite = (locationData) => {
        if (!locationData || !locationData.name || locationData.latitude === undefined || locationData.longitude === undefined) return;
        const favorites = getFavorites();
        if (!isFavorite(locationData.name)) {
            favorites.push({
                name: locationData.name, queryName: locationData.queryName || locationData.name,
                lat: locationData.latitude, lon: locationData.longitude
            });
            saveFavorites(favorites);
            updateFavoriteButtonState(true, locationData.name);
        }
    };
    const removeFavorite = (locationName) => {
        saveFavorites(getFavorites().filter(fav => fav.name && fav.name.toLowerCase() !== locationName.toLowerCase()));
        if (currentDisplayedLocationData && currentDisplayedLocationData.name.toLowerCase() === locationName.toLowerCase()) {
            updateFavoriteButtonState(false, locationName);
        }
    };
    const updateFavoriteButtonState = (isFav, locationName) => {
        if (!toggleFavoriteButton) return;
        const icon = toggleFavoriteButton.querySelector('i');
        toggleFavoriteButton.classList.toggle('is-favorite', isFav);
        if (icon) { icon.classList.toggle('far', !isFav); icon.classList.toggle('fas', isFav); }
        toggleFavoriteButton.title = getTranslation(isFav ? "tooltipRemoveFromFavorites" : "tooltipAddToFavorites");
        toggleFavoriteButton.setAttribute('aria-label', getTranslation(isFav ? "tooltipRemoveFromFavorites" : "tooltipAddToFavorites"));
        toggleFavoriteButton.dataset.locationName = locationName;
    };

    // --- عرض قائمة المفضلة ---
    const renderFavoritesList = () => {
        if (!favoritesListEl || !noFavoritesMessageEl) return;
        const favorites = getFavorites();
        favoritesListEl.innerHTML = '';
        noFavoritesMessageEl.style.display = favorites.length === 0 ? 'list-item' : 'none';
        favorites.forEach(fav => {
            const listItem = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.className = 'favorite-item-name'; nameSpan.textContent = fav.name;
            nameSpan.addEventListener('click', () => {
                fetchWeather({ latitude: fav.lat, longitude: fav.lon });
                if (addressInput) addressInput.value = fav.queryName;
            });
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-favorite-button';
            removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            removeButton.title = getTranslation("tooltipRemoveFromFavorites");
            removeButton.setAttribute('aria-label', `${getTranslation("tooltipRemoveFromFavorites")} ${fav.name}`);
            removeButton.addEventListener('click', () => removeFavorite(fav.name));
            listItem.append(nameSpan, removeButton);
            favoritesListEl.appendChild(listItem);
        });
    };

    // --- عرض توقعات الطقس ---
    const renderForecast = (forecastDays) => {
        if (!forecastCardsContainerEl || !forecastDays || forecastDays.length === 0) {
            if (forecastSectionEl) forecastSectionEl.style.display = "none";
            return;
        }
        forecastCardsContainerEl.innerHTML = '';
        forecastDays.forEach(day => {
            const card = document.createElement('div');
            card.className = 'forecast-card';
            const date = new Date(day.date.replace(/-/g, '/'));
            const dayName = date.toLocaleDateString(window.currentLocale || 'en-US', { weekday: 'short' });
            const formattedDate = date.toLocaleDateString(window.currentLocale || 'en-US', { day: 'numeric', month: 'short' });
            let forecastIconSrc = '';
            if (day.condition_icon) {
                forecastIconSrc = day.condition_icon;
                if (!forecastIconSrc.startsWith('http:') && !forecastIconSrc.startsWith('https://')) {
                    forecastIconSrc = `https:${forecastIconSrc}`;
                }
            }
            card.innerHTML = `
                <p class="forecast-date">${formattedDate}</p>
                <p class="forecast-dayname">${dayName}</p>
                <img src="${day.condition_icon ? (day.condition_icon.startsWith('http') ? day.condition_icon : `https:${day.condition_icon}`) : ''}" alt="${day.condition_text || 'Forecast icon'}" class="forecast-icon">
                <p class="forecast-temps">
                    <span class="temp-max">${Math.round(day.maxtemp_c || 0)}${getTranslation("temperatureUnitC")}</span>
                    <span class="temp-min">${Math.round(day.mintemp_c || 0)}${getTranslation("temperatureUnitC")}</span>
                </p>
                <p class="forecast-condition">${day.condition_text || 'N/A'}</p>
                ${day.daily_chance_of_rain !== undefined ? `<p class="forecast-rain-chance"><i class="fas fa-cloud-rain"></i> ${day.daily_chance_of_rain}%</p>` : ''}
            `;
            forecastCardsContainerEl.appendChild(card);
        });
        if (forecastSectionEl) forecastSectionEl.style.display = "block";
    };

    // --- جلب وعرض بيانات الطقس ---
    const fetchWeather = async (addressOrCoords) => {
        let query, isCoordsSearch = false;
        if (typeof addressOrCoords === 'string') {
            if (!addressOrCoords || addressOrCoords.trim() === "") { displayError("errorEnterAddress"); return; }
            query = `address=${encodeURIComponent(addressOrCoords)}`;
        } else if (typeof addressOrCoords === 'object' && addressOrCoords.latitude !== undefined && addressOrCoords.longitude !== undefined) {
            query = `lat=${addressOrCoords.latitude}&lon=${addressOrCoords.longitude}`; isCoordsSearch = true;
        } else { displayError("errorInvalidInputForWeather"); return; }

        clearError(); showLoadingState(true, isCoordsSearch);
        try {
            const response = await fetch(`/weather?${query}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
            if (data.error) throw new Error(data.error);

            let currentWeatherData, forecastDaysData;
            if (data.current && data.forecastDays) {
                currentWeatherData = data.current;
                forecastDaysData = data.forecastDays;
                 currentDisplayedLocationData = {
                    name: data.locationFound,
                    queryName: (typeof addressOrCoords === 'string') ? addressOrCoords : data.locationFound,
                    latitude: data.latitude,
                    longitude: data.longitude
                };
            } else if (data.forecast && data.forecast.current && data.forecast.forecastDays) {
                currentWeatherData = data.forecast.current;
                forecastDaysData = data.forecast.forecastDays;
                 currentDisplayedLocationData = {
                    name: data.locationFound,
                    queryName: (typeof addressOrCoords === 'string') ? addressOrCoords : data.locationFound,
                    latitude: data.latitude,
                    longitude: data.longitude
                };
            } else {
                currentWeatherData = data.forecast || data; // إذا كانت البيانات تحتوي فقط على الطقس الحالي
                forecastDaysData = [];
                 currentDisplayedLocationData = {
                    name: data.locationFound,
                    queryName: (typeof addressOrCoords === 'string') ? addressOrCoords : data.locationFound,
                    latitude: data.latitude,
                    longitude: data.longitude
                };
            }

            displayWeatherData({
                locationFound: currentDisplayedLocationData.name,
                latitude: currentDisplayedLocationData.latitude,
                longitude: currentDisplayedLocationData.longitude,
                forecast: currentWeatherData
            }, isCoordsSearch);
            renderForecast(forecastDaysData);

            if (weatherResultsDiv) weatherResultsDiv.style.display = "block";
            if (toggleFavoriteButton && currentDisplayedLocationData.name) {
                toggleFavoriteButton.style.display = 'inline-block';
                updateFavoriteButtonState(isFavorite(currentDisplayedLocationData.name), currentDisplayedLocationData.name);
            }
            if (!isCoordsSearch && addressInput) { addressInput.value = ""; }
        } catch (err) {
            console.error("Fetch error:", err);
            if (err.message && (err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("networkerror"))) {
                displayError("errorNetwork");
            } else {
                if (errorMessageEl) { errorMessageEl.textContent = err.message; errorMessageEl.style.display = "block"; }
                if (weatherResultsDiv) weatherResultsDiv.style.display = "none";
                if (forecastSectionEl) forecastSectionEl.style.display = "none";
                if (toggleFavoriteButton) toggleFavoriteButton.style.display = "none";
            }
        } finally {
            showLoadingState(false, isCoordsSearch);
        }
    };

    const displayWeatherData = (data, isCoordsSearch = false) => {
        if (!locationNameEl || !data) return;
        const locationDisplayName = data.locationFound || (isCoordsSearch ? getTranslation("currentLocationLabel") : "N/A");
        locationNameEl.textContent = `${getTranslation("weatherFor")} ${locationDisplayName}`;
        const current = data.forecast;
        if (current) {
            const tempUnit = getTranslation("temperatureUnitC");
            const feelsLikePrefix = getTranslation("feelsLikePrefix");
            if (temperatureEl) temperatureEl.textContent = `${Math.round(current.temperature_c || 0)}${tempUnit}`;
            if (conditionIconEl) {
                if (current.condition_icon) {
                    // ضمان أن البروتوكول موجود وأن الرابط صحيح
                    let iconSrc = current.condition_icon;
                    if (!iconSrc.startsWith('http:') && !iconSrc.startsWith('https://')) {
                        iconSrc = `https:${iconSrc}`;
                    }
                    conditionIconEl.src = iconSrc;
                    conditionIconEl.alt = current.condition_text || "Weather condition";
                    conditionIconEl.style.display = "block";
                } else { 
                    conditionIconEl.style.display = "none"; 
                    conditionIconEl.src = ""; // مسح المصدر إذا لم تكن هناك أيقونة
                }
            }
            if (conditionTextEl) conditionTextEl.textContent = current.condition_text || "N/A";
            if (feelsLikeEl) feelsLikeEl.textContent = `${feelsLikePrefix} ${Math.round(current.feelslike_c || 0)}${tempUnit}`;
            if (humidityValueEl) humidityValueEl.textContent = `${current.humidity !== undefined ? current.humidity : 'N/A'}%`;
            if (windValueEl) windValueEl.textContent = `${current.wind_kph !== undefined ? current.wind_kph : 'N/A'} kph ${current.wind_dir || ''}`;
            if (pressureValueEl) pressureValueEl.textContent = `${current.pressure_mb !== undefined ? current.pressure_mb : 'N/A'} mb`;
            if (visibilityValueEl) visibilityValueEl.textContent = `${current.vis_km !== undefined ? current.vis_km : 'N/A'} km`;
            if (uvIndexValueEl) uvIndexValueEl.textContent = `${current.uv !== undefined ? current.uv : 'N/A'}`;
            if (localtimeValueEl) {
                try {
                    let dateToFormat;
                    if (typeof current.localtime === 'string' && current.localtime.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
                        dateToFormat = new Date(current.localtime.replace(' ', 'T'));
                    } else if (!isNaN(new Date(current.localtime).getTime())) {
                        dateToFormat = new Date(current.localtime);
                    }
                    if (dateToFormat && !isNaN(dateToFormat.getTime())) {
                        localtimeValueEl.textContent = dateToFormat.toLocaleTimeString(window.currentLocale || 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    } else {
                        localtimeValueEl.textContent = (typeof current.localtime === 'string' && current.localtime.includes(':')) ? current.localtime : 'N/A';
                    }
                } catch (e) {
                    console.warn("Error formatting localtime:", e, current.localtime);
                    localtimeValueEl.textContent = (typeof current.localtime === 'string') ? current.localtime : 'N/A';
                }
            }
        }
        if (coordinatesValueEl) {
            coordinatesValueEl.textContent = `Lat: ${data.latitude !== undefined ? parseFloat(data.latitude).toFixed(3) : 'N/A'}, Lon: ${data.longitude !== undefined ? parseFloat(data.longitude).toFixed(3) : 'N/A'}`;
        }
    };

    const getCurrentLocationWeather = () => {
        if (!navigator.geolocation) { displayError("errorGeolocationNotSupported"); return; }
        const iconElement = currentLocationButton ? currentLocationButton.querySelector('i') : null;
        if (currentLocationButton) currentLocationButton.disabled = true;
        if (iconElement) iconElement.classList.add('fa-spin');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                fetchWeather(coords);
                // إزالة الدوران سيتم في finally الخاص بـ fetchWeather
            },
            (error) => {
                console.error("Geolocation error:", error);
                let errorKey = "errorGeolocationGeneric";
                if (error.code === error.PERMISSION_DENIED) { errorKey = "errorGeolocationPermissionDenied"; }
                else if (error.code === error.POSITION_UNAVAILABLE) { errorKey = "errorGeolocationPositionUnavailable"; }
                else if (error.code === error.TIMEOUT) { errorKey = "errorGeolocationTimeout"; }
                displayError(errorKey);
                if (currentLocationButton) currentLocationButton.disabled = false;
                if (iconElement) iconElement.classList.remove('fa-spin');
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
    };

    // --- ربط الأحداث ---
    if (weatherForm) {
        weatherForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const address = addressInput ? addressInput.value : "";
            fetchWeather(address);
        });
    }

    if (currentLocationButton) {
        currentLocationButton.addEventListener("click", getCurrentLocationWeather);
    }

    if (toggleFavoriteButton) {
        toggleFavoriteButton.addEventListener('click', () => {
            if (!currentDisplayedLocationData || !currentDisplayedLocationData.name) return;
            // استخدام اسم الموقع المخزن في dataset الزر لضمان الدقة
            const locationName = toggleFavoriteButton.dataset.locationName || currentDisplayedLocationData.name;
            if (isFavorite(locationName)) {
                removeFavorite(locationName);
            } else {
                addFavorite(currentDisplayedLocationData); // استخدم البيانات المخزنة للإضافة
            }
        });
    }

    if (darkModeToggleButton) {
        darkModeToggleButton.addEventListener('click', toggleDarkMode);
    }
    
    // --- تهيئة الترجمات الاحتياطية ---
    if (!window.clientTranslations) {
        console.warn("Client-side translations not provided by server. Using fallback English.");
        window.clientTranslations = {
            "errorEnterAddress": "Please enter a city name.",
            "errorNetwork": "Network error. Please check your connection.",
            "errorNoForecastData": "No forecast data available for this location.",
            "weatherFor": "Weather for",
            "temperatureUnitC": "°C",
            "feelsLikePrefix": "Feels like:",
            "errorInvalidInputForWeather": "Invalid input for weather search.",
            "errorGeolocationNotSupported": "Geolocation is not supported by your browser.",
            "errorGeolocationGeneric": "Unable to retrieve your location. Ensure location services are enabled.",
            "errorGeolocationPermissionDenied": "Permission to access location was denied. Please enable it in browser settings.",
            "errorGeolocationPositionUnavailable": "Location information is unavailable.",
            "errorGeolocationTimeout": "The request to get user location timed out.",
            "tooltipGetCurrentLocation": "Get weather for current location",
            "tooltipAddToFavorites": "Add to favorites",
            "tooltipRemoveFromFavorites": "Remove from favorites",
            "myFavoritesTitle": "My Favorite Locations",
            "noFavoritesMessage": "No favorite locations saved yet.",
            "favoriteAdded": "{location} added to favorites.",
            "favoriteRemoved": "{location} removed from favorites.",
            "tooltipToggleDarkMode": "Switch to Dark Mode",
            "tooltipToggleLightMode": "Switch to Light Mode",
            "currentLocationLabel": "Your Location",
            "dailyForecastTitle": "Daily Forecast"
        };
    }

    // --- تحميل وعرض الحالة الأولية ---
    initializeTheme();
    renderFavoritesList();
});