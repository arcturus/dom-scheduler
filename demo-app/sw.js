importScripts('/lib/sww.js');
importScripts('/js/files.js'); // Defines kCacheFiles

var worker = new ServiceWorkerWare();
worker.use({
  'onActivate': function(e) {
    e.waitUntil(self.clients.claim());
  }
});
worker.use(new StaticCacher(kCacheFiles));
worker.use(new SimpleOfflineCache());
worker.init();
