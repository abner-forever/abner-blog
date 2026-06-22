---
name: "Layout Components"
description: "Compose editor UI with Layout Components and their property options."
source_url: "https://app.grapesjs.com/docs-sdk/configuration/layout/components"
metadata:
  tags: grapesjs, studio-sdk, configuration, layout, components
---


# Layout Components

Below is a list of layout components available to help you compose your editor interface.

## Row

A component that arranges its child components in a horizontal row layout.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'column',
        style: { height: '100%' },
        children: [
          {
            type: 'row',
            className: 'custom-classname-row',
            style: { color: 'white', padding: 3, height: 30, gap: 10 },
            children: [
              { type: 'text', style: { backgroundColor: 'green' }, content: 'Text 1' },
              { type: 'text', style: { backgroundColor: 'green' }, content: 'Text 2' },
              'Text 3'
            ]
          },
          { type: 'canvas' },
          { type: 'row', children: 'Footer text' }
        ]
      },
    }
  }}
/>

```

You can easily customize the component, as with all layout components, by applying `className` and `style` properties.

#### Row properties

Show properties

| Property       | Type                                   | Description                                                                                                                           |
| -------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| type\*         | row                            | Type of the layout component.                                                                                                         |
| alignItems     | string                         | The alignment of inner components along the cross axis.**Example**```js
"start" | "end" | "center" | "baseline" | "stretch"

```         |
| as             | string<!-- -->                         | The HTML tag to use for the layout component.**Example**```js
"div"

```                                                                 |
| children       | Layout component               | The children layout components.**Example**```js
[
  {
    "type": "text",
    "content": "Hello, World!"
  }
]

```                           |
| className      | string<!-- -->                         | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                       |
| full           | boolean                        | If true, the component will take up the full available space.**Default**```js
false

```                                                 |
| gap            | number<!-- -->                         | The gap between inner components.**Example**```js
10

```                                                                                |
| grow           | boolean                        | If true, the component will grow to fill available space.**Default**```js
false

```                                                     |
| height         | string<!-- -->, <!-- -->number<!-- --> | The height of the component.**Example**```js
100

```                                                                                    |
| htmlAttrs      | object                         | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```                                          |
| id             | string<!-- -->                         | The unique identifier for the component.**Example**```js
"component-123"

```                                                            |
| justifyContent | string                         | The alignment of inner components along the main axis.**Example**```js
"start" | "end" | "center" | "between" | "around" | "evenly"

``` |
| style          | object<!-- -->                         | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                        |
| width          | string, number | The width of the component.**Example**```js
100

```                                                                                     |

## Column

Similar to the [`row`](#row), the column component arranges its children in a vertical layout.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: '200px' },
            children: ['Text 1', 'Text 2']
          },
          { type: 'canvas' },
          {
            type: 'column',
            style: { width: '200px' },
            children: 'Text 1'
          }
        ]
      },
    }
  }}
/>

```

#### Column properties

Show properties

| Property       | Type                                   | Description                                                                                                                           |
| -------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| type\*         | column<!-- -->                         | Type of the layout component.                                                                                                         |
| alignItems     | string<!-- -->                         | The alignment of inner components along the cross axis.**Example**```js
"start" | "end" | "center" | "baseline" | "stretch"

```         |
| as             | string                         | The HTML tag to use for the layout component.**Example**```js
"div"

```                                                                 |
| children       | Layout component<!-- -->               | The children layout components.**Example**```js
[
  {
    "type": "text",
    "content": "Hello, World!"
  }
]

```                           |
| className      | string                         | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                       |
| full           | boolean<!-- -->                        | If true, the component will take up the full available space.**Default**```js
false

```                                                 |
| gap            | number                         | The gap between inner components.**Example**```js
10

```                                                                                |
| grow           | boolean<!-- -->                        | If true, the component will grow to fill available space.**Default**```js
false

```                                                     |
| height         | string, number | The height of the component.**Example**```js
100

```                                                                                    |
| htmlAttrs      | object<!-- -->                         | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```                                          |
| id             | string                         | The unique identifier for the component.**Example**```js
"component-123"

```                                                            |
| justifyContent | string<!-- -->                         | The alignment of inner components along the main axis.**Example**```js
"start" | "end" | "center" | "between" | "around" | "evenly"

``` |
| style          | object                         | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                        |
| width          | string<!-- -->, <!-- -->number<!-- --> | The width of the component.**Example**```js
100

```                                                                                     |

## Text

A basic text element that can be added to components accepting children. Text can be included either directly as a string or as an object `{ type: 'text', content: '...' }`. For usage examples, see the configurations above.

#### Text properties

Show properties

| Property  | Type                     | Description                                                                                                 |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| type\*    | text             | Type of the layout component.                                                                               |
| content\* | string           | Content of the text.**Example**```js
"Hello, World!"

```                                                      |
| as        | string<!-- -->           | The HTML tag to use for the layout component.**Example**```js
"div"

```                                       |
| children  | Layout component | The children layout components.**Example**```js
[
  {
    "type": "text",
    "content": "Hello, World!"
  }
]

``` |
| className | string<!-- -->           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                             |
| htmlAttrs | object           | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```                |
| id        | string<!-- -->           | The unique identifier for the component.**Example**```js
"component-123"

```                                  |
| style     | object           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```              |

## Tabs

A component that organizes content into a tabbed layout, enabling users to switch between different sections.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Add dynamic tab by selecting the heading component</h1><div>Some content</div>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          { type: 'canvas' },
          {
            type: 'column',
            style: { width: 300 },
            children: {
              type: 'tabs',
              value: 'tab2', // default selected tab
              tabs: [ // tab id and label are required
                { id: 'tab1', label: 'Tab 1', children: ['Content Tab 1'] },
                { id: 'tab2', label: 'Tab 2', children: 'Content Tab 2' }
              ],
              editorEvents: { // Update tabs state based on editor events
                'component:selected': ({ editor, state, setState }) => {
                  const customTabId = 'tabHeading';
                  const initialTabs = state.tabs?.filter(tab => tab.id !== customTabId) || [];

                  if (editor.getSelected()?.get('type') === 'heading') {
                    setState({
                      value: customTabId,
                      tabs: [...initialTabs, { id: 'tabHeading', label: 'Heading', children: ['Selected heading'] }]
                    });
                  } else {
                    setState({ tabs: initialTabs });
                  }
                }
              }
            }
          }
        ]
      },

    }
  }}
/>

```

Each tab within the `tabs` property must include an `id` and `label` property. Additionally, the `value` property can be set to specify the default selected tab.

#### Tabs properties

Show properties

| Property     | Type             | Description                                                                                                                                                                                       |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*       | tabs<!-- -->     | Type of the layout component.                                                                                                                                                                     |
| tabs\*       | array<!-- -->    | Tabs configuration.**Example**```js
[
  {
    "id": "tab1",
    "label": "Tab 1",
    "children": [
      "Content Tab 1"
    ]
  }
]

```                                                                   |
| className    | string   | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                   |
| editorEvents | object<!-- -->   | Update layout component state based on editor events.**Example**```js
{ 'component:selected': ({ setState, editor }) => setState({ className: 'custom-cls-' + editor.getSelected().getId() }) }

``` |
| id           | string   | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                        |
| onChange     | function<!-- --> | The function to call when the field value changes.**Example**```js
({ value, setState }) => setState({ value });

```                                                                                |
| style        | object   | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                    |
| value        | string<!-- -->   | Tab id value to select on initial render.**Example**```js
"tab1"

```                                                                                                                                |
| variant      | string   | Variant of the tabs.**Example**```js
"pills"

