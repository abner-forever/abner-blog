---
name: "Flex Columns"
description: "Add flex-based layout blocks to speed up responsive row/column composition."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/components/flex"
metadata:
  tags: grapesjs, studio-sdk, plugins, components, flex
---


# Flex Columns

|               |              |
| ------------- | ------------ |
| Project types | `web``email` |
| Plan          | Startup plan |

This plugin provides a set of flexible layout blocks based on CSS Flexbox, making it easy to structure content. It allows users to create responsive row/column layouts with intuitive controls to dynamically resize columns and adjust gaps directly in the canvas.

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { flexComponent } from "@grapesjs/studio-sdk-plugins";
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        flexComponent?.init({
          // ...options
        })
      ],
      project: {
        default: {
          pages: [
            {
              name: 'Home',
              component: `
              <div style="padding: 2rem">
                <h1>Horizontal</h1>
                <div data-gjs-type="flex-row">
                  <div data-gjs-type="flex-column" style="flex-basis: 50%"></div>
                  <div data-gjs-type="flex-column" style="flex-basis: 50%"></div>
                </div>
                <div data-gjs-type="flex-row" style="gap: 2%">
                  <div data-gjs-type="flex-column" style="flex-basis: 32%"></div>
                  <div data-gjs-type="flex-column" style="flex-basis: 32%"></div>
                  <div data-gjs-type="flex-column" style="flex-basis: 32%"></div>
                </div>
                <div data-gjs-type="flex-row">
                  <div data-gjs-type="flex-column" style="flex-basis: 20%"></div>
                  <div data-gjs-type="flex-column" style="flex-basis: 20%"></div>
                  <div data-gjs-type="flex-column" style="flex-basis: 20%"></div>
                  <div data-gjs-type="flex-column" style="flex-basis: 40%"></div>
                </div>

                <h1>Snapping</h1>
                <div data-gjs-type="flex-row" data-gjs-snap="true">
                  <div data-gjs-type="flex-column" style="flex-basis: 8.33%"></div>
                  <div data-gjs-type="flex-column" style="flex-basis: 91.66%"></div>
                </div>
                <div data-gjs-type="flex-row" data-gjs-snap="true" data-gjs-snap-divisions="4">
                  <div data-gjs-type="flex-column" style="flex-basis: 25%"></div>
                  <div data-gjs-type="flex-column" style="flex-basis: 75%"></div>
                </div>

                <h1>Vertical</h1>
                <div data-gjs-type="flex-row" style="gap: 2%; height: 300px">
                  <div data-gjs-type="flex-column" style="flex-basis: 32%; padding: 1rem">
                    <div data-gjs-type="flex-row" style="flex-direction: column; height: 100%">
                      <div data-gjs-type="flex-column" style="flex-basis: 50%"></div>
                      <div data-gjs-type="flex-column" style="flex-basis: 50%"></div>
                    </div>
                  </div>
                  <div data-gjs-type="flex-column" style="flex-basis: 32%; padding: 1rem">
                    <div data-gjs-type="flex-row" style="gap: 2%; flex-direction: column; height: 100%">
                      <div data-gjs-type="flex-column" style="flex-basis: 32%"></div>
                      <div data-gjs-type="flex-column" style="flex-basis: 32%"></div>
                      <div data-gjs-type="flex-column" style="flex-basis: 32%"></div>
                    </div>
                  </div>
                  <div data-gjs-type="flex-column" style="flex-basis: 32%; padding: 1rem">
                    <div data-gjs-type="flex-row" data-gjs-snap="true" data-gjs-snap-divisions="5" style="flex-direction: column; height: 100%">
                      <div data-gjs-type="flex-column" style="flex-basis: 20%"></div>
                      <div data-gjs-type="flex-column" style="flex-basis: 80%"></div>
                    </div>
                  </div>
                </div>
              <div>

              <style>
                body { font-family: system-ui;}
                h1 { text-align: center; }
              </style>
              `,
            }
          ]
        }
      }

  }}
/>

