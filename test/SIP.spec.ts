import {SipMessage} from '../src/SIP';

describe('call log', () => {
  test('list call log', async () => {
    const str = `SIP/2.0 401 Unauthorized
Via: SIP/2.0/TCP a3dc7c2b-9a26-4327-9b81-16fad9fa8370.invalid;branch=z9hG4bKe92a4bab-6810-45c7-93cc-4a0ed1842056;received=98.33.76.34
To: <sip:17203861294*11115@sip.ringcentral.com>;tag=2a77cbf960ac867417503d7f78a9c521-1844
From: <sip:17203861294*11115@sip.ringcentral.com>;tag=4ecdb810-2fa3-4d68-8941-0584fcd3cd6e
Call-ID: 3a1572ad-9369-4751-bc26-6ce296e2d9c6
CSeq: 8082 REGISTER
WWW-Authenticate: Digest realm="sip.ringcentral.com", nonce="YAu2cWALtUX21JsIZNAgPUdE9tIETHHw"
Content-Length: 0


`
      .split('\n')
      .join('\r\n'); // SIP Message line break is \r\n, but editor will convert them to \n
    const sipMessage = SipMessage.fromString(str);
    const str2 = sipMessage.toString();
    expect(str2).toEqual(str);
  });
});
