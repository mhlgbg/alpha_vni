export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://admin.alphavni.com', // Strapi admin qua IIS
        'https://admin.alphavni.com', // Strapi admin qua IIS
        'http://one.alphavni.com', // nếu frontend đang chạy port này
        'https://one.alphavni.com', // nếu frontend đang chạy port này
        'http://alphavni.com',      // nếu có domain không kèm port
        'https://alphavni.com',     // nếu sau này bật https
        'http://localhost:5173',   // frontend local
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: '*',
      credentials: true,
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
