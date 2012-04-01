function Settings() {
  this.normalizeDefaultTrue = function(value) {
    if (value == 'true' || value === null) {
      return true;
    }

    return false;
  };

  this.normalizeDefaultFalse = function(value) {
    if (value == 'false' || value === null) {
      return false;
    }

    return true;
  };

  this.getSetting = function(key) {
    return localStorage.getItem(key);
  };

  this.saveSetting = function(key, value) {
    localStorage.setItem(key, value);
  };

  this.deleteSetting = function(key) {
    localStorage.remove(key);
  }

  this.truncate = function() {
    localStorage.clear();
  }
}