```

### Email projects

The plugin also supports column snapping and resizing for the `email` project type.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { flexComponent } from "@grapesjs/studio-sdk-plugins";
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        flexComponent?.init({
          // Indicate the email project type
          projectType: 'email'
        })
      ],
      project: {
        type: 'email',
        default: {
          pages: [
            {
              component: `
                <mjml>
                  <mj-body>
                    <mj-section>
                      <mj-column>
                        <mj-text align="center" font-weight="700" font-size="25px">Resizable columns</mj-text>
                      </mj-column>
                    </mj-section>
                    <mj-section>
                      <mj-column width="50%"></mj-column>
                      <mj-column width="50%"></mj-column>
                    </mj-section>
                    <mj-section>
                      <mj-column width="25%"></mj-column>
                      <mj-column width="75%"></mj-column>
                    </mj-section>
                    <mj-section>
                      <mj-column>
                        <mj-text align="center" font-weight="700" font-size="25px">Snapping</mj-text>
                      </mj-column>
                    </mj-section>
                    <mj-section data-gjs-snap="true" data-gjs-snap-divisions="4">
                      <mj-column width="75%"></mj-column>
                      <mj-column width="25%"></mj-column>
                    </mj-section>
                  </mj-body>
                </mjml>
              `,
            }
          ]
        }
      }

  }}
/>

```

### Plugin options

| Property          | Type                                              | Description                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| licenseKey        | string                                    | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```                                                      |
| blocks            | [Block](https://grapesjs.com/docs/api/block.html) | Filter default layout blocks. Pass `false` to avoid adding layout blocks.**Example**```js
({ blocks }) => {
 // Remove the 1 Column block
 return blocks.filter(block => block.label !== '1 Column');
}

``` |
| typeRow           | string                                    | Default component type for row.**Default**```js
flex-row

```                                                                                                                                             |
| typeColumn        | string<!-- -->                                    | Default component type for column.**Default**```js
flex-column

```                                                                                                                                       |
| extendTypeRow     | boolean                                   | Indicate if the existant `typeRow` component has to be extended.**Default**```js
false

```                                                                                                               |
| extendTypeColumn  | boolean<!-- -->                                   | Indicate if the existant `typeColumn` component has to be extended.**Default**```js
false

```                                                                                                            |
| minItemPercent    | number                                    | Minimum item percent size in percentage.**Default**```js
5

```                                                                                                                                           |
| snapEnabled       | boolean<!-- -->                                   | Enable snapping by default.**Default**```js
false

```                                                                                                                                                    |
| snapDivisions     | number                                    | Default divisions for snapping.**Default**```js
12

```                                                                                                                                                   |
| disableGapHandler | boolean<!-- -->                                   | Disable gap handler.**Default**```js
false

```                                                                                                                                                           |
| gapHandleSize     | number                                    | Gap size in px.**Default**```js
3

```                                                                                                                                                                    |
| projectType       | string<!-- -->                                    | If you're using `email` project type in Studio SDK, you can set this option to `email` to active column resizing.**Example**```js
"email"

```**Default**```js
web

```                                      |
| getSize           | function<!-- -->                                  | Provide a custom handler for getting the column size.**Example**```js
({ componentColumn }) => {
 return parseInt(componentColumn.getStyle()['flex-basis'], 10);
}

```                                     |
| getGap            | function                                  | Provide a custom handler for getting the gap size.**Example**```js
({ component }) => {
 return parseInt(component.getStyle()['gap'], 10);
}

```                                                           |
| getParentSize     | function<!-- -->                                  | Provide a custom handler for getting the parent size.**Example**```js
({ component, isVertical }) => {
 return component.getEl().clientWidth || 0;
}

```                                                   |
| isParentVertical  | function                                  | Provide a custom handler for checking if the parent layout is in vertical layout.**Example**```js
({ component }) => {
 return true;
}

```                                                                 |
| setSize           | function<!-- -->                                  | Provide a custom handler for setting the column size.**Example**```js
({ component, sizeValue, partial }) => {
 component.addStyle({ 'flex-basis': sizeValue }, { partial });
}

```                        |
| setGap            | function                                  | Provide a custom handler for setting the gap size.**Example**```js
({ component, gapValue, partial }) => {
 component.addStyle({ gap: gapValue }, { partial });
}

```                                      |
