---
name: "LightGallery"
description: "Add LightGallery-powered gallery and media browsing components."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/components/lightGallery"
metadata:
  tags: grapesjs, studio-sdk, plugins, components, lightGallery
---


# LightGallery

|               |              |
| ------------- | ------------ |
| Project types | `web`        |
| Plan          | Startup plan |

Gallery component based on [lightGallery](https://www.lightgalleryjs.com).

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { lightGalleryComponent } from "@grapesjs/studio-sdk-plugins";
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        lightGalleryComponent?.init({
          block: false // Skip default block
        }),
        // Add custom gallery blocks
        editor => {
          editor.Blocks.add('gallery-images', {
            label: 'Gallery Images',
            category: 'LightGallery examples',
            media: '<svg viewBox="0 0 24 24"><path d="M5,14L8.5,9.5L11,12.5L14.5,8L19,14M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z" /></svg>',
            content: {
              type: 'lightGallery',
              components: [
                {
                  type: 'lightGallery-item',
                  attributes: { href: 'https://placehold.co/1500/777/white.png?text=Image+1+(Open)' },
                  components: { type: 'image', src: 'https://placehold.co/100/777/white.png?text=Image+1' }
                },
                {
                  type: 'lightGallery-item',
                  attributes: { href: 'https://placehold.co/1500/777/white.png?text=Image+2+(Open)' },
                  components: { type: 'image', src: 'https://placehold.co/100/777/white.png?text=Image+2' }
                }
              ]
            }
          });
          editor.Blocks.add('gallery-videos', {
            label: 'Gallery Video',
            category: 'LightGallery examples',
            media: '<svg viewBox="0 0 24 24"><path d="M18,14L14,10.8V14H6V6H14V9.2L18,6M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z" /></svg>',
            content: {
              type: 'lightGallery',
              components: [
                {
                  type: 'lightGallery-item',
                  attributes: { 'data-src': 'https://www.youtube.com/watch?v=EIUJfXk3_3w', 'data-sub-html': 'Video Caption 1' },
                  components: { type: 'image', src: 'https://img.youtube.com/vi/EIUJfXk3_3w/maxresdefault.jpg', style: { width: '200px' } }
                },
                {
                  type: 'lightGallery-item',
                  attributes: { 'data-src': 'https://vimeo.com/112836958', 'data-sub-html': 'Video Caption 2' },
                  components: { type: 'image', src: 'https://i.vimeocdn.com/video/506427660-2e93a42675715090a52de8e6645d592c5f58c1a7e388231d801072c9b2d9843d-d?mw=300', style: { width: '200px' } }
                }
              ]
            }
          });
        },
      ],
      project: {
        default: {
          pages: [
            {
              name: 'Home',
              component: `
                <h1>Single images</h1>
                <div class="columns">
                  <div data-lightgallery>
                    <a href="https://placehold.co/1500/777/white.png?text=Image+1+(Open)">
                        <img alt="Image 1" src="https://placehold.co/100/777/white.png?text=Image+1" />
                    </a>
                  </div>
                  <div data-lightgallery>
                    <a href="https://placehold.co/1500/777/white.png?text=Image+2+(Open)">
                        <img src="https://placehold.co/100/777/white.png?text=Image+2" />
                    </a>
                  </div>
                </div>

                <h1>Multiple images</h1>
                <div data-lightgallery class="columns">
                  <a href="https://placehold.co/1500/777/white.png?text=Image+1+(Open)">
                      <img alt="Image 1" src="https://placehold.co/100/777/white.png?text=Image+1" />
                  </a>
                  <a href="https://placehold.co/1500/777/white.png?text=Image+2+(Open)">
                      <img alt="Image 2" src="https://placehold.co/100/777/white.png?text=Image+2" />
                  </a>
                  <a href="https://placehold.co/1500/777/white.png?text=Image+3+(Open)">
                      <img alt="Image 3" src="https://placehold.co/100/777/white.png?text=Image+3" />
                  </a>
                </div>

                <h1>Video gallery</h1>
                <div data-lightgallery class="columns">
                  <a data-src="https://www.youtube.com/watch?v=EIUJfXk3_3w" data-poster="https://img.youtube.com/vi/EIUJfXk3_3w/maxresdefault.jpg" data-sub-html="Puffin Hunts Fish To Feed Puffling">
                      <h2>YouTube video</h2>
                      <img width="200" src="https://img.youtube.com/vi/EIUJfXk3_3w/maxresdefault.jpg"/>
                  </a>
                  <a data-src="https://vimeo.com/112836958" data-poster="https://i.vimeocdn.com/video/506427660-2e93a42675715090a52de8e6645d592c5f58c1a7e388231d801072c9b2d9843d-d?mw=2880&q=70" data-sub-html="Nature">
                      <h2>Vimeo video</h2>
                      <img width="200" src="https://i.vimeocdn.com/video/506427660-2e93a42675715090a52de8e6645d592c5f58c1a7e388231d801072c9b2d9843d-d?mw=300"/>
                  </a>
                  <a data-src="https://private-sharing.wistia.com/medias/mwhrulrucj" data-poster="https://embed-ssl.wistia.com/deliveries/dfcb95bfd3e8cb39022e8d195e24931c2117ef05.webp?image_crop_resized=300x200" data-sub-html="Sample Wistia video">
                      <h2>Wistia video</h2>
                      <img width="200" src="https://embed-ssl.wistia.com/deliveries/dfcb95bfd3e8cb39022e8d195e24931c2117ef05.webp?image_crop_resized=224x126"/>
                  </a>
                </div>

                <h1>Iframe gallery</h1>
                <div data-lightgallery class="columns">
                  <a data-iframe="true" data-src="https://example.com/" data-sub-html="Website Caption">
                      <img src="https://placehold.co/100/777/white.png?text=Website" />
                  </a>
                  <a data-iframe="true" data-src="https://www.google.com/maps/embed" data-sub-html="Google Maps Caption">
                      <img src="https://placehold.co/100/777/white.png?text=Google+Maps" />
                  </a>
                  <a data-iframe="true" data-src="https://pdfobject.com/pdf/sample.pdf" data-sub-html="PDF Caption">
                      <img src="https://placehold.co/100/777/white.png?text=PDF" />
                  </a>
                </div>

                <h1>Inline Gallery</h1>
                <div data-lightgallery class="inline-gallery" data-gjs-inline="true" data-gjs-download="false">
                  <a href="https://placehold.co/1500/777/white.png?text=Image+1+(Open)">
                      <img alt="Image 1" src="https://placehold.co/100/777/white.png?text=Image+1" />
                  </a>
                  <a href="https://placehold.co/1500/777/white.png?text=Image+2+(Open)">
                      <img alt="Image 2" src="https://placehold.co/100/777/white.png?text=Image+2" />
                  </a>
                  <a href="https://placehold.co/1500/777/white.png?text=Image+3+(Open)">
                      <img alt="Image 3" src="https://placehold.co/100/777/white.png?text=Image+3" />
                  </a>
                </div>

                <h1>Custom item selector</h1>
                <div data-lightgallery class="columns" data-gjs-selector="[data-lightgallery-item]">
                  <div class="custom-wrapper">
                    <a data-lightgallery-item href="https://placehold.co/1500/777/white.png?text=Image+1+(Open)">
                        <img alt="Image 1" src="https://placehold.co/100/777/white.png?text=Image+1" />
                    </a>
                  </div>
                  <div class="custom-wrapper">
                    <a data-lightgallery-item href="https://placehold.co/1500/777/white.png?text=Image+2+(Open)">
                        <img alt="Image 2" src="https://placehold.co/100/777/white.png?text=Image+2" />
                    </a>
                  </div>
                </div>

                <style>
                  body {
                    font-family: system-ui;
                    text-align: center;
                  }
                  .columns {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                  }
                  .inline-gallery {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    height: 500px;
                  }
                  .custom-wrapper {
                    border: 2px solid;
                    padding: 10px;
                    border-radius: 10px;
                  }
                  [data-lightgallery] {
                    border: 2px solid #333;
                    position: relative;
                    padding: 10px;
                  }
                  [data-lightgallery]:after {
                    content: "lightGallery Example";
                    position: absolute;
                    top: 0;
                    background-color: #333;
                    color: white;
                    left: -2px;
                    font-size: 0.5rem;
                    padding: 3px;
                    transform: translateY(-100%);
                  }
                </style>
              `
            },
          ]
        }
      }

  }}
