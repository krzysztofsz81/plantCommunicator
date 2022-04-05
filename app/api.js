import { getDatabase, ref, onValue, push, get, set, query, limitToLast } from 'firebase/database';
import timestring from 'timestring';
import { trackError } from './errorReporting';

const DEVICES_PREFIX = 'devices';

export const PERIPHERAL_TYPE = {
    OUTPUT: 'OUTPUT',
    INPUT: 'INPUT',
};
export const DEVICE_STATUS = {
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
};

const getRefPath = (...args) => [DEVICES_PREFIX, ...args].join('/');

const updateChangelog = async (db, { deviceId, peripheral }) => {
    const changelogRef = ref(db, getRefPath(deviceId, 'changelogs', peripheral.name));

    const lastItemSnapshot = await get(query(changelogRef, limitToLast(1)));

    let lastItem;
    lastItemSnapshot.forEach((childSnapshot) => {
        lastItem = childSnapshot.val();
    });

    const addChangelog = async () => {
        const newValueLogRef = push(changelogRef);
        await set(newValueLogRef, { value: peripheral.value, date: new Date().getTime() });
    };

    if (!lastItem) {
        await addChangelog();
        return;
    }

    const difference = new Date().getTime() - new Date(lastItem.date).getTime();
    // if (difference >= timestring('30s', 'ms')) await addChangelog();
    await addChangelog();
};

const setDeviceStatus = async (deviceId, status) => {
    try {
        const db = getDatabase();
        const devicesListRef = ref(db, getRefPath('_list'));
        const snapshot = await get(devicesListRef);
        const devices = Object.values(snapshot.val() || []);
        if (!devices.includes(deviceId)) {
            const newDeviceRef = push(devicesListRef);
            await set(newDeviceRef, deviceId);
        }

        await set(ref(db, getRefPath(deviceId, 'status')), status);
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, null];
    }
};

const registerInput = async (deviceId, peripheral) => {
    try {
        const db = getDatabase();
        const peripheralsListRef = ref(db, getRefPath(deviceId, '_list'));
        const peripheralsSnapshot = await get(peripheralsListRef);
        const peripherals = Object.values(peripheralsSnapshot.val() || {});
        if (!peripherals.includes(peripheral.name)) {
            const newPeripheralRef = push(peripheralsListRef);
            await set(newPeripheralRef, peripheral.name);
        }

        await set(ref(db, getRefPath(deviceId, peripheral.name, 'info')), {
            ...peripheral.info,
            type: PERIPHERAL_TYPE.INPUT,
        });

        const valueSnapshotPath = await get(ref(db, getRefPath(deviceId, peripheral.name, 'value')));
        if (valueSnapshotPath.val() === null && peripheral.value !== undefined) {
            await set(ref(db, getRefPath(deviceId, peripheral.name, 'value')), peripheral.value);
        }
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, null];
    }
};

const listenPeripheralData = async (deviceId, name, callback) => {
    const path = getRefPath(deviceId, name, 'value');
    try {
        const db = getDatabase();
        onValue(ref(db, path), callback);
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, null];
    }
};

const registerOutput = async (deviceId, peripheral) => {
    try {
        const db = getDatabase();
        const peripheralsListRef = ref(db, getRefPath(deviceId, '_list'));
        const peripheralsSnapshot = await get(peripheralsListRef);
        const peripherals = Object.values(peripheralsSnapshot.val() || []);
        console.log({ peripherals, peripheral });
        if (!peripherals.includes(peripheral.name)) {
            const newPeripheralRef = push(peripheralsListRef);
            await set(newPeripheralRef, peripheral.name);
        }

        await set(ref(db, getRefPath(deviceId, peripheral.name, 'info')), {
            ...peripheral.info,
            type: PERIPHERAL_TYPE.OUTPUT,
        });

        await set(ref(db, getRefPath(deviceId, peripheral.name, 'value')), peripheral.value);
        await updateChangelog(db, { deviceId, peripheral });
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, false];
    }
};

const update = async (deviceId, peripheral) => {
    try {
        const db = getDatabase();
        await set(ref(db, getRefPath(deviceId, peripheral.name, 'value')), peripheral.value);
        await updateChangelog(db, { deviceId, peripheral });
        return [null, true];
    } catch (err) {
        trackError(err);
        return [err, false];
    }
};

export default {
    listenPeripheralData,
    setDeviceStatus,
    registerOutput,
    registerInput,
    update,
};
