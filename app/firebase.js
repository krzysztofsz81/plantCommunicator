import config from 'config';
import * as firebase from 'firebase';

firebase.initializeApp({
    messagingSenderId: config.Firebase.MessagingSenderId,
    measurementId: config.Firebase.MeasurementId,
    storageBucket: config.Firebase.StorageBucket,
    databaseURL: config.Firebase.DatabaseUrl,
    authDomain: config.Firebase.AuthDomain,
    projectId: config.Firebase.ProjectId,
    apiKey: config.Firebase.ApiKey,
    appId: config.Firebase.AppId,
});

export default firebase;
