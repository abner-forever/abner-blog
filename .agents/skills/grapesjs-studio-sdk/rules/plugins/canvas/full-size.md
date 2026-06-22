---
name: "Full Size"
description: "Enable full-size canvas mode for editing large layouts beyond viewport constraints."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/canvas/full-size"
metadata:
  tags: grapesjs, studio-sdk, plugins, canvas, full-size
---


# Full Size

|               |              |
| ------------- | ------------ |
| Project types | `web``email` |
| Plan          | Startup plan |

Enable full-size device in the editor canvas, independent of your screen size. Perfect for designing large templates seamlessly.

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasFullSize } from '@grapesjs/studio-sdk-plugins';
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        canvasFullSize
      ],
  }}
/>

```

### Plugin options

| Property          | Type            | Description                                                                                                                                       |
| ----------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| licenseKey        | string  | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

``` |
| deviceMaxWidth    | number<!-- -->  | Default max width for the devices.**Default**```js
1200

```                                                                                         |
| deviceMinHeigth   | number  | Default min height for the devices.**Default**```js
500

```                                                                                         |
| deviceFixedHeight | boolean<!-- --> | This option disables scrollable canvas area and keeps the iframe's height fixed.**Default**```js
false

```                                          |
| canvasOffsetY     | number  | Offset for the canvas on the Y axis (margin between the canvas and content frame).**Default**```js
30

```                                           |
| canvasOffsetX     | number<!-- -->  | Offset for the canvas on the X axis (margin between the canvas and content frame).**Default**```js
50

```                                           |
| canvasTransition  | number  | Transition time for the canvas when the screen size changes (in seconds).**Default**```js
0.3

```                                                   |
| frameBorderRadius | number<!-- -->  | Border radius for the content frame (in px).**Default**```js
5

```                                                                                  |
| frameTransition   | number  | Transition time for the content frame when the device changes (in seconds).**Default**```js
0.3

```                                                 |