```                                                                                                                                                    |

## Button

A button component that can be used to trigger actions.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: 100, justifyContent: 'center', alignItems: 'center', gap: 5 },
            children: [
              {
                type: 'button',
                label: 'Button',
                variant: 'outline',
                onClick: () => alert('Button clicked')
              },
              {
                type: 'button',
                label: 'Button',
                icon: 'close',
                size: 's',
                tooltip: 'Button tooltip',
                style: { padding: 5, backgroundColor: 'red', color: 'white' },
                onClick: ({ editor }) => alert('Num of pages: ' + editor.Pages.getAll().length)
              },
              {
                type: 'button',
                icon: '<svg viewBox="0 0 24 24"><path d="M12 2C11.5 2 11 2.19 10.59 2.59L2.59 10.59C1.8 11.37 1.8 12.63 2.59 13.41L10.59 21.41C11.37 22.2 12.63 22.2 13.41 21.41L21.41 13.41C22.2 12.63 22.2 11.37 21.41 10.59L13.41 2.59C13 2.19 12.5 2 12 2M11 7H13V13H11V7M11 15H13V17H11V15Z" style="fill: currentcolor;"></path></svg>',
                variant: 'primary',
                onClick: () => alert('Icon only button')
              },
              {
                type: 'button',
                icon: 'check',
                active: true,
                onClick: ({ state, setState }) => {
                  const newActive = !state.active;
                  alert('Is to activate?: ' + newActive);
                  setState({ active: newActive });
                }
              }
            ]
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

The component accepts a `label` property for the button text, an `icon` that can be an SVG string or a [default icon name](../themes.md#default-icons) and additional properties to customize the button layout (eg. `variant`, `size`).

Inside the `onClick` property, you have access to the [GrapesJS `editor` instance](https://grapesjs.com/docs/api/editor.html), as well as the `state` and `setState`, which allow you to interact with the editor or modify the current button's state.

In the [Layout Commands](overview.md#layout-commands) section, you'll find more examples of button usage for managing editor layouts.

#### Button properties

Show properties

| Property     | Type                     | Description                                                                                                                    |
| ------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| type\*       | button<!-- -->           | Type of the layout component.                                                                                                  |
| active       | boolean<!-- -->          | Indicates if the button is active.**Default**```js
false

```                                                                     |
| as           | string           | The HTML tag to use for the layout component.**Example**```js
"div"

```                                                          |
| buttonType   | string<!-- -->           | HTML button type attribute.**Example**```js
"button" | "submit" | "reset"

```                                                    |
| children     | Layout component | The children layout components.**Example**```js
[
  {
    "type": "text",
    "content": "Hello, World!"
  }
]

```                    |
| className    | string<!-- -->           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                |
| classNameBtn | string           | Class name for the inner button element.**Example**```js
"btn-class"

```                                                         |
| disabled     | boolean<!-- -->          | Indicates whether the component is disabled.**Default**```js
false

```                                                           |
| editorEvents | object           | Events to be handled by the editor.**Example**```js
{ 'component:add': ({ editor }) => { console.log('Component added'); } }

``` |
| icon         | string<!-- -->           | Icon to be displayed in the button.**Example**```js
"close"

```                                                                  |
| id           | string           | The unique identifier for the component.**Example**```js
"component-123"

```                                                     |
| label        | string<!-- -->           | Label for the button, can be a ReactNode or a function returning a ReactNode.**Example**```js
"Button"

```                       |
| onClick      | function         | Click event handler for the button.**Example**```js
({ event }) => { alert('Button clicked!'); }

```                             |
| size         | string<!-- -->           | Size of the button.**Example**```js
"x2s" | "xs" | "s" | "m" | "lg"

```                                                          |
| style        | object           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                 |
| tooltip      | string<!-- -->           | Tooltip text for the button.**Example**```js
"Click to submit"

```                                                               |
| variant      | string           | Variant of the button style.**Example**```js
"primary" | "outline" | "shallow"

```                                               |

## ButtonMenu

A button component with a dropdown menu, useful for creating toolbar actions with options or custom popover content.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: 200, justifyContent: 'center', alignItems: 'center', gap: 10 },
            children: [
              // ButtonMenu with options - label auto-generated from selected option
              {
                type: 'buttonMenu',
                size: 's',
                value: 'left',
                options: [
                  { id: 'left', icon: '<svg viewBox="0 0 24 24"><path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z" /></svg>' },
                  { id: 'center', icon: '<svg viewBox="0 0 24 24"><path d="M3,3H21V5H3V3M7,7H17V9H7V7M3,11H21V13H3V11M7,15H17V17H7V15M3,19H21V21H3V19Z" /></svg>' },
                  { id: 'right', icon: '<svg viewBox="0 0 24 24"><path d="M3,3H21V5H3V3M9,7H21V9H9V7M3,11H21V13H3V11M9,15H21V17H9V15M3,19H21V21H3V19Z" /></svg>' }
                ],
                onOptionSelect: ({ option, setState }) => {
                  setState({ value: option.id });
                  alert('Selected: ' + option.id);
                },
                onClick: ({ state }) => alert('Current value: ' + state.value)
              },
              // ButtonMenu with options using labels
              {
                type: 'buttonMenu',
                size: 's',
                value: 'h1',
                options: [
                  { id: 'h1', label: 'Heading 1' },
                  { id: 'h2', label: 'Heading 2' },
                  { id: 'h3', label: 'Heading 3' }
                ],
                onOptionSelect: ({ option, setState }) => {
                  setState({ value: option.id });
                }
              },
              // ButtonMenu with custom label function
              {
                type: 'buttonMenu',
                size: 's',
                value: '#ff0000',
                label: ({ state }) => ({
                  type: 'column',
                  style: { alignItems: 'center' },
                  children: [
                    { type: 'icon', icon: '<svg viewBox="0 0 24 24"><path d="M9.62,12L12,5.67L14.37,12M11,3L5.5,17H7.75L8.87,14H15.12L16.25,17H18.5L13,3H11Z" /></svg>', size: 16 },
                    { type: 'row', style: { width: 16, height: 2, backgroundColor: state.value || 'currentColor', borderRadius: 1 } }
                  ]
                }),
                children: ({ state, setState }) => ({
                  type: 'colorPicker',
                  value: state.value || '',
                  onChange: ({ value, setState: setStateColorPicker }) => {
                    setState({ value });
                    setStateColorPicker({ value });
                  }
                }),
                onClick: ({ state }) => alert('Apply color: ' + state.value)
              }
            ]
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

The `buttonMenu` component provides two ways to define the dropdown content:

1. **Using `options`**: Define an array of options with `id`, `label`, and/or `icon`.

2. **Using `children`**: For custom popover content, provide a function that returns any layout component configuration. This is useful for more complex interactions (eg. color picker).

The `onClick` callback is triggered when clicking the main button area (not the dropdown arrow), allowing you to apply the current value directly.

#### ButtonMenu properties

Show properties

| Property       | Type                     | Description                                                                                                                                                                                                                                         |
| -------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*         | buttonMenu<!-- -->       | Type of the layout component.                                                                                                                                                                                                                       |
| active         | boolean<!-- -->          | Indicates if the button is active.**Default**```js
false

```                                                                                                                                                                                          |
| as             | string           | The HTML tag to use for the layout component.**Example**```js
"div"

```                                                                                                                                                                               |
| buttonType     | string<!-- -->           | HTML button type attribute.**Example**```js
"button" | "submit" | "reset"

```                                                                                                                                                                         |
| children       | Layout component | Children layout to render inside the popover menu. This is a function that receives state and returns a layout configuration.                                                                                                                       |
| className      | string           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                                                                     |
| classNameBtn   | string<!-- -->           | Class name for the inner button element.**Example**```js
"btn-class"

