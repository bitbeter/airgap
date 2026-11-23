// A self-contained example for the «نمونه» button. It is valid JSON and
// deliberately includes a number beyond Number.MAX_SAFE_INTEGER, Persian
// strings, escapes, nested objects, and empty containers.
export const sampleJson = String.raw`{
  "کاربران": [
    {
      "شناسه": 1,
      "نام": "علی رضایی",
      "نقش": "مدیر",
      "فعال": true,
      "امتیاز": 12345678901234567890,
      "آدرس": {
        "شهر": "تهران",
        "کدپستی": "1234567890"
      }
    },
    {
      "شناسه": 2,
      "نام": "سارا محمدی",
      "نقش": "ویرایشگر",
      "فعال": false,
      "امتیاز": 42,
      "برچسب‌ها": ["تست", "نمونه"]
    }
  ],
  "تنظیمات": {
    "زبان": "فارسی",
    "میانبر": "Ctrl+Enter",
    "مسیر": "C:\\Users\\Ali",
    "توضیح": "خط اول\nخط دوم",
    "نقل‌قول": "او گفت: \"سلام\"",
    "یونیکد": "\u06A9\u0627\u0631"
  },
  "خالی": {},
  "آرایهٔ خالی": []
}`
