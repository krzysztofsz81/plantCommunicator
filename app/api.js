import firebase from './firebase';
import { trackError } from './errorReporting';

const DEVICES_PREFIX = 'devices';
export const ITEM_TYPE = {
    OUTPUT: 'OUTPUT',
    INPUT: 'INPUT',
};
export const DEVICE_STATUS = {
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
};

const DEFAULT_CALIBRATION_MIN = 0;
const DEFAULT_CALIBRATION_MAX = 1;

const getRefPath = (...args) => [DEVICES_PREFIX, ...args].join('/');

const setDeviceStatus = async (deviceId, status) => {
    try {
        const devicesListRef = firebase.database().ref(getRefPath('_list'));
        devicesListRef.once('value', (snapshot) => {
            const devices = Object.values(snapshot.val() || {});
            if (!devices.includes(deviceId)) {
                const newDeviceRef = devicesListRef.push();
                newDeviceRef.set(deviceId);
            }
        });
        await firebase.database().ref(getRefPath(deviceId, 'status')).set(status);
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, null];
    }
};

const registerInput = async (deviceId, payload) => {
    const path = getRefPath(deviceId, payload.peripheralName);
    try {
        const peripheralsListRef = firebase.database().ref(getRefPath(deviceId, '_peripherals', 'input'));
        peripheralsListRef.once('value', (snapshot) => {
            const peripherals = Object.values(snapshot.val() || {});
            if (!peripherals.includes(payload.peripheralName)) {
                const newPeripheralRef = peripheralsListRef.push();
                newPeripheralRef.set(payload.peripheralName);
            }
        });
        await firebase.database().ref(`${path}/type`).set(payload.peripheralDataType);
        await firebase.database().ref(`${path}/format`).set(payload.peripheralDataFormat);
        await firebase.database().ref(`${path}/peripheralType`).set(ITEM_TYPE.OUTPUT);
        await firebase.database().ref(`${path}/supportCalibration`).set(payload.peripheralCalibration);
        if (payload.peripheralCalibration) {
            await firebase.database().ref(`${path}/calibration_min`).set(DEFAULT_CALIBRATION_MIN);
            await firebase.database().ref(`${path}/calibration_max`).set(DEFAULT_CALIBRATION_MAX);
        }

        const snapshot = await firebase.database().ref(path).once('value');
        if (snapshot.val().value === undefined) {
            await firebase.database().ref(`${path}/value`).set(payload.peripheralDataValue);
        }
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, null];
    }
};

const listenPeripheralData = async (deviceId, payload, callback) => {
    const path = getRefPath(deviceId, payload.peripheralName, 'value');
    try {
        await firebase.database().ref(path).on('value', callback);
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, null];
    }
};

const listenPeripheralDataOnce = async (deviceId, payload) => {
    const path = getRefPath(deviceId, payload.peripheralName);
    try {
        const snapshot = await firebase.database().ref(path).once('value');
        return [null, snapshot.val()];
    } catch (err) {
        trackError(err);
        return [err, null];
    }
};

const registerOutput = async (deviceId, payload) => {
    const path = getRefPath(deviceId, payload.peripheralName);
    try {
        const peripheralsListRef = firebase.database().ref(getRefPath(deviceId, '_peripherals', 'output'));
        peripheralsListRef.once('value', (snapshot) => {
            const peripherals = Object.values(snapshot.val() || {});
            if (!peripherals.includes(payload.peripheralName)) {
                const newPeripheralRef = peripheralsListRef.push();
                newPeripheralRef.set(payload.peripheralName);
            }
        });
        await firebase.database().ref(`${path}/type`).set(payload.peripheralDataType);
        await firebase.database().ref(`${path}/format`).set(payload.peripheralDataFormat);
        await firebase.database().ref(`${path}/peripheralType`).set(ITEM_TYPE.INPUT);
        await firebase.database().ref(`${path}/value`).set(payload.peripheralDataValue);
        await firebase
            .database()
            .ref(`${path}/changelog`)
            .push()
            .set({ value: payload.peripheralDataValue, date: new Date().getTime() });
        await firebase.database().ref(`${path}/supportCalibration`).set(payload.peripheralCalibration);
        if (payload.peripheralCalibration) {
            await firebase.database().ref(`${path}/calibration_min`).set(DEFAULT_CALIBRATION_MIN);
            await firebase.database().ref(`${path}/calibration_max`).set(DEFAULT_CALIBRATION_MAX);
        }
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, false];
    }
};

const update = async (deviceId, payload) => {
    const path = getRefPath(deviceId, payload.peripheralName);
    const changelog = { value: payload.peripheralDataValue, date: new Date().getTime() };
    try {
        await firebase.database().ref(`${path}/value`).set(payload.peripheralDataValue);
        await firebase.database().ref(`${path}/changelog`).push().set(changelog);
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, false];
    }
};

export default {
    listenPeripheralDataOnce,
    listenPeripheralData,
    setDeviceStatus,
    registerOutput,
    registerInput,
    update,
};
