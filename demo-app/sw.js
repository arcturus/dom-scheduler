importScripts('/lib/sww.js');
importScripts('/lib/sww-raw-cache.js');
importScripts('/js/files.js'); // Defines kCacheFiles

var worker = new ServiceWorkerWare();
worker.use('/model.json',{
  'onActivate': function(e) {
    e.waitUntil(self.clients.claim());
  }
});
worker.use(new RawCache({
  cacheName: 'rawCache'
}));
worker.use(new StaticCacher(kCacheFiles));
worker.use(new SimpleOfflineCache());
worker.init();
