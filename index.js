
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || '';
        const from = msg.key.remoteJid;

        await sock.sendMessage(from, { text: `You said: ${text}` });
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            if((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot();
            }
        } else if(connection === 'open') {
            console.log('Bot connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
