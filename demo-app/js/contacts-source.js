(function(exports) {
  var itemHeight = 88;

  function ContactsSource() {
    this.listSize = -1;
    this.content = [];
  }

  function fetchAllContacts(source) {
    var options = {
      sortBy: 'givenName',
      sortOrder: 'ascending'
    };
    var index = 0;
    var resolve, reject;
    var deferred = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });
    var cursor = navigator.mozContacts.getAll(options);
    var FIRST_CHUNK = 50;
    var firstChunkReady = false;
    cursor.onsuccess = function onsuccess(evt) {
      var contact = evt.target.result;
      if (contact) {
        source.insertAtIndex(index++, contact);
        if (firstChunkReady && index % FIRST_CHUNK === 0) {
          var event = new Event('new-content');
          document.dispatchEvent(event);
        }

        if (!firstChunkReady && index >= FIRST_CHUNK) {
          firstChunkReady = true;
          resolve();
        }

        cursor.continue();
      } else {
        console.log('Finished loading ', index);
        reject();
      }
    };
    cursor.onerror = function onerror(err) {
      console.error('Error: ', err);
    };
    return deferred;
  }

  ContactsSource.prototype.init = function cs_init() {
    var promises = [];

    promises.push(new Promise((resolve, reject) => {
      var request = window.navigator.mozContacts.getCount();
      var self = this;
      request.onsuccess = function () {
        self.listSize = this.result;
        resolve();
      };

      request.onerror = reject;
    }));
    promises.push(fetchAllContacts(this));
    return Promise.all(promises);
  };

  ContactsSource.prototype.populateItem = function cs_populdateItem(item, i) {
    var title = item.firstChild;
    var body = title.nextSibling;
    var contact = this.content[i];

    if (contact) {
      title.firstChild.data = contact.givenName ?
       contact.givenName[0] : 'No name';
      body.firstChild.data = contact.tel && contact.tel.length > 0 ?
       contact.tel[0].value : 'No phone';
    } else {
      title.firstChild.data = 'Loading';
      body.firstChild.data = '';
    }
  },

  ContactsSource.prototype.indexAtPosition = function cs_indexAtPosition(pos) {
    return Math.min(this.content.length - 1,
                    Math.max(0,
                             Math.floor(pos / itemHeight)));
  },

  ContactsSource.prototype.positionForIndex = function cs_positionForIndex(i) {
    return i * itemHeight;
  },

  ContactsSource.prototype.fullLength = function cs_fullLength() {
    return this.listSize;
  },

  ContactsSource.prototype.itemHeight = function cs_itemHeight() {
    return itemHeight;
  },

  ContactsSource.prototype.fullHeight = function cs_fullHeight() {
    return this.content.length * itemHeight;
  },

  ContactsSource.prototype.insertAtIndex = function cs_insertAtIndex(index, record) {
    this.content.splice(index, 0, record);
  },

  ContactsSource.prototype.replaceAtIndex = function cs_replaceAtIndex(index, record) {
    this.content.splice(index, 1, record);
  },

  ContactsSource.prototype.removeAtIndex = function cs_removeAtIndex(index) {
    return this.content.splice(index, 1)[0];
  }

  exports.ContactsSource = ContactsSource;
})(this);
