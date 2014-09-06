var assert = require('assert');

describe('Hooks', function() {

  var Hooks = require('../lib/hooks');

  describe('.wrap()', function() {

    it('should create a hookable function', function() {

      function foo() {}

      assert.doesNotThrow(function() {
        var hookableFoo = Hooks.wrap(foo);
        assert.ok(hookableFoo.before);
        assert.ok(hookableFoo.after);
      });

    });

    function echo(msg) {
      return msg;
    }

    it('should not alter the function behavior by default', function() {

      var hookableEcho = Hooks.wrap(echo);
      var result = hookableEcho(1337);

      assert.strictEqual(result, 1337);

    });

    describe('.before()', function() {

      it('should not alter arguments with a no op hook', function() {

        var hookableEcho = Hooks.wrap(echo);

        hookableEcho.before(function noop() {});

        var result = hookableEcho(1337);

        assert.strictEqual(result, 1337);

      });

      it('should add a hook before the function execution', function() {

        var hookableEcho = Hooks.wrap(echo);

        hookableEcho.before(function(msg) {
          return [7331];
        });

        var result = hookableEcho(1337);

        assert.strictEqual(result, 7331);

      });

    });

    describe('.after()', function() {

      it('should not alter result with a no op hook', function() {

        var hookableEcho = Hooks.wrap(echo);

        hookableEcho.after(function noop() {});

        var result = hookableEcho(1337);

        assert.strictEqual(result, 1337);

      });

      it('should add a hook after the function execution', function() {

        var hookableEcho = Hooks.wrap(echo);

        hookableEcho.after(function(result) {
          return 7331;
        });

        var result = hookableEcho(1337);

        assert.strictEqual(result, 7331);

      });

    });

  });

});
