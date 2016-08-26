
var assert = require('assert');

var swf = require('../index');
var ActivityPoller = swf.ActivityPoller;


var pollForActivityTaskCallCount = 0;
var swfClientMock = {
    pollForActivityTask: function(p, cb) {
        pollForActivityTaskCallCount += 1;
        
        setTimeout(function() {
            cb(null, {
                taskToken: (pollForActivityTaskCallCount == 2) ? '12345' : undefined
            });
        }, 10);
    }
};

describe('ActivityPoller', function(){

    it('should check domain and taskList', function() {

      var error_raised = false;
      try {
        var activityPoller = new ActivityPoller({
        }, swfClientMock);
      }
      catch(ex) {
        error_raised = true;
      }

      assert.equal(true, error_raised);

    });

    it('should start, emit ActivityTask, and stop', function(done) {

      var activityPoller = new ActivityPoller({
        domain: 'test-domain',
        taskList: {
          name: 'test-taskList'
        }
      }, swfClientMock);


      activityPoller.on('activityTask', function(activityTask) {
        activityPoller.stop();
        done();
      });

      activityPoller.start();
    });

    it('should insantaiate without swfClient', function() {
      var activityPoller = new ActivityPoller({
        domain: 'test-domain',
        taskList: {
          name: 'test-taskList'
        }
      });
    });

    describe('polling errors', function() {
      var swfClientMock = {
        pollForActivityTask: function(p, cb) {
            setTimeout(function() {
                cb(new Error('polling failure'), null);
            }, 1);
        }
      };

      it('retries up to the retry limit then emits fatal', function(done) {
        var errorCount = 0;
        var activityPoller = new ActivityPoller({
          errorRetryDelay: 1,
          errorRetryLimit: 10,
          domain: 'test-domain',
          taskList: {
            name: 'test-taskList'
          }
        }, swfClientMock);

        activityPoller.on('error', function() {
          errorCount += 1;
        });
        activityPoller.on('fatal', function() {
          activityPoller.stop();
          assert.equal(errorCount, 10);
          done();
        });
        activityPoller.start();
      });
    });

});
