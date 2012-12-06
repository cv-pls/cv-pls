/*jslint plusplus: true, white: true, browser: true */

var Animator;

(function() {

    'use strict';

    var easingFunctions = {
        linear: function(progress) {
            return progress;
        },
        accel: function(progress) {
            return Math.pow(progress, 3);
        },
        decel: function(progress) {
            return 1 - Math.pow(1 - progress, 3);
        },
        sudden: function(progress) {
            return Math.pow(progress, 10);
        },
        arc: function(progress) {
            if (progress < 0.5) {
                return Math.pow(progress * 2, 3) / 2;
            } else {
                return 1 - Math.pow(2 - progress * 2, 3) / 2;
            }
        }
    };

    function getStyle(element, property) {
        var result = null;
        if (document.defaultView && document.defaultView.getComputedStyle) {
            property = property.replace(/[A-Z]/g, function(match) { return '-' + match.toLowerCase(); });
            result = document.defaultView.getComputedStyle(element, null).getPropertyValue(property);
        } else if (element.currentStyle) {
            property = property.replace(/-([a-z])/g, function(match, group1) { return group1.toUpperCase(); });
            result = element.currentStyle[property];
        }
        return result;
    }

    function normaliseEasing(easingFunc, progress) {
        var result = easingFunc(progress);
        if (result > 1) {
            result = 1;
        } else if (result < 0) {
            result = 0;
        }
        return result;
    }

    function defaultAnimationFrame(newValue, animation) {
        if (typeof animation.units === 'string') {
            newValue = String(newValue) + animation.units;
        }
        this.style[animation.css] = newValue;
    }

    function triggerAnimationFrame(element, progress, animations) {
        var i;
        for (i in animations) {
            if (animations.hasOwnProperty(i)) {
                animations[i].frameFunc.call(element, animations[i].startValue + ((animations[i].endValue - animations[i].startValue) * normaliseEasing(animations[i].easingFunc, progress)), animations[i]);
            }
        }
    }

    function frameController(opts) {
        var self = this,
            progress = 1 - ((opts.endTime - (new Date()).getTime()) / opts.totalTime);
        this.timeout = null;
        if (progress < 1) {
            triggerAnimationFrame(this.element, progress, opts.animations);
            this.timeout = setTimeout(function() {
                frameController.call(self, opts);
            }, opts.frameInterval);
        } else {
            triggerAnimationFrame(this.element, 1, opts.animations);
            if (typeof opts.complete === 'function') {
                opts.complete.call(self);
            }
        }
    }

    function normaliseFrames(opts) {
        opts.frameRate = opts.frameRate !== undefined && parseFloat(opts.frameRate) ? parseFloat(opts.frameRate) : 30;
        opts.frameInterval = (1 / opts.frameRate) * 1000;
    }

    function normaliseTime(opts) {
        opts.totalTime = opts.totalTime !== undefined && parseFloat(opts.totalTime) ? Math.floor(parseFloat(opts.totalTime)) : 1000;
        opts.endTime = (new Date()).getTime() + opts.totalTime;
    }

    function normaliseAnimationsArray(opts) {
        var animation = {};
        if (opts.css !== undefined) {
            animation.css = opts.css;
        }
        if (opts.startValue !== undefined) {
            animation.startValue = opts.startValue;
        }
        if (opts.endValue !== undefined) {
            animation.endValue = opts.endValue;
        }
        if (opts.frameFunc !== undefined) {
            animation.frameFunc = opts.frameFunc;
        }
        if (opts.easing !== undefined) {
            animation.easing = opts.easing;
        }
        if (opts.easingFunc !== undefined) {
            animation.easingFunc = opts.easingFunc;
        }
        opts.animations = [animation];
    }

    function normaliseAnimation(animation) {
        if (animation.endValue === undefined) {
            throw new Error('No end value specified');
        }
        if (typeof animation.endValue === 'string') {
            animation.endValue.replace(/^\s*(\d+(?:\.\d+)?)([a-z]+)?\s*$/i, function(match, value, units) {
                animation.endValue = parseFloat(value);
                animation.units = units;
            });
        }
        animation.frameFunc = typeof animation.frameFunc === 'function' ? animation.frameFunc : defaultAnimationFrame;
        if (animation.startValue !== undefined) {
            animation.startValue = parseFloat(animation.startValue);
        } else if (animation.css !== undefined && getStyle(this.element, animation.css)) {
            animation.startValue = parseFloat(getStyle(this.element, animation.css));
        } else {
            animation.startValue = 0;
        }
        if (typeof animation.easingFunc !== 'function') {
            if (typeof animation.easing === 'string' && typeof easingFunctions[animation.easing.toLowerCase()] === 'function') {
                animation.easingFunc = easingFunctions[animation.easing.toLowerCase()];
            } else {
                animation.easingFunc = easingFunctions.linear;
            }
        }
    }

    function normaliseAnimations(opts) {
        var i;
        for (i in opts.animations) {
            if (opts.animations.hasOwnProperty(i)) {
                try {
                    normaliseAnimation.call(this, opts.animations[i]);
                } catch(e) {
                    throw new Error(e.message + ' in animation ' + i);
                }
            }
        }
    }

    function processOpts(opts) {
        normaliseFrames.call(this, opts);
        normaliseTime.call(this, opts);
        if (typeof opts.animations !== 'object') {
            normaliseAnimationsArray.call(this, opts);
        }
        normaliseAnimations.call(this, opts);
    }

    Animator = function(element) {
        this.element = element;
    };

    Animator.prototype.timeout = null;

    Animator.prototype.animate = function(opts) {
        processOpts.call(this, opts);
        frameController.call(this, opts);
    };

    Animator.prototype.cancel = function() {
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
      }
    };

    Animator.registerEasingFunction = Animator.prototype.registerEasingFunction = function(name, callback) {
        if (typeof name === 'string' && typeof callback === 'function') {
            easingFunctions[name.toLowerCase()] = callback;
        }
    };

}());