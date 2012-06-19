function Settings() {
  this.normalizeDefaultTrue = function(value) {
    if (value == 'true' || value === true || value === null) {
      return true;
    }

    return false;
  };

  this.normalizeDefaultFalse = function(value) {
    if (value == 'false' || value === false || value === null) {
      return false;
    }

    return true;
  };

  this.normalizeDefaultNumeric = function(value, defaultValue) {
    if (value === null || isNaN(value)) {
      return defaultValue;
    }

    return value;
  }

  this.normalizeDefaultArray = function(value) {
    if (value === null  || !value.length) {
      return [];
    }

    return JSON.parse(value);
  }

  this.normalizeDefaultObject = function(value) {
    if (value === null || !value.length) {
      return {};
    }

    return JSON.parse(value);
  }

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