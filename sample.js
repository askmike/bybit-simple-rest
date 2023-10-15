const BybitRest = require('./');

const key = 'x';
const secret = 'y';


const run = async() => {

  const client = new BybitRest({
    key,
    secret
  });

  try {
    const resp = await client.request({
      method: 'GET',
      path: '/v5/account/wallet-balance',
      data: {
        accountType: 'CONTRACT'
      }
    });

    console.log(JSON.stringify(resp, null, 2));
  } catch(e) {
    console.log(e.message);
  }


}

run();