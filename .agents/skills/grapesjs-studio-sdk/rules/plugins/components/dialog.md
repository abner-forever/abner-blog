---
name: "Dialog"
description: "Provide dialog/modal components with configurable content and interaction options."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/components/dialog"
metadata:
  tags: grapesjs, studio-sdk, plugins, components, dialog
---


# Dialog

warning

This component is a work in progress.

Add a dialog component with additional functionalities.

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

To use the Dialog plugin, you need to import it into your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { dialogComponent } from "@grapesjs/studio-sdk-plugins";
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        dialogComponent.init({
          block: { category: 'Extra', label: 'My Dialog' }
        })
      ]

  }}
/>

```

### Plugin options

| Property   | Type           | Description                                                                                                                                                                         |
| ---------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| licenseKey | string | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```                                   |
| block      | object<!-- --> | Block options for the dialog component. See https\://grapesjs.com/docs/api/block.html#properties for more information.**Example**```js
{
  "category": "Extra",
  "label": "Popup"
}

``` |

### Component properties

| Property                   | Type            | Description                                                                                |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| closeWhenPressingX\*       | boolean | Whether the dialog should close when pressing the X button.                                |
| closeWhenPressingEsc\*     | boolean | Whether the dialog should close when pressing the Escape key.                              |
| openWhenLeavingWindow\*    | boolean | Whether the dialog should open when leaving the window.                                    |
| openWhenScrollingToLevel\* | string  | Whether the dialog should open when scrolling to a specific level.**Example**```js
"500"

``` |
