---
name: "TinyMCE"
description: "Replace the default rich-text editor with a TinyMCE integration."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/rte/tinymce"
metadata:
  tags: grapesjs, studio-sdk, plugins, rte, tinymce
---


# TinyMCE

|               |              |
| ------------- | ------------ |
| Project types | `web``email` |
| Plan          | Startup plan |

Replace the default RTE with [TinyMCE 6](https://www.tiny.cloud/docs/tinymce/6/) (latest MIT).

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { rteTinyMce } from '@grapesjs/studio-sdk-plugins';
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        rteTinyMce.init({
          enableOnClick: true,
          // Custom TinyMCE configuration
          loadConfig: ({ component, config }) => {
            const demoRte = component.get('demorte');
            if (demoRte === 'fixed') {
              return {
                toolbar:
                  'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | link image media',
                fixed_toolbar_container_target: document.querySelector('.rteContainer')
              };
            } else if (demoRte === 'quickbar') {
              return {
                plugins: `${config.plugins} quickbars`,
                toolbar: false,
                quickbars_selection_toolbar: 'bold italic underline strikethrough | quicklink image'
              };
            }
            return {};
          }
        })
      ],
      layout: {
        default: {
          type: 'row',
          style: { height: '100%' },
          children: [
            { type: 'sidebarLeft' },
            {
              type: 'column',
              style: { flexGrow: 1 },
              children: [
                { type: 'sidebarTop' },
                { type: 'canvas' },
                // Empty container for the fixed RTE toolbar
                { type: 'row', className: 'rteContainer', style: { justifyContent: 'center' } }
              ]
            },
            { type: 'sidebarRight' }
          ]
        },
      },
      project: {
        default: {
          pages: [
            {
              name: 'Home',
              component: `
              <div data-gjs-type="text">
                <h1>Default configuration</h1>
                Text content start
                <div>
                  Block content with <em>emphasis</em>, <b>bold text</b>, <a href="#some-link" target="_blank">link</a>.
                </div>
                <ul>
                  <li>List item 1</li>
                  <li>List item 2</li>
                </ul>
                <ol>
                  <li>Ordered list item 1</li>
                  <li>Ordered list item 1</li>
                </ol>
                Text content end
              </div>

              <div data-gjs-type="text" data-gjs-demorte="fixed">
                <h1>Fixed position</h1>
                Text content start
                <div>
                  Block content with <em>emphasis</em>, <b>bold text</b>, <a href="#some-link" target="_blank">link</a>.
                </div>
                <ul>
                  <li>List item 1</li>
                  <li>List item 2</li>
                </ul>
                <ol>
                  <li>Ordered list item 1</li>
                  <li>Ordered list item 1</li>
                </ol>
                Text content end
              </div>

              <div data-gjs-type="text" data-gjs-demorte="quickbar">
                <h1>Quickbar</h1>
                Text content start
                <div>
                  Block content with <em>emphasis</em>, <b>bold text</b>, <a href="#some-link" target="_blank">link</a>.
                </div>
                <ul>
                  <li>List item 1</li>
                  <li>List item 2</li>
                </ul>
                <ol>
                  <li>Ordered list item 1</li>
                  <li>Ordered list item 1</li>
                </ol>
                Text content end
              </div>
              `
            },
          ]
        },
      }

  }}
/>

```

### Plugin options

| Property        | Type             | Description                                                                                                                                                                       |
| --------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| licenseKey      | string   | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```                                 |
| cdnScript       | string<!-- -->   | CDN scripts to load dynamically in case the library is not available.**Default**```js
https://cdn.jsdelivr.net/npm/tinymce@6.8.5/tinymce.min.js

```                                 |
| enableOnClick   | boolean  | Enable RTE on click of the text component, instead of the default double-click.**Default**```js
false

```                                                                           |
| skipCustomTheme | boolean<!-- -->  | Skip adding custom CSS styles for the toolbar based on the Studio theme.**Default**```js
false

```                                                                                  |
| loadConfig      | function | Pass your custom configuration to the TinyMCE editor.**Example**```js
({ config, editor, component }) => {
 return {
  toolbar: 'bold italic underline strikethrough',
  // ...
 }
}

``` |
