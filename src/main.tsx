import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { isFirestoreOnline } from './lib/firebase.ts';

async function testConnection() {
  // Wait a bit for the network to stabilize
  await new Promise(resolve => setTimeout(resolve, 1000));
  const isOnline = await isFirestoreOnline();
  if (isOnline) {
    console.log("Firebase connection established successfully.");
  } else {
    console.error("Please check your Firebase configuration or network connection.");
  }
}
testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
