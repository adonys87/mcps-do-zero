import { describe, it, after, before } from "node:test";
import assert from "node:assert";
import { Client } from "@modelcontextprotocol/sdk/client";
import { createTestClient } from "./helpers.ts";


async function encryptMessage(client: Client, message: string, encriptionKey: string) {
    const result = await client.callTool({
        name: 'encrypt_message',
        arguments: {
            message,
            encriptionKey
        }
    }) as unknown as { structuredContent: { encryptedMessage: string } };
    return result;
}


async function decryptMessage(client: Client, encryptedMessage: string, encriptionKey: string) {
    const result = await client.callTool({
        name: 'decrypt_message',
        arguments: {
            encryptedMessage,
            encriptionKey
        }
    }) as unknown as { structuredContent: { decryptedMessage: string } };
    return result;
}

describe("MCP Server Tests", () => {
    let client: Client;
    let encryptionKey = "my-secret-passphrase";
    before(async () => {
        client = await createTestClient();
    });

    after(async () => {
        await client.close();
    });

    it("should encrypt a message", async () => {
        const message = "Hello, world!";
        const result = await encryptMessage(
            client,
            message,
            encryptionKey
        );

        assert.ok(result.structuredContent?.encryptedMessage.length > 60, 'Encrypted message should not be empty');
    });


    it("should decrypt a message", async () => {
        const message = "Another Hello, world!";
        const encriptionKey = "other-secret-passphrase";
        const { structuredContent: { encryptedMessage } } = await encryptMessage(
            client,
            message,
            encriptionKey
        );

        const result = await decryptMessage(client, encryptedMessage, encriptionKey);
        assert.deepStrictEqual(result.structuredContent?.decryptedMessage, message, 'Decrypted message should match the original');
    });

    it('should list the encryption://info resource', async () => {
        const { resources } = await client.listResources();
        const info = resources.find(r => r.uri === 'encryption://info');
        assert.ok(info, 'encryption://info resource should be listed');
    });

    it('should return the encrypt_message_prompt', async () => {
        const result = await client.getPrompt({
            name: 'encrypt_message_prompt',
            arguments: {
                message: 'Secret message',
                encriptionKey: 'my-secret-passphrase',
            }
        })

        const item = result.messages.at(0)?.content as unknown as { text: string };
        const expectedText = 'Please encrypt the following message using the encrypt_message tool with the provided key:\n\nMessage: Secret message\nKey: my-secret-passphrase';
        assert.deepStrictEqual(
            item.text,
            expectedText,
            'Prompt should equal the expected text'
        );
    }
    )

});