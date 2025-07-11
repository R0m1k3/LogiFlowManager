var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/express-session/node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/express-session/node_modules/cookie/index.js"(exports) {
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var __toString = Object.prototype.toString;
    var __hasOwnProperty = Object.prototype.hasOwnProperty;
    var cookieNameRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
    var cookieValueRegExp = /^("?)[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*\1$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    function parse(str, opt) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var len = str.length;
      if (len < 2) return obj;
      var dec = opt && opt.decode || decode;
      var index2 = 0;
      var eqIdx = 0;
      var endIdx = 0;
      do {
        eqIdx = str.indexOf("=", index2);
        if (eqIdx === -1) break;
        endIdx = str.indexOf(";", index2);
        if (endIdx === -1) {
          endIdx = len;
        } else if (eqIdx > endIdx) {
          index2 = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        var keyStartIdx = startIndex(str, index2, eqIdx);
        var keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
        var key = str.slice(keyStartIdx, keyEndIdx);
        if (!__hasOwnProperty.call(obj, key)) {
          var valStartIdx = startIndex(str, eqIdx + 1, endIdx);
          var valEndIdx = endIndex(str, endIdx, valStartIdx);
          if (str.charCodeAt(valStartIdx) === 34 && str.charCodeAt(valEndIdx - 1) === 34) {
            valStartIdx++;
            valEndIdx--;
          }
          var val = str.slice(valStartIdx, valEndIdx);
          obj[key] = tryDecode(val, dec);
        }
        index2 = endIdx + 1;
      } while (index2 < len);
      return obj;
    }
    function startIndex(str, index2, max) {
      do {
        var code = str.charCodeAt(index2);
        if (code !== 32 && code !== 9) return index2;
      } while (++index2 < max);
      return max;
    }
    function endIndex(str, index2, min) {
      while (index2 > min) {
        var code = str.charCodeAt(--index2);
        if (code !== 32 && code !== 9) return index2 + 1;
      }
      return min;
    }
    function serialize(name, val, opt) {
      var enc = opt && opt.encode || encodeURIComponent;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!cookieNameRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (!opt) return str;
      if (null != opt.maxAge) {
        var maxAge = Math.floor(opt.maxAge);
        if (!isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + maxAge;
      }
      if (opt.domain) {
        if (!domainValueRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!pathValueRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        var expires = opt.expires;
        if (!isDate(expires) || isNaN(expires.valueOf())) {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.partitioned) {
        str += "; Partitioned";
      }
      if (opt.priority) {
        var priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError("option priority is invalid");
        }
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function decode(str) {
      return str.indexOf("%") !== -1 ? decodeURIComponent(str) : str;
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/express-session/node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/express-session/node_modules/ms/index.js"(exports, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isNaN(val) === false) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      if (ms >= d) {
        return Math.round(ms / d) + "d";
      }
      if (ms >= h) {
        return Math.round(ms / h) + "h";
      }
      if (ms >= m) {
        return Math.round(ms / m) + "m";
      }
      if (ms >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      return plural(ms, d, "day") || plural(ms, h, "hour") || plural(ms, m, "minute") || plural(ms, s, "second") || ms + " ms";
    }
    function plural(ms, n, name) {
      if (ms < n) {
        return;
      }
      if (ms < n * 1.5) {
        return Math.floor(ms / n) + " " + name;
      }
      return Math.ceil(ms / n) + " " + name + "s";
    }
  }
});

// node_modules/express-session/node_modules/debug/src/debug.js
var require_debug = __commonJS({
  "node_modules/express-session/node_modules/debug/src/debug.js"(exports, module) {
    exports = module.exports = createDebug.debug = createDebug["default"] = createDebug;
    exports.coerce = coerce2;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = require_ms();
    exports.names = [];
    exports.skips = [];
    exports.formatters = {};
    var prevTime;
    function selectColor(namespace) {
      var hash = 0, i;
      for (i in namespace) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return exports.colors[Math.abs(hash) % exports.colors.length];
    }
    function createDebug(namespace) {
      function debug() {
        if (!debug.enabled) return;
        var self = debug;
        var curr = +/* @__PURE__ */ new Date();
        var ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        args[0] = exports.coerce(args[0]);
        if ("string" !== typeof args[0]) {
          args.unshift("%O");
        }
        var index2 = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          if (match === "%%") return match;
          index2++;
          var formatter = exports.formatters[format];
          if ("function" === typeof formatter) {
            var val = args[index2];
            match = formatter.call(self, val);
            args.splice(index2, 1);
            index2--;
          }
          return match;
        });
        exports.formatArgs.call(self, args);
        var logFn = debug.log || exports.log || console.log.bind(console);
        logFn.apply(self, args);
      }
      debug.namespace = namespace;
      debug.enabled = exports.enabled(namespace);
      debug.useColors = exports.useColors();
      debug.color = selectColor(namespace);
      if ("function" === typeof exports.init) {
        exports.init(debug);
      }
      return debug;
    }
    function enable(namespaces) {
      exports.save(namespaces);
      exports.names = [];
      exports.skips = [];
      var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
      var len = split.length;
      for (var i = 0; i < len; i++) {
        if (!split[i]) continue;
        namespaces = split[i].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
        } else {
          exports.names.push(new RegExp("^" + namespaces + "$"));
        }
      }
    }
    function disable() {
      exports.enable("");
    }
    function enabled(name) {
      var i, len;
      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }
    function coerce2(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
  }
});

// node_modules/express-session/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/express-session/node_modules/debug/src/browser.js"(exports, module) {
    exports = module.exports = require_debug();
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : localstorage();
    exports.colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
        return true;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    exports.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return "[UnexpectedJSONParseError]: " + err.message;
      }
    };
    function formatArgs(args) {
      var useColors2 = this.useColors;
      args[0] = (useColors2 ? "%c" : "") + this.namespace + (useColors2 ? " %c" : " ") + args[0] + (useColors2 ? "%c " : " ") + "+" + exports.humanize(this.diff);
      if (!useColors2) return;
      var c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      var index2 = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if ("%%" === match) return;
        index2++;
        if ("%c" === match) {
          lastC = index2;
        }
      });
      args.splice(lastC, 0, c);
    }
    function log() {
      return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
    }
    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports.storage.removeItem("debug");
        } else {
          exports.storage.debug = namespaces;
        }
      } catch (e) {
      }
    }
    function load() {
      var r;
      try {
        r = exports.storage.debug;
      } catch (e) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    exports.enable(load());
    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {
      }
    }
  }
});

// node_modules/express-session/node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/express-session/node_modules/debug/src/node.js"(exports, module) {
    var tty = __require("tty");
    var util2 = __require("util");
    exports = module.exports = require_debug();
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.colors = [6, 2, 3, 4, 5, 1];
    exports.inspectOpts = Object.keys(process.env).filter(function(key) {
      return /^debug_/i.test(key);
    }).reduce(function(obj, key) {
      var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function(_, k) {
        return k.toUpperCase();
      });
      var val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
      else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
      else if (val === "null") val = null;
      else val = Number(val);
      obj[prop] = val;
      return obj;
    }, {});
    var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    if (1 !== fd && 2 !== fd) {
      util2.deprecate(function() {
      }, "except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)")();
    }
    var stream = 1 === fd ? process.stdout : 2 === fd ? process.stderr : createWritableStdioStream(fd);
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(fd);
    }
    exports.formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts).split("\n").map(function(str) {
        return str.trim();
      }).join(" ");
    };
    exports.formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts);
    };
    function formatArgs(args) {
      var name = this.namespace;
      var useColors2 = this.useColors;
      if (useColors2) {
        var c = this.color;
        var prefix = "  \x1B[3" + c + ";1m" + name + " \x1B[0m";
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push("\x1B[3" + c + "m+" + exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = (/* @__PURE__ */ new Date()).toUTCString() + " " + name + " " + args[0];
      }
    }
    function log() {
      return stream.write(util2.format.apply(util2, arguments) + "\n");
    }
    function save(namespaces) {
      if (null == namespaces) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = namespaces;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function createWritableStdioStream(fd2) {
      var stream2;
      var tty_wrap = process.binding("tty_wrap");
      switch (tty_wrap.guessHandleType(fd2)) {
        case "TTY":
          stream2 = new tty.WriteStream(fd2);
          stream2._type = "tty";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        case "FILE":
          var fs2 = __require("fs");
          stream2 = new fs2.SyncWriteStream(fd2, { autoClose: false });
          stream2._type = "fs";
          break;
        case "PIPE":
        case "TCP":
          var net = __require("net");
          stream2 = new net.Socket({
            fd: fd2,
            readable: false,
            writable: true
          });
          stream2.readable = false;
          stream2.read = null;
          stream2._type = "pipe";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        default:
          throw new Error("Implement me. Unknown stream file type!");
      }
      stream2.fd = fd2;
      stream2._isStdio = true;
      return stream2;
    }
    function init(debug) {
      debug.inspectOpts = {};
      var keys = Object.keys(exports.inspectOpts);
      for (var i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    exports.enable(load());
  }
});

// node_modules/express-session/node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/express-session/node_modules/debug/src/index.js"(exports, module) {
    if (typeof process !== "undefined" && process.type === "renderer") {
      module.exports = require_browser();
    } else {
      module.exports = require_node();
    }
  }
});

// node_modules/depd/index.js
var require_depd = __commonJS({
  "node_modules/depd/index.js"(exports, module) {
    var relative = __require("path").relative;
    module.exports = depd;
    var basePath = process.cwd();
    function containsNamespace(str, namespace) {
      var vals = str.split(/[ ,]+/);
      var ns = String(namespace).toLowerCase();
      for (var i = 0; i < vals.length; i++) {
        var val = vals[i];
        if (val && (val === "*" || val.toLowerCase() === ns)) {
          return true;
        }
      }
      return false;
    }
    function convertDataDescriptorToAccessor(obj, prop, message) {
      var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
      var value = descriptor.value;
      descriptor.get = function getter() {
        return value;
      };
      if (descriptor.writable) {
        descriptor.set = function setter(val) {
          return value = val;
        };
      }
      delete descriptor.value;
      delete descriptor.writable;
      Object.defineProperty(obj, prop, descriptor);
      return descriptor;
    }
    function createArgumentsString(arity) {
      var str = "";
      for (var i = 0; i < arity; i++) {
        str += ", arg" + i;
      }
      return str.substr(2);
    }
    function createStackString(stack) {
      var str = this.name + ": " + this.namespace;
      if (this.message) {
        str += " deprecated " + this.message;
      }
      for (var i = 0; i < stack.length; i++) {
        str += "\n    at " + stack[i].toString();
      }
      return str;
    }
    function depd(namespace) {
      if (!namespace) {
        throw new TypeError("argument namespace is required");
      }
      var stack = getStack();
      var site = callSiteLocation(stack[1]);
      var file = site[0];
      function deprecate(message) {
        log.call(deprecate, message);
      }
      deprecate._file = file;
      deprecate._ignored = isignored(namespace);
      deprecate._namespace = namespace;
      deprecate._traced = istraced(namespace);
      deprecate._warned = /* @__PURE__ */ Object.create(null);
      deprecate.function = wrapfunction;
      deprecate.property = wrapproperty;
      return deprecate;
    }
    function eehaslisteners(emitter, type) {
      var count = typeof emitter.listenerCount !== "function" ? emitter.listeners(type).length : emitter.listenerCount(type);
      return count > 0;
    }
    function isignored(namespace) {
      if (process.noDeprecation) {
        return true;
      }
      var str = process.env.NO_DEPRECATION || "";
      return containsNamespace(str, namespace);
    }
    function istraced(namespace) {
      if (process.traceDeprecation) {
        return true;
      }
      var str = process.env.TRACE_DEPRECATION || "";
      return containsNamespace(str, namespace);
    }
    function log(message, site) {
      var haslisteners = eehaslisteners(process, "deprecation");
      if (!haslisteners && this._ignored) {
        return;
      }
      var caller;
      var callFile;
      var callSite;
      var depSite;
      var i = 0;
      var seen = false;
      var stack = getStack();
      var file = this._file;
      if (site) {
        depSite = site;
        callSite = callSiteLocation(stack[1]);
        callSite.name = depSite.name;
        file = callSite[0];
      } else {
        i = 2;
        depSite = callSiteLocation(stack[i]);
        callSite = depSite;
      }
      for (; i < stack.length; i++) {
        caller = callSiteLocation(stack[i]);
        callFile = caller[0];
        if (callFile === file) {
          seen = true;
        } else if (callFile === this._file) {
          file = this._file;
        } else if (seen) {
          break;
        }
      }
      var key = caller ? depSite.join(":") + "__" + caller.join(":") : void 0;
      if (key !== void 0 && key in this._warned) {
        return;
      }
      this._warned[key] = true;
      var msg = message;
      if (!msg) {
        msg = callSite === depSite || !callSite.name ? defaultMessage(depSite) : defaultMessage(callSite);
      }
      if (haslisteners) {
        var err = DeprecationError(this._namespace, msg, stack.slice(i));
        process.emit("deprecation", err);
        return;
      }
      var format = process.stderr.isTTY ? formatColor : formatPlain;
      var output = format.call(this, msg, caller, stack.slice(i));
      process.stderr.write(output + "\n", "utf8");
    }
    function callSiteLocation(callSite) {
      var file = callSite.getFileName() || "<anonymous>";
      var line = callSite.getLineNumber();
      var colm = callSite.getColumnNumber();
      if (callSite.isEval()) {
        file = callSite.getEvalOrigin() + ", " + file;
      }
      var site = [file, line, colm];
      site.callSite = callSite;
      site.name = callSite.getFunctionName();
      return site;
    }
    function defaultMessage(site) {
      var callSite = site.callSite;
      var funcName = site.name;
      if (!funcName) {
        funcName = "<anonymous@" + formatLocation(site) + ">";
      }
      var context = callSite.getThis();
      var typeName = context && callSite.getTypeName();
      if (typeName === "Object") {
        typeName = void 0;
      }
      if (typeName === "Function") {
        typeName = context.name || typeName;
      }
      return typeName && callSite.getMethodName() ? typeName + "." + funcName : funcName;
    }
    function formatPlain(msg, caller, stack) {
      var timestamp2 = (/* @__PURE__ */ new Date()).toUTCString();
      var formatted = timestamp2 + " " + this._namespace + " deprecated " + msg;
      if (this._traced) {
        for (var i = 0; i < stack.length; i++) {
          formatted += "\n    at " + stack[i].toString();
        }
        return formatted;
      }
      if (caller) {
        formatted += " at " + formatLocation(caller);
      }
      return formatted;
    }
    function formatColor(msg, caller, stack) {
      var formatted = "\x1B[36;1m" + this._namespace + "\x1B[22;39m \x1B[33;1mdeprecated\x1B[22;39m \x1B[0m" + msg + "\x1B[39m";
      if (this._traced) {
        for (var i = 0; i < stack.length; i++) {
          formatted += "\n    \x1B[36mat " + stack[i].toString() + "\x1B[39m";
        }
        return formatted;
      }
      if (caller) {
        formatted += " \x1B[36m" + formatLocation(caller) + "\x1B[39m";
      }
      return formatted;
    }
    function formatLocation(callSite) {
      return relative(basePath, callSite[0]) + ":" + callSite[1] + ":" + callSite[2];
    }
    function getStack() {
      var limit = Error.stackTraceLimit;
      var obj = {};
      var prep = Error.prepareStackTrace;
      Error.prepareStackTrace = prepareObjectStackTrace;
      Error.stackTraceLimit = Math.max(10, limit);
      Error.captureStackTrace(obj);
      var stack = obj.stack.slice(1);
      Error.prepareStackTrace = prep;
      Error.stackTraceLimit = limit;
      return stack;
    }
    function prepareObjectStackTrace(obj, stack) {
      return stack;
    }
    function wrapfunction(fn, message) {
      if (typeof fn !== "function") {
        throw new TypeError("argument fn must be a function");
      }
      var args = createArgumentsString(fn.length);
      var stack = getStack();
      var site = callSiteLocation(stack[1]);
      site.name = fn.name;
      var deprecatedfn = new Function(
        "fn",
        "log",
        "deprecate",
        "message",
        "site",
        '"use strict"\nreturn function (' + args + ") {log.call(deprecate, message, site)\nreturn fn.apply(this, arguments)\n}"
      )(fn, log, this, message, site);
      return deprecatedfn;
    }
    function wrapproperty(obj, prop, message) {
      if (!obj || typeof obj !== "object" && typeof obj !== "function") {
        throw new TypeError("argument obj must be object");
      }
      var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
      if (!descriptor) {
        throw new TypeError("must call property on owner object");
      }
      if (!descriptor.configurable) {
        throw new TypeError("property must be configurable");
      }
      var deprecate = this;
      var stack = getStack();
      var site = callSiteLocation(stack[1]);
      site.name = prop;
      if ("value" in descriptor) {
        descriptor = convertDataDescriptorToAccessor(obj, prop, message);
      }
      var get = descriptor.get;
      var set = descriptor.set;
      if (typeof get === "function") {
        descriptor.get = function getter() {
          log.call(deprecate, message, site);
          return get.apply(this, arguments);
        };
      }
      if (typeof set === "function") {
        descriptor.set = function setter() {
          log.call(deprecate, message, site);
          return set.apply(this, arguments);
        };
      }
      Object.defineProperty(obj, prop, descriptor);
    }
    function DeprecationError(namespace, message, stack) {
      var error = new Error();
      var stackString;
      Object.defineProperty(error, "constructor", {
        value: DeprecationError
      });
      Object.defineProperty(error, "message", {
        configurable: true,
        enumerable: false,
        value: message,
        writable: true
      });
      Object.defineProperty(error, "name", {
        enumerable: false,
        configurable: true,
        value: "DeprecationError",
        writable: true
      });
      Object.defineProperty(error, "namespace", {
        configurable: true,
        enumerable: false,
        value: namespace,
        writable: true
      });
      Object.defineProperty(error, "stack", {
        configurable: true,
        enumerable: false,
        get: function() {
          if (stackString !== void 0) {
            return stackString;
          }
          return stackString = createStackString.call(this, stack);
        },
        set: function setter(val) {
          stackString = val;
        }
      });
      return error;
    }
  }
});

// node_modules/on-headers/index.js
var require_on_headers = __commonJS({
  "node_modules/on-headers/index.js"(exports, module) {
    "use strict";
    module.exports = onHeaders;
    function createWriteHead(prevWriteHead, listener) {
      var fired = false;
      return function writeHead(statusCode) {
        var args = setWriteHeadHeaders.apply(this, arguments);
        if (!fired) {
          fired = true;
          listener.call(this);
          if (typeof args[0] === "number" && this.statusCode !== args[0]) {
            args[0] = this.statusCode;
            args.length = 1;
          }
        }
        return prevWriteHead.apply(this, args);
      };
    }
    function onHeaders(res, listener) {
      if (!res) {
        throw new TypeError("argument res is required");
      }
      if (typeof listener !== "function") {
        throw new TypeError("argument listener must be a function");
      }
      res.writeHead = createWriteHead(res.writeHead, listener);
    }
    function setHeadersFromArray(res, headers) {
      for (var i = 0; i < headers.length; i++) {
        res.setHeader(headers[i][0], headers[i][1]);
      }
    }
    function setHeadersFromObject(res, headers) {
      var keys = Object.keys(headers);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k) res.setHeader(k, headers[k]);
      }
    }
    function setWriteHeadHeaders(statusCode) {
      var length = arguments.length;
      var headerIndex = length > 1 && typeof arguments[1] === "string" ? 2 : 1;
      var headers = length >= headerIndex + 1 ? arguments[headerIndex] : void 0;
      this.statusCode = statusCode;
      if (Array.isArray(headers)) {
        setHeadersFromArray(this, headers);
      } else if (headers) {
        setHeadersFromObject(this, headers);
      }
      var args = new Array(Math.min(length, headerIndex));
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }
      return args;
    }
  }
});

