import {Socket} from 'net';
import md5 from 'blueimp-md5';
import {SIPInfoResponse} from '@rc-ex/core/lib/definitions';

export const waitForMessage = (
  client: Socket,
  condition: (message: string) => boolean
): Promise<string> => {
  return new Promise(resolve => {
    const dataListener = (buffer: Buffer) => {
      const message = buffer.toString();
      if (condition(message)) {
        client.removeListener('data', dataListener);
        resolve(message);
      }
    };
    client.addListener('data', dataListener);
  });
};

const generateResponse = (
  username: string,
  password: string,
  realm: string,
  method: string,
  uri: string,
  nonce: string
) => {
  const ha1 = md5(username + ':' + realm + ':' + password);
  const ha2 = md5(method + ':' + uri);
  const response = md5(ha1 + ':' + nonce + ':' + ha2);
  return response;
};

/*
Sample input:
const username = '802396666666'
const password = 'xxxxxx'
const realm = 'sip.ringcentral.com'
const method = 'REGISTER'
const nonce = 'yyyyyy'
*/
export type SipInfo = {
  authorizationId: string;
  password: string;
  domain: string;
  username: string;
  outboundProxy: string;
};
export const generateAuthorization = (
  sipInfo: SIPInfoResponse,
  method: string,
  nonce: string
) => {
  const {authorizationId: username, password, domain: realm} = sipInfo;
  return `Digest algorithm=MD5, username="${username}", realm="${realm}", nonce="${nonce}", uri="sip:${realm}", response="${generateResponse(
    username!,
    password!,
    realm!,
    method,
    `sip:${realm}`,
    nonce
  )}"`;
};

/*
Sample output:
Proxy-Authorization: Digest algorithm=MD5, username="802396666666", realm="sip.ringcentral.com", nonce="yyyyyyy", uri="sip:+16508888888@sip.ringcentral.com", response="zzzzzzzzz"
*/
export const generateProxyAuthorization = (
  sipInfo: SipInfo,
  method: string,
  targetUser: string,
  nonce: string
) => {
  const {authorizationId: username, password, domain: realm} = sipInfo;
  return `Digest algorithm=MD5, username="${username}", realm="${realm}", nonce="${nonce}", uri="sip:${targetUser}@${realm}", response="${generateResponse(
    username,
    password,
    realm,
    method,
    `sip:${targetUser}@${realm}`,
    nonce
  )}"`;
};
