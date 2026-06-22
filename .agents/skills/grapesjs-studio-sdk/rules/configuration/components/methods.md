---
name: "Component Methods"
description: "Use component model/view APIs to inspect, mutate, and extend components programmatically."
source_url: "https://app.grapesjs.com/docs-sdk/configuration/components/methods"
metadata:
  tags: grapesjs, studio-sdk, configuration, components, methods
---


# Component Methods

When you add a component to the document, you create a **Component Model** instance. The model stores the component's properties, which are [saved in the project JSON](../projects.md#storage) and used to generate the final [export code](../projects.md#export).

Alongside the model, a **Component View** instance controls how the component appears in the canvas. By default, it renders based on the model's structure (eg. tagName, attributes, nested components), but you can customize its behavior as needed.

This page covers the methods available in both instances, helping you manipulate and extend components effectively.

## Table of Contents

* [Component Model](#component-model)
* [Component View](#component-view)

## Component Model

The Component Model instance stores the component's properties and persists them in the project. It provides methods to access and update properties, manage child components, and define how the component is exported.

It's also possible to extend the model, which allows you to provide custom logic and behavior.

### Creating Model

You can create new Component Models via [Component Definitions](overview.md#component-definition) or HTML strings.

```js
const rootComponentModel = editor.getWrapper();
const addedComponentModels = rootComponentModel.append(`
  <div>Div content</div>
  <span>Span content</span>
`);
//
const divComponentModel = addedComponentModels[0];
const spanComponentModel = addedComponentModels[1];

```

Since we didn't define custom component types, these models use default configurations.

### Accessing and Updating Model

The Component Model provides [various methods](https://grapesjs.com/docs/api/component.html) that allows you to access and update the [component's properties](properties.md) and their children programmatically.

```js
// Access the properties
const allProperties = componentModel.props();
const cmpRemovable = componentModel.get('removable');

// Update the properties
componentModel.set({ removable: false });

// Get component attributes (exported as HTML attributes)
const attrs = componentModel.getAttributes();

if (!attrs.title) {
  componentModel.addAttributes({ title: 'New title' });
}

// Access child components
const children = componentModel.components();
children.forEach((childModel) => console.log(childModel.get('tagName')));

// Replace children (HTML or Component Definition)
const newComponents = componentModel.components(`<div>Content 1</div><div>Content 2</div>`);

// Remove component
componentModel.remove();

// Find inner components by type
const firstComponentFromFind = componentModel.findType('image')[0];

// Get parent component
const parentComponent = componentModel.parent();

// Closest parent component by type
const closestComponent = componentModel.closestType('some-parent-type');

// Get export code
const componentHTML = componentModel.toHTML();

// Get component definition as JSON
const componentJSON = JSON.parse(JSON.stringify(componentModel));

```

### Extending Models

To extend the Component Model, you have to define custom component types using the `editor.Components.addType` method. This allows you to create new component types, update or extend existing ones.

In the demo below, we'll define two components:

* `component-a`: Implements a custom export method (`toHTML`) to change its generated output.
* `component-b`: Extends `component-a`, adding further customizations to the export method.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor => {
        // Create new component type
        editor.Components.addType('component-a', {
          isComponent: el => el.classList?.contains('cmp-a'),
          model: {
            defaults: {
              attributes: { title: 'Title Component' }
            },

            init() {
              console.log('Component A init');
            },

            // Update the export code
            toHTML() {
              return `<custom-component-a>
                <div>Model tagName: ${this.get('tagName')}</div>
                <div>Model attributes: ${JSON.stringify(this.getAttributes())}</div>
                ${this.getInnerHTML()}
              </custom-component-a>`;
            }
          },
        });

        // Update component type
        editor.Components.addType('component-a', {
          model: {
            defaults: {
              attributes: { title: 'Title Component A' }
            }
          }
        });

        // Extend component type
        const ComponentA = editor.Components.getType('component-a').model;

        editor.Components.addType('component-b', {
          isComponent: el => el.classList?.contains('cmp-b'),
          // Indicate the type to extend
          extend: 'component-a',
          // Array of model methods to extend from 'component-a'
          extendFn: ['init'],
          model: {
            defaults: {
              attributes: { title: 'Title Component B' }
            },

            init() {
              // With defined 'extendFn', also the init method from 'component-a' will be called
              console.log('Component B init');
            },

            toHTML() {
              const resultCmpA = ComponentA.prototype.toHTML.apply(this);
              return `<custom-component-b>${resultCmpA}</custom-component-b>`;
            }
          },
        });
      }
    ],
    project: {
      default: {
        pages: [{
          name: 'Home',
          component: `
            <section class="cmp-a">
              <div>Content Component A</div>
            </section>
            <hr/>
            <div class="cmp-b">
              <div>Content Component B</div>
            </div>
          `
        }]
      }
    },
    // Custom editor layout for demo purpose
    layout: {/**/}
  }}
/>

```

In the next example, we'll define a few component types and demonstrate how they interact using custom methods.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor => {
        // Create a component type for sections
        editor.Components.addType('section-component', {
          isComponent: el => el.tagName === 'SECTION',
          model: {
            defaults: {
              style: { padding: '30px', display: 'flex', gap: '25px', 'background-color': 'lightgray' },
              traits: [{
                type: 'button',
                label: 'Add new card',
                command: (editor, trait) => trait.component.addNewCard(),
              }]
            },

            addNewCard() {
              this.append({
                type: 'card-component',
                cardTitle: 'New card'
              });
            },
          },
        });

        // Create a component type for cards
        editor.Components.addType('card-component', {
          isComponent: el => el.classList?.contains('card'),
          model: {
            defaults: {
              style: { padding: '10px', 'border-radius': '10px', 'background-color': 'white', width: '25%' },
              cardTitle: 'Card title',
              components: (model) => `
                <h2>${model.get('cardTitle')}</h2>
                <img style="width: 100%; height: 100px; object-fit: cover;" src="https://picsum.photos/seed/card-image/100/100"/>
                <p>Card content</p>
              `,
              traits: [{
                type: 'text',
                name: 'cardTitle',
                changeProp: true, // Update properties, not attributes
              }]
            },

            init() {
              this.on('change:cardTitle', this.handleCardTitleChange);
            },

            handleCardTitleChange() {
              // Update the content of the <h2> tag
              const h2CmpModel = this.components().find(c => c.get('tagName') === 'h2');
              h2CmpModel.components('Updated: ' + this.get('cardTitle'));
            }
          },
        });

        editor.onReady(() => {
          const cmpSection = editor.getWrapper().findType('section-component')[0];
          editor.select(cmpSection);
        });
      }
    ],
    project: {
      default: {
        pages: [{
          name: 'Home',
          component: '<section><div class="card"></div></section>'
        }]
      }
    },
    // Custom editor layout for demo purpose
    layout: {/**/}
  }}
/>

```

### Lifecycle Methods and Events

The model offers methods and events to track changes and execute custom logic throughout the component's lifecycle.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor => {
        editor.Components.addType('my-custom-component', {
          model: {
            defaults: {
              customProp: 'Initial value',
              attributes: { title: 'HTML title' },
              components: 'Some content',
              traits: [
                { name: 'customProp', changeProp: true },
                { name: 'title' },
              ]
            },

            init() {
              console.log('Component model created');
              // Listen to property changes
              this.on('change:customProp', this.handlePropChange);
              // Listen to attribute changes
              this.on('change:attributes', this.handleAttrChange);
              // Listen to the title attribute change
              this.on('change:attributes:title', this.handleTitleChange);
            },

            removed() {
              console.log('Component removed');
            },

            handlePropChange() {
              console.log('New customProp value:', this.get('customProp'));
            },

            handleAttrChange() {
              console.log('Attributes updated:', this.getAttributes());
            },

            handleTitleChange() {
              console.log('Attribute title updated:', this.getAttributes().title);
            },
          },
        });
      }
    ],
    project: {
      default: {
        pages: [{
          name: 'Home',
          component: '<div data-gjs-type="my-custom-component"></div>'
        }]
      }
    },
    // Custom editor layout for demo purpose
    layout: {/**/}
  }}
