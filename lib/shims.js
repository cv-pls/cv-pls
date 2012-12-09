/*jslint plusplus: true, white: true, browser: true */

(function() {

  'use strict';

  if (!Function.prototype.bind) {
    // Function.bind() shim
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
    Function.prototype.bind = function (oThis) {
      if (typeof this !== "function") {
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }
      var aArgs = Array.prototype.slice.call(arguments, 1), 
          FToBind = this, 
          FNOP = function () {},
          FBound = function () {
            return FToBind.apply(this instanceof FNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
          };
      FNOP.prototype = this.prototype;
      FBound.prototype = new FNOP();
      return FBound;
    };
  }

}());