```                                                                                                                                                                              |
| disabled       | boolean          | Indicates whether the component is disabled.**Default**```js
false

```                                                                                                                                                                                |
| editorEvents   | object<!-- -->           | Events to be handled by the editor.**Example**```js
{ 'component:add': ({ editor }) => { console.log('Component added'); } }

```                                                                                                                      |
| icon           | string           | Icon to be displayed in the button.**Example**```js
"close"

```                                                                                                                                                                                       |
| iconMenu       | string<!-- -->           | Icon to display for the dropdown menu trigger.**Default**```js
chevronDown

```                                                                                                                                                                        |
| id             | string           | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                                                                          |
| label          | function<!-- -->         | Label for the button. Can be a string or a function that receives state and returns label config.**Example**```js
// Simple string
"Button"
// Function returning a layout component
(props) => ({ type: 'text', content: `Value: ${props.value}` })

``` |
| onClick        | function         | Click event handler for the button.**Example**```js
({ event }) => { alert('Button clicked!'); }

```                                                                                                                                                  |
| onClickMenu    | function<!-- -->         | Callback function triggered when the menu icon is clicked. If provided, the default behavior will be skipped.                                                                                                                                       |
| onOptionChange | function<!-- -->         | Callback function triggered when an option is selected (when using options).                                                                                                                                                                        |
| options        | array<!-- -->            | Optional predefined options for the menu. When provided, spawns a popover with menu items.                                                                                                                                                          |
| size           | string<!-- -->           | Size of the button.**Example**```js
"x2s" | "xs" | "s" | "m" | "lg"

```                                                                                                                                                                               |
| style          | object           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                                                                      |
| tooltip        | string<!-- -->           | Tooltip text for the button.**Example**```js
"Click to submit"

```                                                                                                                                                                                    |
| value          | string           | Current value stored in the button menu state.                                                                                                                                                                                                      |
| variant        | string           | Variant of the button style.**Example**```js
"primary" | "outline" | "shallow"

```                                                                                                                                                                    |

## Devices

Displays the available devices that users can switch between in the editor canvas for responsive style editing. The component is connected to the [GrapesJS Devices API](https://grapesjs.com/docs/api/device_manager.html).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'column',
        style: { height: '100%' },
        children: [
          {
            type: 'row',
            style: { justifyContent: 'center', alignItems: 'center', gap: 5 },
            children: [
              {
                type: 'button',
                label: 'Add Random Device',
                onClick: ({ editor }) => {
                  const width = `${Math.floor(Math.random() * (1000 - 500 + 1) + 500)}px`;
                  const name = `Random ${width}`;
                  editor.Devices.add({ id: `random-${width}`, name, width });
                  alert(`Created "${name}"`);
                }
              },
              { type: 'devices', style: { width: '100px' } }
            ]
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

#### Devices properties

Show properties

| Property  | Type            | Description                                                                                    |
| --------- | --------------- | ---------------------------------------------------------------------------------------------- |
| type\*    | devices<!-- --> | Type of the layout component.                                                                  |
| as        | string<!-- -->  | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className | string  | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| id        | string<!-- -->  | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| style     | object  | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelPages

Displays the pages of the project. The component is connected to the [GrapesJS Pages API](https://grapesjs.com/docs/api/pages.html) and the [Pages configuration](../pages.md).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Home page</h1>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            children: {
              type: 'panelPages',
              style: { width: 300 },
              header: { label: 'My pages', collapsible: false }
            }
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

#### PanelPages properties

Show properties

| Property  | Type               | Description                                                                                    |
| --------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| type\*    | panelPages<!-- --> | Type of the layout component.                                                                  |
| as        | string<!-- -->     | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className | string     | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header    | object<!-- -->     | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs | object     | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id        | string<!-- -->     | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| resizable | object     | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| style     | object<!-- -->     | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelPageSettings

Displays the [Page Settings](../pages.md#settings) panel, allowing users to configure settings for individual pages.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Home page</h1>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: 300 },
            children: { type: 'panelPageSettings' }
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

#### PanelPageSettings properties

Show properties

| Property  | Type                                            | Description                                                                                    |
| --------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| type\*    | panelPageSettings                       | Type of the layout component.                                                                  |
| as        | string                                  | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className | string<!-- -->                                  | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header    | object                                  | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs | object<!-- -->                                  | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id        | string                                  | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| page      | [Page](https://grapesjs.com/docs/api/page.html) | The page to display settings for.**Example**```js
editor.Pages.getSelected();

```                |
| resizable | object                                  | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| style     | object<!-- -->                                  | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelLayers

Displays the layers of the currently selected page. The component is connected to the [GrapesJS Layers API](https://grapesjs.com/docs/api/layer_manager.html). enabling users to manage and organize their design layers efficiently.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Home page</h1>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: 300 },
            children: {
              type: 'panelLayers',
              header: {
                label: 'Layers label',
                icon: '<svg viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>'
              }
            }
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

#### PanelLayers properties

Show properties

| Property  | Type                | Description                                                                                    |
| --------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| type\*    | panelLayers | Type of the layout component.                                                                  |
| as        | string      | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className | string<!-- -->      | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header    | object      | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs | object<!-- -->      | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id        | string      | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| resizable | object<!-- -->      | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| style     | object      | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelPagesLayers

Displays a combined panel that includes both the [PanelPages](#panelpages) and [PanelLayers](#panellayers). This component provides a comprehensive view for managing project pages and their respective layers in a unified interface.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Home page</h1>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            children: {
              type: 'panelPagesLayers',
              resizable: { right: true, width: 300, height: '100%', minWidth: 200, maxWidth: 300 },
              panelPagesProps: { header: { label: 'My Pages' } },
              panelLayersProps: { header: { label: 'My Layers' } }
            }
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

#### PanelPagesLayers properties

Show properties

| Property         | Type                                        | Description                                                                                    |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| type\*           | panelPagesLayers<!-- -->                    | Type of the layout component.                                                                  |
| as               | string<!-- -->                              | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className        | string                              | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header           | object<!-- -->                              | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs        | object                              | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id               | string<!-- -->                              | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| panelLayersProps | [PanelLayersProps](#panellayers-properties) | Properties for the panel layers.**Example**```js
{
  "header": {
    "label": "My Layers"
  }
}

```  |
| panelPagesProps  | [PanelPagesProps](#panelpages-properties)   | Properties for the panel pages.**Example**```js
{
  "header": {
    "label": "My Pages"
  }
}

```    |
| resizable        | object                              | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| style            | object<!-- -->                              | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelBlocks

Displays the blocks panel, which is connected to the [GrapesJS Blocks API](https://grapesjs.com/docs/api/block_manager.html).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: 300 },
            children: [
              {
                type: 'button',
                label: 'Add Random Block',
                style: { margin: '10px auto' },
                variant: 'outline',
                onClick: ({ editor }) => {
                  const id = Math.random().toString(36).substring(5);
                  const name = `Block ${id}`;
                  editor.Blocks.add(`block-${id}`, {
                    label: name,
                    category: 'Random',
                    media: '<svg viewBox="0 0 24 24"><path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z" /></svg>',
                    content: `<div>HTML from ${name}</div>`
                  });
                  alert(`Created "${name}"`);
                }
              },
              {
                type: 'panelBlocks',
                header: { label: 'My blocks' }
              }
            ]
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

#### PanelBlocks properties

Show properties

| Property       | Type                | Description                                                                                                                                                                                                                                |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| type\*         | panelBlocks | Type of the layout component.                                                                                                                                                                                                              |
| as             | string      | The HTML tag to use for the layout component.**Example**```js
"div"

