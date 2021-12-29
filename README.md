<a href="https://www.twilio.com">
  <img src="https://static0.twilio.com/marketing/bundles/marketing/img/logos/wordmark-red.svg" alt="Twilio" width="250" />
</a>

# Deprecated Tutorial - Please use Twilio Verify

For new development, we encourage you to use the Verify API. The Verify API is an evolution of the Authy API with continued support for SMS, voice, and email one-time passcodes, and an improved developer experience.

For more about Twilio Verify, please visit the [Twilio Verify Docs](https://www.twilio.com/docs/verify)

# Blog TFA Post - NodeJS/Express

### Prerequisites

1. [Node](http://nodejs.org/)
1. [MongoDb](http://docs.mongodb.org/manual/installation/)
1. A Twilio account with a verified [phone number](https://www.twilio.com/console/phone-numbers/incoming). (Get a
   [free account](https://www.twilio.com/try-twilio?utm_campaign=tutorials&utm_medium=readme)
   here.) If you are using a Twilio Trial Account, you can learn all about it
   [here](https://www.twilio.com/help/faq/twilio-basics/how-does-twilios-free-trial-work).


### Local Development

1. First clone this repository and `cd` into it.

   ```
   $ git clone git@github.com:TwilioDevEd/blog-tfa-node.git
   $ cd blog-tfa-node
   ```

1. Copy the sample configuration file and edit it to match your configuration.

  ```bash
  $ cp .env.example .env
  ```

 You can find your `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in your
 [Twilio Account Settings](https://www.twilio.com/user/account/settings).
 You will also need a `TWILIO_NUMBER`, which you may find [here](https://www.twilio.com/user/account/phone-numbers/incoming).

1. Install dependencies.

  ```bash
  $ npm install
  ```

1. Make sure the tests succeed.

  ```bash
  $ npm test
  ```

1. Run the application.

  ```bash
  $ npm start
  ```

## Meta

* No warranty expressed or implied. Software is as is. Diggity.
* [MIT License](http://www.opensource.org/licenses/mit-license.html)
* Lovingly crafted by Twilio Developer Education.
