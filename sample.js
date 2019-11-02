const BybitRest = require('./');

const key = 'x';
const secret = 'y';


const run = async() => {

  const client = new BybitRest({
    key,
    secret
  });

  const resp = await client.request({
    method: 'GET',
    path: '/open-api/order/list',
    data: {
      symbol: 'BTCUSD'
    }
  });

  console.log(resp);

}

run();