```                                                                                                                                                                      |
| blocks         | function<!-- -->    | Filter blocks.                                                                                                                                                                                                                             |
| className      | string<!-- -->      | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                                                            |
| header         | object      | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```                                                                                                                                                      |
| hideCategories | boolean<!-- -->     | Whether to hide categories.**Default**```js
false

```                                                                                                                                                                                        |
| htmlAttrs      | object      | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```                                                                                                                                               |
| id             | string<!-- -->      | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                                                                 |
| itemLayout     | function    | Custom layout for rendering single blocks.**Example**```js
itemLayout: ({ block, attributes }) => ({
 type: 'column',
 children: [
   { type: 'custom', render: () => block.getMedia() },
   { type: 'text', content: block.getLabel() }
 ]
})

``` |
| resizable      | object<!-- -->      | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```                                                                                                                                                   |
| search         | boolean     | Whether to show search.**Default**```js
true

```                                                                                                                                                                                             |
| style          | object<!-- -->      | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                                                             |
| symbols        | boolean     | Whether to show symbols.**Default**```js
true

```                                                                                                                                                                                            |
| variant        | compact<!-- -->     | Variant of the blocks panel. `compact` - Show a list of blocks instead of a grid.                                                                                                                                                          |

## PanelGlobalStyles

Displays Global Styles panel. The component is connected to the [Global Styles configuration](../global-styles.md).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Home page</h1>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: 300 },
            children: [
              {
                type: 'panelGlobalStyles',
                header: { label: 'Global Styles' }
              }
            ]
          },
          { type: 'canvas' }
        ]
      },
    },
    globalStyles: {
      default: [
        {
          id: 'h1Color',
          property: 'color',
          field: 'color',
          defaultValue: 'red',
          selector: 'h1',
          label: 'H1 color'
        },
      ]
    }
  }}
/>

```

#### PanelGlobalStyles properties

Show properties

| Property  | Type                      | Description                                                                                    |
| --------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| type\*    | panelGlobalStyles<!-- --> | Type of the layout component.                                                                  |
| as        | string<!-- -->            | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className | string            | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header    | object<!-- -->            | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs | object            | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id        | string<!-- -->            | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| resizable | object            | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| style     | object<!-- -->            | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelSelectors

Displays component selectors, providing users with the ability to choose the styling target. The component is connected to the [GrapesJS Selectors API](https://grapesjs.com/docs/api/selector_manager.html).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Home page</h1>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          { type: 'canvas' },
          {
            type: 'column',
            style: { width: 300 },
            children: {
              type: 'panelSelectors',
              style: { padding: 5 }
            }
          }
        ]
      },
    }
  }}
/>

```

#### PanelSelectors properties

Show properties

| Property      | Type                   | Description                                                                                    |
| ------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| type\*        | panelSelectors | Type of the layout component.                                                                  |
| as            | string         | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className     | string<!-- -->         | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header        | object         | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs     | object<!-- -->         | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id            | string         | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| resizable     | object<!-- -->         | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| stateSelector | boolean        | Enable the state selector.**Default**```js
false

```                                             |
| style         | object<!-- -->         | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |
| styleCatalog  | boolean        | Enable the style catalog.**Default**```js
false

```                                              |

## PanelStyles

Displays the styles of the currently selected component, allowing users to easily view and edit styles directly within the editor. The component is connected to the [GrapesJS Style Manager API](https://grapesjs.com/docs/api/style_manager.html).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<div>Select me</div>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          { type: 'canvas' },
          {
            type: 'column',
            style: { width: 300 },
            children: { type: 'panelStyles' }
          }
        ]
      },
    }
  }}
/>

```

#### PanelStyles properties

Show properties

| Property  | Type                | Description                                                                                    |
| --------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| type\*    | panelStyles<!-- --> | Type of the layout component.                                                                  |
| as        | string<!-- -->      | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className | string      | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header    | object<!-- -->      | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs | object      | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id        | string<!-- -->      | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| resizable | object      | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| style     | object<!-- -->      | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelProperties

Displays the properties of the currently selected component. The component is connected to the [GrapesJS Traits API](https://grapesjs.com/docs/modules/Traits.html).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Select me</h1>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          { type: 'canvas' },
          {
            type: 'column',
            style: { width: 300 },
            children: {
              type: 'panelProperties',
              style: { padding: 10 },
            }
          }
        ]
      },
    }
  }}
/>

```

#### PanelProperties properties

Show properties

| Property  | Type                    | Description                                                                                    |
| --------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| type\*    | panelProperties | Type of the layout component.                                                                  |
| as        | string          | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className | string<!-- -->          | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header    | object          | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs | object<!-- -->          | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id        | string          | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| resizable | object<!-- -->          | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| style     | object          | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelSidebarTabs

Displays combined tab views for [PanelSelectors](#panelselectors), [PanelStyles](#panelstyles) and [PanelProperties](#panelproperties), allowing users to easily switch between different panel functionalities within the sidebar.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      default: {
        pages: [{ name: 'Home', component: '<h1>Select me</h1>'}]
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          { type: 'canvas' },
          {
            type: 'column',
            style: { width: 300 },
            children: {
              type: 'panelSidebarTabs'
            }
          }
        ]
      },
    }
  }}
/>

```

#### PanelSidebarTabs properties

Show properties

| Property  | Type                     | Description                                                                                    |
| --------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| type\*    | panelSidebarTabs<!-- --> | Type of the layout component.                                                                  |
| as        | string<!-- -->           | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className | string           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| header    | object<!-- -->           | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```          |
| htmlAttrs | object           | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id        | string<!-- -->           | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| resizable | object           | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```       |
| style     | object<!-- -->           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## PanelAssets

Displays project assets, providing users with access to various media and resources. The component is connected to the [GrapesJS Assets API](https://grapesjs.com/docs/api/assets.html).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    gjsOptions: {
      storageManager: false,
      assetManager: {
        assets: Array(20).fill(0).map((_, i) => `https://picsum.photos/seed/${i}/300/300`)
      }
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: 400 },
            children: [
              {
                type: 'panelAssets',
                header: { label: 'My Assets' },
                content: {
                  itemsPerRow: 2,
                  header: { upload: false }
                },
                onSelect: ({ asset, editor }) => {
                  const root = editor.getWrapper();
                  let imgCmp = root.findFirstType('image');
                  if (!imgCmp) imgCmp = root.append({ type: 'image' }, { at: 0 })[0];
                  imgCmp.set({ src: asset.getSrc() });
                }
              }
            ]
          },
          { type: 'canvas' }
        ]
      },
    }
  }}
/>

```

#### PanelAssets properties

Show properties

| Property            | Type                | Description                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*              | panelAssets | Type of the layout component.                                                                                                                                                                                                                                                                                                                                  |
| as                  | string      | The HTML tag to use for the layout component.**Example**```js
"div"

```                                                                                                                                                                                                                                                                                          |
| assets              | array<!-- -->       | A custom array of assets. Overrides any other configured onLoad or providers.**Example**```js
assets: [
 {
   type: 'image',
   url: 'https://example.com/image.jpg',
 }
]

```                                                                                                                                                                                        |
| className           | string      | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                                                                                                                                                                                |
| close               | function<!-- -->    | Define how to close your AssetManager. For the main AssetManager, it closes the dialog.**Example**```js
() => AssetManager.close()

