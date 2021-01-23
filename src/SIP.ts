export type SipMessageOptions = {
  subject: string;
  headers: {[key: string]: string};
  body: string;
};

export class SipMessage {
  subject: string;
  headers: {[key: string]: string};
  body: string;

  constructor(options: SipMessageOptions) {
    this.subject = options.subject;
    this.body = options.body;
    this.headers = options.headers;
  }

  static fromString(str: string): SipMessage {
    const [init, ...tail] = str.split('\r\n\r\n');
    const body = tail.join('\r\n\r\n');
    const [subject, ...lines] = init.split('\r\n');
    const headers = Object.fromEntries(lines.map(line => line.split(': ')));
    return new SipMessage({subject, headers, body});
  }

  toString() {
    return [
      this.subject,
      ...Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`),
      '',
      this.body,
    ].join('\r\n');
  }
}
