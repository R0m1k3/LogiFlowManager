// Ajout de logs middleware pour debug production
const originalJson = res.json;
res.json = function(data) {
  console.log('📤 Response sent:', {
    status: res.statusCode,
    url: req.url,
    method: req.method,
    dataType: typeof data,
    dataPreview: JSON.stringify(data).substring(0, 200)
  });
  return originalJson.call(this, data);
};
