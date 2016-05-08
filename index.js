/**
 * Module Dependencies
 */

var debug = require('debug')('x-ray:electron')
var normalize = require('normalizeurl')
var Nightmare = require('nightmare')
var wrapfn = require('wrap-fn')

/**
* Export `driver`
*/

module.exports = driver

/**
* Initialize the `driver`
* with the following `options`
*
* @param {Object} options
* @param {Function} fn
* @return {Function}
* @api public
*/

function driver(options, fn) {
  if (typeof options === 'function') fn = options, options = {}
  options = options || {}
  if (options.showDev === true ) {
    options.dock = true
    options.openDevTools = true
    options.show = true
  }
  fn = fn || electron
  var nightmare = new Nightmare(options)

  return function electron_driver(ctx, done) {
    debug('going to %s', ctx.url)

    nightmare
      .on('unresponsive', function() {
        console.warn('the web page ' + ctx.url + 'becomes unresponsive.')
      })
      .on('responsive', function() {
        console.log('the unresponsive web page ' + ctx.url + 'becomes responsive again.')
      })
      .on('did-fail-load', function(event, errorCode, errorDescription) {
        console.error('nightmare did-fail-load error: ' + errorCode + '; ' + errorDescription)
        return new Error(errorDescription, errorCode)
      })
      .on('did-get-response-details', function(event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers) {
        if (normalize(originalUrl) == normalize(ctx.url)) {
          debug('got response from original url: %s, actual url: %s, httpResponseCode: %s', originalUrl, newUrl, httpResponseCode)
          ctx.status = httpResponseCode
        }
      })
      .on('dom-ready', function() {
        debug('dom-ready for %s', ctx.url)
      })
      .on('will-navigate', function(event, url) {
        debug('redirect: %s', url)
        ctx.url = url
      })

    wrapfn(fn, select)(ctx, nightmare)

    function select(err, ret) {
      if (err) done(err)
      console.log(11111)
      nightmare
        .evaluate(function() {
          console.log(22222)
          return document.documentElement.outerHTML
        }, function(body) {
          console.log(33333)
          ctx.body = body
        })
        .run(function(err) {
          console.log(44444)
          if (err) return done(err)
          debug('nightmare .run url: %s ; status: %s', ctx.url, ctx.status)
          done(null, ctx)
        })
    }
  }
}

/**
 * Default electron driver
 *
 * @param {HTTP Context} ctx
 * @param {Nightmare} nightmare
 * @param {Function} fn
 */

function electron(ctx, nightmare) {
  return nightmare.goto(ctx.url)
}

/**
* electron errors go here
*
* @param {String} msg
*/

function error(msg) {
  debug('client-side javascript error %s', msg)
}
