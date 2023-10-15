const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const version = require('./package.json').version;
const name = require('./package.json').name;

const USER_AGENT = `${name}@${version}`;

class BybitRest {
  constructor(config) {
    this.ua = USER_AGENT;
    this.timeout = 10 * 1000;
    this.expiration = '' + (60 * 1000);

    // keep-alive
    this.agent = new https.Agent({
      keepAlive: true,
      timeout: 90 * 1000,
      keepAliveMsecs: 1000 * 60
    });

    if(!config) {
      return;
    }

    if(config.key && config.secret) {
      this.key = config.key;
      this.secret = config.secret;
    }

    if(config.timeout) {
      this.timeout = config.timeout;
    }

    if(config.expiration) {
      this.expiration = config.expiration;
    }

    if(config.userAgent) {
      this.ua += ' | ' + config.userAgent;
    }
  }

  // this fn can easily take more than 0.15ms due to heavy crypto functions
  // if your application is _very_ latency sensitive prepare the drafts
  // before you realize you want to send them.
  createDraft({path, method, data, expiration, timeout}) {
    if(!expiration) {
      expiration = this.expiration;
    }

    if(!timeout) {
      timeout = this.timeout;
    }

    const start = '' + Date.now();

    let payload;
    if(method === 'GET') {
      payload = querystring.stringify(data);
    } else {
      payload = JSON.stringify(data);
    }


    const message = start + this.key + expiration + payload;

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(message)
      .digest('hex');

    const options = {
      host: 'api.bybit.com',
      path,
      method,
      agent: this.agent,
      headers: {
        'User-Agent': this.ua,
        'Content-Type' : 'application/json; charset=utf-8',
        'X-BAPI-SIGN-TYPE': '2',
        'X-BAPI-SIGN': signature,
        'X-BAPI-API-KEY': this.key,
        'X-BAPI-TIMESTAMP': start,
        'X-BAPI-RECV-WINDOW': expiration
      },
      // merely passed through for requestDraft
      timeout
    };

    if(method === 'GET') {
      options.path += '?' + payload;
    } else {
      options.payload = payload;
    }

    return options;
  }

  // a draft is an option object created (potentially previously) with createDraft
  requestDraft(draft) {
    return new Promise((resolve, reject) => {
      const req = https.request(draft, res => {
        res.setEncoding('utf8');
        let buffer = '';
        res.on('data', function(data) {
          // TODO: we receive this event up to ~0.6ms before the end
          // event, though if this is valid json & doesn't contain
          // an error we can return from here, since we dont care
          // about status code.
          buffer += data;
        });
        res.on('end', function() {
          if (res.statusCode >= 300) {
            let message;
            let data;

            try {
              data = JSON.parse(buffer);
              message = data.error.message;
            } catch(e) {
              message = buffer;
            }

            const error = new Error(message);
            error.res = res;
            error.data = data;

            return reject(error);
          }

          let data;
          try {
            data = JSON.parse(buffer);
          } catch (err) {
            const error = new Error(buffer);
            error.res = res;

            return reject(error);
          }

          resolve(data);
        });
      });

      req.on('error', err => {
        reject(err);
      });

      req.on('socket', socket => {
        if(socket.connecting) {
          socket.setNoDelay(true);
          socket.setTimeout(draft.timeout);
          socket.on('timeout', function() {
            req.abort();
          });
        }
      });

      req.end(draft.payload);
    });
  }

  // props: {path, method, data, expiration, timeout}
  request(props) {
    return this.requestDraft(this.createDraft(props));
  }
};

module.exports = BybitRest;