// node_modules/parseurl/index.js
var require_parseurl = __commonJS({
  "node_modules/parseurl/index.js"(exports, module) {
    "use strict";
    var url = __require("url");
    var parse = url.parse;
    var Url = url.Url;
    module.exports = parseurl;
    module.exports.original = originalurl;
    function parseurl(req) {
      var url2 = req.url;
      if (url2 === void 0) {
        return void 0;
      }
      var parsed = req._parsedUrl;
      if (fresh(url2, parsed)) {
        return parsed;
      }
      parsed = fastparse(url2);
      parsed._raw = url2;
      return req._parsedUrl = parsed;
    }
    function originalurl(req) {
      var url2 = req.originalUrl;
      if (typeof url2 !== "string") {
        return parseurl(req);
      }
      var parsed = req._parsedOriginalUrl;
      if (fresh(url2, parsed)) {
        return parsed;
      }
      parsed = fastparse(url2);
      parsed._raw = url2;
      return req._parsedOriginalUrl = parsed;
    }
    function fastparse(str) {
      if (typeof str !== "string" || str.charCodeAt(0) !== 47) {
        return parse(str);
      }
      var pathname = str;
      var query = null;
      var search = null;
      for (var i = 1; i < str.length; i++) {
        switch (str.charCodeAt(i)) {
          case 63:
            if (search === null) {
              pathname = str.substring(0, i);
              query = str.substring(i + 1);
              search = str.substring(i);
            }
            break;
          case 9:
          /* \t */
          case 10:
          /* \n */
          case 12:
          /* \f */
          case 13:
          /* \r */
          case 32:
          /*    */
          case 35:
          /* #  */
          case 160:
          case 65279:
            return parse(str);
        }
      }
      var url2 = Url !== void 0 ? new Url() : {};
      url2.path = str;
      url2.href = str;
      url2.pathname = pathname;
      if (search !== null) {
        url2.query = query;
        url2.search = search;
      }
      return url2;
    }
    function fresh(url2, parsedUrl) {
      return typeof parsedUrl === "object" && parsedUrl !== null && (Url === void 0 || parsedUrl instanceof Url) && parsedUrl._raw === url2;
    }
  }
});

// node_modules/express-session/node_modules/cookie-signature/index.js
var require_cookie_signature = __commonJS({
  "node_modules/express-session/node_modules/cookie-signature/index.js"(exports) {
    var crypto = __require("crypto");
    exports.sign = function(val, secret) {
      if ("string" !== typeof val) throw new TypeError("Cookie value must be provided as a string.");
      if (null == secret) throw new TypeError("Secret key must be provided.");
      return val + "." + crypto.createHmac("sha256", secret).update(val).digest("base64").replace(/\=+$/, "");
    };
    exports.unsign = function(val, secret) {
      if ("string" !== typeof val) throw new TypeError("Signed cookie string must be provided.");
      if (null == secret) throw new TypeError("Secret key must be provided.");
      var str = val.slice(0, val.lastIndexOf(".")), mac = exports.sign(str, secret);
      return sha1(mac) == sha1(val) ? str : false;
    };
    function sha1(str) {
      return crypto.createHash("sha1").update(str).digest("hex");
    }
  }
});

// node_modules/random-bytes/index.js
var require_random_bytes = __commonJS({
  "node_modules/random-bytes/index.js"(exports, module) {
    "use strict";
    var crypto = __require("crypto");
    var generateAttempts = crypto.randomBytes === crypto.pseudoRandomBytes ? 1 : 3;
    module.exports = randomBytes2;
    module.exports.sync = randomBytesSync;
    function randomBytes2(size, callback) {
      if (callback !== void 0 && typeof callback !== "function") {
        throw new TypeError("argument callback must be a function");
      }
      if (!callback && !global.Promise) {
        throw new TypeError("argument callback is required");
      }
      if (callback) {
        return generateRandomBytes(size, generateAttempts, callback);
      }
      return new Promise(function executor(resolve, reject) {
        generateRandomBytes(size, generateAttempts, function onRandomBytes(err, str) {
          if (err) return reject(err);
          resolve(str);
        });
      });
    }
    function randomBytesSync(size) {
      var err = null;
      for (var i = 0; i < generateAttempts; i++) {
        try {
          return crypto.randomBytes(size);
        } catch (e) {
          err = e;
        }
      }
      throw err;
    }
    function generateRandomBytes(size, attempts, callback) {
      crypto.randomBytes(size, function onRandomBytes(err, buf) {
        if (!err) return callback(null, buf);
        if (!--attempts) return callback(err);
        setTimeout(generateRandomBytes.bind(null, size, attempts, callback), 10);
      });
    }
  }
});

// node_modules/uid-safe/index.js
var require_uid_safe = __commonJS({
  "node_modules/uid-safe/index.js"(exports, module) {
    "use strict";
    var randomBytes2 = require_random_bytes();
    var EQUAL_END_REGEXP = /=+$/;
    var PLUS_GLOBAL_REGEXP = /\+/g;
    var SLASH_GLOBAL_REGEXP = /\//g;
    module.exports = uid;
    module.exports.sync = uidSync;
    function uid(length, callback) {
      if (callback !== void 0 && typeof callback !== "function") {
        throw new TypeError("argument callback must be a function");
      }
      if (!callback && !global.Promise) {
        throw new TypeError("argument callback is required");
      }
      if (callback) {
        return generateUid(length, callback);
      }
      return new Promise(function executor(resolve, reject) {
        generateUid(length, function onUid(err, str) {
          if (err) return reject(err);
          resolve(str);
        });
      });
    }
    function uidSync(length) {
      return toString(randomBytes2.sync(length));
    }
    function generateUid(length, callback) {
      randomBytes2(length, function(err, buf) {
        if (err) return callback(err);
        callback(null, toString(buf));
      });
    }
    function toString(buf) {
      return buf.toString("base64").replace(EQUAL_END_REGEXP, "").replace(PLUS_GLOBAL_REGEXP, "-").replace(SLASH_GLOBAL_REGEXP, "_");
    }
  }
});

// node_modules/express-session/session/cookie.js
var require_cookie2 = __commonJS({
  "node_modules/express-session/session/cookie.js"(exports, module) {
    "use strict";
    var cookie = require_cookie();
    var deprecate = require_depd()("express-session");
    var Cookie = module.exports = function Cookie2(options) {
      this.path = "/";
      this.maxAge = null;
      this.httpOnly = true;
      if (options) {
        if (typeof options !== "object") {
          throw new TypeError("argument options must be a object");
        }
        for (var key in options) {
          if (key !== "data") {
            this[key] = options[key];
          }
        }
      }
      if (this.originalMaxAge === void 0 || this.originalMaxAge === null) {
        this.originalMaxAge = this.maxAge;
      }
    };
    Cookie.prototype = {
      /**
       * Set expires `date`.
       *
       * @param {Date} date
       * @api public
       */
      set expires(date2) {
        this._expires = date2;
        this.originalMaxAge = this.maxAge;
      },
      /**
       * Get expires `date`.
       *
       * @return {Date}
       * @api public
       */
      get expires() {
        return this._expires;
      },
      /**
       * Set expires via max-age in `ms`.
       *
       * @param {Number} ms
       * @api public
       */
      set maxAge(ms) {
        if (ms && typeof ms !== "number" && !(ms instanceof Date)) {
          throw new TypeError("maxAge must be a number or Date");
        }
        if (ms instanceof Date) {
          deprecate("maxAge as Date; pass number of milliseconds instead");
        }
        this.expires = typeof ms === "number" ? new Date(Date.now() + ms) : ms;
      },
      /**
       * Get expires max-age in `ms`.
       *
       * @return {Number}
       * @api public
       */
      get maxAge() {
        return this.expires instanceof Date ? this.expires.valueOf() - Date.now() : this.expires;
      },
      /**
       * Return cookie data object.
       *
       * @return {Object}
       * @api private
       */
      get data() {
        return {
          originalMaxAge: this.originalMaxAge,
          partitioned: this.partitioned,
          priority: this.priority,
          expires: this._expires,
          secure: this.secure,
          httpOnly: this.httpOnly,
          domain: this.domain,
          path: this.path,
          sameSite: this.sameSite
        };
      },
      /**
       * Return a serialized cookie string.
       *
       * @return {String}
       * @api public
       */
      serialize: function(name, val) {
        return cookie.serialize(name, val, this.data);
      },
      /**
       * Return JSON representation of this cookie.
       *
       * @return {Object}
       * @api private
       */
      toJSON: function() {
        return this.data;
      }
    };
  }
});

// node_modules/express-session/session/session.js
var require_session = __commonJS({
  "node_modules/express-session/session/session.js"(exports, module) {
    "use strict";
    module.exports = Session;
    function Session(req, data) {
      Object.defineProperty(this, "req", { value: req });
      Object.defineProperty(this, "id", { value: req.sessionID });
      if (typeof data === "object" && data !== null) {
        for (var prop in data) {
          if (!(prop in this)) {
            this[prop] = data[prop];
          }
        }
      }
    }
    defineMethod(Session.prototype, "touch", function touch() {
      return this.resetMaxAge();
    });
    defineMethod(Session.prototype, "resetMaxAge", function resetMaxAge() {
      this.cookie.maxAge = this.cookie.originalMaxAge;
      return this;
    });
    defineMethod(Session.prototype, "save", function save(fn) {
      this.req.sessionStore.set(this.id, this, fn || function() {
      });
      return this;
    });
    defineMethod(Session.prototype, "reload", function reload(fn) {
      var req = this.req;
      var store = this.req.sessionStore;
      store.get(this.id, function(err, sess) {
        if (err) return fn(err);
        if (!sess) return fn(new Error("failed to load session"));
        store.createSession(req, sess);
        fn();
      });
      return this;
    });
    defineMethod(Session.prototype, "destroy", function destroy(fn) {
      delete this.req.session;
      this.req.sessionStore.destroy(this.id, fn);
      return this;
    });
    defineMethod(Session.prototype, "regenerate", function regenerate(fn) {
      this.req.sessionStore.regenerate(this.req, fn);
      return this;
    });
    function defineMethod(obj, name, fn) {
      Object.defineProperty(obj, name, {
        configurable: true,
        enumerable: false,
        value: fn,
        writable: true
      });
    }
  }
});

// node_modules/express-session/session/store.js
var require_store = __commonJS({
  "node_modules/express-session/session/store.js"(exports, module) {
    "use strict";
    var Cookie = require_cookie2();
    var EventEmitter = __require("events").EventEmitter;
    var Session = require_session();
    var util2 = __require("util");
    module.exports = Store;
    function Store() {
      EventEmitter.call(this);
    }
    util2.inherits(Store, EventEmitter);
    Store.prototype.regenerate = function(req, fn) {
      var self = this;
      this.destroy(req.sessionID, function(err) {
        self.generate(req);
        fn(err);
      });
    };
    Store.prototype.load = function(sid, fn) {
      var self = this;
      this.get(sid, function(err, sess) {
        if (err) return fn(err);
        if (!sess) return fn();
        var req = { sessionID: sid, sessionStore: self };
        fn(null, self.createSession(req, sess));
      });
    };
    Store.prototype.createSession = function(req, sess) {
      var expires = sess.cookie.expires;
      var originalMaxAge = sess.cookie.originalMaxAge;
      sess.cookie = new Cookie(sess.cookie);
      if (typeof expires === "string") {
        sess.cookie.expires = new Date(expires);
      }
      sess.cookie.originalMaxAge = originalMaxAge;
      req.session = new Session(req, sess);
      return req.session;
    };
  }
});

// node_modules/express-session/session/memory.js
var require_memory = __commonJS({
  "node_modules/express-session/session/memory.js"(exports, module) {
    "use strict";
    var Store = require_store();
    var util2 = __require("util");
    var defer = typeof setImmediate === "function" ? setImmediate : function(fn) {
      process.nextTick(fn.bind.apply(fn, arguments));
    };
    module.exports = MemoryStore;
    function MemoryStore() {
      Store.call(this);
      this.sessions = /* @__PURE__ */ Object.create(null);
    }
    util2.inherits(MemoryStore, Store);
    MemoryStore.prototype.all = function all(callback) {
      var sessionIds = Object.keys(this.sessions);
      var sessions2 = /* @__PURE__ */ Object.create(null);
      for (var i = 0; i < sessionIds.length; i++) {
        var sessionId = sessionIds[i];
        var session2 = getSession.call(this, sessionId);
        if (session2) {
          sessions2[sessionId] = session2;
        }
      }
      callback && defer(callback, null, sessions2);
    };
    MemoryStore.prototype.clear = function clear(callback) {
      this.sessions = /* @__PURE__ */ Object.create(null);
      callback && defer(callback);
    };
    MemoryStore.prototype.destroy = function destroy(sessionId, callback) {
      delete this.sessions[sessionId];
      callback && defer(callback);
    };
    MemoryStore.prototype.get = function get(sessionId, callback) {
      defer(callback, null, getSession.call(this, sessionId));
    };
    MemoryStore.prototype.set = function set(sessionId, session2, callback) {
      this.sessions[sessionId] = JSON.stringify(session2);
      callback && defer(callback);
    };
    MemoryStore.prototype.length = function length(callback) {
      this.all(function(err, sessions2) {
        if (err) return callback(err);
        callback(null, Object.keys(sessions2).length);
      });
    };
    MemoryStore.prototype.touch = function touch(sessionId, session2, callback) {
      var currentSession = getSession.call(this, sessionId);
      if (currentSession) {
        currentSession.cookie = session2.cookie;
        this.sessions[sessionId] = JSON.stringify(currentSession);
      }
      callback && defer(callback);
    };
    function getSession(sessionId) {
      var sess = this.sessions[sessionId];
      if (!sess) {
        return;
      }
      sess = JSON.parse(sess);
      if (sess.cookie) {
        var expires = typeof sess.cookie.expires === "string" ? new Date(sess.cookie.expires) : sess.cookie.expires;
        if (expires && expires <= Date.now()) {
          delete this.sessions[sessionId];
          return;
        }
      }
      return sess;
    }
  }
});

