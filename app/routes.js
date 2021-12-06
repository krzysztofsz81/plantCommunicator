import express from 'express';
import firebase from './firebase';
import { trackError } from './errorReporting';
import { ITEM_TYPE } from './api';

const router = express.Router();

router.get('/devices', async (req, res) => {
    let snapshot;
    try {
        snapshot = await firebase.database().ref('/devices').once('value');
    } catch (err) {
        trackError(err);
        res.send(404);
        return;
    }

    const snapshotValue = snapshot.val();
    if (!snapshotValue) {
        res.send(404);
        return;
    }

    res.json(Object.keys(snapshotValue));
});

router.get('/device/:deviceName', async (req, res) => {
    const { deviceName } = req.params;
    const path = `/devices/${deviceName}`;
    let snapshot;

    try {
        snapshot = await firebase.database().ref(path).once('value');
    } catch (err) {
        trackError(err);
        res.send(404);
        return;
    }

    const snapshotValue = snapshot.val();
    if (!snapshotValue) {
        res.send(404);
        return;
    }

    res.json(snapshotValue);
});

router.get('/sensor/:deviceName/:peripheralName', async (req, res) => {
    const { deviceName, peripheralName } = req.params;
    const path = `/devices/${deviceName}/${peripheralName}`;
    let snapshot;

    try {
        snapshot = await firebase.database().ref(path).once('value');
    } catch (err) {
        trackError(err);
        res.send(404);
        return;
    }

    const snapshotValue = snapshot.val();
    if (!snapshotValue) {
        res.send(404);
        return;
    }

    res.json(snapshotValue);
});

router.post('/sensor/:deviceName/:peripheralName/value', async (req, res) => {
    const { deviceName, peripheralName } = req.params;
    const { value } = req.body;
    const path = `/devices/${deviceName}/${peripheralName}`;
    let snapshot;

    try {
        snapshot = await firebase.database().ref(path).once('value');
    } catch (err) {
        trackError(err);
        res.send(404);
        return;
    }

    const snapshotValue = snapshot.val();
    if (!snapshotValue) {
        res.send(404);
        return;
    }

    if (!snapshotValue.type !== ITEM_TYPE.OUTPUT) {
        res.send(404);
        return;
    }

    try {
        await firebase.database().ref(`${path}/value`).set(value);
    } catch (err) {
        trackError(err);
        res.send(404);
        return;
    }

    res.send(value);
});

export default router;