```                                                                                                                                                                                                                           |
| content             | object      | Content configuration for the AssetManager.**Example**```js
{
 itemsPerRow: 4,
 header: {
  search: true,
},

```                                                                                                                                                                                                                                                     |
| header              | object<!-- -->      | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```                                                                                                                                                                                                                                                                          |
| htmlAttrs           | object      | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```                                                                                                                                                                                                                                                                   |
| id                  | string<!-- -->      | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                                                                                                                                                                                     |
| onSelect            | function    | Callback when an asset is selected.**Example**```js
onSelect: ({ asset, editor }) => {
   editor.AssetManager.add(asset);
}

```                                                                                                                                                                                                                                    |
| optionalProvider    | boolean<!-- -->     | When true, adds `{ id: undefined, label: 'Project assets' }` as an extra option for the asset provider filter at the beginning.**Default**```js
true

```                                                                                                                                                                                                         |
| optionalType        | boolean     | When true, adds `{ id: undefined, label: 'All' }` as an extra option for the asset type filter at the beginning.**Default**```js
false

```                                                                                                                                                                                                                       |
| projectAssetsOption | boolean<!-- -->     | When true, adds `{ id: undefined, label: 'Project assets' }` as an extra option for the asset provider filter at the beginning.**Default**```js
true

```                                                                                                                                                                                                         |
| providerId          | string      | Initial state of the asset provider filter.**Example**```js
"unsplash"

```                                                                                                                                                                                                                                                                                       |
| providers           | array<!-- -->       | The ids of providers that will be available in this assets panel layout. These providers need to exist in {@link AssetsConfig.providers } first. Defaults to the all providers specified in {@link AssetsConfig } . Set to an empty array to hide the asset provider filter.**Example**```js
[
  "unsplash"
]

```                                                  |
| resizable           | object      | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```                                                                                                                                                                                                                                                                       |
| style               | object<!-- -->      | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                                                                                                                                                                                 |
| typeId              | string      | Initial state of the asset type filter.**Default**```js
image

```                                                                                                                                                                                                                                                                                                |
| types               | array<!-- -->       | Options that show up in the asset type filter. The selected type filters providers in the asset provider filter by `assetProvider.type`. This filter is required by default. To make it optional set `assetManagerProps.optionalType = true`. Set to an empty array to hide the asset type filter.**Default**```js
[{ id: AssetType.image, label: 'Images'}]

``` |

## PanelEditCode

Displays editable code for the selected page. By default it renders the code fields plus an `Update` action below them.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'canvasSidebarTop',
            sidebarTop: {
              leftContainer: { buttons: [] },
              rightContainer: {
                buttons: [
                  {
                    id: 'openEditCode',
                    icon: 'codeBraces',
                    onClick: ({ editor }) => {
                      editor.runCommand('studio:layoutToggle', {
                        id: 'editCodeDialog',
                        header: false,
                        placer: { type: 'dialog', title: 'Edit code', size: 'l' },
                        layout: { type: 'panelEditCode' }
                      });
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    }
  }}
/>

```

#### PanelEditCode properties

Show properties

| Property     | Type          | Description                                                                                                                                           |
| ------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*       | panelEditCode | Type of the layout component.                                                                                                                         |
| as           | string        | The HTML tag to use for the layout component.                                                                                                         |
| className    | string        | The CSS class name(s) for the component.                                                                                                              |
| htmlAttrs    | object        | The HTML attributes for the component.                                                                                                                |
| id           | string        | The unique identifier for the component.                                                                                                              |
| layoutAfter  | function      | Custom layout rendered after the code fields. When provided, the default footer is disabled. Receives `editor`, `state`, `setState`, and `update`. |
| layoutBefore | function      | Custom layout rendered before the code fields. Receives `editor`, `state`, `setState`, and `update`.                                                |
| state        | function      | Override the initial editable state of the component.                                                                                                 |
| style        | object        | The inline styles for the component.                                                                                                                  |

#### React component

This component is also exported for React consumers. See the [React Layout Components section](overview.md#react-layout-components) for the complete setup.

```jsx
import StudioEditor, { StudioPanelEditCode } from '@grapesjs/studio-sdk/react';

<StudioEditor options={{...}} withComponents>
  <StudioPanelEditCode />
</StudioEditor>

```

## PanelTemplates

Displays a list of templates that users can select as a starting point for their project. For more details, refer to the [Templates page](../templates.md).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'column',
            style: { width: 350 },
            children: [
              {
                type: 'panelTemplates',
                classNameAccordion: 'flex-grow h-full',
                classNameAccordionContent: 'flex-grow h-full',
                header: { label: 'Choose a template for your project' },
                content: { itemsPerRow: 1 },
                templates: [
                  {
                    id: 'template1',
                    name: 'Template 1',
                    data: {
                      pages: [
                        {
                          name: 'Home',
                          component: '<h1 class="title">Template 1</h1><style>.title { color: red; font-size: 10rem; text-align: center }</style>'
                        }
                      ]
                    }
                  },
                  {
                    id: 'template2',
                    name: 'Template 2',
                    data: {
                      pages: [
                        { component: '<h1 class="title">Template 2</h1><style>.title { color: blue; font-size: 10rem; text-align: center }</style>' }
                      ]
                    }
                  },
                  {
                    id: 'template3',
                    name: 'Template 3',
                    data: {
                      pages: [
                        { component: '<h1 class="title">Template 3</h1><style>.title { color: green; font-size: 10rem; text-align: center }</style>' }
                      ]
                    }
                  },
                  {
                    id: 'template4',
                    name: 'Template 4',
                    data: {
                      pages: [
                        { component: '<h1 class="title">Template 4</h1><style>.title { color: violet; font-size: 10rem; text-align: center }</style>' }
                      ]
                    }
                  },
                ]
              }
            ]
          },
          { type: 'canvas' }
        ]
      }
    }

  }}
/>

```

#### PanelTemplates properties

Show properties

| Property  | Type                   | Description                                                                                                                                                                                                                                                                                                               |
| --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*    | panelTemplates | Type of the layout component.                                                                                                                                                                                                                                                                                             |
| as        | string         | The HTML tag to use for the layout component.**Example**```js
"div"

```                                                                                                                                                                                                                                                     |
| className | string<!-- -->         | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                                                                                                                                           |
| content   | object         | Extra props to customize this layout panel.**Example**```js
{
  "itemsPerRow": 3
}

```                                                                                                                                                                                                                                        |
| header    |                        | Header of the panel.**Example**```js
{
  "label": "My label",
  "collapsible": false
}

```                                                                                                                                                                                                                                     |
| htmlAttrs | object         | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```                                                                                                                                                                                                                              |
| id        | string<!-- -->         | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                                                                                                                                                |
| onSelect  | function       | Provide a custom handler for the select button.**Example**```js
({ loadTemplate, template }) => {
  // loads the selected template to the current project
  loadTemplate(template);
}

```                                                                                                                                      |
| resizable |                        | Resizable configuration of the panel.**Example**```js
{
  "width": 100,
  "height": 300
}

```                                                                                                                                                                                                                                  |
| style     | object         | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                                                                                                                                            |
| templates | array<!-- -->          | Custom array of templates to show in this panel.**Example**```js
templates: [{
  id: 'template1',
  name: 'Template 1',
  data: {
    pages: [
      {
        name: 'Home',
        component: '<h1 class="title">Template 1</h1><style>.title { color: red; font-size: 10rem; text-align: center }</style>'
      }
    ]
  }
}]

``` |

## Custom

Provide a custom React component via `component` or any other custom element via `render` option.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'sidebarLeft',
            children: [
              { // React component
                type: 'custom',
                component: ({ editor }) => <button onClick={() => alert(editor.getHtml())}>Get HTML!!!</button>
              },
              { // HTML string
                type: 'custom',
                render: () => 'HTML as <b>string</b>'
              },
              { // HTML element
                type: 'custom',
                render: () => {
                  const el = document.createElement('div');
                  el.innerHTML = 'HTML as <b>element</b>';
                  return el;
                }
              },
              // Custom element, with cleanup
              {
                type: 'custom',
                render: ({ editor, addEl, removeEl }) => {
                  const buttonEl = document.createElement('button');
                  buttonEl.innerHTML = 'Button with <b>cleanup</b>';
                  buttonEl.style.cssText = 'border: 1px solid; padding: 5px;';
                  const onClick = () => alert('Button clicked: ' + editor?.getHtml());
                  buttonEl.addEventListener('click', onClick);
                  addEl(buttonEl);
                  return () => {
                    // Remember to cleanup to avoid memory leaks
                    buttonEl.removeEventListener('click', onClick);
                    removeEl(buttonEl);
                  };
                }
              }
            ]
          },
          { type: 'canvasSidebarTop' },
          { type: 'sidebarRight' }
        ]
      },
    }
  }}
/>

```

#### Custom properties

Show properties

| Property  | Type                    | Description                                                                                                                                           |
| --------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*    | custom          | Type of the layout component.                                                                                                                         |
| className | string          | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                       |
| component | React Component<!-- --> | Component to be rendered in the custom layout.**Example**```js
({ editor }) => <button onClick={() => alert(editor.getHtml())}>Get HTML!!!</button>

``` |
| id        | string          | The unique identifier for the component.**Example**```js
"component-123"

```                                                                            |
| noWrapper | boolean<!-- -->         | Indicates if the custom layout should not be wrapped (only works for React Components as the custom render needs a wrapper)**Default**```js
false

```   |
| render    | function        | Function to render the custom layout.**Example**```js
({ editor, addEl, removeEl }) => '<div>Custom layout</div>'

```                                   |
| style     | object<!-- -->          | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                        |

## VirtualList

A virtual list component that renders only the visible items, improving performance when dealing with a large number of items.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'virtualList',
            itemsPerRow: 4,
            style: { width: 700 },
            items: Array(100).fill(0).map((_, i) => ({ id: i, name: 'Item ' + i })),
            itemLayout: ({ item, editor }) => ({
              type: 'column',
              gap: 5,
              children: [
                {
                  type: 'custom',
                  render: () => `<img height="100" src="https://picsum.photos/seed/image-${item.id}/100/100"/>`
                },
                {
                  type: 'button',
                  label: `Add ${item.name}`,
                  variant: 'primary',
                  style: { width: '100%' },
                  onClick() {
                    editor.getWrapper().append(`<div style="padding: 10px"><img src="https://picsum.photos/seed/image-${item.id}/100/100"/><p>Item from the list: ${item.name}</p></div>`);
                  }
                }
              ]
            })
          },
          { type: 'canvas' }
        ]
      }
    }
  }}
