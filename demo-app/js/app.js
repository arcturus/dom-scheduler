(function() {
  var debug = false;
  var headerHeight = 50;
  var maxItemCount = 28;

  window.addEventListener('load', function() {
    var listContainer = document.querySelector('section');

    var maestro = new DomScheduler();
    //var source = new BaconSource();
    //var list = new ScheduledList(listContainer, source, maestro);
    var source = new ContactsSource();
    var list = null;
    source.init().then(function() {
      setTimeout(saveFirstChunk);
      list = new ScheduledList(listContainer, source, maestro);
      list.list.addEventListener('item-selected', openGaiaDialog);
      document.addEventListener('new-content', function() {
        list.reloadData();
      })
      updateHeader();
    });
    var dialog = document.querySelector('gaia-dialog-alert');

    function updateHeader() {
      return maestro.mutation(function() {
        var h1 = document.querySelector('h1');
        h1.textContent = 'Main List (' + source.fullLength() + ')';
        h1.scrollTop; // flush
      });
    }

    function saveFirstChunk() {
      
    }

    function clearNewIndicator() {
      var h1After = document.querySelector('#h1-after');

      if (h1After.dataset.anim == 'reveal') {
        maestro.transition(function() {
          h1After.dataset.anim = 'hide';
        }, h1After, 'animationend');
      }
    }
    listContainer.addEventListener('top-reached', clearNewIndicator);

    function updateNewIndicator() {
      var h1After = document.querySelector('#h1-after');
      if (h1After.dataset.anim == 'reveal') {
        return;
      }

      maestro.transition(function() {
        h1After.dataset.anim = 'reveal';
      }, h1After, 'animationend');
    }
    listContainer.addEventListener('hidden-new-content', updateNewIndicator);

    function openGaiaDialog(evt) {
      var detail = evt.detail;
      var li = source.getRecordAt(detail.index);
      dialog.textContent = li.title + ' item clicked!';
      dialog.open(detail.clickEvt);
    }

    // function newContentHandler() {
    //   var newContent = {
    //     title: 'NEW Bacon ' + Date.now().toString().slice(7, -1),
    //     body: 'Turkey BLT please.'
    //   };
    //
    //   source.insertAtIndex(0, newContent);
    //   list.insertedAtIndex(0);
    //
    //   updateHeader();
    // }
    //
    // setInterval(newContentHandler, 15000);
    // window.addEventListener('new-content', newContentHandler);
    //
    // window.pushNewContent = function() {
    //   window.dispatchEvent(new CustomEvent('new-content'));
    // };

    var button = document.querySelector('button');
    button.addEventListener('touchend', function() {
      toggleTransitioning()
        .then(performInstall)
        .then(updateText)
        .then(toggleTransitioning);
    });

    function performInstall() {
      return new Promise(function(resolve, reject) {
        var req = navigator.mozApps.getSelf();
        req.onerror = reject;
        req.onsuccess = function() {
          if (!req.result) {
            var installURL = document.location.toString() + 'manifest.webapp';
            var installReq = window.navigator.mozApps.install(installURL);
            installReq.onsuccess = resolve;
            installReq.onerror = reject;
          } else{
            alert('App already installed');
          }
        };
      });
    }

    function updateText() {
      return maestro.mutation(function() {
        var req = navigator.mozApps.getSelf();
        req.onsuccess = function() {
          button.textContent = req.result ? 'Installed' : 'Install';
        }
      });
    }

    function toggleTransitioning() {
      return maestro.feedback(function() {
        button.classList.toggle('transitioning');
      }, button, 'transitionend');
    }

    var dependencies = ['gaia-dialog/gaia-dialog.js',
      'gaia-dialog/gaia-dialog-alert.js'];

    function loadDependecies() {
      LazyLoader.load(dependencies, () => {
        var gaiaDialogElements = document.querySelectorAll('gaia-dialog-alert');
        Array.prototype.forEach.call(gaiaDialogElements, elm => {
            elm.attachBehavior(maestro);
        });
      });
    }

    //loadDependecies();
    checkAndInstallSW();
  });

  function checkAndInstallSW() {
    if (!navigator.serviceWorker) {
      return;
    }
    var req = navigator.mozApps.getSelf();
    req.onsuccess = function() {
      if (req.result) {
        navigator.serviceWorker.getRegistration().then(function(reg) {
          if (!reg) {
            navigator.serviceWorker.register('sw.js');
          }
        });
      }
    };
  }
})();
