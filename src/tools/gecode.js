// src/tools/geocode.js

const axios = require('axios');

const geocode = (address) => {
  return new Promise(async (resolve, reject) => {
    const apiKey = process.env.OPENCAGE_API_KEY;
    if (!apiKey) {
      // هذا خطأ في تكوين الخادم، وليس خطأ من المستخدم
      console.error("OpenCage API key is not configured. Please set OPENCAGE_API_KEY in .env file.");
      return reject(new Error("Service configuration error. Geocoding service key not found."));
    }

    const encodedAddress = encodeURIComponent(address);
    // استخدمنا limit=1 للحصول على أفضل نتيجة واحدة، و no_annotations=1 لتقليل حجم البيانات
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${apiKey}&limit=1&no_annotations=1`;

    try {
      const response = await axios.get(url);

      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        if (result.geometry && typeof result.geometry.lat === 'number' && typeof result.geometry.lng === 'number') {
          resolve({
            latitude: result.geometry.lat,
            longitude: result.geometry.lng,
            locationName: result.formatted || address, // الاسم المنسق من API أو العنوان الأصلي كاحتياطي
          });
        } else {
          // لم يتم العثور على إحداثيات صالحة في النتيجة
          reject(new Error("Unable to find location. Coordinates not found in API response."));
        }
      } else if (response.data && response.data.status && response.data.status.code === 402) {
          // مثال: تجاوز حد الاستخدام لـ OpenCage
          console.error("OpenCage API Error: Quota exceeded or similar issue.", response.data.status.message);
          reject(new Error("Geocoding service limit reached. Please try again later."));
      } else if (response.data && response.data.status && response.data.status.message) {
        // إذا أرجع الـ API خطأً محددًا برسالة واضحة
        reject(new Error(`Geocoding error: ${response.data.status.message}`));
      }
      else {
        // لا توجد نتائج أو استجابة غير متوقعة
        reject(new Error("Unable to find location. Try another search. (No results or unexpected response)"));
      }
    } catch (error) {
      console.error("Axios error in geocode:", error.message);
      if (error.response) {
        // خطأ من الـ API (مثل 4xx, 5xx غير ما تم التعامل معه أعلاه)
        let apiErrorMessage = `Geocoding service error: Status ${error.response.status}.`;
        if (error.response.data && error.response.data.status && error.response.data.status.message) {
            apiErrorMessage += ` Message: ${error.response.data.status.message}`;
        } else if (error.response.data && error.response.data.message) { // بعض APIs ترجع الخطأ في data.message
            apiErrorMessage += ` Message: ${error.response.data.message}`;
        }
        reject(new Error(apiErrorMessage));
      } else if (error.request) {
        // الطلب تم إرساله ولكن لم يتم تلقي استجابة
        reject(new Error("Unable to connect to geocoding service. Please check your network connection."));
      } else {
        // خطأ آخر حدث أثناء إعداد الطلب
        reject(new Error(`Geocoding request failed: ${error.message}`));
      }
    }
  });
};

module.exports = geocode;