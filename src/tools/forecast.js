// src/tools/forecast.js

const axios = require('axios');

const forecast = (longitude, latitude, days = 3) => { // أضفنا بارامتر days مع قيمة افتراضية
  return new Promise(async (resolve, reject) => {
    const apiKey = process.env.WEATHERAPI_KEY;
    if (!apiKey) {
      const errorMessage = "WeatherAPI key is not configured. Please set WEATHERAPI_KEY in .env file.";
      console.error(errorMessage);
      return reject(new Error("Service configuration error. Weather service key not found."));
    }

    const coordinates = `${latitude},${longitude}`;
    // استخدام نقطة نهاية /forecast.json بدلاً من /current.json
    // وإضافة بارامتر &days=
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${coordinates}&days=${days}&aqi=no&alerts=no`;

    try {
      const response = await axios.get(url);

      // التحقق من وجود البيانات الأساسية المتوقعة
      if (response.data && response.data.current && response.data.location && response.data.forecast && response.data.forecast.forecastday) {
        const currentData = response.data.current;
        const locationData = response.data.location;
        const forecastData = response.data.forecast.forecastday;

        // تجميع بيانات الطقس الحالية
        const currentWeatherData = {
          location: locationData.name,
          region: locationData.region,
          country: locationData.country,
          localtime: locationData.localtime, // الوقت المحلي للموقع
          temperature_c: currentData.temp_c,
          temperature_f: currentData.temp_f,
          is_day: currentData.is_day,
          condition_text: currentData.condition.text,
          condition_icon: currentData.condition.icon,
          wind_kph: currentData.wind_kph,
          wind_mph: currentData.wind_mph,
          wind_degree: currentData.wind_degree,
          wind_dir: currentData.wind_dir,
          pressure_mb: currentData.pressure_mb,
          precip_mm: currentData.precip_mm,
          humidity: currentData.humidity,
          cloud: currentData.cloud,
          feelslike_c: currentData.feelslike_c,
          feelslike_f: currentData.feelslike_f,
          vis_km: currentData.vis_km,
          uv: currentData.uv,
          // يمكنك إضافة المزيد من currentData إذا لزم الأمر
        };

        // تجميع بيانات التوقعات اليومية
        const dailyForecasts = forecastData.map(dayEntry => {
          const day = dayEntry.day;
          return {
            date: dayEntry.date, // تاريخ اليوم YYYY-MM-DD
            date_epoch: dayEntry.date_epoch, // تاريخ اليوم كـ timestamp
            maxtemp_c: day.maxtemp_c,
            maxtemp_f: day.maxtemp_f,
            mintemp_c: day.mintemp_c,
            mintemp_f: day.mintemp_f,
            avgtemp_c: day.avgtemp_c,
            maxwind_kph: day.maxwind_kph,
            totalprecip_mm: day.totalprecip_mm,
            totalsnow_cm: day.totalsnow_cm,
            avgvis_km: day.avgvis_km,
            avghumidity: day.avghumidity,
            daily_will_it_rain: day.daily_will_it_rain, // 1 = Yes, 0 = No
            daily_chance_of_rain: parseInt(day.daily_chance_of_rain, 10), // % احتمالية المطر
            daily_will_it_snow: day.daily_will_it_snow,
            daily_chance_of_snow: parseInt(day.daily_chance_of_snow, 10),
            condition_text: day.condition.text,
            condition_icon: day.condition.icon,
            uv: day.uv,
            // يمكنك إضافة المزيد من day.day أو dayEntry.astro (للشروق والغروب) إذا أردت
            astro: {
                sunrise: dayEntry.astro.sunrise,
                sunset: dayEntry.astro.sunset,
                moonrise: dayEntry.astro.moonrise,
                moonset: dayEntry.astro.moonset,
                moon_phase: dayEntry.astro.moon_phase,
            }
          };
        });

        resolve({
          current: currentWeatherData,
          forecastDays: dailyForecasts,
          // يمكنك أيضًا إرجاع معلومات الموقع إذا كانت مفيدة بشكل منفصل
          locationData: {
            name: locationData.name,
            region: locationData.region,
            country: locationData.country,
            lat: locationData.lat,
            lon: locationData.lon,
            tz_id: locationData.tz_id,
            localtime_epoch: locationData.localtime_epoch,
            localtime: locationData.localtime
          }
        });

      } else if (response.data && response.data.error) {
        // WeatherAPI يرجع الأخطاء في response.data.error.message
        reject(new Error(`Weather service error: ${response.data.error.message}`));
      }
      else {
        reject(new Error("Unable to fetch weather forecast data. Invalid response structure from weather service."));
      }
    } catch (error) {
      console.error("Axios error in forecast:", error.message);
      let apiErrorMessage = "Weather service request failed.";
      if (error.response) {
        apiErrorMessage = `Weather service error: Status ${error.response.status}.`;
         if (error.response.data && error.response.data.error && error.response.data.error.message) {
            apiErrorMessage += ` Message: ${error.response.data.error.message}`;
        } else if (error.response.data && error.response.data.message) {
            apiErrorMessage += ` Message: ${error.response.data.message}`;
        }
      } else if (error.request) {
        apiErrorMessage = "Unable to connect to weather service. Please check your network connection.";
      } else {
        apiErrorMessage = `Weather request setup failed: ${error.message}`;
      }
      reject(new Error(apiErrorMessage));
    }
  });
};

module.exports = forecast;