// node_modules/express-session/index.js
var require_express_session = __commonJS({
  "node_modules/express-session/index.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var cookie = require_cookie();
    var crypto = __require("crypto");
    var debug = require_src()("express-session");
    var deprecate = require_depd()("express-session");
    var onHeaders = require_on_headers();
    var parseUrl = require_parseurl();
    var signature = require_cookie_signature();
    var uid = require_uid_safe().sync;
    var Cookie = require_cookie2();
    var MemoryStore = require_memory();
    var Session = require_session();
    var Store = require_store();
    var env = process.env.NODE_ENV;
    exports = module.exports = session2;
    exports.Store = Store;
    exports.Cookie = Cookie;
    exports.Session = Session;
    exports.MemoryStore = MemoryStore;
    var warning = "Warning: connect.session() MemoryStore is not\ndesigned for a production environment, as it will leak\nmemory, and will not scale past a single process.";
    var defer = typeof setImmediate === "function" ? setImmediate : function(fn) {
      process.nextTick(fn.bind.apply(fn, arguments));
    };
    function session2(options) {
      var opts = options || {};
      var cookieOptions = opts.cookie || {};
      var generateId = opts.genid || generateSessionId;
      var name = opts.name || opts.key || "connect.sid";
      var store = opts.store || new MemoryStore();
      var trustProxy = opts.proxy;
      var resaveSession = opts.resave;
      var rollingSessions = Boolean(opts.rolling);
      var saveUninitializedSession = opts.saveUninitialized;
      var secret = opts.secret;
      if (typeof generateId !== "function") {
        throw new TypeError("genid option must be a function");
      }
      if (resaveSession === void 0) {
        deprecate("undefined resave option; provide resave option");
        resaveSession = true;
      }
      if (saveUninitializedSession === void 0) {
        deprecate("undefined saveUninitialized option; provide saveUninitialized option");
        saveUninitializedSession = true;
      }
      if (opts.unset && opts.unset !== "destroy" && opts.unset !== "keep") {
        throw new TypeError('unset option must be "destroy" or "keep"');
      }
      var unsetDestroy = opts.unset === "destroy";
      if (Array.isArray(secret) && secret.length === 0) {
        throw new TypeError("secret option array must contain one or more strings");
      }
      if (secret && !Array.isArray(secret)) {
        secret = [secret];
      }
      if (!secret) {
        deprecate("req.secret; provide secret option");
      }
      if (env === "production" && store instanceof MemoryStore) {
        console.warn(warning);
      }
      store.generate = function(req) {
        req.sessionID = generateId(req);
        req.session = new Session(req);
        req.session.cookie = new Cookie(cookieOptions);
        if (cookieOptions.secure === "auto") {
          req.session.cookie.secure = issecure(req, trustProxy);
        }
      };
      var storeImplementsTouch = typeof store.touch === "function";
      var storeReady = true;
      store.on("disconnect", function ondisconnect() {
        storeReady = false;
      });
      store.on("connect", function onconnect() {
        storeReady = true;
      });
      return function session3(req, res, next) {
        if (req.session) {
          next();
          return;
        }
        if (!storeReady) {
          debug("store is disconnected");
          next();
          return;
        }
        var originalPath = parseUrl.original(req).pathname || "/";
        if (originalPath.indexOf(cookieOptions.path || "/") !== 0) {
          debug("pathname mismatch");
          next();
          return;
        }
        if (!secret && !req.secret) {
          next(new Error("secret option required for sessions"));
          return;
        }
        var secrets = secret || [req.secret];
        var originalHash;
        var originalId;
        var savedHash;
        var touched = false;
        req.sessionStore = store;
        var cookieId = req.sessionID = getcookie(req, name, secrets);
        onHeaders(res, function() {
          if (!req.session) {
            debug("no session");
            return;
          }
          if (!shouldSetCookie(req)) {
            return;
          }
          if (req.session.cookie.secure && !issecure(req, trustProxy)) {
            debug("not secured");
            return;
          }
          if (!touched) {
            req.session.touch();
            touched = true;
          }
          try {
            setcookie(res, name, req.sessionID, secrets[0], req.session.cookie.data);
          } catch (err) {
            defer(next, err);
          }
        });
        var _end = res.end;
        var _write = res.write;
        var ended = false;
        res.end = function end(chunk, encoding) {
          if (ended) {
            return false;
          }
          ended = true;
          var ret;
          var sync = true;
          function writeend() {
            if (sync) {
              ret = _end.call(res, chunk, encoding);
              sync = false;
              return;
            }
            _end.call(res);
          }
          function writetop() {
            if (!sync) {
              return ret;
            }
            if (!res._header) {
              res._implicitHeader();
            }
            if (chunk == null) {
              ret = true;
              return ret;
            }
            var contentLength = Number(res.getHeader("Content-Length"));
            if (!isNaN(contentLength) && contentLength > 0) {
              chunk = !Buffer2.isBuffer(chunk) ? Buffer2.from(chunk, encoding) : chunk;
              encoding = void 0;
              if (chunk.length !== 0) {
                debug("split response");
                ret = _write.call(res, chunk.slice(0, chunk.length - 1));
                chunk = chunk.slice(chunk.length - 1, chunk.length);
                return ret;
              }
            }
            ret = _write.call(res, chunk, encoding);
            sync = false;
            return ret;
          }
          if (shouldDestroy(req)) {
            debug("destroying");
            store.destroy(req.sessionID, function ondestroy(err) {
              if (err) {
                defer(next, err);
              }
              debug("destroyed");
              writeend();
            });
            return writetop();
          }
          if (!req.session) {
            debug("no session");
            return _end.call(res, chunk, encoding);
          }
          if (!touched) {
            req.session.touch();
            touched = true;
          }
          if (shouldSave(req)) {
            req.session.save(function onsave(err) {
              if (err) {
                defer(next, err);
              }
              writeend();
            });
            return writetop();
          } else if (storeImplementsTouch && shouldTouch(req)) {
            debug("touching");
            store.touch(req.sessionID, req.session, function ontouch(err) {
              if (err) {
                defer(next, err);
              }
              debug("touched");
              writeend();
            });
            return writetop();
          }
          return _end.call(res, chunk, encoding);
        };
        function generate() {
          store.generate(req);
          originalId = req.sessionID;
          originalHash = hash(req.session);
          wrapmethods(req.session);
        }
        function inflate(req2, sess) {
          store.createSession(req2, sess);
          originalId = req2.sessionID;
          originalHash = hash(sess);
          if (!resaveSession) {
            savedHash = originalHash;
          }
          wrapmethods(req2.session);
        }
        function rewrapmethods(sess, callback) {
          return function() {
            if (req.session !== sess) {
              wrapmethods(req.session);
            }
            callback.apply(this, arguments);
          };
        }
        function wrapmethods(sess) {
          var _reload = sess.reload;
          var _save = sess.save;
          function reload(callback) {
            debug("reloading %s", this.id);
            _reload.call(this, rewrapmethods(this, callback));
          }
          function save() {
            debug("saving %s", this.id);
            savedHash = hash(this);
            _save.apply(this, arguments);
          }
          Object.defineProperty(sess, "reload", {
            configurable: true,
            enumerable: false,
            value: reload,
            writable: true
          });
          Object.defineProperty(sess, "save", {
            configurable: true,
            enumerable: false,
            value: save,
            writable: true
          });
        }
        function isModified(sess) {
          return originalId !== sess.id || originalHash !== hash(sess);
        }
        function isSaved(sess) {
          return originalId === sess.id && savedHash === hash(sess);
        }
        function shouldDestroy(req2) {
          return req2.sessionID && unsetDestroy && req2.session == null;
        }
        function shouldSave(req2) {
          if (typeof req2.sessionID !== "string") {
            debug("session ignored because of bogus req.sessionID %o", req2.sessionID);
            return false;
          }
          return !saveUninitializedSession && !savedHash && cookieId !== req2.sessionID ? isModified(req2.session) : !isSaved(req2.session);
        }
        function shouldTouch(req2) {
          if (typeof req2.sessionID !== "string") {
            debug("session ignored because of bogus req.sessionID %o", req2.sessionID);
            return false;
          }
          return cookieId === req2.sessionID && !shouldSave(req2);
        }
        function shouldSetCookie(req2) {
          if (typeof req2.sessionID !== "string") {
            return false;
          }
          return cookieId !== req2.sessionID ? saveUninitializedSession || isModified(req2.session) : rollingSessions || req2.session.cookie.expires != null && isModified(req2.session);
        }
        if (!req.sessionID) {
          debug("no SID sent, generating session");
          generate();
          next();
          return;
        }
        debug("fetching %s", req.sessionID);
        store.get(req.sessionID, function(err, sess) {
          if (err && err.code !== "ENOENT") {
            debug("error %j", err);
            next(err);
            return;
          }
          try {
            if (err || !sess) {
              debug("no session found");
              generate();
            } else {
              debug("session found");
              inflate(req, sess);
            }
          } catch (e) {
            next(e);
            return;
          }
          next();
        });
      };
    }
    function generateSessionId(sess) {
      return uid(24);
    }
    function getcookie(req, name, secrets) {
      var header = req.headers.cookie;
      var raw;
      var val;
      if (header) {
        var cookies = cookie.parse(header);
        raw = cookies[name];
        if (raw) {
          if (raw.substr(0, 2) === "s:") {
            val = unsigncookie(raw.slice(2), secrets);
            if (val === false) {
              debug("cookie signature invalid");
              val = void 0;
            }
          } else {
            debug("cookie unsigned");
          }
        }
      }
      if (!val && req.signedCookies) {
        val = req.signedCookies[name];
        if (val) {
          deprecate("cookie should be available in req.headers.cookie");
        }
      }
      if (!val && req.cookies) {
        raw = req.cookies[name];
        if (raw) {
          if (raw.substr(0, 2) === "s:") {
            val = unsigncookie(raw.slice(2), secrets);
            if (val) {
              deprecate("cookie should be available in req.headers.cookie");
            }
            if (val === false) {
              debug("cookie signature invalid");
              val = void 0;
            }
          } else {
            debug("cookie unsigned");
          }
        }
      }
      return val;
    }
    function hash(sess) {
      var str = JSON.stringify(sess, function(key, val) {
        if (this === sess && key === "cookie") {
          return;
        }
        return val;
      });
      return crypto.createHash("sha1").update(str, "utf8").digest("hex");
    }
    function issecure(req, trustProxy) {
      if (req.connection && req.connection.encrypted) {
        return true;
      }
      if (trustProxy === false) {
        return false;
      }
      if (trustProxy !== true) {
        return req.secure === true;
      }
      var header = req.headers["x-forwarded-proto"] || "";
      var index2 = header.indexOf(",");
      var proto = index2 !== -1 ? header.substr(0, index2).toLowerCase().trim() : header.toLowerCase().trim();
      return proto === "https";
    }
    function setcookie(res, name, val, secret, options) {
      var signed = "s:" + signature.sign(val, secret);
      var data = cookie.serialize(name, signed, options);
      debug("set-cookie %s", data);
      var prev = res.getHeader("Set-Cookie") || [];
      var header = Array.isArray(prev) ? prev.concat(data) : [prev, data];
      res.setHeader("Set-Cookie", header);
    }
    function unsigncookie(val, secrets) {
      for (var i = 0; i < secrets.length; i++) {
        var result = signature.unsign(val, secrets[i]);
        if (result !== false) {
          return result;
        }
      }
      return false;
    }
  }
});

// node_modules/passport-strategy/lib/strategy.js
var require_strategy = __commonJS({
  "node_modules/passport-strategy/lib/strategy.js"(exports, module) {
    function Strategy() {
    }
    Strategy.prototype.authenticate = function(req, options) {
      throw new Error("Strategy#authenticate must be overridden by subclass");
    };
    module.exports = Strategy;
  }
});

// node_modules/passport-strategy/lib/index.js
var require_lib = __commonJS({
  "node_modules/passport-strategy/lib/index.js"(exports, module) {
    var Strategy = require_strategy();
    exports = module.exports = Strategy;
    exports.Strategy = Strategy;
  }
});

// node_modules/passport-local/lib/utils.js
var require_utils = __commonJS({
  "node_modules/passport-local/lib/utils.js"(exports) {
    exports.lookup = function(obj, field) {
      if (!obj) {
        return null;
      }
      var chain = field.split("]").join("").split("[");
      for (var i = 0, len = chain.length; i < len; i++) {
        var prop = obj[chain[i]];
        if (typeof prop === "undefined") {
          return null;
        }
        if (typeof prop !== "object") {
          return prop;
        }
        obj = prop;
      }
      return null;
    };
  }
});

// node_modules/passport-local/lib/strategy.js
var require_strategy2 = __commonJS({
  "node_modules/passport-local/lib/strategy.js"(exports, module) {
    var passport2 = require_lib();
    var util2 = __require("util");
    var lookup = require_utils().lookup;
    function Strategy(options, verify) {
      if (typeof options == "function") {
        verify = options;
        options = {};
      }
      if (!verify) {
        throw new TypeError("LocalStrategy requires a verify callback");
      }
      this._usernameField = options.usernameField || "username";
      this._passwordField = options.passwordField || "password";
      passport2.Strategy.call(this);
      this.name = "local";
      this._verify = verify;
      this._passReqToCallback = options.passReqToCallback;
    }
    util2.inherits(Strategy, passport2.Strategy);
    Strategy.prototype.authenticate = function(req, options) {
      options = options || {};
      var username = lookup(req.body, this._usernameField) || lookup(req.query, this._usernameField);
      var password = lookup(req.body, this._passwordField) || lookup(req.query, this._passwordField);
      if (!username || !password) {
        return this.fail({ message: options.badRequestMessage || "Missing credentials" }, 400);
      }
      var self = this;
      function verified(err, user, info) {
        if (err) {
          return self.error(err);
        }
        if (!user) {
          return self.fail(info);
        }
        self.success(user, info);
      }
      try {
        if (self._passReqToCallback) {
          this._verify(req, username, password, verified);
        } else {
          this._verify(username, password, verified);
        }
      } catch (ex) {
        return self.error(ex);
      }
    };
    module.exports = Strategy;
  }
});

// node_modules/passport-local/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/passport-local/lib/index.js"(exports, module) {
    var Strategy = require_strategy2();
    exports = module.exports = Strategy;
    exports.Strategy = Strategy;
  }
});

