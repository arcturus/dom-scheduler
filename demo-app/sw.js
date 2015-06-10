importScripts('/lib/sww.js');
importScripts('/js/files.js'); // Defines kCacheFiles

var worker = new ServiceWorkerWare();
worker.use(new StaticCacher(kCacheFiles));
worker.use(new SimpleOfflineCache());
worker.init();
