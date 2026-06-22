---
name: "Table"
description: "Add enhanced table components with richer editing controls."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/components/table"
metadata:
  tags: grapesjs, studio-sdk, plugins, components, table
---


# Table

|               |              |
| ------------- | ------------ |
| Project types | `web`        |
| Plan          | Startup plan |

Add table component with additional functionalities.

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the table plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { tableComponent } from "@grapesjs/studio-sdk-plugins";
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        tableComponent.init({
          block: { category: 'Extra', label: 'My Table' }
        })
      ],
      project: {
        default: {
          pages: [
            {
              name: 'Home',
              component: `
                <h1>Table plugin</h1>
                <table>
                  <tbody>
                    <tr>
                      <td>Cell 0:0</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td></td>
                      <td>Cell 1:1</td>
                    </tr>
                  </tbody>
                </table>
            `},
          ]
        },
      }

  }}
/>

```

### Plugin options

| Property     | Type             | Description                                                                                                                                                                                                                                                                                                                                                                                |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| block        |                  | Block options for the table component. See https\://grapesjs.com/docs/api/block.html#properties for more information.**Example**```js
{
  "category": "Extra",
  "label": "My Table"
}

```                                                                                                                                                                                                      |
| licenseKey   | string<!-- -->   | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```                                                                                                                                                                                                                                          |
| openSettings | function | Customize the layout for table component setting actions, which by default are shown in a popover.**Example**```js
({ editor, layoutProps }) => {
  // open settings in a dialog
  editor.runCommand('studio:layoutToggle', {
    ...layoutProps,
    header: false,
    style: { marginLeft: -20, marginRight: -20 },
    placer: { type: 'dialog', title: layoutProps.header?.label },
  });
}

``` |