// node_modules/zod/lib/index.mjs
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    var _a, _b;
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
function timeRegexSource(args) {
  let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
  if (args.precision) {
    regex = `${regex}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    regex = `${regex}(\\.\\d+)?`;
  }
  return regex;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if (!decoded.typ || !decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch (_a) {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / Math.pow(10, decCount);
}
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index2 = 0; index2 < a.length; index2++) {
      const itemA = a[index2];
      const itemB = b[index2];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      var _a, _b;
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          var _a2, _b2;
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = (_b2 = (_a2 = params.fatal) !== null && _a2 !== void 0 ? _a2 : fatal) !== null && _b2 !== void 0 ? _b2 : true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = (_b = (_a = params.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var util, objectUtil, ZodParsedType, getParsedType, ZodIssueCode, quotelessJson, ZodError, errorMap, overrideErrorMap, makeIssue, EMPTY_PATH, ParseStatus, INVALID, DIRTY, OK, isAborted, isDirty, isValid, isAsync, errorUtil, _ZodEnum_cache, _ZodNativeEnum_cache, ParseInputLazyPath, handleResult, ZodType, cuidRegex, cuid2Regex, ulidRegex, uuidRegex, nanoidRegex, jwtRegex, durationRegex, emailRegex, _emojiRegex, emojiRegex, ipv4Regex, ipv4CidrRegex, ipv6Regex, ipv6CidrRegex, base64Regex, base64urlRegex, dateRegexSource, dateRegex, ZodString, ZodNumber, ZodBigInt, ZodBoolean, ZodDate, ZodSymbol, ZodUndefined, ZodNull, ZodAny, ZodUnknown, ZodNever, ZodVoid, ZodArray, ZodObject, ZodUnion, getDiscriminator, ZodDiscriminatedUnion, ZodIntersection, ZodTuple, ZodRecord, ZodMap, ZodSet, ZodFunction, ZodLazy, ZodLiteral, ZodEnum, ZodNativeEnum, ZodPromise, ZodEffects, ZodOptional, ZodNullable, ZodDefault, ZodCatch, ZodNaN, BRAND, ZodBranded, ZodPipeline, ZodReadonly, late, ZodFirstPartyTypeKind, instanceOfType, stringType, numberType, nanType, bigIntType, booleanType, dateType, symbolType, undefinedType, nullType, anyType, unknownType, neverType, voidType, arrayType, objectType, strictObjectType, unionType, discriminatedUnionType, intersectionType, tupleType, recordType, mapType, setType, functionType, lazyType, literalType, enumType, nativeEnumType, promiseType, effectsType, optionalType, nullableType, preprocessType, pipelineType, ostring, onumber, oboolean, coerce, NEVER, z;
var init_lib = __esm({
  "node_modules/zod/lib/index.mjs"() {
    (function(util2) {
      util2.assertEqual = (val) => val;
      function assertIs(_arg) {
      }
      util2.assertIs = assertIs;
      function assertNever(_x) {
        throw new Error();
      }
      util2.assertNever = assertNever;
      util2.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
          obj[item] = item;
        }
        return obj;
      };
      util2.getValidEnumValues = (obj) => {
        const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
          filtered[k] = obj[k];
        }
        return util2.objectValues(filtered);
      };
      util2.objectValues = (obj) => {
        return util2.objectKeys(obj).map(function(e) {
          return obj[e];
        });
      };
      util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
        const keys = [];
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            keys.push(key);
          }
        }
        return keys;
      };
      util2.find = (arr, checker) => {
        for (const item of arr) {
          if (checker(item))
            return item;
        }
        return void 0;
      };
      util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
      function joinValues(array, separator = " | ") {
        return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
      }
      util2.joinValues = joinValues;
      util2.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
    })(util || (util = {}));
    (function(objectUtil2) {
      objectUtil2.mergeShapes = (first, second) => {
        return {
          ...first,
          ...second
          // second overwrites first
        };
      };
    })(objectUtil || (objectUtil = {}));
    ZodParsedType = util.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]);
    getParsedType = (data) => {
      const t = typeof data;
      switch (t) {
        case "undefined":
          return ZodParsedType.undefined;
        case "string":
          return ZodParsedType.string;
        case "number":
          return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
          return ZodParsedType.boolean;
        case "function":
          return ZodParsedType.function;
        case "bigint":
          return ZodParsedType.bigint;
        case "symbol":
          return ZodParsedType.symbol;
        case "object":
          if (Array.isArray(data)) {
            return ZodParsedType.array;
          }
          if (data === null) {
            return ZodParsedType.null;
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return ZodParsedType.promise;
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return ZodParsedType.map;
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return ZodParsedType.set;
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return ZodParsedType.date;
          }
          return ZodParsedType.object;
        default:
          return ZodParsedType.unknown;
      }
    };
    ZodIssueCode = util.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite"
    ]);
    quotelessJson = (obj) => {
      const json = JSON.stringify(obj, null, 2);
      return json.replace(/"([^"]+)":/g, "$1:");
    };
    ZodError = class _ZodError extends Error {
      get errors() {
        return this.issues;
      }
      constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
          this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
          this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(this, actualProto);
        } else {
          this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
          for (const issue of error.issues) {
            if (issue.code === "invalid_union") {
              issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
              processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
              processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i = 0;
              while (i < issue.path.length) {
                const el = issue.path[i];
                const terminal = i === issue.path.length - 1;
                if (!terminal) {
                  curr[el] = curr[el] || { _errors: [] };
                } else {
                  curr[el] = curr[el] || { _errors: [] };
                  curr[el]._errors.push(mapper(issue));
                }
                curr = curr[el];
                i++;
              }
            }
          }
        };
        processError(this);
        return fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof _ZodError)) {
          throw new Error(`Not a ZodError: ${value}`);
        }
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
          if (sub.path.length > 0) {
            fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
            fieldErrors[sub.path[0]].push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      get formErrors() {
        return this.flatten();
      }
    };
    ZodError.create = (issues) => {
      const error = new ZodError(issues);
      return error;
    };
    errorMap = (issue, _ctx) => {
      let message;
      switch (issue.code) {
        case ZodIssueCode.invalid_type:
          if (issue.received === ZodParsedType.undefined) {
            message = "Required";
          } else {
            message = `Expected ${issue.expected}, received ${issue.received}`;
          }
          break;
        case ZodIssueCode.invalid_literal:
          message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
          break;
        case ZodIssueCode.unrecognized_keys:
          message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
          break;
        case ZodIssueCode.invalid_union:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_union_discriminator:
          message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
          break;
        case ZodIssueCode.invalid_enum_value:
          message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
          break;
        case ZodIssueCode.invalid_arguments:
          message = `Invalid function arguments`;
          break;
        case ZodIssueCode.invalid_return_type:
          message = `Invalid function return type`;
          break;
        case ZodIssueCode.invalid_date:
          message = `Invalid date`;
          break;
        case ZodIssueCode.invalid_string:
          if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
              message = `Invalid input: must include "${issue.validation.includes}"`;
              if (typeof issue.validation.position === "number") {
                message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
              }
            } else if ("startsWith" in issue.validation) {
              message = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
              message = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
              util.assertNever(issue.validation);
            }
          } else if (issue.validation !== "regex") {
            message = `Invalid ${issue.validation}`;
          } else {
            message = "Invalid";
          }
          break;
        case ZodIssueCode.too_small:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.too_big:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "bigint")
            message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.custom:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_intersection_types:
          message = `Intersection results could not be merged`;
          break;
        case ZodIssueCode.not_multiple_of:
          message = `Number must be a multiple of ${issue.multipleOf}`;
          break;
        case ZodIssueCode.not_finite:
          message = "Number must be finite";
          break;
        default:
          message = _ctx.defaultError;
          util.assertNever(issue);
      }
      return { message };
    };
    overrideErrorMap = errorMap;
    makeIssue = (params) => {
      const { data, path: path2, errorMaps, issueData } = params;
      const fullPath = [...path2, ...issueData.path || []];
      const fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (issueData.message !== void 0) {
        return {
          ...issueData,
          path: fullPath,
          message: issueData.message
        };
      }
      let errorMessage = "";
      const maps = errorMaps.filter((m) => !!m).slice().reverse();
      for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
      }
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    };
    EMPTY_PATH = [];
    ParseStatus = class _ParseStatus {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        if (this.value === "valid")
          this.value = "dirty";
      }
      abort() {
        if (this.value !== "aborted")
          this.value = "aborted";
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
          if (s.status === "aborted")
            return INVALID;
          if (s.status === "dirty")
            status.dirty();
          arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return _ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const { key, value } = pair;
          if (key.status === "aborted")
            return INVALID;
          if (value.status === "aborted")
            return INVALID;
          if (key.status === "dirty")
            status.dirty();
          if (value.status === "dirty")
            status.dirty();
          if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
          }
        }
        return { status: status.value, value: finalObject };
      }
    };
    INVALID = Object.freeze({
      status: "aborted"
    });
    DIRTY = (value) => ({ status: "dirty", value });
    OK = (value) => ({ status: "valid", value });
    isAborted = (x) => x.status === "aborted";
    isDirty = (x) => x.status === "dirty";
    isValid = (x) => x.status === "valid";
    isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
    (function(errorUtil2) {
      errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
      errorUtil2.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
    })(errorUtil || (errorUtil = {}));
    ParseInputLazyPath = class {
      constructor(parent, value, path2, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path2;
        this._key = key;
      }
      get path() {
        if (!this._cachedPath.length) {
          if (this._key instanceof Array) {
            this._cachedPath.push(...this._path, ...this._key);
          } else {
            this._cachedPath.push(...this._path, this._key);
          }
        }
        return this._cachedPath;
      }
    };
    handleResult = (ctx, result) => {
      if (isValid(result)) {
        return { success: true, data: result.value };
      } else {
        if (!ctx.common.issues.length) {
          throw new Error("Validation failed but no issues detected.");
        }
        return {
          success: false,
          get error() {
            if (this._error)
              return this._error;
            const error = new ZodError(ctx.common.issues);
            this._error = error;
            return this._error;
          }
        };
      }
    };
    ZodType = class {
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return getParsedType(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new ParseStatus(),
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
          throw new Error("Synchronous parse encountered promise.");
        }
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        var _a;
        const ctx = {
          common: {
            issues: [],
            async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
            contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
          },
          path: (params === null || params === void 0 ? void 0 : params.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
      }
      "~validate"(data) {
        var _a, _b;
        const ctx = {
          common: {
            issues: [],
            async: !!this["~standard"].async
          },
          path: [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        if (!this["~standard"].async) {
          try {
            const result = this._parseSync({ data, path: [], parent: ctx });
            return isValid(result) ? {
              value: result.value
            } : {
              issues: ctx.common.issues
            };
          } catch (err) {
            if ((_b = (_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes("encountered")) {
              this["~standard"].async = true;
            }
            ctx.common = {
              issues: [],
              async: true
            };
          }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        });
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
            async: true
          },
          path: (params === null || params === void 0 ? void 0 : params.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = (val) => {
          if (typeof message === "string" || typeof message === "undefined") {
            return { message };
          } else if (typeof message === "function") {
            return message(val);
          } else {
            return message;
          }
        };
        return this._refinement((val, ctx) => {
          const result = check(val);
          const setError = () => ctx.addIssue({
            code: ZodIssueCode.custom,
            ...getIssueProperties(val)
          });
          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then((data) => {
              if (!data) {
                setError();
                return false;
              } else {
                return true;
              }
            });
          }
          if (!result) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
          if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
          } else {
            return true;
          }
        });
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "refinement", refinement }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      constructor(def) {
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
          version: 1,
          vendor: "zod",
          validate: (data) => this["~validate"](data)
        };
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([this, option], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "transform", transform }
        });
      }
      default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        const This = this.constructor;
        return new This({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    };
    cuidRegex = /^c[^\s-]{8,}$/i;
    cuid2Regex = /^[0-9a-z]+$/;
    ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
    uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
    nanoidRegex = /^[a-z0-9_-]{21}$/i;
    jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
    ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
    dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
    dateRegex = new RegExp(`^${dateRegexSource}$`);
    ZodString = class _ZodString extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.string,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.length < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.length > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              if (tooBig) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              } else if (tooSmall) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              }
              status.dirty();
            }
          } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "email",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "emoji") {
            if (!emojiRegex) {
              emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "emoji",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "uuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "nanoid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid2",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ulid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "url") {
            try {
              new URL(input.data);
            } catch (_a) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "regex",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "trim") {
            input.data = input.data.trim();
          } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { includes: check.value, position: check.position },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
          } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
          } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { startsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { endsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "date",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "time",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "duration",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ip",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "jwt") {
            if (!isValidJWT(input.data, check.alg)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "jwt",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cidr") {
            if (!isValidCidr(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cidr",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64url") {
            if (!base64urlRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
          validation,
          code: ZodIssueCode.invalid_string,
          ...errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
      }
      url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
      }
      emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
      }
      uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
      }
      nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
      }
      cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
      }
      cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
      }
      ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
      }
      base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
      }
      base64url(message) {
        return this._addCheck({
          kind: "base64url",
          ...errorUtil.errToObj(message)
        });
      }
      jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
      }
      ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
      }
      cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
      }
      datetime(options) {
        var _a, _b;
        if (typeof options === "string") {
          return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options
          });
        }
        return this._addCheck({
          kind: "datetime",
          precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
          offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
          local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
          ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      date(message) {
        return this._addCheck({ kind: "date", message });
      }
      time(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "time",
            precision: null,
            message: options
          });
        }
        return this._addCheck({
          kind: "time",
          precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
          ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: options === null || options === void 0 ? void 0 : options.position,
          ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil.errToObj(message)
        });
      }
      /**
       * Equivalent to `.min(1)`
       */
      nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
      }
      trim() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      toLowerCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toLowerCase" }]
        });
      }
      toUpperCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toUpperCase" }]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
      }
      get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
      }
      get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
      }
      get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
      }
      get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
      }
      get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
      }
      get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
      }
      get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
      }
      get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
      }
      get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
      }
      get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
      }
      get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
      }
      get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
      }
      get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
      }
      get isBase64url() {
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodString.create = (params) => {
      var _a;
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params)
      });
    };
    ZodNumber = class _ZodNumber extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.number,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "int") {
            if (!util.isInteger(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_finite,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodNumber({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodNumber({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: true,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: true,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
      }
      get isFinite() {
        let max = null, min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
          } else if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          } else if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    };
    ZodNumber.create = (params) => {
      return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params)
      });
    };
    ZodBigInt = class _ZodBigInt extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
      }
      _parse(input) {
        if (this._def.coerce) {
          try {
            input.data = BigInt(input.data);
          } catch (_a) {
            return this._getInvalidInput(input);
          }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
          return this._getInvalidInput(input);
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.bigint,
          received: ctx.parsedType
        });
        return INVALID;
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodBigInt({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodBigInt({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodBigInt.create = (params) => {
      var _a;
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params)
      });
    };
    ZodBoolean = class extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.boolean,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodBoolean.create = (params) => {
      return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params)
      });
    };
    ZodDate = class _ZodDate extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.date,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        if (isNaN(input.data.getTime())) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_date
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                message: check.message,
                inclusive: true,
                exact: false,
                minimum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                message: check.message,
                inclusive: true,
                exact: false,
                maximum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new _ZodDate({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min != null ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max != null ? new Date(max) : null;
      }
    };
    ZodDate.create = (params) => {
      return new ZodDate({
        checks: [],
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
      });
    };
    ZodSymbol = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.symbol,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodSymbol.create = (params) => {
      return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
      });
    };
    ZodUndefined = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.undefined,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodUndefined.create = (params) => {
      return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
      });
    };
    ZodNull = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.null,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodNull.create = (params) => {
      return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
      });
    };
    ZodAny = class extends ZodType {
      constructor() {
        super(...arguments);
        this._any = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodAny.create = (params) => {
      return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
      });
    };
    ZodUnknown = class extends ZodType {
      constructor() {
        super(...arguments);
        this._unknown = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodUnknown.create = (params) => {
      return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
      });
    };
    ZodNever = class extends ZodType {
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.never,
          received: ctx.parsedType
        });
        return INVALID;
      }
    };
    ZodNever.create = (params) => {
      return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
      });
    };
    ZodVoid = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.void,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodVoid.create = (params) => {
      return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
      });
    };
    ZodArray = class _ZodArray extends ZodType {
      _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (def.exactLength !== null) {
          const tooBig = ctx.data.length > def.exactLength.value;
          const tooSmall = ctx.data.length < def.exactLength.value;
          if (tooBig || tooSmall) {
            addIssueToContext(ctx, {
              code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
              minimum: tooSmall ? def.exactLength.value : void 0,
              maximum: tooBig ? def.exactLength.value : void 0,
              type: "array",
              inclusive: true,
              exact: true,
              message: def.exactLength.message
            });
            status.dirty();
          }
        }
        if (def.minLength !== null) {
          if (ctx.data.length < def.minLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.minLength.message
            });
            status.dirty();
          }
        }
        if (def.maxLength !== null) {
          if (ctx.data.length > def.maxLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.maxLength.message
            });
            status.dirty();
          }
        }
        if (ctx.common.async) {
          return Promise.all([...ctx.data].map((item, i) => {
            return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
          })).then((result2) => {
            return ParseStatus.mergeArray(status, result2);
          });
        }
        const result = [...ctx.data].map((item, i) => {
          return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new _ZodArray({
          ...this._def,
          minLength: { value: minLength, message: errorUtil.toString(message) }
        });
      }
      max(maxLength, message) {
        return new _ZodArray({
          ...this._def,
          maxLength: { value: maxLength, message: errorUtil.toString(message) }
        });
      }
      length(len, message) {
        return new _ZodArray({
          ...this._def,
          exactLength: { value: len, message: errorUtil.toString(message) }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodArray.create = (schema, params) => {
      return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
      });
    };
    ZodObject = class _ZodObject extends ZodType {
      constructor() {
        super(...arguments);
        this._cached = null;
        this.nonstrict = this.passthrough;
        this.augment = this.extend;
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        return this._cached = { shape, keys };
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
          for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
              extraKeys.push(key);
            }
          }
        }
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key];
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
              pairs.push({
                key: { status: "valid", value: key },
                value: { status: "valid", value: ctx.data[key] }
              });
            }
          } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.unrecognized_keys,
                keys: extraKeys
              });
              status.dirty();
            }
          } else if (unknownKeys === "strip") ;
          else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
          }
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: { status: "valid", value: key },
              value: catchall._parse(
                new ParseInputLazyPath(ctx, value, ctx.path, key)
                //, ctx.child(key), value, getParsedType(value)
              ),
              alwaysSet: key in ctx.data
            });
          }
        }
        if (ctx.common.async) {
          return Promise.resolve().then(async () => {
            const syncPairs = [];
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              syncPairs.push({
                key,
                value,
                alwaysSet: pair.alwaysSet
              });
            }
            return syncPairs;
          }).then((syncPairs) => {
            return ParseStatus.mergeObjectSync(status, syncPairs);
          });
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        errorUtil.errToObj;
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...message !== void 0 ? {
            errorMap: (issue, ctx) => {
              var _a, _b, _c, _d;
              const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
              if (issue.code === "unrecognized_keys")
                return {
                  message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
                };
              return {
                message: defaultError
              };
            }
          } : {}
        });
      }
      strip() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      // const AugmentFactory =
      //   <Def extends ZodObjectDef>(def: Def) =>
      //   <Augmentation extends ZodRawShape>(
      //     augmentation: Augmentation
      //   ): ZodObject<
      //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
      //     Def["unknownKeys"],
      //     Def["catchall"]
      //   > => {
      //     return new ZodObject({
      //       ...def,
      //       shape: () => ({
      //         ...def.shape(),
      //         ...augmentation,
      //       }),
      //     }) as any;
      //   };
      extend(augmentation) {
        return new _ZodObject({
          ...this._def,
          shape: () => ({
            ...this._def.shape(),
            ...augmentation
          })
        });
      }
      /**
       * Prior to zod@1.0.12 there was a bug in the
       * inferred type of merged objects. Please
       * upgrade if you are experiencing issues.
       */
      merge(merging) {
        const merged = new _ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: () => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
      }
      // merge<
      //   Incoming extends AnyZodObject,
      //   Augmentation extends Incoming["shape"],
      //   NewOutput extends {
      //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
      //       ? Augmentation[k]["_output"]
      //       : k extends keyof Output
      //       ? Output[k]
      //       : never;
      //   },
      //   NewInput extends {
      //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
      //       ? Augmentation[k]["_input"]
      //       : k extends keyof Input
      //       ? Input[k]
      //       : never;
      //   }
      // >(
      //   merging: Incoming
      // ): ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"],
      //   NewOutput,
      //   NewInput
      // > {
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      setKey(key, schema) {
        return this.augment({ [key]: schema });
      }
      // merge<Incoming extends AnyZodObject>(
      //   merging: Incoming
      // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
      // ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"]
      // > {
      //   // const mergedShape = objectUtil.mergeShapes(
      //   //   this._def.shape(),
      //   //   merging._def.shape()
      //   // );
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      catchall(index2) {
        return new _ZodObject({
          ...this._def,
          catchall: index2
        });
      }
      pick(mask) {
        const shape = {};
        util.objectKeys(mask).forEach((key) => {
          if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
          }
        });
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      omit(mask) {
        const shape = {};
        util.objectKeys(this.shape).forEach((key) => {
          if (!mask[key]) {
            shape[key] = this.shape[key];
          }
        });
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      /**
       * @deprecated
       */
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
          const fieldSchema = this.shape[key];
          if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
          } else {
            newShape[key] = fieldSchema.optional();
          }
        });
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      required(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
          if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
          } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
              newField = newField._def.innerType;
            }
            newShape[key] = newField;
          }
        });
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      keyof() {
        return createZodEnum(util.objectKeys(this.shape));
      }
    };
    ZodObject.create = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.strictCreate = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.lazycreate = (shape, params) => {
      return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodUnion = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
          for (const result of results) {
            if (result.result.status === "valid") {
              return result.result;
            }
          }
          for (const result of results) {
            if (result.result.status === "dirty") {
              ctx.common.issues.push(...result.ctx.common.issues);
              return result.result;
            }
          }
          const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return Promise.all(options.map(async (option) => {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: childCtx
              }),
              ctx: childCtx
            };
          })).then(handleResults);
        } else {
          let dirty = void 0;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            const result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if (result.status === "valid") {
              return result;
            } else if (result.status === "dirty" && !dirty) {
              dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
              issues.push(childCtx.common.issues);
            }
          }
          if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
          }
          const unionErrors = issues.map((issues2) => new ZodError(issues2));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    };
    ZodUnion.create = (types, params) => {
      return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
      });
    };
    getDiscriminator = (type) => {
      if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
      } else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
      } else if (type instanceof ZodLiteral) {
        return [type.value];
      } else if (type instanceof ZodEnum) {
        return type.options;
      } else if (type instanceof ZodNativeEnum) {
        return util.objectValues(type.enum);
      } else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
      } else if (type instanceof ZodUndefined) {
        return [void 0];
      } else if (type instanceof ZodNull) {
        return [null];
      } else if (type instanceof ZodOptional) {
        return [void 0, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
      } else {
        return [];
      }
    };
    ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [discriminator]
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        } else {
          return option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        }
      }
      get discriminator() {
        return this._def.discriminator;
      }
      get options() {
        return this._def.options;
      }
      get optionsMap() {
        return this._def.optionsMap;
      }
      /**
       * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
       * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
       * have a different value for each object in the union.
       * @param discriminator the name of the discriminator property
       * @param types an array of object schemas
       * @param params
       */
      static create(discriminator, options, params) {
        const optionsMap = /* @__PURE__ */ new Map();
        for (const type of options) {
          const discriminatorValues = getDiscriminator(type.shape[discriminator]);
          if (!discriminatorValues.length) {
            throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
          }
          for (const value of discriminatorValues) {
            if (optionsMap.has(value)) {
              throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            }
            optionsMap.set(value, type);
          }
        }
        return new _ZodDiscriminatedUnion({
          typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
          discriminator,
          options,
          optionsMap,
          ...processCreateParams(params)
        });
      }
    };
    ZodIntersection = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
          if (isAborted(parsedLeft) || isAborted(parsedRight)) {
            return INVALID;
          }
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          if (!merged.valid) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_intersection_types
            });
            return INVALID;
          }
          if (isDirty(parsedLeft) || isDirty(parsedRight)) {
            status.dirty();
          }
          return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
          return Promise.all([
            this._def.left._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            }),
            this._def.right._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            })
          ]).then(([left, right]) => handleParsed(left, right));
        } else {
          return handleParsed(this._def.left._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }), this._def.right._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }));
        }
      }
    };
    ZodIntersection.create = (left, right, params) => {
      return new ZodIntersection({
        left,
        right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
      });
    };
    ZodTuple = class _ZodTuple extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          status.dirty();
        }
        const items = [...ctx.data].map((item, itemIndex) => {
          const schema = this._def.items[itemIndex] || this._def.rest;
          if (!schema)
            return null;
          return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x) => !!x);
        if (ctx.common.async) {
          return Promise.all(items).then((results) => {
            return ParseStatus.mergeArray(status, results);
          });
        } else {
          return ParseStatus.mergeArray(status, items);
        }
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new _ZodTuple({
          ...this._def,
          rest
        });
      }
    };
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      }
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    ZodRecord = class _ZodRecord extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
          pairs.push({
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
            value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (ctx.common.async) {
          return ParseStatus.mergeObjectAsync(status, pairs);
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get element() {
        return this._def.valueType;
      }
      static create(first, second, third) {
        if (second instanceof ZodType) {
          return new _ZodRecord({
            keyType: first,
            valueType: second,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(third)
          });
        }
        return new _ZodRecord({
          keyType: ZodString.create(),
          valueType: first,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(second)
        });
      }
    };
    ZodMap = class extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.map,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index2) => {
          return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index2, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index2, "value"]))
          };
        });
        if (ctx.common.async) {
          const finalMap = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              if (key.status === "aborted" || value.status === "aborted") {
                return INVALID;
              }
              if (key.status === "dirty" || value.status === "dirty") {
                status.dirty();
              }
              finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
          });
        } else {
          const finalMap = /* @__PURE__ */ new Map();
          for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        }
      }
    };
    ZodMap.create = (keyType, valueType, params) => {
      return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
      });
    };
    ZodSet = class _ZodSet extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.set,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
          if (ctx.data.size < def.minSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.minSize.message
            });
            status.dirty();
          }
        }
        if (def.maxSize !== null) {
          if (ctx.data.size > def.maxSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.maxSize.message
            });
            status.dirty();
          }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements2) {
          const parsedSet = /* @__PURE__ */ new Set();
          for (const element of elements2) {
            if (element.status === "aborted")
              return INVALID;
            if (element.status === "dirty")
              status.dirty();
            parsedSet.add(element.value);
          }
          return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
          return Promise.all(elements).then((elements2) => finalizeSet(elements2));
        } else {
          return finalizeSet(elements);
        }
      }
      min(minSize, message) {
        return new _ZodSet({
          ...this._def,
          minSize: { value: minSize, message: errorUtil.toString(message) }
        });
      }
      max(maxSize, message) {
        return new _ZodSet({
          ...this._def,
          maxSize: { value: maxSize, message: errorUtil.toString(message) }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodSet.create = (valueType, params) => {
      return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
      });
    };
    ZodFunction = class _ZodFunction extends ZodType {
      constructor() {
        super(...arguments);
        this.validate = this.implement;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.function,
            received: ctx.parsedType
          });
          return INVALID;
        }
        function makeArgsIssue(args, error) {
          return makeIssue({
            data: args,
            path: ctx.path,
            errorMaps: [
              ctx.common.contextualErrorMap,
              ctx.schemaErrorMap,
              getErrorMap(),
              errorMap
            ].filter((x) => !!x),
            issueData: {
              code: ZodIssueCode.invalid_arguments,
              argumentsError: error
            }
          });
        }
        function makeReturnsIssue(returns, error) {
          return makeIssue({
            data: returns,
            path: ctx.path,
            errorMaps: [
              ctx.common.contextualErrorMap,
              ctx.schemaErrorMap,
              getErrorMap(),
              errorMap
            ].filter((x) => !!x),
            issueData: {
              code: ZodIssueCode.invalid_return_type,
              returnTypeError: error
            }
          });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
          const me = this;
          return OK(async function(...args) {
            const error = new ZodError([]);
            const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
              error.addIssue(makeArgsIssue(args, e));
              throw error;
            });
            const result = await Reflect.apply(fn, this, parsedArgs);
            const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
              error.addIssue(makeReturnsIssue(result, e));
              throw error;
            });
            return parsedReturns;
          });
        } else {
          const me = this;
          return OK(function(...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) {
              throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
            }
            const result = Reflect.apply(fn, this, parsedArgs.data);
            const parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) {
              throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
            }
            return parsedReturns.data;
          });
        }
      }
      parameters() {
        return this._def.args;
      }
      returnType() {
        return this._def.returns;
      }
      args(...items) {
        return new _ZodFunction({
          ...this._def,
          args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
      }
      returns(returnType) {
        return new _ZodFunction({
          ...this._def,
          returns: returnType
        });
      }
      implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      static create(args, returns, params) {
        return new _ZodFunction({
          args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
          returns: returns || ZodUnknown.create(),
          typeName: ZodFirstPartyTypeKind.ZodFunction,
          ...processCreateParams(params)
        });
      }
    };
    ZodLazy = class extends ZodType {
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
      }
    };
    ZodLazy.create = (getter, params) => {
      return new ZodLazy({
        getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
      });
    };
    ZodLiteral = class extends ZodType {
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_literal,
            expected: this._def.value
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
      get value() {
        return this._def.value;
      }
    };
    ZodLiteral.create = (value, params) => {
      return new ZodLiteral({
        value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
      });
    };
    ZodEnum = class _ZodEnum extends ZodType {
      constructor() {
        super(...arguments);
        _ZodEnum_cache.set(this, void 0);
      }
      _parse(input) {
        if (typeof input.data !== "string") {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
          __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return _ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
          ...this._def,
          ...newDef
        });
      }
    };
    _ZodEnum_cache = /* @__PURE__ */ new WeakMap();
    ZodEnum.create = createZodEnum;
    ZodNativeEnum = class extends ZodType {
      constructor() {
        super(...arguments);
        _ZodNativeEnum_cache.set(this, void 0);
      }
      _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
          __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get enum() {
        return this._def.values;
      }
    };
    _ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
    ZodNativeEnum.create = (values, params) => {
      return new ZodNativeEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
      });
    };
    ZodPromise = class extends ZodType {
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.promise,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
          return this._def.type.parseAsync(data, {
            path: ctx.path,
            errorMap: ctx.common.contextualErrorMap
          });
        }));
      }
    };
    ZodPromise.create = (schema, params) => {
      return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
      });
    };
    ZodEffects = class extends ZodType {
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
          addIssue: (arg) => {
            addIssueToContext(ctx, arg);
            if (arg.fatal) {
              status.abort();
            } else {
              status.dirty();
            }
          },
          get path() {
            return ctx.path;
          }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(processed).then(async (processed2) => {
              if (status.value === "aborted")
                return INVALID;
              const result = await this._def.schema._parseAsync({
                data: processed2,
                path: ctx.path,
                parent: ctx
              });
              if (result.status === "aborted")
                return INVALID;
              if (result.status === "dirty")
                return DIRTY(result.value);
              if (status.value === "dirty")
                return DIRTY(result.value);
              return result;
            });
          } else {
            if (status.value === "aborted")
              return INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          }
        }
        if (effect.type === "refinement") {
          const executeRefinement = (acc) => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
              return Promise.resolve(result);
            }
            if (result instanceof Promise) {
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
          };
          if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
              if (inner.status === "aborted")
                return INVALID;
              if (inner.status === "dirty")
                status.dirty();
              return executeRefinement(inner.value).then(() => {
                return { status: status.value, value: inner.value };
              });
            });
          }
        }
        if (effect.type === "transform") {
          if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!isValid(base))
              return base;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
              throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
              if (!isValid(base))
                return base;
              return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
            });
          }
        }
        util.assertNever(effect);
      }
    };
    ZodEffects.create = (schema, effect, params) => {
      return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params)
      });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
      return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
      });
    };
    ZodOptional = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
          return OK(void 0);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodOptional.create = (type, params) => {
      return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
      });
    };
    ZodNullable = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
          return OK(null);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodNullable.create = (type, params) => {
      return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
      });
    };
    ZodDefault = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
          data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    };
    ZodDefault.create = (type, params) => {
      return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params)
      });
    };
    ZodCatch = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        };
        const result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        if (isAsync(result)) {
          return result.then((result2) => {
            return {
              status: "valid",
              value: result2.status === "valid" ? result2.value : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues);
                },
                input: newCtx.data
              })
            };
          });
        } else {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        }
      }
      removeCatch() {
        return this._def.innerType;
      }
    };
    ZodCatch.create = (type, params) => {
      return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params)
      });
    };
    ZodNaN = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.nan,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
    };
    ZodNaN.create = (params) => {
      return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
      });
    };
    BRAND = Symbol("zod_brand");
    ZodBranded = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    };
    ZodPipeline = class _ZodPipeline extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
          const handleAsync = async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inResult.status === "aborted")
              return INVALID;
            if (inResult.status === "dirty") {
              status.dirty();
              return DIRTY(inResult.value);
            } else {
              return this._def.out._parseAsync({
                data: inResult.value,
                path: ctx.path,
                parent: ctx
              });
            }
          };
          return handleAsync();
        } else {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return {
              status: "dirty",
              value: inResult.value
            };
          } else {
            return this._def.out._parseSync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        }
      }
      static create(a, b) {
        return new _ZodPipeline({
          in: a,
          out: b,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    };
    ZodReadonly = class extends ZodType {
      _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
          if (isValid(data)) {
            data.value = Object.freeze(data.value);
          }
          return data;
        };
        return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodReadonly.create = (type, params) => {
      return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
      });
    };
    late = {
      object: ZodObject.lazycreate
    };
    (function(ZodFirstPartyTypeKind2) {
      ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
      ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
      ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
      ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
      ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
      ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
      ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
      ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
      ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
      ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
      ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
      ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
      ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
      ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
      ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
      ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
      ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
      ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
      ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
      ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
      ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
      ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
      ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
      ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
      ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
      ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
      ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
      ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
      ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
      ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
      ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
      ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
      ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
      ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
      ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
      ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
    })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
    instanceOfType = (cls, params = {
      message: `Input not instance of ${cls.name}`
    }) => custom((data) => data instanceof cls, params);
    stringType = ZodString.create;
    numberType = ZodNumber.create;
    nanType = ZodNaN.create;
    bigIntType = ZodBigInt.create;
    booleanType = ZodBoolean.create;
    dateType = ZodDate.create;
    symbolType = ZodSymbol.create;
    undefinedType = ZodUndefined.create;
    nullType = ZodNull.create;
    anyType = ZodAny.create;
    unknownType = ZodUnknown.create;
    neverType = ZodNever.create;
    voidType = ZodVoid.create;
    arrayType = ZodArray.create;
    objectType = ZodObject.create;
    strictObjectType = ZodObject.strictCreate;
    unionType = ZodUnion.create;
    discriminatedUnionType = ZodDiscriminatedUnion.create;
    intersectionType = ZodIntersection.create;
    tupleType = ZodTuple.create;
    recordType = ZodRecord.create;
    mapType = ZodMap.create;
    setType = ZodSet.create;
    functionType = ZodFunction.create;
    lazyType = ZodLazy.create;
    literalType = ZodLiteral.create;
    enumType = ZodEnum.create;
    nativeEnumType = ZodNativeEnum.create;
    promiseType = ZodPromise.create;
    effectsType = ZodEffects.create;
    optionalType = ZodOptional.create;
    nullableType = ZodNullable.create;
    preprocessType = ZodEffects.createWithPreprocess;
    pipelineType = ZodPipeline.create;
    ostring = () => stringType().optional();
    onumber = () => numberType().optional();
    oboolean = () => booleanType().optional();
    coerce = {
      string: (arg) => ZodString.create({ ...arg, coerce: true }),
      number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
      boolean: (arg) => ZodBoolean.create({
        ...arg,
        coerce: true
      }),
      bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
      date: (arg) => ZodDate.create({ ...arg, coerce: true })
    };
    NEVER = INVALID;
    z = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      defaultErrorMap: errorMap,
      setErrorMap,
      getErrorMap,
      makeIssue,
      EMPTY_PATH,
      addIssueToContext,
      ParseStatus,
      INVALID,
      DIRTY,
      OK,
      isAborted,
      isDirty,
      isValid,
      isAsync,
      get util() {
        return util;
      },
      get objectUtil() {
        return objectUtil;
      },
      ZodParsedType,
      getParsedType,
      ZodType,
      datetimeRegex,
      ZodString,
      ZodNumber,
      ZodBigInt,
      ZodBoolean,
      ZodDate,
      ZodSymbol,
      ZodUndefined,
      ZodNull,
      ZodAny,
      ZodUnknown,
      ZodNever,
      ZodVoid,
      ZodArray,
      ZodObject,
      ZodUnion,
      ZodDiscriminatedUnion,
      ZodIntersection,
      ZodTuple,
      ZodRecord,
      ZodMap,
      ZodSet,
      ZodFunction,
      ZodLazy,
      ZodLiteral,
      ZodEnum,
      ZodNativeEnum,
      ZodPromise,
      ZodEffects,
      ZodTransformer: ZodEffects,
      ZodOptional,
      ZodNullable,
      ZodDefault,
      ZodCatch,
      ZodNaN,
      BRAND,
      ZodBranded,
      ZodPipeline,
      ZodReadonly,
      custom,
      Schema: ZodType,
      ZodSchema: ZodType,
      late,
      get ZodFirstPartyTypeKind() {
        return ZodFirstPartyTypeKind;
      },
      coerce,
      any: anyType,
      array: arrayType,
      bigint: bigIntType,
      boolean: booleanType,
      date: dateType,
      discriminatedUnion: discriminatedUnionType,
      effect: effectsType,
      "enum": enumType,
      "function": functionType,
      "instanceof": instanceOfType,
      intersection: intersectionType,
      lazy: lazyType,
      literal: literalType,
      map: mapType,
      nan: nanType,
      nativeEnum: nativeEnumType,
      never: neverType,
      "null": nullType,
      nullable: nullableType,
      number: numberType,
      object: objectType,
      oboolean,
      onumber,
      optional: optionalType,
      ostring,
      pipeline: pipelineType,
      preprocess: preprocessType,
      promise: promiseType,
      record: recordType,
      set: setType,
      strictObject: strictObjectType,
      string: stringType,
      symbol: symbolType,
      transformer: effectsType,
      tuple: tupleType,
      "undefined": undefinedType,
      union: unionType,
      unknown: unknownType,
      "void": voidType,
      NEVER,
      ZodIssueCode,
      quotelessJson,
      ZodError
    });
  }
});

// node_modules/drizzle-zod/index.mjs
import { isTable, getTableColumns, getViewSelectedFields, is, Column, SQL, isView } from "drizzle-orm";
function isColumnType(column, columnTypes) {
  return columnTypes.includes(column.columnType);
}
function isWithEnum(column) {
  return "enumValues" in column && Array.isArray(column.enumValues) && column.enumValues.length > 0;
}
function columnToSchema(column, factory) {
  const z$1 = factory?.zodInstance ?? z;
  const coerce2 = factory?.coerce ?? {};
  let schema;
  if (isWithEnum(column)) {
    schema = column.enumValues.length ? z$1.enum(column.enumValues) : z$1.string();
  }
  if (!schema) {
    if (isColumnType(column, ["PgGeometry", "PgPointTuple"])) {
      schema = z$1.tuple([z$1.number(), z$1.number()]);
    } else if (isColumnType(column, ["PgGeometryObject", "PgPointObject"])) {
      schema = z$1.object({ x: z$1.number(), y: z$1.number() });
    } else if (isColumnType(column, ["PgHalfVector", "PgVector"])) {
      schema = z$1.array(z$1.number());
      schema = column.dimensions ? schema.length(column.dimensions) : schema;
    } else if (isColumnType(column, ["PgLine"])) {
      schema = z$1.tuple([z$1.number(), z$1.number(), z$1.number()]);
    } else if (isColumnType(column, ["PgLineABC"])) {
      schema = z$1.object({
        a: z$1.number(),
        b: z$1.number(),
        c: z$1.number()
      });
    } else if (isColumnType(column, ["PgArray"])) {
      schema = z$1.array(columnToSchema(column.baseColumn, z$1));
      schema = column.size ? schema.length(column.size) : schema;
    } else if (column.dataType === "array") {
      schema = z$1.array(z$1.any());
    } else if (column.dataType === "number") {
      schema = numberColumnToSchema(column, z$1, coerce2);
    } else if (column.dataType === "bigint") {
      schema = bigintColumnToSchema(column, z$1, coerce2);
    } else if (column.dataType === "boolean") {
      schema = coerce2 === true || coerce2.boolean ? z$1.coerce.boolean() : z$1.boolean();
    } else if (column.dataType === "date") {
      schema = coerce2 === true || coerce2.date ? z$1.coerce.date() : z$1.date();
    } else if (column.dataType === "string") {
      schema = stringColumnToSchema(column, z$1, coerce2);
    } else if (column.dataType === "json") {
      schema = jsonSchema;
    } else if (column.dataType === "custom") {
      schema = z$1.any();
    } else if (column.dataType === "buffer") {
      schema = bufferSchema;
    }
  }
  if (!schema) {
    schema = z$1.any();
  }
  return schema;
}
function numberColumnToSchema(column, z2, coerce2) {
  let unsigned = column.getSQLType().includes("unsigned");
  let min;
  let max;
  let integer2 = false;
  if (isColumnType(column, ["MySqlTinyInt", "SingleStoreTinyInt"])) {
    min = unsigned ? 0 : CONSTANTS.INT8_MIN;
    max = unsigned ? CONSTANTS.INT8_UNSIGNED_MAX : CONSTANTS.INT8_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgSmallInt",
    "PgSmallSerial",
    "MySqlSmallInt",
    "SingleStoreSmallInt"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT16_MIN;
    max = unsigned ? CONSTANTS.INT16_UNSIGNED_MAX : CONSTANTS.INT16_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgReal",
    "MySqlFloat",
    "MySqlMediumInt",
    "SingleStoreMediumInt",
    "SingleStoreFloat"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT24_MIN;
    max = unsigned ? CONSTANTS.INT24_UNSIGNED_MAX : CONSTANTS.INT24_MAX;
    integer2 = isColumnType(column, ["MySqlMediumInt", "SingleStoreMediumInt"]);
  } else if (isColumnType(column, [
    "PgInteger",
    "PgSerial",
    "MySqlInt",
    "SingleStoreInt"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT32_MIN;
    max = unsigned ? CONSTANTS.INT32_UNSIGNED_MAX : CONSTANTS.INT32_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgDoublePrecision",
    "MySqlReal",
    "MySqlDouble",
    "SingleStoreReal",
    "SingleStoreDouble",
    "SQLiteReal"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT48_MIN;
    max = unsigned ? CONSTANTS.INT48_UNSIGNED_MAX : CONSTANTS.INT48_MAX;
  } else if (isColumnType(column, [
    "PgBigInt53",
    "PgBigSerial53",
    "MySqlBigInt53",
    "MySqlSerial",
    "SingleStoreBigInt53",
    "SingleStoreSerial",
    "SQLiteInteger"
  ])) {
    unsigned = unsigned || isColumnType(column, ["MySqlSerial", "SingleStoreSerial"]);
    min = unsigned ? 0 : Number.MIN_SAFE_INTEGER;
    max = Number.MAX_SAFE_INTEGER;
    integer2 = true;
  } else if (isColumnType(column, ["MySqlYear", "SingleStoreYear"])) {
    min = 1901;
    max = 2155;
    integer2 = true;
  } else {
    min = Number.MIN_SAFE_INTEGER;
    max = Number.MAX_SAFE_INTEGER;
  }
  let schema = coerce2 === true || coerce2?.number ? z2.coerce.number() : z2.number();
  schema = schema.min(min).max(max);
  return integer2 ? schema.int() : schema;
}
function bigintColumnToSchema(column, z2, coerce2) {
  const unsigned = column.getSQLType().includes("unsigned");
  const min = unsigned ? 0n : CONSTANTS.INT64_MIN;
  const max = unsigned ? CONSTANTS.INT64_UNSIGNED_MAX : CONSTANTS.INT64_MAX;
  const schema = coerce2 === true || coerce2?.bigint ? z2.coerce.bigint() : z2.bigint();
  return schema.min(min).max(max);
}
function stringColumnToSchema(column, z2, coerce2) {
  if (isColumnType(column, ["PgUUID"])) {
    return z2.string().uuid();
  }
  let max;
  let regex;
  let fixed = false;
  if (isColumnType(column, ["PgVarchar", "SQLiteText"])) {
    max = column.length;
  } else if (isColumnType(column, ["MySqlVarChar", "SingleStoreVarChar"])) {
    max = column.length ?? CONSTANTS.INT16_UNSIGNED_MAX;
  } else if (isColumnType(column, ["MySqlText", "SingleStoreText"])) {
    if (column.textType === "longtext") {
      max = CONSTANTS.INT32_UNSIGNED_MAX;
    } else if (column.textType === "mediumtext") {
      max = CONSTANTS.INT24_UNSIGNED_MAX;
    } else if (column.textType === "text") {
      max = CONSTANTS.INT16_UNSIGNED_MAX;
    } else {
      max = CONSTANTS.INT8_UNSIGNED_MAX;
    }
  }
  if (isColumnType(column, [
    "PgChar",
    "MySqlChar",
    "SingleStoreChar"
  ])) {
    max = column.length;
    fixed = true;
  }
  if (isColumnType(column, ["PgBinaryVector"])) {
    regex = /^[01]+$/;
    max = column.dimensions;
  }
  let schema = coerce2 === true || coerce2?.string ? z2.coerce.string() : z2.string();
  schema = regex ? schema.regex(regex) : schema;
  return max && fixed ? schema.length(max) : max ? schema.max(max) : schema;
}
function getColumns(tableLike) {
  return isTable(tableLike) ? getTableColumns(tableLike) : getViewSelectedFields(tableLike);
}
function handleColumns(columns, refinements, conditions, factory) {
  const columnSchemas = {};
  for (const [key, selected] of Object.entries(columns)) {
    if (!is(selected, Column) && !is(selected, SQL) && !is(selected, SQL.Aliased) && typeof selected === "object") {
      const columns2 = isTable(selected) || isView(selected) ? getColumns(selected) : selected;
      columnSchemas[key] = handleColumns(columns2, refinements[key] ?? {}, conditions, factory);
      continue;
    }
    const refinement = refinements[key];
    if (refinement !== void 0 && typeof refinement !== "function") {
      columnSchemas[key] = refinement;
      continue;
    }
    const column = is(selected, Column) ? selected : void 0;
    const schema = column ? columnToSchema(column, factory) : z.any();
    const refined = typeof refinement === "function" ? refinement(schema) : schema;
    if (conditions.never(column)) {
      continue;
    } else {
      columnSchemas[key] = refined;
    }
    if (column) {
      if (conditions.nullable(column)) {
        columnSchemas[key] = columnSchemas[key].nullable();
      }
      if (conditions.optional(column)) {
        columnSchemas[key] = columnSchemas[key].optional();
      }
    }
  }
  return z.object(columnSchemas);
}
var CONSTANTS, literalSchema, jsonSchema, bufferSchema, insertConditions, createInsertSchema;
var init_drizzle_zod = __esm({
  "node_modules/drizzle-zod/index.mjs"() {
    init_lib();
    CONSTANTS = {
      INT8_MIN: -128,
      INT8_MAX: 127,
      INT8_UNSIGNED_MAX: 255,
      INT16_MIN: -32768,
      INT16_MAX: 32767,
      INT16_UNSIGNED_MAX: 65535,
      INT24_MIN: -8388608,
      INT24_MAX: 8388607,
      INT24_UNSIGNED_MAX: 16777215,
      INT32_MIN: -2147483648,
      INT32_MAX: 2147483647,
      INT32_UNSIGNED_MAX: 4294967295,
      INT48_MIN: -140737488355328,
      INT48_MAX: 140737488355327,
      INT48_UNSIGNED_MAX: 281474976710655,
      INT64_MIN: -9223372036854775808n,
      INT64_MAX: 9223372036854775807n,
      INT64_UNSIGNED_MAX: 18446744073709551615n
    };
    literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
    jsonSchema = z.union([literalSchema, z.record(z.any()), z.array(z.any())]);
    bufferSchema = z.custom((v) => v instanceof Buffer);
    insertConditions = {
      never: (column) => column?.generated?.type === "always" || column?.generatedIdentity?.type === "always",
      optional: (column) => !column.notNull || column.notNull && column.hasDefault,
      nullable: (column) => !column.notNull
    };
    createInsertSchema = (entity, refine) => {
      const columns = getColumns(entity);
      return handleColumns(columns, refine ?? {}, insertConditions);
    };
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  deliveries: () => deliveries,
  deliveriesRelations: () => deliveriesRelations,
  groups: () => groups,
  groupsRelations: () => groupsRelations,
  insertDeliverySchema: () => insertDeliverySchema,
  insertGroupSchema: () => insertGroupSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertSupplierSchema: () => insertSupplierSchema,
  insertUserGroupSchema: () => insertUserGroupSchema,
  insertUserSchema: () => insertUserSchema,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  sessions: () => sessions,
  suppliers: () => suppliers,
  suppliersRelations: () => suppliersRelations,
  userGroups: () => userGroups,
  userGroupsRelations: () => userGroupsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  decimal
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var sessions, users, groups, userGroups, suppliers, orders, deliveries, usersRelations, groupsRelations, userGroupsRelations, suppliersRelations, ordersRelations, deliveriesRelations, insertUserSchema, insertGroupSchema, insertSupplierSchema, insertOrderSchema, insertDeliverySchema, insertUserGroupSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    init_drizzle_zod();
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().notNull(),
      username: varchar("username").unique(),
      // For simple login
      email: varchar("email").unique(),
      name: varchar("name"),
      // Single name field for compatibility
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      password: varchar("password"),
      // For local auth only
      role: varchar("role").notNull().default("employee"),
      // admin, manager, employee
      passwordChanged: boolean("password_changed").default(false),
      // Track if default password was changed
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    groups = pgTable("groups", {
      id: serial("id").primaryKey(),
      name: varchar("name").notNull(),
      color: varchar("color").notNull(),
      // hex color code
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userGroups = pgTable("user_groups", {
      userId: varchar("user_id").notNull(),
      groupId: integer("group_id").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    suppliers = pgTable("suppliers", {
      id: serial("id").primaryKey(),
      name: varchar("name").notNull(),
      contact: varchar("contact"),
      phone: varchar("phone"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    orders = pgTable("orders", {
      id: serial("id").primaryKey(),
      supplierId: integer("supplier_id").notNull(),
      groupId: integer("group_id").notNull(),
      plannedDate: date("planned_date").notNull(),
      quantity: integer("quantity"),
      // Optional - will be set when delivery is linked
      unit: varchar("unit"),
      // Optional - 'palettes' or 'colis'
      status: varchar("status").notNull().default("pending"),
      // pending, planned, delivered
      comments: text("comments"),
      createdBy: varchar("created_by").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    deliveries = pgTable("deliveries", {
      id: serial("id").primaryKey(),
      orderId: integer("order_id"),
      // optional link to order
      supplierId: integer("supplier_id").notNull(),
      groupId: integer("group_id").notNull(),
      plannedDate: date("planned_date").notNull(),
      deliveredDate: timestamp("delivered_date"),
      quantity: integer("quantity").notNull(),
      unit: varchar("unit").notNull(),
      // 'palettes' or 'colis'
      status: varchar("status").notNull().default("planned"),
      // planned, delivered
      comments: text("comments"),
      // Champs pour le rapprochement BL/Factures
      blNumber: varchar("bl_number"),
      // Numéro de Bon de Livraison
      blAmount: decimal("bl_amount", { precision: 10, scale: 2 }),
      // Montant BL
      invoiceReference: varchar("invoice_reference"),
      // Référence facture
      invoiceAmount: decimal("invoice_amount", { precision: 10, scale: 2 }),
      // Montant facture
      reconciled: boolean("reconciled").default(false),
      // Rapprochement effectué
      createdBy: varchar("created_by").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    usersRelations = relations(users, ({ many }) => ({
      userGroups: many(userGroups),
      createdOrders: many(orders),
      createdDeliveries: many(deliveries)
    }));
    groupsRelations = relations(groups, ({ many }) => ({
      userGroups: many(userGroups),
      orders: many(orders),
      deliveries: many(deliveries)
    }));
    userGroupsRelations = relations(userGroups, ({ one }) => ({
      user: one(users, {
        fields: [userGroups.userId],
        references: [users.id]
      }),
      group: one(groups, {
        fields: [userGroups.groupId],
        references: [groups.id]
      })
    }));
    suppliersRelations = relations(suppliers, ({ many }) => ({
      orders: many(orders),
      deliveries: many(deliveries)
    }));
    ordersRelations = relations(orders, ({ one, many }) => ({
      supplier: one(suppliers, {
        fields: [orders.supplierId],
        references: [suppliers.id]
      }),
      group: one(groups, {
        fields: [orders.groupId],
        references: [groups.id]
      }),
      creator: one(users, {
        fields: [orders.createdBy],
        references: [users.id]
      }),
      deliveries: many(deliveries)
    }));
    deliveriesRelations = relations(deliveries, ({ one }) => ({
      order: one(orders, {
        fields: [deliveries.orderId],
        references: [orders.id]
      }),
      supplier: one(suppliers, {
        fields: [deliveries.supplierId],
        references: [suppliers.id]
      }),
      group: one(groups, {
        fields: [deliveries.groupId],
        references: [groups.id]
      }),
      creator: one(users, {
        fields: [deliveries.createdBy],
        references: [users.id]
      })
    }));
    insertUserSchema = createInsertSchema(users).pick({
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      profileImageUrl: true,
      role: true,
      passwordChanged: true
    });
    insertGroupSchema = createInsertSchema(groups).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSupplierSchema = createInsertSchema(suppliers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertOrderSchema = createInsertSchema(orders).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertDeliverySchema = createInsertSchema(deliveries).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserGroupSchema = createInsertSchema(userGroups).omit({
      createdAt: true
    });
  }
});

// server/db.production.ts
var db_production_exports = {};
__export(db_production_exports, {
  db: () => db,
  pool: () => pool
});
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var pool, db;
var init_db_production = __esm({
  "server/db.production.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    console.log("Using PostgreSQL connection for production");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
      // Pas de SSL pour connexion locale Docker
    });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/initDatabase.production.ts
var initDatabase_production_exports = {};
__export(initDatabase_production_exports, {
  initializeDatabase: () => initializeDatabase
});
async function initializeDatabase() {
  console.log("\u{1F504} CRITICAL: Initializing database schema with raw SQL...");
  try {
    console.log("\u{1F527} Creating users table with name column...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY NOT NULL,
        username VARCHAR UNIQUE NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
        password VARCHAR NOT NULL,
        password_changed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u{1F527} CRITICAL: Verifying name column exists...");
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'name'
    `);
    if (columnCheck.rows.length === 0) {
      console.log("\u{1F6A8} CRITICAL: Name column missing! Adding immediately...");
      await pool.query(`ALTER TABLE users ADD COLUMN name VARCHAR(255)`);
      await pool.query(`
        UPDATE users 
        SET name = COALESCE(username, email) 
        WHERE name IS NULL OR name = ''
      `);
      console.log("\u2705 CRITICAL: Name column added and populated successfully");
    } else {
      console.log("\u2705 CRITICAL: Name column confirmed present");
    }
    try {
      await pool.query(`SELECT name FROM users LIMIT 1`);
      console.log("\u2705 CRITICAL: Name column verified working");
    } catch (error) {
      console.error("\u274C CRITICAL: Name column still not working:", error.message);
      throw new Error("Name column verification failed");
    }
    console.log("\u{1F527} Creating groups table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        color VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u{1F527} Creating suppliers table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        contact VARCHAR,
        phone VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u{1F527} Creating orders table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        planned_date VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'received')),
        notes TEXT,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u{1F527} Creating deliveries table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        supplier_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        scheduled_date VARCHAR NOT NULL,
        quantity INTEGER,
        unit VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
        notes TEXT,
        bl_number VARCHAR,
        bl_amount DECIMAL(10,2),
        invoice_reference VARCHAR,
        invoice_amount DECIMAL(10,2),
        reconciled BOOLEAN DEFAULT FALSE,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u{1F527} Creating user_groups table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        user_id VARCHAR NOT NULL,
        group_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(user_id, group_id)
      )
    `);
    console.log("\u{1F527} Creating session table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
    `);
    console.log("\u{1F527} Inserting default groups...");
    await pool.query(`
      INSERT INTO groups (id, name, color) VALUES 
        (1, 'Frouard', '#1976D2'),
        (2, 'Nancy', '#388E3C'),
        (3, 'Metz', '#F57C00')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("\u{1F527} Inserting default suppliers...");
    await pool.query(`
      INSERT INTO suppliers (id, name, contact, phone) VALUES 
        (1, 'Fournisseur Test', 'Contact Principal', '03.83.00.00.00'),
        (2, 'Logistique Pro', 'Service Commercial', '03.87.11.22.33')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("\u{1F527} Resetting sequences...");
    await pool.query(`SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups))`);
    await pool.query(`SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers))`);
    console.log("\u2705 Database schema initialized successfully");
  } catch (error) {
    if (error.message?.includes("already exists")) {
      console.log("\u2705 Database schema already exists");
    } else {
      console.error("\u274C Error initializing database:", error);
      throw error;
    }
  }
}
var init_initDatabase_production = __esm({
  "server/initDatabase.production.ts"() {
    "use strict";
    init_db_production();
  }
});

