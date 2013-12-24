ls-cache-js
===========

A library to use localStorage to cache JS modules in modern browsers.

### Usage

* define and require modules
* track dependencies
* load js when not cached
* cache js using localStorage

### TODO

* localStorage version control and explicitly flushing
* relative path and alias supporting

### DEMO
```
// file: demo-1.html
// init the main routine, requires 3 modules
lsCache(['logger.js', 'demo-1.js', 'demo-2.js'], function(logger, d1, d2){
  logger.log('main is here');
  logger.log('main says d1 = ' + d1);
  logger.log('main says d2 = ' + d2);
});
```
```
// file: demo-1.js
// define a module, requires 2 modules
lsCache(['zepto.js', 'logger.js'], function($, logger){
  logger.log('d1 is coming');
  return 'd1';
});
```
* when `demo-1.js` is not cached, it will be added as a `<script>` tag. then it will be cached.
* when it's cached, it will be loaded from localStorage without any other network spending.
