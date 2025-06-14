// src/app.js

require('dotenv').config();

const express = require("express");
const path = require("path");
const hbs = require("hbs");
const i18n = require("i18n");
const cookieParser = require('cookie-parser');
const helmet = require('helmet'); // لإضافة Security Headers
const rateLimit = require('express-rate-limit'); // لـ Rate Limiting

const gecode = require("./tools/gecode");
const forecast = require("./tools/forecast"); // الآن يُرجع { current, forecastDays, locationData }

const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares الأساسية ---
app.use(helmet()); // استخدام Helmet مع الإعدادات الافتراضية (جيدة للبدء)
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public"))); // تحديد مسار للملفات الثابتة

// --- إعداد i18n ---
i18n.configure({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  cookie: 'locale',
  queryParameter: 'lang',
  directory: path.join(__dirname, '../locales'),
  autoReload: true,
  syncFiles: true,
  objectNotation: true,
});
app.use(i18n.init);

// --- إعداد Handlebars ---
app.set("view engine", "hbs");
// const viewsPath = path.join(__dirname, '../templates/views');
// app.set('views', viewsPath);

// تسجيل helpers لـ Handlebars
hbs.registerHelper('__', function () { return i18n.__.apply(this, arguments); });
hbs.registerHelper('__n', function () { return i18n.__n.apply(this, arguments); });
hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('getFullYear', () => new Date().getFullYear());

// Middleware لجعل متغيرات i18n و clientTranslations متاحة في جميع القوالب
app.use((req, res, next) => {
  res.locals.locale = req.getLocale();
  res.locals.locales = i18n.getLocales();
  res.locals.clientTranslations = {
    errorEnterAddress: res.__("errorEnterAddress"),
    errorNetwork: res.__("errorNetworkMessage"),
    errorNoForecastData: res.__("errorNoForecastDataMessage"),
    weatherFor: res.__("weatherFor"),
    temperatureUnitC: res.__("temperatureUnitC"),
    feelsLikePrefix: res.__("feelsLikePrefix"),
    errorInvalidInputForWeather: res.__("errorInvalidInputForWeather"),
    errorGeolocationNotSupported: res.__("errorGeolocationNotSupported"),
    errorGeolocationGeneric: res.__("errorGeolocationGeneric"),
    errorGeolocationPermissionDenied: res.__("errorGeolocationPermissionDenied"),
    errorGeolocationPositionUnavailable: res.__("errorGeolocationPositionUnavailable"),
    errorGeolocationTimeout: res.__("errorGeolocationTimeout"),
    tooltipGetCurrentLocation: res.__("tooltipGetCurrentLocation"),
    tooltipAddToFavorites: res.__("tooltipAddToFavorites"),
    tooltipRemoveFromFavorites: res.__("tooltipRemoveFromFavorites"),
    myFavoritesTitle: res.__("myFavoritesTitle"),
    noFavoritesMessage: res.__("noFavoritesMessage"),
    favoriteAdded: res.__("favoriteAdded"), // قد تستخدمها لـ toast notifications لاحقًا
    favoriteRemoved: res.__("favoriteRemoved"),
    tooltipToggleDarkMode: res.__("tooltipToggleDarkMode"),
    tooltipToggleLightMode: res.__("tooltipToggleLightMode"),
    currentLocationLabel: res.__("currentLocationLabel"),
    dailyForecastTitle: res.__("dailyForecastTitle") // لعنوان قسم التوقعات
  };
  next();
});

// --- Rate Limiter (يطبق على مسار /weather) ---
const weatherApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // حد 100 طلب لكل IP خلال 15 دقيقة
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests for weather data from this IP, please try again after 15 minutes.' },
    // يمكنك جعل الرسالة تستخدم i18n إذا قمت بتمرير req للكائن handler
    // handler: (req, res, next, options) => res.status(options.statusCode).send({error: req.__('errorRateLimit')})
});


// --- المسارات ---
app.get("/", (req, res) => {
  res.render("index");
});

