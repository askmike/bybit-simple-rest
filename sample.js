const BybitRest = require('./');

const key = 'x';
const secret = 'y';

const run = async() => {

  const client = new BybitRest({
    key,
    secret
  });

  /*
  const resp = await client.request({
    method: 'GET',
    path: '/v5/account/wallet-balance',
    data: {
      // NOTE: provide in alphabetical order
      accountType: 'CONTRACT'
    }
  });
  console.log(JSON.stringify(resp, null, 2));
  */

  /*
  const resp = await client.request({
    method: 'POST',
    path: '/v5/order/create',
    data: {
      // NOTE: provide in alphabetical order
      category: 'linear',
      orderType: 'Limit',
      positionIdx: 0,
      price: '20000',
      qty: '0.01',
      side: 'Buy',
      symbol: 'BTCUSDT',
      timeInForce: 'PostOnly',
    }
  });
  console.log(JSON.stringify(resp, null, 2));
  */

  const resp = await client.request({
    method: 'POST',
    path: '/v5/order/cancel-all',
    data: {
      // NOTE: provide in alphabetical order
      category: 'linear',
      symbol: 'BTCUSDT',
    }
  });
  console.log(JSON.stringify(resp, null, 2));

}

run();