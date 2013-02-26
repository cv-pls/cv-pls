/*jslint plusplus: true, white: true, browser: true, devel: true */
/*global CvPlsHelper */

/**
 * Consumer for the Stack Exchange API
 */
(function() {

  "use strict";

  var baseUrl, apiKey, requestMethods;

  /**
   * @var string The base URL to use for all API requests
   */
  baseUrl = 'http://api.stackexchange.com/2.1/';

  /**
   * @var string The application API key
   */
  apiKey = 'ILSB6JuDQcCfYhS7KP2lqQ((';

  /**
   * @var object Map of defined request methods and their meta-data
   */
  requestMethods = {
    questions: {
      urlPath: 'questions',
      defaultFilter: '!OkDMNW6hcAehLUdFpwe2cE-)0uHgjXN2D)q2a.mEHHR',
      maxIds: 100,
      requireSite: true
    },

    userRep: {
      urlPath: 'users',
      defaultFilter: '!*MxOyCrU5uhunVlI',
      maxIds: 0,
      requireSite: true
    }
  };

  /**
   * Create a query string from an object
   *
   * @param object map    The source object
   * @param string prefix String to prefix keys, used in recursion
   *
   * @return string The query string
   */
  function buildQueryString(map, prefix) {
    var key, inner, result = [];
    prefix = prefix || false;
    function getPrefix(key) {
      return prefix ? prefix+'['+key+']' : key;
    }

    for (key in map) {
      if (map.hasOwnProperty(key)) {
        if (typeof map[key] === 'object') {
          inner = buildQueryString(map[key], getPrefix(key));
          if (inner !== '') {
            result.push(inner);
          }
        } else if (typeof map[key] !== 'function') {
          result.push(encodeURIComponent(getPrefix(key)) + '=' + encodeURIComponent(map[key]));
        }
      }
    }

    return '?' + result.join('&');
  }

  /**
   * Validate a parameters object
   *
   * @param object params The parameters object
   */
  function validateRequestParams(params) {
    // Validate general params
    if (params.type === undefined || requestMethods[params.type] === undefined) {
      throw new Error('Unknown API method');
    }
    if (params.success === undefined) {
      throw new Error('Success callback must be supplied');
    }

    // Validate URL params
    if (requestMethods[params.type].requireSite && params.query.site === undefined) {
      throw new Error('The specified method requires a target site');
    }
    if (requestMethods[params.type].maxIds) {
      if (params.ids === undefined) {
        throw new Error('The specified method requires an ID list');
      } else if (params.ids.length > requestMethods[params.type].maxIds) {
        throw new Error('The specified method accepts a maximum of '+requestMethods[params.type].maxIds+' IDs');
      }
    } else if (params.ids !== undefined) {
      throw new Error('The specified method does not accept an ID list');
    }
  }

  /**
   * Build a URL from a parameters object
   *
   * @param object params The parameters object
   *
   * @return string The generated URL
   */
  function makeRequestUrl(params) {
    var query, ids = '';

    query = params.query || {};
    query.key = apiKey;

    if (query.filter === undefined && requestMethods[params.type].defaultFilter !== undefined) {
      query.filter = requestMethods[params.type].defaultFilter;
    }

    if (params.ids) {
      query.pagesize = params.ids.length;
      ids = '/' + params.ids.join(';');
    }

    return baseUrl + requestMethods[params.type].urlPath + ids + buildQueryString(query);
  }

  /**
   * Make an ajax request to the SE API
   *
   * @param string url    The API URL
   * @param object params The parameters object
   */
  function doAPIRequest(url, params) {
    var xhr = new XMLHttpRequest(),
        response = this.collectionFactory.create();

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        try {
          response.items = JSON.parse(xhr.responseText).items;
        } catch(e) {
          if (typeof params.error === 'function') {
            params.error.call(null, e, xhr);
          }
          return;
        }

        params.success.call(null, response);
      }
    };

    xhr.open('GET', url, true);
    xhr.send(null);
  }

  /**
   * Constructor
   *
   * @param CvPlsHelper.CollectionFactory collectionFactory Factory that makes collection objects
   */
  CvPlsHelper.StackApi = function(collectionFactory) {
    this.collectionFactory = collectionFactory;
  };

  /**
   * Make an API request
   *
   * @param object params The parameters object
   */
  CvPlsHelper.StackApi.prototype.makeRequest = function(params) {
    var url;

    validateRequestParams(params);
    url = makeRequestUrl(params);
    
    doAPIRequest.call(this, url, params);
  };

}());