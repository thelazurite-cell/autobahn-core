import { HttpsProxyOptions } from 'tunnel';

export class HttpsProxy implements HttpsProxyOptions {
    ca: Buffer[] = [];
    cert: Buffer = Buffer.from('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headers: { [p: string]: any } = {};
    host: string = '';
    key: Buffer = Buffer.from('');
    localAddress: string = '';
    port: number = 0;
    proxyAuth: string = '';
    servername: string = '';

}
