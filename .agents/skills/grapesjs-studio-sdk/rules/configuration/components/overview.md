---
name: "Components"
description: "Understand component type registration, parsing rules, and custom component architecture."
source_url: "https://app.grapesjs.com/docs-sdk/configuration/components/overview"
metadata:
  tags: grapesjs, studio-sdk, configuration, components, overview
---


# Components

Components are the building blocks of a Studio SDK project. A component can be a simple element like an image or text box, or a more complex structure composed of multiple nested components, such as sections or even entire pages.

## Table of Contents

* [When do you need Components?](#when-do-you-need-components)
* [How do Components work?](#how-do-components-work)
* [Component Properties](#component-properties)
* [Component Methods](#component-methods)

## When do you need Components?

The Components allows developers to define custom behaviors, interactions, and constraints such as specifying what can be edited, how the component is rendered, and where it can be placed on the page.

With the Components API, you can:

* **Control editing behavior**: Define which parts of a component are editable and how users interact with it (e.g., enabling inline text editing or restricting modifications).
* **Customize rendering**: Modify how the component is structured in the DOM and how it exports to the final HTML.
* **Define placement rules**: Set constraints on where components can be dropped or nested within other components.
* **Bind dynamic actions**: Attach custom logic to user interactions, such as triggering the Asset Manager when an image is double-clicked.

By leveraging these features, developers can create highly interactive and reusable components tailored to their needs.

## How do Components work?

Let's start exploring how components work by adding some basic components to a new project.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      // Define a default project that acts as a fallback when no Storage is configured.
      default: {
        pages: [{ name: 'Home', component: '<h1>Home page</h1>' }]
      }
    },
    plugins: [
      // Use a plugin as a playground for our examples
      editor => {
        // Wait for the project to load before interacting with its components
        editor.onReady(() => {
          // The first page is selected by default
          const homePage = editor.Pages.getSelected();
          // The main component (usually the <body>) is created with the page
          const rootComponent = homePage.getMainComponent();

          // Append a new component as an HTML string
          const newComponent = rootComponent.append(`<div>
            <img src="https://picsum.photos/seed/my-image/150/150"/>
            <p>Content text here</p>
          </div>`)[0];
        });
      }

    ],
  }}
/>

```

### Component Definition

The Component Definition is an object that details the configuration of a Component.

A complete Component Definition may contain additional information, but it can be as simple as you want:

```json
{
  "tagName": "div",
  "components": [ // Nested components
    {
      "type": "image", // Detected as an image type
      "attributes": { "src": "https://picsum.photos/seed/my-image/150/150" }
    },
    {
      "type": "text", // Detected as an editable text
      "tagName": "p",
      "components": [ // Nested components
        { "type": "textnode", "content": "Content text here" }
      ]
    }
  ]
}

```

The editor automatically recognizes predefined Components like `image` or `text`, and applies the appropriate behavior in the canvas. This allows you to double-click on the image to open the [Asset Manager](../assets/overview.md) or edit a text directly in the canvas.

In the first example of this page we import elements from an HTML string, which then gets parsed and transformed into a Component Definition automatically.

You can append components by passing in a component definition object instead of using HTML:

```js
const newComponent = rootComponent.append({
  tagName: 'div',
  components: [
    {
      type: 'image',
      attributes: { src: 'https://picsum.photos/seed/my-image/150/150' }
    },
    {
      type: 'text',
      tagName: 'p',
      components: [{ type: 'textnode', content: 'Content text here' }]
    }
  ]
})[0];

```

In the next section, we'll define a **custom component** and learn how to make the editor recognize it after parsing the HTML string.

### Define a Custom Component

To define a custom component, use the `editor.Components.addType` method. This allows you to create a new component type or extend an existing one.

Using the `isComponent` property, you can specify how the editor should recognize the component when parsing an HTML element.

warning

Custom components should always be defined inside a plugin to ensure proper integration.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor => {
        // Register a new component type
        editor.Components.addType('card', {
          // Make the editor understand how to recognize the component from parsed HTML
          isComponent: el => el.classList?.contains('card'),
          // Provide the default properties of the component (more about it in the next section).
          model: {
            defaults: {
              attributes: { 'data-custom-attr': 'my-value' },
            }
          }
        });

        editor.onReady(() => {
          // ...

          // Add the 'card' class to make our div component recognizable by the custom type
          const component = rootComponent.append(`<div class="card">
            <img src="https://picsum.photos/seed/my-image/150/150"/>
            <p>Content text here</p>
          </div>`)[0];

          alert('New component added: ' + component.get('type'));

        });
      }

    ],
  }}
/>

```

### Add Components to Blocks

Your new Component can now be used in the editor canvas, but you still need to bind it to a block for it to show up in the Block Manager, an UI where your users can select component types to add into the canvas.

tip

You can open the block manager by clicking the purple plus icon in the top right corner of the editor.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
    editor => {
        // ...
        // Add new custom component type to block manager
        editor.Blocks.add('card', {
          label: 'Card',
          category: 'My Components',
          media: '<svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#e8eaed"><path d="M560-440h200v-80H560v80Zm0-120h200v-80H560v80ZM200-320h320v-22q0-45-44-71.5T360-440q-72 0-116 26.5T200-342v22Zm160-160q33 0 56.5-23.5T440-560q0-33-23.5-56.5T360-640q-33 0-56.5 23.5T280-560q0 33 23.5 56.5T360-480ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/></svg>',
          content: '<div class="card"><img src="https://picsum.photos/seed/my-image/150/150"/><p>Content text here</p></div>'
        });
        // ...
      }

    ],
  }}
/>

```

## Component Properties

Every custom component can have its own properties, along with a set of built-in properties that can be customized or extended.

To explore all available properties and learn how to use them to customize component behavior in the editor, refer to the [Component Properties page](properties.md).

## Component Methods

Every component created inside the editor has a component instance that provide a set of built-in methods that you can use to manipulate components, retrieve their properties, or listen to events.

To explore the available methods, how to extend and use them to customize component behavior in the editor, refer to the [Component Methods page](methods.md).
