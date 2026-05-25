const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API مسابقات تایپ و جام جهانی',
            version: '1.0.0',
            description: 'مستندات API پروژه شما',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'سرور توسعه',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js', './controllers/*.js'], // مسیر فایل‌های حاوی کامنت
};

const specs = swaggerJsdoc(options);
module.exports = specs;