/>

```

#### VirtualList properties

Show properties

| Property     | Type                | Description                                                                                                                                                      |
| ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*       | virtualList | Type of the layout component.                                                                                                                                    |
| items\*      | array       | The items to be displayed in the virtual list.**Example**```js
[
  {
    "id": "1",
    "name": "Item 1"
  },
  {
    "id": "2",
    "name": "Item 2"
  }
]

```             |
| className    | string<!-- -->      | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                  |
| footerLayout | function    | The layout component rendered as footer in the virtual list.                                                                                                     |
| htmlAttrs    | object      | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```                                                                     |
| id           | string<!-- -->      | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                       |
| itemLayout   | function    | The layout component for the items in the virtual list.**Example**```js
({ item, index, editor }) => ({ type: 'row', children: `${index + 1}. ${item.name}` })

``` |
| itemsPerRow  | number<!-- -->      | The number of items per row.**Default**```js
12

```                                                                                                                |
| style        | object      | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                   |

## Sidebar components

Studio includes sidebar components that can be toggled based on specific conditions, such as when the default preview command is triggered.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'sidebarLeft',
            style: { alignItems: 'center', justifyContent: 'center' },
            children: [
              {
                type: 'button',
                label: 'Toggle Right Sidebar',
                variant: 'outline',
                onClick: ({ editor }) => editor.runCommand('studio:sidebarRight:toggle')
              }
            ]
          },
          {
            type: 'column',
            style: { flexGrow: 1 },
            children: [
              {
                type: 'sidebarTop',
                style: { alignItems: 'center', justifyContent: 'center', gap: 10 },
                children: [
                  {
                    type: 'button',
                    icon: 'eye',
                    variant: 'outline',
                    onClick: ({ editor }) => editor.runCommand('core:preview')
                  },
                  {
                    type: 'button',
                    label: 'Toggle Bottom Sidebar',
                    variant: 'outline',
                    onClick: ({ editor }) => editor.runCommand('studio:sidebarBottom:toggle')
                  }
                ]
              },
              {
                type: 'row',
                style: { flexGrow: 1, overflow: 'hidden' },
                children: [
                  { type: 'canvas', grow: true },
                  {
                    type: 'sidebarRight',
                    style: { alignItems: 'center', justifyContent: 'center' },
                    children: [
                      {
                        type: 'button',
                        label: 'Toggle Left Sidebar',
                        variant: 'outline',
                        onClick: ({ editor }) => editor.runCommand('studio:sidebarLeft:toggle')
                      }
                    ]
                  }
                ]
              },
              {
                type: 'sidebarBottom',
                style: { alignItems: 'center', justifyContent: 'center' },
                children: [
                  {
                    type: 'button',
                    label: 'Toggle Top Sidebar',
                    variant: 'outline',
                    onClick: ({ editor }) => editor.runCommand('studio:sidebarTop:toggle')
                  }
                ]
              }
            ]
          }
        ]
      },
    }
  }}
/>

```

#### SidebarBottom properties

Show properties

| Property  | Type                     | Description                                                                                                 |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| type\*    | sidebarBottom<!-- -->    | Type of the layout component.                                                                               |
| as        | string<!-- -->           | The HTML tag to use for the layout component.**Example**```js
"div"

```                                       |
| children  | Layout component | The children layout components.**Example**```js
[
  {
    "type": "text",
    "content": "Hello, World!"
  }
]

``` |
| className | string<!-- -->           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                             |
| htmlAttrs | object           | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```                |
| id        | string<!-- -->           | The unique identifier for the component.**Example**```js
"component-123"

```                                  |
| style     | object           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```              |

#### SidebarLeft properties

Show properties

| Property  | Type                     | Description                                                                                                 |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| type\*    | sidebarLeft<!-- -->      | Type of the layout component.                                                                               |
| as        | string<!-- -->           | The HTML tag to use for the layout component.**Example**```js
"div"

```                                       |
| children  | Layout component | The children layout components.**Example**```js
[
  {
    "type": "text",
    "content": "Hello, World!"
  }
]

``` |
| className | string<!-- -->           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                             |
| id        | string           | The unique identifier for the component.**Example**```js
"component-123"

```                                  |
| resizable | boolean<!-- -->          | Indicates whether the sidebar is resizable.**Default**```js
true

```                                          |
| style     | object           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```              |

#### SidebarRight properties

Show properties

| Property  | Type                     | Description                                                                                                 |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| type\*    | sidebarRight<!-- -->     | Type of the layout component.                                                                               |
| as        | string<!-- -->           | The HTML tag to use for the layout component.**Example**```js
"div"

```                                       |
| children  | Layout component | The children layout components.**Example**```js
[
  {
    "type": "text",
    "content": "Hello, World!"
  }
]

``` |
| className | string<!-- -->           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                             |
| id        | string           | The unique identifier for the component.**Example**```js
"component-123"

```                                  |
| resizable | boolean<!-- -->          | Indicates whether the sidebar is resizable.**Default**```js
true

```                                          |
| style     | object           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```              |

#### SidebarTop properties

Show properties

| Property       | Type                                   | Description                                                                                                                                                                        |
| -------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*         | sidebarTop<!-- -->                     | Type of the layout component.                                                                                                                                                      |
| as             | string<!-- -->                         | The HTML tag to use for the layout component.**Example**```js
"div"

