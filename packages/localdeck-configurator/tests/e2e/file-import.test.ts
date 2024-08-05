import * as path from 'node:path';
import * as fs from 'node:fs/promises';

import { describe, expect, test } from 'vitest';
import { createPage } from '@nuxt/test-utils/e2e';
import espHomeYaml from 'esphome-config-ts/dist/yaml';
import { setupNuxt } from '~~/tests/utils';

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

const FILENAME = 'test-import.yaml';

describe('Import Workflow', async () => {
  await setupNuxt();

  test('Parse the original file', async () => {
    const content = espHomeYaml.parse(preImportExample) as object;
    expect(content).toBeDefined();
  });

  test('Import a new file', async () => {
    // Create New File
    console.log('Creating New File');
    const runtimeConfig = useRuntimeConfig();
    const filePath = path.join(runtimeConfig.filesDir, FILENAME);
    await fs.writeFile(filePath, preImportExample);

    // Load the page
    console.log('Loading Page');
    const page = (await createPage('/'));

    const responsePromise = page.waitForResponse(r => r.url().includes('/api/editor'));

    console.log('Clicking');
    await page.getByText(FILENAME).click();

    const response = await responsePromise.then(r => r.json());
    expect(response.configStr).toBeNull();
    expect(response.config).toMatchObject({ title: 'LocalBytes LocalDeck 9751c4', buttons: {} });

    // Update the friendly name
    console.log('Updating Friendly Name');
    await page.getByPlaceholder('Project Name').fill('My New LocalDeck');

    // Save the file
    console.log('Saving File');
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByText('Your changes have been saved').waitFor('visible');

    // Check the output file
    console.log('Checking Output File');
    const output = await fs.readFile(filePath, 'utf8');
    console.log('Output file loaded');
    expect(output).toContain('# This file was generated by the LocalBytes LocalDeck Configurator');
    expect(output).toContain('friendly_name: My New LocalDeck');
    expect(output).toContain('!secret wifi_ssid');
    expect(output).toContain('!secret wifi_password');
    expect(output).toContain('This is encryption');
    expect(output).not.toContain('localbytes.localdeck');
  });
});