app.get('/lang/:locale', (req, res) => {
  const newLocale = req.params.locale;
  if (i18n.getLocales().includes(newLocale)) {
    res.cookie('locale', newLocale, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
  }
  res.redirect('back');
});

app.get("/weather", weatherApiLimiter, async (req, res) => { // تطبيق Rate Limiter هنا
  const { address, lat, lon } = req.query;

  if (!address && (!lat || !lon)) {
    return res.status(400).send({
      error: res.__("errorProvideAddressOrCoords"),
    });
  }

  try {
    let initialGeoData; // البيانات الأولية من geocode أو الإحداثيات المباشرة
    let initialLocationName; // اسم الموقع المستخدم للبحث أو اسم عام للموقع الحالي

    if (address) {
      initialGeoData = await gecode(address); // geocode.js يجب أن يرجع { latitude, longitude, locationName }
      initialLocationName = initialGeoData.locationName || address;
    } else {
      // استخدام الإحداثيات المباشرة
      initialGeoData = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        locationName: res.__("currentLocationLabel") // اسم مبدئي
      };
      initialLocationName = initialGeoData.locationName;
    }

    // طلب الطقس والتوقعات باستخدام الإحداثيات (إما من geocode أو مباشرة)
    // forecast.js الآن يرجع { current: {...}, forecastDays: [...], locationData: {...} }
    const weatherApiResponse = await forecast(initialGeoData.longitude, initialGeoData.latitude);

    // استخدام اسم الموقع من weatherApiResponse.locationData إذا كان متاحًا (أكثر دقة)
    // أو العودة إلى الاسم من geocode أو الاسم العام
    const finalLocationName = (weatherApiResponse.locationData && weatherApiResponse.locationData.name)
      ? `${weatherApiResponse.locationData.name}${weatherApiResponse.locationData.region ? ', ' + weatherApiResponse.locationData.region : ''}${weatherApiResponse.locationData.country ? ', ' + weatherApiResponse.locationData.country : ''}`.replace(/, $/, '').replace(/, ,/g, ',')
      : initialLocationName;

    res.send({
      locationProvided: address || `${res.__("coordinates")}: ${initialGeoData.latitude.toFixed(3)}, ${initialGeoData.longitude.toFixed(3)}`,
      locationFound: finalLocationName,
      latitude: weatherApiResponse.locationData.lat || initialGeoData.latitude, // تفضيل الإحداثيات من WeatherAPI
      longitude: weatherApiResponse.locationData.lon || initialGeoData.longitude,
      current: weatherApiResponse.current,       // الطقس الحالي
      forecastDays: weatherApiResponse.forecastDays // مصفوفة التوقعات
    });

  } catch (error) {
    console.error(`Error in /weather route for query: ${JSON.stringify(req.query)} - Error: ${error.message}`);
    let errorMessage = error.message;
    let statusCode = 500;

    if (error.message) {
        if (error.message.toLowerCase().includes("unable to find location") || error.message.toLowerCase().includes("no results")) {
            statusCode = 404;
        } else if (error.message.toLowerCase().includes("unable to connect") || error.message.toLowerCase().includes("network error")) {
            statusCode = 503;
        } else if (error.message.toLowerCase().includes("api key") || error.message.toLowerCase().includes("service configuration error") || error.message.toLowerCase().includes("key not found")) {
            statusCode = 500; // خطأ خادم بسبب التكوين
            errorMessage = res.__("errorServiceConfig"); // رسالة عامة للمستخدم
        } else if (error.message.toLowerCase().includes("limit reached") || (error.response && error.response.status === 429) ) {
            statusCode = 429; // Too Many Requests
             // الرسالة من rate limiter أو من API الفعلي
        } else if (error.response && error.response.status) { // إذا كان الخطأ من axios مع استجابة
            statusCode = error.response.status;
        }
    } else {
        errorMessage = res.__("errorFetchingWeather", { details: "Unknown server error" });
    }
    
    res.status(statusCode).send({ error: errorMessage });
  }
});

// مسار 404 (يجب أن يكون في النهاية)
app.get("*", (req, res) => {
  res.status(404).render("404");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});