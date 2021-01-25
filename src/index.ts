import RingCentral from '@rc-ex/core';
import {hostname} from 'os';
import {Socket} from 'net';
import waitFor from 'wait-for-async';
import {v4 as uuid} from 'uuid';
import {SIPInfoResponse} from '@rc-ex/core/lib/definitions';

import {SipMessage} from './SIP';
import {generateAuthorization, waitForMessage} from './utils';

const fakeDomain = uuid() + '.invalid';
const fakeEmail = uuid() + '@' + fakeDomain;

const rc = new RingCentral({
  clientId: process.env.RINGCENTRAL_CLIENT_ID,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET,
  server: process.env.RINGCENTRAL_SERVER_URL,
});

const register = async (client: Socket, sipInfo: SIPInfoResponse) => {
  const sipMessage = new SipMessage({
    subject: `REGISTER sip:${sipInfo.domain} SIP/2.0`,
    headers: {
      'Call-ID': uuid(),
      'User-Agent': 'ringcentral-tcp-sip-demo',
      Contact: `<sip:${fakeEmail};transport=tcp>;expires=600`,
      Via: `SIP/2.0/TCP ${fakeDomain};branch=${'z9hG4bK' + uuid()}`,
      From: `<sip:${sipInfo.username}@${sipInfo.domain}>;tag=${uuid()}`,
      To: `<sip:${sipInfo.username}@${sipInfo.domain}>`,
      CSeq: '8082 REGISTER',
      'Content-Length': '0',
      'Max-Forwards': '70',
    },
    body: '',
  });
  const body = sipMessage.toString();
  console.log(body);
  client.write(body);
  const message = await waitForMessage(
    client,
    message => message.indexOf('", nonce="') !== -1
  );
  console.log('Got it');
  const nonceMessage = SipMessage.fromString(message);
  const wwwAuth =
    nonceMessage.headers['WWW-Authenticate'] ||
    nonceMessage.headers['Www-Authenticate'];
  const nonce = wwwAuth.match(/, nonce="(.+?)"/)![1];
  const auth = generateAuthorization(sipInfo, 'REGISTER', nonce);
  sipMessage.headers.Authorization = auth;
  sipMessage.headers.CSeq = '8083 REGISTER';
  sipMessage.headers.Via = `SIP/2.0/TCP ${fakeDomain};branch=${
    'z9hG4bK' + uuid()
  }`;
  const body2 = sipMessage.toString();
  console.log(body2);
  client.write(body2);
};

(async () => {
  await rc.authorize({
    username: process.env.RINGCENTRAL_USERNAME!,
    extension: process.env.RINGCENTRAL_EXTENSION,
    password: process.env.RINGCENTRAL_PASSWORD!,
  });

  const sipProvision = await rc
    .restapi()
    .clientInfo()
    .sipProvision()
    .post({
      sipInfo: [{transport: 'TCP'}],
      device: {
        computerName: hostname(),
      },
    });

  const sipInfo = sipProvision.sipInfo![0];
  console.log(sipInfo);

  const [host, port] = sipInfo.outboundProxy!.split(':');

  const client = new Socket();
  client.connect(parseInt(port), host, () => {
    console.log('Connected');
    register(client, sipInfo);
  });
  client.on('data', buffer => {
    const message = buffer.toString();
    console.log(
      '>>>>>> Start of received message >>>>>>\n',
      message,
      '\n<<<<<< End of received message <<<<<<'
    );
  });
  client.on('close', () => {
    console.log('Closed');
  });

  await waitFor({interval: 3000});
  client.destroy();

  await rc.revoke();
})();