```                                                                                                              |
| children       | Layout component               | The children layout components.**Example**```js
[
  {
    "type": "text",
    "content": "Hello, World!"
  }
]

```                                                                        |
| className      | string<!-- -->                         | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                    |
| devices        | [DevicesProps](#devices-properties)    | The properties for the devices section of the top bar.**Example**```js
{
  "style": {
    "width": 200
  }
}

```                                                                         |
| height         | number<!-- -->, <!-- -->string<!-- --> | The height of the top bar.**Example**```js
50

```                                                                                                                                    |
| id             | string                         | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                         |
| leftContainer  | object<!-- -->                         | The properties for the left container of the top bar.**Example**```js
{
  "buttons": [
    {
      "type": "button",
      "icon": "menu",
      "onClick": "toggleSidebar"
    }
  ]
}

```  |
| rightContainer | object                         | The properties for the right container of the top bar.**Example**```js
{
  "buttons": [
    {
      "type": "button",
      "icon": "menu",
      "onClick": "toggleSidebar"
    }
  ]
}

``` |
| style          | object<!-- -->                         | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                     |

## Canvas components

The layout configuration must include one of the following canvas components:

* `canvas`: The basic canvas component
* `canvasSidebarTop` - The canvas component combined with `sidebarTop`.

- React
- JS
- 🍇  Demo

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'sidebarLeft',
            children: [
              { type: 'panelPagesLayers' }
            ]
          },
          {
            type: 'canvasSidebarTop',
          },
          {
            type: 'sidebarRight',
          }
        ]
      },
    }
  }}
/>

```

#### Canvas properties

Show properties

| Property  | Type                     | Description                                                                                    |
| --------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| type\*    | canvas           | Type of the layout component.                                                                  |
| children  | Layout component | Children components to render inside the canvas.                                               |
| className | string           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| grow      | boolean<!-- -->          | If true, the component will grow to fill available space.**Default**```js
false

```              |
| id        | string           | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| style     | object<!-- -->           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

#### CanvasSidebarTop properties

Show properties

| Property   | Type                                      | Description                                                                                    |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| type\*     | canvasSidebarTop                  | Type of the layout component.                                                                  |
| as         | string                            | The HTML tag to use for the layout component.**Example**```js
"div"

```                          |
| className  | string<!-- -->                            | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                |
| htmlAttrs  | object                            | The HTML attributes for the component.**Example**```js
{
  "data-test-id": "component-123"
}

```   |
| id         | string<!-- -->                            | The unique identifier for the component.**Example**```js
"component-123"

```                     |
| sidebarTop | [SidebarTopProps](#sidebartop-properties) | The sidebar top.**Example**```js
{
  "style": {
    "alignItems": "center"
  }
}

```                 |
| style      | object<!-- -->                            | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

``` |

## Form components

The layout configuration could include one of the following form components:

* `InputField`: The basic input field component.
* `SelectField` - The select field component.
* `ButtonGroupField` - The button group field component.
* `CodeField` - The code field component.
* `ColorField` - The color field component.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          {
            type: 'button',
            variant: 'primary',
            label: 'View Form',
            onClick: ({ editor }) => {
              editor.runCommand('studio:layoutToggle', {
                id: 'viewFormComponents',
                header: false,
                placer: { type: 'dialog', size: 'l', title: 'Form components' },
                layout: {
                  type: 'column',
                  as: 'form',
                  style: { height: 500, gap: 20, overflowY: 'auto' },
                  htmlAttrs: {
                    onSubmit: ev => {
                      ev.preventDefault();
                      const fd = new FormData(ev.currentTarget);
                      editor.addComponents({
                        type: 'text',
                        tagName: 'p',
                        content: JSON.stringify({
                          name: fd.get('name'),
                          companySize: fd.get('companySize'),
                          account: fd.get('account'),
                          accentColor: fd.get('accentColor'),
                          html: fd.get('html')
                        }, null, 2)
                      });
                      editor.runCommand('studio:layoutRemove', { id: 'viewFormComponents' });
                    }
                  },
                  children: [
                    {
                      type: 'inputField',
                      name: 'name',
                      label: 'Name',
                      placeholder: 'Insert your name',
                      required: true,
                      value: '',
                      onChange: ({ value, setState }) => setState({ value })
                    },
                    {
                      type: 'codeField',
                      language: 'html',
                      label: 'HTML',
                      name: 'html',
                      value: '<div>Hello</div>',
                      onChange: ({ value, setState }) => setState({ value }),
                      required: true
                    },
                    {
                      type: 'selectField',
                      name: 'companySize',
                      label: 'Company size',
                      emptyState: 'Select',
                      value: '',
                      required: true,
                      options: [
                        { id: '1', label: '1' },
                        { id: '2-10', label: '2-10' },
                        { id: '11-50', label: '11-50' },
                        { id: '51-200', label: '51-200' },
                        { id: '201-500', label: '201-500' },
                        { id: '500+', label: '500+' }
                      ],
                      onChange: ({ value, setState }) => setState({ value })
                    },
                    {
                      type: 'buttonGroupField',
                      id: 'account',
                      name: 'account',
                      label: 'Account',
                      value: '',
                      options: [
                        { id: 'Personal', label: 'Personal' },
                        { id: 'Professional', label: 'Professional' }
                      ],
                      onChange: ({ value, setState }) => setState({ value })
                    },
                    {
                      type: 'colorField',
                      name: 'accentColor',
                      label: 'Accent color',
                      value: 'rgba(255, 0, 0, 1)',
                      onChange: ({ value, setState }) => setState({ value })
                    },
                    {
                      type: 'row',
                      style: { gap: 10 },
                      children: {
                        type: 'button',
                        variant: 'primary',
                        label: 'Submit',
                        buttonType: 'submit'
                      }
                    }
                  ]
                }
              });
            }
          },
          { type: 'canvas' }
        ]
      },

    }
  }}
/>

```

#### InputField properties

Show properties

| Property     | Type               | Description                                                                                                                                                                                       |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*       | inputField | Type of the layout component.                                                                                                                                                                     |
| value\*      | string     | The value of the field.**Example**```js
"username"

```                                                                                                                                              |
| className    | string<!-- -->     | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                   |
| disabled     | boolean    | Indicates whether the field is disabled.**Default**```js
false

```                                                                                                                                  |
| editorEvents | object<!-- -->     | Update layout component state based on editor events.**Example**```js
{ 'component:selected': ({ setState, editor }) => setState({ className: 'custom-cls-' + editor.getSelected().getId() }) }

``` |
| id           | string     | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                        |
| inputType    | string<!-- -->     | The type of the field.**Example**```js
"text"

```                                                                                                                                                   |
| label        | string     | The label for the field.**Example**```js
"Username"

```                                                                                                                                             |
| name         | string<!-- -->     | The name attribute for the field.**Example**```js
"username"

```                                                                                                                                    |
| onChange     | function   | The function to call when the field value changes.**Example**```js
({ value, setState }) => setState({ value });

```                                                                                |
| onInput      | function<!-- -->   | The function to call when the field value changes on input.**Example**```js
({ value, setState }) => setState({ value });

```                                                                       |
| placeholder  | string     | The placeholder text for the field.**Example**```js
"Enter your username"

```                                                                                                                       |
| readOnly     | boolean<!-- -->    | Indicates whether the field is read-only.**Default**```js
false

```                                                                                                                                 |
| required     | boolean    | Indicates whether the field is required.**Default**```js
false