/>

```

## Component View

The **Component View** controls how a component appears and behaves in the editor canvas. By default, it reflects the **Component Model** properties (`tagName`, `attributes`, nested `components`, etc.), but you can extend it to improve editing, handle special DOM behaviors, or add custom interactions.

For example, the `text` component includes a Rich Text Editor for inline editing, while the `image` component opens the asset manager on double-click. Custom views let you add UI elements, event listeners, or dynamic content—all without affecting the final exported code.

### Customizing View

A Component View instance is created alongside the Component Model when the component is rendered in the editor canvas.

In the demo below, you'll find an example of a fully customized view leveraging built-in and custom methods, along with DOM event listeners and model change listeners.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor => {
        editor.Components.addType('custom-view', {
          model: {
            defaults: {
              tagName: 'section',
              droppable: false,
              attributes: { title: 'Section title' },
              components: '<div>Content from model</div>',
              traits: [{
                name: 'title',
                label: 'Update title'
              }]
            }
          },
          view: {
            // Use custom tagName, which overrides the one provided by the model
            tagName: 'div',

            // Add DOM event listeners
            events: () => ({
              dblclick: 'onActive',
              // Add event listeners to inner elements
              'click img': 'changeWithRandomImage'
            }),

            // Called once the Component View instance is created
            init() {
              // Listen to model events
              this.listenTo(this.model, 'change:attributes:title', this.updateImageWithTitle);
            },

            // Called on component attributes update (eg. new attribute added from the model)
            onAttrUpdate() {
              this.el.style.cssText = 'border: 5px solid #8b5cf6;';
            },

            // Called when the element is rendered.
            onRender() {
              const { el } = this;
              const imageStyle = 'display: block; margin: 0 auto; width: 150px; height: 150px; cursor: help;';
              el.innerHTML = `
                <ul>
                  <li>Double-click anywhere on the element to open the Asset Manager</li>
                  <li>Click on the image to change it with a random one</li>
                  <li>Update the image by changing the component title</li>
                </ul>
                <img style="${imageStyle}" src="${this.getImageWithTitle()}" />
              `;
            },

            // Called when the element is removed from the canvas.
            // Useful to cleanup global event listeners or other resources.
            removed() {
              console.log('Element removed');
            },

            onActive() {
              editor.Assets.open({
                select: asset => {
                  const imageEl = this.el.querySelector('img');
                  imageEl?.setAttribute('src', asset.getSrc());
                }
              });
            },

            changeWithRandomImage() {
              const imageEl = this.el.querySelector('img');
              const randomImage = `https://picsum.photos/seed/random-${Math.random()}/150`;
              imageEl?.setAttribute('src', randomImage);
            },

            updateImageWithTitle() {
              const imageEl = this.el.querySelector('img');
              imageEl?.setAttribute('src', this.getImageWithTitle());
            },

            getImageWithTitle() {
              const modelAttrs = this.model.getAttributes();
              return `https://placehold.co/150/777/white.png?text=${modelAttrs.title}`;
            }
          }
        });
      }
    ],
    project: {
      default: {
        assets: Array(100).fill(0).map((_, i) => `https://picsum.photos/seed/${i}/200/200`),
        pages: [{
          name: 'Home',
          component: '<div data-gjs-type="custom-view"></div>'
        }]
      }
    },
    // Custom editor layout for demo purpose
    layout: {/**/}
  }}
