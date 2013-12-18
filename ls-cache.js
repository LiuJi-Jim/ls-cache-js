(function(){
  var Jas = (function(){
    var uid = 1;
    var Jas = function(){
      this.map = {};
      this.rmap = {};
      this.fired = {};
    };
    var indexOf = Array.prototype.indexOf || function(obj){
        for (var i = 0, len = this.length; i < len; ++i){
          if (this[i] === obj) return i;
        }
        return -1;
      };
    var _fire = function(callback, thisObj){
      setTimeout(function(){
        callback.call(thisObj);
      }, 0);
    };
    Jas.prototype = {
      when: function(resources, callback, thisObj){
        var map = this.map,
            rmap = this.rmap,
            fired = this.fired;
        if (typeof resources === 'string') resources = [resources];
        if (resources.length === 0){
          return _fire(callback, thisObj || window);
        }
        var id = (uid++).toString(36); // using numbers and letters
        map[id] = {
          waiting: resources.slice(0), // clone Array
          callback: callback,
          thisObj: thisObj || window
        };

        for (var i = 0, len = resources.length; i < len; ++i){
          var res = resources[i],
              list = rmap[res] || (rmap[res] = []);
          list.push(id);
          if (fired[res]){
            // 已经触发过的
            this.fire(res);
          }
        }
        return this;
      },
      fire: function(resources){
        if (!resources) return this;
        var map = this.map,
            rmap = this.rmap,
            fired = this.fired;
        if (typeof resources === 'string') resources = [resources];
        for (var i = 0, len = resources.length; i < len; ++i){
          var res = resources[i];
          fired[res] = true; // 标记为已触发
          if (typeof rmap[res] === 'undefined') continue;
          this._release(res, rmap[res]); // notify each callback waiting for this resource
          delete rmap[res]; // release this resource
        }
        return this;
      },
      status: function(res){
        var rmap = this.rmap,
            fired = this.fired;
        if (fired[res]) return 'fired';
        if (rmap[res] && rmap[res].length > 0) return 'waiting';
        return false;
      },
      _release: function(res, list){
        var map = this.map,
            rmap = this.rmap,
            fired = this.fired;
        for (var i = 0, len = list.length; i < len; ++i){
          var uid = list[i],
              mapItem = map[uid],
              waiting = mapItem.waiting,
              pos = indexOf.call(waiting, res);
          waiting.splice(pos, 1); // remove
          if (waiting.length === 0){
            // no more depends
            _fire(mapItem.callback, mapItem.thisObj); // fire the callback asynchronously
            delete map[uid];
          }
        }
      }
    };

    return Jas;
  })();

  var scriptCache = new Jas(),
      scriptStatus = {},
      moduleCache = {};

  function parseReq(arr){
    var ret = [];
    return ret;
  }

  var currentAddingScript = null,
      interactiveScript = null;
  function getInteractiveScript(){
    if (interactiveScript && interactiveScript.readyState === 'interactive'){
      return interactiveScript;
    }
    var tags = document.head.getElementsByTagName('script');
    for (var i=tags.length-1; i>=0; --i){
      if (tags[i].readyState === 'interactive'){
        return i(interactiveScript = tags[i]);
      }
    }
  }
  function getCurrentScript(){
    if (document.currentScript) return document.currentScript;
    if (currentAddingScript){
      return currentAddingScript;
    }
    return getInteractiveScript();
  }
  function loadScript(name){
    if (scriptStatus[name]) return;
    scriptStatus[name] = true;
    if (window.localStorage){
      var key = (lsCache.lsPrefix || '') + name;
      if (localStorage[key]){
        try{
          var mod = JSON.parse(localStorage[key]);
          if (mod.req instanceof Array && typeof mod.fn === 'string'){
            var req = mod.req,
                fn = (new Function('return ' + mod.fn))();
            moduleDefine(req, fn, name);
            return;
          }
        }catch(ex){
        }
      }
    }
    var tag = document.createElement('script');
    tag.type = 'text/javascript';
    tag.async = true;
    tag.src = name;
    currentAddingScript = tag;
    document.head.appendChild(tag);
    currentAddingScript = null;
  }
  function moduleSave(requires, fn, name){
    if (!window.localStorage) return;
    var key = (lsCache.lsPrefix || '') + name;
    try{
      window.localStorage[key] = JSON.stringify({
        'req': requires,
        'fn': fn.toString()
      });
    }catch(ex){
    }
  }
  function moduleDefine(requires, fn, name){
    scriptCache.when(requires, function(){
      var modules = [];
      for (var i=0, len=requires.length; i<len; ++i){
        modules.push(moduleCache[requires[i]]);
      }
      var module = fn.apply(window, modules);
      if (name){
        moduleSave(requires, fn, name);
        moduleCache[name] = module;
        scriptCache.fire(name);
      }
    });
    for (var i=0, len=requires.length; i<len; ++i){
      loadScript(requires[i]);
    }
  }

  var lsCache = function(requires, fn){
    if (arguments.length == 1){
      // file without requires
      fn = requires;
      requires = [];
    }
    if (typeof requires === 'string') requires = [requires];
    var tag = getCurrentScript(),
        name = tag.getAttribute('src');
    moduleDefine(requires, fn, name);
  };
  lsCache.lsPrefix = 'test_';

  lsCache.use = function(requires, fn){
    if (arguments.length == 1){
      // file without requires
      fn = requires;
      requires = [];
    }
    if (typeof requires === 'string') requires = [requires];
    moduleDefine(requires, fn);
  };

  window.lsCache = lsCache;
})();