```                                                                                                                                  |
| row          | boolean<!-- -->    | Indicates if the field should be rendered in a row layout.**Default**```js
false

```                                                                                                                |
| size         | string     | The size of the field.**Example**```js
"m" | "s"

```                                                                                                                                                |
| style        | object<!-- -->     | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                    |

#### SelectField properties

Show properties

| Property     | Type                | Description                                                                                                                                                                                        |
| ------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*       | selectField | Type of the layout component.                                                                                                                                                                      |
| options\*    | array       | The options for the field.**Example**```js
[
  {
    "id": "1",
    "label": "Username 1",
    "content": "Username 1"
  },
  {
    "id": "2",
    "label": "Username 2",
    "content": "Username 2"
  }
]

``` |
| value\*      | string<!-- -->      | The value of the field.**Example**```js
"username"

```                                                                                                                                               |
| className    | string      | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                    |
| disabled     | boolean<!-- -->     | Indicates whether the field is disabled.**Default**```js
false

```                                                                                                                                   |
| editorEvents | object      | Update layout component state based on editor events.**Example**```js
{ 'component:selected': ({ setState, editor }) => setState({ className: 'custom-cls-' + editor.getSelected().getId() }) }

```  |
| emptyState   | string<!-- -->      | The empty state for the field.**Example**```js
"Select your username"

```                                                                                                                            |
| id           | string      | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                         |
| label        | string<!-- -->      | The label for the field.**Example**```js
"Username"

```                                                                                                                                              |
| name         | string      | The name attribute for the field.**Example**```js
"username"

```                                                                                                                                     |
| onChange     | function<!-- -->    | The function to call when the field value changes.**Example**```js
({ value, setState }) => setState({ value });

```                                                                                 |
| required     | boolean     | Indicates whether the field is required.**Default**```js
false

```                                                                                                                                   |
| size         | string<!-- -->      | The size of the field.**Example**```js
"l" | "m" | "s" | "xs" | "x2s"

```                                                                                                                            |
| style        | object      | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                     |

#### ButtonGroupField properties

Show properties

| Property     | Type                     | Description                                                                                                                                                                                                                                              |
| ------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*       | buttonGroupField<!-- --> | Type of the layout component.                                                                                                                                                                                                                            |
| options\*    | array<!-- -->            | The options for the field.**Example**```js
[
  {
    "id": "1",
    "label": "Username 1",
    "title": "Username 1",
    "icon": "<svg>...</svg>"
  },
  {
    "id": "2",
    "label": "Username 2",
    "title": "Username 2",
    "icon": "<svg>...</svg>"
  }
]

``` |
| value\*      | string           | The value of the field.**Example**```js
"username"

```                                                                                                                                                                                                     |
| className    | string<!-- -->           | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                                                                          |
| disabled     | boolean          | Indicates whether the field is disabled.**Default**```js
false

```                                                                                                                                                                                         |
| editorEvents | object<!-- -->           | Update layout component state based on editor events.**Example**```js
{ 'component:selected': ({ setState, editor }) => setState({ className: 'custom-cls-' + editor.getSelected().getId() }) }

```                                                        |
| id           | string           | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                                                                               |
| label        | string<!-- -->           | The label for the field.**Example**```js
"Username"

```                                                                                                                                                                                                    |
| name         | string           | The name attribute for the field.**Example**```js
"username"

```                                                                                                                                                                                           |
| onChange     | function<!-- -->         | The function to call when the field value changes.**Example**```js
({ value, setState }) => setState({ value });

```                                                                                                                                       |
| required     | boolean          | Indicates whether the field is required.**Default**```js
false

```                                                                                                                                                                                         |
| size         | string<!-- -->           | The size of the field.**Example**```js
"m" | "s" | "xs"

```                                                                                                                                                                                                |
| style        | object           | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                                                                           |

#### CodeField properties

Show properties

| Property      | Type              | Description                                                                                                                                                                                       |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*        | codeField<!-- --> | Type of the layout component.                                                                                                                                                                     |
| language\*    | string<!-- -->    | Indicates the language of the code field.**Example**```js
"json"

```                                                                                                                                |
| value\*       | string    | The value of the field.**Example**```js
"username"

```                                                                                                                                              |
| className     | string<!-- -->    | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                   |
| disabled      | boolean   | Indicates whether the field is disabled.**Default**```js
false

```                                                                                                                                  |
| editorEvents  | object<!-- -->    | Update layout component state based on editor events.**Example**```js
{ 'component:selected': ({ setState, editor }) => setState({ className: 'custom-cls-' + editor.getSelected().getId() }) }

``` |
| id            | string    | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                        |
| label         | string<!-- -->    | The label for the field.**Example**```js
"Username"

```                                                                                                                                             |
| minHeight     | string    | Indicates the minimum height of the field.**Default**```js
170px

```                                                                                                                                |
| monacoOptions | object<!-- -->    | Pass additional options to the Monaco editor. Docs: https\://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html**Default**```js
{}

```           |
| name          | string    | The name attribute for the field.**Example**```js
"username"

```                                                                                                                                    |
| onChange      | function<!-- -->  | The function to call when the field value changes.**Example**```js
({ value, setState }) => setState({ value });

```                                                                                |
| readOnly      | boolean   | Indicates whether the field is read-only.**Default**```js
false

```                                                                                                                                 |
| required      | boolean<!-- -->   | Indicates whether the field is required.**Default**```js
false

```                                                                                                                                  |
| row           | boolean   | Indicates if the field should be rendered in a row layout.**Default**```js
false

```                                                                                                                |
| size          | string<!-- -->    | The size of the field.**Example**```js
"m" | "s"

```                                                                                                                                                |
| style         | object    | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                    |

#### ColorField properties

Show properties

| Property             | Type               | Description                                                                                                                                                                                       |
| -------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type\*               | colorField<!-- --> | Type of the layout component.                                                                                                                                                                     |
| value\*              | string<!-- -->     | The value of the field.**Example**```js
"username"

```                                                                                                                                              |
| className            | string     | The CSS class name(s) for the component.**Example**```js
"my-component-class"

```                                                                                                                   |
| colorPickerProps     | object<!-- -->     | Optional color picker props.                                                                                                                                                                      |
| disabled             | boolean<!-- -->    | Indicates whether the field is disabled.**Default**```js
false

```                                                                                                                                  |
| editorEvents         | object     | Update layout component state based on editor events.**Example**```js
{ 'component:selected': ({ setState, editor }) => setState({ className: 'custom-cls-' + editor.getSelected().getId() }) }

``` |
| id                   | string<!-- -->     | The unique identifier for the component.**Example**```js
"component-123"

```                                                                                                                        |
| label                | string     | The label for the field.**Example**```js
"Username"

```                                                                                                                                             |
| name                 | string<!-- -->     | The name attribute for the field.**Example**```js
"username"

```                                                                                                                                    |
| onChange             | function   | The function to call when the field value changes.**Example**```js
({ value, setState }) => setState({ value });

```                                                                                |
| placeholder          | string<!-- -->     | Placeholder text displayed in the input.**Example**```js
"#ff0000"

```                                                                                                                              |
| preventSubmitOnEnter | boolean    | Prevent parent form submit on Enter.**Default**```js
false

```                                                                                                                                      |
| required             | boolean<!-- -->    | Indicates whether the field is required.**Default**```js
false

```                                                                                                                                  |
| size                 |                    | The size of the field.**Example**```js
"m" | "s"

```                                                                                                                                                |
| style                | object<!-- -->     | The inline styles for the component.**Example**```js
{
  "color": "red",
  "fontSize": "14px"
}

```                                                                                                    |
