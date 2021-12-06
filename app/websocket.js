/* eslint-disable no-console */
import WebSocket from 'ws';
import api, { DEVICE_STATUS } from './api';
import parseMessage from './methods/parseMessage';
import { trackError } from './errorReporting';

const PING_TIMEOUT = 30 * 1000;
const RETRIEVE_DATA_TIMEOUT = 5 * 1000;

const pingAllClients = (wss) =>
    setInterval(() => {
        wss.clients.forEach((socket) => {
            console.log('setInterval socket.isAlive: ', socket.isAlive);
            if (socket.isAlive === false) return socket.terminate();
            // eslint-disable-next-line no-param-reassign
            socket.isAlive = false;
            socket.ping(null);
            return null;
        });
    }, PING_TIMEOUT);

const parseUrlQuery = (url) => {
    // example: /?deviceId=123
    const infoMap = {};
    url.substr(2)
        .split('&')
        .map((item) => item.split('='))
        .forEach(([key, val]) => {
            infoMap[key] = val;
        });
    return infoMap;
};

async function initWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.pingInterval = pingAllClients(wss);

    wss.on('error', (error) => {
        clearInterval(wss.pingInterval);
        console.log('[WS Server] Error', wss.pingInterval, error);
    });

    wss.on('close', () => {
        clearInterval(wss.pingInterval);
        console.log('[WS Server] Close', wss.pingInterval);
    });

    wss.on('headers', (headers) => {
        console.log('[WS Server] Headers', headers);
    });

    wss.on('connection', (socket, req) => {
        console.log('[WS Server] Connection');
        const deviceQueryInfo = parseUrlQuery(req.url);
        const { deviceId } = deviceQueryInfo;
        console.log('[WS] Connection started for device: ', deviceId);
        api.setDeviceStatus(deviceId, DEVICE_STATUS.CONNECTED);

        const retrieveSensorDataInterval = setInterval(() => {
            console.log('retrieveSensorDataInterval -> isAlive', socket.isAlive);
            // send action to retrieve data from all sensors
            socket.send('RETRIEVE_PERIPHAL_DATA');
        }, RETRIEVE_DATA_TIMEOUT);

        // eslint-disable-next-line no-param-reassign
        socket.isAlive = true;
        socket.on('pong', () => {
            console.log(`[WS] socket -> pong | isAlive: ${socket.isAlive}`, deviceId);
            // eslint-disable-next-line no-param-reassign
            socket.isAlive = true;
        });

        socket.on('message', async (message) => {
            const { action, ...data } = parseMessage(message);
            console.log(`[WS] socket -> message | ${message}`, { action, data });
            if (!data) {
                console.error('[WS] Cannot parse message from socket', message);
                return;
            }

            switch (action) {
                case 'REGISTER_INPUT': {
                    const {
                        peripheralName,
                        peripheralDataType,
                        peripheralDataValue,
                        peripheralDataFormat,
                        peripheralCalibration,
                    } = data;
                    try {
                        await api.registerInput(deviceId, {
                            peripheralName,
                            peripheralDataType,
                            peripheralDataValue,
                            peripheralDataFormat,
                            peripheralCalibration,
                        });
                        api.listenPeripheralData(deviceId, { peripheralName }, (snapshot) => {
                            socket.send(`SET_PERIPHAL_DATA/${peripheralName}/${snapshot.val()}`);
                        });
                    } catch (err) {
                        trackError(err);
                    }
                    break;
                }
                case 'REGISTER_OUTPUT': {
                    const {
                        peripheralName,
                        peripheralDataValue,
                        peripheralDataType,
                        peripheralDataFormat,
                        peripheralCalibration,
                    } = data;
                    api.registerOutput(deviceId, {
                        peripheralName,
                        peripheralDataType,
                        peripheralDataValue,
                        peripheralDataFormat,
                        peripheralCalibration,
                    });
                    break;
                }
                case 'UPDATE': {
                    const { peripheralName, peripheralDataValue } = data;
                    api.update(deviceId, { peripheralName, peripheralDataValue });
                    break;
                }
                default:
            }
        });

        socket.on('close', () => {
            console.log('[WS] socket -> close | Connection Closed', deviceId);
            api.setDeviceStatus(deviceId, DEVICE_STATUS.DISCONNECTED);
            clearTimeout(retrieveSensorDataInterval);
        });

        socket.on('error', () => {
            console.log('[WS] socket -> error | Connection Error', deviceId);
            api.setDeviceStatus(deviceId, DEVICE_STATUS.DISCONNECTED);
            clearTimeout(retrieveSensorDataInterval);
        });
    });
}

export default initWebSocketServer;
