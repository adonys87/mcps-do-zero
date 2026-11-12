import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { encrypt, decrypt } from "./service.ts";

export const mcpServer = new McpServer({
    name: "@joanadonys/joanadonys-mcp",
    version: "1.0.0",
    description: "A simple MCP server for demonstration purposes.",
});


mcpServer.registerTool(
    'encrypt_message',
    {
        description: 'Encrypts a message using a provided key.',
        inputSchema: {
            message: z.string().describe('the message to be encrypted'),
            encriptionKey: z.string().describe('the key used for encryption')
        },
        outputSchema: {
            encryptedMessage: z.string().describe('the encrypted message (format: iv:cyphertext)'),
        }
    }, async ({ message, encriptionKey }) => {
        try {
            const encryptedMessage = encrypt(message, encriptionKey);
            return {
                content: [{ type: 'text', text: encryptedMessage }],
                structuredContent: { encryptedMessage }
            }
        } catch (error) {
            return {
                isError: true,
                content: [{
                    type: 'text',
                    text: `Error encrypting message: ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }

    }
);

mcpServer.registerTool(
    'decrypt_message',
    {
        description: 'Decrypts a message using a provided key for message encryption with encrypt_message.',
        inputSchema: {
            encryptedMessage: z.string().describe('the encrypted message (format: iv:cyphertext)'),
            encriptionKey: z.string().describe('the key used for decryption')
        },
        outputSchema: {
            decryptedMessage: z.string().describe('the decrypted message'),
        }
    }, async ({ encryptedMessage, encriptionKey }) => {
        try {
            const decryptedMessage = decrypt(encryptedMessage, encriptionKey);
            return {
                content: [{ type: 'text', text: decryptedMessage }],
                structuredContent: { decryptedMessage }
            }
        } catch (error) {
            return {
                isError: true,
                content: [{
                    type: 'text',
                    text: `Error decrypting message: ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }
    }
);

mcpServer.registerResource(
    'encryption://info', //nome do recurso
    'encryption://info', //uri do recurso
    {   //descrição do recurso, passando informação a IAs sobre o que é esse recurso.
        description: 'Information about the encryption tools provided by this MCP server. Key requirements and output formats are described here.',
    },
    () => ({
        contents: [
            {
                uri: 'encryption://info',
                mimeType: 'text/plain',
                text: `
Algorithm : AES-256-CBC
Key derivation: scrypt (passphrase + fixed server salt → 32-byte key)
Output format: <16-byte IV in hex>:<ciphertext in hex>  (separated by ":")
Notes:
    - Users pass any passphrase — the server derives a strong 32-byte key automatically using scrypt.
    - A random IV is generated for every encryption — the same message encrypted twice will produce different output.
    - Use the exact same passphrase to decrypt.
    - Keep the full "iv:ciphertext" string to decrypt later.
                `.trim()
            }
        ]
    })
);

mcpServer.registerPrompt(
    'encrypt_message_prompt',
    {
        description: 'Prompt for encrypting a plain-text message using a encrypt_message tool.',
        argsSchema: {
            message: z.string().describe('the message to be encrypted'),
            encriptionKey: z.string().describe('the key used for encryption')
        }
    },
    ({ message, encriptionKey }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Please encrypt the following message using the encrypt_message tool with the provided key:\n\nMessage: ${message}\nKey: ${encriptionKey}`
            }
        }]
    })
)