(function(exports) {
  var itemHeight = 88;

  function ContactsSource() {
    this.listSize = -1;
    this.content = [];
  }

  function saveContent(url, content, contentType) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', contentType || 'plain/html');
    return new Promise(function(resolve, reject) {
      xhr.onload = function() {
        if (xhr.status < 400) {
          resolve();
        } else {
          reject();
        }
      };
      xhr.send(content);
    });
  }

  function cache(sample, total) {
    // Get the json part
    var toCache = {
      data: sample.map(toJSON),
      total: total
    };
    return saveContent('/model.json', JSON.stringify(toCache), 'application/json;charset=UTF-8');
  }

  function toJSON(mozContact) {
    return {
      id: mozContact.id,
      givenName: mozContact.givenName,
      tel: mozContact.tel
    };
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
    var CHUNK = 10;
    var firstChunkReady = false;
    // We already have some cached content.
    var fromCache = Cache && Cache.data.length > 0;
    if (fromCache) {
      // Change all variables, as fe got our first chunk
      CHUNK = 50;
      firstChunkReady = true;
    }
    cursor.onsuccess = function onsuccess(evt) {
      var contact = evt.target.result;
      if (contact) {
        source.insertAtIndex(index++, contact);
        if (firstChunkReady && index % CHUNK === 0) {
          document.dispatchEvent(new Event('new-content'));
        }

        if (!firstChunkReady && index >= CHUNK && !fromCache) {
          performance.measure('first_chunk');
          firstChunkReady = true;
          // After first chunk increase the chunk to 50
          CHUNK = 50;
          resolve();
        }

        cursor.continue();
      } else {
        console.log('Finished loading ', index);
        performance.measure('all_contacts');
        if (index % CHUNK > 0) {
          document.dispatchEvent(new Event('new-content'));
        }
        onAllContactsLoaded(source);
      }
    };
    cursor.onerror = function onerror(err) {
      console.error('Error: ', err);
      reject();
    };
    return deferred;
  }

  function onAllContactsLoaded(source) {
    cache(source.content.slice(0, 10), source.content.length);
  }

  ContactsSource.prototype.init = function cs_init() {
    var self = this;
    if (Cache && Cache.data && Cache.total) {
      // Put first chunk into the source
      Cache.data.forEach(function(item, index) {
        self.insertAtIndex(index, item);
      });

      // Total contacts (can be updated)
      self.listSize = Cache.total;

      // Launch get the whole list again
      setTimeout(function() {
        getListSize(self);
        fetchAllContacts(self);
      });

      // Mark first chunk ready since we can draw on the list
      performance.measure('first_chunk');
      return Promise.resolve();
    }
    
    var promises = [];

    promises.push(getListSize(this));
    promises.push(fetchAllContacts(this));
    return Promise.all(promises);
  };

  function getListSize(source) {
    return new Promise((resolve, reject) => {
      var request = window.navigator.mozContacts.getCount();
      request.onsuccess = function () {
        source.listSize = this.result;
        resolve();
      };

      request.onerror = reject;
    })
  }

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
