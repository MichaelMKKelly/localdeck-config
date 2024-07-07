// @vitest-environment nuxt

import * as path from "node:path";
import * as fs from "node:fs/promises";

import {describe, expect, test} from 'vitest'
import {createPage, setup} from '@nuxt/test-utils/e2e'
import espHomeYaml from "esphome-config-ts/dist/yaml";

const preImportExample = `
substitutions:
  name: localdeck-9751c4
  friendly_name: LocalBytes LocalDeck 9751c4
packages:
  localbytes.localdeck: github://LocalBytes/localdeck-config/packages/localdeck-codegen/esphome-localdeck.yaml
esphome:
  name: \${name}
  name_add_mac_suffix: false
  friendly_name: \${friendly_name}
api:
  encryption:
    key: "This is encryption"
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
`;

describe('Import Workflow', async () => {
    await setup({});

    test('Parse the original file', async () => {
        const content = espHomeYaml.parse(preImportExample) as any;
        expect(content).toBeDefined();
    })

    test('Import a new file', async () => {
        //Create New File
        console.log("Creating New File");
        const runtimeConfig = useRuntimeConfig();
        const filePath = path.join(runtimeConfig.filesDir, `test-import.yaml`);
        await fs.writeFile(filePath, preImportExample);

        // Load the page
        console.log("Loading Page");
        let page = await createPage("/editor?filename=test-import.yaml");

        // Update the friendly name
        console.log("Updating Friendly Name");
        await page.getByPlaceholder("Project Name").fill("My New LocalDeck");

        // Save the file
        console.log("Saving File");
        await page.getByRole('button', { name: 'Save' }).click();

        await page.waitForTimeout(1000);

        // Check the output file
        console.log("Checking Output File");
        let output = await fs.readFile(filePath, 'utf8');
        console.log("Output file loaded");
        expect(output).toContain("# This file was generated by the LocalBytes LocalDeck Configurator");
        expect(output).toContain("friendly_name: My New LocalDeck");
        expect(output).toContain("!secret wifi_ssid");
        expect(output).toContain("!secret wifi_password");
        expect(output).toContain("This is encryption");
        expect(output).not.toContain("localbytes.localdeck");
    });
})
