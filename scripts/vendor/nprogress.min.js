/* NProgress, (c) 2013, 2014 Rico Sta. Cruz - http://ricostacruz.com/nprogress
 * @license MIT */
(function(e,n){"function"==typeof define&&define.amd?define(n):"object"==typeof exports?module.exports=n():e.NProgress=n()})(this,function(){
/**
         * Helpers
         */
function e(e){return"object"==typeof HTMLElement?e instanceof HTMLElement:e&&"object"==typeof e&&1===e.nodeType&&"string"==typeof e.nodeName}function n(e,n,t){return e<n?n:e>t?t:e}
/**
         * (Internal) converts a percentage (`0..1`) to a bar translateX
         * percentage (`-100%..0%`).
         */function t(e){return 100*(-1+e)}
/**
         * (Internal) returns the correct CSS for changing the bar's
         * position given an n percentage, and speed and ease from Settings
         */function r(e,n,r){var i;return i="translate3d"===d.positionUsing?{transform:"translate3d("+t(e)+"%,0,0)"}:"translate"===d.positionUsing?{transform:"translate("+t(e)+"%,0)"}:{"margin-left":t(e)+"%"},i.transition="all "+n+"ms "+r,i}
/**
         * (Internal) Queues a function to be executed.
         */
/**
         * (Internal) Determines if an element or space separated list of class names contains a class name.
         */
function i(e,n){var t="string"==typeof e?e:a(e);return t.indexOf(" "+n+" ")>=0}
/**
         * (Internal) Adds a class to an element.
         */function o(e,n){var t=a(e),r=t+n;i(t,n)||(
// Trim the opening space.
e.className=r.substring(1))}
/**
         * (Internal) Removes a class from an element.
         */function s(e,n){var t,r=a(e);i(e,n)&&(
// Replace the class name.
t=r.replace(" "+n+" "," "),
// Trim the opening and closing spaces.
e.className=t.substring(1,t.length-1))}
/**
         * (Internal) Gets a space separated list of the class names on the element.
         * The list is wrapped with a single space on each end to facilitate finding
         * matches within the list.
         */function a(e){return(" "+(e&&e.className||"")+" ").replace(/\s+/gi," ")}
/**
         * (Internal) Removes an element from the DOM.
         */function u(e){e&&e.parentNode&&e.parentNode.removeChild(e)}var c,l,f={version:"0.2.0"},d=f.settings={minimum:.08,easing:"linear",positionUsing:"",speed:200,trickle:!0,trickleSpeed:200,showSpinner:!0,barSelector:'[role="bar"]',spinnerSelector:'[role="spinner"]',parent:"body",template:'<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'};
/**
         * Updates configuration.
         *
         *     NProgress.configure({
         *       minimum: 0.1
         *     });
         */
f.configure=function(e){var n,t;for(n in e)t=e[n],void 0!==t&&e.hasOwnProperty(n)&&(d[n]=t);return this},
/**
         * Last number.
         */
f.status=null,
/**
         * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
         *
         *     NProgress.set(0.4);
         *     NProgress.set(1.0);
         */
f.set=function(e){var t=f.isStarted();e=n(e,d.minimum,1),f.status=1===e?null:e;var i=f.render(!t),o=i.querySelector(d.barSelector),s=d.speed,a=d.easing;return i.offsetWidth,/* Repaint */
p(function(n){
// Set positionUsing if it hasn't already been set
""===d.positionUsing&&(d.positionUsing=f.getPositioningCSS()),
// Add transition
m(o,r(e,s,a)),1===e?(
// Fade out
m(i,{transition:"none",opacity:1}),i.offsetWidth,/* Repaint */
setTimeout(function(){m(i,{transition:"all "+s+"ms linear",opacity:0}),setTimeout(function(){f.remove(),n()},s)},s)):setTimeout(n,s)}),this},f.isStarted=function(){return"number"==typeof f.status},
/**
         * Shows the progress bar.
         * This is the same as setting the status to 0%, except that it doesn't go backwards.
         *
         *     NProgress.start();
         *
         */
f.start=function(){f.status||f.set(0);var e=function(){setTimeout(function(){f.status&&(f.trickle(),e())},d.trickleSpeed)};return d.trickle&&e(),this},
/**
         * Hides the progress bar.
         * This is the *sort of* the same as setting the status to 100%, with the
         * difference being `done()` makes some placebo effect of some realistic motion.
         *
         *     NProgress.done();
         *
         * If `true` is passed, it will show the progress bar even if its hidden.
         *
         *     NProgress.done(true);
         */
f.done=function(e){return e||f.status?f.inc(.3+.5*Math.random()).set(1):this},
/**
         * Increments by a random amount.
         */
f.inc=function(e){var t=f.status;return t?t>1?void 0:("number"!=typeof e&&(e=t>=0&&t<.2?.1:t>=.2&&t<.5?.04:t>=.5&&t<.8?.02:t>=.8&&t<.99?.005:0),t=n(t+e,0,.994),f.set(t)):f.start()},f.trickle=function(){return f.inc()},
/**
         * Waits for all supplied jQuery promises and
         * increases the progress as the promises resolve.
         *
         * @param $promise jQUery Promise
         */
c=0,l=0,f.promise=function(e){return e&&"resolved"!==e.state()?(0===l&&f.start(),c++,l++,e.always(function(){l--,0===l?(c=0,f.done()):f.set((c-l)/c)}),this):this},
/**
         * (Internal) renders the progress bar markup based on the `template`
         * setting.
         */
f.render=function(n){if(f.isRendered())return document.getElementById("nprogress");o(document.documentElement,"nprogress-busy");var r=document.createElement("div");r.id="nprogress",r.innerHTML=d.template;var i,s=r.querySelector(d.barSelector),a=n?"-100":t(f.status||0),c=e(d.parent)?d.parent:document.querySelector(d.parent);return m(s,{transition:"all 0 linear",transform:"translate3d("+a+"%,0,0)"}),d.showSpinner||(i=r.querySelector(d.spinnerSelector),i&&u(i)),c!=document.body&&o(c,"nprogress-custom-parent"),c.appendChild(r),r},
/**
         * Removes the element. Opposite of render().
         */
f.remove=function(){s(document.documentElement,"nprogress-busy");var n=e(d.parent)?d.parent:document.querySelector(d.parent);s(n,"nprogress-custom-parent");var t=document.getElementById("nprogress");t&&u(t)},
/**
         * Checks if the progress bar is rendered.
         */
f.isRendered=function(){return!!document.getElementById("nprogress")},
/**
         * Determine which positioning CSS rule to use.
         */
f.getPositioningCSS=function(){
// Sniff on document.body.style
var e=document.body.style,n="WebkitTransform"in e?"Webkit":"MozTransform"in e?"Moz":"msTransform"in e?"ms":"OTransform"in e?"O":"";
// Sniff prefixes
return n+"Perspective"in e?"translate3d":n+"Transform"in e?"translate":"margin"};var p=function(){function e(){var t=n.shift();t&&t(e)}var n=[];return function(t){n.push(t),1==n.length&&e()}}(),m=function(){function e(e){return e.replace(/^-ms-/,"ms-").replace(/-([\da-z])/gi,function(e,n){return n.toUpperCase()})}function n(e){var n=document.body.style;if(e in n)return e;for(var t,r=i.length,o=e.charAt(0).toUpperCase()+e.slice(1);r--;)if(t=i[r]+o,t in n)return t;return e}function t(t){return t=e(t),o[t]||(o[t]=n(t))}function r(e,n,r){n=t(n),e.style[n]=r}var i=["Webkit","O","Moz","ms"],o={};return function(e,n){var t,i,o=arguments;if(2==o.length)for(t in n)i=n[t],void 0!==i&&n.hasOwnProperty(t)&&r(e,t,i);else r(e,o[1],o[2])}}();
/**
         * (Internal) Applies css properties to an element, similar to the jQuery
         * css method.
         *
         * While this helper does assist with vendor prefixed property names, it
         * does not perform any manipulation of values prior to setting styles.
         */return f});