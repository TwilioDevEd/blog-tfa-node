var mockery = require('mockery');

//mock twilio client
mockery.enable();
mockery.warnOnUnregistered(false);
mockery.registerMock('twilio', () => {
  return {
    sms: {
      messages: {
        create: function(opts, callback) {
          if (opts.to === 'FAKE') {
            callback('error fake number', undefined);
          } else {
            callback(undefined, 'default message');
          }
        }
      }
    }
  };
});
