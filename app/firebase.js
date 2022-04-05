import config from 'config';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const app = initializeApp({
    messagingSenderId: config.Firebase.MessagingSenderId,
    measurementId: config.Firebase.MeasurementId,
    storageBucket: config.Firebase.StorageBucket,
    databaseURL: config.Firebase.DatabaseUrl,
    authDomain: config.Firebase.AuthDomain,
    projectId: config.Firebase.ProjectId,
    apiKey: config.Firebase.ApiKey,
    appId: config.Firebase.AppId,
});

const auth = getAuth();
signInWithEmailAndPassword(auth, config.FirebaseAuth.Email, config.FirebaseAuth.Password);

export default { app, auth };