/>

```

The key aspect of the Component View is that it controls how the component behaves inside the editor canvas but doesn't affect the final exported code. You can add UI elements, event listeners, or dynamic content without modifying the HTML output.

### Extending Views

Just like the Component Model, you can extend the Component View of existing components to customize or extend their behavior.

In the demo below, we define and extend multiple components to demonstrate how to customize the rendering loigc:

* `component-a`: Defines a base component with a default structure, styling logic, and custom rendering behavior.
* `component-b`: Extends `component-a`, overriding its styling and custom content method.
* `component-c`: Extends the model of `component-a` and the view of `component-b`, inheriting and modifying its rendering behavior.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor => {
        editor.Components.addType('component-a', {
          model: {
            defaults: {
              droppable: false,
              components: '<div>Content from model</div>',
            }
          },
          view: {
            getColor: () => '#8b5cf6',

            getCustomContent: () => 'Default custom content',

            onAttrUpdate() {
              this.el.style.cssText = `border: 5px solid ${this.getColor()}`;
            },

            onRender() {
              if (!this.el.querySelector('.cmp-a'))  {
                this.el.insertAdjacentHTML('afterbegin', `
                  <div class="cmp-a" style="background-color: ${this.getColor()}; margin: 10px; padding: 10px; color: white;">
                    ${this.getCustomContent()}
                  </div>
                `);
              }
            },
          }
        });

        // Update component view
        editor.Components.addType('component-a', {
          view: {
            getCustomContent: () => 'Custom content A',
          }
        });

        // Extend component view (without extending the model)
        editor.Components.addType('component-b', {
          // Indicate the view type to extend
          extendView: 'component-a',
          view: {
            getColor: () => '#ef5cf6',
            getCustomContent: () => 'Custom content B',
          }
        });

        // Extend component view
        const ComponentViewB = editor.Components.getType('component-b').view;

        editor.Components.addType('component-c', {
          extendView: 'component-b',
          // Array of view methods to extend from 'component-b'
          extendFnView: ['onRender'],
          // Extend the model of 'component-a'
          extend: 'component-a',
          view: {
            getColor: () => '#f6845c',

            getCustomContent() {
              const resultB = ComponentViewB.prototype.getCustomContent.apply(this);
              return resultB + ' + C';
            },

            onRender() {
              if (!this.el.querySelector('.cmp-c'))  {
                this.el.insertAdjacentHTML('afterbegin', `
                  <div class="cmp-c" style="background-color: ${this.getColor()}; margin: 10px; padding: 10px; color: white;">
                    Custom content C
                  </div>
                `);
              }
            },
          }
        });
      }
    ],
    project: {
      default: {
        assets: Array(100).fill(0).map((_, i) => `https://picsum.photos/seed/${i}/200/200`),
        pages: [{
          name: 'Home',
          component: `<div style="display: flex; padding: 10px; gap: 10px">
            <div data-gjs-type="component-a"></div>
            <div data-gjs-type="component-b"></div>
            <div data-gjs-type="component-c"></div>
          </div>`
        }]
      }
    },
    // Custom editor layout for demo purpose
    layout: {/**/}
  }}