// server/localAuth.production.ts
import passport from "passport";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPgSimple from "connect-pg-simple";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
async function createDefaultAdminUser() {
  try {
    console.log("\u{1F527} CRITICAL: Forcing database initialization before admin creation...");
    await initializeDatabase();
    console.log("\u{1F527} Checking for default admin user with raw SQL...");
    const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
    const adminCheck = await pool2.query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`);
    if (adminCheck.rows.length === 0) {
      console.log("\u{1F527} Creating default admin user with raw SQL...");
      const hashedPassword = await hashPassword("admin");
      await pool2.query(`
        INSERT INTO users (id, username, email, name, role, password, password_changed) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, ["admin_local", "admin", "admin@logiflow.com", "Admin Syst\xE8me", "admin", hashedPassword, false]);
      console.log("\u2705 CRITICAL: Default admin user created: admin/admin");
    } else {
      console.log("\u2705 CRITICAL: Default admin user already exists");
    }
  } catch (error) {
    console.error("\u274C CRITICAL: Error creating admin user:", error);
    console.error("\u274C CRITICAL: Error details:", error.message);
    throw error;
  }
}
function setupLocalAuth(app2) {
  console.log("\u{1F527} Setting up local authentication...");
  const connectPg = connectPgSimple(import_express_session.default);
  app2.use((0, import_express_session.default)({
    store: new connectPg({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: "session"
    }),
    secret: process.env.SESSION_SECRET || "logiflow-production-secret-2025",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      // HTTPS handled by reverse proxy
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours
      httpOnly: true,
      sameSite: "lax"
    },
    name: "logiflow.sid"
  }));
  console.log("\u2705 Session configured");
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
      const result = await pool2.query(`
        SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
        FROM users 
        WHERE id = $1 
        LIMIT 1
      `, [id]);
      if (result.rows.length === 0) {
        return done(null, false);
      }
      done(null, result.rows[0]);
    } catch (error) {
      console.error("\u274C Error in deserializeUser:", error);
      done(error, null);
    }
  });
  passport.use(new import_passport_local.Strategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
          SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
          FROM users 
          WHERE username = $1 
          LIMIT 1
        `, [username]);
        if (result.rows.length === 0) {
          return done(null, false, { message: "Utilisateur non trouv\xE9" });
        }
        const user = result.rows[0];
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Mot de passe incorrect" });
        }
        return done(null, user);
      } catch (error) {
        console.error("\u274C Error in LocalStrategy:", error);
        return done(error);
      }
    }
  ));
  const loginHandler = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: "Erreur serveur" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Connexion \xE9chou\xE9e" });
      }
      req.logIn(user, (err2) => {
        if (err2) {
          return res.status(500).json({ message: "Erreur lors de la connexion" });
        }
        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name || user.name,
          lastName: user.last_name || user.name,
          role: user.role,
          passwordChanged: user.password_changed
        });
      });
    })(req, res, next);
  };
  app2.post("/api/login", loginHandler);
  app2.post("/api/auth/login", loginHandler);
  const logoutHandler = (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la d\xE9connexion" });
      }
      res.json({ message: "D\xE9connexion r\xE9ussie" });
    });
  };
  app2.post("/api/logout", logoutHandler);
  app2.post("/api/auth/logout", logoutHandler);
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non authentifi\xE9" });
    }
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name || user.name,
      lastName: user.last_name || user.name,
      role: user.role,
      passwordChanged: user.password_changed
    });
  });
  app2.get("/api/default-credentials-check", async (req, res) => {
    try {
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
      const result = await pool2.query(`
        SELECT id, username, password_changed
        FROM users 
        WHERE username = $1 
        LIMIT 1
      `, ["admin"]);
      const showDefault = result.rows.length > 0 && !result.rows[0].password_changed;
      res.json({ showDefault: !!showDefault });
    } catch (error) {
      console.error("\u274C Error in default-credentials-check:", error);
      res.json({ showDefault: true });
    }
  });
  createDefaultAdminUser();
}
var import_express_session, import_passport_local, scryptAsync, requireAuth;
var init_localAuth_production = __esm({
  "server/localAuth.production.ts"() {
    "use strict";
    import_express_session = __toESM(require_express_session(), 1);
    import_passport_local = __toESM(require_lib2(), 1);
    init_initDatabase_production();
    scryptAsync = promisify(scrypt);
    requireAuth = (req, res, next) => {
      if (req.isAuthenticated()) {
        return next();
      }
      return res.status(401).json({ message: "Non authentifi\xE9" });
    };
  }
});

// server/storage.production.ts
var storage_production_exports = {};
__export(storage_production_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
var DatabaseStorage, storage;
var init_storage_production = __esm({
  "server/storage.production.ts"() {
    "use strict";
    DatabaseStorage = class {
      async getUser(id) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
      FROM users WHERE id = $1 LIMIT 1
    `, [id]);
        return result.rows.length > 0 ? result.rows[0] : void 0;
      }
      async getUserByEmail(email) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
      FROM users WHERE email = $1 LIMIT 1
    `, [email]);
        return result.rows.length > 0 ? result.rows[0] : void 0;
      }
      async getUserByUsername(username) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
      FROM users WHERE username = $1 LIMIT 1
    `, [username]);
        return result.rows.length > 0 ? result.rows[0] : void 0;
      }
      async upsertUser(userData) {
        const existingUser = await this.getUserByEmail(userData.email);
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        if (existingUser) {
          const result = await pool2.query(`
        UPDATE users 
        SET name = $1, email = $2, username = $3, updated_at = $4
        WHERE id = $5
        RETURNING id, username, email, name, role, password, password_changed, created_at, updated_at
      `, [userData.name, userData.email, userData.username, /* @__PURE__ */ new Date(), existingUser.id]);
          return result.rows[0];
        } else {
          const result = await pool2.query(`
        INSERT INTO users (id, username, email, name, role, password, password_changed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, username, email, name, role, password, password_changed, created_at, updated_at
      `, [userData.id, userData.username, userData.email, userData.name, userData.role, userData.password, userData.passwordChanged, /* @__PURE__ */ new Date(), /* @__PURE__ */ new Date()]);
          return result.rows[0];
        }
      }
      async getUserWithGroups(id) {
        try {
          console.log(`\u{1F50D} Getting user with groups for ID: ${id}`);
          const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
          const userResult = await pool2.query(`
        SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
        FROM users 
        WHERE id = $1
      `, [id]);
          if (userResult.rows.length === 0) {
            console.log(`\u274C User not found: ${id}`);
            return void 0;
          }
          const user = userResult.rows[0];
          const groupsResult = await pool2.query(`
        SELECT ug.user_id, ug.group_id, ug.created_at as ug_created_at,
               g.id, g.name, g.color, g.created_at, g.updated_at
        FROM user_groups ug
        JOIN groups g ON ug.group_id = g.id
        WHERE ug.user_id = $1
      `, [id]);
          const userWithGroups = {
            ...user,
            userGroups: groupsResult.rows.map((row) => ({
              id: `${row.user_id}-${row.group_id}`,
              // Composite ID
              userId: row.user_id,
              groupId: row.group_id,
              createdAt: row.ug_created_at,
              group: {
                id: row.id,
                name: row.name,
                color: row.color,
                createdAt: row.created_at,
                updatedAt: row.updated_at
              }
            }))
          };
          console.log(`\u2705 User with groups found:`, {
            id: userWithGroups.id,
            username: userWithGroups.username,
            groupCount: userWithGroups.userGroups.length
          });
          return userWithGroups;
        } catch (error) {
          console.error("\u274C Error processing user groups for", id, ":", error);
          throw error;
        }
      }
      async getUsers() {
        console.log("\u{1F50D} Storage getUsers called");
        try {
          const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
          const usersResult = await pool2.query(`
        SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
      `);
          console.log("\u2705 Basic users query returned:", usersResult.rows.length, "users");
          if (usersResult.rows.length === 0) {
            console.log("\u274C No users found in database");
            return [];
          }
          const allUserGroupsResult = await pool2.query(`
        SELECT ug.user_id, ug.group_id, ug.created_at as ug_created_at,
               g.id, g.name, g.color, g.created_at, g.updated_at
        FROM user_groups ug
        JOIN groups g ON ug.group_id = g.id
      `);
          const userGroupsMap = /* @__PURE__ */ new Map();
          allUserGroupsResult.rows.forEach((row) => {
            if (!userGroupsMap.has(row.user_id)) {
              userGroupsMap.set(row.user_id, []);
            }
            userGroupsMap.get(row.user_id).push({
              id: `${row.user_id}-${row.group_id}`,
              // Composite ID
              userId: row.user_id,
              groupId: row.group_id,
              createdAt: row.ug_created_at,
              group: {
                id: row.id,
                name: row.name,
                color: row.color,
                createdAt: row.created_at,
                updatedAt: row.updated_at
              }
            });
          });
          const usersWithGroups = usersResult.rows.map((user) => {
            console.log("\u{1F50D} Processing user:", user.id, user.username);
            return {
              ...user,
              userGroups: userGroupsMap.get(user.id) || []
            };
          });
          console.log("\u2705 Users with groups processed:", usersWithGroups.length);
          return usersWithGroups;
        } catch (error) {
          console.error("\u274C Error in getUsers:", error);
          return [];
        }
      }
      async createUser(userData) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      INSERT INTO users (id, username, email, name, role, password, password_changed, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, username, email, name, role, password, password_changed, created_at, updated_at
    `, [userData.id, userData.username, userData.email, userData.name, userData.role, userData.password, userData.passwordChanged, /* @__PURE__ */ new Date(), /* @__PURE__ */ new Date()]);
        return result.rows[0];
      }
      async updateUser(id, userData) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      UPDATE users 
      SET name = COALESCE($1, name), email = COALESCE($2, email), username = COALESCE($3, username), 
          role = COALESCE($4, role), password = COALESCE($5, password), 
          password_changed = COALESCE($6, password_changed), updated_at = $7
      WHERE id = $8
      RETURNING id, username, email, name, role, password, password_changed, created_at, updated_at
    `, [userData.name, userData.email, userData.username, userData.role, userData.password, userData.passwordChanged, /* @__PURE__ */ new Date(), id]);
        return result.rows[0];
      }
      async deleteUser(id) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        await pool2.query(`DELETE FROM user_groups WHERE user_id = $1`, [id]);
        await pool2.query(`DELETE FROM users WHERE id = $1`, [id]);
      }
      async getGroups() {
        console.log("\u{1F50D} Storage getGroups called");
        try {
          const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
          const result = await pool2.query(`
        SELECT id, name, color, created_at, updated_at 
        FROM groups 
        ORDER BY name
      `);
          console.log("\u2705 Groups query returned:", result.rows.length, "groups");
          if (result.rows.length === 0) {
            console.log("\u274C No groups found in database");
            return [];
          }
          const groups2 = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            color: row.color,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          }));
          console.log("\u2705 Groups found:", groups2.map((g) => ({ id: g.id, name: g.name })));
          return groups2;
        } catch (error) {
          console.error("\u274C Error in getGroups:", error);
          throw error;
        }
      }
      async createGroup(group) {
        console.log("\u{1F50D} Storage createGroup called with:", group);
        try {
          const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
          const result = await pool2.query(`
        INSERT INTO groups (name, color, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, color, created_at, updated_at
      `, [group.name, group.color, /* @__PURE__ */ new Date(), /* @__PURE__ */ new Date()]);
          console.log("\u2705 Group created in database:", result.rows[0]);
          return result.rows[0];
        } catch (error) {
          console.error("\u274C Error creating group in database:", error);
          throw error;
        }
      }
      async updateGroup(id, group) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      UPDATE groups 
      SET name = COALESCE($1, name), color = COALESCE($2, color), updated_at = $3
      WHERE id = $4
      RETURNING id, name, color, created_at, updated_at
    `, [group.name, group.color, /* @__PURE__ */ new Date(), id]);
        return result.rows[0];
      }
      async deleteGroup(id) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        await pool2.query(`DELETE FROM user_groups WHERE group_id = $1`, [id]);
        await pool2.query(`DELETE FROM groups WHERE id = $1`, [id]);
      }
      async getSuppliers() {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      SELECT id, name, contact, email, phone, created_at, updated_at
      FROM suppliers 
      ORDER BY name
    `);
        return result.rows;
      }
      async createSupplier(supplier) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      INSERT INTO suppliers (name, contact, email, phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, contact, email, phone, created_at, updated_at
    `, [supplier.name, supplier.contact, supplier.email, supplier.phone, /* @__PURE__ */ new Date(), /* @__PURE__ */ new Date()]);
        return result.rows[0];
      }
      async updateSupplier(id, supplier) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      UPDATE suppliers 
      SET name = COALESCE($1, name), contact = COALESCE($2, contact), 
          email = COALESCE($3, email), phone = COALESCE($4, phone), updated_at = $5
      WHERE id = $6
      RETURNING id, name, contact, email, phone, created_at, updated_at
    `, [supplier.name, supplier.contact, supplier.email, supplier.phone, /* @__PURE__ */ new Date(), id]);
        return result.rows[0];
      }
      async deleteSupplier(id) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        await pool2.query(`DELETE FROM suppliers WHERE id = $1`, [id]);
      }
      async getOrders(groupIds) {
        console.log("\u{1F50D} Storage getOrders called with groupIds:", groupIds);
        try {
          let sqlQuery = `
        SELECT 
          o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.comments, o.created_by, o.created_at, o.updated_at,
          s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
          s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
          g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
          u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
          u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
        FROM orders o
        INNER JOIN suppliers s ON o.supplier_id = s.id
        INNER JOIN groups g ON o.group_id = g.id
        INNER JOIN users u ON o.created_by = u.id
      `;
          const params = [];
          if (groupIds && groupIds.length > 0) {
            sqlQuery += ` WHERE o.group_id = ANY($1)`;
            params.push(groupIds);
          }
          sqlQuery += ` ORDER BY o.created_at DESC`;
          const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
          const results = params.length > 0 ? await pool2.query(sqlQuery, params) : await pool2.query(sqlQuery);
          const orders2 = results.rows.map((row) => ({
            id: row.id,
            supplierId: row.supplier_id,
            groupId: row.group_id,
            plannedDate: row.planned_date,
            status: row.status,
            comments: row.comments,
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            supplier: {
              id: row.supplier_id,
              name: row.supplier_name,
              contact: row.supplier_contact,
              email: row.supplier_email,
              phone: row.supplier_phone,
              createdAt: new Date(row.supplier_created_at),
              updatedAt: new Date(row.supplier_updated_at)
            },
            group: {
              id: row.group_id,
              name: row.group_name,
              color: row.group_color,
              createdAt: new Date(row.group_created_at),
              updatedAt: new Date(row.group_updated_at)
            },
            creator: {
              id: row.creator_id,
              username: row.creator_username,
              email: row.creator_email,
              name: row.creator_name,
              role: row.creator_role,
              password: row.creator_password,
              passwordChanged: row.creator_password_changed,
              createdAt: new Date(row.creator_created_at),
              updatedAt: new Date(row.creator_updated_at)
            },
            deliveries: []
          }));
          console.log("\u2705 Orders query returned:", orders2.length, "orders");
          return orders2;
        } catch (error) {
          console.error("\u274C Error in getOrders:", error);
          throw error;
        }
      }
      async getOrdersByDateRange(startDate, endDate, groupIds) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        let sqlQuery = `
      SELECT 
        o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.comments, o.created_by, o.created_at, o.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM orders o
      INNER JOIN suppliers s ON o.supplier_id = s.id
      INNER JOIN groups g ON o.group_id = g.id
      INNER JOIN users u ON o.created_by = u.id
      WHERE o.planned_date >= $1 AND o.planned_date <= $2
    `;
        const params = [startDate, endDate];
        if (groupIds && groupIds.length > 0) {
          sqlQuery += ` AND o.group_id = ANY($3)`;
          params.push(groupIds);
        }
        sqlQuery += ` ORDER BY o.created_at DESC`;
        const results = await pool2.query(sqlQuery, params);
        return results.rows.map((row) => ({
          id: row.id,
          supplierId: row.supplier_id,
          groupId: row.group_id,
          plannedDate: row.planned_date,
          status: row.status,
          comments: row.comments,
          createdBy: row.created_by,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          supplier: {
            id: row.supplier_id,
            name: row.supplier_name,
            contact: row.supplier_contact,
            email: row.supplier_email,
            phone: row.supplier_phone,
            createdAt: new Date(row.supplier_created_at),
            updatedAt: new Date(row.supplier_updated_at)
          },
          group: {
            id: row.group_id,
            name: row.group_name,
            color: row.group_color,
            createdAt: new Date(row.group_created_at),
            updatedAt: new Date(row.group_updated_at)
          },
          creator: {
            id: row.creator_id,
            username: row.creator_username,
            email: row.creator_email,
            name: row.creator_name,
            role: row.creator_role,
            password: row.creator_password,
            passwordChanged: row.creator_password_changed,
            createdAt: new Date(row.creator_created_at),
            updatedAt: new Date(row.creator_updated_at)
          },
          deliveries: []
        }));
      }
      async getOrder(id) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      SELECT 
        o.id, o.supplier_id, o.group_id, o.planned_date, o.status, o.comments, o.created_by, o.created_at, o.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM orders o
      INNER JOIN suppliers s ON o.supplier_id = s.id
      INNER JOIN groups g ON o.group_id = g.id
      INNER JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
      LIMIT 1
    `, [id]);
        if (result.rows.length === 0) return void 0;
        const row = result.rows[0];
        return {
          id: row.id,
          supplierId: row.supplier_id,
          groupId: row.group_id,
          plannedDate: row.planned_date,
          status: row.status,
          comments: row.comments,
          createdBy: row.created_by,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          supplier: {
            id: row.supplier_id,
            name: row.supplier_name,
            contact: row.supplier_contact,
            email: row.supplier_email,
            phone: row.supplier_phone,
            createdAt: new Date(row.supplier_created_at),
            updatedAt: new Date(row.supplier_updated_at)
          },
          group: {
            id: row.group_id,
            name: row.group_name,
            color: row.group_color,
            createdAt: new Date(row.group_created_at),
            updatedAt: new Date(row.group_updated_at)
          },
          creator: {
            id: row.creator_id,
            username: row.creator_username,
            email: row.creator_email,
            name: row.creator_name,
            role: row.creator_role,
            password: row.creator_password,
            passwordChanged: row.creator_password_changed,
            createdAt: new Date(row.creator_created_at),
            updatedAt: new Date(row.creator_updated_at)
          },
          deliveries: []
        };
      }
      async createOrder(order) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      INSERT INTO orders (supplier_id, group_id, planned_date, status, comments, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, supplier_id, group_id, planned_date, status, comments, created_by, created_at, updated_at
    `, [order.supplierId, order.groupId, order.plannedDate, order.status, order.comments, order.createdBy, /* @__PURE__ */ new Date(), /* @__PURE__ */ new Date()]);
        return result.rows[0];
      }
      async updateOrder(id, order) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      UPDATE orders 
      SET supplier_id = COALESCE($1, supplier_id), group_id = COALESCE($2, group_id), 
          planned_date = COALESCE($3, planned_date), status = COALESCE($4, status), 
          comments = COALESCE($5, comments), updated_at = $6
      WHERE id = $7
      RETURNING id, supplier_id, group_id, planned_date, status, comments, created_by, created_at, updated_at
    `, [order.supplierId, order.groupId, order.plannedDate, order.status, order.comments, /* @__PURE__ */ new Date(), id]);
        return result.rows[0];
      }
      async deleteOrder(id) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        await pool2.query(`DELETE FROM orders WHERE id = $1`, [id]);
      }
      async getDeliveries(groupIds) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        let sqlQuery = `
      SELECT 
        d.id, d.order_id, d.supplier_id, d.group_id, d.scheduled_date, d.quantity, d.unit, d.status, d.notes,
        d.bl_number, d.bl_amount, d.invoice_reference, d.invoice_amount, d.reconciled, d.created_by, d.created_at, d.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
    `;
        const params = [];
        if (groupIds && groupIds.length > 0) {
          sqlQuery += ` WHERE d.group_id = ANY($1)`;
          params.push(groupIds);
        }
        sqlQuery += ` ORDER BY d.created_at DESC`;
        const results = params.length > 0 ? await pool2.query(sqlQuery, params) : await pool2.query(sqlQuery);
        return results.rows.map((row) => ({
          id: row.id,
          orderId: row.order_id,
          supplierId: row.supplier_id,
          groupId: row.group_id,
          scheduledDate: row.scheduled_date,
          quantity: row.quantity,
          unit: row.unit,
          status: row.status,
          notes: row.notes,
          blNumber: row.bl_number,
          blAmount: row.bl_amount,
          invoiceReference: row.invoice_reference,
          invoiceAmount: row.invoice_amount,
          reconciled: row.reconciled,
          createdBy: row.created_by,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          supplier: {
            id: row.supplier_id,
            name: row.supplier_name,
            contact: row.supplier_contact,
            email: row.supplier_email,
            phone: row.supplier_phone,
            createdAt: new Date(row.supplier_created_at),
            updatedAt: new Date(row.supplier_updated_at)
          },
          group: {
            id: row.group_id,
            name: row.group_name,
            color: row.group_color,
            createdAt: new Date(row.group_created_at),
            updatedAt: new Date(row.group_updated_at)
          },
          creator: {
            id: row.creator_id,
            username: row.creator_username,
            email: row.creator_email,
            name: row.creator_name,
            role: row.creator_role,
            password: row.creator_password,
            passwordChanged: row.creator_password_changed,
            createdAt: new Date(row.creator_created_at),
            updatedAt: new Date(row.creator_updated_at)
          },
          order: null
        }));
      }
      async getDeliveriesByDateRange(startDate, endDate, groupIds) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        let sqlQuery = `
      SELECT 
        d.id, d.order_id, d.supplier_id, d.group_id, d.scheduled_date, d.quantity, d.unit, d.status, d.notes,
        d.bl_number, d.bl_amount, d.invoice_reference, d.invoice_amount, d.reconciled, d.created_by, d.created_at, d.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
      WHERE d.scheduled_date >= $1 AND d.scheduled_date <= $2
    `;
        const params = [startDate, endDate];
        if (groupIds && groupIds.length > 0) {
          sqlQuery += ` AND d.group_id = ANY($3)`;
          params.push(groupIds);
        }
        sqlQuery += ` ORDER BY d.created_at DESC`;
        const results = await pool2.query(sqlQuery, params);
        return results.rows.map((row) => ({
          id: row.id,
          orderId: row.order_id,
          supplierId: row.supplier_id,
          groupId: row.group_id,
          scheduledDate: row.scheduled_date,
          quantity: row.quantity,
          unit: row.unit,
          status: row.status,
          notes: row.notes,
          blNumber: row.bl_number,
          blAmount: row.bl_amount,
          invoiceReference: row.invoice_reference,
          invoiceAmount: row.invoice_amount,
          reconciled: row.reconciled,
          createdBy: row.created_by,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          supplier: {
            id: row.supplier_id,
            name: row.supplier_name,
            contact: row.supplier_contact,
            email: row.supplier_email,
            phone: row.supplier_phone,
            createdAt: new Date(row.supplier_created_at),
            updatedAt: new Date(row.supplier_updated_at)
          },
          group: {
            id: row.group_id,
            name: row.group_name,
            color: row.group_color,
            createdAt: new Date(row.group_created_at),
            updatedAt: new Date(row.group_updated_at)
          },
          creator: {
            id: row.creator_id,
            username: row.creator_username,
            email: row.creator_email,
            name: row.creator_name,
            role: row.creator_role,
            password: row.creator_password,
            passwordChanged: row.creator_password_changed,
            createdAt: new Date(row.creator_created_at),
            updatedAt: new Date(row.creator_updated_at)
          },
          order: null
        }));
      }
      async getDelivery(id) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      SELECT 
        d.id, d.order_id, d.supplier_id, d.group_id, d.scheduled_date, d.quantity, d.unit, d.status, d.notes,
        d.bl_number, d.bl_amount, d.invoice_reference, d.invoice_amount, d.reconciled, d.created_by, d.created_at, d.updated_at,
        s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, s.email as supplier_email, s.phone as supplier_phone,
        s.created_at as supplier_created_at, s.updated_at as supplier_updated_at,
        g.id as group_id, g.name as group_name, g.color as group_color, g.created_at as group_created_at, g.updated_at as group_updated_at,
        u.id as creator_id, u.username as creator_username, u.email as creator_email, u.name as creator_name, u.role as creator_role,
        u.password as creator_password, u.password_changed as creator_password_changed, u.created_at as creator_created_at, u.updated_at as creator_updated_at
      FROM deliveries d
      INNER JOIN suppliers s ON d.supplier_id = s.id
      INNER JOIN groups g ON d.group_id = g.id
      INNER JOIN users u ON d.created_by = u.id
      WHERE d.id = $1
      LIMIT 1
    `, [id]);
        if (result.rows.length === 0) return void 0;
        const row = result.rows[0];
        return {
          id: row.id,
          orderId: row.order_id,
          supplierId: row.supplier_id,
          groupId: row.group_id,
          scheduledDate: row.scheduled_date,
          quantity: row.quantity,
          unit: row.unit,
          status: row.status,
          notes: row.notes,
          blNumber: row.bl_number,
          blAmount: row.bl_amount,
          invoiceReference: row.invoice_reference,
          invoiceAmount: row.invoice_amount,
          reconciled: row.reconciled,
          createdBy: row.created_by,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          supplier: {
            id: row.supplier_id,
            name: row.supplier_name,
            contact: row.supplier_contact,
            email: row.supplier_email,
            phone: row.supplier_phone,
            createdAt: new Date(row.supplier_created_at),
            updatedAt: new Date(row.supplier_updated_at)
          },
          group: {
            id: row.group_id,
            name: row.group_name,
            color: row.group_color,
            createdAt: new Date(row.group_created_at),
            updatedAt: new Date(row.group_updated_at)
          },
          creator: {
            id: row.creator_id,
            username: row.creator_username,
            email: row.creator_email,
            name: row.creator_name,
            role: row.creator_role,
            password: row.creator_password,
            passwordChanged: row.creator_password_changed,
            createdAt: new Date(row.creator_created_at),
            updatedAt: new Date(row.creator_updated_at)
          },
          order: null
        };
      }
      async createDelivery(delivery) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      INSERT INTO deliveries (order_id, supplier_id, group_id, scheduled_date, quantity, unit, status, notes, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, order_id, supplier_id, group_id, scheduled_date, quantity, unit, status, notes, bl_number, bl_amount, 
                invoice_reference, invoice_amount, reconciled, created_by, created_at, updated_at
    `, [
          delivery.orderId,
          delivery.supplierId,
          delivery.groupId,
          delivery.scheduledDate,
          delivery.quantity,
          delivery.unit,
          delivery.status,
          delivery.notes,
          delivery.createdBy,
          /* @__PURE__ */ new Date(),
          /* @__PURE__ */ new Date()
        ]);
        return result.rows[0];
      }
      async updateDelivery(id, delivery) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      UPDATE deliveries 
      SET order_id = COALESCE($1, order_id), supplier_id = COALESCE($2, supplier_id), group_id = COALESCE($3, group_id),
          scheduled_date = COALESCE($4, scheduled_date), quantity = COALESCE($5, quantity), unit = COALESCE($6, unit),
          status = COALESCE($7, status), notes = COALESCE($8, notes), updated_at = $9
      WHERE id = $10
      RETURNING id, order_id, supplier_id, group_id, scheduled_date, quantity, unit, status, notes, bl_number, bl_amount, 
                invoice_reference, invoice_amount, reconciled, created_by, created_at, updated_at
    `, [
          delivery.orderId,
          delivery.supplierId,
          delivery.groupId,
          delivery.scheduledDate,
          delivery.quantity,
          delivery.unit,
          delivery.status,
          delivery.notes,
          /* @__PURE__ */ new Date(),
          id
        ]);
        return result.rows[0];
      }
      async deleteDelivery(id) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        await pool2.query(`DELETE FROM deliveries WHERE id = $1`, [id]);
      }
      async validateDelivery(id, blData) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        await pool2.query(`
      UPDATE deliveries 
      SET status = 'delivered', bl_number = $1, bl_amount = $2, updated_at = $3
      WHERE id = $4
    `, [blData?.blNumber, blData?.blAmount, /* @__PURE__ */ new Date(), id]);
      }
      async getUserGroups(userId) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      SELECT user_id, group_id, created_at
      FROM user_groups 
      WHERE user_id = $1
    `, [userId]);
        return result.rows.map((row) => ({
          id: `${row.user_id}-${row.group_id}`,
          userId: row.user_id,
          groupId: row.group_id,
          createdAt: row.created_at
        }));
      }
      async assignUserToGroup(userGroup) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const result = await pool2.query(`
      INSERT INTO user_groups (user_id, group_id, created_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, group_id) DO NOTHING
      RETURNING user_id, group_id, created_at
    `, [userGroup.userId, userGroup.groupId, /* @__PURE__ */ new Date()]);
        if (result.rows.length === 0) {
          const existing = await pool2.query(`
        SELECT user_id, group_id, created_at
        FROM user_groups 
        WHERE user_id = $1 AND group_id = $2
      `, [userGroup.userId, userGroup.groupId]);
          const row2 = existing.rows[0];
          return {
            id: `${row2.user_id}-${row2.group_id}`,
            userId: row2.user_id,
            groupId: row2.group_id,
            createdAt: row2.created_at
          };
        }
        const row = result.rows[0];
        return {
          id: `${row.user_id}-${row.group_id}`,
          userId: row.user_id,
          groupId: row.group_id,
          createdAt: row.created_at
        };
      }
      async removeUserFromGroup(userId, groupId) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        await pool2.query(`
      DELETE FROM user_groups 
      WHERE user_id = $1 AND group_id = $2
    `, [userId, groupId]);
      }
      async getMonthlyStats(year, month, groupIds) {
        const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
        const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
        const endDate = new Date(year, month, 0).toISOString().split("T")[0];
        let ordersCountQuery = `SELECT COUNT(*) as count FROM orders WHERE planned_date >= $1 AND planned_date <= $2`;
        let deliveriesCountQuery = `SELECT COUNT(*) as count FROM deliveries WHERE scheduled_date >= $1 AND scheduled_date <= $2`;
        let pendingOrdersCountQuery = `SELECT COUNT(*) as count FROM orders WHERE planned_date >= $1 AND planned_date <= $2 AND status = 'pending'`;
        const params = [startDate, endDate];
        if (groupIds && groupIds.length > 0) {
          ordersCountQuery += ` AND group_id = ANY($3)`;
          deliveriesCountQuery += ` AND group_id = ANY($3)`;
          pendingOrdersCountQuery += ` AND group_id = ANY($3)`;
          params.push(groupIds);
        }
        const [ordersResult, deliveriesResult, pendingOrdersResult] = await Promise.all([
          pool2.query(ordersCountQuery, params),
          pool2.query(deliveriesCountQuery, params),
          pool2.query(pendingOrdersCountQuery, params)
        ]);
        return {
          ordersCount: Number(ordersResult.rows[0]?.count || 0),
          deliveriesCount: Number(deliveriesResult.rows[0]?.count || 0),
          pendingOrdersCount: Number(pendingOrdersResult.rows[0]?.count || 0),
          averageDeliveryTime: 0,
          totalPalettes: 0,
          totalPackages: 0
        };
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/routes.production.ts
var routes_production_exports = {};
__export(routes_production_exports, {
  registerRoutes: () => registerRoutes
});
import { createServer } from "http";
async function registerRoutes(app2) {
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage_production(), storage_production_exports));
  app2.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "production",
      auth: "local",
      database: "connected"
    });
  });
  app2.get("/api/debug/status", (req, res) => {
    res.json({
      status: "running",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 5e3,
      headers: req.headers,
      ip: req.ip || req.socket.remoteAddress,
      protocol: req.protocol,
      hostname: req.hostname,
      originalUrl: req.originalUrl,
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB"
      },
      uptime: Math.round(process.uptime()) + " seconds"
    });
  });
  app2.get("/api/debug/echo", (req, res) => {
    console.log("\u{1F4E5} Echo request received:", {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query
    });
    res.json({
      echo: "success",
      received: {
        headers: req.headers,
        query: req.query,
        body: req.body
      }
    });
  });
  app2.get("/api/debug/db", async (req, res) => {
    try {
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
      const result = await pool2.query("SELECT NOW() as now, version() as version");
      res.json({
        connected: true,
        timestamp: result.rows[0].now,
        version: result.rows[0].version
      });
    } catch (error) {
      console.error("Database debug error:", error);
      res.status(500).json({
        connected: false,
        error: error.message
      });
    }
  });
  console.log("\u{1F527} ROUTES: Ensuring database is ready before auth...");
  try {
    const { initializeDatabase: initializeDatabase2 } = await Promise.resolve().then(() => (init_initDatabase_production(), initDatabase_production_exports));
    await initializeDatabase2();
    console.log("\u2705 ROUTES: Database confirmed ready");
  } catch (error) {
    console.error("\u274C ROUTES: Database initialization failed:", error);
    throw error;
  }
  console.log("Using local authentication system");
  setupLocalAuth(app2);
  const isAuthenticated = requireAuth;
  app2.get("/api/groups", isAuthenticated, async (req, res) => {
    try {
      console.log("\u{1F50D} Groups API called, user ID:", req.user?.id);
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      console.log("\u{1F50D} Current user found:", user ? { id: user.id, role: user.role } : "null");
      if (!user) {
        console.log("\u274C User not found");
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role === "admin") {
        console.log("\u2705 User is admin, fetching all groups...");
        const groups2 = await storage2.getGroups();
        console.log("\u2705 Groups fetched for admin, count:", groups2.length);
        res.json(groups2);
      } else {
        console.log("\u2705 User is not admin, fetching user groups...");
        const userGroups2 = user.userGroups.map((ug) => ug.group);
        console.log("\u2705 User groups fetched, count:", userGroups2.length);
        res.json(userGroups2);
      }
    } catch (error) {
      console.error("\u274C Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });
  app2.post("/api/groups", isAuthenticated, async (req, res) => {
    try {
      console.log("\u{1F50D} Create group API called, user ID:", req.user?.id);
      console.log("\u{1F50D} Group data to create:", req.body);
      const userId = req.user.id;
      const user = await storage2.getUser(userId);
      console.log("\u{1F50D} Current user found:", user ? { id: user.id, role: user.role } : "null");
      if (!user || user.role !== "admin" && user.role !== "manager") {
        console.log("\u274C Access denied - insufficient permissions");
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const data = insertGroupSchema.parse(req.body);
      console.log("\u2705 Group data validated:", data);
      const group = await storage2.createGroup(data);
      console.log("\u2705 Group created successfully:", group);
      res.json(group);
    } catch (error) {
      console.error("\u274C Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });
  app2.put("/api/groups/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin" && user.role !== "manager") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = parseInt(req.params.id);
      const data = insertGroupSchema.partial().parse(req.body);
      const group = await storage2.updateGroup(id, data);
      res.json(group);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });
  app2.delete("/api/groups/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin" && user.role !== "manager") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = parseInt(req.params.id);
      await storage2.deleteGroup(id);
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });
  app2.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers2 = await storage2.getSuppliers();
      res.json(suppliers2);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });
  app2.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin" && user.role !== "manager") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage2.createSupplier(data);
      res.json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });
  app2.put("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin" && user.role !== "manager") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = parseInt(req.params.id);
      const data = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage2.updateSupplier(id, data);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });
  app2.delete("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin" && user.role !== "manager") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = parseInt(req.params.id);
      await storage2.deleteSupplier(id);
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });
  app2.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      console.log("\u{1F50D} Users API called, user ID:", req.user?.id);
      const user = await storage2.getUser(req.user.id);
      console.log("\u{1F50D} Current user found:", user ? { id: user.id, role: user.role } : "null");
      if (!user || user.role !== "admin") {
        console.log("\u274C Access denied - user is not admin");
        return res.status(403).json({ message: "Access denied - admin only" });
      }
      console.log("\u2705 User is admin, fetching all users...");
      const users2 = await storage2.getUsers();
      console.log("\u2705 Users fetched successfully, count:", users2.length);
      res.json(users2);
    } catch (error) {
      console.error("\u274C Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/users", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const userData = req.body;
      const newUser = await storage2.createUser(userData);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = req.params.id;
      const userData = req.body;
      const updatedUser = await storage2.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = req.params.id;
      if (id === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      await storage2.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.post("/api/user-groups", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const data = insertUserGroupSchema.parse(req.body);
      const userGroup = await storage2.assignUserToGroup(data);
      res.json(userGroup);
    } catch (error) {
      console.error("Error assigning user to group:", error);
      res.status(500).json({ message: "Failed to assign user to group" });
    }
  });
  app2.delete("/api/user-groups/:userId/:groupId", isAuthenticated, async (req, res) => {
    try {
      const user = await storage2.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const userId = req.params.userId;
      const groupId = parseInt(req.params.groupId);
      await storage2.removeUserFromGroup(userId, groupId);
      res.json({ message: "User removed from group successfully" });
    } catch (error) {
      console.error("Error removing user from group:", error);
      res.status(500).json({ message: "Failed to remove user from group" });
    }
  });
  app2.get("/api/default-credentials-check", async (req, res) => {
    try {
      const defaultUser = await storage2.getUserByUsername("admin");
      if (!defaultUser) {
        return res.json({ showDefault: false });
      }
      const showDefault = !defaultUser.passwordChanged;
      res.json({ showDefault });
    } catch (error) {
      console.error("Error checking default credentials:", error);
      res.json({ showDefault: false });
    }
  });
  app2.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { startDate, endDate, storeId } = req.query;
      let groupIds;
      if (user.role !== "admin") {
        groupIds = user.userGroups.map((ug) => ug.groupId);
      } else if (storeId && storeId !== "all") {
        groupIds = [parseInt(storeId)];
      }
      let orders2;
      if (startDate && endDate) {
        orders2 = await storage2.getOrdersByDateRange(startDate, endDate, groupIds);
      } else {
        orders2 = await storage2.getOrders(groupIds);
      }
      res.json(orders2);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const data = insertOrderSchema.parse({
        ...req.body,
        createdBy: userId
      });
      if (user.role !== "admin") {
        const userGroupIds = user.userGroups.map((ug) => ug.groupId);
        if (!userGroupIds.includes(data.groupId)) {
          return res.status(403).json({ message: "Insufficient permissions for this group" });
        }
      }
      const order = await storage2.createOrder(data);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  app2.put("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const id = parseInt(req.params.id);
      const existingOrder = await storage2.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (user.role !== "admin" && existingOrder.createdBy !== userId) {
        return res.status(403).json({ message: "Can only edit your own orders" });
      }
      const data = insertOrderSchema.partial().parse(req.body);
      const order = await storage2.updateOrder(id, data);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });
  app2.delete("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const id = parseInt(req.params.id);
      const existingOrder = await storage2.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (user.role !== "admin" && existingOrder.createdBy !== userId) {
        return res.status(403).json({ message: "Can only delete your own orders" });
      }
      await storage2.deleteOrder(id);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });
  app2.get("/api/deliveries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { startDate, endDate, storeId, withBL } = req.query;
      let groupIds;
      if (user.role !== "admin") {
        groupIds = user.userGroups.map((ug) => ug.groupId);
      } else if (storeId && storeId !== "all") {
        groupIds = [parseInt(storeId)];
      }
      let deliveries2;
      if (startDate && endDate) {
        deliveries2 = await storage2.getDeliveriesByDateRange(startDate, endDate, groupIds);
      } else {
        deliveries2 = await storage2.getDeliveries(groupIds);
      }
      if (withBL === "true") {
        deliveries2 = deliveries2.filter((d) => d.status === "delivered" && d.blNumber);
      }
      res.json(deliveries2);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });
  app2.post("/api/deliveries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const data = insertDeliverySchema.parse({
        ...req.body,
        createdBy: userId
      });
      if (user.role !== "admin") {
        const userGroupIds = user.userGroups.map((ug) => ug.groupId);
        if (!userGroupIds.includes(data.groupId)) {
          return res.status(403).json({ message: "Insufficient permissions for this group" });
        }
      }
      const delivery = await storage2.createDelivery(data);
      res.json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });
  app2.put("/api/deliveries/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const id = parseInt(req.params.id);
      const existingDelivery = await storage2.getDelivery(id);
      if (!existingDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      if (user.role !== "admin" && existingDelivery.createdBy !== userId) {
        return res.status(403).json({ message: "Can only edit your own deliveries" });
      }
      const data = insertDeliverySchema.partial().parse(req.body);
      const delivery = await storage2.updateDelivery(id, data);
      res.json(delivery);
    } catch (error) {
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });
  app2.delete("/api/deliveries/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const id = parseInt(req.params.id);
      const existingDelivery = await storage2.getDelivery(id);
      if (!existingDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      if (user.role !== "admin" && existingDelivery.createdBy !== userId) {
        return res.status(403).json({ message: "Can only delete your own deliveries" });
      }
      await storage2.deleteDelivery(id);
      res.json({ message: "Delivery deleted successfully" });
    } catch (error) {
      console.error("Error deleting delivery:", error);
      res.status(500).json({ message: "Failed to delete delivery" });
    }
  });
  app2.post("/api/deliveries/:id/validate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage2.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const id = parseInt(req.params.id);
      const { blNumber, blAmount } = req.body;
      await storage2.validateDelivery(id, { blNumber, blAmount });
      res.json({ message: "Delivery validated successfully" });
    } catch (error) {
      console.error("Error validating delivery:", error);
      res.status(500).json({ message: "Failed to validate delivery" });
    }
  });
  app2.get("/api/stats/monthly", isAuthenticated, async (req, res) => {
    try {
      const year = parseInt(req.query.year) || (/* @__PURE__ */ new Date()).getFullYear();
      const month = parseInt(req.query.month) || (/* @__PURE__ */ new Date()).getMonth() + 1;
      const userId = req.user.id;
      const user = await storage2.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let groupIds;
      if (user.role !== "admin") {
        groupIds = user.userGroups.map((ug) => ug.groupId);
      }
      const stats = await storage2.getMonthlyStats(year, month, groupIds);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  return createServer(app2);
}
var init_routes_production = __esm({
  "server/routes.production.ts"() {
    "use strict";
    init_localAuth_production();
    init_schema();
  }
});

// server/index.production.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
process.env.USE_LOCAL_AUTH = "true";
process.env.NODE_ENV = "production";
console.log("Production Environment Configuration:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- USE_LOCAL_AUTH:", process.env.USE_LOCAL_AUTH);
console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "***configured***" : "NOT SET");
console.log("- PORT:", process.env.PORT || 5e3);
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  const reqId = Math.random().toString(36).substring(7);
  let capturedJsonResponse = void 0;
  console.log(`[${reqId}] --> ${req.method} ${reqPath}`);
  console.log(`[${reqId}]     Host: ${req.get("host")}`);
  console.log(`[${reqId}]     IP: ${req.ip || req.socket.remoteAddress}`);
  console.log(`[${reqId}]     Headers: ${JSON.stringify({
    "x-forwarded-for": req.get("x-forwarded-for"),
    "x-real-ip": req.get("x-real-ip"),
    "user-agent": req.get("user-agent")?.substring(0, 50)
  })}`);
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `[${reqId}] <-- ${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse && reqPath.startsWith("/api")) {
      const responseStr = JSON.stringify(capturedJsonResponse);
      if (responseStr.length > 100) {
        logLine += ` :: ${responseStr.substring(0, 99)}\u2026`;
      } else {
        logLine += ` :: ${responseStr}`;
      }
    }
    console.log(logLine);
    if (res.statusCode >= 400) {
      console.error(`[${reqId}] ERROR Response:`, res.statusCode, res.statusMessage);
    }
  });
  next();
});
function serveStatic(app2) {
  const possiblePaths = [
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "dist/client")
  ];
  let distPath = "";
  let indexPath = "";
  for (const testPath of possiblePaths) {
    const testIndex = path.resolve(testPath, "index.html");
    if (fs.existsSync(testIndex)) {
      distPath = testPath;
      indexPath = testIndex;
      break;
    }
  }
  if (!distPath) {
    console.error(`[ERROR] Frontend files not found in any of these paths:`);
    possiblePaths.forEach((p) => {
      console.error(`  - ${p} (exists: ${fs.existsSync(p)})`);
      if (fs.existsSync(p)) {
        console.error(`    Files: ${fs.readdirSync(p).join(", ")}`);
      }
    });
    app2.get("*", (_req, res) => {
      res.status(500).send("Frontend build files not found. Please rebuild the application.");
    });
    return;
  }
  console.log(`[express] \u2705 Serving static files from: ${distPath}`);
  console.log(`[express] \u2705 index.html found at: ${indexPath}`);
  console.log(`[express] Available files:`, fs.readdirSync(distPath).join(", "));
  app2.use(express.static(distPath));
  app2.get("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}
async function loadRoutes() {
  const { registerRoutes: registerRoutes2 } = await Promise.resolve().then(() => (init_routes_production(), routes_production_exports));
  return registerRoutes2;
}
async function forceInitDatabase() {
  console.log("\u{1F527} FORCING DATABASE INITIALIZATION...");
  try {
    const { initializeDatabase: initializeDatabase2 } = await Promise.resolve().then(() => (init_initDatabase_production(), initDatabase_production_exports));
    const { db: db2 } = await Promise.resolve().then(() => (init_db_production(), db_production_exports));
    await initializeDatabase2();
    console.log("\u{1F527} Verifying name column...");
    const columnCheck = await db2.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'name'
    `);
    if (columnCheck.length === 0) {
      console.log("\u{1F6A8} CRITICAL: Adding name column immediately...");
      await db2.execute(`ALTER TABLE users ADD COLUMN name VARCHAR(255)`);
      await db2.execute(`UPDATE users SET name = COALESCE(username, email) WHERE name IS NULL`);
      console.log("\u2705 Name column added successfully");
    } else {
      console.log("\u2705 Name column verified present");
    }
    return true;
  } catch (error) {
    console.error("\u274C CRITICAL DATABASE INIT ERROR:", error);
    return false;
  }
}
(async () => {
  const dbReady = await forceInitDatabase();
  if (!dbReady) {
    console.error("\u274C DATABASE INITIALIZATION FAILED - EXITING");
    process.exit(1);
  }
  const registerRoutes2 = await loadRoutes();
  const server = await registerRoutes2(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(`[ERROR] ${status}: ${message}`);
  });
  serveStatic(app);
  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    console.log(`[express] serving on port ${port}`);
    console.log(`[express] Server bound to 0.0.0.0:${port}`);
    console.log(`[express] Ready to accept connections`);
    setTimeout(() => {
      console.log("\n\u{1F50D} Server diagnostics:");
      console.log(`   - Process PID: ${process.pid}`);
      console.log(`   - Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      console.log(`   - Node version: ${process.version}`);
      console.log(`   - Working directory: ${process.cwd()}`);
    }, 1e3);
  });
  server.on("error", (error) => {
    console.error("\u274C Server error:", error);
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use`);
    }
  });
})();
/*! Bundled license information:

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)

cookie/index.js:
  (*!
   * cookie
   * Copyright(c) 2012-2014 Roman Shtylman
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

depd/index.js:
  (*!
   * depd
   * Copyright(c) 2014-2018 Douglas Christopher Wilson
   * MIT Licensed
   *)

on-headers/index.js:
  (*!
   * on-headers
   * Copyright(c) 2014 Douglas Christopher Wilson
   * MIT Licensed
   *)

parseurl/index.js:
  (*!
   * parseurl
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2014-2017 Douglas Christopher Wilson
   * MIT Licensed
   *)

random-bytes/index.js:
  (*!
   * random-bytes
   * Copyright(c) 2016 Douglas Christopher Wilson
   * MIT Licensed
   *)

uid-safe/index.js:
  (*!
   * uid-safe
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015-2017 Douglas Christopher Wilson
   * MIT Licensed
   *)

express-session/session/cookie.js:
  (*!
   * Connect - session - Cookie
   * Copyright(c) 2010 Sencha Inc.
   * Copyright(c) 2011 TJ Holowaychuk
   * MIT Licensed
   *)
  (*!
   * Prototype.
   *)

express-session/session/session.js:
  (*!
   * Connect - session - Session
   * Copyright(c) 2010 Sencha Inc.
   * Copyright(c) 2011 TJ Holowaychuk
   * MIT Licensed
   *)

express-session/session/store.js:
  (*!
   * Connect - session - Store
   * Copyright(c) 2010 Sencha Inc.
   * Copyright(c) 2011 TJ Holowaychuk
   * MIT Licensed
   *)

express-session/session/memory.js:
  (*!
   * express-session
   * Copyright(c) 2010 Sencha Inc.
   * Copyright(c) 2011 TJ Holowaychuk
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

express-session/index.js:
  (*!
   * express-session
   * Copyright(c) 2010 Sencha Inc.
   * Copyright(c) 2011 TJ Holowaychuk
   * Copyright(c) 2014-2015 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/
