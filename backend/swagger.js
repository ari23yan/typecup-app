const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'API جام جهانی',
        description: 'مستندات اتوماتیک سرویس شرط‌بندی',
        version: '1.0.0',
    },
    host: 'localhost:3000',
    basePath: '/api',
    schemes: ['http', 'https'],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'توکن JWT خود را وارد کنید. مثال: "Bearer {token}"',
        },
    },
};

const outputFile = './swagger-output.json';

// ⚠️ اینجا مسیر رو به فایل اصلی برنامه تغییر بدید
// مثلاً اگه فایل اصلی server.js هست:
const endpointsFiles = ['./server.js'];  // یا './index.js' یا './app.js'

swaggerAutogen(outputFile, endpointsFiles, doc);