/>

```

### Model and View Interaction

The Component View can interact with the Component Model, enabling you to update properties, attributes, or child components directly from the view. This is useful when you need to modify the model (and, consequently, the export code) based on user interactions in the canvas.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor => {
        editor.Components.addType('cmp-with-data', {
          model: {
            defaults: {
              components: `
                <h2 style="text-align: center">Random products</h2>
                <div style="display: flex; gap: 10px;" data-products="true"></div>
              `,
            },

            init() {
              this.fetchProducts();
            },

            getProductsContainer() {
              return this.components().find(child => child.getAttributes()['data-products']);
            },

            async fetchProducts() {
              const result = await fetch('https://dummyjson.com/products');
              const productsRes = await result.json();
              const shuffled = productsRes.products.sort(() => 0.5 - Math.random());
              const firstProducts = shuffled.slice(0, 4);
              const container = this.getProductsContainer();
              container.components(''); // cleanup container

              firstProducts.forEach(product => {
                container.append(`
                  <article style="width: 25%; display: flex; flex-direction: column; justify-content: space-between;">
                    <h1>${product.title}</h1>
                    <img style="width: 100%; height: 100px; object-fit: cover;" src="${product.thumbnail}"/>
                    <p>${product.description}</p>
                    <h3>Price: $${product.price}</h3>
                  </article>
                `);
              });
            }
          },
          view: {
            events: {
              'click .load-products': 'fetchNewProducts',
            },

            fetchNewProducts() {
              // Get the view element from an inner component
              const container = this.model.getProductsContainer();
              const containerEl = container.getView().el;
              containerEl.innerHTML = '<h2>Loading...</h2>';
              this.model.fetchProducts();
            },

            onRender() {
              if (!this.el.querySelector('.load-products'))  {
                this.el.insertAdjacentHTML('afterbegin', `
                  <button class="load-products" style="background-color: #8b5cf6; color: white; margin: 10px 0; padding: 10px; border: none; cursor: pointer">
                    Load New Products
                  </button>
                `);
              }
            },
          }
        });
      }
    ],
    project: {
      default: {
        pages: [{
          name: 'Home',
          component: `<div data-gjs-type="cmp-with-data"></div>`
        }]
      }
    },
  }}
/>

```