/>

```

### Plugin options

| Property        | Type           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| licenseKey      | string | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```                                                                                                                                                                                                                                                                                                                                                                    |
| block           |                | Block options for the component. See https\://grapesjs.com/docs/api/block.html#properties for more information.**Example**```js
{
  "category": "Extra",
  "label": "My label"
}

```                                                                                                                                                                                                                                                                                                                                      |
| lgLicenseKey    | string | This plugin includes a commercial license when used within the Studio SDK. If you're using it outside the SDK (core GrapesJS) in a commercial project, you must obtain a valid license separately. Learn more about the lightGallery license key here: https\://www\.lightgalleryjs.com/license/                                                                                                                                                                                                                     |
| toolbarIconOpen | string | SVG toolbar button icon for opening the gallery. You can pass an empty string to avoid adding the toolbar button.**Example**```js
"<svg viewBox=\"0 0 24 24\"><path d=\"M12 9a3 3 0..."

```                                                                                                                                                                                                                                                                                                                            |
| defaultSrc      | string<!-- --> | Default source for the inner image component.**Default**```js
https://placehold.co/200/777/white.png?text=Image

```                                                                                                                                                                                                                                                                                                                                                                                                    |
| cdnScript       |                | CDN scripts to load dynamically in case the library is not available.**Default**```js
[
  "https://cdn.jsdelivr.net/npm/lightgallery@2.8.2/lightgallery.min.js",
  "https://cdn.jsdelivr.net/npm/lightgallery@2.8.2/plugins/thumbnail/lg-thumbnail.min.js",
  "https://cdn.jsdelivr.net/npm/lightgallery@2.8.2/plugins/video/lg-video.min.js",
  "https://cdn.jsdelivr.net/npm/lightgallery@2.8.2/plugins/autoplay/lg-autoplay.min.js",
  "https://cdn.jsdelivr.net/npm/lightgallery@2.8.2/plugins/zoom/lg-zoom.min.j"
]

``` |
| cdnStyle        |                | CDN styles to load dynamically.**Default**```js
https://cdn.jsdelivr.net/npm/lightgallery@2.8.2/css/lightgallery-bundle.min.css

```                                                                                                                                                                                                                                                                                                                                                                                    |
| plugins         | array  | Plugins to include. You have to ensure to load the required plugins in the `cdnScript` option. Check the list of available plugins here: https\://www\.lightgalleryjs.com/docs/getting-started/#plugins**Default**```js
[
  "lgThumbnail",
  "lgVideo",
  "lgAutoplay",
  "lgZoom"
]

```                                                                                                                                                                                                                                    |
